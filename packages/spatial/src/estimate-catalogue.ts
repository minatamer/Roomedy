import type { RoomDocument } from '@roomedy/contracts/room';
import {
  estimateOffersSchema,
  estimateSettingsSchema,
} from '@roomedy/contracts/estimates';
import { WALLS } from '@roomedy/contracts/surfaces';
import { findCatalogueEntry } from './catalogue.js';

/** Fresh authored fixtures, never merchant observations or a mutable global price list. */
export function sampleEstimateOffers() {
  const market = { country: 'EG', city: 'Cairo', currency: 'EGP' } as const;
  const base = (id: string, label: string, supplierId: string) => ({
    id,
    label,
    variant: 'Authored planning example',
    supplierId,
    supplier: `Sample ${supplierId.replace('sample-', '').replaceAll('-', ' ')}`,
    deliveryGroup: supplierId,
    deliveryIncluded: false,
    pricing: 'price',
    market,
    source: {
      kind: 'sample',
      label: 'Roomedy authored sample',
      url: null,
      observedAt: null,
      evidence:
        'Invented demonstration amounts and yields. Not researched prices, stock, local availability or an installation specification.',
    },
    tax: {
      status: 'included',
      rateBps: null,
      source: 'Authored gross-price example; no actual tax rule asserted.',
    },
    availability: 'unknown',
    leadTime: null,
  });
  const floor = (
    id: string,
    label: string,
    priceMinor: number,
    underlay: string,
  ) => ({
    ...base(id, label, 'sample-floor-shop'),
    kind: 'floor',
    system: 'floating-click',
    coverageMm2: 2_200_000,
    priceMinor,
    underlay,
  });
  const crew = (
    scope: string,
    label: string,
    basis: string,
    priceMinor: number,
    minimumMinor: number,
    includedWork: string,
  ) => ({
    ...base(`sample-${scope}`, label, 'sample-local-crew'),
    kind: 'service',
    pricing: ['moving', 'disposal', 'consumables'].includes(scope)
      ? 'allowance'
      : 'price',
    scope,
    basis,
    priceMinor,
    minimumMinor,
    includedWork,
  });
  const furniture = [
    ['bed', 'Bed frame', 850_000],
    ['desk', 'Desk', 280_000],
    ['chair', 'Work chair', 320_000],
    ['wardrobe', 'Wardrobe', 950_000],
    ['storage', 'Storage', 180_000],
    ['mirror', 'Mirror', 140_000],
    ['tv', 'TV', 800_000],
    ['seating', 'Seating', 350_000],
    ['table', 'Side table', 150_000],
    ['lighting', 'Lamp', 90_000],
  ] as const;
  return estimateOffersSchema.parse([
    floor('sample-floor-oak', 'Oak-look click flooring', 85_000, 'required'),
    floor('sample-floor-value', 'Simple click flooring', 70_000, 'required'),
    floor(
      'sample-floor-integrated',
      'Click flooring with integrated underlay',
      110_000,
      'integrated',
    ),
    {
      ...base(
        'sample-underlay',
        'Compatible underlay roll',
        'sample-floor-shop',
      ),
      kind: 'underlay',
      system: 'floating-click',
      packQuantity: 20_000_000,
      priceMinor: 100_000,
    },
    {
      ...base('sample-trim', 'Skirting stock length', 'sample-floor-shop'),
      kind: 'trim',
      system: 'floating-click',
      packQuantity: 2400,
      priceMinor: 20_000,
    },
    {
      ...base('sample-paint', 'Matte wall paint', 'sample-paint-shop'),
      kind: 'paint',
      colour: 'tint-allowance',
      sheen: 'matte',
      coverageMm2PerLitre: 10_000_000,
      packs: [
        { id: 'paint-1l', volumeMl: 1000, priceMinor: 40_000 },
        { id: 'paint-5l', volumeMl: 5000, priceMinor: 150_000 },
      ],
    },
    {
      ...base('sample-primer', 'Wall primer', 'sample-paint-shop'),
      kind: 'primer',
      colour: 'tint-allowance',
      sheen: 'primer',
      coverageMm2PerLitre: 8_000_000,
      packs: [
        { id: 'primer-1l', volumeMl: 1000, priceMinor: 25_000 },
        { id: 'primer-5l', volumeMl: 5000, priceMinor: 90_000 },
      ],
    },
    ...furniture.map(([category, label, priceMinor]) => ({
      ...base(`sample-${category}`, label, 'sample-furniture-shop'),
      kind: 'furniture',
      assemblyIncluded: false,
      category,
      priceMinor,
      outerSizeMm: null,
      components:
        category === 'bed'
          ? [
              {
                key: 'bed-base',
                label: 'Bed base',
                included: true,
                required: true,
              },
              {
                key: 'mattress',
                label: 'Mattress',
                included: false,
                required: true,
              },
            ]
          : [],
    })),
    {
      ...base('sample-mattress', 'Mattress allowance', 'sample-furniture-shop'),
      kind: 'component',
      pricing: 'allowance',
      key: 'mattress',
      priceMinor: 450_000,
    },
    crew(
      'floor-prep',
      'Light subfloor preparation',
      'm2',
      2500,
      50_000,
      'Light preparation only; moisture, levelling and hidden damage need assessment.',
    ),
    crew(
      'floor-install',
      'Floating floor installation',
      'm2',
      12_000,
      100_000,
      'Install the selected floor over the net installed area. Materials and preparation separate.',
    ),
    crew(
      'paint-prep',
      'Light wall preparation',
      'm2',
      2000,
      50_000,
      'Cleaning, light filling, sanding and protection. Major repairs excluded.',
    ),
    crew(
      'paint-labour',
      'Wall coating labour',
      'm2',
      6500,
      100_000,
      'Apply the selected primer/topcoat system over net wall area. Preparation and materials separate.',
    ),
    crew(
      'assembly',
      'Furniture assembly',
      'each',
      20_000,
      20_000,
      'One newly purchased furniture item; wall mounting needs a specific supplier quote.',
    ),
    crew(
      'moving',
      'Move and protect existing furniture',
      'job',
      40_000,
      40_000,
      'Move within this home and return after work. Between-address relocation excluded.',
    ),
    crew(
      'disposal',
      'Removal and disposal allowance',
      'job',
      25_000,
      25_000,
      'Small-room debris allowance; actual volume, access and disposal terms need review.',
    ),
    crew(
      'consumables',
      'Protection and consumables',
      'job',
      20_000,
      20_000,
      'One job allowance for protection and ordinary consumables; no duplicate material waste.',
    ),
    ...[
      ['sample-floor-shop', 25_000],
      ['sample-paint-shop', 15_000],
      ['sample-furniture-shop', 30_000],
    ].map(([group, priceMinor]) => ({
      ...base(
        `delivery-${group}`,
        'Supplier delivery allowance',
        String(group),
      ),
      kind: 'service',
      scope: 'delivery',
      pricing: 'allowance',
      basis: 'job',
      priceMinor,
      minimumMinor: priceMinor,
      includedWork:
        'One compatible supplier order to the selected area. Access and actual availability need confirmation.',
    })),
  ]);
}

/** Unverified site conditions stay explicit; selecting a sample is never a confirmed survey. */
export function defaultEstimateSettings(room: RoomDocument) {
  return estimateSettingsSchema.parse({
    roomId: room.roomId,
    locality: { country: 'EG', city: 'Cairo', currency: 'EGP' },
    floor: {
      enabled: true,
      offerId: 'sample-floor-oak',
      excludedMm2: 0,
      wasteBps: 1000,
      underlayOfferId: 'sample-underlay',
      trimOfferId: 'sample-trim',
      trimLengthMm: null,
      retainTrim: false,
      preparation: 'assess',
    },
    walls: WALLS.map((wall) => ({
      wall,
      enabled: true,
      paintOfferId: 'sample-paint',
      coats: 2,
      primer: 'assess',
      primerOfferId: 'sample-primer',
      primerCoats: 1,
      substrate: 'unknown',
    })),
    furniture: room.furniture.map((piece) => {
      const category = findCatalogueEntry(
        piece.catalogueId,
        piece.catalogueVersion,
      )?.category;
      return {
        id: piece.id,
        mode: piece.ownership === 'owned' ? 'reuse' : 'buy',
        offerId: category ? `sample-${category}` : null,
        components:
          category === 'bed'
            ? [{ key: 'mattress', mode: 'buy', offerId: 'sample-mattress' }]
            : [],
      };
    }),
    services: [
      'floor-prep',
      'floor-install',
      'paint-prep',
      'paint-labour',
      'assembly',
      'mounting',
      'moving',
      'disposal',
      'consumables',
    ].map((scope) => ({
      scope,
      enabled:
        scope === 'moving'
          ? room.furniture.some((piece) => piece.ownership === 'owned')
          : scope === 'mounting'
            ? room.furniture.some(
                (piece) =>
                  piece.ownership === 'proposed' &&
                  findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
                    ?.placement === 'wall',
              )
            : true,
      offerId: scope === 'mounting' ? null : `sample-${scope}`,
      quantity:
        scope === 'moving' || scope === 'disposal' || scope === 'consumables'
          ? 1
          : null,
    })),
    fulfilment: 'delivery',
    deliveries: [
      'sample-floor-shop',
      'sample-paint-shop',
      'sample-furniture-shop',
    ].map((group) => ({ group, offerId: `delivery-${group}` })),
    allowances: [],
  });
}
