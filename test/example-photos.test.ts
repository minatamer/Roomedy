import { readFile } from 'node:fs/promises';
import { expect, it, vi } from 'vitest';
import {
  loadExamplePhotos,
  EXAMPLE_PHOTOS,
} from '../apps/frontend/src/features/room-intake/example-photos.js';
it('fetches the local room and furniture views as bounded blobs without invoking drafting', async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(new Uint8Array([1, 2, 3])));
  const photos = await loadExamplePhotos(
    new AbortController().signal,
    transport,
  );
  expect(photos.map((p) => [p.type, p.size])).toEqual(
    EXAMPLE_PHOTOS.map(() => ['image/webp', 3]),
  );
  expect(transport.mock.calls.map((args) => args[0])).toEqual(
    EXAMPLE_PHOTOS.map((p) => p.path),
  );
  expect(
    transport.mock.calls.every(
      (args) => args[1]?.credentials === 'same-origin',
    ),
  ).toBe(true);
});
it('rejects excessive bytes, retained fragments, empty/missing responses and abort without fetching another example', async () => {
  for (const response of [
    new Response(new Uint8Array(256 * 1024 + 1)),
    new Response(),
    new Response(null, { status: 404 }),
    new Response(
      new ReadableStream({
        start(c) {
          for (let i = 0; i < 129; i++) c.enqueue(new Uint8Array([1]));
          c.close();
        },
      }),
    ),
  ]) {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(response);
    await expect(
      loadExamplePhotos(new AbortController().signal, transport),
    ).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(1);
  }
  const abort = new AbortController();
  const transport = vi.fn<typeof fetch>().mockImplementation(async () => {
    abort.abort();
    return new Response(new Uint8Array([1]));
  });
  await expect(loadExamplePhotos(abort.signal, transport)).rejects.toThrow();
  expect(transport).toHaveBeenCalledTimes(1);
});

it('loads all four real local WebP views within upload count and byte limits without provider dispatch', async () => {
  const transport = vi.fn<typeof fetch>().mockImplementation(async (path) => {
    const bytes = await readFile(
      new URL('../apps/frontend/public' + path, import.meta.url),
    );
    return new Response(new Uint8Array(bytes));
  });
  const photos = await loadExamplePhotos(
    new AbortController().signal,
    transport,
  );
  expect(photos).toHaveLength(4);
  for (const [i, blob] of photos.entries()) {
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.size).toBeLessThanOrEqual(256 * 1024);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WEBP');
    expect(EXAMPLE_PHOTOS[i]!.purpose).toBe('auto');
  }
  expect(transport).toHaveBeenCalledTimes(4);
});
