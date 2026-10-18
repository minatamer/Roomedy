import { it, expect, vi } from 'vitest';
import request from 'supertest';
import { releaseTransport } from '../apps/frontend/src/features/session/release-client.js';
import {
  releaseMismatch,
  stampRelease,
} from '../apps/frontend/src/server/release-response.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import { draftFromPhotos } from '../apps/frontend/src/features/room-intake/recognition-client.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  projectOf,
  recoveryOf,
  readRecovery,
} from '../apps/frontend/src/features/session/project.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { commandRoom, piece } from './fixtures/command-room.js';
import { identityIds, operationInput } from './fixtures/operation.js';
const a = 'a'.repeat(64),
  b = 'b'.repeat(64);
it('fences old JavaScript against a new API before any accepted edit, keeps export/recovery and never reloads/retries', async () => {
  const session = new SessionController(commandRoom([piece('desk')]), {
    now: () => 1000,
  });
  const before = projectOf(session.getSnapshot()),
    old = session.beginOperation()!;
  const backend = vi.fn<typeof fetch>(async (_url, init) => {
    const req = new Request('http://127.0.0.1/api/roomedy/v1/admission', {
      ...init,
      method: 'POST',
    });
    return releaseMismatch(req, b)!;
  });
  const transport = releaseTransport(
    backend,
    () => session.clientPartFailed(),
    a,
  );
  await expect(
    transport('/api/roomedy/v1/admission', { method: 'POST' }),
  ).rejects.toThrow('client-release');
  expect(backend).toHaveBeenCalledTimes(1);
  expect(session.isCurrent(old)).toBe(false);
  expect(session.canEdit()).toBe(false);
  expect(projectOf(session.getSnapshot())).toEqual(before);
  expect(
    readRecovery(JSON.stringify(recoveryOf(session.getSnapshot())), 1000).ok,
  ).toBe(true);
  session.dispose();
});
it('accepts matching rollback build identities and rejects missing old response identity', async () => {
  const mismatch = vi.fn();
  const matching = releaseTransport(
    async () => stampRelease(Response.json({ status: 'ok' }), a),
    mismatch,
    a,
  );
  expect((await matching('/api/roomedy/v1/config')).ok).toBe(true);
  expect(mismatch).not.toHaveBeenCalled();
  await expect(
    releaseTransport(
      async () => Response.json({ status: 'ok' }),
      mismatch,
      a,
    )('/api/roomedy/v1/config'),
  ).rejects.toThrow('client-release');
  expect(mismatch).toHaveBeenCalledTimes(1);
  expect(
    releaseMismatch(new Request('http://localhost/api/roomedy/v1/config'), a),
  ).toBeNull();
  expect(
    releaseMismatch(
      new Request('http://localhost/api/roomedy/v1/assistant', {
        method: 'POST',
      }),
      a,
    )?.status,
  ).toBe(409);
  expect(
    releaseMismatch(
      new Request('http://localhost/api/roomedy/v1/assistant', {
        method: 'POST',
      }),
      a,
    )?.headers.get('x-content-type-options'),
  ).toBe('nosniff');
});
it('rejects frontend/backend release disagreement before grants/provider work while health stays content-free', async () => {
  const runtime = createRuntime(
      parseRuntimeConfig({
        ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge',
        ROOMEDY_RELEASE_ID: b,
      }),
      { now: Date.now, nextId: identityIds(), log: vi.fn() },
    ),
    app = createApp(runtime);
  try {
    const denied = await request(app)
      .post('/v1/admission')
      .set('X-Roomedy-Release', a)
      .send({});
    expect(denied.status).toBe(409);
    expect(denied.headers['x-roomedy-release']).toBe(b);
    expect(denied.headers['x-content-type-options']).toBe('nosniff');
    expect(runtime.operations.calls()).toBe(0);
    expect(runtime.meteredDispatches()).toBe(0);
    const health = await request(app).get('/v1/health');
    expect(health.body).toEqual({ status: 'ok' });
    expect(health.headers['cache-control']).toBe('no-store');
  } finally {
    runtime.operations.close();
  }
});

it('keeps transient photos and visitor draft corrections when an old intake meets a changed API', async () => {
  vi.stubEnv('NEXT_PUBLIC_ROOMEDY_RELEASE_ID', a);
  const session = new SessionController(),
    ids = identityIds('photo-update');
  const review = new ReviewController(session, 'partial', ids, {
    id: ids,
    createUrl: () => 'blob:synthetic-update',
    revokeUrl: () => undefined,
    prepare: async () => ({
      normalized: new Blob(['prepared'], { type: 'image/jpeg' }),
      preview: new Blob(['preview'], { type: 'image/jpeg' }),
      type: 'image/jpeg',
      inputWidth: 10,
      inputHeight: 10,
      width: 10,
      height: 10,
      decodeMs: 0,
      prepareMs: 0,
    }),
  });
  try {
    review.addPhotos([new File(['raw'], 'synthetic.jpg')], 'room');
    await vi.waitFor(() =>
      expect(review.photos.getSnapshot()[0]?.status).toBe('ready'),
    );
    review.shape('rectangle');
    const before = structuredClone(review.getSnapshot().draft);
    const transport = vi.fn<typeof fetch>(async (_url, init) =>
      releaseMismatch(
        new Request('http://localhost/api/roomedy/v1/admission', {
          ...init,
          method: 'POST',
        }),
        b,
      )!,
    );
    await draftFromPhotos(review, transport);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(review.getSnapshot().draft).toEqual(before);
    expect(review.getSnapshot().message).toContain('This version changed');
    expect(review.photos.getSnapshot()[0]?.status).toBe('ready');
    expect(review.photos.preparedRequest()).not.toBeNull();
    expect(review.accept()).toBe(true);
  } finally {
    session.dispose();
    vi.unstubAllEnvs();
  }
});

it('rejects schema/catalogue/rules mismatch even with a matching release header, before grant or provider work', async () => {
  const runtime = createRuntime(
      parseRuntimeConfig({
        ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge',
        ROOMEDY_RELEASE_ID: b,
      }),
      { now: Date.now, nextId: identityIds(), log: vi.fn() },
    ),
    app = createApp(runtime);
  try {
    for (const field of ['schemaVersion', 'catalogueVersion', 'rulesVersion']) {
      const input = { ...operationInput(), [field]: 99 };
      const denied = await request(app)
        .post('/v1/admission')
        .set('X-Roomedy-Release', b)
        .set('Authorization', 'Bearer synthetic-bridge')
        .set('Origin', 'http://127.0.0.1:4320')
        .send({ input, proof: null });
      expect(denied.status).toBe(400);
      expect(runtime.operations.calls()).toBe(0);
      expect(runtime.meteredDispatches()).toBe(0);
    }
  } finally {
    runtime.operations.close();
  }
});
