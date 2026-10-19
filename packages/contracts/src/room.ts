import { z } from 'zod';
import { issueSchema, ruleCoverageSchema } from './issues.js';
export { issueSchema } from './issues.js';
import { POLICY, VERSIONS } from './policy.js';
import {
  finishSchema,
  factProvenanceSchema,
  poseProvenanceSchema,
  idSchema,
  labelSchema,
  measurementSchema,
  quarterTurnsSchema,
  revisionSchema,
} from './primitives.js';

/** Initial product defaults only; imported and visitor-selected locks stay authoritative. */
export const DEFAULT_FURNITURE_LOCKS = Object.freeze({
  position: false,
  rotation: false,
  dimensions: true,
});

export const dimensionsSchema = z.strictObject({
  width: measurementSchema(POLICY.furnitureEdgeMm),
  depth: measurementSchema(POLICY.furnitureEdgeMm),
  height: measurementSchema(POLICY.furnitureEdgeMm),
});
export const poseTargetSchema = z.strictObject({
  centerX: z
    .number()
    .multipleOf(0.5)
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm),
  centerZ: z
    .number()
    .multipleOf(0.5)
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm),
  quarterTurns: quarterTurnsSchema,
});
export const poseSchema = poseTargetSchema.extend({
  provenance: poseProvenanceSchema,
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
  wall: z.enum(['north', 'east', 'south', 'west', 'unknown']),
  wallProvenance: factProvenanceSchema,
  offset: measurementSchema(POLICY.roomEdgeMm, 0),
  width: measurementSchema(POLICY.roomEdgeMm),
  height: measurementSchema(POLICY.roomEdgeMm),
  sill: measurementSchema(POLICY.roomEdgeMm, 0),
};
export const featureSchema = z
  .discriminatedUnion('kind', [
    z.strictObject({
      ...featureBase,
      kind: z.literal('door'),
      mechanism: z.enum(['inward', 'outward', 'sliding', 'unknown']),
      mechanismProvenance: factProvenanceSchema,
      hinge: z.enum(['left', 'right', 'unknown']),
      hingeProvenance: factProvenanceSchema,
    }),
    z.strictObject({
      ...featureBase,
      kind: z.literal('window'),
      mechanism: z.enum(['fixed', 'inward', 'outward', 'sliding', 'unknown']),
      mechanismProvenance: factProvenanceSchema,
    }),
    z.strictObject({
      ...featureBase,
      kind: z.literal('obstacle'),
      projection: measurementSchema(POLICY.roomEdgeMm),
    }),
  ])
  .superRefine((feature, ctx) => {
    const check = (value: string, status: string, field: string) => {
      if ((value === 'unknown') !== (status === 'unknown'))
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Unknown fact and evidence must agree',
        });
    };
    check(feature.wall, feature.wallProvenance.status, 'wallProvenance');
    if (feature.kind !== 'obstacle')
      check(
        feature.mechanism,
        feature.mechanismProvenance.status,
        'mechanismProvenance',
      );
    if (feature.kind === 'door')
      check(feature.hinge, feature.hingeProvenance.status, 'hingeProvenance');
  });
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
    const ids = [
      doc.roomId,
      ...[...doc.furniture, ...doc.room.features].map((item) => item.id),
    ];
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate object ID' });
  });

export const checkFactsSchema = z.strictObject({
  roomId: idSchema,
  roomRevision: revisionSchema,
  rulesVersion: z.literal(VERSIONS.rules),
  assessed: z.boolean(),
  coverage: z
    .array(ruleCoverageSchema)
    .length(9)
    .refine((items) => new Set(items.map((item) => item.rule)).size === 9),
  issues: z.array(issueSchema).max(POLICY.issueFacts),
});
export type RoomDocument = z.infer<typeof roomDocumentSchema>;
export type Furniture = z.infer<typeof furnitureSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type CheckFacts = z.infer<typeof checkFactsSchema>;
