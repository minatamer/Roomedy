import { z } from 'zod';

export const idSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
export const labelSchema = z.string().trim().min(1).max(120);
export const revisionSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);
export const quarterTurnsSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export const finishSchema = z.enum([
  'oak',
  'ivory',
  'clay',
  'sage',
  'walnut',
  'charcoal',
]);

export function measurementSchema(max: number, min = 1) {
  const known = {
    value: z.number().int().min(min).max(max),
    sourceId: idSchema,
  };
  return z.discriminatedUnion('status', [
    z.strictObject({
      status: z.literal('unknown'),
      value: z.null(),
      sourceId: z.null(),
    }),
    ...(['estimated', 'extracted', 'scan-derived', 'confirmed'] as const).map(
      (status) => z.strictObject({ status: z.literal(status), ...known }),
    ),
  ]);
}

/** Untrusted recognition candidates cannot assert confirmation. */
export function candidateMeasurementSchema(max: number, min = 1) {
  return measurementSchema(max, min).refine(
    (m) => m.status !== 'confirmed',
    'Confirmation requires explicit trusted intent',
  );
}

export type Measurement = z.infer<ReturnType<typeof measurementSchema>>;
