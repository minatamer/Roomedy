import { afterEach, describe, expect, it } from 'vitest';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import { chooseProduct } from '../apps/frontend/src/features/cost/attach-offer.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import {
  projectOf,
  validateProject,
} from '../apps/frontend/src/features/session/project.js';
import { listedPrice } from '../apps/frontend/src/features/cost/listed-prices.js';
import { estimateGroups } from '../apps/frontend/src/features/cost/estimate-presentation.js';

const sessions: SessionController[] = [];
function session() {
  const c = new SessionController(createManualRoom('partial'));
  sessions.push(c);
  c.setDestination('cost', 'en-US');
  return c;
}
afterEach(() => sessions.splice(0).forEach((c) => c.dispose()));
function pick(
  c: SessionController,
  index: number,
  priceMinor: number | null,
  unit: 'item' | 'pack' | 'can' | 'm2' = 'item',
  simulation = false,
  suffix = '',
) {
  const s = c.getSnapshot(),
    target = marketTargets(s.workspace!.current)[index]!;
  const candidate: SourcingCandidate = {
    label: `Listing ${index}${suffix}`,
    url: `https://merchant.example/product/${index}${suffix}`,
    imageUrl: null,
    evidence: 'Offline listed price, incomplete specifications',
    match: 'lead',
    conditions: 'standard',
    differences: [],
    offer: null,
    listing:
      priceMinor === null
        ? null
        : {
            priceMinor,
            currency: 'USD',
            country: 'US',
            unit,
            volumeMl: unit === 'can' ? 5000 : null,
            observedAt: 123,
          },
  };
  expect(
    chooseProduct(
      c,
      target.brief,
      candidate,
      s.cost!.revision,
      s.workspace!.current.roomRevision,
      simulation,
      target.matchingWalls,
    ).ok,
  ).toBe(true);
  return target.key;
}
function estimate(c: SessionController) {
  const s = c.getSnapshot(),
    result = calculateRoomEstimate(
      s.workspace!.current,
      s.cost!.settings,
      s.cost!.offers,
    );
  if (!result.ok) throw Error(result.code);
  return result.estimate;
}
describe('selected listing price arithmetic', () => {
  it.each([true, false])(
    'sums every selected category in simulation=%s, counting the four-wall group once',
    (simulation) => {
      const c = session();
      pick(c, 0, 24900, 'item', simulation);
      pick(c, 1, 14900, 'item', simulation);
      pick(c, 2, 4200, 'pack', simulation);
      pick(c, 3, 5600, 'can', simulation);
      const e = estimate(c);
      expect(e.knownTotalMinor).toBe(97200);
      expect(
        estimateGroups(e).map((group) => [
          group.category,
          group.known,
          group.unpriced,
        ]),
      ).toEqual([
        ['furniture', 39800, 0],
        ['floor', 46200, 0],
        ['walls', 11200, 0],
      ]);
      expect(e.lines.filter((line) => line.category === 'walls')).toHaveLength(
        1,
      );
      expect(
        e.lines.find((line) => line.category === 'walls')!.targets,
      ).toHaveLength(4);
      expect(e.unpricedCount).toBe(0);
      expect(e.complete).toBe(false);
      expect(e.totalMinor).toBeNull();
      expect(c.getSnapshot().cost!.messages.at(-1)!.text).toContain('$972.00');
    },
  );
  it('multiplies material units, refreshes completion, and restores them with one Undo', () => {
    const c = session();
    [0, 1].forEach((i) => pick(c, i, 10000));
    const floor = pick(c, 2, 4200, 'pack');
    pick(c, 3, 5600, 'can');
    const before = c.getSnapshot();
    expect(c.setSelectedQuantity(floor, 8, before.cost!.revision)).toBe(true);
    expect(estimate(c).knownTotalMinor).toBe(64800);
    expect(c.getSnapshot().cost!.messages.at(-1)!.text).toContain('$648.00');
    expect(c.undo().ok).toBe(true);
    expect(estimate(c).knownTotalMinor).toBe(77400);
    expect(
      c.setSelectedQuantity(floor, 0, c.getSnapshot().cost!.revision),
    ).toBe(false);
    expect(
      c.setSelectedQuantity(floor, 1.5, c.getSnapshot().cost!.revision),
    ).toBe(false);
    expect(c.setSelectedQuantity(floor, 2, before.cost!.revision)).toBe(false);
  });
  it('uses net square metres and rounds the extended amount once', () => {
    const c = session();
    pick(c, 2, 1234, 'm2');
    const s = c.getSnapshot(),
      e = estimate(c),
      q = e.lines.find((line) => line.pricing === 'listed')!.quantity!;
    expect(q.unit).toBe('mm2');
    expect(e.knownTotalMinor).toBe(
      Math.round((q.numerator * 1234) / 1_000_000),
    );
    expect(q.numerator).toBeGreaterThan(1_000_000);
    expect(s.cost!.settings.selectedPrices![0]!.unitPriceMinor).toBe(1234);
  });
  it('replaces a price at the same merchant URL without retaining an old amount or quantity', () => {
    const c = session(),
      key = pick(c, 2, 4200, 'pack');
    c.setSelectedQuantity(key, 8, c.getSnapshot().cost!.revision);
    pick(c, 2, 5000, 'pack');
    expect(estimate(c).knownTotalMinor).toBe(55000);
    expect(c.getSnapshot().cost!.settings.selectedPrices![0]!.quantity).toBe(1);
    expect(c.undo().ok).toBe(true);
    expect(estimate(c).knownTotalMinor).toBe(33600);
  });
  it('does not invent an amount for an unpriced replacement', () => {
    const c = session();
    pick(c, 0, 24900);
    pick(c, 0, null, 'item', false, '-unpriced');
    expect(estimate(c).knownTotalMinor).toBe(0);
    expect(estimate(c).unpricedCount).toBeGreaterThan(0);
    expect(
      estimate(c).lines.some(
        (line) => line.category === 'furniture' && line.amountMinor === null,
      ),
    ).toBe(true);
    expect(c.getSnapshot().cost!.settings.selectedPrices).toBeUndefined();
  });
  it('repairs legacy choices once without changing saved historical estimates or trapping Undo', () => {
    const c = session();
    [0, 1, 2, 3].forEach((i) =>
      pick(c, i, 10000, i === 2 ? 'pack' : i === 3 ? 'can' : 'item'),
    );
    const project = structuredClone(projectOf(c.getSnapshot())!);
    delete project.cost!.settings.selectedPrices;
    project.cost!.productChoices!.forEach((choice) => {
      delete choice.listingPrice;
    });
    const old = new SessionController(project.current);
    sessions.push(old);
    expect(old.importProject(project)).toBe(true);
    expect(estimate(old).knownTotalMinor).toBe(0);
    old.saveEstimate('Historical zero');
    const historical = JSON.stringify(old.getSnapshot().estimateVersions);
    expect(old.repairSelectedPrices()).toBe(true);
    expect(estimate(old).knownTotalMinor).toBe(150000);
    expect(old.repairSelectedPrices()).toBe(false);
    expect(JSON.stringify(old.getSnapshot().estimateVersions)).toBe(historical);
    expect(old.undo().ok).toBe(true);
    expect(estimate(old).knownTotalMinor).toBe(0);
    expect(old.repairSelectedPrices()).toBe(false);
  });
  it('keeps accepted pricing and frozen PDF inputs consistent and rejects forged choice prices', () => {
    const c = session();
    pick(c, 0, 24900);
    const project = projectOf(c.getSnapshot())!;
    expect(validateProject(project).ok).toBe(true);
    const forged = structuredClone(project);
    forged.cost!.settings.selectedPrices![0]!.unitPriceMinor = 1;
    expect(validateProject(forged).ok).toBe(false);
    const pricing = pricingState(c.getSnapshot().cost!),
      bad = structuredClone(pricing);
    bad.settings.selectedPrices![0]!.unitPriceMinor = 1;
    expect(c.updateCost(bad.settings, bad.offers)).toBe(false);
    expect(
      c.prepareCostProposal(
        bad,
        'Forged price',
        [],
        c.getSnapshot().cost!.revision,
      ).ok,
    ).toBe(false);
    c.saveEstimate('Listing subtotal');
    expect(c.getSnapshot().estimateVersions[0]!.estimate.knownTotalMinor).toBe(
      24900,
    );
  });
  it('drops stale-market listing prices without borrowing another choice', () => {
    const c = session();
    pick(c, 0, 24900);
    const s = c.getSnapshot();
    expect(
      c.chooseShoppingLocation('GB', 'manual', s.generation, s.cost!.revision),
    ).toBe(true);
    expect(estimate(c).knownTotalMinor).toBe(0);
    expect(c.getSnapshot().cost!.settings.selectedPrices).toBeUndefined();
  });
  it.each([
    '€249.00 / item',
    'EGP 249.00 / item',
    '$249 / item',
    '$249.00 / hour',
    'Price $249.00',
  ])('never infers USD from unsupported legacy reference %s', (quotedPrice) => {
    const c = session();
    pick(c, 0, 24900);
    const s = c.getSnapshot(),
      choice = { ...s.cost!.productChoices![0]!, quotedPrice };
    delete choice.listingPrice;
    expect(listedPrice(s.workspace!.current, choice)).toBeNull();
  });
  it.each(['currency', 'country', 'unavailable'] as const)(
    'excludes a new incompatible listing by %s while retaining its preference',
    (field) => {
      const c = session();
      pick(c, 0, 24900);
      const s = c.getSnapshot(),
        choice = structuredClone(s.cost!.productChoices![0]!);
      if (field === 'currency') choice.listingPrice!.currency = 'EUR';
      else if (field === 'country') choice.listingPrice!.country = 'GB';
      else choice.listingPrice!.unavailable = true;
      expect(listedPrice(s.workspace!.current, choice)).toBeNull();
    },
  );
});
