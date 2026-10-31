import { z } from 'zod';
import { idSchema, labelSchema, revisionSchema } from './primitives.js';
import { catalogueEntrySchema } from './catalogue.js';
import { surfaceColorSchema, WALLS } from './surfaces.js';

export const CALCULATION_VERSION = 'roomedy-cpq-1' as const;
export const DEFAULT_QUOTE_CURRENCY = 'USD' as const;
/** Historical/native source currencies; active estimates use USD. Two decimal minor units. */
export const quoteCurrencySchema = z.enum([
  'USD',
  'EGP',
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
/** Application-owned, frozen reference conversion. Never supplied by a model. */
export const estimateFxSchema = z.strictObject({
  currency: z.enum(['EGP', 'EUR', 'GBP', 'AED', 'SAR']),
  usdPerUnit: z.string().regex(/^(?:0|[1-9]\d{0,3})(?:\.\d{1,12})?$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observedAt: z.number().int().min(0).max(8_640_000_000_000_000),
  url: sourceUrlSchema,
  inputs: z
    .array(
      z.strictObject({
        key: z.string().min(1).max(140),
        minor: unitPrice,
      }),
    )
    .min(1)
    .max(4),
});
export type EstimateFx = z.infer<typeof estimateFxSchema>;
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
  fx: estimateFxSchema.optional(),
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
export const listedCoverageSchema = z.strictObject({
  coverageMm2: z
    .number()
    .int()
    .min(10_000)
    .max(1_000_000_000)
    .nullable()
    .optional(),
  coverageMm2PerLitre: z
    .number()
    .int()
    .min(10_000)
    .max(1_000_000_000)
    .nullable()
    .optional(),
});
export const selectedTakeoffSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('floor'),
    mode: z.enum(['automatic', 'manual']),
    coverageMm2: z.number().int().min(10_000).max(1_000_000_000),
    coverageSource: z.enum(['product', 'planning', 'visitor']),
  }),
  z.strictObject({
    kind: z.literal('paint'),
    mode: z.enum(['automatic', 'manual']),
    coverageMm2PerLitre: z.number().int().min(10_000).max(1_000_000_000),
    coverageSource: z.enum(['product', 'planning', 'visitor']),
    volumeMl: z.number().int().min(1).max(100_000),
    volumeSource: z.enum(['product', 'planning', 'visitor']),
  }),
]);
export type SelectedTakeoff = z.infer<typeof selectedTakeoffSchema>;
/** Editable planning assumptions, not merchant specifications. Matches existing authored examples. */
export const LISTED_PLANNING_COVERAGE = {
  floorMm2: 2_200_000,
  paintMm2PerLitre: 10_000_000,
  canMl: 5000,
} as const;
export const selectedPriceSchema = z.strictObject({
  key: z.string().min(1).max(96),
  scope: z.string().min(1).max(2048),
  label: labelSchema,
  url: sourceUrlSchema,
  simulation: z.boolean(),
  unitPriceMinor: unitPrice,
  unit: z.enum(['each', 'pack', 'can', 'm2']),
  quantity: z.number().int().min(1).max(100_000),
  quantityConfirmed: z.boolean(),
  qualifier: z.string().max(200),
  targets: z.array(targetSchema).min(1).max(4),
  takeoff: selectedTakeoffSchema.optional(),
});
export type SelectedPrice = z.infer<typeof selectedPriceSchema>;
export const estimateSettingsSchema = z
  .strictObject({
    roomId: idSchema,
    /** Explicit fresh demo scope; missing geometry uses disposable planning quantities. */
    demoScope: z.literal('materials').optional(),
    locality: localitySchema,
    /** Visitor-selected listing prices; provisional until fit and coverage are reviewed. */
    selectedPrices: z
      .array(selectedPriceSchema)
      .max(45)
      .refine(
        (prices) =>
          new Set(prices.map((price) => price.key)).size === prices.length,
      )
      .optional(),
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
  })
  .refine(
    (settings) =>
      !settings.demoScope ||
      (settings.fulfilment === 'collection' &&
        settings.floor.preparation === 'exclude' &&
        settings.walls.every((wall) => wall.primer === 'exclude') &&
        settings.services.every((service) => !service.enabled)),
    'The simplified scope excludes installation, preparation, primer and delivery.',
  );
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
    'listed',
    'manual',
    'allowance',
    'included',
    'unpriced',
  ]),
  amountMinor: minor.nullable(),
  productKey: z.string().min(1).max(96).optional(),
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
/** Accepted financial inputs, shared with the bounded room Undo history. */
export const productChoiceSchema = z.strictObject({
  key: z.string().min(1).max(96),
  scope: z.string().min(1).max(2048),
  label: labelSchema,
  url: sourceUrlSchema,
  imageUrl: sourceUrlSchema.nullable(),
  simulation: z.boolean(),
  offerId: optionalOffer,
  /** Legacy display reference; recognized USD formats can be upgraded in the working draft. */
  quotedPrice: z.string().min(1).max(200).nullable(),
  listingPrice: z
    .strictObject({
      priceMinor: unitPrice,
      currency: quoteCurrencySchema,
      country: z.string().regex(/^[A-Z]{2}$/),
      unit: z.enum(['item', 'pack', 'can', 'hour', 'job', 'm2', 'm', 'each']),
      volumeMl: z.number().int().min(1).max(1_000_000).nullable(),
      unavailable: z.boolean(),
      ...listedCoverageSchema.shape,
    })
    .optional(),
});
export type ProductChoice = z.infer<typeof productChoiceSchema>;
export const productChoicesSchema = z
  .array(productChoiceSchema)
  .max(45)
  .refine(
    (choices) =>
      new Set(choices.map((choice) => choice.key)).size === choices.length,
  );
export const estimateStateSchema = z.strictObject({
  settings: estimateSettingsSchema,
  offers: estimateOffersSchema,
  budgetMinor: minor.nullable(),
  productChoices: productChoicesSchema.optional(),
});
export type EstimateState = z.infer<typeof estimateStateSchema>;

/** Coarse demo shopping regions, not delivery or residence verification. */
const EUROPE_SHOPPING =
  'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB NO CH IS LI'.split(
    ' ',
  );
const MENA_SHOPPING = 'EG AE SA QA KW BH OM JO LB MA DZ TN'.split(' ');
export function shoppingCountries(country: string): readonly string[] {
  return country === 'ZZ'
    ? ['US', ...EUROPE_SHOPPING, ...MENA_SHOPPING]
    : EUROPE_SHOPPING.includes(country)
      ? [...EUROPE_SHOPPING]
      : MENA_SHOPPING.includes(country)
        ? [...MENA_SHOPPING]
        : [country];
}
