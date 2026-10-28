import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageHeader } from '@roomedy/contracts/intake';
import {
  SurfaceAssets,
  SURFACE_ASSETS,
} from '../apps/frontend/src/features/room-view/surface-assets.js';
import type {
  SurfaceIO,
  SurfacePixels,
} from '../apps/frontend/src/features/room-view/surface-assets.js';
import {
  createSurfaces,
  surfaceProperties,
  setSurfaceRepeat,
} from '../apps/frontend/src/features/room-view/surfaces.js';

const png = (kind = 'floor', role = 'detail') =>
  Uint8Array.from(
    readFileSync(`apps/frontend/public/surfaces/${kind}-${role}-v1.png`),
  );
const pixels = (edge: number, normal = false) => {
  const out = new Uint8Array(edge * edge * 4);
  for (let at = 0; at < out.length; at += 4)
    out.set(normal ? [128, 128, 255, 255] : [198, 216, 0, 255], at);
  return out;
};
const io = (): SurfaceIO => ({
  fetch: vi.fn(async (url) => {
    const match =
      /^\/surfaces\/(floor|wood|fabric|plaster)-(detail|normal)-v1\.png$/.exec(
        String(url),
      );
    if (!match) throw new Error('fixture-foreign-url');
    return new Response(png(match[1], match[2]));
  }),
  decode: vi.fn(async (_bytes, edge) => pixels(edge)),
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('scene-owned local material preparation', () => {
  it('prefers HTTP cache only when explicitly selected for the fixed public material images', async () => {
    for (const cache of [undefined, 'force-cache'] as const) {
      const port = io();
      if (cache) port.cache = cache;
      const loader = new SurfaceAssets(vi.fn(), port);
      try {
        expect(await loader.load()).toEqual({ loaded: 4, failed: 0 });
        expect(port.fetch).toHaveBeenCalledTimes(8);
        for (const [url, options] of vi.mocked(port.fetch!).mock.calls) {
          expect(String(url)).toMatch(
            /^\/surfaces\/(floor|wood|fabric|plaster)-(detail|normal)-v1\.png$/,
          );
          expect(options?.cache).toBe(cache);
          expect(options).toMatchObject({
            credentials: 'same-origin',
            redirect: 'error',
          });
        }
      } finally {
        loader.dispose();
      }
    }
  });

  it('does not generate or publish a deferred fallback after external cancellation', async () => {
    const port = io(),
      abort = new AbortController();
    port.deferFallback = true;
    let finish!: (data: Uint8Array<ArrayBuffer>) => void;
    port.decode = vi.fn(
      () =>
        new Promise<Uint8Array<ArrayBuffer>>((resolve) => {
          finish = resolve;
        }),
    );
    const maps = createSurfaces(port),
      original = maps.floor.image;
    const pending = maps.load(abort.signal);
    await vi.waitFor(() => expect(port.decode).toHaveBeenCalledTimes(1));
    abort.abort();
    finish(pixels(512));
    await pending;
    expect(maps.floor.image).toBe(original);
    maps.dispose();
  });

  it('defers landing procedural work until failure while keeping exact fallback dimensions and other photo sets', async () => {
    const port = io(),
      original = port.fetch!;
    port.concurrency = 4;
    port.deferFallback = true;
    port.fetch = vi.fn(async (url, options) =>
      String(url).includes('/floor-')
        ? new Response(null, { status: 404 })
        : original(url, options),
    );
    const maps = createSurfaces(port);
    try {
      const initial = maps.floor.image.data;
      expect(new Set(initial)).toEqual(new Set([255]));
      const pending = maps.load();
      expect(maps.load()).toBe(pending);
      expect(await pending).toEqual({ loaded: 3, failed: 1 });
      expect(maps.floor.image.data).not.toBe(initial);
      expect(maps.floor.image.width).toBe(512);
      expect(maps.floor.image.height).toBe(512);
      expect(new Set(maps.floor.image.data).size).toBeGreaterThan(2);
      expect(Array.from(maps.wood.image.data?.slice(0, 4) ?? [])).toEqual([
        198, 198, 198, 255,
      ]);
      expect([
        ...(surfaceProperties(maps.floor).normalMap?.image.data?.slice(0, 4) ??
          []),
      ]).toEqual([128, 128, 255, 255]);
    } finally {
      maps.dispose();
    }
  });

  it('bounds the landing opt-in to four concurrent material jobs while retaining one load owner', async () => {
    const port = io(),
      apply = vi.fn();
    port.concurrency = 4;
    let active = 0,
      maximum = 0,
      release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    port.decode = vi.fn(async (_bytes, edge) => {
      maximum = Math.max(maximum, ++active);
      await gate;
      active--;
      return pixels(edge);
    });
    const loader = new SurfaceAssets(apply, port),
      pending = loader.load();
    expect(loader.load()).toBe(pending);
    await vi.waitFor(() => expect(port.decode).toHaveBeenCalledTimes(4));
    expect(maximum).toBe(4);
    release();
    expect(await pending).toEqual({ loaded: 4, failed: 0 });
    expect(maximum).toBe(4);
    expect(port.fetch).toHaveBeenCalledTimes(8);
    expect(new Set(apply.mock.calls.map((call) => call[0]))).toEqual(
      new Set(['floor', 'wood', 'fabric', 'plaster']),
    );
    loader.dispose();
  });

  it.each(['dispose', 'abort', 'deadline'])(
    'retires all four parallel material jobs on %s without late application',
    async (retirement) => {
      vi.useFakeTimers();
      const port = io(),
        apply = vi.fn(),
        abort = new AbortController();
      port.concurrency = 4;
      const pendingDecodes: {
        edge: number;
        resolve: (data: Uint8Array<ArrayBuffer>) => void;
      }[] = [];
      port.decode = vi.fn(
        (_bytes, edge) =>
          new Promise<Uint8Array<ArrayBuffer>>((resolve) => {
            pendingDecodes.push({ edge, resolve });
          }),
      );
      const loader = new SurfaceAssets(apply, port),
        pending = loader.load(abort.signal);
      await vi.waitFor(() => expect(pendingDecodes).toHaveLength(4));
      if (retirement === 'dispose') loader.dispose();
      else if (retirement === 'abort') abort.abort();
      else await vi.advanceTimersByTimeAsync(10_000);
      expect(vi.getTimerCount()).toBe(0);
      for (const decode of pendingDecodes) decode.resolve(pixels(decode.edge));
      expect(await pending).toEqual({ loaded: 0, failed: 4 });
      expect(port.fetch).toHaveBeenCalledTimes(4);
      expect(apply).not.toHaveBeenCalled();
      loader.dispose();
    },
  );

  it('retains other material jobs when one parallel set fails early', async () => {
    const port = io(),
      original = port.fetch!,
      apply = vi.fn();
    port.concurrency = 4;
    let finish!: (response: Response) => void;
    port.fetch = vi.fn((url, options) =>
      String(url) === '/surfaces/floor-detail-v1.png'
        ? Promise.resolve(new Response(null, { status: 404 }))
        : String(url) === '/surfaces/wood-normal-v1.png'
          ? new Promise<Response>((resolve) => {
              finish = resolve;
            })
          : original(url, options),
    );
    const loader = new SurfaceAssets(apply, port),
      pending = loader.load();
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(port.fetch).toHaveBeenCalledTimes(7));
    expect(settled).toBe(false);
    finish(new Response(png('wood', 'normal')));
    expect(await pending).toEqual({ loaded: 3, failed: 1 });
    expect(apply.mock.calls.some((call) => call[0] === 'floor')).toBe(false);
    loader.dispose();
  });

  it('starts lazily once and serializes the eight allow-listed reads and decodes', async () => {
    const port = io(),
      apply = vi.fn();
    let active = 0,
      maximum = 0,
      count = 0;
    port.decode = vi.fn(async (_bytes, edge) => {
      maximum = Math.max(maximum, ++active);
      await Promise.resolve();
      active--;
      return pixels(edge, ++count % 2 === 0);
    });
    const loader = new SurfaceAssets(apply, port);
    expect(port.fetch).not.toHaveBeenCalled();
    const pending = loader.load();
    expect(loader.load()).toBe(pending);
    expect(await pending).toEqual({ loaded: 4, failed: 0 });
    expect(maximum).toBe(1);
    expect(port.fetch).toHaveBeenCalledTimes(8);
    expect(port.decode).toHaveBeenCalledTimes(8);
    expect(apply.mock.calls.map((c) => c[0])).toEqual([
      'floor',
      'wood',
      'fabric',
      'plaster',
    ]);
    const first = apply.mock.calls[0]![1] as SurfacePixels;
    expect([...first.color.slice(0, 4)]).toEqual([198, 198, 198, 255]);
    expect([...first.roughness.slice(0, 4)]).toEqual([216, 216, 216, 255]);
    expect([...first.normal.slice(0, 4)]).toEqual([128, 128, 255, 255]);
    for (const call of vi.mocked(port.fetch!).mock.calls)
      expect(call[1]).toMatchObject({
        credentials: 'same-origin',
        redirect: 'error',
      });
    loader.dispose();
  });

  it.each(['detail', 'normal'])(
    'retains one whole fallback if the %s image fails, while other sets finish',
    async (role) => {
      const port = io(),
        original = port.fetch!,
        apply = vi.fn();
      port.fetch = vi.fn(async (url, options) =>
        String(url) === `/surfaces/floor-${role}-v1.png`
          ? new Response(null, { status: 404 })
          : original(url, options),
      );
      const loader = new SurfaceAssets(apply, port);
      expect(await loader.load()).toEqual({ loaded: 3, failed: 1 });
      expect(apply.mock.calls.map((c) => c[0])).toEqual([
        'wood',
        'fabric',
        'plaster',
      ]);
      loader.dispose();
    },
  );

  it.each(['oversize', 'fragments', 'malformed', 'wrong-edge', 'wrong-type'])(
    'rejects %s before native decoding',
    async (failure) => {
      const port = io(),
        apply = vi.fn();
      port.fetch = vi.fn(async () => {
        if (failure === 'fragments')
          return new Response(
            new ReadableStream({
              start(c) {
                for (let i = 0; i < 513; i++) c.enqueue(new Uint8Array([0]));
                c.close();
              },
            }),
          );
        let bytes = png();
        if (failure === 'oversize') bytes = new Uint8Array(256 * 1024 + 1);
        if (failure === 'malformed') bytes = new Uint8Array([1, 2, 3]);
        if (failure === 'wrong-edge')
          new DataView(bytes.buffer).setUint32(16, 1024);
        if (failure === 'wrong-type')
          bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
        return new Response(bytes);
      });
      const loader = new SurfaceAssets(apply, port);
      expect(await loader.load()).toEqual({ loaded: 0, failed: 4 });
      expect(port.decode).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
      loader.dispose();
    },
  );

  it.each(['reject', 'pixel-count'])(
    'keeps fallbacks on native decoder %s failure',
    async (failure) => {
      const port = io(),
        apply = vi.fn();
      port.decode = vi.fn(async () => {
        if (failure === 'reject') throw new Error('fixture');
        return new Uint8Array(4);
      });
      const loader = new SurfaceAssets(apply, port);
      expect(await loader.load()).toEqual({ loaded: 0, failed: 4 });
      expect(apply).not.toHaveBeenCalled();
      loader.dispose();
    },
  );

  it('does no work if disposed or already externally aborted', async () => {
    vi.useFakeTimers();
    const port = io(),
      apply = vi.fn(),
      loader = new SurfaceAssets(apply, port);
    loader.dispose();
    expect(await loader.load()).toEqual({ loaded: 0, failed: 0 });
    const other = new SurfaceAssets(apply, port),
      abort = new AbortController();
    abort.abort();
    expect(await other.load(abort.signal)).toEqual({ loaded: 0, failed: 0 });
    expect(port.fetch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    other.dispose();
  });

  it.each(['dispose', 'abort'])(
    'fences a late native decode after %s and retains its work until settlement',
    async (retirement) => {
      vi.useFakeTimers();
      const port = io(),
        apply = vi.fn(),
        abort = new AbortController();
      let finish!: (data: Uint8Array<ArrayBuffer>) => void;
      port.decode = vi.fn(
        () =>
          new Promise<Uint8Array<ArrayBuffer>>((resolve) => {
            finish = resolve;
          }),
      );
      const loader = new SurfaceAssets(apply, port),
        pending = loader.load(abort.signal);
      await vi.waitFor(() => expect(port.decode).toHaveBeenCalledTimes(1));
      if (retirement === 'dispose') loader.dispose();
      else abort.abort();
      expect(vi.getTimerCount()).toBe(0);
      let settled = false;
      void pending.then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);
      finish(pixels(512));
      expect(await pending).toEqual({ loaded: 0, failed: 1 });
      expect(port.fetch).toHaveBeenCalledTimes(1);
      expect(apply).not.toHaveBeenCalled();
      loader.dispose();
    },
  );

  it('aborts a stalled read at the single ten-second deadline without a retry', async () => {
    vi.useFakeTimers();
    const apply = vi.fn(),
      port = io();
    let signal: AbortSignal | undefined;
    port.fetch = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          signal = options?.signal as AbortSignal;
          signal.addEventListener(
            'abort',
            () => reject(new Error('fixture-abort')),
            { once: true },
          );
        }),
    );
    const loader = new SurfaceAssets(apply, port),
      pending = loader.load();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal?.aborted).toBe(true);
    expect(await pending).toEqual({ loaded: 0, failed: 1 });
    expect(port.fetch).toHaveBeenCalledTimes(1);
    expect(apply).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    loader.dispose();
  });

  it('closes every native bitmap and retires each temporary canvas', async () => {
    const close = vi.fn(),
      canvases: { width: number; height: number }[] = [];
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async (blob: Blob, options: ImageBitmapOptions) => {
        expect(options).toMatchObject({
          colorSpaceConversion: 'none',
          premultiplyAlpha: 'none',
          imageOrientation: 'none',
        });
        const header = imageHeader(new Uint8Array(await blob.arrayBuffer()));
        return { width: header.width, height: header.height, close };
      }),
    );
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          public width: number,
          public height: number,
        ) {
          canvases.push(this);
        }
        getContext() {
          const edge = this.width;
          return {
            drawImage() {},
            getImageData() {
              return { data: pixels(edge) };
            },
          };
        }
      },
    );
    const port = io();
    delete port.decode;
    const loader = new SurfaceAssets(vi.fn(), port);
    expect(await loader.load()).toEqual({ loaded: 4, failed: 0 });
    expect(close).toHaveBeenCalledTimes(8);
    expect(canvases.every((c) => c.width === 1 && c.height === 1)).toBe(true);
    loader.dispose();
  });

  it('closes an aborted late bitmap before allocating its canvas', async () => {
    const close = vi.fn(),
      canvas = vi.fn();
    let finish!: (bitmap: unknown) => void;
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    vi.stubGlobal('OffscreenCanvas', canvas);
    const port = io();
    delete port.decode;
    const apply = vi.fn(),
      loader = new SurfaceAssets(apply, port),
      pending = loader.load();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    loader.dispose();
    finish({ width: 512, height: 512, close });
    await pending;
    expect(close).toHaveBeenCalledTimes(1);
    expect(canvas).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('updates stable owned samplers, separates data colour spaces and preserves repeat transforms', async () => {
    const port = io(),
      maps = createSurfaces(port),
      floor = maps.floor,
      properties = surfaceProperties(floor);
    const initial = maps.floor.image.data,
      normal = properties.normalMap!,
      roughness = properties.roughnessMap!;
    const storage = maps.textures.map((map) => ({
      map,
      width: map.image.width,
      height: map.image.height,
    }));
    for (const { kind, edge } of SURFACE_ASSETS) {
      const set = surfaceProperties(maps[kind]);
      for (const sampler of [set.map, set.normalMap!, set.roughnessMap!]) {
        expect(sampler.image.width).toBe(edge);
        expect(sampler.image.height).toBe(edge);
        expect(sampler.image.data?.byteLength).toBe(edge * edge * 4);
      }
    }
    expect(maps.floor.colorSpace).toBe('srgb');
    expect(normal.colorSpace).toBe('');
    expect(roughness.colorSpace).toBe('');
    expect(properties.bumpMap).toBeNull();
    setSurfaceRepeat(floor, 3.5, 4);
    expect(normal.repeat.toArray()).toEqual([3.5, 4]);
    expect(roughness.repeat.toArray()).toEqual([3.5, 4]);
    expect(await maps.load()).toEqual({ loaded: 4, failed: 0 });
    for (const { map, width, height } of storage) {
      expect(map.image.width).toBe(width);
      expect(map.image.height).toBe(height);
    }
    expect(maps.floor).toBe(floor);
    expect(maps.floor.image.data).not.toBe(initial);
    expect(surfaceProperties(floor).normalMap).toBe(normal);
    expect(normal.image.width).toBe(512);
    expect(roughness.image.height).toBe(512);
    let retired = 0;
    for (const map of maps.textures)
      map.addEventListener('dispose', () => retired++);
    maps.dispose();
    maps.dispose();
    expect(retired).toBe(15);
  });
});
