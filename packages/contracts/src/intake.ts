import { z } from 'zod';
import { POLICY } from './policy.js';
import { finishSchema, idSchema, labelSchema } from './primitives.js';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const imageTypeSchema = z.enum(IMAGE_TYPES);
export const photoManifestSchema = z
  .array(
    z.strictObject({
      id: idSchema,
      purpose: z.enum(['auto', 'room', 'furniture']),
      type: imageTypeSchema,
      width: z.number().int().min(1).max(POLICY.normalizedEdge),
      height: z.number().int().min(1).max(POLICY.normalizedEdge),
      bytes: z.number().int().min(1).max(POLICY.normalizedPhotoBytes),
    }),
  )
  .min(1)
  .max(POLICY.photos)
  .superRefine((photos, ctx) => {
    if (new Set(photos.map((p) => p.id)).size !== photos.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate photo ID' });
    if (
      photos.reduce((sum, p) => sum + p.bytes, 0) > POLICY.normalizedTotalBytes
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Prepared photos exceed total bytes',
      });
  });
const evidenceSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('unknown'), sourceId: z.null() }),
  z.strictObject({
    status: z.enum(['estimated', 'extracted']),
    sourceId: idSchema,
  }),
]);
const photoMeasurement = (max: number, min = 1) =>
  z.discriminatedUnion('status', [
    z.strictObject({
      status: z.literal('unknown'),
      value: z.null(),
      sourceId: z.null(),
    }),
    z.strictObject({
      status: z.enum(['estimated', 'extracted']),
      value: z.number().int().min(min).max(max),
      sourceId: idSchema,
    }),
  ]);
const candidateLength = photoMeasurement(POLICY.roomEdgeMm);
/** Untrusted adapter output. IDs below are temporary observation references, never canonical room IDs. */
export const draftObservationSchema = z.strictObject({
  ref: idSchema,
  sourceId: idSchema,
  kind: z.enum(['furniture', 'door', 'window', 'obstacle']),
  catalogueId: idSchema.nullable(),
  label: labelSchema,
  wall: z.enum(['north', 'east', 'south', 'west', 'unknown']),
  wallEvidence: evidenceSchema,
  mechanism: z.enum(['inward', 'outward', 'sliding', 'fixed', 'unknown']),
  mechanismEvidence: evidenceSchema,
  hinge: z.enum(['left', 'right', 'unknown']),
  hingeEvidence: evidenceSchema,
  poseEvidence: evidenceSchema,
  visibility: z.enum(['visible', 'partial', 'occluded', 'unsupported']),
  finish: finishSchema.nullable(),
  width: candidateLength,
  depth: candidateLength,
  height: candidateLength,
  offset: photoMeasurement(POLICY.roomEdgeMm, 0),
  sill: photoMeasurement(POLICY.roomEdgeMm, 0),
  projection: candidateLength,
  sketch: z.strictObject({
    x: z.number().min(0).max(1).nullable(),
    z: z.number().min(0).max(1).nullable(),
    quarterTurns: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
      .nullable(),
  }),
});
export const draftHypothesisSchema = z
  .strictObject({
    version: z.literal(1),
    // Legacy explicit-purpose adapters may omit this; automatic requests require a complete map.
    sourcePurposes: z
      .array(
        z.strictObject({
          id: idSchema,
          purpose: z.enum(['room', 'furniture', 'unknown']),
        }),
      )
      .max(POLICY.photos)
      .optional(),
    shape: z.enum(['rectangle', 'unknown', 'unsupported']),
    frameEvidence: evidenceSchema,
    room: z.strictObject({
      width: candidateLength,
      depth: candidateLength,
      height: candidateLength,
    }),
    observations: z.array(draftObservationSchema).max(POLICY.draftObservations),
    groups: z
      .array(z.array(idSchema).min(1).max(POLICY.observationsPerEntity))
      .max(POLICY.furniture + POLICY.features),
  })
  .superRefine((draft, ctx) => {
    const refs = new Set(draft.observations.map((o) => o.ref));
    if (refs.size !== draft.observations.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate observation reference',
      });
    const perPhoto = new Map<string, number>();
    for (const o of draft.observations)
      perPhoto.set(o.sourceId, (perPhoto.get(o.sourceId) ?? 0) + 1);
    if ([...perPhoto.values()].some((n) => n > POLICY.observationsPerPhoto))
      ctx.addIssue({ code: 'custom', message: 'Too many photo observations' });
    const grouped = draft.groups.flat();
    if (new Set(grouped).size !== grouped.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Competing observation associations',
      });
    for (const group of draft.groups)
      if (
        new Set(group).size !== group.length ||
        group.some((ref) => !refs.has(ref))
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid observation association',
        });
  });
export const draftHypothesisJsonSchema = () =>
  z.toJSONSchema(draftHypothesisSchema);
export type DraftHypothesis = z.infer<typeof draftHypothesisSchema>;
export type DraftObservation = z.infer<typeof draftObservationSchema>;
export type PhotoManifest = z.infer<typeof photoManifestSchema>;
export function parseDraftHypothesis(
  raw: unknown,
  sources: readonly string[],
  automaticSources: readonly string[] = [],
) {
  const parsed = draftHypothesisSchema.safeParse(raw);
  if (
    !parsed.success ||
    sources.length > POLICY.photos ||
    new Set(sources).size !== sources.length
  )
    return null;
  const allowed = new Set(sources),
    roles = parsed.data.sourcePurposes;
  if (
    automaticSources.some((id) => !allowed.has(id)) ||
    (automaticSources.length > 0 && !roles) ||
    (roles &&
      (roles.length !== sources.length ||
        new Set(roles.map((s) => s.id)).size !== roles.length ||
        roles.some((s) => !allowed.has(s.id))))
  )
    return null;
  const measurements = [
    ...Object.values(parsed.data.room),
    ...parsed.data.observations.flatMap((o) => [
      o.width,
      o.depth,
      o.height,
      o.offset,
      o.sill,
      o.projection,
    ]),
  ];
  const evidence = [
    parsed.data.frameEvidence,
    ...parsed.data.observations.flatMap((o) => [
      o.wallEvidence,
      o.mechanismEvidence,
      o.hingeEvidence,
      o.poseEvidence,
    ]),
  ];
  const inconsistent = parsed.data.observations.some(
    (o) =>
      (o.wall === 'unknown') !== (o.wallEvidence.status === 'unknown') ||
      (o.mechanism === 'unknown') !==
        (o.mechanismEvidence.status === 'unknown') ||
      (o.hinge === 'unknown') !== (o.hingeEvidence.status === 'unknown') ||
      (o.kind === 'door' && o.mechanism === 'fixed'),
  );
  if (
    inconsistent ||
    (parsed.data.shape === 'unknown') !==
      (parsed.data.frameEvidence.status === 'unknown') ||
    evidence.some((e) => e.sourceId !== null && !allowed.has(e.sourceId)) ||
    parsed.data.observations.some((o) => !allowed.has(o.sourceId)) ||
    measurements.some((m) => m.sourceId !== null && !allowed.has(m.sourceId))
  )
    return null;
  if (roles) {
    const roomSources = new Set(
      roles.filter((s) => s.purpose === 'room').map((s) => s.id),
    );
    if (
      parsed.data.frameEvidence.sourceId &&
      !roomSources.has(parsed.data.frameEvidence.sourceId)
    ) {
      parsed.data.shape = 'unknown';
      parsed.data.frameEvidence = { status: 'unknown', sourceId: null };
    }
    for (const axis of ['width', 'depth', 'height'] as const) {
      const measurement = parsed.data.room[axis];
      if (measurement.sourceId && !roomSources.has(measurement.sourceId))
        parsed.data.room[axis] = {
          status: 'unknown',
          value: null,
          sourceId: null,
        };
    }
  }
  return parsed.data;
}

// Shared byte-only preflight: both browser preparation and later server admission use this policy.
type ImageType = (typeof IMAGE_TYPES)[number];
export interface ImageHeader {
  type: ImageType;
  width: number;
  height: number;
}
export class ImageInputError extends Error {
  constructor(
    readonly code:
      | 'format'
      | 'depth'
      | 'bytes'
      | 'pixels'
      | 'malformed'
      | 'decode'
      | 'prepare'
      | 'cancelled',
  ) {
    super(code);
  }
}
const bad = () => {
  throw new ImageInputError('malformed');
};
const ascii = (data: Uint8Array, offset: number, count: number) =>
  String.fromCharCode(...data.subarray(offset, offset + count));
/** Bounded header preflight precedes native decode. MIME/name/extension are not trusted. */
export function imageHeader(data: Uint8Array): ImageHeader {
  if (data.byteLength === 0 || data.byteLength > POLICY.rawPhotoBytes)
    throw new ImageInputError('bytes');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let result: ImageHeader | undefined;
  if (
    data.length >= 24 &&
    data[0] === 137 &&
    ascii(data, 1, 3) === 'PNG' &&
    data[4] === 13 &&
    data[5] === 10 &&
    data[6] === 26 &&
    data[7] === 10
  ) {
    if (view.getUint32(8) !== 13 || ascii(data, 12, 4) !== 'IHDR') bad();
    result = {
      type: 'image/png',
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
    if (data.length < 29) bad();
    if (data[24] === 16) throw new ImageInputError('depth');
    let offset = 8,
      count = 0,
      ended = false;
    while (offset + 12 <= data.length) {
      if (++count > POLICY.imageHeaderSegments) bad();
      const length = view.getUint32(offset),
        kind = ascii(data, offset + 4, 4);
      if (length > data.length - offset - 12) bad();
      if (kind === 'acTL') throw new ImageInputError('format');
      offset += length + 12;
      if (kind === 'IEND') {
        ended = true;
        break;
      }
    }
    if (!ended) bad();
  } else if (data.length >= 4 && data[0] === 255 && data[1] === 216) {
    let offset = 2,
      count = 0;
    while (offset + 4 <= data.length) {
      if (++count > POLICY.imageHeaderSegments || data[offset] !== 255) bad();
      while (data[offset] === 255) offset++;
      const marker = data[offset++];
      if (marker === 217 || marker === 218) break;
      if (
        marker === 1 ||
        (marker !== undefined && marker >= 208 && marker <= 215)
      )
        continue;
      if (offset + 2 > data.length) bad();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > data.length) bad();
      if (marker === 192 || marker === 194) {
        if (length < 8) bad();
        if (data[offset + 2] !== 8) throw new ImageInputError('depth');
        result = {
          type: 'image/jpeg',
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
        };
        break;
      }
      offset += length;
    }
    if (!result) bad();
  } else if (
    data.length >= 20 &&
    ascii(data, 0, 4) === 'RIFF' &&
    ascii(data, 8, 4) === 'WEBP'
  ) {
    if (view.getUint32(4, true) + 8 !== data.length) bad();
    let offset = 12,
      count = 0;
    while (offset + 8 <= data.length) {
      if (++count > POLICY.imageHeaderSegments) bad();
      const kind = ascii(data, offset, 4),
        length = view.getUint32(offset + 4, true),
        p = offset + 8;
      if (length > data.length - p) bad();
      if (kind === 'ANIM' || kind === 'ANMF')
        throw new ImageInputError('format');
      if (kind === 'VP8X') {
        if (length < 10) bad();
        if ((data[p]! & 2) !== 0) throw new ImageInputError('format');
        result = {
          type: 'image/webp',
          width: 1 + data[p + 4]! + (data[p + 5]! << 8) + (data[p + 6]! << 16),
          height: 1 + data[p + 7]! + (data[p + 8]! << 8) + (data[p + 9]! << 16),
        };
      } else if (kind === 'VP8 ' && !result) {
        if (
          length < 10 ||
          data[p + 3] !== 157 ||
          data[p + 4] !== 1 ||
          data[p + 5] !== 42
        )
          bad();
        result = {
          type: 'image/webp',
          width: view.getUint16(p + 6, true) & 16383,
          height: view.getUint16(p + 8, true) & 16383,
        };
      } else if (kind === 'VP8L' && !result) {
        if (length < 5 || data[p] !== 47) bad();
        const bits = view.getUint32(p + 1, true);
        result = {
          type: 'image/webp',
          width: (bits & 16383) + 1,
          height: ((bits >>> 14) & 16383) + 1,
        };
      }
      offset = p + length + (length % 2);
    }
    if (!result) bad();
  } else throw new ImageInputError('format');
  if (!result || result.width < 1 || result.height < 1) bad();
  if (
    result!.width > POLICY.decodedEdge ||
    result!.height > POLICY.decodedEdge ||
    result!.width * result!.height > POLICY.decodedPixels
  )
    throw new ImageInputError('pixels');
  return result!;
}

function exifOrientation(data: Uint8Array): number {
  const start = ascii(data, 0, 6) === 'Exif\0\0' ? 6 : 0;
  if (data.length - start < 8 || data.length > 65536) return 1;
  const v = new DataView(
      data.buffer,
      data.byteOffset + start,
      data.length - start,
    ),
    little = v.getUint16(0) === 0x4949;
  if (!little && v.getUint16(0) !== 0x4d4d) return 1;
  if (v.getUint16(2, little) !== 42) return 1;
  const offset = v.getUint32(4, little);
  if (offset > v.byteLength - 2) return 1;
  const count = v.getUint16(offset, little);
  if (count > 256 || offset + 2 + count * 12 > v.byteLength) return 1;
  for (let i = 0; i < count; i++) {
    const p = offset + 2 + i * 12;
    if (
      v.getUint16(p, little) === 274 &&
      v.getUint16(p + 2, little) === 3 &&
      v.getUint32(p + 4, little) === 1
    ) {
      const orientation = v.getUint16(p + 8, little);
      return orientation >= 1 && orientation <= 8 ? orientation : 1;
    }
  }
  return 1;
}
/** Remove ancillary profiles/text/EXIF before native decode; only the bounded orientation scalar survives. */
export function decodeInput(data: Uint8Array): {
  bytes: Uint8Array<ArrayBuffer>;
  orientation: number;
  header: ImageHeader;
} {
  const header = imageHeader(data);
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength),
    parts: Uint8Array[] = [];
  let orientation = 1;
  if (header.type === 'image/png') {
    parts.push(data.subarray(0, 8));
    let offset = 8;
    while (offset + 12 <= data.length) {
      const length = v.getUint32(offset),
        kind = ascii(data, offset + 4, 4);
      if (kind === 'eXIf')
        orientation = exifOrientation(
          data.subarray(offset + 8, offset + 8 + length),
        );
      if (['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND'].includes(kind))
        parts.push(data.subarray(offset, offset + length + 12));
      else if ((kind.charCodeAt(0) & 32) === 0)
        throw new ImageInputError('format');
      offset += length + 12;
      if (kind === 'IEND') break;
    }
  } else if (header.type === 'image/jpeg') {
    parts.push(data.subarray(0, 2));
    let offset = 2,
      count = 0,
      ended = false;
    while (offset + 2 <= data.length) {
      if (++count > POLICY.imageHeaderSegments || data[offset] !== 255) bad();
      const start = offset;
      while (data[offset] === 255) offset++;
      const marker = data[offset++];
      if (marker === 217) {
        parts.push(data.subarray(start, offset));
        ended = true;
        break;
      }
      if (
        marker === 1 ||
        (marker !== undefined && marker >= 208 && marker <= 215)
      ) {
        parts.push(data.subarray(start, offset));
        continue;
      }
      if (offset + 2 > data.length) bad();
      const length = v.getUint16(offset);
      if (length < 2 || offset + length > data.length) bad();
      if (marker === 225)
        orientation = exifOrientation(
          data.subarray(offset + 2, offset + length),
        );
      if (
        !(marker !== undefined && marker >= 224 && marker <= 239) &&
        marker !== 254
      )
        parts.push(data.subarray(start, offset + length));
      offset += length;
      if (marker === 218) {
        const scan = offset;
        while (offset + 1 < data.length) {
          if (data[offset] !== 255) {
            offset++;
            continue;
          }
          const next = data[offset + 1]!;
          if (next === 0 || (next >= 208 && next <= 215)) {
            offset += 2;
            continue;
          }
          break;
        }
        parts.push(data.subarray(scan, offset));
      }
    }
    if (!ended) bad();
  } else {
    parts.push(data.subarray(0, 12));
    let offset = 12;
    while (offset + 8 <= data.length) {
      const kind = ascii(data, offset, 4),
        length = v.getUint32(offset + 4, true),
        end = offset + 8 + length + (length % 2);
      if (end > data.length) bad();
      if (kind === 'EXIF')
        orientation = exifOrientation(
          data.subarray(offset + 8, offset + 8 + length),
        );
      if (['VP8X', 'ALPH', 'VP8 ', 'VP8L'].includes(kind)) {
        const part = data.slice(offset, end);
        if (kind === 'VP8X') part[8] = part[8]! & 16;
        parts.push(part);
      }
      offset = end;
    }
  }
  const size = parts.reduce((n, p) => n + p.length, 0),
    bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  if (header.type === 'image/webp')
    new DataView(bytes.buffer).setUint32(4, size - 8, true);
  return { bytes, orientation, header };
}
