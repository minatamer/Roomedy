import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import {
  finishSchema,
  idSchema,
  labelSchema,
  measurementSchema,
  quarterTurnsSchema,
  revisionSchema,
} from './primitives.js';

export const dimensionsSchema = z.strictObject({
  width: measurementSchema(POLICY.furnitureEdgeMm),
  depth: measurementSchema(POLICY.furnitureEdgeMm),
  height: measurementSchema(POLICY.furnitureEdgeMm),
});
export const poseSchema = z.strictObject({
  centerX: z
    .number()
    .int()
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm),
  centerZ: z
    .number()
    .int()
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm),
  quarterTurns: quarterTurnsSchema,
});
export const locksSchema = z.strictObject({
  dimensions: z.boolean(),
  position: z.boolean(),
  rotation: z.boolean(),
});
export const furnitureSchema = z.strictObject({
  id: idSchema,
  label: labelSchema,
  catalogueId: idSchema,
  catalogueVersion: z.literal(VERSIONS.catalogue),
  dimensions: dimensionsSchema,
  pose: poseSchema,
  ownership: z.enum(['owned', 'proposed']),
  preference: z.enum(['keep', 'flexible', 'replace']),
  locks: locksSchema,
  finish: finishSchema,
});
const featureBase = {
  id: idSchema,
  wall: z.enum(['north', 'east', 'south', 'west']),
  offset: measurementSchema(POLICY.roomEdgeMm, 0),
  width: measurementSchema(POLICY.roomEdgeMm),
  height: measurementSchema(POLICY.roomEdgeMm),
  sill: measurementSchema(POLICY.roomEdgeMm, 0),
};
export const featureSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ...featureBase,
    kind: z.literal('door'),
    mechanism: z.enum(['inward', 'outward', 'sliding']),
    hinge: z.enum(['left', 'right']),
  }),
  z.strictObject({
    ...featureBase,
    kind: z.literal('window'),
    mechanism: z.enum(['fixed', 'inward', 'outward', 'sliding']),
  }),
  z.strictObject({
    ...featureBase,
    kind: z.literal('obstacle'),
    projection: measurementSchema(POLICY.roomEdgeMm),
  }),
]);
export const roomDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal(VERSIONS.schema),
    roomId: idSchema,
    roomRevision: revisionSchema,
    unit: z.literal('mm'),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    room: z.strictObject({
      shape: z.literal('rectangle'),
      width: measurementSchema(POLICY.roomEdgeMm),
      depth: measurementSchema(POLICY.roomEdgeMm),
      height: measurementSchema(POLICY.roomEdgeMm),
      floorFinish: finishSchema,
      wallFinish: finishSchema,
      features: z.array(featureSchema).max(POLICY.features),
    }),
    furniture: z.array(furnitureSchema).max(POLICY.furniture),
    intent: z.strictObject({
      condition: z.enum(['empty', 'partial', 'furnished']),
      goals: z
        .array(z.enum(['sleep', 'work', 'storage', 'open-space']))
        .max(4)
        .refine((v) => new Set(v).size === v.length),
      style: z.enum(['warm-simple', 'light-airy', 'calm-focused']),
    }),
  })
  .superRefine((doc, ctx) => {
    const ids = [...doc.furniture, ...doc.room.features].map((item) => item.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate object ID' });
    for (const [i, f] of doc.room.features.entries()) {
      const edge =
        f.wall === 'north' || f.wall === 'south'
          ? doc.room.width.value
          : doc.room.depth.value;
      if (
        edge !== null &&
        f.offset.value !== null &&
        f.width.value !== null &&
        f.offset.value + f.width.value > edge
      )
        ctx.addIssue({
          code: 'custom',
          path: ['room', 'features', i],
          message: 'Feature exceeds its wall',
        });
      if (
        doc.room.height.value !== null &&
        f.sill.value !== null &&
        f.height.value !== null &&
        f.sill.value + f.height.value > doc.room.height.value
      )
        ctx.addIssue({
          code: 'custom',
          path: ['room', 'features', i],
          message: 'Feature exceeds wall height',
        });
    }
  });

export const issueSchema = z.strictObject({
  id: idSchema,
  code: z.enum([
    'outside-room',
    'overlap',
    'door-swing',
    'access',
    'unassessed',
  ]),
  severity: z.enum(['hard', 'warning', 'unassessed']),
  objectIds: z.array(idSchema).max(POLICY.furniture + POLICY.features),
  deficitMm: z.number().int().min(0).max(POLICY.coordinateAbsMm).nullable(),
});
export const checkFactsSchema = z.strictObject({
  roomId: idSchema,
  roomRevision: revisionSchema,
  rulesVersion: z.literal(VERSIONS.rules),
  assessed: z.boolean(),
  issues: z.array(issueSchema).max(2048),
});
export type RoomDocument = z.infer<typeof roomDocumentSchema>;
export type Furniture = z.infer<typeof furnitureSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type CheckFacts = z.infer<typeof checkFactsSchema>;
