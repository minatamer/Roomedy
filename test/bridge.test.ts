import { expect, it } from 'vitest';
import { bridgeGet } from '../apps/frontend/src/server/bridge-core.js';

const signal = () => new AbortController().signal;
const mockFetch =
  (response: Response): typeof fetch =>
  async () =>
    response;
it('forwards only fixed GET health and validates the public response', async () => {
  let requested = '';
  const fetcher: typeof fetch = async (url, options) => {
    requested = String(url);
    expect(options).toMatchObject({
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
    });
    return Response.json({ status: 'ok' });
  };
  const response = await bridgeGet(
    'health',
    'http://127.0.0.1:4321',
    signal(),
    fetcher,
  );
  expect(requested).toBe('http://127.0.0.1:4321/v1/health');
  expect(await response.json()).toEqual({ status: 'ok' });
});
it('rejects leaked config, oversized responses, invalid UTF-8 and non-json without exposing input', async () => {
  for (const result of [
    Response.json({ status: 'ok', secret: 'synthetic-private' }),
    new Response('x'.repeat(17000), {
      headers: { 'Content-Type': 'application/json' },
    }),
    new Response(new Uint8Array([255]), {
      headers: { 'Content-Type': 'application/json' },
    }),
    new Response('private failure'),
  ]) {
    const response = await bridgeGet(
      'health',
      'http://127.0.0.1:4321',
      signal(),
      mockFetch(result),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toMatch(
      /synthetic-private|private failure/,
    );
  }
});
it('rejects excessive fragment overhead and cancels the upstream reader', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      c.enqueue(new Uint8Array());
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = await bridgeGet(
    'health',
    'http://127.0.0.1:4321',
    signal(),
    mockFetch(
      new Response(body, { headers: { 'Content-Type': 'application/json' } }),
    ),
  );
  expect(response.status).toBe(503);
  expect(cancelled).toBe(true);
});
it('does not fetch for an invalid configured origin', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    return Response.json({ status: 'ok' });
  };
  expect(
    (
      await bridgeGet(
        'health',
        'https://private.example/path',
        signal(),
        fetcher,
      )
    ).status,
  ).toBe(503);
  expect(calls).toBe(0);
});
it.each([200, 500])(
  'cancels rejected upstream bodies with status %s',
  async (status) => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode('invalid'));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = await bridgeGet(
      'health',
      'http://127.0.0.1:4321',
      signal(),
      mockFetch(
        new Response(body, {
          status,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );
    expect(response.status).toBe(503);
    expect(cancelled).toBe(true);
  },
);
