import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import { roomDocumentSchema } from './room.js';
import { idSchema } from './primitives.js';
import {
  CALCULATION_VERSION,
  estimateStateSchema,
  roomEstimateSchema,
} from './estimates.js';

const legacyProjectSchema = z
  .strictObject({
    format: z.literal('roomedy-project'),
    version: z.literal(1),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    current: roomDocumentSchema,
    baseline: roomDocumentSchema,
  })
  .refine(
    (p) => p.current.roomId === p.baseline.roomId,
    'Baseline must belong to this room',
  );

export const ESTIMATE_VERSION_LIMIT = 4;
export const estimateVersionSchema = z
  .strictObject({
    id: idSchema,
    label: z.string().trim().min(1).max(80),
    savedAt: z.number().int().min(0).max(8_640_000_000_000_000),
    approval: z.literal('consumer-planning'),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    representationVersion: z.literal('roomedy-cpq-1'),
    calculationVersion: z.literal(CALCULATION_VERSION),
    room: roomDocumentSchema,
    pricing: estimateStateSchema,
    estimate: roomEstimateSchema,
  })
  .refine(
    (v) =>
      v.room.roomId === v.pricing.settings.roomId &&
      v.room.roomId === v.estimate.roomId &&
      v.room.roomRevision === v.estimate.roomRevision,
    'Snapshot identity must match',
  );
const currentProjectSchema = z
  .strictObject({
    format: z.literal('roomedy-project'),
    version: z.literal(2),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    current: roomDocumentSchema,
    baseline: roomDocumentSchema,
    cost: estimateStateSchema.nullable(),
    versions: z.array(estimateVersionSchema).max(ESTIMATE_VERSION_LIMIT),
  })
  .refine(
    (p) =>
      p.current.roomId === p.baseline.roomId &&
      (!p.cost || p.cost.settings.roomId === p.current.roomId) &&
      p.versions.every((v) => v.room.roomId === p.current.roomId) &&
      new Set(p.versions.map((v) => v.id)).size === p.versions.length,
    'Project rooms and unique version identities must match',
  );
/** Explicit migration: old closed room files acquire no inferred prices or approvals. */
export const projectSchema = z
  .union([legacyProjectSchema, currentProjectSchema])
  .transform((p) =>
    p.version === 1
      ? { ...p, version: 2 as const, cost: null, versions: [] }
      : p,
  );

export const recoverySchema = z
  .strictObject({
    createdAt: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - POLICY.guestLifetimeMs),
    expiresAt: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    project: projectSchema,
    ui: z.strictObject({
      view: z.enum(['2d', '3d']),
      destination: z.enum(['design', 'cost']).default('design'),
    }),
  })
  .refine(
    (v) => v.expiresAt === v.createdAt + POLICY.guestLifetimeMs,
    'Lifetime is fixed',
  );

export type Project = z.infer<typeof projectSchema>;
export type Recovery = z.infer<typeof recoverySchema>;
export type EstimateVersion = z.infer<typeof estimateVersionSchema>;
