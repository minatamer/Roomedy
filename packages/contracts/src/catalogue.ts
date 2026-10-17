import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import { finishSchema, idSchema, labelSchema } from './primitives.js';

const axisSchema = z
  .strictObject({
    min: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
    max: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
    default: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
  })
  .refine((v) => v.min <= v.default && v.default <= v.max);
export const catalogueEntrySchema = z.strictObject({
  id: idSchema,
  version: z.literal(VERSIONS.catalogue),
  label: labelSchema,
  category: z.enum(['bed', 'desk', 'chair', 'wardrobe', 'storage']),
  size: z.strictObject({
    width: axisSchema,
    depth: axisSchema,
    height: axisSchema,
  }),
  localFront: z.literal('positive-z'),
  representation: z.enum(['procedural', 'prepared-mesh']),
  assetId: idSchema,
  finishes: z.array(finishSchema).min(1).max(6),
  accessMm: z.number().int().min(0).max(2000),
  adjustable: z.boolean(),
});
export const catalogueSchema = z
  .array(catalogueEntrySchema)
  .min(1)
  .max(40)
  .refine(
    (entries) => new Set(entries.map((v) => v.id)).size === entries.length,
  );
export type CatalogueEntry = z.infer<typeof catalogueEntrySchema>;
