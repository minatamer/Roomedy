import { z } from 'zod';
import { idSchema, labelSchema } from './primitives.js';
import { catalogueEntrySchema } from './catalogue.js';
import {
  estimateOfferSchema,
  serviceScopeSchema,
  sourceUrlSchema,
} from './estimates.js';
export const sourcingTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('furniture'), id: idSchema }),
  z.strictObject({
    kind: z.literal('surface'),
    surface: z.enum(['floor', 'north', 'east', 'south', 'west']),
  }),
  z.strictObject({ kind: z.literal('service'), scope: serviceScopeSchema }),
]);
const measure = z.number().int().min(1).max(10000).nullable();
export const sourcingBriefSchema = z
  .strictObject({
    target: sourcingTargetSchema,
    kind: z.enum(['furniture', 'floor', 'paint', 'primer', 'service']),
    category: catalogueEntrySchema.shape.category.nullable(),
    label: labelSchema,
    size: z
      .strictObject({ width: measure, depth: measure, height: measure })
      .nullable(),
    appearance: z.string().max(400),
    colour: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .nullable(),
    query: z.string().trim().max(240),
  })
  .refine(
    (brief) =>
      brief.target.kind === 'furniture'
        ? brief.kind === 'furniture' && brief.category !== null
        : brief.target.kind === 'service'
          ? brief.kind === 'service' &&
            brief.category === null &&
            brief.size === null
          : brief.target.surface === 'floor'
            ? brief.kind === 'floor' &&
              brief.category === null &&
              brief.size === null
            : (brief.kind === 'paint' || brief.kind === 'primer') &&
              brief.category === null &&
              brief.size === null,
    'The brief must match its selected target role.',
  );
export const sourcingCandidateSchema = z.strictObject({
  label: labelSchema,
  match: z.enum(['similar', 'custom', 'lead']),
  url: sourceUrlSchema,
  evidence: z.string().trim().min(1).max(400),
  conditions: z.enum(['standard', 'conditional', 'from', 'unknown']),
  differences: z.array(z.string().min(1).max(240)).max(4),
  offer: estimateOfferSchema.nullable(),
});
export const sourcingReplySchema = z.strictObject({
  candidates: z.array(sourcingCandidateSchema).max(3),
  notes: z.array(z.string().min(1).max(240)).max(6),
});
export type SourcingTarget = z.infer<typeof sourcingTargetSchema>;
export type SourcingBrief = z.infer<typeof sourcingBriefSchema>;
export type SourcingCandidate = z.infer<typeof sourcingCandidateSchema>;
export type SourcingReply = z.infer<typeof sourcingReplySchema>;
export const sourcingReplyJsonSchema = () =>
  z.toJSONSchema(sourcingReplySchema);
