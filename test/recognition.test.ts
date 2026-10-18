import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { readFile } from 'node:fs/promises';
import { decodeInput, parseDraftHypothesis } from '@roomedy/contracts/intake';
import { recognitionInputSchema } from '@roomedy/contracts/operations';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import { responseBody } from '../apps/backend/src/providers/responses.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import type {
  ProviderOutcome,
  ProviderRequest,
} from '../apps/backend/src/providers/provider.js';
import {
  createRecognitionHandler,
  recognitionRequest,
} from '../apps/backend/src/recognition/recognize.js';
import {
  createRecognitionFakeProvider,
  recognitionFixture,
} from '../apps/backend/src/recognition/fixtures.js';
import type { RecognitionCase } from '../apps/backend/src/recognition/fixtures.js';
import { prepareRecognitionImages } from '../apps/backend/src/recognition/images.js';
import { recognitionInput, identityIds } from './fixtures/operation.js';
import {
  createDraft,
  adoptHypothesis,
  correctDraft,
  removeDraftPiece,
} from '../apps/frontend/src/features/room-intake/draft.js';
import type {
  ReviewDraft,
  ReviewResult,
} from '../apps/frontend/src/features/room-intake/draft.js';
const take = (r: ReviewResult): ReviewDraft => {
  if (!r.ok) throw new Error(r.message);
  return r.draft;
};
const secret = 'controlled-private-bridge',
  origin = 'http://127.0.0.1:4320';
function setup(reply?: (r: ProviderRequest) => Promise<ProviderOutcome>) {
  const log = vi.fn(),
    ids = identityIds();
  const runtime = createRuntime(
    parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: secret }),
    {
      now: Date.now,
      nextId: ids,
      log,
      provider: reply
        ? createFakeProvider(reply)
        : createRecognitionFakeProvider(),
      handlers: { 'recognize-room': createRecognitionHandler(log, ids) },
    },
  );
  return { runtime, app: createApp(runtime), log };
}
function draft(sources = ['photo', 'other']) {
  const d = createDraft('partial', 'review');
  d.sources = sources.map((id) => ({ id, purpose: 'room', available: true }));
  return d;
}
describe('admitted photo interpretation', () => {
  it.each(['empty', 'partial', 'furnished'] as const)(
    'passes %s through actual HTTP/grant/use case with zero paid dispatch',
    async (condition) => {
      const { app, runtime, log } = setup(),
        input = await recognitionInput();
      input.condition = condition;
      const post = (path: string, body: unknown) =>
        request(app)
          .post('/v1/' + path)
          .set('Authorization', `Bearer ${secret}`)
          .set('Origin', origin)
          .send(JSON.stringify(body))
          .set('Content-Type', 'application/json');
      const grant = await post('admission', { input, proof: null });
      expect(grant.status).toBe(200);
      expect(runtime.operations.calls()).toBe(0);
      const result = await post('recognize-room', {
        input,
        grant: grant.body.grant,
      });
      expect(result.status).toBe(200);
      expect(result.body.kind).toBe('completed');
      expect(result.body.simulation).toBe(true);
      expect(result.body.draft.observations.length).toBe(
        condition === 'empty' ? 0 : 1,
      );
      expect(runtime.operations.calls()).toBe(1);
      expect(runtime.meteredDispatches()).toBe(0);
      expect(JSON.stringify(log.mock.calls)).not.toMatch(
        /base64|private-bridge|photo|room_observations/,
      );
      expect(runtime.readiness.ai).toBe('fake-ready');
      runtime.operations.close();
    },
  );
  it('actually decodes pixels and re-encodes before provider transfer; header-valid corrupt pixels never dispatch', async () => {
    const input = await recognitionInput(),
      prepared = await prepareRecognitionImages(
        input,
        new AbortController().signal,
      );
    expect(prepared[0]!.data).not.toBe(input.images[0]!.data);
    const bytes = Buffer.from(input.images[0]!.data, 'base64'),
      start = bytes.indexOf(Buffer.from([255, 218]));
    const corrupt = Buffer.concat([
      bytes.subarray(0, start + 2 + bytes.readUInt16BE(start + 2)),
      Buffer.from([255, 217]),
    ]);
    // Full container framing is accepted; actual pixel decoding must still reject.
    decodeInput(corrupt);
    input.images[0]!.data = corrupt.toString('base64');
    input.manifest[0]!.bytes = corrupt.length;
    await expect(
      prepareRecognitionImages(input, new AbortController().signal),
    ).rejects.toThrow();
    const { runtime } = setup(),
      grant = await runtime.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
    expect('grant' in grant).toBe(true);
    if ('grant' in grant) {
      const result = await runtime.operations.run(
        input,
        grant.grant,
        new AbortController().signal,
      );
      expect('kind' in result && result.kind).toBe('invalid-image');
    }
    expect(runtime.operations.calls()).toBe(0);
    runtime.operations.close();
  });
  it('does not accept EXIF rotation at the normalized server boundary', async () => {
    const input = await recognitionInput(),
      raw = await readFile(
        new URL('./fixtures/intake/orientation.jpg', import.meta.url),
      );
    input.images[0]!.data = raw.toString('base64');
    input.manifest[0]!.bytes = raw.length;
    await expect(
      prepareRecognitionImages(input, new AbortController().signal),
    ).rejects.toThrow('image-orientation');
  });
  it.each([
    'refused',
    'incomplete',
    'malformed',
    'too-large',
    'unavailable',
  ] as const)('keeps %s distinct with no hidden retry', async (kind) => {
    const { runtime } = setup(async () => ({ kind })),
      input = await recognitionInput();
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
    expect('kind' in result && result.kind).toBe(kind);
    expect(runtime.operations.calls()).toBe(1);
    runtime.operations.close();
  });
  it('rejects malformed/confirmed/foreign evidence; incomplete hypotheses remain useful', () => {
    const raw = recognitionFixture('occluded', ['photo']);
    expect(parseDraftHypothesis(raw, ['photo'])).not.toBeNull();
    const bad = structuredClone(raw);
    const confirmed = {
      ...bad.observations[0]!.width,
      value: 1200,
      status: 'confirmed',
      sourceId: 'photo',
    };
    const unsafe = {
      ...bad,
      observations: [{ ...bad.observations[0], width: confirmed }],
    };
    expect(parseDraftHypothesis(unsafe, ['photo'])).toBeNull();
    expect(
      parseDraftHypothesis(
        {
          ...raw,
          observations: [
            {
              ...raw.observations[0],
              width: { value: 1200, status: 'scan-derived', sourceId: 'photo' },
            },
          ],
        },
        ['photo'],
      ),
    ).toBeNull();
    expect(parseDraftHypothesis({ ...raw, extra: true }, ['photo'])).toBeNull();
    raw.observations[0]!.hinge = 'left';
    expect(parseDraftHypothesis(raw, ['photo'])).toBeNull();
    raw.observations[0]!.hingeEvidence = {
      status: 'estimated',
      sourceId: 'foreign',
    };
    expect(parseDraftHypothesis(raw, ['photo'])).toBeNull();
  });
  it('prepares a strict fixed image request with no URLs/tools/canonical IDs; real mode stays closed', async () => {
    const input = await recognitionInput(),
      prepared = await prepareRecognitionImages(
        input,
        new AbortController().signal,
      ),
      r = recognitionRequest(input, prepared);
    expect(r.tools).toEqual([]);
    const body = JSON.parse(responseBody(r, 'unverified-model')) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      store: false,
      background: false,
      stream: false,
      parallel_tool_calls: false,
    });
    expect(r.format.schema.additionalProperties).toBe(false);
    expect(JSON.stringify(r)).not.toMatch(
      /https:|workspaceId|private-photo|operationId/,
    );
    expect(r.instructions).toMatch(/untrusted evidence/);
    expect(r.instructions).toMatch(/Never confirmed/);
    expect(
      recognitionInputSchema.safeParse({ ...input, condition: undefined })
        .success,
    ).toBe(false);
    const runtime = createRuntime(
      parseRuntimeConfig({
        FAKE_MODE: 'false',
        PAID_DEMO_ENABLED: 'true',
        OPENAI_API_KEY: 'synthetic',
        OPENAI_MODEL: 'unverified',
        LIVE_POLICY_REVIEWED: 'true',
        ROOMEDY_BRIDGE_SECRET: secret,
      }),
      {
        now: Date.now,
        nextId: identityIds(),
        log: vi.fn(),
        provider: createRecognitionFakeProvider(),
        handlers: {
          'recognize-room': createRecognitionHandler(vi.fn(), identityIds()),
        },
      },
    );
    expect(runtime.publicConfig.capabilities.recognition).toBe(false);
    expect(runtime.meteredDispatches()).toBe(0);
    runtime.operations.close();
  });
});
describe('independent authored review cases', () => {
  it.each([
    'empty',
    'repeated-desk',
    'missed-opening',
    'wrong-category',
    'unknown-hinge',
    'occluded',
    'hostile-text',
    'two-identical',
  ] as RecognitionCase[])('%s remains a provisional review', (kind) => {
    let n = 0;
    const d = take(
      adoptHypothesis(
        draft(),
        recognitionFixture(kind, ['photo', 'other']),
        () => `piece_${++n}`,
      ),
    );
    expect(d.room.furniture.length).toBe(
      kind === 'empty' ? 0 : kind === 'two-identical' ? 4 : 1,
    );
    expect(d.frameReviewed).toBe(false);
    expect(JSON.stringify(d.room)).not.toMatch(/confirmed/);
    if (kind === 'unknown-hinge')
      expect(
        d.room.room.features[0]?.kind === 'door' &&
          d.room.room.features[0].hinge,
      ).toBe('unknown');
  });
  it('preserves stable IDs, corrections/planned pose across order, renamed refs, missing views and removal', () => {
    let n = 0,
      d = take(
        adoptHypothesis(
          draft(),
          recognitionFixture('repeated-desk', ['photo', 'other']),
          () => `piece_${++n}`,
        ),
      );
    const id = d.room.furniture[0]!.id;
    d = take(
      correctDraft(d, [
        {
          type: 'confirm-measurement',
          target: { kind: 'furniture', id, field: 'width' },
          value: 1501,
        },
        {
          type: 'move',
          id,
          pose: { centerX: 1500.5, centerZ: 1800, quarterTurns: 1 },
        },
      ]),
    );
    const h = recognitionFixture('repeated-desk', ['other', 'photo']);
    h.observations.forEach((o) => (o.ref = 'renamed_' + o.ref));
    h.groups = [h.observations.map((o) => o.ref)];
    d = take(adoptHypothesis(d, h, () => `piece_${++n}`));
    expect(d.room.furniture).toHaveLength(1);
    expect(d.room.furniture[0]!.id).toBe(id);
    expect(d.room.furniture[0]!.pose.centerX).toBe(1500.5);
    expect(d.room.furniture[0]!.dimensions.width.value).toBe(1501);
    d.sources[1]!.available = false;
    d = take(
      adoptHypothesis(
        d,
        recognitionFixture('repeated-desk', ['photo']),
        () => `piece_${++n}`,
      ),
    );
    expect(d.room.furniture).toHaveLength(1);
    d = take(removeDraftPiece(d, id));
    const retry = recognitionFixture('repeated-desk', ['photo']);
    retry.observations[0]!.ref = 'new_ref';
    retry.groups = [['new_ref']];
    d = take(adoptHypothesis(d, retry, () => `piece_${++n}`));
    expect(d.room.furniture).toHaveLength(0);
  });
  it('does not silently merge existing distinct pieces or choose a conflicting wall', () => {
    let n = 0;
    const h = recognitionFixture('repeated-desk', ['photo', 'other']);
    h.groups = h.observations.map((o) => [o.ref]);
    let d = take(adoptHypothesis(draft(), h, () => `piece_${++n}`));
    expect(d.room.furniture).toHaveLength(2);
    h.groups = [h.observations.map((o) => o.ref)];
    d = take(adoptHypothesis(d, h, () => `piece_${++n}`));
    expect(d.room.furniture).toHaveLength(2);
    const conflict = recognitionFixture('repeated-desk', ['photo', 'other']);
    conflict.observations.forEach((o, i) => {
      o.kind = 'window';
      o.catalogueId = null;
      o.wall = i ? 'east' : 'west';
      o.wallEvidence = { status: 'estimated', sourceId: o.sourceId };
    });
    d = take(adoptHypothesis(draft(), conflict, () => `feature_${++n}`));
    expect(d.room.room.features).toHaveLength(0);
    expect(d.observations).toHaveLength(2);
  });
});

it('unsupported categories remain unassigned and correctable without inventing a similar object', () => {
  const h = recognitionFixture('occluded', ['photo']);
  h.observations[0]!.catalogueId = 'unsupported-appliance';
  let n = 0;
  const d = take(adoptHypothesis(draft(['photo']), h, () => `piece_${++n}`));
  expect(d.observations).toHaveLength(1);
  expect(d.room.furniture).toHaveLength(0);
  expect(d.frameReviewed).toBe(false);
});
