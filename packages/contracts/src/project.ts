import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import { roomDocumentSchema } from './room.js';

export const projectSchema = z
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

export const recoverySchema = z
  .strictObject({
    createdAt: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - POLICY.guestLifetimeMs),
    expiresAt: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    project: projectSchema,
    ui: z.strictObject({ view: z.enum(['2d', '3d']) }),
  })
  .refine(
    (v) => v.expiresAt === v.createdAt + POLICY.guestLifetimeMs,
    'Lifetime is fixed',
  );

export type Project = z.infer<typeof projectSchema>;
export type Recovery = z.infer<typeof recoverySchema>;
