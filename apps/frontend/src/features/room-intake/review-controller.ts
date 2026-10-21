import { POLICY } from '@roomedy/contracts/policy';
import type { VisitorAction } from '@roomedy/contracts/commands';
import type {
  CheckFacts,
  RoomDocument,
  Feature,
} from '@roomedy/contracts/room';
import { checkRoom, jsonBytes, validateRoom } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { ResourceRegistry } from '../session/effects';
import { PhotoStore } from './photo-store';
import type { PhotoItem, PhotoPurpose } from './photo-store';
import {
  addDraftPiece,
  adoptHypothesis,
  changeDraftCategory,
  correctDraft,
  createDraft,
  draftFeature,
  finishDraft,
  reconcileRoomEvidence,
  mergeDraftPieces,
  removeDraftPiece,
  splitDraftPiece,
} from './draft';
import type { ReviewDraft, ReviewResult } from './draft';
import { photoBackWalls, planPhotoPlacement } from './photo-layout';

export interface ReviewToken {
  reviewId: string;
  generation: number;
  operationId: string;
  inputRevision: number;
}
export interface ReviewSnapshot {
  readonly draft: ReviewDraft;
  readonly checks: CheckFacts;
  readonly photos: readonly PhotoItem[];
  readonly stage: 'photos' | 'review';
  readonly selectedId: string;
  readonly message: string;
  readonly undo: boolean;
  readonly recognition: 'idle' | 'preparing' | 'drafting' | 'opening';
  readonly simulated: boolean;
}
/** Provisional evidence review only. SessionController alone accepts the canonical room/baseline. */
export class ReviewController {
  readonly photos: PhotoStore;
  private state: ReviewSnapshot;
  private live = true;
  private readonly generation: number;
  private readonly reviewId: string;
  private listeners = new Set<() => void>();
  private history: ReviewDraft[] = [];
  private pending: ReviewToken | null = null;
  private resources = new ResourceRegistry(16);
  private release: (() => void) | null = null;
  private sourceSignature = '';
  constructor(
    readonly session: SessionController,
    condition: RoomDocument['intent']['condition'],
    private id: () => string = () => crypto.randomUUID(),
    photoDependencies?: ConstructorParameters<typeof PhotoStore>[2],
  ) {
    if (!session.beginIntake()) throw new Error('intake-unavailable');
    this.generation = session.getSnapshot().generation;
    this.reviewId = id();
    const draft = createDraft(condition, id());
    this.state = Object.freeze({
      draft,
      checks: checkRoom(draft.room),
      photos: [],
      stage: 'photos',
      selectedId: draft.room.roomId,
      message: '',
      undo: false,
      recognition: 'idle',
      simulated: false,
    });
    this.photos = new PhotoStore(
      () => this.active(),
      (photos) => this.photoChange(photos),
      photoDependencies,
    );
    this.release = session.ownResource(() => this.dispose());
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private active = () =>
    this.live && this.session.isIntakeCurrent(this.generation);
  private publish(change: Partial<ReviewSnapshot>) {
    if (!this.live) return;
    this.state = Object.freeze({ ...this.state, ...change });
    for (const listener of this.listeners) listener();
  }
  private invalidate() {
    this.pending = null;
    this.state = Object.freeze({ ...this.state, recognition: 'idle' });
    this.resources.clear();
  }
  private photoChange(photos: readonly PhotoItem[]) {
    if (!this.active()) return;
    const signature = JSON.stringify(
      photos.map((p) => [p.id, p.purpose, p.status]),
    );
    let draft = this.state.draft;
    let roomChanged = false;
    if (signature !== this.sourceSignature) {
      this.invalidate();
      this.sourceSignature = signature;
      draft = structuredClone(draft);
      for (const source of draft.sources)
        source.available = photos.some(
          (p) => p.id === source.id && p.status === 'ready',
        );
      for (const p of photos) {
        const source = draft.sources.find((s) => s.id === p.id);
        if (source) {
          source.available = p.status === 'ready';
          source.purpose = p.purpose;
        } else
          draft.sources.push({
            id: p.id,
            purpose: p.purpose,
            available: p.status === 'ready',
          });
      }
      roomChanged = reconcileRoomEvidence(draft);
      draft.revision++;
      draft.room.roomRevision = draft.revision;
    }
    this.publish({
      photos,
      draft,
      message: '',
      checks: roomChanged
        ? checkRoom(draft.room)
        : { ...this.state.checks, roomRevision: draft.revision },
    });
  }
  addPhotos(files: readonly Blob[], purpose: PhotoPurpose) {
    if (!this.active()) return;
    if (this.state.draft.sources.length + files.length > POLICY.reviewSources) {
      this.notify(
        'This review has reached its photo-evidence limit. Keep the current evidence or start a new room.',
      );
      return;
    }
    const message = this.photos.add(files, purpose);
    if (message) this.notify(message);
  }
  notify(message: string) {
    if (this.active()) this.publish({ message: message.slice(0, 240) });
  }
  private commit(result: ReviewResult, label: string): boolean {
    if (!this.active()) return false;
    if (!result.ok) {
      this.notify(result.message);
      return false;
    }
    if (result.draft === this.state.draft) return true;
    this.invalidate();
    this.history.push(this.state.draft);
    while (
      this.history.length > POLICY.undoEntries ||
      jsonBytes(this.history) > POLICY.undoBytes
    )
      this.history.shift();
    const ids = [
      result.draft.room.roomId,
      ...result.draft.room.furniture.map((p) => p.id),
      ...result.draft.room.room.features.map((f) => f.id),
    ];
    this.publish({
      draft: result.draft,
      checks: checkRoom(result.draft.room),
      selectedId: ids.includes(this.state.selectedId)
        ? this.state.selectedId
        : result.draft.room.roomId,
      message: label,
      undo: this.history.length > 0,
    });
    return true;
  }
  startReview() {
    if (this.active()) {
      this.invalidate();
      this.publish({ stage: 'review', message: '' });
    }
  }
  showPhotos() {
    if (this.active()) {
      this.invalidate();
      this.publish({ stage: 'photos', message: '' });
    }
  }
  select(id: string) {
    if (
      this.active() &&
      [
        this.state.draft.room.roomId,
        ...this.state.draft.room.furniture.map((p) => p.id),
        ...this.state.draft.room.room.features.map((f) => f.id),
      ].includes(id)
    )
      this.publish({ selectedId: id, message: '' });
  }
  shape(shape: ReviewDraft['shape']) {
    const next = structuredClone(this.state.draft);
    next.shape = shape;
    next.frameReviewed = shape === 'rectangle';
    if (!next.reviewed.includes(`${next.room.roomId}:shape`))
      next.reviewed.push(`${next.room.roomId}:shape`);
    this.commit(finishDraft(this.state.draft, next), 'Room shape reviewed.');
  }
  command(actions: VisitorAction[], label = 'Review corrected.') {
    if (!this.active()) return 'This room session has ended.';
    const result = correctDraft(this.state.draft, actions);
    const ok = this.commit(result, label);
    return ok
      ? null
      : result.ok
        ? 'This review is no longer active.'
        : result.message;
  }
  addPiece(catalogueId: string, owned = true) {
    const id = this.id();
    if (
      this.commit(
        addDraftPiece(this.state.draft, catalogueId, id, owned),
        owned
          ? 'Existing piece added. Its measurements still need review.'
          : 'Essential added with estimated catalogue dimensions.',
      )
    )
      this.select(id);
  }
  addFeature(kind: Feature['kind']) {
    const id = this.id();
    if (
      !this.command(
        [{ type: 'add-feature', feature: draftFeature(kind, id) }],
        'Feature added with unknown wall and measurements.',
      )
    )
      this.select(id);
  }
  category(id: string, catalogueId: string) {
    this.commit(
      changeDraftCategory(this.state.draft, id, catalogueId),
      'Representation corrected; measurements are preserved.',
    );
  }
  merge(keepId: string, otherId: string) {
    this.commit(
      mergeDraftPieces(this.state.draft, keepId, otherId),
      'Observations merged into the selected piece.',
    );
  }
  split(id: string, observation: string) {
    this.commit(
      splitDraftPiece(this.state.draft, id, observation, this.id()),
      'Separate piece added. Review its own measurements.',
    );
  }
  remove(id: string) {
    this.commit(
      removeDraftPiece(this.state.draft, id),
      'Piece removed from this sketch.',
    );
  }
  linkObservation(entityId: string, ref: string) {
    const next = structuredClone(this.state.draft),
      link = next.links.find((l) => l.entityId === entityId);
    if (!link || !next.observations.some((o) => o.ref === ref)) return;
    link.observations = [...new Set([...link.observations, ref])];
    this.commit(
      finishDraft(this.state.draft, next),
      'Observation linked; reviewed values are unchanged.',
    );
  }
  excludeObservation(ref: string) {
    const next = structuredClone(this.state.draft);
    const excluded = next.observations.find((o) => o.ref === ref);
    if (excluded) next.excludedObservations.push(excluded);
    next.observations = next.observations.filter((o) => o.ref !== ref);
    if (!next.reviewed.includes(`observation:${ref}:excluded`))
      next.reviewed.push(`observation:${ref}:excluded`);
    for (const link of next.links)
      link.observations = link.observations.filter((r) => r !== ref);
    this.commit(
      finishDraft(this.state.draft, next),
      'Observation excluded; reviewed room values are preserved.',
    );
  }
  attachPhoto(entityId: string, photoId: string) {
    const next = structuredClone(this.state.draft),
      link = next.links.find((l) => l.entityId === entityId),
      source = next.sources.find((s) => s.id === photoId && s.available),
      piece = next.room.furniture.find((p) => p.id === entityId),
      feature = next.room.room.features.find((f) => f.id === entityId);
    if (!link || !source || (!piece && !feature)) {
      this.notify('Choose an available photo and piece or feature.');
      return;
    }
    if (
      link.observations.some(
        (ref) =>
          next.observations.find((o) => o.ref === ref)?.sourceId === photoId,
      )
    ) {
      this.notify('This photo is already linked to the selected item.');
      return;
    }
    const ref = this.id();
    if (
      next.observations.filter((o) => o.sourceId === photoId).length >=
      POLICY.observationsPerPhoto
    ) {
      this.notify('This photo has reached its observation limit.');
      return;
    }
    next.observations.push({
      ref,
      sourceId: photoId,
      kind: piece ? 'furniture' : feature!.kind,
      catalogueId: piece?.catalogueId ?? null,
      label: piece?.label ?? feature!.kind,
      wall: feature?.wall ?? 'unknown',
      wallEvidence:
        feature && feature.wall !== 'unknown'
          ? { status: 'estimated', sourceId: photoId }
          : { status: 'unknown', sourceId: null },
      mechanism: 'unknown',
      mechanismEvidence: { status: 'unknown', sourceId: null },
      hinge: 'unknown',
      hingeEvidence: { status: 'unknown', sourceId: null },
      poseEvidence: { status: 'unknown', sourceId: null },
      visibility: 'visible',
      finish: null,
      width: unknownMeasurement(),
      depth: unknownMeasurement(),
      height: unknownMeasurement(),
      offset: unknownMeasurement(),
      sill: unknownMeasurement(),
      projection: unknownMeasurement(),
      sketch: { x: null, z: null, quarterTurns: null },
    });
    link.observations.push(ref);
    this.commit(
      finishDraft(this.state.draft, next),
      'Photo linked as evidence; no measurement was confirmed.',
    );
  }
  undo() {
    if (!this.active()) return;
    const previous = this.history.pop();
    if (!previous) return;
    this.invalidate();
    const draft = structuredClone(previous);
    draft.revision = this.state.draft.revision + 1;
    draft.room.roomRevision = draft.revision;
    // Photo purpose/availability belong to the current manifest, outside semantic Undo.
    draft.sources = this.state.draft.sources.map((source) => ({ ...source }));
    reconcileRoomEvidence(draft);
    this.publish({
      draft,
      checks: checkRoom(draft.room),
      undo: this.history.length > 0,
      message: 'Last review change undone.',
      selectedId: draft.room.roomId,
    });
  }
  beginDraftOperation(): ReviewToken | null {
    if (!this.active()) return null;
    this.invalidate();
    this.pending = {
      reviewId: this.reviewId,
      generation: this.generation,
      operationId: this.id(),
      inputRevision: this.state.draft.revision,
    };
    this.publish({ recognition: 'preparing', message: '' });
    return { ...this.pending };
  }
  isCurrent(token: ReviewToken) {
    return (
      this.active() &&
      !!this.pending &&
      this.pending.reviewId === token.reviewId &&
      this.pending.generation === token.generation &&
      this.pending.operationId === token.operationId &&
      this.pending.inputRevision === token.inputRevision &&
      this.state.draft.revision === token.inputRevision
    );
  }
  ownOperation(token: ReviewToken, cleanup: () => void) {
    if (!this.isCurrent(token)) {
      const rejected = new ResourceRegistry(1);
      rejected.own(cleanup);
      rejected.clear();
      return null;
    }
    return this.resources.own(cleanup);
  }
  draftProgress(
    token: ReviewToken,
    recognition: 'preparing' | 'drafting' | 'opening',
  ) {
    if (this.isCurrent(token)) this.publish({ recognition });
  }
  endDraftOperation(token: ReviewToken, message: string) {
    if (!this.isCurrent(token)) return;
    this.invalidate();
    this.publish({ message });
  }
  cancelDraft() {
    if (!this.active()) return;
    this.invalidate();
    this.publish({ message: '' });
  }
  applyHypothesis(token: ReviewToken, raw: unknown, simulated = false) {
    if (!this.isCurrent(token)) return false;
    const result = adoptHypothesis(this.state.draft, raw, this.id);
    this.invalidate();
    const ok = this.commit(result, '');
    if (ok) this.publish({ stage: 'review', simulated });
    return ok;
  }
  openStudioFromPhotos(token: ReviewToken, raw: unknown, simulated = false) {
    if (!this.isCurrent(token)) return false;
    const result = adoptHypothesis(this.state.draft, raw, this.id);
    if (!result.ok) {
      this.endDraftOperation(
        token,
        'These photo details could not be used. Try again or choose different photos.',
      );
      return false;
    }
    const draft = result.draft;
    const assigned = new Set(draft.links.flatMap((link) => link.observations));
    const notes = {
      outline: draft.shape,
      simulated,
      unplaced: draft.observations
        .filter((item) => !assigned.has(item.ref))
        .map((item) => item.label),
    };
    const placement = planPhotoPlacement(
      draft.room,
      draft.links.map((link) => link.entityId),
      photoBackWalls(draft),
    );
    this.invalidate();
    if (!this.session.acceptRoom(placement.room, notes)) return false;
    this.photos.dispose();
    this.dispose();
    if (placement.unresolved.length)
      this.session.notify(
        'Some starting positions need review. Add measurements in properties before checking fit.',
      );
    else if (placement.adjusted.length)
      this.session.notify(
        'Adjusted starting positions to keep preview furniture separate. Sizes and placement still need checking.',
      );
    return true;
  }
  accept() {
    if (!this.active()) return false;
    const draft = this.state.draft,
      room = validateRoom(draft.room);
    if (!room || draft.shape !== 'rectangle' || !draft.frameReviewed) {
      this.notify(
        'Review that this is one rectangular room before continuing.',
      );
      return false;
    }
    this.invalidate();
    const selected = this.state.selectedId;
    if (!this.session.acceptRoom(room)) return false;
    this.photos.dispose();
    this.session.select(selected === room.roomId ? null : selected);
    this.dispose();
    return true;
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    this.invalidate();
    this.photos.dispose();
    this.history = [];
    const draft = createDraft('empty', 'retired-review');
    this.state = Object.freeze({
      draft,
      checks: checkRoom(draft.room),
      photos: [],
      stage: 'photos',
      selectedId: draft.room.roomId,
      message: '',
      undo: false,
      recognition: 'idle',
      simulated: false,
    });
    this.listeners.clear();
    const release = this.release;
    this.release = null;
    release?.();
  }
}
const unknownMeasurement = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
