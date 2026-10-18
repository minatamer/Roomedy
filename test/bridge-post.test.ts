import { it, expect, vi } from 'vitest';
import { bridgePost } from '../apps/frontend/src/server/bridge-post.js';
import { POLICY } from '@roomedy/contracts/policy';
import { operationInput, operationResult } from './fixtures/operation.js';
const config = {
  backendOrigin: 'http://127.0.0.1:4321',
  publicOrigin: 'http://127.0.0.1:4320',
  secret: 'private-bridge-fixture',
};
const request = (operation = 'admission', extra: Record<string, string> = {}) =>
  new Request(`${config.publicOrigin}/api/roomedy/v1/${operation}`, {
    method: 'POST',
    headers: {
      Origin: config.publicOrigin,
      'Content-Type': 'application/json',
      ...extra,
    },
    body: JSON.stringify(
      operation === 'admission'
        ? { input: operationInput(), proof: null }
        : { input: operationInput(), grant: 'grant' },
    ),
  });
it('forwards only one fixed authenticated JSON mutation and projects safe upstream errors', async () => {
  let calls = 0;
  const response = await bridgePost(
    'admission',
    request('admission', {
      Authorization: 'browser-forgery',
      'X-Private-Target': 'foreign',
    }),
    config,
    async (url, options) => {
      calls++;
      expect(String(url)).toBe('http://127.0.0.1:4321/v1/admission');
      expect(options).toMatchObject({
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        headers: { Authorization: 'Bearer private-bridge-fixture' },
      });
      expect(options!.headers).not.toHaveProperty('X-Private-Target');
      return Response.json({
        kind: 'granted',
        grant: 'opaque',
        expiresAt: 120000,
        simulation: true,
      });
    },
  );
  expect(response.status).toBe(200);
  expect(calls).toBe(1);
  const error = await bridgePost(
    'assistant',
    request('assistant'),
    config,
    async () =>
      Response.json(
        {
          error: {
            code: 'internal-error',
            message: 'private exception payload',
            reference: 'synthetic-secret',
            retryable: false,
          },
        },
        { status: 500 },
      ),
  );
  expect(await error.text()).not.toMatch(/private exception|synthetic-secret/);
});
it('rejects foreign context/query/codec/body limits before forwarding; preserves local zero-dispatch', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    return Response.json({});
  };
  for (const value of [
    request('admission', { Origin: 'https://foreign.test' }),
    request('admission', { 'Sec-Fetch-Site': 'cross-site' }),
    request('admission?target=foreign'),
    request('admission', {
      'Content-Length': String(POLICY.preparedProviderRequestBytes + 1),
    }),
    request('admission', { 'Content-Type': 'text/plain' }),
  ])
    expect(
      (await bridgePost('admission', value, config, fetcher)).status,
    ).toBeGreaterThanOrEqual(400);
  expect(
    (
      await bridgePost(
        'admission',
        request(),
        { ...config, secret: '' },
        fetcher,
      )
    ).status,
  ).toBe(503);
  expect(calls).toBe(0);
});
it('bounds actual tiny stream fragments and cancels request ownership on rejection', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      c.enqueue(new Uint8Array());
    },
    cancel() {
      cancelled = true;
    },
  });
  const req = new Request(`${config.publicOrigin}/api/roomedy/v1/admission`, {
    method: 'POST',
    headers: {
      Origin: config.publicOrigin,
      'Content-Type': 'application/json',
    },
    body,
    duplex: 'half',
  } as RequestInit);
  const result = await bridgePost('admission', req, config, async () => {
    throw new Error('must-not-forward');
  });
  expect(result.status).toBe(413);
  expect(cancelled).toBe(true);
});
it('preserves exact semantic identity and strips no useful operation result', async () => {
  const result = operationResult(operationInput());
  const response = await bridgePost(
    'assistant',
    request('assistant'),
    config,
    async () => Response.json(result),
  );
  expect(await response.json()).toEqual(result);
});
it('bounds unresolved upstream attempts when abort is ignored, then reuses only settled slots', async () => {
  vi.useFakeTimers();
  const resolve: ((response: Response) => void)[] = [];
  const fetcher: typeof fetch = () => new Promise((r) => resolve.push(r));
  try {
    const a = bridgePost('admission', request(), config, fetcher),
      b = bridgePost('admission', request(), config, fetcher);
    await vi.advanceTimersByTimeAsync(0);
    expect(resolve).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(POLICY.operationBridgeMs);
    expect((await a).status).toBe(504);
    expect((await b).status).toBe(504);
    expect(
      (await bridgePost('admission', request(), config, fetcher)).status,
    ).toBe(429);
    for (const done of resolve)
      done(
        Response.json({
          kind: 'granted',
          grant: 'opaque',
          expiresAt: 1,
          simulation: true,
        }),
      );
    await vi.advanceTimersByTimeAsync(0);
    expect(
      (
        await bridgePost('admission', request(), config, async () =>
          Response.json({
            kind: 'verification',
            state: 'interaction',
            simulation: true,
          }),
        )
      ).status,
    ).toBe(200);
  } finally {
    vi.useRealTimers();
  }
});
