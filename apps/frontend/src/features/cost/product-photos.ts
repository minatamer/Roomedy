import type { ProductChoice } from '@roomedy/contracts/estimates';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { imageHeader } from '@roomedy/contracts/intake';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import { releaseTransport } from '../session/release-client';
import { withExportSignal } from '../design-export/facts';

export interface EstimateProductPicture {
  key: string;
  url: string;
  imageUrl: string;
  jpeg: Uint8Array;
}
type Normalize = (
  bytes: Uint8Array,
  signal: AbortSignal,
) => Promise<Uint8Array>;
/** Decode only preflighted raster media, with finite pixels and a small export-only JPEG. */
export const normalizeProductPhoto: Normalize = async (bytes, signal) => {
  const header = imageHeader(bytes);
  const pending = createImageBitmap(
    new Blob([new Uint8Array(bytes)], { type: header.type }),
    { imageOrientation: 'from-image' },
  ).then((bitmap) => {
    if (signal.aborted) bitmap.close();
    return bitmap;
  });
  const bitmap = await withExportSignal(pending, signal),
    canvas = document.createElement('canvas');
  try {
    signal.throwIfAborted();
    const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('photo-canvas');
    context.fillStyle = '#fffaf2';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await withExportSignal(
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error('photo-encode')),
          'image/jpeg',
          0.86,
        ),
      ),
      signal,
    );
    if (blob.size > 200 * 1024) throw new Error('photo-limit');
    const result = new Uint8Array(await blob.arrayBuffer());
    signal.throwIfAborted();
    return result;
  } finally {
    bitmap.close();
    canvas.width = canvas.height = 1;
  }
};

/** One explicit export, chosen photos only, two workers/eight seconds; unavailable media is optional. */
export async function captureProductPhotos(
  choices: readonly ProductChoice[],
  parent: AbortSignal,
  check: () => void,
  fetcher: typeof fetch = releaseTransport(fetch, () => {}),
  normalize: Normalize = normalizeProductPhoto,
): Promise<EstimateProductPicture[]> {
  check();
  const controller = new AbortController(),
    signal = AbortSignal.any([parent, controller.signal]);
  const timer = setTimeout(() => controller.abort(), 8000);
  const queue = choices
    .slice(0, 45)
    .filter((choice) => safeProductImage(choice.imageUrl));
  const result: EstimateProductPicture[] = [],
    cache = new Map<string, Promise<Uint8Array | null>>();
  let index = 0,
    bytes = 0;
  const read = async (imageUrl: string) => {
    const packed = new BoundedBytes(4 * 1024 * 1024, 512);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const cancel = () => {
      void reader?.cancel().catch(() => undefined);
    };
    signal.addEventListener('abort', cancel, { once: true });
    try {
      const response = await withExportSignal(
        fetcher('/api/roomedy/v1/product-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
          credentials: 'same-origin',
          cache: 'no-store',
          redirect: 'error',
          signal,
        }),
        signal,
      );
      reader = response.body?.getReader();
      if (
        !response.ok ||
        !reader ||
        !/^image\/(?:jpeg|png|webp)(?:;|$)/i.test(
          response.headers.get('content-type') ?? '',
        )
      )
        return null;
      while (true) {
        const part = await withExportSignal(reader.read(), signal);
        if (part.done) break;
        packed.append(part.value);
      }
      const raw = packed.take();
      imageHeader(raw);
      const jpeg = await withExportSignal(normalize(raw, signal), signal),
        header = imageHeader(jpeg);
      if (
        header.type !== 'image/jpeg' ||
        Math.max(header.width, header.height) > 480 ||
        jpeg.byteLength > 200 * 1024
      )
        return null;
      return jpeg;
    } catch {
      return null;
    } finally {
      packed.clear();
      signal.removeEventListener('abort', cancel);
      cancel();
      reader?.releaseLock();
    }
  };
  const worker = async () => {
    while (index < queue.length && !signal.aborted) {
      check();
      const choice = queue[index++]!,
        imageUrl = safeProductImage(choice.imageUrl)!;
      let pending = cache.get(imageUrl);
      if (!pending) {
        pending = read(imageUrl);
        cache.set(imageUrl, pending);
      }
      const jpeg = await pending;
      if (signal.aborted) break;
      check();
      if (jpeg && bytes + jpeg.byteLength <= 6 * 1024 * 1024) {
        bytes += jpeg.byteLength;
        result.push({ key: choice.key, url: choice.url, imageUrl, jpeg });
      }
    }
  };
  try {
    await Promise.all([worker(), worker()]);
    check();
    return result;
  } finally {
    clearTimeout(timer);
    controller.abort();
    cache.clear();
  }
}
