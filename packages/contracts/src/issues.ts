import { z } from 'zod';
import { POLICY } from './policy.js';
import { idSchema } from './primitives.js';

const coordinate = z.number().multipleOf(0.5).min(-50000).max(50000);
export const regionSchema = z
  .strictObject({
    minX: coordinate,
    minZ: coordinate,
    maxX: coordinate,
    maxZ: coordinate,
  })
  .refine((r) => r.minX <= r.maxX && r.minZ <= r.maxZ);
export const issueSchema = z.strictObject({
  id: z
    .string()
    .min(1)
    .max(320)
    .regex(/^[a-zA-Z0-9_:/-]+$/),
  code: z.enum([
    'outside-room',
    'overlap',
    'door-swing',
    'access',
    'height',
    'window',
    'obstacle',
    'unassessed',
  ]),
  rule: z.enum([
    'containment',
    'solid',
    'door-envelope',
    'front-access',
    'height',
    'window',
    'obstacle',
    'entry-connectivity',
    'catalogue-supported',
  ]),
  severity: z.enum(['hard', 'warning', 'unassessed']),
  objectIds: z.array(idSchema).max(2),
  deficitMm: z
    .number()
    .multipleOf(0.5)
    .min(0)
    .max(POLICY.coordinateAbsMm * 2)
    .nullable(),
  areaMm2: z
    .number()
    .min(0)
    .max((POLICY.coordinateAbsMm * 2) ** 2)
    .nullable(),
  region: regionSchema.nullable(),
  confidence: z.enum(['confirmed', 'planned', 'approximate', 'unassessed']),
  requiredInputs: z.array(z.string().max(160)).max(16),
  limitation: z
    .enum([
      'conservative-door-envelope',
      'no-tuck-under',
      'configured-access',
      'not-implemented',
      'unknown-input',
      'estimated-input',
    ])
    .nullable(),
});
export type Region = z.infer<typeof regionSchema>;
export type SpatialIssue = z.infer<typeof issueSchema>;

export const ruleCoverageSchema = z.strictObject({
  rule: issueSchema.shape.rule,
  status: z.enum([
    'passed',
    'blocked',
    'warning',
    'approximate',
    'planned',
    'unassessed',
    'not-applicable',
  ]),
  confidence: issueSchema.shape.confidence,
  assessments: z.number().int().min(0).max(POLICY.issueFacts),
  unassessed: z.number().int().min(0).max(POLICY.issueFacts),
});
export type RuleCoverage = z.infer<typeof ruleCoverageSchema>;
