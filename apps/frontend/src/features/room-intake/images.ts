import { POLICY } from '@roomedy/contracts/policy';
import type { IMAGE_TYPES } from '@roomedy/contracts/intake';
import { decodeInput, ImageInputError } from '@roomedy/contracts/intake';
export {
  imageHeader,
  decodeInput,
  ImageInputError,
} from '@roomedy/contracts/intake';

type ImageType = (typeof IMAGE_TYPES)[number];
export interface PreparedPhoto {
  normalized: Blob;
  preview: Blob;
  type: ImageType;
  inputWidth: number;
  inputHeight: number;
  width: number;
  height: number;
  decodeMs: number;
  prepareMs: number;
}
export const imageErrorMessage = (error: unknown) => {
  const code = error instanceof ImageInputError ? error.code : 'decode';
  switch (code) {
    case 'depth':
      return 'Export this image as an 8-bit PNG or a standard JPEG.';
    case 'format':
      return 'Choose a still JPEG, PNG or WebP image. Export HEIC or animated images as JPEG first.';
    case 'bytes':
      return 'Choose an image no larger than 8 MiB.';
    case 'pixels':
      return 'Choose an image up to 16 megapixels and 8000 pixels on either side.';
    case 'malformed':
      return 'This file is not a readable supported image. Export a fresh JPEG, PNG or WebP.';
    case 'prepare':
      return 'This image could not be prepared within the limits. Try a smaller image.';
    case 'cancelled':
      return 'Photo preparation was cancelled.';
    default:
      return 'This image could not be opened. Try another JPEG, PNG or WebP.';
  }
};
const active = (signal: AbortSignal) => {
  if (signal.aborted) throw new ImageInputError('cancelled');
};
/** Native decode is serial at PhotoStore. A late bitmap is always closed before return. */
export async function preparePhoto(
  file: Blob,
  signal: AbortSignal,
): Promise<PreparedPhoto> {
  active(signal);
  if (file.size > POLICY.rawPhotoBytes) throw new ImageInputError('bytes');
  const bytes = new Uint8Array(await file.arrayBuffer());
  active(signal);
  const clean = decodeInput(bytes),
    header = clean.header,
    started = performance.now();
  let bitmap: ImageBitmap | undefined, canvas: OffscreenCanvas | undefined;
  try {
    bitmap = await createImageBitmap(
      new Blob([clean.bytes], { type: header.type }),
      { imageOrientation: 'none' },
    );
    active(signal);
    if (bitmap.width !== header.width || bitmap.height !== header.height)
      throw new ImageInputError('decode');
    const swapped = clean.orientation >= 5,
      decodeMs = performance.now() - started,
      inputWidth = swapped ? bitmap.height : bitmap.width,
      inputHeight = swapped ? bitmap.width : bitmap.height;
    const ratio = Math.min(
      1,
      POLICY.normalizedEdge / Math.max(inputWidth, inputHeight),
    );
    let width = Math.max(1, Math.round(inputWidth * ratio)),
      height = Math.max(1, Math.round(inputHeight * ratio));
    canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new ImageInputError('prepare');
    context.fillStyle = '#f7f3eb';
    context.fillRect(0, 0, width, height);
    context.save();
    switch (clean.orientation) {
      case 2:
        context.translate(width, 0);
        context.scale(-1, 1);
        break;
      case 3:
        context.translate(width, height);
        context.rotate(Math.PI);
        break;
      case 4:
        context.translate(0, height);
        context.scale(1, -1);
        break;
      case 5:
        context.transform(0, 1, 1, 0, 0, 0);
        break;
      case 6:
        context.translate(width, 0);
        context.rotate(Math.PI / 2);
        break;
      case 7:
        context.translate(width, height);
        context.transform(0, -1, -1, 0, 0, 0);
        break;
      case 8:
        context.translate(0, height);
        context.rotate(-Math.PI / 2);
        break;
    }
    context.drawImage(
      bitmap,
      0,
      0,
      swapped ? height : width,
      swapped ? width : height,
    );
    context.restore();
    bitmap.close();
    bitmap = undefined;
    let normalized: Blob | undefined;
    for (const quality of [0.82, 0.65, 0.5]) {
      normalized = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      active(signal);
      if (normalized.size <= POLICY.normalizedPhotoBytes) break;
    }
    if (
      !normalized ||
      normalized.type !== 'image/jpeg' ||
      normalized.size > POLICY.normalizedPhotoBytes
    )
      throw new ImageInputError('prepare');
    const scale = Math.min(1, 640 / Math.max(width, height)),
      previewCanvas = new OffscreenCanvas(
        Math.max(1, Math.round(width * scale)),
        Math.max(1, Math.round(height * scale)),
      );
    let preview: Blob;
    try {
      const previewContext = previewCanvas.getContext('2d');
      if (!previewContext) throw new ImageInputError('prepare');
      previewContext.drawImage(
        canvas,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
      );
      preview = await previewCanvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.72,
      });
      active(signal);
    } finally {
      previewCanvas.width = 1;
      previewCanvas.height = 1;
    }
    if (preview.size > 256 * 1024) throw new ImageInputError('prepare');
    width = canvas.width;
    height = canvas.height;
    return {
      normalized,
      preview,
      type: header.type,
      inputWidth,
      inputHeight,
      width,
      height,
      decodeMs,
      prepareMs: performance.now() - started - decodeMs,
    };
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    throw new ImageInputError('decode');
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}
