import { it, expect, vi } from 'vitest';
import request from 'supertest';
import { EventEmitter } from 'node:events';
import { POLICY } from '@roomedy/contracts/policy';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import { readBody } from '../apps/backend/src/http/body.js';
type Request = Parameters<typeof readBody>[0];
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import {
  operationInput,
  operationResult,
  identityIds,
} from './fixtures/operation.js';
const origin = 'http://127.0.0.1:4320',
  secret = 'synthetic-bridge';
function fixture() {
  let count = 0;
  const runtime = createRuntime(
    parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: secret }),
    {
      now: Date.now,
      nextId: identityIds(),
      log: vi.fn(),
      provider: createFakeProvider(),
      handlers: {
        assistant: async (input) => {
          count++;
          return operationResult(input);
        },
      },
    },
  );
  return { runtime, app: createApp(runtime), calls: () => count };
}
it('enforces private identity/origin/fixed path-method-query before granting and consuming once', async () => {
  const { app, runtime, calls } = fixture(),
    input = operationInput();
  expect((await request(app).get('/v1/health?target=foreign')).status).toBe(
    400,
  );
  expect((await request(app).put('/v1/assistant')).status).toBe(400);
  expect((await request(app).post('/v1/assistant/')).status).toBe(404);
  expect(
    (await request(app).post('/v1/admission').send({ input, proof: null }))
      .status,
  ).toBe(403);
  const admission = await request(app)
    .post('/v1/admission')
    .set('Authorization', `Bearer ${secret}`)
    .set('Origin', origin)
    .send({ input, proof: null });
  expect(admission.status).toBe(200);
  expect(admission.body.simulation).toBe(true);
  expect(calls()).toBe(0);
  const substituted = await request(app)
    .post('/v1/assistant')
    .set('Authorization', `Bearer ${secret}`)
    .set('Origin', origin)
    .send({
      input: { ...input, text: 'Substituted request.' },
      grant: admission.body.grant,
    });
  expect(substituted.status).toBe(409);
  expect(calls()).toBe(0);
  const send = () =>
    request(app)
      .post('/v1/assistant')
      .set('Authorization', `Bearer ${secret}`)
      .set('Origin', origin)
      .send({ input, grant: admission.body.grant });
  const [a, b] = await Promise.all([send(), send()]);
  expect([a.status, b.status].sort()).toEqual([200, 409]);
  expect(calls()).toBe(1);
  expect(runtime.meteredDispatches()).toBe(0);
  runtime.operations.close();
});
it('denies early declared oversize and full intake without parsing or provider work, keeping health responsive', async () => {
  const { runtime, app, calls } = fixture();
  const headers = {
    Authorization: `Bearer ${secret}`,
    Origin: origin,
    'Content-Type': 'application/json',
  };
  expect(
    (
      await request(app)
        .post('/v1/admission')
        .set(headers)
        .set('Content-Length', String(POLICY.preparedProviderRequestBytes + 1))
    ).status,
  ).toBe(413);
  const one = runtime.operations.admission.takeIntake()!,
    two = runtime.operations.admission.takeIntake()!;
  expect(
    (await request(app).post('/v1/admission').set(headers).send('{}')).status,
  ).toBe(429);
  expect((await request(app).get('/v1/health')).status).toBe(200);
  one();
  two();
  expect(calls()).toBe(0);
  runtime.operations.close();
});
it('packs chunked body bytes exactly and independently bounds fragments and slow bodies', async () => {
  vi.useFakeTimers();
  function incoming() {
    const stream = new EventEmitter() as EventEmitter & {
      headers: Record<string, string>;
      pause: () => void;
    };
    stream.headers = { 'content-type': 'application/json' };
    stream.pause = vi.fn();
    return stream;
  }
  try {
    const exact = incoming(),
      expected = { label: 'café', values: [1, 2, 3] };
    const read = readBody(
      exact as unknown as Request,
      new AbortController().signal,
    );
    for (const byte of Buffer.from(JSON.stringify(expected)))
      exact.emit('data', Buffer.from([byte]));
    exact.emit('end');
    expect(await read).toEqual(expected);
    const tiny = incoming(),
      rejected = readBody(
        tiny as unknown as Request,
        new AbortController().signal,
      ).catch((e: unknown) => e);
    for (let i = 0; i <= POLICY.requestFragments; i++)
      tiny.emit('data', Buffer.alloc(0));
    expect(await rejected).toMatchObject({ code: 'body-limit' });
    expect(tiny.listenerCount('data')).toBe(0);
    const slow = incoming(),
      expired = readBody(
        slow as unknown as Request,
        new AbortController().signal,
      ).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(POLICY.intakeMs);
    expect(await expired).toMatchObject({ code: 'timeout' });
    expect(slow.listenerCount('data')).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
