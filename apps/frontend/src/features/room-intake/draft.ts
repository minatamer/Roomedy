import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import type { RoomDocument, Furniture, Feature } from '@roomedy/contracts/room';
import type { Measurement } from '@roomedy/contracts/primitives';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import type { DraftObservation } from '@roomedy/contracts/intake';
import {
  checkRoom,
  evaluateBatch,
  findCatalogueEntry,
  validateRoom,
} from '@roomedy/spatial';
import type { PhotoPurpose } from './photo-store';
import { emptySurfaceAppearance } from '@roomedy/contracts/surfaces';

export const unknown = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
export const estimate = (value: number): Measurement => ({
  value,
  status: 'estimated',
  sourceId: 'draft-estimate',
});
export interface ReviewSource {
  id: string;
  purpose: PhotoPurpose;
  available: boolean;
  detectedPurpose?: 'room' | 'furniture' | 'unknown';
}
export interface EvidenceLink {
  entityId: string;
  observations: string[];
  normalized: [number, number] | null;
}
export interface ReviewDraft {
  revision: number;
  room: RoomDocument;
  shape: 'rectangle' | 'unknown' | 'unsupported';
  frameReviewed: boolean;
  sources: ReviewSource[];
  observations: DraftObservation[];
  excludedObservations: DraftObservation[];
  links: EvidenceLink[];
  reviewed: string[];
}
export function createDraft(
  condition: RoomDocument['intent']['condition'],
  id: string,
): ReviewDraft {
  return {
    revision: 0,
    shape: 'unknown',
    frameReviewed: false,
    sources: [],
    observations: [],
    excludedObservations: [],
    links: [],
    reviewed: [],
    room: {
      schemaVersion: 1,
      roomId: id,
      roomRevision: 0,
      unit: 'mm',
      catalogueVersion: VERSIONS.catalogue,
      rulesVersion: VERSIONS.rules,
      room: {
        shape: 'rectangle',
        width: unknown(),
        depth: unknown(),
        height: unknown(),
        floorFinish: 'oak',
        wallFinish: 'ivory',
        features: [],
      },
      furniture: [],
      intent: { condition, goals: ['sleep', 'work'], style: 'warm-simple' },
    },
  };
}
export function displayPosition(
  draft: ReviewDraft,
  position: readonly [number, number],
) {
  return {
    centerX:
      Math.round(position[0] * (draft.room.room.width.value ?? 4200) * 2) / 2,
    centerZ:
      Math.round(position[1] * (draft.room.room.depth.value ?? 4800) * 2) / 2,
  };
}
function uniquePieceLabel(draft: ReviewDraft, label: string, except?: string) {
  const names = new Set(
    draft.room.furniture.filter((p) => p.id !== except).map((p) => p.label),
  );
  if (!names.has(label)) return label;
  for (let index = 2; index <= POLICY.furniture + 1; index++)
    if (!names.has(`${label} ${index}`)) return `${label} ${index}`;
  return label;
}
export function draftFurniture(
  draft: ReviewDraft,
  catalogueId: string,
  id: string,
  owned = true,
): Furniture | null {
  const entry = findCatalogueEntry(catalogueId, VERSIONS.catalogue);
  if (!entry) return null;
  const count = draft.room.furniture.length,
    normalized: [number, number] = [
      0.25 + (count % 3) * 0.25,
      0.25 + (Math.floor(count / 3) % 3) * 0.25,
    ];
  return {
    id,
    label: uniquePieceLabel(draft, entry.label),
    catalogueId,
    catalogueVersion: VERSIONS.catalogue,
    dimensions: owned
      ? { width: unknown(), depth: unknown(), height: unknown() }
      : {
          width: estimate(entry.size.width.default),
          depth: estimate(entry.size.depth.default),
          height: estimate(entry.size.height.default),
        },
    pose: {
      ...displayPosition(draft, normalized),
      quarterTurns: 0,
      provenance: owned
        ? { status: 'estimated', sourceId: 'draft-estimate' }
        : { status: 'planned', sourceId: 'visitor-plan' },
    },
    ownership: owned ? 'owned' : 'proposed',
    preference: owned ? 'keep' : 'flexible',
    locks: { position: false, rotation: false, dimensions: false },
    finish: entry.finishes[0]!,
  };
}
export function draftFeature(kind: Feature['kind'], id: string): Feature {
  const base = {
    id,
    wall: 'unknown' as const,
    wallProvenance: { status: 'unknown' as const, sourceId: null },
    offset: unknown(),
    width: unknown(),
    height: unknown(),
    sill: kind === 'door' ? estimate(0) : unknown(),
  };
  return kind === 'obstacle'
    ? { ...base, kind, projection: unknown() }
    : kind === 'window'
      ? {
          ...base,
          kind,
          mechanism: 'unknown',
          mechanismProvenance: { status: 'unknown', sourceId: null },
        }
      : {
          ...base,
          kind,
          mechanism: 'unknown',
          mechanismProvenance: { status: 'unknown', sourceId: null },
          hinge: 'unknown',
          hingeProvenance: { status: 'unknown', sourceId: null },
        };
}
export type ReviewResult =
  { ok: true; draft: ReviewDraft } | { ok: false; message: string };
export function finishDraft(
  before: ReviewDraft,
  next: ReviewDraft,
): ReviewResult {
  const room = validateRoom(next.room);
  if (
    !room ||
    next.sources.length > POLICY.reviewSources ||
    next.observations.length + next.excludedObservations.length >
      POLICY.draftObservations ||
    next.links.length > POLICY.furniture + POLICY.features ||
    next.reviewed.length > POLICY.reviewedFields ||
    next.revision >= Number.MAX_SAFE_INTEGER - 1
  )
    return {
      ok: false,
      message: 'This review has reached its supported limits.',
    };
  const sources = new Set(next.sources.map((s) => s.id)),
    counts = new Map<string, number>();
  for (const observation of next.observations) {
    if (!sources.has(observation.sourceId))
      return {
        ok: false,
        message: 'This observation refers to unavailable evidence.',
      };
    counts.set(
      observation.sourceId,
      (counts.get(observation.sourceId) ?? 0) + 1,
    );
  }
  if ([...counts.values()].some((count) => count > POLICY.observationsPerPhoto))
    return {
      ok: false,
      message:
        'A photo has reached its observation limit. Review or exclude earlier observations first.',
    };
  const ids = new Set(
      [...room.furniture, ...room.room.features].map((x) => x.id),
    ),
    refs = new Set(next.observations.map((o) => o.ref));
  if (
    next.links.some(
      (l) =>
        !ids.has(l.entityId) ||
        l.observations.length > POLICY.observationsPerEntity ||
        new Set(l.observations).size !== l.observations.length ||
        l.observations.some((r) => !refs.has(r)),
    )
  )
    return { ok: false, message: 'These photo associations need review.' };
  next.revision = before.revision + 1;
  room.roomRevision = next.revision;
  next.room = room;
  return { ok: true, draft: next };
}
/** Same pure physical/feature command evaluator as the accepted room. */
export function correctDraft(
  draft: ReviewDraft,
  actions: VisitorAction[],
): ReviewResult {
  const result = evaluateBatch(draft.room, actions, 'visitor');
  if (!result.ok)
    return {
      ok: false,
      message:
        result.code === 'locked'
          ? actions.some((a) => a.type === 'set-size-estimate')
            ? 'Unlock size before changing its estimate.'
            : 'Unlock that property before changing its planned placement.'
          : result.code === 'new-conflict'
            ? actions.some((a) => a.type === 'set-size-estimate')
              ? 'That size adds a space conflict. Keep the current size or move the piece.'
              : 'That placement adds a space conflict. Keep the current position or correct the measurements.'
            : 'This correction is outside the supported room rules.',
    };
  if (!result.changed) return { ok: true, draft };
  const next = structuredClone(draft);
  next.room = result.room;
  for (const action of actions) {
    if (action.type === 'set-room-surface') {
      for (const field of ['color', 'texture'] as const) {
        const value = next.room.room.surfaces?.[action.surface]?.[field];
        if (value?.status === 'planned') {
          const key = `${next.room.roomId}:${action.surface}:${field}`;
          if (!next.reviewed.includes(key)) next.reviewed.push(key);
        }
      }
    }
    if (action.type === 'set-size-estimate') {
      for (const axis of ['width', 'depth', 'height'] as const) {
        if (
          action[axis] !== undefined &&
          !next.reviewed.includes(`${action.id}:${axis}`)
        )
          next.reviewed.push(`${action.id}:${axis}`);
      }
    }
    const key =
      action.type === 'confirm-measurement'
        ? `${action.target.id}:${action.target.field}`
        : 'id' in action
          ? `${action.id}:${action.type}`
          : action.type;
    if (!next.reviewed.includes(key)) next.reviewed.push(key);
    if (
      (action.type === 'move' ||
        action.type === 'rotate' ||
        (action.type === 'set-locks' && action.locks.position)) &&
      'id' in action
    ) {
      const link = next.links.find((l) => l.entityId === action.id);
      if (link) link.normalized = null;
    }
    if (action.type === 'remove-feature') retireEntityEvidence(next, action.id);
    if (action.type === 'add-feature')
      next.links.push({
        entityId: action.feature.id,
        observations: [],
        normalized: null,
      });
  }
  // Only derived draft placements depend on a changed wall size. Confirmed/planned poses never rescale.
  for (const link of next.links) {
    const piece = next.room.furniture.find((p) => p.id === link.entityId);
    if (
      piece &&
      link.normalized &&
      !piece.locks.position &&
      piece.pose.provenance.status === 'estimated' &&
      piece.pose.provenance.sourceId === 'draft-estimate'
    )
      Object.assign(piece.pose, displayPosition(next, link.normalized));
  }
  return finishDraft(draft, next);
}
export function addDraftPiece(
  draft: ReviewDraft,
  catalogueId: string,
  id: string,
  owned = true,
): ReviewResult {
  if (draft.room.furniture.length >= POLICY.furniture)
    return { ok: false, message: 'Keep up to 40 pieces in one room.' };
  const piece = draftFurniture(draft, catalogueId, id, owned);
  if (!piece)
    return {
      ok: false,
      message: 'Choose a supported catalogue representation.',
    };
  const next = structuredClone(draft);
  next.room.furniture.push(piece);
  const w = draft.room.room.width.value ?? 4200,
    d = draft.room.room.depth.value ?? 4800;
  next.links.push({
    entityId: id,
    observations: [],
    normalized: owned ? [piece.pose.centerX / w, piece.pose.centerZ / d] : null,
  });
  return finishDraft(draft, next);
}
export function changeDraftCategory(
  draft: ReviewDraft,
  id: string,
  catalogueId: string,
): ReviewResult {
  const next = structuredClone(draft),
    p = next.room.furniture.find((p) => p.id === id),
    entry = findCatalogueEntry(catalogueId, VERSIONS.catalogue);
  if (!p || !entry)
    return { ok: false, message: 'Choose a supported representation.' };
  // Re-identifying an unaccepted observation is not replacing an accepted physical piece.
  p.catalogueId = entry.id;
  p.catalogueVersion = entry.version;
  p.label = uniquePieceLabel(draft, entry.label, id);
  if (p.ownership === 'proposed' && !entry.finishes.includes(p.finish))
    p.finish = entry.finishes[0]!;
  return finishDraft(draft, next);
}
const reviewedValue = (m: Measurement) => m.status === 'confirmed';
export function mergeDraftPieces(
  draft: ReviewDraft,
  keepId: string,
  otherId: string,
): ReviewResult {
  if (keepId === otherId)
    return { ok: false, message: 'Choose a different piece to merge.' };
  const next = structuredClone(draft),
    keep = next.room.furniture.find((p) => p.id === keepId),
    other = next.room.furniture.find((p) => p.id === otherId),
    a = next.links.find((l) => l.entityId === keepId),
    b = next.links.find((l) => l.entityId === otherId);
  if (!keep || !other || !a || !b || keep.ownership !== other.ownership)
    return {
      ok: false,
      message:
        'Only merge observations of the same existing or proposed piece.',
    };
  for (const axis of ['width', 'depth', 'height'] as const) {
    if (
      reviewedValue(keep.dimensions[axis]) &&
      reviewedValue(other.dimensions[axis]) &&
      keep.dimensions[axis].value !== other.dimensions[axis].value
    )
      return {
        ok: false,
        message: `The two ${axis} measurements disagree. Correct them before merging.`,
      };
    if (
      keep.dimensions[axis].value === null ||
      (!reviewedValue(keep.dimensions[axis]) &&
        reviewedValue(other.dimensions[axis]))
    )
      keep.dimensions[axis] = other.dimensions[axis];
  }
  const deliberate = (p: Furniture) =>
    p.pose.provenance.status === 'confirmed' ||
    p.pose.provenance.status === 'planned';
  if (
    deliberate(keep) &&
    deliberate(other) &&
    (['centerX', 'centerZ', 'quarterTurns'] as const).some(
      (k) => keep.pose[k] !== other.pose[k],
    )
  )
    return {
      ok: false,
      message:
        'These reviewed positions disagree. Resolve their placement before merging.',
    };
  if (!deliberate(keep) && deliberate(other)) {
    keep.pose = other.pose;
    a.normalized = null;
  }
  keep.locks = {
    dimensions: keep.locks.dimensions || other.locks.dimensions,
    position: keep.locks.position || other.locks.position,
    rotation: keep.locks.rotation || other.locks.rotation,
  };
  if (
    keep.preference !== other.preference &&
    [keep.preference, other.preference].includes('replace') &&
    [keep.preference, other.preference].includes('keep')
  )
    return {
      ok: false,
      message:
        'The Keep and May replace choices disagree. Review them before merging.',
    };
  if (other.preference === 'keep') keep.preference = 'keep';
  a.observations = [...new Set([...a.observations, ...b.observations])];
  next.room.furniture = next.room.furniture.filter((p) => p.id !== otherId);
  next.links = next.links.filter((l) => l.entityId !== otherId);
  return finishDraft(draft, next);
}
export function splitDraftPiece(
  draft: ReviewDraft,
  id: string,
  observationRef: string,
  newId: string,
): ReviewResult {
  const next = structuredClone(draft),
    original = next.room.furniture.find((p) => p.id === id),
    link = next.links.find((l) => l.entityId === id);
  if (
    !original ||
    !link ||
    !link.observations.includes(observationRef) ||
    link.observations.length < 2
  )
    return {
      ok: false,
      message: 'Choose one of at least two linked observations to separate.',
    };
  const added = addDraftPiece(
    next,
    original.catalogueId,
    newId,
    original.ownership === 'owned',
  );
  if (!added.ok) return added;
  const fresh = added.draft.room.furniture.find((p) => p.id === newId)!;
  // A distinct physical piece needs its own measurements; never copy a visitor confirmation across identities.
  fresh.dimensions = { width: unknown(), depth: unknown(), height: unknown() };
  added.draft.links.find((l) => l.entityId === newId)!.observations = [
    observationRef,
  ];
  added.draft.links.find((l) => l.entityId === id)!.observations =
    link.observations.filter((r) => r !== observationRef);
  return finishDraft(draft, added.draft);
}
function retireEntityEvidence(draft: ReviewDraft, id: string) {
  const removed =
    draft.links.find((link) => link.entityId === id)?.observations ?? [];
  for (const ref of removed)
    if (!draft.reviewed.includes(`observation:${ref}:excluded`))
      draft.reviewed.push(`observation:${ref}:excluded`);
  draft.links = draft.links.filter((link) => link.entityId !== id);
  draft.excludedObservations.push(
    ...draft.observations.filter(
      (o) =>
        removed.includes(o.ref) &&
        !draft.links.some((l) => l.observations.includes(o.ref)),
    ),
  );
  draft.observations = draft.observations.filter(
    (observation) =>
      !removed.includes(observation.ref) ||
      draft.links.some((link) => link.observations.includes(observation.ref)),
  );
}
export function removeDraftPiece(draft: ReviewDraft, id: string): ReviewResult {
  const next = structuredClone(draft);
  next.room.furniture = next.room.furniture.filter((piece) => piece.id !== id);
  retireEntityEvidence(next, id);
  return finishDraft(draft, next);
}
/** Adapter seam only: no model/runtime/download. Known corrections survive later hypotheses. */
export function adoptHypothesis(
  draft: ReviewDraft,
  raw: unknown,
  newId: () => string,
): ReviewResult {
  const available = draft.sources.filter((s) => s.available),
    parsed = parseDraftHypothesis(
      raw,
      available.map((s) => s.id),
      available.filter((s) => s.purpose === 'auto').map((s) => s.id),
    );
  if (!parsed)
    return {
      ok: false,
      message: 'The draft response needs a supported structured review.',
    };
  const next = structuredClone(draft);
  for (const source of next.sources) {
    if (source.available && source.purpose === 'auto')
      source.detectedPurpose = parsed.sourcePurposes!.find(
        (s) => s.id === source.id,
      )!.purpose;
  }
  reconcileRoomEvidence(next);
  const roomSources = new Set(
    next.sources.filter((s) => s.available && isRoomSource(s)).map((s) => s.id),
  );
  if (parsed.surfaces) {
    for (const target of ['floor', 'walls'] as const) {
      const appearance =
        next.room.room.surfaces?.[target] ?? emptySurfaceAppearance();
      const incoming = parsed.surfaces[target];
      if (
        !next.reviewed.includes(`${next.room.roomId}:${target}:color`) &&
        incoming.color.sourceId &&
        roomSources.has(incoming.color.sourceId) &&
        appearance.color.status !== 'planned'
      )
        appearance.color = incoming.color;
      if (
        !next.reviewed.includes(`${next.room.roomId}:${target}:texture`) &&
        incoming.texture.sourceId &&
        roomSources.has(incoming.texture.sourceId) &&
        appearance.texture.status !== 'planned'
      )
        appearance.texture = incoming.texture;
      next.room.room.surfaces = {
        ...next.room.room.surfaces,
        [target]: appearance,
      };
    }
  }
  if (
    !next.frameReviewed &&
    !next.reviewed.includes(`${next.room.roomId}:shape`)
  )
    next.shape =
      parsed.frameEvidence.sourceId &&
      roomSources.has(parsed.frameEvidence.sourceId)
        ? parsed.shape
        : 'unknown';
  for (const axis of ['width', 'depth', 'height'] as const) {
    const m = parsed.room[axis];
    if (
      next.room.room[axis].value === null &&
      !next.reviewed.includes(`${next.room.roomId}:${axis}`) &&
      m.sourceId &&
      roomSources.has(m.sourceId)
    )
      next.room.room[axis] = m;
  }
  const refs = new Map<string, string>(),
    ambiguous = new Set<string>();
  const sameObservation = (a: DraftObservation, b: DraftObservation) =>
    a.sourceId === b.sourceId &&
    a.kind === b.kind &&
    a.catalogueId === b.catalogueId &&
    (a.wall === 'unknown' || b.wall === 'unknown' || a.wall === b.wall) &&
    a.sketch.x !== null &&
    b.sketch.x !== null &&
    a.sketch.z !== null &&
    b.sketch.z !== null &&
    Math.abs(a.sketch.x - b.sketch.x) < 0.08 &&
    Math.abs(a.sketch.z - b.sketch.z) < 0.08;
  for (const observation of parsed.observations) {
    const ref = `${observation.sourceId}:${observation.ref}`;
    if (next.reviewed.includes(`observation:${ref}:excluded`)) continue;
    if (next.excludedObservations.some((o) => sameObservation(o, observation)))
      continue;
    const prior = next.observations.find((o) => o.ref === ref);
    if (prior) {
      // A reused provider label is not authority to change the represented physical entity.
      if (
        (sameObservation(prior, observation) ||
          (prior.sketch.x === null &&
            observation.sketch.x === null &&
            prior.sketch.z === null &&
            observation.sketch.z === null)) &&
        prior.kind === observation.kind &&
        prior.catalogueId === observation.catalogueId &&
        (prior.wall === observation.wall ||
          observation.wall === 'unknown' ||
          prior.wall === 'unknown')
      )
        refs.set(observation.ref, ref);
      else {
        const conflict = `${ref}:conflict:${next.revision}`;
        next.observations.push({ ...observation, ref: conflict });
        refs.set(observation.ref, conflict);
        ambiguous.add(conflict);
      }
      continue;
    }
    const matches = next.observations.filter((o) =>
      sameObservation(o, observation),
    );
    const contenders = parsed.observations.filter((o) =>
      sameObservation(o, observation),
    );
    if (matches.length === 1 && contenders.length === 1) {
      refs.set(observation.ref, matches[0]!.ref);
      continue;
    }
    refs.set(observation.ref, ref);
    next.observations.push({ ...observation, ref });
    if (matches.length || contenders.length > 1) ambiguous.add(ref);
  }
  for (const group of parsed.groups) {
    const observations = group
      .map((ref) => refs.get(ref))
      .filter((ref): ref is string => !!ref);
    if (observations.length === 0) continue;
    if (observations.some((ref) => ambiguous.has(ref))) continue;
    const first = next.observations.find((o) => o.ref === observations[0])!;
    const members = observations.map((ref) =>
      next.observations.find((o) => o.ref === ref)!,
    );
    const walls = new Set(
      members.map((o) => o.wall).filter((w) => w !== 'unknown'),
    );
    // Keep contradictory associations unassigned and visible rather than choosing the first wall/category.
    if (
      members.some(
        (o) => o.kind !== first.kind || o.catalogueId !== first.catalogueId,
      ) ||
      walls.size > 1
    )
      continue;
    const existing = next.links.filter((l) =>
      l.observations.some((r) => observations.includes(r)),
    );
    if (existing.length) {
      // Never merge two already reviewed physical entities because a new response groups them.
      if (existing.length === 1)
        existing[0]!.observations = [
          ...new Set([...existing[0]!.observations, ...observations]),
        ];
      continue;
    }
    // Unknown poses with a previous same-source/category entity are ambiguous, not an automatic extra piece.
    if (
      next.links.some((l) =>
        l.observations.some((ref) => {
          const prior = next.observations.find((o) => o.ref === ref)!;
          return members.some(
            (o) =>
              o.sourceId === prior.sourceId &&
              o.kind === prior.kind &&
              o.catalogueId === prior.catalogueId &&
              (o.sketch.x === null ||
                o.sketch.z === null ||
                prior.sketch.x === null ||
                prior.sketch.z === null),
          );
        }),
      )
    )
      continue;
    const id = newId();
    if (first.kind === 'furniture') {
      if (!first.catalogueId) continue;
      const piece = draftFurniture(next, first.catalogueId, id, true);
      if (!piece) continue;
      piece.dimensions = {
        width: first.width,
        depth: first.depth,
        height: first.height,
      };
      const normalized: [number, number] = [
        first.sketch.x ?? 0.5,
        first.sketch.z ?? 0.5,
      ];
      piece.pose = {
        ...piece.pose,
        ...displayPosition(next, normalized),
        quarterTurns: first.sketch.quarterTurns ?? 0,
      };
      if (first.finish) piece.finish = first.finish;
      if (
        next.room.furniture.length >= POLICY.furniture ||
        !validateRoom({
          ...next.room,
          furniture: [...next.room.furniture, piece],
        })
      )
        continue;
      next.room.furniture.push(piece);
      next.links.push({ entityId: id, observations, normalized });
    } else {
      const feature = draftFeature(first.kind, id);
      feature.wall = first.wall;
      feature.wallProvenance = first.wallEvidence;
      feature.width = first.width;
      feature.height = first.height;
      feature.offset = first.offset;
      feature.sill = first.sill;
      if (feature.kind === 'obstacle') feature.projection = first.projection;
      else {
        if (first.mechanism !== 'fixed' || feature.kind === 'window') {
          feature.mechanism = first.mechanism;
          feature.mechanismProvenance = first.mechanismEvidence;
        }
        if (feature.kind === 'door') {
          feature.hinge = first.hinge;
          feature.hingeProvenance = first.hingeEvidence;
        }
      }
      if (next.room.room.features.length >= POLICY.features) continue;
      next.room.room.features.push(feature);
      next.links.push({ entityId: id, observations, normalized: null });
    }
  }
  return finishDraft(draft, next);
}

export interface ReviewQuestion {
  id: string;
  field: string;
  kind: 'room' | 'furniture' | 'feature';
  text: string;
}
/** Small deterministic relevance policy: footprint/selected opening before unrelated unknown heights. */
export function nextQuestion(
  draft: ReviewDraft,
  selectedId: string | null,
): ReviewQuestion | null {
  const room = draft.room;
  for (const axis of ['width', 'depth'] as const)
    if (room.room[axis].value === null)
      return {
        id: room.roomId,
        field: axis,
        kind: 'room',
        text:
          axis === 'width'
            ? 'How wide is the room from left to right?'
            : 'How deep is the room from top to bottom?',
      };
  const selectedFeature = room.room.features.find((f) => f.id === selectedId);
  if (selectedFeature) {
    if (selectedFeature.wall === 'unknown')
      return {
        id: selectedFeature.id,
        kind: 'feature',
        field: 'wall',
        text: 'Which sketch wall contains this feature?',
      };
    for (const field of ['offset', 'width'] as const)
      if (selectedFeature[field].value === null)
        return {
          id: selectedFeature.id,
          kind: 'feature',
          field,
          text:
            field === 'offset'
              ? 'How far along the wall does this feature start?'
              : 'How wide is this opening or obstacle?',
        };
    if (
      selectedFeature.kind === 'door' &&
      selectedFeature.mechanism === 'unknown'
    )
      return {
        id: selectedFeature.id,
        kind: 'feature',
        field: 'mechanism',
        text: 'Does this door open inward, outward or slide?',
      };
    if (
      selectedFeature.kind === 'door' &&
      selectedFeature.mechanism === 'inward' &&
      selectedFeature.hinge === 'unknown'
    )
      return {
        id: selectedFeature.id,
        kind: 'feature',
        field: 'hinge',
        text: 'Which end of this wall opening has the hinge?',
      };
  }
  const pieces = [...room.furniture].sort((a, b) =>
    a.id === selectedId ? -1 : b.id === selectedId ? 1 : 0,
  );
  for (const piece of pieces)
    for (const axis of ['width', 'depth'] as const)
      if (piece.dimensions[axis].value === null)
        return {
          id: piece.id,
          field: axis,
          kind: 'furniture',
          text: `What is the ${axis} of ${piece.label.toLowerCase()}?`,
        };
  if (room.intent.goals.includes('work')) {
    const needed = checkRoom(room).issues.find(
      (i) =>
        i.rule === 'window' &&
        i.objectIds.includes(selectedId ?? '') &&
        i.requiredInputs.some((s) => s.endsWith(':sill')),
    );
    const feature = room.room.features.find(
      (f) =>
        needed?.objectIds.includes(f.id) &&
        f.kind === 'window' &&
        f.sill.value === null,
    );
    if (feature)
      return {
        id: feature.id,
        field: 'sill',
        kind: 'feature',
        text: 'How high is this window sill above the floor?',
      };
  }
  return null;
}

/** Automatic sources need actual classified room context before they can support a frame/scale. */
export function isRoomSource(source: ReviewSource) {
  return (
    source.purpose === 'room' ||
    (source.purpose === 'auto' && source.detectedPurpose === 'room')
  );
}

/** A furniture-detail source cannot regain room-scale authority through semantic Undo. */
export function reconcileRoomEvidence(draft: ReviewDraft) {
  let changed = false;
  for (const target of ['floor', 'walls'] as const) {
    const appearance = draft.room.room.surfaces?.[target];
    if (!appearance) continue;
    for (const field of ['color', 'texture'] as const) {
      const fact = appearance[field];
      if (
        fact.status === 'estimated' &&
        !draft.reviewed.includes(`${draft.room.roomId}:${target}:${field}`) &&
        !draft.sources.some(
          (s) => s.id === fact.sourceId && s.available && isRoomSource(s),
        )
      ) {
        appearance[field] = { value: null, status: 'unknown', sourceId: null };
        changed = true;
      }
    }
  }
  for (const axis of ['width', 'depth', 'height'] as const) {
    const value = draft.room.room[axis],
      source = draft.sources.find((s) => s.id === value.sourceId);
    if (
      value.status !== 'confirmed' &&
      source &&
      !isRoomSource(source) &&
      !draft.reviewed.includes(`${draft.room.roomId}:${axis}`)
    ) {
      draft.room.room[axis] = unknown();
      changed = true;
    }
  }
  if (changed)
    for (const link of draft.links) {
      const piece = draft.room.furniture.find((p) => p.id === link.entityId);
      if (
        piece &&
        link.normalized &&
        !piece.locks.position &&
        piece.pose.provenance.status === 'estimated' &&
        piece.pose.provenance.sourceId === 'draft-estimate'
      )
        Object.assign(piece.pose, displayPosition(draft, link.normalized));
    }
  if (
    !draft.frameReviewed &&
    !draft.reviewed.includes(`${draft.room.roomId}:shape`) &&
    draft.sources.length > 0 &&
    !draft.sources.some(isRoomSource)
  )
    draft.shape = 'unknown';
  return changed;
}
