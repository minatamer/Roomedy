import type { DraftHypothesis } from '@roomedy/contracts/intake';
import { it, expect, vi } from 'vitest';
import {
  parseDraftHypothesis,
  photoManifestSchema,
} from '@roomedy/contracts/intake';
import { recognitionInputSchema } from '@roomedy/contracts/operations';
import {
  createDraft,
  adoptHypothesis,
  correctDraft,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import { draftFromPhotos } from '../apps/frontend/src/features/room-intake/recognition-client.js';
import {
  bedroomExample,
  createRecognitionFakeProvider,
} from '../apps/backend/src/recognition/fixtures.js';
import {
  createRecognitionHandler,
  recognitionRequest,
} from '../apps/backend/src/recognition/recognize.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { recognitionInput, identityIds } from './fixtures/operation.js';
const sources = [
  { id: 'wide', purpose: 'auto' as const },
  { id: 'detail', purpose: 'auto' as const },
];
const mixed = (): DraftHypothesis & {
  sourcePurposes: NonNullable<DraftHypothesis['sourcePurposes']>;
} => ({
  ...bedroomExample(sources),
  sourcePurposes: [
    { id: 'wide', purpose: 'room' as const },
    { id: 'detail', purpose: 'furniture' as const },
  ],
});
function adopt(raw = mixed()) {
  const draft = createDraft('furnished', 'room');
  draft.sources = sources.map((s) => ({ ...s, available: true }));
  let id = 0;
  const result = adoptHypothesis(draft, raw, () => `item_${++id}`);
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}
it('accepts automatic image manifests without assigning room authority at selection', async () => {
  const input = await recognitionInput();
  input.manifest[0]!.purpose = 'auto';
  expect(photoManifestSchema.safeParse(input.manifest).success).toBe(true);
  expect(recognitionInputSchema.safeParse(input).success).toBe(true);
  const r = recognitionRequest(input, input.images);
  const content = r.input[0]!.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    throw new Error('context');
  expect(JSON.parse(content[0].text).sources).toEqual([
    { id: 'photo', purpose: 'auto' },
  ]);
  expect(r.instructions).toContain('infer this from the image itself');
  expect(r.format.schema.required).toContain('sourcePurposes');
  expect(r.tools).toEqual([]);
});
it.each(['missing', 'duplicate', 'foreign', 'incomplete', 'invalid'])(
  'rejects %s automatic classifications without losing the input draft',
  (kind) => {
    const raw: Record<string, unknown> = mixed();
    if (kind === 'missing') delete raw.sourcePurposes;
    if (kind === 'duplicate')
      raw.sourcePurposes = [
        { id: 'wide', purpose: 'room' },
        { id: 'wide', purpose: 'room' },
      ];
    if (kind === 'foreign')
      raw.sourcePurposes = [
        { id: 'wide', purpose: 'room' },
        { id: 'foreign', purpose: 'room' },
      ];
    if (kind === 'incomplete')
      raw.sourcePurposes = [{ id: 'wide', purpose: 'room' }];
    if (kind === 'invalid')
      raw.sourcePurposes = [
        { id: 'wide', purpose: 'auto' },
        { id: 'detail', purpose: 'room' },
      ];
    expect(
      parseDraftHypothesis(raw, ['wide', 'detail'], ['wide', 'detail']),
    ).toBeNull();
  },
);
it('uses both wide/detail observations, grouping the same pieces without granting the detail scale', () => {
  const raw = mixed();
  raw.room.depth = { value: 9999, status: 'estimated', sourceId: 'detail' };
  const d = adopt(raw);
  expect(d.room.furniture).toHaveLength(2);
  expect(d.links.every((l) => l.observations.length === 2)).toBe(true);
  expect(d.sources.map((s) => [s.purpose, s.detectedPurpose])).toEqual([
    ['auto', 'room'],
    ['auto', 'furniture'],
  ]);
  expect(d.shape).toBe('rectangle');
  expect(d.room.room.width.value).toBe(4200);
  expect(d.room.room.depth.value).toBeNull();
  expect(d.room.furniture[0]!.dimensions.width.status).toBe('estimated');
});
it.each(['furniture', 'unknown'] as const)(
  'keeps useful inventory from %s-only sources without a frame/scale',
  (purpose) => {
    const raw = mixed();
    raw.sourcePurposes = raw.sourcePurposes.map((s) => ({ ...s, purpose }));
    const d = adopt(raw);
    expect(d.room.furniture).toHaveLength(2);
    expect(d.shape).toBe('unknown');
    expect(
      Object.values(d.room.room)
        .filter((v) => v && typeof v === 'object' && 'status' in v)
        .every((v) => v.status === 'unknown'),
    ).toBe(true);
  },
);
it('retracts reclassified unreviewed estimates while preserving visitor measurement/shape corrections', () => {
  const d = adopt();
  const corrected = correctDraft(d, [
    {
      type: 'confirm-measurement',
      target: { kind: 'room', id: d.room.roomId, field: 'width' },
      value: 4250,
    },
  ]);
  if (!corrected.ok) throw new Error(corrected.message);
  corrected.draft.frameReviewed = true;
  const raw = mixed();
  raw.sourcePurposes = raw.sourcePurposes.map((s) => ({
    ...s,
    purpose: 'furniture',
  }));
  const result = adoptHypothesis(corrected.draft, raw, identityIds('next'));
  if (!result.ok) throw new Error(result.message);
  expect(result.draft.room.room.width).toMatchObject({
    value: 4250,
    status: 'confirmed',
  });
  expect(result.draft.room.room.depth.value).toBeNull();
  expect(result.draft.shape).toBe('rectangle');
});
it('runs automatic example roles through admitted fake backend with no metered dispatch', async () => {
  const ids = identityIds(),
    log = vi.fn();
  const runtime = createRuntime(
    parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'fixture-only' }),
    {
      now: Date.now,
      nextId: ids,
      log,
      provider: createRecognitionFakeProvider(),
      handlers: { 'recognize-room': createRecognitionHandler(log, ids) },
    },
  );
  try {
    const input = await recognitionInput();
    input.condition = 'furnished';
    input.manifest[0]!.purpose = 'auto';
    const grant = await runtime.operations.grant(
      input,
      null,
      new AbortController().signal,
    );
    if (!('grant' in grant)) throw new Error('grant');
    const result = await runtime.operations.run(
      input,
      grant.grant,
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      kind: 'completed',
      simulation: true,
      draft: { sourcePurposes: [{ id: 'photo', purpose: 'room' }] },
    });
    expect(runtime.operations.calls()).toBe(1);
    expect(runtime.meteredDispatches()).toBe(0);
  } finally {
    runtime.operations.close();
  }
});
it('keeps inferred roles across undo/reorder; late results after photo removal cannot apply', async () => {
  const session = new SessionController();
  let n = 0;
  const review = new ReviewController(
    session,
    'furnished',
    identityIds('review'),
    {
      id: () => ['wide', 'detail'][n++]!,
      createUrl: () => 'blob:fixture',
      revokeUrl: () => undefined,
      prepare: async () => ({
        normalized: new Blob(['n'], { type: 'image/jpeg' }),
        preview: new Blob(['p']),
        type: 'image/jpeg',
        inputWidth: 10,
        inputHeight: 10,
        width: 10,
        height: 10,
        decodeMs: 1,
        prepareMs: 1,
      }),
    },
  );
  try {
    review.addPhotos([new Blob(['x']), new Blob(['y'])], 'auto');
    await vi.waitFor(() =>
      expect(
        review.getSnapshot().photos.every((p) => p.status === 'ready'),
      ).toBe(true),
    );
    expect(
      review.photos
        .preparedRequest()!
        .manifest.every((p) => p.purpose === 'auto'),
    ).toBe(true);
    expect(
      review.applyHypothesis(review.beginDraftOperation()!, mixed(), true),
    ).toBe(true);
    review.addPiece('procedural-desk');
    review.undo();
    expect(
      review.getSnapshot().draft.sources.map((s) => s.detectedPurpose),
    ).toEqual(['room', 'furniture']);
    review.photos.reorder('detail', -1);
    expect(
      review.getSnapshot().draft.sources.find((s) => s.id === 'detail')!
        .detectedPurpose,
    ).toBe('furniture');
    const token = review.beginDraftOperation()!;
    review.photos.remove('detail');
    expect(review.applyHypothesis(token, mixed(), true)).toBe(false);
    expect(review.getSnapshot().draft.room.furniture).toHaveLength(2);
  } finally {
    session.dispose();
  }
});
it('rejects a response with missing automatic roles at the actual client boundary, preserving photos', async () => {
  const session = new SessionController();
  const review = new ReviewController(
    session,
    'furnished',
    identityIds('review'),
    {
      id: () => 'wide',
      createUrl: () => 'blob:fixture',
      revokeUrl: () => undefined,
      prepare: async () => ({
        normalized: new Blob(['n'], { type: 'image/jpeg' }),
        preview: new Blob(['p']),
        type: 'image/jpeg',
        inputWidth: 10,
        inputHeight: 10,
        width: 10,
        height: 10,
        decodeMs: 1,
        prepareMs: 1,
      }),
    },
  );
  try {
    review.addPhotos([new Blob(['x'])], 'auto');
    await vi.waitFor(() =>
      expect(review.getSnapshot().photos[0]!.status).toBe('ready'),
    );
    const transport = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url).endsWith('/admission'))
        return Response.json({
          kind: 'granted',
          grant: 'opaque',
          expiresAt: Date.now() + 120000,
          simulation: true,
        });
      const body = JSON.parse(String(init!.body));
      const raw = bedroomExample([{ id: 'wide' }]);
      delete raw.sourcePurposes;
      return Response.json({
        kind: 'completed',
        identity: body.input.identity,
        simulation: true,
        message: '',
        draft: raw,
      });
    });
    await draftFromPhotos(review, transport);
    expect(review.getSnapshot().stage).toBe('photos');
    expect(review.getSnapshot().photos).toHaveLength(1);
    expect(review.getSnapshot().recognition).toBe('idle');
    expect(review.getSnapshot().message).toMatch(/structured review/);
    expect(transport).toHaveBeenCalledTimes(2);
  } finally {
    session.dispose();
  }
});
