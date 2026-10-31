import { z } from 'zod';
import { idSchema, labelSchema } from './primitives.js';
import { catalogueEntrySchema } from './catalogue.js';
import {
  estimateOfferSchema,
  serviceScopeSchema,
  sourceUrlSchema,
  shoppingCountries,
  quoteCurrencySchema,
  listedCoverageSchema,
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
/** Observed listing information alone cannot be selected as a project estimate offer. */
export const sourcingListingSchema = z.strictObject({
  priceMinor: z.number().int().min(1).max(1_000_000_000),
  currency: quoteCurrencySchema,
  country: z.string().regex(/^[A-Z]{2}$/),
  unit: z.enum(['item', 'pack', 'can', 'hour', 'job', 'm2', 'm', 'each']),
  volumeMl: z.number().int().min(1).max(100_000).nullable(),
  observedAt: z.number().int().min(0).max(8_640_000_000_000_000).nullable(),
  ...listedCoverageSchema.shape,
});
export const sourcingCandidateSchema = z.strictObject({
  label: labelSchema,
  match: z.enum(['similar', 'custom', 'lead']),
  url: sourceUrlSchema,
  imageUrl: sourceUrlSchema.nullable().optional(),
  listing: sourcingListingSchema.nullable().optional(),
  evidence: z.string().trim().min(1).max(400),
  conditions: z.enum(['standard', 'conditional', 'from', 'unknown']),
  differences: z.array(z.string().min(1).max(240)).max(4),
  offer: estimateOfferSchema.nullable(),
});
/** Operation-local photo lookup; never persisted or accepted as price evidence. */
export const productImagesSchema = z.strictObject({
  images: z
    .array(
      z.strictObject({
        url: sourceUrlSchema,
        imageUrl: sourceUrlSchema.nullable(),
      }),
    )
    .max(3),
});
export const productImagesJsonSchema = () =>
  z.toJSONSchema(productImagesSchema);
export const sourcingReplySchema = z.strictObject({
  candidates: z.array(sourcingCandidateSchema).max(3),
  notes: z.array(z.string().min(1).max(240)).max(6),
});
export type SourcingTarget = z.infer<typeof sourcingTargetSchema>;
export type SourcingBrief = z.infer<typeof sourcingBriefSchema>;
export type SourcingCandidate = z.infer<typeof sourcingCandidateSchema>;
export type SourcingReply = z.infer<typeof sourcingReplySchema>;
export const sourcingReplyJsonSchema = (
  country?: string,
  kind?: SourcingBrief['kind'],
) => {
  if (country !== undefined && !/^[A-Z]{2}$/.test(country))
    throw new Error('invalid-source-country');
  const schema = z.toJSONSchema(sourcingReplySchema);
  // The public saved-record contract contains FX; the model extracts native prices only.
  function nativeOnly(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(nativeOnly);
      return;
    }
    const object = node as Record<string, unknown>;
    for (const union of ['anyOf', 'oneOf']) {
      const branches = object[union];
      if (
        kind &&
        Array.isArray(branches) &&
        branches.every(
          (branch) =>
            branch &&
            typeof branch === 'object' &&
            branch.properties &&
            typeof branch.properties === 'object' &&
            branch.properties.kind &&
            branch.properties.pricing,
        )
      ) {
        object[union] = branches.filter((branch) => {
          const role = branch.properties.kind;
          return role.const === kind || role.enum?.includes(kind);
        });
      }
    }
    if (object.properties && typeof object.properties === 'object') {
      const properties = object.properties as Record<string, unknown>;
      delete properties.fx;
      if (kind && properties.kind && typeof properties.kind === 'object') {
        const role = properties.kind as Record<string, unknown>;
        if (
          role.const === kind ||
          (Array.isArray(role.enum) && role.enum.includes(kind))
        )
          properties.kind = { type: 'string', const: kind };
      }
      // Research only this requested market. Unsupported-market pages must remain leads.
      if (
        country &&
        Object.hasOwn(properties, 'country') &&
        Object.hasOwn(properties, 'currency')
      )
        properties.country = {
          type: 'string',
          enum: shoppingCountries(country),
        };
      if (Array.isArray(object.required))
        object.required = object.required.filter((key) => key !== 'fx');
    }
    Object.values(object).forEach(nativeOnly);
  }
  nativeOnly(schema);
  return schema;
};

/** Optional display media never authorizes a fetch from the backend or a price. */
export function safeProductImage(raw: unknown): string | null {
  const parsed = sourceUrlSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
