import { afterEach, describe, expect, it } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import {
  costIntent,
  costLineChanges,
} from '../apps/frontend/src/features/cost/planning.js';
import {
  budgetOptions,
  budgetSummary,
} from '../apps/frontend/src/features/cost/budget.js';
import { roomWorkPlan } from '../apps/frontend/src/features/cost/work-plan.js';
import { reviewSourceSize } from '../apps/frontend/src/features/cost/attach-offer.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  calculateRoomEstimate,
  emptyHistory,
  pushHistory,
  jsonBytes,
} from '@roomedy/spatial';
import type { EstimateState } from '@roomedy/contracts/estimates';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import type { VisitorAction } from '@roomedy/contracts/commands';
const controllers: SessionController[] = [];
function session() {
  const c = new SessionController(createRoomFixture('sample'));
  controllers.push(c);
  c.setDestination('cost');
  return c;
}
function estimate(
  c: SessionController,
  pricing = pricingState(c.getSnapshot().cost!),
) {
  const result = calculateRoomEstimate(
    c.getSnapshot().workspace!.current,
    pricing.settings,
    pricing.offers,
  );
  if (!result.ok) throw new Error(result.code);
  return result.estimate;
}
afterEach(() => {
  controllers.forEach((c) => c.dispose());
  controllers.length = 0;
});
describe('one atomic design / estimate history', () => {
  it('captures reviewed actions and financial inputs independently of later caller/display mutation', () => {
    const c = session(),
      d = c.getSnapshot().cost!,
      p = structuredClone(pricingState(d));
    p.settings.floor.wasteBps = 2000;
    const actions: VisitorAction[] = [
      {
        type: 'finish',
        id: c.getSnapshot().workspace!.current.furniture[0]!.id,
        finish: 'sage',
      },
    ];
    expect(
      c.prepareCostProposal(p, 'Captured', [], d.revision, actions).ok,
    ).toBe(true);
    actions[0] = {
      type: 'finish',
      id: c.getSnapshot().workspace!.current.furniture[0]!.id,
      finish: 'walnut',
    };
    p.settings.floor.wasteBps = 2500;
    c.getSnapshot().costProposal!.pricing.settings.floor.wasteBps = 3000;
    expect(c.applyCostProposal().ok).toBe(true);
    expect(c.getSnapshot().workspace!.current.furniture[0]!.finish).toBe(
      'sage',
    );
    expect(c.getSnapshot().cost!.settings.floor.wasteBps).toBe(2000);
  });
  it('restores exact prices and room semantics in interleaved cost, design and combined Undo', () => {
    const c = session(),
      initial = pricingState(c.getSnapshot().cost!),
      room = c.getSnapshot().workspace!.current;
    const next = structuredClone(initial);
    next.settings.floor.wasteBps = 2000;
    expect(c.updateCost(next.settings, next.offers)).toBe(true);
    expect(c.getSnapshot().workspace!.current).toBe(room);
    expect(
      c.dispatch(
        [{ type: 'finish', id: room.furniture[0]!.id, finish: 'sage' }],
        'Sage',
      ).ok,
    ).toBe(true);
    const acceptedRoom = c.getSnapshot().workspace!.current,
      acceptedPrice = pricingState(c.getSnapshot().cost!);
    const proposed = structuredClone(acceptedPrice);
    proposed.settings.floor.wasteBps = 1500;
    proposed.budgetMinor = 3_000_000;
    expect(
      c.prepareCostProposal(
        proposed,
        'Budget and finish',
        ['Review finish and quantities'],
        c.getSnapshot().cost!.revision,
        [{ type: 'finish', id: room.furniture[0]!.id, finish: 'ivory' }],
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().workspace!.current).toBe(acceptedRoom);
    expect(pricingState(c.getSnapshot().cost!)).toEqual(acceptedPrice);
    const observed: { room: string; waste: number }[] = [];
    const stop = c.subscribe(() =>
      observed.push({
        room: c.getSnapshot().workspace!.current.furniture[0]!.finish,
        waste: c.getSnapshot().cost!.settings.floor.wasteBps,
      }),
    );
    expect(c.applyCostProposal()).toEqual({ ok: true, changed: true });
    stop();
    expect(observed).toEqual([{ room: 'ivory', waste: 1500 }]);
    expect(c.applyCostProposal().ok).toBe(false);
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(3);
    const revision = c.getSnapshot().cost!.revision;
    c.undo();
    expect(pricingState(c.getSnapshot().cost!)).toEqual(acceptedPrice);
    expect(c.getSnapshot().workspace!.current.furniture).toEqual(
      acceptedRoom.furniture,
    );
    expect(c.getSnapshot().cost!.revision).toBeGreaterThan(revision);
    c.undo();
    expect(c.getSnapshot().workspace!.current.furniture).toEqual(
      room.furniture,
    );
    c.undo();
    expect(pricingState(c.getSnapshot().cost!)).toEqual(initial);
    expect(c.getSnapshot().workspace!.current.roomRevision).toBe(4);
  });
  it('preserves a removed piece’s exact selected components on Undo', () => {
    const c = session(),
      s = structuredClone(c.getSnapshot().cost!.settings),
      id = s.furniture[0]!.id;
    s.furniture[0]!.mode = 'buy';
    c.updateCost(s);
    const before = pricingState(c.getSnapshot().cost!);
    c.dispatch([{ type: 'remove', id, overrideLocks: true }], 'Remove');
    expect(
      c.getSnapshot().cost!.settings.furniture.some((f) => f.id === id),
    ).toBe(false);
    c.undo();
    expect(pricingState(c.getSnapshot().cost!)).toEqual(before);
  });
  it('no-op and rejected price writes do not consume history or cancel valid work', () => {
    const c = session(),
      before = c.getSnapshot(),
      token = c.beginOperation()!;
    expect(c.updateCost(before.cost!.settings)).toBe(true);
    expect(c.isCurrent(token)).toBe(true);
    expect(
      c.updateCost({
        ...before.cost!.settings,
        floor: { ...before.cost!.settings.floor, wasteBps: -1 },
      }),
    ).toBe(false);
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(0);
  });
  it('cancel, geometry, new operation, reset and expiry fence previews; price writes require resolving them', () => {
    for (const action of [
      'cancel',
      'geometry',
      'operation',
      'reset',
    ] as const) {
      const c = session(),
        d = c.getSnapshot().cost!,
        p = structuredClone(pricingState(d));
      p.settings.floor.wasteBps = 2000;
      c.prepareCostProposal(p, 'Waste', [], d.revision);
      expect(c.updateCost(d.settings)).toBe(false);
      expect(c.setDestination('design')).toBe(false);
      if (action === 'cancel') c.cancelPreview();
      if (action === 'geometry')
        c.dispatch(
          [
            {
              type: 'finish',
              id: c.getSnapshot().workspace!.current.furniture[0]!.id,
              finish: 'sage',
            },
          ],
          'Finish',
        );
      if (action === 'operation') c.beginOperation();
      if (action === 'reset') c.reset(createRoomFixture('empty'));
      expect(c.applyCostProposal().ok).toBe(false);
      expect(c.getSnapshot().costProposal).toBeNull();
    }
    let now = 0;
    const c = new SessionController(createRoomFixture('sample'), {
      now: () => now,
    });
    controllers.push(c);
    c.setDestination('cost');
    c.prepareCostProposal(pricingState(c.getSnapshot().cost!), 'Review', [], 0);
    now = c.getSnapshot().expiresAt;
    expect(c.applyCostProposal().ok).toBe(false);
    expect(c.getSnapshot().cost).toBeNull();
  });
  it('stale cost revisions and invalid combined geometry leave both accepted domains unchanged', () => {
    const c = session(),
      before = c.getSnapshot(),
      p = structuredClone(pricingState(before.cost!));
    p.settings.floor.wasteBps = 2000;
    expect(c.prepareCostProposal(p, 'Stale', [], 9).ok).toBe(false);
    expect(
      c.prepareCostProposal(p, 'Bad size', [], 0, [
        {
          type: 'set-size-estimate',
          id: before.workspace!.current.furniture[0]!.id,
          width: 10000,
          depth: 10000,
        },
      ]).ok,
    ).toBe(false);
    expect(c.getSnapshot().workspace).toBe(before.workspace);
    expect(c.getSnapshot().cost).toBe(before.cost);
  });
  it('counts financial snapshots in the same byte / entry cap and freezes captured inputs', () => {
    const c = session(),
      room = c.getSnapshot().workspace!.current,
      p = pricingState(c.getSnapshot().cost!);
    const entry = pushHistory(emptyHistory(), room, 'price', undefined, {
      pricing: p,
      costOnly: true,
    }).history.entries[0]!;
    expect(entry.bytes).toBe(
      jsonBytes({
        commandId: entry.commandId,
        previous: entry.previous,
        pricing: entry.pricing,
        costOnly: true,
      }),
    );
    expect(Object.isFrozen(entry.pricing!.offers[0])).toBe(true);
    const old = entry.pricing!.settings.floor.wasteBps;
    p.settings.floor.wasteBps = 2500;
    expect(entry.pricing!.settings.floor.wasteBps).toBe(old);
    expect(
      pushHistory(
        emptyHistory(),
        room,
        'large',
        { entries: 20, bytes: entry.bytes - 1 },
        { pricing: entry.pricing!, costOnly: true },
      ).recorded,
    ).toBe(false);
    let history = emptyHistory();
    for (let i = 0; i < 25; i++)
      history = pushHistory(history, room, `cost_${i}`, undefined, {
        pricing: p,
      }).history;
    expect(history.entries).toHaveLength(20);
    expect(history.bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
  });
  it('reviews product size and price atomically, while respecting actual size locks', () => {
    const c = session(),
      room = c.getSnapshot().workspace!.current,
      bed = room.furniture[0]!,
      d = c.getSnapshot().cost!;
    const prototype = d.offers.find(
      (o) => o.kind === 'furniture' && o.category === 'bed',
    );
    if (prototype?.kind !== 'furniture') throw new Error('fixture');
    const candidate: SourcingCandidate = {
      label: 'Wider bed',
      match: 'similar',
      url: 'https://example.com/bed',
      evidence: 'Authored fixture',
      conditions: 'standard',
      differences: ['100 mm wider'],
      offer: {
        ...prototype,
        id: 'new_bed',
        outerSizeMm: {
          width: bed.dimensions.width.value! + 100,
          depth: bed.dimensions.depth.value!,
          height: bed.dimensions.height.value!,
        },
      },
    };
    const brief = buildSourcingBrief(room, bed.id)!;
    expect(reviewSourceSize(c, brief, candidate, 0, 0).ok).toBe(false);
    c.dispatch(
      [
        {
          type: 'set-locks',
          id: bed.id,
          locks: { ...bed.locks, dimensions: false },
        },
      ],
      'Unlock size',
    );
    const current = c.getSnapshot();
    const prepared = reviewSourceSize(
      c,
      brief,
      candidate,
      current.cost!.revision,
      current.workspace!.current.roomRevision,
    );
    expect(prepared.ok).toBe(true);
    expect(
      c.getSnapshot().workspace!.current.furniture[0]!.dimensions.width.value,
    ).toBe(bed.dimensions.width.value);
    expect(c.applyCostProposal().ok).toBe(true);
    expect(
      c.getSnapshot().workspace!.current.furniture[0]!.dimensions.width,
    ).toMatchObject({
      value: bed.dimensions.width.value! + 100,
      status: 'estimated',
    });
    expect(c.getSnapshot().cost!.settings.furniture[0]!.offerId).toBe(
      'new_bed',
    );
    c.undo();
    expect(
      c.getSnapshot().workspace!.current.furniture[0]!.dimensions.width,
    ).toEqual(bed.dimensions.width);
    expect(c.getSnapshot().cost!.settings).toEqual(current.cost!.settings);
  });
});
describe('computed budgets and typed planning tools', () => {
  it('calculates eleven packs with 1,650 EGP savings without reducing required work', () => {
    const c = session(),
      d = pricingState(c.getSnapshot().cost!),
      room = c.getSnapshot().workspace!.current;
    const options = budgetOptions(room, d, 3_000_000);
    const floor = options.find(
      (o) => o.pricing.settings.floor.offerId !== d.settings.floor.offerId,
    )!;
    expect(floor).toBeDefined();
    expect(estimate(c).knownTotalMinor - floor.estimate.knownTotalMinor).toBe(
      165000,
    );
    expect({
      ...floor.pricing.settings.floor,
      offerId: d.settings.floor.offerId,
    }).toEqual(d.settings.floor);
    expect(floor.pricing.settings.services).toEqual(d.settings.services);
    expect(floor.pricing.settings.walls).toEqual(d.settings.walls);
    expect(floor.estimate.unpricedCount).toBe(estimate(c).unpricedCount);
    expect(budgetSummary(floor.estimate, 3_000_000)).toContain(
      'full budget is not verified',
    );
    expect(
      budgetSummary(
        { ...floor.estimate, complete: true, unpricedCount: 0 },
        3_000_000,
      ),
    ).toContain('Estimated selected scope is within');
  });
  it('never downgrades sourced/manual flooring to samples and never marks proposed pieces as owned', () => {
    const c = session(),
      d = structuredClone(pricingState(c.getSnapshot().cost!)),
      room = c.getSnapshot().workspace!.current;
    const floor = d.offers.find((o) => o.id === d.settings.floor.offerId)!;
    floor.source.kind = 'manual';
    const options = budgetOptions(room, d, 100);
    expect(
      options.some(
        (o) => o.pricing.settings.floor.offerId !== d.settings.floor.offerId,
      ),
    ).toBe(false);
    const proposed = room.furniture.find((f) => f.ownership === 'proposed')!;
    for (const option of options)
      expect(
        option.pricing.settings.furniture.find((f) => f.id === proposed.id)!
          .mode,
      ).toBe('buy');
    expect(room.furniture.find((f) => f.id === proposed.id)!.ownership).toBe(
      'proposed',
    );
  });
  it('offers owned reuse explicitly, with geometry, scope and unknown costs preserved', () => {
    const c = session(),
      d = structuredClone(pricingState(c.getSnapshot().cost!)),
      room = c.getSnapshot().workspace!.current;
    d.settings.furniture[0]!.mode = 'buy';
    const options = budgetOptions(room, d, 2_000_000),
      reuse = options.find((o) => o.label === 'Keep your existing furniture')!;
    expect(reuse.pricing.settings.furniture[0]!.mode).toBe('reuse');
    expect(reuse.pricing.settings.services).toEqual(d.settings.services);
    expect(reuse.tradeoffs.join(' ')).toContain('components');
    expect(budgetSummary(reuse.estimate, 2_000_000)).toContain('unresolved');
  });
  it('routes focused explicit tools, rejects FX ambiguity and keeps exact integer budgets', () => {
    const room = createRoomFixture('sample');
    expect(
      costIntent('Keep this under 30,000.25 EGP', room, 'EGP', null),
    ).toEqual({ kind: 'budget', amountMinor: 3000025 });
    expect(costIntent('budget 50 USD', room, 'EGP', null).kind).toBe('clarify');
    expect(costIntent('cheaper budget', room, 'EGP', null).kind).toBe(
      'clarify',
    );
    expect(costIntent('Find flooring online', room, 'EGP', null)).toMatchObject(
      { kind: 'research', key: 'surface:floor' },
    );
    expect(
      costIntent('Find similar furniture', room, 'EGP', room.furniture[0]!.id),
    ).toMatchObject({ kind: 'research', key: room.furniture[0]!.id });
    expect(costIntent('show my work plan', room, 'EGP', null).kind).toBe(
      'work',
    );
    expect(costIntent('explain paint', room, 'EGP', null).kind).toBe('explain');
    expect(costIntent('Explain underlay', room, 'EGP', null).kind).toBe(
      'explain',
    );
    expect(costIntent('Find cheaper flooring', room, 'EGP', null).kind).toBe(
      'research',
    );
    for (const amount of ['30.001', '3k', '1,2'])
      expect(costIntent(`Budget ${amount}`, room, 'EGP', null).kind).toBe(
        'clarify',
      );
  });
  it('diffs actual lines without spurious sequential-ID changes and retains repeated lines', () => {
    const c = session(),
      before = estimate(c),
      after = structuredClone(before);
    after.lines.forEach((line, i) => {
      line.id = `other_${i}`;
    });
    expect(costLineChanges(before, after)).toEqual({ removed: [], added: [] });
    after.lines[0]!.amountMinor = null;
    expect(costLineChanges(before, after).removed).toHaveLength(1);
    expect(costLineChanges(before, after).added).toHaveLength(1);
  });
  it('derives purchased shopping quantities and qualified steps without treating sample URLs as instructions', () => {
    const c = session(),
      d: EstimateState = pricingState(c.getSnapshot().cost!),
      room = c.getSnapshot().workspace!.current,
      e = estimate(c);
    const plan = roomWorkPlan(room, d, e);
    expect(plan.steps.length).toBeLessThanOrEqual(8);
    expect(plan.steps.flatMap((s) => s.sources)).toEqual([]);
    expect(plan.steps.map((s) => s.detail).join(' ')).toContain(
      'drying, recoat and curing',
    );
    const packs = plan.shopping.find((l) => l.quantity.unit === 'pack');
    expect(packs!.quantity.numerator / packs!.quantity.denominator).toBe(11);
    expect(
      plan.steps
        .flatMap((s) => s.targets)
        .every(
          (key) =>
            key.startsWith('surface:') ||
            room.furniture.some((p) => p.id === key),
        ),
    ).toBe(true);
  });
});
