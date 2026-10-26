import { z } from 'zod';
import { idSchema, labelSchema, revisionSchema } from './primitives.js';
import { catalogueEntrySchema } from './catalogue.js';
import { surfaceColorSchema, WALLS } from './surfaces.js';

export const CALCULATION_VERSION = 'roomedy-cpq-1' as const;
/** Supported currencies all have two decimal minor units. No implicit FX. */
export const quoteCurrencySchema = z.enum([
  'EGP',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
]);
export const localitySchema = z.strictObject({
  country: z.string().regex(/^[A-Z]{2}$/),
  city: z.string().trim().min(1).max(80),
  currency: quoteCurrencySchema,
});
const minor = z.number().int().safe().min(0).max(1_000_000_000_000_000);
const unitPrice = z.number().int().min(0).max(1_000_000_000);
const text = z.string().trim().min(1).max(240);
export const sourceUrlSchema = z
  .url({ protocol: /^https$/i, hostname: z.regexes.domain })
  .max(2048)
  .refine(
    (value) =>
      /^https:\/\/[^@:/?#]+(?:[/?#]|$)/i.test(value) &&
      !/^https:\/\/[^/?#]*\.(?:localhost|local)(?:[/?#]|$)/i.test(value),
    'Use a public HTTPS product or supplier page without credentials or ports.',
  );
export const priceSourceSchema = z
  .strictObject({
    kind: z.enum(['sample', 'sourced', 'manual']),
    label: labelSchema,
    url: sourceUrlSchema.nullable(),
    observedAt: z.number().int().min(0).max(8_640_000_000_000_000).nullable(),
    evidence: z.string().max(400),
  })
  .refine(
    (source) =>
      source.kind !== 'sourced' ||
      (source.url !== null &&
        source.observedAt !== null &&
        source.evidence.trim().length > 0),
    'A sourced price needs its page, observation time and bounded evidence.',
  );
const taxSchema = z.strictObject({
  status: z.enum(['included', 'excluded', 'unknown']),
  rateBps: z.number().int().min(0).max(10_000).nullable(),
  source: text.nullable(),
});
const offerBase = {
  id: idSchema,
  label: labelSchema,
  variant: text,
  supplierId: idSchema,
  supplier: labelSchema,
  deliveryGroup: idSchema,
  deliveryIncluded: z.boolean(),
  pricing: z.enum(['price', 'allowance']),
  market: localitySchema,
  source: priceSourceSchema,
  tax: taxSchema,
  availability: z.enum(['available', 'unavailable', 'unknown']),
  leadTime: text.nullable(),
};
export const paintPackSchema = z.strictObject({
  id: idSchema,
  volumeMl: z.number().int().min(250).max(20_000).multipleOf(250),
  priceMinor: unitPrice,
});
const floorOffer = z.strictObject({
  ...offerBase,
  kind: z.literal('floor'),
  system: z.literal('floating-click'),
  priceMinor: unitPrice,
  coverageMm2: z.number().int().min(10_000).max(100_000_000),
  underlay: z.enum(['integrated', 'required', 'unknown']),
});
const accessoryOffer = z.strictObject({
  ...offerBase,
  kind: z.enum(['underlay', 'trim']),
  system: z.literal('floating-click'),
  priceMinor: unitPrice,
  packQuantity: z.number().int().min(100).max(100_000_000),
});
const paintOffer = z
  .strictObject({
    ...offerBase,
    kind: z.enum(['paint', 'primer']),
    coverageMm2PerLitre: z.number().int().min(1_000_000).max(30_000_000),
    colour: z.union([surfaceColorSchema, z.literal('tint-allowance')]),
    sheen: z.enum(['matte', 'satin', 'gloss', 'primer']),
    packs: z
      .array(paintPackSchema)
      .min(1)
      .max(4)
      .refine(
        (packs) => new Set(packs.map((pack) => pack.id)).size === packs.length,
      ),
  })
  .refine(
    (offer) => (offer.kind === 'primer') === (offer.sheen === 'primer'),
    'Primer and topcoat must use their declared finish roles.',
  );
const furnitureOffer = z.strictObject({
  ...offerBase,
  kind: z.literal('furniture'),
  assemblyIncluded: z.boolean(),
  category: catalogueEntrySchema.shape.category,
  priceMinor: unitPrice,
  outerSizeMm: z
    .strictObject({
      width: z.number().int().min(1).max(10_000),
      depth: z.number().int().min(1).max(10_000),
      height: z.number().int().min(1).max(10_000),
    })
    .nullable(),
  components: z
    .array(
      z.strictObject({
        key: idSchema,
        label: labelSchema,
        included: z.boolean(),
        required: z.boolean(),
      }),
    )
    .max(4)
    .refine(
      (parts) => new Set(parts.map((part) => part.key)).size === parts.length,
    ),
});
const componentOffer = z.strictObject({
  ...offerBase,
  kind: z.literal('component'),
  key: idSchema,
  priceMinor: unitPrice,
});
export const serviceScopeSchema = z.enum([
  'floor-prep',
  'floor-install',
  'paint-prep',
  'paint-labour',
  'assembly',
  'mounting',
  'moving',
  'disposal',
  'delivery',
  'consumables',
  'custom',
]);
const serviceOffer = z.strictObject({
  ...offerBase,
  kind: z.literal('service'),
  scope: serviceScopeSchema,
  basis: z.enum(['m2', 'm', 'hour', 'job', 'each']),
  priceMinor: unitPrice,
  minimumMinor: unitPrice,
  includedWork: text,
});
export const estimateOfferSchema = z.discriminatedUnion('kind', [
  floorOffer,
  accessoryOffer,
  paintOffer,
  furnitureOffer,
  componentOffer,
  serviceOffer,
]);
export const estimateOffersSchema = z
  .array(estimateOfferSchema)
  .max(160)
  .refine(
    (offers) => new Set(offers.map((offer) => offer.id)).size === offers.length,
  );
const optionalOffer = idSchema.nullable();
const wallSchema = z.enum(WALLS);
const targetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('furniture'), id: idSchema }),
  z.strictObject({
    kind: z.literal('surface'),
    surface: z.enum(['floor', ...WALLS]),
  }),
  z.strictObject({ kind: z.literal('room'), id: idSchema }),
]);
export const estimateSettingsSchema = z.strictObject({
  roomId: idSchema,
  locality: localitySchema,
  floor: z.strictObject({
    enabled: z.boolean(),
    offerId: optionalOffer,
    excludedMm2: z.number().int().min(0).max(400_000_000),
    wasteBps: z.number().int().min(0).max(3000),
    underlayOfferId: optionalOffer,
    trimOfferId: optionalOffer,
    trimLengthMm: z.number().int().min(0).max(100_000).nullable(),
    retainTrim: z.boolean(),
    preparation: z.enum(['assess', 'include', 'exclude']),
  }),
  walls: z
    .array(
      z.strictObject({
        wall: wallSchema,
        enabled: z.boolean(),
        paintOfferId: optionalOffer,
        coats: z.number().int().min(1).max(4),
        primer: z.enum(['assess', 'include', 'exclude']),
        primerOfferId: optionalOffer,
        primerCoats: z.number().int().min(1).max(3),
        substrate: z.enum(['unknown', 'sound-painted', 'new-plaster']),
      }),
    )
    .length(4)
    .refine((walls) => new Set(walls.map((wall) => wall.wall)).size === 4),
  furniture: z
    .array(
      z.strictObject({
        id: idSchema,
        mode: z.enum(['reuse', 'buy']),
        offerId: optionalOffer,
        components: z
          .array(
            z.strictObject({
              key: idSchema,
              mode: z.enum(['reuse', 'buy']),
              offerId: optionalOffer,
            }),
          )
          .max(4)
          .refine(
            (parts) =>
              new Set(parts.map((part) => part.key)).size === parts.length,
          ),
      }),
    )
    .max(40)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
    ),
  services: z
    .array(
      z.strictObject({
        scope: serviceScopeSchema.exclude(['delivery']),
        enabled: z.boolean(),
        offerId: optionalOffer,
        /** Minutes for hourly services; each/job counts otherwise. Area/length derive from takeoff. */
        quantity: z.number().int().min(0).max(100_000).nullable(),
      }),
    )
    .max(10)
    .refine(
      (services) =>
        new Set(services.map((service) => service.scope)).size ===
        services.length,
    ),
  fulfilment: z.enum(['delivery', 'collection']),
  deliveries: z
    .array(z.strictObject({ group: idSchema, offerId: optionalOffer }))
    .max(40)
    .refine(
      (groups) =>
        new Set(groups.map((group) => group.group)).size === groups.length,
    ),
  allowances: z
    .array(
      z.strictObject({
        id: idSchema,
        label: labelSchema,
        amountMinor: minor,
        reason: text,
      }),
    )
    .max(12)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
    ),
});
export const estimateQuantitySchema = z.strictObject({
  numerator: z.number().int().safe().min(0),
  denominator: z.number().int().safe().min(1),
  unit: z.enum(['mm2', 'mm', 'ml', 'minute', 'each', 'pack', 'can', 'job']),
});
export const estimateLineSchema = z.strictObject({
  id: idSchema,
  category: z.enum([
    'floor',
    'walls',
    'furniture',
    'services',
    'delivery',
    'tax',
    'allowance',
  ]),
  label: labelSchema,
  targets: z.array(targetSchema).min(1).max(40),
  pricing: z.enum([
    'sample',
    'sourced',
    'manual',
    'allowance',
    'included',
    'unpriced',
  ]),
  amountMinor: minor.nullable(),
  quantity: estimateQuantitySchema.nullable(),
  installed: estimateQuantitySchema.nullable(),
  required: estimateQuantitySchema.nullable(),
  purchased: estimateQuantitySchema.nullable(),
  packs: z
    .array(
      z.strictObject({
        id: idSchema,
        count: z.number().int().min(0).max(100_000),
      }),
    )
    .max(4),
  offerIds: z.array(idSchema).max(8),
  quantityStatus: z.enum(['known', 'estimated', 'incomplete']),
  rule: z.string().min(1).max(600),
  notes: z.array(text).max(8),
});
export const roomEstimateSchema = z.strictObject({
  calculationVersion: z.literal(CALCULATION_VERSION),
  roomId: idSchema,
  roomRevision: revisionSchema,
  locality: localitySchema,
  lines: z
    .array(estimateLineSchema)
    .max(512)
    .refine(
      (lines) => new Set(lines.map((line) => line.id)).size === lines.length,
    ),
  pricedSubtotalMinor: minor,
  allowanceMinor: minor,
  taxMinor: minor,
  knownTotalMinor: minor,
  totalMinor: minor.nullable(),
  complete: z.boolean(),
  unpricedCount: z.number().int().min(0).max(512),
  assumptions: z.array(text).max(32),
});
export type Locality = z.infer<typeof localitySchema>;
export type EstimateOffer = z.infer<typeof estimateOfferSchema>;
export type EstimateSettings = z.infer<typeof estimateSettingsSchema>;
export type EstimateLine = z.infer<typeof estimateLineSchema>;
export type RoomEstimate = z.infer<typeof roomEstimateSchema>;
export type EstimateQuantity = z.infer<typeof estimateQuantitySchema>;
export type EstimateTarget = z.infer<typeof targetSchema>;
