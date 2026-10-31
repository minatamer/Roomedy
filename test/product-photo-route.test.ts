import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createProductPhotoHandler,
  publicPhotoAddress,
} from '../apps/frontend/src/server/product-photo.js';
const jpeg = Uint8Array.from([
  255, 216, 255, 192, 0, 17, 8, 0, 2, 0, 2, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0,
  255, 217,
]);
const origin = 'http://127.0.0.1:4320';
const req = (
  imageUrl = 'https://cdn.example/product.jpg',
  options: RequestInit = {},
) =>
  new Request(origin + '/api/roomedy/v1/product-photo', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'Sec-Fetch-Site': 'same-origin',
    },
    body: JSON.stringify({ imageUrl }),
    ...options,
  });
afterEach(() => vi.useRealTimers());
describe('bounded optional product-photo route', () => {
  it('pins a public address, returns sniffed raster bytes and never forwards caller credentials', async () => {
    const read = vi.fn(
        async (_url: URL, _address: string, _signal: AbortSignal) => jpeg,
      ),
      resolve = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
    const handler = createProductPhotoHandler(resolve, read),
      r = await handler(req(), origin);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('image/jpeg');
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(jpeg);
    expect(read.mock.calls[0]?.[1]).toBe('93.184.216.34');
  });
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '203.0.113.1',
    '::1',
  ])('rejects private/reserved or mixed DNS answers: %s', async (address) => {
    expect(publicPhotoAddress(address)).toBe(false);
    const read = vi.fn(async () => jpeg),
      handler = createProductPhotoHandler(
        async () => [
          { address: '93.184.216.34', family: 4 },
          { address, family: 4 },
        ],
        read,
      );
    expect((await handler(req(), origin)).status).toBe(404);
    expect(read).not.toHaveBeenCalled();
  });
  it.each([
    'http://cdn.example/a.jpg',
    'https://localhost/a.jpg',
    'https://foo.local/a.jpg',
    'https://user:pass@cdn.example/a.jpg',
    'https://cdn.example:8443/a.jpg',
    'https://127.0.0.1/a.jpg',
  ])('rejects a nonpublic URL before DNS: %s', async (url) => {
    const resolve = vi.fn(async () => []),
      handler = createProductPhotoHandler(resolve);
    expect((await handler(req(url), origin)).status).toBe(400);
    expect(resolve).not.toHaveBeenCalled();
  });
  it('requires exact POST path, same origin and JSON, and bounds the input body', async () => {
    const resolve = vi.fn(async () => []),
      handler = createProductPhotoHandler(resolve);
    expect(
      (
        await handler(
          req(undefined, {
            headers: {
              Origin: 'https://other.example',
              'Content-Type': 'application/json',
            },
          }),
          origin,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handler(
          req(undefined, {
            headers: { Origin: origin, 'Content-Type': 'text/plain' },
          }),
          origin,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handler(
          new Request(origin + '/api/roomedy/v1/product-photo?q=1'),
          origin,
        )
      ).status,
    ).toBe(400);
    expect(
      (await handler(req('https://cdn.example/' + 'a'.repeat(5000)), origin))
        .status,
    ).toBe(404);
    expect(resolve).not.toHaveBeenCalled();
  });
  it('rejects nonraster, oversized and excessive-pixel media', async () => {
    for (const value of [
      new TextEncoder().encode('<svg/>'),
      new Uint8Array(4 * 1024 * 1024 + 1),
      new Uint8Array([
        ...jpeg.slice(0, 7),
        255,
        255,
        255,
        255,
        ...jpeg.slice(11),
      ]),
    ]) {
      const handler = createProductPhotoHandler(
        async () => [{ address: '93.184.216.34', family: 4 }],
        async () => value,
      );
      expect((await handler(req(), origin)).status).toBe(404);
    }
  });
  it('retains two unresolved slots after timeout until the underlying DNS work actually finishes', async () => {
    vi.useFakeTimers();
    const finish: ((v: { address: string; family: number }[]) => void)[] = [];
    const handler = createProductPhotoHandler(
      () => new Promise((resolve) => finish.push(resolve)),
    );
    const a = handler(req(), origin),
      b = handler(req(), origin);
    await vi.advanceTimersByTimeAsync(4501);
    expect((await a).status).toBe(408);
    expect((await b).status).toBe(408);
    expect((await handler(req(), origin)).status).toBe(429);
    finish.forEach((resolve) => resolve([]));
    await vi.advanceTimersByTimeAsync(1);
    const aborted = new AbortController();
    aborted.abort();
    expect(
      (await handler(req(undefined, { signal: aborted.signal }), origin))
        .status,
    ).not.toBe(429);
  });
});
