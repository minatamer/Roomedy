import { it, expect, vi } from 'vitest';
import { serviceFetch } from '../apps/frontend/src/server/service-identity.js';
const origin = 'https://roomedy-backend.example';
const token = (aud = origin) =>
  `header.${Buffer.from(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`;
it('uses a fixed audience-bound metadata token in a separate serverless header, cached and never requested in local mode', async () => {
  const expectedToken = token();
  let metadata = 0,
    upstream = 0;
  const transport: typeof fetch = async (url, init) => {
    if (String(url).startsWith('http://metadata.google.internal/')) {
      metadata++;
      const u = new URL(String(url));
      expect(u.pathname).toBe(
        '/computeMetadata/v1/instance/service-accounts/default/identity',
      );
      expect(u.searchParams.get('audience')).toBe(origin);
      expect(init).toMatchObject({
        redirect: 'error',
        cache: 'no-store',
        headers: { 'Metadata-Flavor': 'Google' },
      });
      return new Response(expectedToken, {
        headers: { 'Metadata-Flavor': 'Google' },
      });
    }
    upstream++;
    const h = new Headers(init?.headers);
    expect(h.get('X-Serverless-Authorization')).toBe('Bearer ' + expectedToken);
    expect(h.get('Authorization')).toBe('Bearer synthetic-bridge');
    return Response.json({ status: 'ok' });
  };
  const authenticated = serviceFetch(origin, 'gcp-metadata', transport);
  await Promise.all([
    authenticated(origin + '/v1/health', {
      headers: { Authorization: 'Bearer synthetic-bridge' },
    }),
    authenticated(origin + '/v1/config', {
      headers: { Authorization: 'Bearer synthetic-bridge' },
    }),
  ]);
  expect(metadata).toBe(1);
  expect(upstream).toBe(2);
  await expect(
    authenticated('https://other.example/v1/health'),
  ).rejects.toThrow('service-identity');
  expect(metadata).toBe(1);
  const local = vi.fn<typeof fetch>(async (_url, init) => {
    expect(new Headers(init?.headers).has('X-Serverless-Authorization')).toBe(
      false,
    );
    return Response.json({ status: 'ok' });
  });
  await serviceFetch(
    'http://127.0.0.1:4321',
    'none',
    local,
  )('http://127.0.0.1:4321/v1/health', {
    headers: { 'X-Serverless-Authorization': 'untrusted' },
  });
  expect(local).toHaveBeenCalledTimes(1);
});
it.each([
  'wrong-audience',
  'too-large',
  'too-many-fragments',
  'wrong-flavor',
] as const)(
  'rejects %s metadata without calling the private service',
  async (kind) => {
    const transport = vi.fn<typeof fetch>(async () => {
      const body =
        kind === 'too-many-fragments'
          ? new ReadableStream({
              start(c) {
                for (let i = 0; i < 65; i++) c.enqueue(new Uint8Array([97]));
                c.close();
              },
            })
          : kind === 'too-large'
            ? 'a'.repeat(16_385)
            : token(
                kind === 'wrong-audience' ? 'https://other.example' : origin,
              );
      return new Response(body, {
        headers: {
          'Metadata-Flavor': kind === 'wrong-flavor' ? 'other' : 'Google',
        },
      });
    });
    await expect(
      serviceFetch(origin, 'gcp-metadata', transport)(origin + '/v1/health'),
    ).rejects.toBeDefined();
    expect(transport).toHaveBeenCalledTimes(1);
  },
);
it('bounds an abort-ignoring metadata refresh and retains its slot rather than starting more remote work', async () => {
  vi.useFakeTimers();
  const transport = vi.fn<typeof fetch>(() => new Promise(() => undefined)),
    authenticated = serviceFetch(origin, 'gcp-metadata', transport);
  try {
    const first = authenticated(origin + '/v1/health');
    const rejected = expect(first).rejects.toThrow('service-identity');
    await vi.advanceTimersByTimeAsync(2001);
    await rejected;
    await expect(authenticated(origin + '/v1/health')).rejects.toThrow(
      'service-identity',
    );
    expect(transport).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
