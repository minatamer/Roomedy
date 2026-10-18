import { describe, it, expect, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import type {
  DraftHypothesis,
  DraftObservation,
} from '@roomedy/contracts/intake';
import {
  addDraftPiece,
  adoptHypothesis,
  correctDraft,
  createDraft,
  mergeDraftPieces,
  removeDraftPiece,
  nextQuestion,
  splitDraftPiece,
  unknown,
  draftFeature,
} from '../apps/frontend/src/features/room-intake/draft.js';
import type { ReviewDraft } from '../apps/frontend/src/features/room-intake/draft.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';

const observation = (ref: string, sourceId: string): DraftObservation => ({
  ref,
  sourceId,
  kind: 'furniture',
  catalogueId: 'procedural-desk',
  label: 'Possible desk',
  wall: 'unknown',
  width: unknown(),
  depth: unknown(),
  height: unknown(),
  offset: unknown(),
  sill: unknown(),
  projection: unknown(),
  wallEvidence: { status: 'unknown', sourceId: null },
  mechanism: 'unknown',
  mechanismEvidence: { status: 'unknown', sourceId: null },
  hinge: 'unknown',
  hingeEvidence: { status: 'unknown', sourceId: null },
  poseEvidence: { status: 'estimated', sourceId },
  visibility: 'visible',
  finish: null,
  sketch: { x: 0.7, z: 0.3, quarterTurns: 1 },
});
function fixture() {
  const draft = createDraft('furnished', 'review_room');
  draft.sources = [
    { id: 'photo_a', purpose: 'room', available: true },
    { id: 'photo_b', purpose: 'room', available: true },
  ];
  return draft;
}
function hypothesis(): DraftHypothesis {
  return {
    version: 1,
    shape: 'rectangle',
    frameEvidence: { status: 'estimated', sourceId: 'photo_a' },
    room: { width: unknown(), depth: unknown(), height: unknown() },
    observations: [
      observation('desk_a', 'photo_a'),
      observation('desk_b', 'photo_b'),
    ],
    groups: [['desk_a'], ['desk_b']],
  };
}
const take = (
  result: { ok: true; draft: ReviewDraft } | { ok: false; message: string },
) => {
  if (!result.ok) throw new Error(result.message);
  return result.draft;
};
describe('uncertain review and shared physical authority', () => {
  it('starts every room condition without invented inventory, measurements or confirmed frame', () => {
    for (const condition of ['empty', 'partial', 'furnished'] as const) {
      const d = createDraft(condition, 'room');
      expect(d.room.furniture).toEqual([]);
      expect(d.room.room.width.value).toBeNull();
      expect(d.shape).toBe('unknown');
      expect(d.frameReviewed).toBe(false);
    }
  });
  it('rejects foreign sources and confirmation claims without discarding existing review data', () => {
    const raw = hypothesis();
    expect(parseDraftHypothesis(raw, ['photo_a', 'photo_b'])).not.toBeNull();
    raw.observations[0]!.sourceId = 'foreign';
    expect(parseDraftHypothesis(raw, ['photo_a', 'photo_b'])).toBeNull();
    raw.observations[0]!.sourceId = 'photo_a';
    raw.observations[0]!.width = {
      status: 'confirmed',
      value: 1200,
      sourceId: 'photo_a',
    } as never;
    expect(parseDraftHypothesis(raw, ['photo_a', 'photo_b'])).toBeNull();
    expect(fixture().room.furniture).toEqual([]);
  });
  it('keeps two identical desks separate until explicit merge; split preserves kept corrections', () => {
    let id = 0;
    let draft = take(
      adoptHypothesis(fixture(), hypothesis(), () => `desk_${++id}`),
    );
    expect(draft.room.furniture).toHaveLength(2);
    expect(new Set(draft.room.furniture.map((p) => p.label)).size).toBe(2);
    expect(draft.room.furniture.map((p) => p.id)).toEqual(['desk_1', 'desk_2']);
    draft = take(
      correctDraft(draft, [
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id: 'desk_1', field: 'width' },
          value: 1501,
        },
      ]),
    );
    draft = take(mergeDraftPieces(draft, 'desk_1', 'desk_2'));
    expect(draft.links[0]?.observations).toHaveLength(2);
    expect(draft.room.furniture[0]?.dimensions.width).toMatchObject({
      value: 1501,
      status: 'confirmed',
    });
    const separated = take(
      splitDraftPiece(
        draft,
        'desk_1',
        draft.links[0]!.observations[1]!,
        'desk_3',
      ),
    );
    expect(separated.room.furniture[0]?.id).toBe('desk_1');
    expect(separated.room.furniture[0]?.dimensions.width.value).toBe(1501);
    expect(separated.room.furniture[1]?.dimensions.width.status).toBe(
      'unknown',
    );
  });
  it('an explicitly removed feature cannot be restored by later matching observations', () => {
    const raw = hypothesis();
    raw.observations = [
      { ...raw.observations[0]!, kind: 'door', catalogueId: null },
    ];
    raw.groups = [['desk_a']];
    let id = 0;
    let d = take(adoptHypothesis(fixture(), raw, () => `feature_${++id}`));
    d = take(correctDraft(d, [{ type: 'remove-feature', id: 'feature_1' }]));
    d = take(adoptHypothesis(d, raw, () => `feature_${++id}`));
    expect(d.room.room.features).toHaveLength(0);
    expect(d.observations).toHaveLength(0);
  });
  it('refuses to silently discard conflicting visitor measurements during identity merge', () => {
    let id = 0;
    let d = take(
      adoptHypothesis(fixture(), hypothesis(), () => `desk_${++id}`),
    );
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id: 'desk_1', field: 'width' },
          value: 1200,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id: 'desk_2', field: 'width' },
          value: 1500,
        },
      ]),
    );
    const before = JSON.stringify(d),
      result = mergeDraftPieces(d, 'desk_1', 'desk_2');
    expect(result.ok).toBe(false);
    expect(JSON.stringify(d)).toBe(before);
  });
  it('reprojects only dependent estimates after a wall correction, never confirmed sizes or planned poses', () => {
    let d = take(
      addDraftPiece(createDraft('partial', 'room'), 'procedural-desk', 'desk'),
    );
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id: 'desk', field: 'width' },
          value: 1501,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'width' },
          value: 6000,
        },
      ]),
    );
    expect(d.room.furniture[0]?.pose.centerX).toBe(1500);
    expect(d.room.furniture[0]?.dimensions.width.value).toBe(1501);
    d = take(
      correctDraft(d, [
        {
          type: 'set-locks',
          id: 'desk',
          locks: { dimensions: true, position: false, rotation: false },
        },
        {
          type: 'move',
          id: 'desk',
          pose: { centerX: 750.5, centerZ: 1000.5, quarterTurns: 0 },
        },
      ]),
    );
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'width' },
          value: 4800,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'depth' },
          value: 6000,
        },
      ]),
    );
    expect(d.room.furniture[0]?.pose).toMatchObject({
      centerX: 750.5,
      centerZ: 1000.5,
      provenance: { status: 'planned' },
    });
    expect(d.room.furniture[0]?.dimensions.width.value).toBe(1501);
  });
  it('locking an estimated position retires its scale dependency without inventing confirmation or moving on unlock', () => {
    let d = take(
      addDraftPiece(
        createDraft('furnished', 'room'),
        'procedural-desk',
        'desk',
      ),
    );
    const original = { ...d.room.furniture[0]!.pose };
    d = take(
      correctDraft(d, [
        {
          type: 'set-locks',
          id: 'desk',
          locks: { position: true, rotation: false, dimensions: true },
        },
      ]),
    );
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'width' },
          value: 6000,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'depth' },
          value: 5000,
        },
      ]),
    );
    expect(d.room.furniture[0]?.pose).toEqual(original);
    expect(d.room.furniture[0]?.pose.provenance.status).toBe('estimated');
    expect(d.links[0]?.normalized).toBeNull();
    d = take(
      correctDraft(d, [
        {
          type: 'set-locks',
          id: 'desk',
          locks: { position: false, rotation: false, dimensions: true },
        },
      ]),
    );
    expect(d.room.furniture[0]?.pose).toEqual(original);
  });
  it('furniture-detail evidence cannot establish room scale or confirm a rectangular frame', () => {
    const d = fixture();
    d.sources = d.sources.map((s) => ({ ...s, purpose: 'furniture' }));
    const raw = hypothesis();
    raw.room.width = { value: 5000, status: 'estimated', sourceId: 'photo_a' };
    let id = 0;
    const result = take(adoptHypothesis(d, raw, () => `entity_${++id}`));
    expect(result.room.room.width.value).toBeNull();
    expect(result.shape).toBe('unknown');
    expect(result.room.furniture).toHaveLength(2);
  });
  it('keeps wall and hinge corrections independent through mirrored feature hypotheses', () => {
    let d = fixture();
    const f = draftFeature('door', 'door');
    d = take(
      correctDraft(d, [
        { type: 'add-feature', feature: f },
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: d.room.roomId, field: 'width' },
          value: 4200,
        },
      ]),
    );
    const door = d.room.room.features[0]!;
    if (door.kind !== 'door') throw new Error('fixture');
    d = take(
      correctDraft(d, [
        {
          type: 'update-feature',
          id: 'door',
          feature: {
            ...door,
            wall: 'east',
            wallProvenance: {
              status: 'confirmed',
              sourceId: 'visitor-confirmed',
            },
            mechanism: 'inward',
            mechanismProvenance: {
              status: 'confirmed',
              sourceId: 'visitor-confirmed',
            },
          },
        },
      ]),
    );
    expect(d.room.room.features[0]).toMatchObject({
      wall: 'east',
      hinge: 'unknown',
      width: { status: 'unknown' },
    });
    expect(d.room.room.width.status).toBe('confirmed');
    expect(d.room.room.depth.status).toBe('unknown');
    const observation = {
      ...hypothesis().observations[0]!,
      kind: 'door' as const,
      catalogueId: null,
      wall: 'west' as const,
      wallEvidence: { status: 'estimated' as const, sourceId: 'photo_a' },
    };
    d.observations = [{ ...observation, ref: 'photo_a:door' }];
    d.links[0]!.observations = ['photo_a:door'];
    const raw = {
      ...hypothesis(),
      observations: [{ ...observation, ref: 'door' }],
      groups: [['door']],
    };
    d = take(adoptHypothesis(d, raw, () => 'new-door'));
    expect(d.room.room.features).toHaveLength(1);
    expect(d.room.room.features[0]?.wall).toBe('east');
  });
  it('repeated/contradictory hypotheses retain source associations and visitor corrections', () => {
    let id = 0;
    let d = take(
      adoptHypothesis(fixture(), hypothesis(), () => `desk_${++id}`),
    );
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'review_room', field: 'width' },
          value: 4500,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id: 'desk_1', field: 'width' },
          value: 1300,
        },
      ]),
    );
    const raw = hypothesis();
    raw.room.width = { value: 9000, status: 'estimated', sourceId: 'photo_a' };
    raw.observations[0]!.sketch.x = 0.1;
    d = take(adoptHypothesis(d, raw, () => `desk_${++id}`));
    expect(d.room.furniture).toHaveLength(2);
    expect(d.room.room.width.value).toBe(4500);
    expect(d.room.furniture[0]?.dimensions.width.value).toBe(1300);
  });
  it('does not let later hypotheses restore an excluded piece or override a reviewed unsupported shape', () => {
    let id = 0,
      d = take(
        adoptHypothesis(fixture(), hypothesis(), () => `entity_${++id}`),
      );
    d = take(removeDraftPiece(d, 'entity_1'));
    d.shape = 'unsupported';
    d.frameReviewed = false;
    d.reviewed.push(`${d.room.roomId}:shape`);
    d = take(adoptHypothesis(d, hypothesis(), () => `entity_${++id}`));
    expect(d.room.furniture.map((p) => p.id)).toEqual(['entity_2']);
    expect(d.shape).toBe('unsupported');
    expect(d.observations).toHaveLength(1);
  });
  it('preserves unsupported hypotheses as unassigned observations without discarding the usable draft', () => {
    const raw = hypothesis();
    raw.observations[0]!.catalogueId = 'unknown-representation';
    raw.observations[1]!.width = {
      status: 'estimated',
      sourceId: 'photo_b',
      value: 15000,
    };
    let id = 0;
    const d = take(adoptHypothesis(fixture(), raw, () => `entity_${++id}`));
    expect(d.observations).toHaveLength(2);
    expect(d.room.furniture).toHaveLength(0);
  });
  it('applies the per-photo observation bound across successive adapter responses', () => {
    const raw = hypothesis();
    raw.observations = Array.from({ length: 16 }, (_, i) => ({
      ...observation(`obs_${i}`, 'photo_a'),
      catalogueId: null,
    }));
    raw.groups = [];
    let id = 0;
    const d = take(adoptHypothesis(fixture(), raw, () => `entity_${++id}`));
    raw.observations = raw.observations.map((o) => ({
      ...o,
      ref: `new_${o.ref}`,
    }));
    expect(adoptHypothesis(d, raw, () => `entity_${++id}`).ok).toBe(false);
    expect(d.observations).toHaveLength(16);
  });
  it('asks a relevant footprint/door question before unrelated room or furniture height', () => {
    let d = createDraft('partial', 'room');
    expect(nextQuestion(d, null)?.field).toBe('width');
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'width' },
          value: 4200,
        },
        {
          type: 'confirm-measurement',
          target: { kind: 'room', id: 'room', field: 'depth' },
          value: 4800,
        },
      ]),
    );
    expect(nextQuestion(d, null)).toBeNull();
    d = take(addDraftPiece(d, 'procedural-desk', 'desk'));
    expect(nextQuestion(d, 'desk')).toMatchObject({
      id: 'desk',
      field: 'width',
    });
  });
});

describe('review lifetime and accepted handoff', () => {
  it('accepts the exact reviewed room once, with one immutable baseline and selected identity', () => {
    let id = 0;
    const session = new SessionController(undefined, {
        id: () => `id_${++id}`,
      }),
      review = new ReviewController(session, 'empty', () => `id_${++id}`);
    expect(review.accept()).toBe(false);
    review.startReview();
    review.shape('rectangle');
    review.addPiece('procedural-desk');
    const expected = structuredClone(review.getSnapshot().draft.room),
      selected = review.getSnapshot().selectedId;
    expect(session.getSnapshot().workspace).toBeNull();
    expect(review.accept()).toBe(true);
    expect(review.accept()).toBe(false);
    expect(session.getSnapshot().workspace?.current).toEqual(expected);
    expect(session.getSnapshot().workspace?.baseline).toEqual(expected);
    expect(session.getSnapshot().presentation.selectedId).toBe(selected);
    session.dispose();
  });
  it('fences old review operations on correction, photo manifest change, acceptance and expiry', () => {
    let now = 0,
      id = 0;
    const session = new SessionController(undefined, {
        now: () => now,
        id: () => `id_${++id}`,
      }),
      review = new ReviewController(session, 'partial', () => `id_${++id}`);
    const token = review.beginDraftOperation()!,
      cleanup = vi.fn();
    review.ownOperation(token, cleanup);
    review.shape('rectangle');
    expect(review.isCurrent(token)).toBe(false);
    expect(cleanup).toHaveBeenCalledTimes(1);
    const next = review.beginDraftOperation()!;
    review.addPhotos([new Blob(['not-an-image'])], 'room');
    expect(review.isCurrent(next)).toBe(false);
    const last = review.beginDraftOperation()!;
    now = POLICY.guestLifetimeMs;
    expect(review.isCurrent(last)).toBe(false);
    expect(session.getSnapshot().phase).toBe('expired');
    expect(review.applyHypothesis(last, hypothesis())).toBe(false);
    expect(session.getSnapshot().workspace).toBeNull();
    session.dispose();
  });
  it('reordering/removing originals preserves reviewed work and acceptance revokes remaining previews', async () => {
    let id = 0,
      photo = 0;
    const revoked = vi.fn(),
      session = new SessionController(),
      review = new ReviewController(session, 'partial', () => `item_${++id}`, {
        id: () => `photo_${++photo}`,
        createUrl: () => `blob:fixture-${photo}`,
        revokeUrl: revoked,
        prepare: async () => ({
          normalized: new Blob(['normalized'], { type: 'image/jpeg' }),
          preview: new Blob(['preview'], { type: 'image/jpeg' }),
          type: 'image/png',
          inputWidth: 10,
          inputHeight: 10,
          width: 10,
          height: 10,
          decodeMs: 1,
          prepareMs: 1,
        }),
      });
    review.addPhotos(
      [
        new File(['raw'], 'private-photo-a.png'),
        new File(['raw'], 'private-photo-b.png'),
      ],
      'room',
    );
    await vi.waitFor(() =>
      expect(
        review.getSnapshot().photos.filter((p) => p.status === 'ready'),
      ).toHaveLength(2),
    );
    review.shape('rectangle');
    review.addPiece('procedural-desk');
    const piece = review.getSnapshot().selectedId;
    review.attachPhoto(piece, 'photo_1');
    review.command([
      {
        type: 'confirm-measurement',
        target: { kind: 'furniture', id: piece, field: 'width' },
        value: 1501,
      },
    ]);
    review.photos.reorder('photo_2', -1);
    review.photos.remove('photo_1');
    expect(
      review.getSnapshot().draft.room.furniture[0]?.dimensions.width.value,
    ).toBe(1501);
    expect(
      review.getSnapshot().draft.sources.find((s) => s.id === 'photo_1')
        ?.available,
    ).toBe(false);
    expect(review.accept()).toBe(true);
    expect(revoked).toHaveBeenCalledTimes(2);
    expect(review.photos.getSnapshot()).toEqual([]);
    expect(review.getSnapshot().draft.sources).toEqual([]);
    expect(JSON.stringify(session.getSnapshot().workspace)).not.toMatch(
      /private-photo|blob:fixture|normalized/,
    );
    session.dispose();
  });
  it('reclassifying furniture-only evidence retracts unreviewed room estimates, while explicit corrections survive', async () => {
    let id = 0;
    const session = new SessionController(),
      review = new ReviewController(session, 'partial', () => `item_${++id}`, {
        id: () => 'photo_a',
        createUrl: () => 'blob:fixture',
        revokeUrl: () => undefined,
        prepare: async () => ({
          normalized: new Blob(['n'], { type: 'image/jpeg' }),
          preview: new Blob(['p'], { type: 'image/jpeg' }),
          type: 'image/png',
          inputWidth: 10,
          inputHeight: 10,
          width: 10,
          height: 10,
          decodeMs: 1,
          prepareMs: 1,
        }),
      });
    review.addPhotos([new Blob(['x'])], 'room');
    await vi.waitFor(() =>
      expect(review.getSnapshot().photos[0]?.status).toBe('ready'),
    );
    const raw = hypothesis();
    raw.observations = [];
    raw.groups = [];
    raw.room.width = { value: 5000, status: 'estimated', sourceId: 'photo_a' };
    expect(review.applyHypothesis(review.beginDraftOperation()!, raw)).toBe(
      true,
    );
    expect(review.getSnapshot().draft.room.room.width.value).toBe(5000);
    review.addPiece('procedural-desk');
    review.photos.purpose('photo_a', 'furniture');
    expect(review.getSnapshot().draft.room.room.width.value).toBeNull();
    expect(review.getSnapshot().draft.shape).toBe('unknown');
    review.undo();
    expect(review.getSnapshot().draft.sources[0]?.purpose).toBe('furniture');
    expect(review.getSnapshot().draft.room.room.width.value).toBeNull();
    expect(review.getSnapshot().draft.shape).toBe('unknown');
    review.shape('rectangle');
    review.command([
      {
        type: 'confirm-measurement',
        target: {
          kind: 'room',
          id: review.getSnapshot().draft.room.roomId,
          field: 'width',
        },
        value: 4200,
      },
    ]);
    review.photos.purpose('photo_a', 'room');
    review.photos.purpose('photo_a', 'furniture');
    expect(review.getSnapshot().draft.room.room.width.value).toBe(4200);
    expect(review.getSnapshot().draft.shape).toBe('rectangle');
    review.dispose();
    session.dispose();
  });
  it('undoes a provisional removal without replacing the canonical controller', () => {
    let id = 0;
    const session = new SessionController(),
      review = new ReviewController(session, 'furnished', () => `id_${++id}`);
    review.startReview();
    review.addPiece('procedural-desk');
    const piece = review.getSnapshot().draft.room.furniture[0]!;
    review.command([
      {
        type: 'confirm-measurement',
        target: { kind: 'furniture', id: piece.id, field: 'width' },
        value: 1501,
      },
    ]);
    review.remove(piece.id);
    expect(review.getSnapshot().draft.room.furniture).toHaveLength(0);
    review.undo();
    expect(
      review.getSnapshot().draft.room.furniture[0]?.dimensions.width.value,
    ).toBe(1501);
    expect(session.getSnapshot().workspace).toBeNull();
    review.dispose();
    session.dispose();
  });
});
