import { afterEach, describe, expect, it } from 'vitest';
import { calculateRoomEstimate, sampleEstimateOffers } from '@roomedy/spatial';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { productChoicesSchema } from '@roomedy/contracts/estimates';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import {
  marketTargets,
  marketTargetForKey,
} from '../apps/frontend/src/features/cost/market-research.js';
import {
  chooseProduct,
  productChosen,
  reviewSourceSize,
} from '../apps/frontend/src/features/cost/attach-offer.js';
import {
  currentProductChoices,
  allProductsChosen,
  choicePriceIncluded,
} from '../apps/frontend/src/features/cost/product-choices.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import {
  projectOf,
  recoveryOf,
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { ensureEstimateSnapshot } from '../apps/frontend/src/features/cost/versions.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';

const sessions: SessionController[] = [];
function session(condition: 'partial' | 'furnished' = 'furnished') {
  const c = new SessionController(createManualRoom(condition));
  sessions.push(c);
  c.setDestination('cost', 'en-US');
  return c;
}
afterEach(() => {
  sessions.splice(0).forEach((c) => c.dispose());
});
function option(
  c: SessionController,
  key: string,
  simulation: boolean,
  priced = true,
): SourcingCandidate {
  const state = c.getSnapshot(),
    room = state.workspace!.current;
  const target = marketTargets(room).find((target) => target.key === key)!;
  const source = sampleEstimateOffers().find(
    (offer) =>
      offer.kind === target.brief.kind &&
      (offer.kind !== 'furniture' || offer.category === target.brief.category),
  )!;
  const offer = structuredClone(source),
    url = `https://merchant.example/products/${encodeURIComponent(key)}`;
  offer.id = `chosen_${key.replace(/[^a-z0-9_]/gi, '_')}`;
  offer.market = { ...state.cost!.settings.locality };
  offer.source = {
    kind: simulation ? 'sample' : 'sourced',
    label: simulation ? 'Authored example' : 'Opened page',
    url,
    observedAt: simulation ? null : 123,
    evidence: simulation
      ? 'Authored fixture'
      : 'Observed product and specifications',
  };
  if (offer.kind === 'furniture')
    offer.outerSizeMm = target.brief.size as {
      width: number;
      depth: number;
      height: number;
    };
  if (offer.kind === 'paint') offer.colour = target.brief.colour!;
  return {
    label: `Chosen ${target.label}`,
    url,
    imageUrl: null,
    evidence: 'Offline fixture',
    match: priced ? 'similar' : 'lead',
    conditions: 'standard',
    differences: [],
    offer: priced ? offer : null,
    listing: {
      priceMinor: 24900,
      currency: 'USD',
      country: 'US',
      unit: 'item',
      volumeMl: null,
      observedAt: 123,
    },
  };
}
function choose(
  c: SessionController,
  key: string,
  simulation: boolean,
  priced = true,
) {
  const state = c.getSnapshot(),
    target = marketTargets(state.workspace!.current).find(
      (target) => target.key === key,
    )!;
  const candidate = option(c, key, simulation, priced);
  expect(
    chooseProduct(
      c,
      target.brief,
      candidate,
      state.cost!.revision,
      state.workspace!.current.roomRevision,
      simulation,
      target.matchingWalls,
    ).ok,
  ).toBe(true);
  return candidate;
}
describe('explicit product preferences and completion chat', () => {
  it.each([false, true])(
    'repairs an existing first-wall-only quote once, preserving excluded walls, snapshots and Undo: excluded=%s',
    (excluded) => {
      const c = session('partial');
      choose(c, 'surface:north', false);
      expect(ensureEstimateSnapshot(c).ok).toBe(true);
      const project = projectOf(c.getSnapshot())!;
      const paintId = project.cost!.settings.walls[0]!.paintOfferId;
      for (const wall of project.cost!.settings.walls.slice(1))
        wall.paintOfferId = null;
      if (excluded)
        project.cost!.settings.walls.find((w) => w.wall === 'west')!.enabled =
          false;
      expect(c.importProject(project)).toBe(true);
      c.setDestination('cost');
      const before = structuredClone(c.getSnapshot().cost!.settings),
        versions = JSON.stringify(c.getSnapshot().estimateVersions);
      expect(c.repairSelectedPrices()).toBe(true);
      const walls = c.getSnapshot().cost!.settings.walls;
      expect(
        walls.every((w) =>
          w.enabled ? w.paintOfferId === paintId : w.paintOfferId === null,
        ),
      ).toBe(true);
      expect(JSON.stringify(c.getSnapshot().estimateVersions)).toBe(versions);
      expect(c.repairSelectedPrices()).toBe(false);
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(before);
      expect(c.repairSelectedPrices()).toBe(false);
    },
  );
  it('resolves a request for any wall to its matching paint group without merging distinct finishes', () => {
    const room = createManualRoom('partial');
    for (const wall of ['north', 'east', 'south', 'west'])
      expect(marketTargetForKey(room, `surface:${wall}`)?.label).toBe(
        'All walls',
      );
    const base = room.room.surfaces!.walls!;
    if (base.color.status === 'unknown')
      throw Error('Expected the manual wall colour');
    room.room.surfaces!.east = {
      ...structuredClone(base),
      color: { ...base.color, value: '#123456' },
    };
    expect(marketTargetForKey(room, 'surface:east')?.key).toBe('surface:east');
    expect(marketTargetForKey(room, 'surface:west')?.key).toBe('surface:north');
    expect(marketTargetForKey(room, 'surface:west')?.label).not.toBe(
      'All walls',
    );
  });
  it.each([true, false])(
    'prices every matching wall from a paint choice without a caller flag, simulation=%s',
    (simulation) => {
      const c = session('partial'),
        s = c.getSnapshot(),
        target = marketTargets(s.workspace!.current).find(
          (target) => target.group === 'Wall paint',
        )!,
        candidate = option(c, target.key, simulation);
      expect(
        chooseProduct(
          c,
          target.brief,
          candidate,
          s.cost!.revision,
          s.workspace!.current.roomRevision,
          simulation,
        ).ok,
      ).toBe(true);
      const chosen = c.getSnapshot().cost!;
      expect(chosen.settings.walls.every((w) => w.enabled)).toBe(true);
      expect(new Set(chosen.settings.walls.map((w) => w.paintOfferId))).toEqual(
        new Set([candidate.offer!.id]),
      );
      const result = calculateRoomEstimate(
        s.workspace!.current,
        chosen.settings,
        chosen.offers,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.code);
      const paint = result.estimate.lines.filter(
        (line) => line.category === 'walls',
      );
      expect(paint).toHaveLength(1);
      expect(paint[0]!.targets).toHaveLength(4);
      expect(paint[0]!.amountMinor).toBeGreaterThan(0);
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(s.cost!.settings);
    },
  );
  it('preserves the existing explicit primer quote action in historical full-scope estimates', () => {
    const c = new SessionController(createManualRoom('partial'));
    sessions.push(c);
    c.setDestination('cost');
    const s = c.getSnapshot(),
      brief = buildSourcingBrief(
        s.workspace!.current,
        'surface:north',
        '',
        true,
      )!;
    const offer = sampleEstimateOffers().find(
      (offer) => offer.kind === 'primer',
    )!;
    const candidate = {
      label: 'Primer',
      url: 'https://merchant.example/primer',
      match: 'similar' as const,
      conditions: 'standard' as const,
      evidence: 'Authored legacy fixture',
      differences: [],
      offer,
    };
    expect(
      chooseProduct(
        c,
        brief,
        candidate,
        s.cost!.revision,
        s.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().cost!.settings.walls[0]!.primerOfferId).toBe(
      offer.id,
    );
    expect(c.getSnapshot().cost!.productChoices).toBeUndefined();
  });
  it('posts the current breakdown when a complete-set replacement is chosen again after Undo', () => {
    const c = session('partial');
    const targets = marketTargets(c.getSnapshot().workspace!.current);
    targets.forEach((target) => choose(c, target.key, true, false));
    const last = targets.at(-1)!,
      replacement = {
        ...option(c, last.key, true, false),
        label: 'Replacement',
        url: 'https://merchant.example/replacement',
      };
    const pick = () => {
      const s = c.getSnapshot();
      expect(
        chooseProduct(
          c,
          last.brief,
          replacement,
          s.cost!.revision,
          s.workspace!.current.roomRevision,
          true,
          last.matchingWalls,
        ).ok,
      ).toBe(true);
    };
    pick();
    expect(
      c
        .getSnapshot()
        .cost!.messages.filter((m) => m.kind === 'selection-summary'),
    ).toHaveLength(2);
    c.undo();
    pick();
    expect(
      c
        .getSnapshot()
        .cost!.messages.filter((m) => m.kind === 'selection-summary'),
    ).toHaveLength(3);
    const before = c.getSnapshot();
    pick();
    expect(c.getSnapshot()).toBe(before);
  });
  it.each([true, false])(
    'completes the entire current room once in simulation=%s, including the seventh target',
    (simulation) => {
      const c = session(),
        targets = marketTargets(c.getSnapshot().workspace!.current);
      expect(targets).toHaveLength(7);
      targets
        .slice(0, 6)
        .forEach((target) => choose(c, target.key, simulation));
      expect(c.getSnapshot().cost!.messages).toHaveLength(0);
      expect(
        allProductsChosen(
          c.getSnapshot().workspace!.current,
          c.getSnapshot().cost!,
        ),
      ).toBe(false);
      const last = targets[6]!,
        candidate = choose(c, last.key, simulation, false);
      const completed = c.getSnapshot();
      expect(completed.cost!.messages).toMatchObject([
        { role: 'assistant', kind: 'selection-summary' },
      ]);
      expect(completed.cost!.messages[0]!.text).toContain(
        'All 7 products are selected',
      );
      expect(completed.cost!.messages[0]!.text).toContain(
        'Review your choices',
      );
      expect(completed.cost!.messages[0]!.text).not.toContain(
        'Choose products',
      );
      expect(
        currentProductChoices(completed.workspace!.current, completed.cost!),
      ).toHaveLength(7);
      expect(completed.estimateVersions).toHaveLength(0);
      expect(
        chooseProduct(
          c,
          last.brief,
          candidate,
          completed.cost!.revision,
          completed.workspace!.current.roomRevision,
          simulation,
          last.matchingWalls,
        ).ok,
      ).toBe(true);
      expect(c.getSnapshot()).toBe(completed);
      c.setDestination('design');
      c.setDestination('cost', 'en-US');
      expect(c.getSnapshot().cost!.messages).toHaveLength(1);
      expect(c.undo().ok).toBe(true);
      expect(
        currentProductChoices(
          c.getSnapshot().workspace!.current,
          c.getSnapshot().cost!,
        ),
      ).toHaveLength(6);
      choose(c, last.key, simulation, false);
      expect(
        c
          .getSnapshot()
          .cost!.messages.filter((m) => m.kind === 'selection-summary'),
      ).toHaveLength(2);
    },
  );
  it('includes a selected listing price provisionally and replaces the prior quote in one Undo transaction', () => {
    const c = session('partial'),
      key = marketTargets(c.getSnapshot().workspace!.current)[0]!.key;
    choose(c, key, false);
    const before = c.getSnapshot(),
      old = pricingState(before.cost!);
    const target = marketTargets(before.workspace!.current)[0]!,
      pending = {
        ...option(c, key, false, false),
        label: 'Other chosen product',
        url: 'https://merchant.example/other',
      };
    expect(
      chooseProduct(
        c,
        target.brief,
        pending,
        before.cost!.revision,
        before.workspace!.current.roomRevision,
        false,
      ).ok,
    ).toBe(true);
    const after = c.getSnapshot();
    expect(
      after.cost!.settings.furniture.find((f) => f.id === key)!.offerId,
    ).toBeNull();
    expect(
      productChosen(
        after.workspace!.current,
        after.cost!,
        target.brief,
        pending,
      ),
    ).toBe(true);
    const total = calculateRoomEstimate(
      after.workspace!.current,
      after.cost!.settings,
      after.cost!.offers,
    );
    if (!total.ok) throw Error(total.code);
    expect(total.estimate.knownTotalMinor).toBe(24900);
    expect(
      total.estimate.lines.find(
        (line) =>
          line.targets.some((t) => t.kind === 'furniture' && t.id === key) &&
          line.pricing === 'listed',
      )?.amountMinor,
    ).toBe(24900);
    expect(c.undo().ok).toBe(true);
    expect(pricingState(c.getSnapshot().cost!)).toEqual(old);
  });
  it('keeps a different-size choice unpriced without changing the accepted room', () => {
    const c = session('partial'),
      before = c.getSnapshot(),
      target = marketTargets(before.workspace!.current)[0]!,
      candidate = option(c, target.key, false);
    if (candidate.offer?.kind !== 'furniture' || !candidate.offer.outerSizeMm)
      throw Error('fixture');
    candidate.offer.outerSizeMm.width += 100;
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        before.cost!.revision,
        before.workspace!.current.roomRevision,
        false,
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().workspace!.current).toBe(before.workspace!.current);
    expect(c.getSnapshot().cost!.settings.furniture[0]!.offerId).toBeNull();
    expect(
      currentProductChoices(
        c.getSnapshot().workspace!.current,
        c.getSnapshot().cost!,
      ),
    ).toHaveLength(1);
  });
  it('marks only the exact chosen option when two variants share a source page', () => {
    const c = session('partial'),
      target = marketTargets(c.getSnapshot().workspace!.current)[0]!;
    const chosen = choose(c, target.key, true),
      alternate = structuredClone(chosen);
    alternate.label = 'Another size';
    alternate.offer!.id = 'different_variant';
    const state = c.getSnapshot();
    expect(
      productChosen(
        state.workspace!.current,
        state.cost!,
        target.brief,
        chosen,
      ),
    ).toBe(true);
    expect(
      productChosen(
        state.workspace!.current,
        state.cost!,
        target.brief,
        alternate,
      ),
    ).toBe(false);
  });
  it('keeps the same chosen product after explicit fit-and-price Apply, with one Undo restoring the pending preference', () => {
    const c = session('partial');
    const initial = c.getSnapshot(),
      piece = initial.workspace!.current.furniture[0]!;
    c.dispatch(
      [
        {
          type: 'set-locks',
          id: piece.id,
          locks: { ...piece.locks, dimensions: false },
        },
      ],
      'Unlock dimensions',
    );
    const before = c.getSnapshot(),
      target = marketTargets(before.workspace!.current)[0]!,
      candidate = option(c, target.key, true);
    if (candidate.offer?.kind !== 'furniture' || !candidate.offer.outerSizeMm)
      throw Error('fixture');
    candidate.offer.outerSizeMm.width += 100;
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        before.cost!.revision,
        before.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(true);
    const pending = c.getSnapshot(),
      pricing = structuredClone(pricingState(pending.cost!));
    expect(
      reviewSourceSize(
        c,
        target.brief,
        candidate,
        pending.cost!.revision,
        pending.workspace!.current.roomRevision,
      ).ok,
    ).toBe(true);
    expect(c.applyCostProposal().ok).toBe(true);
    const applied = c.getSnapshot();
    expect(readProject(exportProject(applied)!).ok).toBe(true);
    expect(
      currentProductChoices(applied.workspace!.current, applied.cost!),
    ).toHaveLength(1);
    expect(applied.cost!.settings.furniture[0]!.offerId).toBe(
      candidate.offer.id,
    );
    expect(c.undo().ok).toBe(true);
    expect(pricingState(c.getSnapshot().cost!)).toEqual(pricing);
  });
  it('requires fresh scope, price revision, phase and preview authority', () => {
    const c = session('partial'),
      before = c.getSnapshot(),
      target = marketTargets(before.workspace!.current)[0]!,
      candidate = option(c, target.key, true, false);
    choose(c, 'surface:floor', true, false);
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        before.cost!.revision,
        before.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(false);
    c.setDestination('design');
    const state = c.getSnapshot();
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        state.cost!.revision,
        state.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(false);
    c.setDestination('cost');
    c.prepareVisitorPreview(
      [{ type: 'finish', id: target.key, finish: 'sage' }],
      'Sage',
    );
    const preview = c.getSnapshot();
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        preview.cost!.revision,
        preview.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(false);
    c.cancelPreview();
    c.dispatch([{ type: 'finish', id: target.key, finish: 'sage' }], 'Sage');
    const changed = c.getSnapshot();
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        changed.cost!.revision,
        changed.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(false);
  });
  it('keeps conditional reference prices qualified and never borrows another item’s applied price', () => {
    const c = session('partial'),
      target = marketTargets(c.getSnapshot().workspace!.current)[0]!;
    choose(c, target.key, false);
    const state = c.getSnapshot(),
      choice = state.cost!.productChoices![0]!,
      result = calculateRoomEstimate(
        state.workspace!.current,
        state.cost!.settings,
        state.cost!.offers,
      );
    if (!result.ok) throw Error(result.code);
    const other = state.workspace!.current.furniture[1]!.id;
    expect(
      choicePriceIncluded(
        { ...choice, key: other },
        state.cost!,
        result.estimate,
      ),
    ).toBe(false);
    const candidate = {
      ...option(c, target.key, false, false),
      conditions: 'from' as const,
      url: 'https://merchant.example/from-price',
    };
    expect(
      chooseProduct(
        c,
        target.brief,
        candidate,
        state.cost!.revision,
        state.workspace!.current.roomRevision,
        false,
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().cost!.productChoices![0]!.quotedPrice).toBe(
      'From $249.00 / item',
    );
    expect(c.getSnapshot().cost!.settings.furniture[0]!.offerId).toBeNull();
  });
  it('does not let pricing proposals forge or remove product choices', () => {
    const c = session('partial'),
      target = marketTargets(c.getSnapshot().workspace!.current)[0]!;
    choose(c, target.key, true, false);
    const state = c.getSnapshot(),
      pricing = structuredClone(pricingState(state.cost!));
    pricing.productChoices![0]!.label = 'Forged preference';
    expect(
      c.prepareCostProposal(pricing, 'Forged', [], state.cost!.revision).ok,
    ).toBe(false);
    delete pricing.productChoices;
    pricing.settings.floor.wasteBps = 2000;
    expect(
      c.prepareCostProposal(pricing, 'Waste', [], state.cost!.revision).ok,
    ).toBe(true);
    expect(c.applyCostProposal().ok).toBe(true);
    expect(c.getSnapshot().cost!.productChoices).toEqual(
      state.cost!.productChoices,
    );
  });
  it('preserves preferences through project/recovery/frozen versions without re-announcing completion', () => {
    const c = session('partial');
    marketTargets(c.getSnapshot().workspace!.current).forEach((target) =>
      choose(c, target.key, false, false),
    );
    const first = ensureEstimateSnapshot(c);
    expect(first.ok).toBe(true);
    expect(ensureEstimateSnapshot(c)).toEqual(first);
    expect(c.getSnapshot().estimateVersions).toHaveLength(1);
    const bytes = exportProject(c.getSnapshot())!;
    expect(readProject(bytes).ok).toBe(true);
    const imported = session('partial');
    expect(imported.importProject(projectOf(c.getSnapshot()))).toBe(true);
    imported.setDestination('cost');
    expect(imported.getSnapshot().cost!.productChoices).toEqual(
      c.getSnapshot().cost!.productChoices,
    );
    expect(imported.getSnapshot().cost!.messages).toHaveLength(0);
    const restored = session('partial');
    expect(restored.restore(recoveryOf(c.getSnapshot())!)).toBe(true);
    expect(restored.getSnapshot().cost!.productChoices).toEqual(
      c.getSnapshot().cost!.productChoices,
    );
    const conversation = restored.getSnapshot().cost!.messages;
    expect(conversation.map((message) => message.text)).toEqual(
      c.getSnapshot().cost!.messages.map((message) => message.text),
    );
    restored.setDestination('design');
    restored.setDestination('cost');
    expect(restored.getSnapshot().cost!.messages).toBe(conversation);
    expect(
      productChoicesSchema.safeParse([
        ...c.getSnapshot().cost!.productChoices!,
        c.getSnapshot().cost!.productChoices![0]!,
      ]).success,
    ).toBe(false);
  });
});
