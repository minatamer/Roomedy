import sharp from 'sharp';
import { decodeInput, imageHeader } from '@roomedy/contracts/intake';
import { POLICY } from '@roomedy/contracts/policy';
import type { OperationInput } from '@roomedy/contracts/operations';
import { inputDigest } from '../security/admission.js';

/** Actual bounded pixel decode, after admission. One image at a time; the caller owns the work slot until settlement. */
export async function prepareRecognitionImages(
  input: Extract<OperationInput, { kind: 'recognize-room' }>,
  signal: AbortSignal,
) {
  if (!inputDigest(input)) throw new Error('image-input');
  const images: { id: string; data: string }[] = [];
  let total = 0;
  for (const [index, image] of input.images.entries()) {
    signal.throwIfAborted();
    const decoded = decodeInput(Buffer.from(image.data, 'base64'));
    if (decoded.orientation !== 1) throw new Error('image-orientation');
    const { data, info } = await sharp(decoded.bytes, {
      failOn: 'warning',
      limitInputPixels: POLICY.normalizedEdge ** 2,
      limitInputChannels: 3,
      sequentialRead: true,
    })
      .timeout({ seconds: 5 })
      .jpeg({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    signal.throwIfAborted();
    const expected = input.manifest[index]!;
    const header = imageHeader(data);
    total += data.length;
    if (
      info.width !== expected.width ||
      info.height !== expected.height ||
      header.width !== expected.width ||
      header.height !== expected.height ||
      data.length > POLICY.normalizedPhotoBytes ||
      total > POLICY.normalizedTotalBytes
    )
      throw new Error('image-output');
    images.push({ id: image.id, data: data.toString('base64') });
  }
  return images;
}
