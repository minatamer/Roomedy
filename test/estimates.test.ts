import { describe, expect, it } from 'vitest';
import {
  calculateRoomEstimate,
  defaultEstimateSettings,
  sampleEstimateOffers,
  estimateWallAreas,
  paintPackPlan,
  estimateMoney,
} from '@roomedy/spatial';
import {
  estimateOffersSchema,
  estimateSettingsSchema,
  sourceUrlSchema,
} from '@roomedy/contracts/estimates';
import type {
  EstimateOffer,
  EstimateSettings,
} from '@roomedy/contracts/estimates';
import { withRoomSurface } from '@roomedy/contracts/surfaces';
import {
  commandRoom,
  known,
  unknown,
  piece,
  door,
  windowFeature,
} from './fixtures/command-room.js';

function measuredRoom() {
  const entrance = door(),
    window = windowFeature();
  entrance.wall = 'south';
  entrance.width = known(900);
  entrance.height = known(2100);
  entrance.sill = known(0);
  window.offset = known(2500);
  window.width = known(1200);
  window.height = known(1100);
  window.sill = known(900);
  const room = commandRoom([], [entrance, window]);
  room.room.width = known(4200);
  room.room.depth = known(4800);
  room.room.height = known(2600);
  return room;
}
function reviewedSettings(room = measuredRoom()) {
  const settings = defaultEstimateSettings(room);
  settings.floor.preparation = 'include';
  settings.floor.trimLengthMm = 17_100;
  for (const wall of settings.walls) {
    wall.primer = 'include';
    wall.substrate = 'sound-painted';
  }
  return settings;
}
function onlyPurchases(settings: EstimateSettings) {
  settings.floor.enabled = false;
  for (const wall of settings.walls) wall.enabled = false;
  for (const service of settings.services) service.enabled = false;
  settings.fulfilment = 'collection';
  return settings;
}
function calculate(
  room = measuredRoom(),
  settings = reviewedSettings(room),
  offers = sampleEstimateOffers(),
) {
  const result = calculateRoomEstimate(room, settings, offers);
  if (!result.ok) throw new Error(result.code);
  return result.estimate;
}
const goods = <K extends EstimateOffer['kind']>(
  offers: EstimateOffer[],
  id: string,
  kind: K,
) => {
  const offer = offers.find((value) => value.id === id);
  if (!offer || offer.kind !== kind) throw new Error('fixture-offer');
  return offer as EstimateOffer & { kind: K };
};

describe('independent whole-room takeoff and price cases', () => {
  it('calculates20.16m² floor,43.59m² walls, waste once, eleven packs and installed-area labour', () => {
    const estimate = calculate();
    expect(estimate.locality.currency).toBe('USD');
    const floor = estimate.lines.find((line) =>
      line.offerIds.includes('sample-floor-oak'),
    )!;
    expect(floor.installed).toEqual({
      numerator: 20_160_000,
      denominator: 1,
      unit: 'mm2',
    });
    expect(floor.required).toEqual({
      numerator: 221_760_000_000,
      denominator: 10_000,
      unit: 'mm2',
    });
    expect(floor.quantity?.numerator).toBe(11);
    expect(floor.purchased?.numerator).toBe(24_200_000);
    expect(floor.amountMinor).toBe(46_200);
    const labour = estimate.lines.find((line) =>
      line.offerIds.includes('sample-floor-install'),
    )!;
    expect(labour.amountMinor).toBe(12_096);
    expect(floor.amountMinor! + labour.amountMinor!).toBe(58_296);
    expect(
      estimate.lines.filter((line) => line.category === 'delivery'),
    ).toHaveLength(2);
    expect(estimate.complete).toBe(true);
    expect(estimate.totalMinor).toBe(148_588);
    expect(estimate.allowanceMinor).toBe(16_000);
    expect(
      estimate.pricedSubtotalMinor +
        estimate.allowanceMinor +
        estimate.taxMinor,
    ).toBe(estimate.knownTotalMinor);
  });
  it('subtracts the opening union once, clips outside regions, and preserves missing facts', () => {
    const room = measuredRoom(),
      first = windowFeature(),
      second = windowFeature();
    second.id = 'window_two';
    first.offset = known(100);
    first.sill = known(500);
    second.offset = known(600);
    second.sill = known(1000);
    room.room.features = [first, second];
    const north = estimateWallAreas(room).find(
      (wall) => wall.wall === 'north',
    )!;
    expect(north.deductedMm2).toBe(1_750_000);
    expect(north.netMm2).toBe(9_170_000);
    first.offset = known(4000);
    first.sill = known(2400);
    room.room.features = [first];
    expect(estimateWallAreas(room)[0]).toMatchObject({
      netMm2: 10_880_000,
      deductedMm2: 40_000,
      status: 'estimated',
    });
    first.offset = unknown();
    expect(estimateWallAreas(room)[0]!.netMm2).toBeNull();
    expect(estimateWallAreas(room)[1]!.netMm2).toBe(12_480_000);
  });
  it('groups identical paint/colour before selecting cans and keeps different colours separate', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room);
    const estimate = calculate(room, settings);
    const paint = estimate.lines.find((line) =>
        line.offerIds.includes('sample-paint'),
      )!,
      primer = estimate.lines.find((line) =>
        line.offerIds.includes('sample-primer'),
      )!;
    expect(paint.installed?.numerator).toBe(43_590_000);
    expect(paint.required).toEqual({
      numerator: 87_180_000_000,
      denominator: 10_000_000,
      unit: 'ml',
    });
    expect(paint.purchased?.numerator).toBe(10_000);
    expect(paint.amountMinor).toBe(11_200);
    expect(primer.required!.numerator / primer.required!.denominator).toBe(
      5448.75,
    );
    expect(primer.purchased?.numerator).toBe(6000);
    expect(primer.amountMinor).toBe(5_000);
    room.room = withRoomSurface(room.room, {
      surface: 'north',
      color: '#526577',
    });
    const colours = calculate(room, settings).lines.filter((line) =>
      line.offerIds.includes('sample-paint'),
    );
    expect(colours).toHaveLength(2);
    expect(
      colours.map((line) => ({
        area: line.installed?.numerator,
        required: line.required,
        price: line.amountMinor,
        packs: line.packs,
      })),
    ).toEqual([
      {
        area: 9_600_000,
        required: {
          numerator: 19_200_000_000,
          denominator: 10_000_000,
          unit: 'ml',
        },
        price: 3_600,
        packs: [{ id: 'paint-1l', count: 2 }],
      },
      {
        area: 33_990_000,
        required: {
          numerator: 67_980_000_000,
          denominator: 10_000_000,
          unit: 'ml',
        },
        price: 9_200,
        packs: [
          { id: 'paint-1l', count: 2 },
          { id: 'paint-5l', count: 1 },
        ],
      },
    ]);
    expect(colours.reduce((sum, line) => sum + line.amountMinor!, 0)).toBe(
      12_800,
    );
    expect(
      calculate(room, settings).lines.filter((line) =>
        line.offerIds.includes('sample-primer'),
      ),
    ).toHaveLength(1);
  });
  it('uses an actual cheaper mixed can combination with stable bounded tie choices', () => {
    const packs = [
      { id: 'large', volumeMl: 5000, priceMinor: 90_000 },
      { id: 'small', volumeMl: 1000, priceMinor: 25_000 },
    ];
    expect(paintPackPlan(5_448_750, 1000, packs)).toMatchObject({
      purchasedMl: 6000,
      priceMinor: 115_000,
    });
    expect(paintPackPlan(5_448_750, 1000, [packs[0]!])).toMatchObject({
      purchasedMl: 10_000,
      priceMinor: 180_000,
    });
    expect(paintPackPlan(0, 1, packs)).toMatchObject({
      purchasedMl: 0,
      priceMinor: 0,
      packs: [],
    });
    expect(paintPackPlan(8_718_000, 1000, packs)).toEqual(
      paintPackPlan(8_718_000, 1000, [...packs].reverse()),
    );
    expect(() => paintPackPlan(Number.MAX_SAFE_INTEGER, 1, packs)).toThrow(
      'estimate-range',
    );
  });
  it('does not charge a separate underlay when the selected system includes it', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room);
    settings.floor.offerId = 'sample-floor-integrated';
    const estimate = calculate(room, settings);
    expect(
      estimate.lines.some((line) => line.offerIds.includes('sample-underlay')),
    ).toBe(false);
    expect(
      estimate.lines.find((line) => line.label === 'Underlay included'),
    ).toMatchObject({ pricing: 'included', amountMinor: 0 });
  });
  it('does not apply click-floor accessories to an unsupported floor finish', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room);
    room.room = withRoomSurface(room.room, {
      surface: 'floor',
      texture: 'tile',
    });
    settings.floor.offerId = 'sample-floor-integrated';
    const estimate = calculate(room, settings);
    expect(estimate.complete).toBe(false);
    expect(
      estimate.lines.find(
        (line) => line.label === 'Floor finish supplier quote',
      )?.amountMinor,
    ).toBeNull();
    expect(
      estimate.lines.some((line) => line.label === 'Underlay included'),
    ).toBe(false);
    expect(
      estimate.lines.some((line) => line.offerIds.includes('sample-trim')),
    ).toBe(false);
  });
  it('keeps explicitly included preparation unpriced when no active rate is supplied', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room);
    settings.services = settings.services.filter(
      (service) => service.scope !== 'floor-prep',
    );
    expect(
      calculate(room, settings).lines.some(
        (line) =>
          line.category === 'services' &&
          line.label.includes('preparation') &&
          line.pricing === 'unpriced',
      ),
    ).toBe(true);
  });
  it('keeps owned purchases at explicit zero and avoids charging included/retained bed components twice', () => {
    const room = commandRoom([
      piece('bed', 2500, 2500, {
        catalogueId: 'procedural-bed',
        width: 1600,
        depth: 2100,
        height: 850,
      }),
    ]);
    const settings = onlyPurchases(reviewedSettings(room));
    expect(calculate(room, settings).totalMinor).toBe(0);
    settings.furniture[0]!.mode = 'buy';
    expect(calculate(room, settings).totalMinor).toBe(67_500);
    settings.furniture[0]!.components[0]!.mode = 'reuse';
    const reused = calculate(room, settings);
    expect(reused.totalMinor).toBe(45_000);
    expect(
      reused.lines.find((line) => line.label.includes('Bed base included')),
    ).toMatchObject({ pricing: 'included', amountMinor: 0 });
  });
  it('applies an hourly labour model and job minimum once', () => {
    const room = measuredRoom(),
      settings = onlyPurchases(reviewedSettings(room)),
      offers = sampleEstimateOffers();
    const moving = settings.services.find(
      (service) => service.scope === 'moving',
    )!;
    moving.enabled = true;
    moving.quantity = 120;
    const rate = goods(offers, 'sample-moving', 'service');
    rate.basis = 'hour';
    rate.priceMinor = 10_000;
    rate.minimumMinor = 30_000;
    const estimate = calculate(room, settings, offers);
    expect(
      estimate.lines.find((line) => line.offerIds.includes(rate.id))!
        .amountMinor,
    ).toBe(30_000);
    moving.quantity = 240;
    expect(calculate(room, settings, offers).totalMinor).toBe(40_000);
  });
  it('groups two furniture purchases into one supplier delivery fee', () => {
    const room = commandRoom([piece('one'), piece('two', 6000)]),
      settings = onlyPurchases(reviewedSettings(room));
    for (const item of settings.furniture) item.mode = 'buy';
    settings.fulfilment = 'delivery';
    const estimate = calculate(room, settings);
    expect(
      estimate.lines.filter((line) => line.category === 'delivery'),
    ).toHaveLength(1);
    expect(estimate.totalMinor).toBe(33_000);
  });
  it('does not add delivery/assembly when already included, but rejects an unknown selected component', () => {
    const room = commandRoom([piece('desk')]),
      settings = onlyPurchases(reviewedSettings(room)),
      offers = sampleEstimateOffers();
    settings.furniture[0]!.mode = 'buy';
    settings.fulfilment = 'delivery';
    settings.services.find((service) => service.scope === 'assembly')!.enabled =
      true;
    const desk = goods(offers, 'sample-desk', 'furniture');
    desk.deliveryIncluded = true;
    desk.assemblyIncluded = true;
    expect(calculate(room, settings, offers).totalMinor).toBe(14_000);
    settings.furniture[0]!.components = [
      { key: 'not-offered', mode: 'buy', offerId: 'sample-mattress' },
    ];
    expect(calculateRoomEstimate(room, settings, offers)).toEqual({
      ok: false,
      code: 'incompatible-offer',
    });
  });
  it('rejects labour bases that do not describe the selected work', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room),
      offers = sampleEstimateOffers();
    goods(offers, 'sample-floor-install', 'service').basis = 'each';
    expect(calculateRoomEstimate(room, settings, offers)).toEqual({
      ok: false,
      code: 'incompatible-offer',
    });
  });
});

describe('exact money, evidence and incomplete estimates', () => {
  it('does not turn a Cairo service/delivery rate into another city’s quote', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room);
    settings.locality.city = 'Alexandria';
    const estimate = calculate(room, settings);
    expect(estimate.totalMinor).toBeNull();
    expect(
      estimate.lines
        .filter((line) => line.category === 'delivery')
        .every((line) => line.pricing === 'unpriced'),
    ).toBe(true);
    expect(
      estimate.lines.some((line) =>
        line.offerIds.includes('sample-floor-install'),
      ),
    ).toBe(false);
    settings.locality.city = 'cairo';
    expect(calculate(room, settings).complete).toBe(true);
  });
  it('adds exclusive configured tax once, preserves inclusive prices and separates allowances', () => {
    const room = commandRoom([piece('desk')]),
      settings = onlyPurchases(reviewedSettings(room)),
      offers = sampleEstimateOffers();
    settings.furniture[0]!.mode = 'buy';
    const desk = goods(offers, 'sample-desk', 'furniture');
    desk.priceMinor = 10_001;
    desk.tax = {
      status: 'excluded',
      rateBps: 750,
      source: 'Authored test rate; not a tax-law assertion.',
    };
    settings.allowances = [
      {
        id: 'extra',
        label: 'Explicit contingency',
        amountMinor: 1000,
        reason: 'Visitor-selected all-in allowance.',
      },
    ];
    const estimate = calculate(room, settings, offers);
    expect(estimate.taxMinor).toBe(750);
    expect(estimate.pricedSubtotalMinor).toBe(10_001);
    expect(estimate.allowanceMinor).toBe(1000);
    expect(estimate.totalMinor).toBe(11_751);
    desk.tax.status = 'included';
    expect(calculate(room, settings, offers).totalMinor).toBe(11_001);
    expect(estimateMoney(1n, 2n)).toBe(1);
    expect(estimateMoney(1n, 3n)).toBe(0);
  });
  it('keeps missing measurements, preparation, primer and tax visibly unpriced', () => {
    const room = measuredRoom(),
      settings = defaultEstimateSettings(room),
      offers = sampleEstimateOffers();
    room.room.height = unknown();
    goods(offers, 'sample-floor-oak', 'floor').tax.status = 'unknown';
    const estimate = calculate(room, settings, offers);
    expect(estimate.complete).toBe(false);
    expect(estimate.totalMinor).toBeNull();
    expect(estimate.knownTotalMinor).toBeGreaterThan(0);
    expect(
      estimate.lines
        .filter((line) => line.pricing === 'unpriced')
        .every((line) => line.amountMinor === null),
    ).toBe(true);
    expect(
      estimate.lines.some((line) => line.label.includes('primer assessment')),
    ).toBe(true);
    expect(
      estimate.lines.some(
        (line) => line.category === 'tax' && line.pricing === 'unpriced',
      ),
    ).toBe(true);
  });
  it('rejects invalid units/variants, selected currency mixing and overflowing totals', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room),
      offers = sampleEstimateOffers();
    settings.floor.offerId = 'sample-paint';
    expect(calculateRoomEstimate(room, settings, offers)).toEqual({
      ok: false,
      code: 'incompatible-offer',
    });
    settings.floor.offerId = 'sample-floor-oak';
    goods(offers, settings.floor.offerId, 'floor').market.currency = 'EUR';
    expect(calculateRoomEstimate(room, settings, offers)).toEqual({
      ok: false,
      code: 'mixed-currency',
    });
    const excessive = onlyPurchases(reviewedSettings(room));
    excessive.allowances = [1, 2].map((id) => ({
      id: `a${id}`,
      label: 'Overflow case',
      amountMinor: 1_000_000_000_000_000,
      reason: 'Independent upper-bound test.',
    }));
    expect(
      calculateRoomEstimate(room, excessive, sampleEstimateOffers()),
    ).toEqual({ ok: false, code: 'estimate-range' });
    expect(
      estimateOffersSchema.safeParse([
        { ...offers[0], remoteUrl: 'https://example.com' },
      ]).success,
    ).toBe(false);
    expect(
      estimateSettingsSchema.safeParse({
        ...settings,
        floor: { ...settings.floor, wasteBps: Number.NaN },
      }).success,
    ).toBe(false);
  });
  it('requires dated evidence for sourced prices and bounded public source URLs', () => {
    const offers = sampleEstimateOffers(),
      candidate = offers[0]!;
    candidate.source.kind = 'sourced';
    expect(estimateOffersSchema.safeParse([candidate]).success).toBe(false);
    expect(
      sourceUrlSchema.safeParse('https://www.ikea.com/eg/en/').success,
    ).toBe(true);
    for (const value of [
      'http://example.com',
      'https://localhost/a',
      'https://127.0.0.1/a',
      'https://user:pass@example.com/a',
      'https://example.com:443/a',
    ])
      expect(sourceUrlSchema.safeParse(value).success).toBe(false);
  });
  it('is deterministic, reads current revision, and never mutates input or shared sample values', () => {
    const room = measuredRoom(),
      settings = reviewedSettings(room),
      offers = sampleEstimateOffers(),
      before = JSON.stringify([room, settings, offers]);
    expect(calculate(room, settings, offers)).toEqual(
      calculate(room, settings, offers),
    );
    expect(JSON.stringify([room, settings, offers])).toBe(before);
    offers[0]!.label = 'Changed caller copy';
    expect(sampleEstimateOffers()[0]!.label).not.toBe(offers[0]!.label);
    room.roomRevision = 7;
    expect(calculate(room, settings).roomRevision).toBe(7);
  });
});
