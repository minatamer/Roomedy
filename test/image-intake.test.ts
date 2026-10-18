import { readFile } from 'node:fs/promises';
import { describe, it, expect, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import {
  imageHeader,
  decodeInput,
  ImageInputError,
} from '../apps/frontend/src/features/room-intake/images.js';
import type { PreparedPhoto } from '../apps/frontend/src/features/room-intake/images.js';
import { PhotoStore } from '../apps/frontend/src/features/room-intake/photo-store.js';

const prepared = (): PreparedPhoto => ({
  normalized: new Blob(['normalized'], { type: 'image/jpeg' }),
  preview: new Blob(['preview'], { type: 'image/jpeg' }),
  type: 'image/png',
  inputWidth: 1200,
  inputHeight: 900,
  width: 1200,
  height: 900,
  decodeMs: 12,
  prepareMs: 3,
});
describe('bounded still-image preflight', () => {
  it('recognizes real selected bytes independently of names and MIME', async () => {
    for (const [name, type, width, height] of [
      ['room.png', 'image/png', 1200, 900],
      ['room.jpg', 'image/jpeg', 4000, 4000],
      ['room.webp', 'image/webp', 1600, 1200],
      ['orientation.jpg', 'image/jpeg', 640, 480],
    ] as const) {
      const bytes = await readFile(`test/fixtures/intake/${name}`);
      expect(imageHeader(bytes)).toEqual({ type, width, height });
      const clean = decodeInput(bytes);
      expect(imageHeader(clean.bytes)).toEqual({ type, width, height });
      expect(clean.orientation).toBe(name === 'orientation.jpg' ? 6 : 1);
      expect(
        Buffer.from(clean.bytes).includes(
          Buffer.from('synthetic-private-metadata'),
        ),
      ).toBe(false);
    }
  });
  it('rejects excess pixels/edges before decode and rejects unsupported/empty/malformed files', async () => {
    const png = new Uint8Array(await readFile('test/fixtures/intake/room.png'));
    for (const [width, height] of [
      [8001, 1],
      [4001, 4000],
    ] as const) {
      const copy = png.slice(),
        view = new DataView(copy.buffer);
      view.setUint32(16, width);
      view.setUint32(20, height);
      expect(() => imageHeader(copy)).toThrowError('pixels');
    }
    expect(() =>
      imageHeader(new Uint8Array(POLICY.rawPhotoBytes + 1)),
    ).toThrowError('bytes');
    for (const bytes of [
      new Uint8Array(),
      new TextEncoder().encode('<svg onload="attack()"/>'),
      new Uint8Array([255, 216, 255, 192, 0, 1]),
    ])
      expect(() => imageHeader(bytes)).toThrow(ImageInputError);
    const sixteen = png.slice();
    sixteen[24] = 16;
    expect(() => imageHeader(sixteen)).toThrowError('depth');
  });
  it('drops compressed ancillary metadata and bounds segment work', async () => {
    const bytes = new Uint8Array(
        await readFile('test/fixtures/intake/room.png'),
      ),
      clean = decodeInput(bytes).bytes;
    expect(Buffer.from(bytes).includes(Buffer.from('zTXt'))).toBe(true);
    expect(Buffer.from(clean).includes(Buffer.from('zTXt'))).toBe(false);
    const jpeg = new Uint8Array(2 + 4097 * 4);
    jpeg.set([255, 216]);
    for (let i = 2; i < jpeg.length; i += 4) jpeg.set([255, 225, 0, 2], i);
    expect(() => imageHeader(jpeg)).toThrowError('malformed');
  });
});

describe('serial transient photo ownership', () => {
  it('serializes native work and fences a removed job before starting the next', async () => {
    const releases: Array<(p: PreparedPhoto) => void> = [],
      createUrl = vi.fn(() => `blob:fixture-${releases.length}`),
      revokeUrl = vi.fn();
    let running = 0,
      max = 0,
      id = 0;
    const store = new PhotoStore(
      () => true,
      () => undefined,
      {
        id: () => `photo_${++id}`,
        createUrl,
        revokeUrl,
        prepare: async () => {
          running++;
          max = Math.max(max, running);
          const p = await new Promise<PreparedPhoto>((r) => releases.push(r));
          running--;
          return p;
        },
      },
    );
    store.add([new Blob(['one']), new Blob(['two'])], 'room');
    expect(releases).toHaveLength(1);
    store.remove('photo_1');
    expect(releases).toHaveLength(1);
    releases[0]!(prepared());
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    expect(createUrl).not.toHaveBeenCalled();
    releases[1]!(prepared());
    await vi.waitFor(() =>
      expect(store.getSnapshot()[0]?.status).toBe('ready'),
    );
    expect(max).toBe(1);
    expect(createUrl).toHaveBeenCalledTimes(1);
    store.dispose();
    store.dispose();
    expect(revokeUrl).toHaveBeenCalledTimes(1);
  });
  it('bounds selected/retired bytes, count and normalized bytes with no partial admissions', async () => {
    let id = 0;
    const store = new PhotoStore(
      () => true,
      () => undefined,
      {
        id: () => `p${++id}`,
        createUrl: () => '',
        revokeUrl: () => undefined,
        prepare: async () => prepared(),
      },
    );
    expect(
      store.add(
        Array.from({ length: 7 }, () => new Blob(['x'])),
        'room',
      ),
    ).toContain('six');
    expect(store.getSnapshot()).toHaveLength(0);
    expect(
      store.add([new Blob([new Uint8Array(POLICY.rawPhotoBytes + 1)])], 'room'),
    ).toContain('8 MiB');
    store.add(
      Array.from(
        { length: 3 },
        () => new Blob([new Uint8Array(POLICY.rawPhotoBytes)]),
      ),
      'room',
    );
    expect(store.add([new Blob(['x'])], 'room')).toContain('24 MiB');
    store.dispose();
    const huge = new PhotoStore(
      () => true,
      () => undefined,
      {
        id: () => `p${++id}`,
        prepare: async () => ({
          ...prepared(),
          normalized: new Blob([
            new Uint8Array(POLICY.normalizedTotalBytes + 1),
          ]),
        }),
        createUrl: () => '',
        revokeUrl: () => undefined,
      },
    );
    huge.add([new Blob(['x'])], 'room');
    await vi.waitFor(() =>
      expect(huge.getSnapshot()[0]?.status).toBe('failed'),
    );
    expect(huge.preparedRequest()).toBeNull();
    huge.dispose();
  });
  it('does not restore a removed photo or publish after disposal/expiry', async () => {
    let complete: ((photo: PreparedPhoto) => void) | undefined;
    const changed = vi.fn(),
      createUrl = vi.fn(() => ''),
      revokeUrl = vi.fn();
    let valid = true;
    const store = new PhotoStore(() => valid, changed, {
      prepare: () =>
        new Promise((r) => {
          complete = r;
        }),
      createUrl,
      revokeUrl,
      id: () => 'photo',
    });
    store.add([new Blob(['x'])], 'room');
    valid = false;
    store.dispose();
    const count = changed.mock.calls.length;
    complete!(prepared());
    await Promise.resolve();
    await Promise.resolve();
    expect(changed).toHaveBeenCalledTimes(count);
    expect(createUrl).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toEqual([]);
  });
  it('preserves IDs through reorder and exports only normalized request data', async () => {
    let id = 0;
    const store = new PhotoStore(
      () => true,
      () => undefined,
      {
        id: () => `p${++id}`,
        prepare: async () => prepared(),
        createUrl: () => `blob:preview-${id}`,
        revokeUrl: () => undefined,
      },
    );
    store.add(
      [
        new File(['raw'], 'private-bedroom.png'),
        new File(['raw'], 'private-desk.png'),
      ],
      'room',
    );
    await vi.waitFor(() =>
      expect(store.getSnapshot().every((p) => p.status === 'ready')).toBe(true),
    );
    store.reorder('p2', -1);
    store.purpose('p2', 'furniture');
    expect(store.getSnapshot().map((p) => p.id)).toEqual(['p2', 'p1']);
    const request = store.preparedRequest()!;
    expect(request.manifest[0]).toMatchObject({
      id: 'p2',
      purpose: 'furniture',
      type: 'image/jpeg',
    });
    expect(await request.images[0]!.text()).toBe('normalized');
    expect(JSON.stringify(request.manifest)).not.toMatch(/private|blob:|raw/);
    store.dispose();
  });
  it('a decode deadline fails visibly without admitting parallel native work', async () => {
    vi.useFakeTimers();
    try {
      let release: ((p: PreparedPhoto) => void) | undefined,
        id = 0;
      const prepare = vi.fn(
        () =>
          new Promise<PreparedPhoto>((r) => {
            release = r;
          }),
      );
      const store = new PhotoStore(
        () => true,
        () => undefined,
        {
          prepare,
          id: () => `p${++id}`,
          createUrl: () => '',
          revokeUrl: () => undefined,
        },
      );
      store.add([new Blob(['x']), new Blob(['y'])], 'room');
      await vi.advanceTimersByTimeAsync(POLICY.imageDecodeMs + 1);
      expect(store.getSnapshot()[0]?.status).toBe('failed');
      expect(prepare).toHaveBeenCalledTimes(1);
      release!(prepared());
      await vi.advanceTimersByTimeAsync(1);
      expect(prepare).toHaveBeenCalledTimes(2);
      store.dispose();
      release!(prepared());
      await vi.advanceTimersByTimeAsync(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
