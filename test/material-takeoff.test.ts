import { afterEach, describe, expect, it } from 'vitest';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import { chooseProduct } from '../apps/frontend/src/features/cost/attach-offer.js';
import {
  projectOf,
  validateProject,
} from '../apps/frontend/src/features/session/project.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import {
  commandRoom,
  known,
  unknown,
  windowFeature,
} from './fixtures/command-room.js';
const sessions: SessionController[] = [];
function session(openings = false) {
  const r = commandRoom();
  r.room.width = known(4000);
  r.room.depth = known(5000);
  r.room.height = known(2500);
  if (openings) {
    const a = windowFeature(),
      b = { ...windowFeature(), id: 'window_2' };
    r.room.features = [a, b];
  }
  const c = new SessionController(r);
  sessions.push(c);
  c.setDestination('cost', 'en-US');
  return c;
}
afterEach(() => sessions.splice(0).forEach((c) => c.dispose()));
function pick(
  c: SessionController,
  kind: 'floor' | 'paint',
  facts = true,
  simulation = false,
) {
  const s = c.getSnapshot(),
    target = marketTargets(s.workspace!.current).find(
      (target) => target.brief.kind === kind,
    )!;
  const candidate: SourcingCandidate = {
    label: `Listed ${kind}`,
    url: `https://merchant.example/${kind}`,
    imageUrl: null,
    match: 'lead',
    conditions: 'standard',
    evidence: 'Offline fixture',
    differences: [],
    offer: null,
    listing: {
      priceMinor: kind === 'floor' ? 4000 : 5000,
      currency: 'USD',
      country: 'US',
      unit: kind === 'floor' ? 'pack' : 'can',
      volumeMl: kind === 'paint' ? 5000 : null,
      observedAt: 123,
      ...(facts
        ? kind === 'floor'
          ? { coverageMm2: 2_000_000 }
          : { coverageMm2PerLitre: 8_000_000 }
        : {}),
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
function result(c: SessionController) {
  const s = c.getSnapshot(),
    e = calculateRoomEstimate(
      s.workspace!.current,
      s.cost!.settings,
      s.cost!.offers,
    );
  if (!e.ok) throw Error(e.code);
  return e.estimate;
}
describe('automatic whole-room listed material quantities', () => {
  it('keeps full-scope missing geometry unknown, but preserves explicit manual unit costs', () => {
    const c = session();
    pick(c, 'floor');
    const s = c.getSnapshot(),
      room = structuredClone(s.workspace!.current),
      settings = structuredClone(s.cost!.settings);
    room.room.width = unknown();
    delete settings.demoScope;
    const auto = calculateRoomEstimate(room, settings, []);
    if (!auto.ok) throw Error(auto.code);
    expect(auto.estimate.knownTotalMinor).toBe(0);
    settings.selectedPrices![0]!.quantity = 8;
    settings.selectedPrices![0]!.takeoff!.mode = 'manual';
    const manual = calculateRoomEstimate(room, settings, []);
    if (!manual.ok) throw Error(manual.code);
    expect(manual.estimate.knownTotalMinor).toBe(32000);
  });
  it.each([true, false])(
    'uses supplied product coverage for the whole room in simulation=%s',
    (simulation) => {
      const c = session();
      pick(c, 'floor', true, simulation);
      pick(c, 'paint', true, simulation);
      const e = result(c);
      expect(
        e.lines.map((l) => [l.category, l.quantity?.numerator, l.amountMinor]),
      ).toEqual([
        ['floor', 11, 44000],
        ['walls', 3, 15000],
      ]);
      expect(e.knownTotalMinor).toBe(59000);
      expect(e.lines[1]!.targets).toHaveLength(4);
      expect(e.lines[1]!.required?.numerator).toBe(11250);
      expect(e.lines[0]!.notes.join(' ')).toContain('Product coverage');
      expect(e.lines[1]!.notes.join(' ')).toContain('Product yield');
      expect(c.getSnapshot().cost!.messages.at(-1)!.text).toContain('$590.00');
    },
  );
  it('uses disclosed editable planning coverage when listings omit it', () => {
    const c = session();
    pick(c, 'floor', false);
    pick(c, 'paint', false);
    const e = result(c);
    expect(e.lines.map((l) => l.quantity?.numerator)).toEqual([10, 2]);
    expect(e.knownTotalMinor).toBe(50000);
    expect(e.lines[0]!.notes.join(' ')).toContain(
      'Planning coverage assumption',
    );
    expect(e.lines[1]!.notes.join(' ')).toContain('Planning yield assumption');
    expect(e.complete).toBe(false);
  });
  it('deducts overlapping openings only once before grouping and rounding cans', () => {
    const c = session(true);
    pick(c, 'paint');
    const line = result(c).lines.find((l) => l.pricing === 'listed')!;
    expect(line.installed?.numerator).toBe(44_000_000);
    expect(line.required?.numerator).toBe(11000);
    expect(line.quantity?.numerator).toBe(3);
  });
  it('rounds whole packs up at the exact boundary and includes waste only once', () => {
    const c = session();
    pick(c, 'floor', false);
    const s = c.getSnapshot(),
      room = structuredClone(s.workspace!.current);
    expect(
      result(c).lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(10);
    room.room.width = known(4001);
    const e = calculateRoomEstimate(room, s.cost!.settings, s.cost!.offers);
    if (!e.ok) throw Error(e.code);
    expect(
      e.estimate.lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(11);
  });
  it('updates from coats and net floor exclusions without stale stored counts', () => {
    const c = session();
    pick(c, 'floor');
    pick(c, 'paint');
    const s = c.getSnapshot(),
      settings = structuredClone(s.cost!.settings);
    settings.floor.excludedMm2 = 10_000_000;
    settings.walls.forEach((w) => {
      w.coats = 3;
    });
    expect(c.updateCost(settings)).toBe(true);
    expect(result(c).lines.map((l) => l.quantity?.numerator)).toEqual([6, 4]);
  });
  it('supports coverage and volume edits, manual override, reset, and one Undo', () => {
    const c = session(),
      key = pick(c, 'paint');
    expect(
      c.setSelectedTakeoff(
        key,
        { coverageMm2: 10_000_000, volumeMl: 2500 },
        c.getSnapshot().cost!.revision,
      ),
    ).toBe(true);
    expect(
      result(c).lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(4);
    expect(c.setSelectedQuantity(key, 7, c.getSnapshot().cost!.revision)).toBe(
      true,
    );
    expect(
      result(c).lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(7);
    expect(
      c.setSelectedTakeoff(
        key,
        { automatic: true },
        c.getSnapshot().cost!.revision,
      ),
    ).toBe(true);
    expect(
      result(c).lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(4);
    expect(c.undo().ok).toBe(true);
    expect(
      result(c).lines.find((l) => l.pricing === 'listed')!.quantity?.numerator,
    ).toBe(7);
    expect(
      c.setSelectedTakeoff(
        key,
        { coverageMm2: 0 },
        c.getSnapshot().cost!.revision,
      ),
    ).toBe(false);
    expect(
      c.setSelectedTakeoff(
        key,
        { volumeMl: 0 },
        c.getSnapshot().cost!.revision,
      ),
    ).toBe(false);
  });
  it('upgrades current one-unit records while preserving historical versions and explicit manual counts', () => {
    const c = session(),
      key = pick(c, 'floor');
    const project = structuredClone(projectOf(c.getSnapshot())!);
    project.cost!.settings.selectedPrices!.forEach((p) => {
      delete p.takeoff;
    });
    expect(c.importProject(project)).toBe(true);
    expect(result(c).knownTotalMinor).toBe(4000);
    c.saveEstimate('Old one-pack version');
    const historical = JSON.stringify(c.getSnapshot().estimateVersions);
    expect(c.repairSelectedPrices()).toBe(true);
    expect(result(c).knownTotalMinor).toBe(44000);
    expect(JSON.stringify(c.getSnapshot().estimateVersions)).toBe(historical);
    expect(c.undo().ok).toBe(true);
    expect(result(c).knownTotalMinor).toBe(4000);
    expect(c.repairSelectedPrices()).toBe(false);
    const manual = structuredClone(project);
    manual.cost!.settings.selectedPrices![0]!.quantity = 8;
    manual.cost!.settings.selectedPrices![0]!.quantityConfirmed = true;
    expect(c.importProject(manual)).toBe(true);
    expect(c.repairSelectedPrices()).toBe(true);
    expect(result(c).knownTotalMinor).toBe(32000);
    expect(
      c.getSnapshot().cost!.settings.selectedPrices!.find((p) => p.key === key)!
        .takeoff!.mode,
    ).toBe('manual');
  });
  it('persists the exact automatic inputs and totals and blocks proposal-owned changes', () => {
    const c = session();
    pick(c, 'floor');
    pick(c, 'paint');
    c.saveEstimate('Whole-room estimate');
    expect(validateProject(projectOf(c.getSnapshot())).ok).toBe(true);
    expect(c.getSnapshot().estimateVersions[0]!.estimate.knownTotalMinor).toBe(
      59000,
    );
    const pricing = structuredClone(pricingState(c.getSnapshot().cost!));
    pricing.settings.selectedPrices![0]!.takeoff!.mode = 'manual';
    expect(
      c.prepareCostProposal(
        pricing,
        'Model quantity',
        [],
        c.getSnapshot().cost!.revision,
      ).ok,
    ).toBe(false);
  });
});
