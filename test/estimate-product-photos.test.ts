import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProductChoice } from '@roomedy/contracts/estimates';
import {
  captureProductPhotos,
  normalizeProductPhoto,
} from '../apps/frontend/src/features/cost/product-photos.js';
afterEach(() => vi.unstubAllGlobals());
const jpeg = Uint8Array.from([
  255, 216, 255, 192, 0, 17, 8, 0, 2, 0, 2, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0,
  255, 217,
]);
const choice = (
  key: string,
  imageUrl: string | null = 'https://cdn.example/product.jpg',
): ProductChoice => ({
  key,
  imageUrl,
  url: 'https://merchant.example/' + key,
  scope: 'scope',
  label: key,
  simulation: false,
  offerId: null,
  quotedPrice: null,
});
describe('finite snapshot-bound export photos', () => {
  it('normalizes Web raster ownership to a contained small JPEG and releases bitmap/canvas resources', async () => {
    const bitmap = { width: 1600, height: 800, close: vi.fn() },
      dimensions: number[][] = [];
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() },
      canvas = {
        width: 0,
        height: 0,
        getContext: () => context,
        toBlob: (callback: (b: Blob) => void) => {
          dimensions.push([canvas.width, canvas.height]);
          callback(new Blob([jpeg], { type: 'image/jpeg' }));
        },
      };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => bitmap),
    );
    vi.stubGlobal('document', { createElement: () => canvas });
    const raw = new Uint8Array(jpeg);
    raw[7] = 3;
    raw[8] = 32;
    raw[9] = 6;
    raw[10] = 64;
    expect(
      await normalizeProductPhoto(raw, new AbortController().signal),
    ).toEqual(jpeg);
    expect(dimensions).toEqual([[480, 240]]);
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
  });
  it('closes a late bitmap when cancellation wins the decode race', async () => {
    let finish: (value: {
      width: number;
      height: number;
      close: () => void;
    }) => void = () => {};
    vi.stubGlobal(
      'createImageBitmap',
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const abort = new AbortController(),
      close = vi.fn(),
      pending = normalizeProductPhoto(jpeg, abort.signal);
    abort.abort();
    await expect(pending).rejects.toThrow();
    finish({ width: 2, height: 2, close });
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
  });
  it('requests only selected safe image URLs, deduplicates shared media and retains each exact product binding', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } }),
    ) as unknown as typeof fetch;
    const normalize = vi.fn(async () => jpeg),
      input = [
        choice('bed'),
        choice('wardrobe'),
        choice('floor', null),
        choice('wall', 'http://unsafe.example/a'),
      ];
    const before = JSON.stringify(input),
      photos = await captureProductPhotos(
        input,
        new AbortController().signal,
        () => {},
        fetcher,
        normalize,
      );
    expect(photos.map((p) => p.key).sort()).toEqual(['bed', 'wardrobe']);
    expect(normalize).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(photos[0]?.url).toBe('https://merchant.example/' + photos[0]?.key);
    expect(JSON.stringify(input)).toBe(before);
    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toBe(
      '/api/roomedy/v1/product-photo',
    );
  });
  it('keeps unavailable, HTML, corrupt, oversized and invalid-normalization media optional', async () => {
    for (const response of [
      () => new Response(null, { status: 404 }),
      () =>
        new Response('<html/>', { headers: { 'Content-Type': 'text/html' } }),
      () => new Response('bad', { headers: { 'Content-Type': 'image/jpeg' } }),
      () =>
        new Response(new Uint8Array(4 * 1024 * 1024 + 1), {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
    ]) {
      expect(
        await captureProductPhotos(
          [choice('bed')],
          new AbortController().signal,
          () => {},
          async () => response(),
          async () => jpeg,
        ),
      ).toEqual([]);
    }
    expect(
      await captureProductPhotos(
        [choice('bed')],
        new AbortController().signal,
        () => {},
        async () =>
          new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } }),
        async () => new Uint8Array([1]),
      ),
    ).toEqual([]);
  });
  it('stops late optional work on lifecycle cancellation and performs no financial mutation', async () => {
    const abort = new AbortController();
    let finish: (r: Response) => void = () => {};
    const pending = captureProductPhotos(
      [choice('bed')],
      abort.signal,
      () => {},
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      async () => jpeg,
    );
    abort.abort();
    expect(await pending).toEqual([]);
    finish(new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } }));
  });
  it('fences already expired exports before requesting a photo', async () => {
    const fetcher = vi.fn();
    await expect(
      captureProductPhotos(
        [choice('bed')],
        new AbortController().signal,
        () => {
          throw new Error('expired');
        },
        fetcher,
      ),
    ).rejects.toThrow('expired');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
