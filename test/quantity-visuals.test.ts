import { describe, expect, it } from 'vitest';
import { quantityVisual } from '../apps/frontend/src/features/cost/quantity-visuals.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { chooseProduct } from '../apps/frontend/src/features/cost/attach-offer.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
function fixture() {
  const c = new SessionController(createManualRoom('partial'));
  try {
    c.setDestination('cost', 'en-US');
    for (const target of marketTargets(
      c.getSnapshot().workspace!.current,
    ).filter((t) => t.brief.kind === 'floor' || t.brief.kind === 'paint')) {
      const s = c.getSnapshot(),
        paint = target.brief.kind === 'paint';
      const result = chooseProduct(
        c,
        target.brief,
        {
          label: target.label,
          url: 'https://merchant.example/' + target.key,
          imageUrl: null,
          evidence: 'Offline listing fixture',
          offer: null,
          conditions: 'standard',
          match: 'similar',
          differences: [],
          listing: {
            priceMinor: paint ? 6099 : 4756,
            currency: 'USD',
            country: 'US',
            unit: paint ? 'can' : 'pack',
            volumeMl: paint ? 3785 : null,
            observedAt: 123,
            ...(paint
              ? { coverageMm2PerLitre: 10_000_000 }
              : { coverageMm2: 2_200_000 }),
          },
        },
        s.cost!.revision,
        s.workspace!.current.roomRevision,
        false,
        target.matchingWalls,
      );
      if (!result.ok) throw new Error(result.reason);
    }
    if (!c.saveEstimate('Quantity diagram fixture').ok)
      throw new Error('fixture');
    return structuredClone(c.getSnapshot().estimateVersions[0]!);
  } finally {
    c.dispose();
  }
}
describe('truthful visual quantities from saved financial inputs', () => {
  it('labels illustrative product coverage as an example rather than a merchant fact', () => {
    const v = fixture(),
      line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!,
      price = v.pricing.settings.selectedPrices!.find(
        (p) => p.key === line.productKey,
      )!;
    price.simulation = true;
    expect(quantityVisual(line, v.pricing).facts).toContain('Example coverage');
    expect(quantityVisual(line, v.pricing).facts).not.toContain(
      'Product coverage',
    );
  });
  it('shows exact room/required/buy quantities and a verified unit-price equation without editing them', () => {
    const v = fixture(),
      before = JSON.stringify(v),
      line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!,
      result = quantityVisual(line, v.pricing);
    expect(result.kind).toBe('floor');
    expect(result.tiles.map((t) => t.quantity)).toEqual([
      line.installed,
      line.required,
      line.quantity,
    ]);
    expect(result.tiles[2]?.label).toBe('Buy');
    expect(result.unitPriceMinor).toBe(4756);
    expect(result.facts).toContain('2.2 m2 / pack');
    expect(result.facts).toContain('Product coverage');
    expect(line.amountMinor).toBe(52316);
    expect(JSON.stringify(v)).toBe(before);
  });
  it('labels a manual quantity and planning coverage instead of implying automatic rounding', () => {
    const v = fixture(),
      line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!,
      price = v.pricing.settings.selectedPrices!.find(
        (p) => p.key === line.productKey,
      )!;
    if (price.takeoff?.kind !== 'floor') throw new Error('fixture');
    price.takeoff.mode = 'manual';
    price.takeoff.coverageSource = 'planning';
    line.quantity = { numerator: 2, denominator: 1, unit: 'pack' };
    line.amountMinor = 9512;
    const result = quantityVisual(line, v.pricing);
    expect(result.manual).toBe(true);
    expect(result.tiles[2]?.label).toBe('Your quantity');
    expect(result.facts).toContain('Manual quantity');
    expect(result.facts).toContain('Planning coverage');
    expect(result.facts).not.toContain('10% cutting waste');
    expect(result.tiles[1]?.quantity).toEqual(line.required);
  });
  it('keeps missing quantities and prices unknown, rather than inventing zero or pack coverage', () => {
    const v = fixture(),
      line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!;
    line.installed = null;
    line.required = null;
    line.quantity = null;
    line.amountMinor = null;
    const result = quantityVisual(line, v.pricing);
    expect(result.tiles.every((t) => t.quantity === null)).toBe(true);
    expect(result.unitPriceMinor).toBeNull();
    v.pricing.settings.selectedPrices = [];
    expect(quantityVisual(line, v.pricing).facts).toEqual([]);
  });
  it('does not display rounded/FX-looking unit multiplication when it disagrees with the saved total', () => {
    const v = fixture(),
      line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!;
    line.amountMinor! += 1;
    expect(quantityVisual(line, v.pricing).unitPriceMinor).toBeNull();
  });
  it('retains distinct coat/coverage/can-size facts without presenting mixed coats as one uniform setting', () => {
    const v = fixture(),
      line = v.estimate.lines.find(
        (l) => l.productKey?.startsWith('surface:') && l.category === 'walls',
      )!,
      price = v.pricing.settings.selectedPrices!.find(
        (p) => p.key === line.productKey,
      )!;
    if (price.takeoff?.kind !== 'paint') throw new Error('fixture');
    price.takeoff.volumeSource = 'visitor';
    v.pricing.settings.walls[0]!.coats = 3;
    const result = quantityVisual(line, v.pricing);
    expect(result.kind).toBe('paint');
    expect(result.walls).toHaveLength(4);
    expect(result.facts).toContain('Mixed coats');
    expect(result.facts).toContain('Entered can size');
    expect(result.facts).toContain('Product coverage');
    expect(result.facts).toContain('3.785 L / can');
    expect(result.tiles[1]?.quantity).toEqual(line.required);
  });
  it('keeps quoted paint pack mixes intact without inventing one can price or native-currency equation', () => {
    const c = new SessionController(createRoomFixture('sample'));
    try {
      c.setDestination('cost');
      c.saveEstimate('Quote fixture');
      const v = structuredClone(c.getSnapshot().estimateVersions[0]!),
        line = v.estimate.lines.find(
          (l) => l.category === 'walls' && l.packs.length,
        )!;
      const offer = v.pricing.offers.find(
        (o) => line.offerIds.includes(o.id) && 'packs' in o,
      )!;
      if (!('packs' in offer)) throw new Error('fixture');
      offer.packs = [
        { ...offer.packs[0]!, id: 'can_a', volumeMl: 2500, priceMinor: 4500 },
        { ...offer.packs[0]!, id: 'can_b', volumeMl: 5000, priceMinor: 6500 },
      ];
      line.packs = [
        { id: 'can_a', count: 1 },
        { id: 'can_b', count: 1 },
      ];
      line.quantity = { numerator: 2, denominator: 1, unit: 'can' };
      line.amountMinor = 11000;
      const result = quantityVisual(line, v.pricing);
      expect(result.facts).toContain('1 x 2.5 L + 1 x 5 L');
      expect(result.unitPriceMinor).toBeNull();
      offer.market.currency = 'EGP';
      line.packs = [{ id: 'can_a', count: 1 }];
      line.quantity = { numerator: 1, denominator: 1, unit: 'can' };
      line.amountMinor = 4500;
      expect(quantityVisual(line, v.pricing).unitPriceMinor).toBeNull();
    } finally {
      c.dispose();
    }
  });
});
