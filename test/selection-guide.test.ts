import { afterEach, describe, expect, it } from 'vitest';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { VERSIONS } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import {
  chooseProduct,
  prepareProductChoice,
} from '../apps/frontend/src/features/cost/attach-offer.js';
import {
  chooseRemainingProducts,
  guideView,
  guideIntent,
  INITIAL_PRODUCT_GUIDE,
  chooseGuidedProduct,
} from '../apps/frontend/src/features/cost/selection-guide.js';
import type { ProductGuide } from '../apps/frontend/src/features/cost/selection-guide.js';
import {
  currentProductChoices,
  allProductsChosen,
} from '../apps/frontend/src/features/cost/product-choices.js';
import type { MarketEntry } from '../apps/frontend/src/features/cost/conversation.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import { calculateRoomEstimate, sampleEstimateOffers } from '@roomedy/spatial';
const sessions: SessionController[] = [];
function setup(simulation = true) {
  const c = new SessionController(createManualRoom('partial'));
  sessions.push(c);
  c.setDestination('cost', 'en-US');
  const s = c.getSnapshot();
  const entries: MarketEntry[] = marketTargets(s.workspace!.current).map(
    (target, index) => ({
      target,
      roomRevision: s.workspace!.current.roomRevision,
      costRevision: s.cost!.revision,
      generation: s.generation,
      workspaceId: s.workspace!.workspaceId,
      update: {
        kind: 'answer',
        answer: {
          ok: true,
          input: {
            schemaVersion: VERSIONS.schema,
            catalogueVersion: VERSIONS.catalogue,
            rulesVersion: VERSIONS.rules,
            kind: 'sourcing',
            identity: {
              workspaceId: s.workspace!.workspaceId,
              generation: s.generation,
              operationId: 'fixture',
              roomId: s.workspace!.current.roomId,
              inputRevision: s.workspace!.current.roomRevision,
            },
            costRevision: s.cost!.revision,
            locality: s.cost!.settings.locality,
            brief: target.brief,
          },
          simulation,
          reply: {
            notes: [],
            candidates: [
              candidate(target.brief.kind, index),
              candidate(target.brief.kind, index + 10),
            ],
          },
        },
      },
    }),
  );
  return { c, entries };
}
function candidate(kind: string, index: number): SourcingCandidate {
  return {
    label: `Product ${index}`,
    url: `https://merchant.example/products/${kind}-${index}`,
    imageUrl: null,
    evidence: 'Offline fixture',
    conditions: 'standard',
    match: 'similar',
    differences: [],
    offer: null,
    listing: {
      currency: 'USD',
      country: 'US',
      priceMinor: 10000 + index * 100,
      unit: kind === 'floor' ? 'pack' : kind === 'paint' ? 'can' : 'item',
      volumeMl: kind === 'paint' ? 2500 : null,
      coverageMm2: kind === 'floor' ? 2_000_000 : null,
      coverageMm2PerLitre: kind === 'paint' ? 8_000_000 : null,
      observedAt: 123,
    },
  };
}
afterEach(() => sessions.splice(0).forEach((c) => c.dispose()));
describe('one-item product guide and explicit batch choice', () => {
  it.each([true, false])(
    'automatically advances a new pass with saved complete choices, showing no total until its last item: simulation=%s',
    (simulation) => {
      const { c, entries } = setup(simulation);
      expect(chooseRemainingProducts(c, entries).ok).toBe(true);
      c.costMessage('visitor', 'Review these products again.');
      const passId = c.getSnapshot().cost!.messages.at(-1)!.id!;
      let guide: ProductGuide = {
        stage: 'choosing',
        key: entries[0]!.target.key,
        reviewedKeys: [],
        passId,
      };
      for (const [index, original] of entries.entries()) {
        const revision = c.getSnapshot().cost!.revision;
        const fresh = entries.map((e) => ({ ...e, costRevision: revision })),
          entry = fresh.find((e) => e.target.key === original.target.key)!;
        if (entry.update.kind !== 'answer' || !entry.update.answer.ok)
          throw Error('fixture');
        const result = chooseGuidedProduct(
          c,
          fresh,
          entry,
          entry.update.answer.reply.candidates[1]!,
          guide,
        );
        expect(result.ok).toBe(true);
        if (!result.ok) throw Error(result.reason);
        guide = result.guide;
        expect(guide.reviewedKeys).toHaveLength(index + 1);
        expect(
          allProductsChosen(
            c.getSnapshot().workspace!.current,
            c.getSnapshot().cost!,
          ),
        ).toBe(true);
        expect(
          c
            .getSnapshot()
            .cost!.messages.filter((m) => m.kind === 'selection-summary'),
        ).toHaveLength(index === entries.length - 1 ? 2 : 1);
        expect(result.complete).toBe(index === entries.length - 1);
        expect(guide.key).toBe(entries[index + 1]?.target.key ?? null);
      }
      expect(c.completeProductChoices(passId)).toBe(false);
      expect(c.completeProductChoices(-1)).toBe(false);
      expect(
        c
          .getSnapshot()
          .cost!.messages.filter((m) => m.kind === 'selection-summary'),
      ).toHaveLength(2);
    },
  );
  it('keeping existing selections advances each step without changing prices and still reports once at the end', () => {
    const { c, entries } = setup();
    expect(chooseRemainingProducts(c, entries).ok).toBe(true);
    const before = c.getSnapshot().cost!.revision;
    let guide: ProductGuide = {
      stage: 'choosing',
      key: entries[0]!.target.key,
      reviewedKeys: [],
    };
    for (const entry of entries) {
      const fresh = entries.map((e) => ({
        ...e,
        costRevision: c.getSnapshot().cost!.revision,
      }));
      const active = fresh.find((e) => e.target.key === entry.target.key)!;
      if (active.update.kind !== 'answer' || !active.update.answer.ok)
        throw Error('fixture');
      const result = chooseGuidedProduct(
        c,
        fresh,
        active,
        active.update.answer.reply.candidates[0]!,
        guide,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.reason);
      guide = result.guide;
      expect(c.getSnapshot().cost!.revision).toBe(before);
    }
    expect(guide.stage).toBe('done');
    expect(
      c
        .getSnapshot()
        .cost!.messages.filter((m) => m.kind === 'selection-summary'),
    ).toHaveLength(2);
  });
  it('automatically returns to skipped items before completing a fresh manual guide', () => {
    const { c, entries } = setup();
    let guide: ProductGuide = {
      stage: 'choosing',
      key: entries[1]!.target.key,
      reviewedKeys: [],
    };
    for (const index of [1, 2, 3, 0]) {
      const fresh = entries.map((e) => ({
          ...e,
          costRevision: c.getSnapshot().cost!.revision,
        })),
        entry = fresh[index]!;
      if (entry.update.kind !== 'answer' || !entry.update.answer.ok)
        throw Error('fixture');
      const result = chooseGuidedProduct(
        c,
        fresh,
        entry,
        entry.update.answer.reply.candidates[0]!,
        guide,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw Error(result.reason);
      guide = result.guide;
      if (index === 3) expect(guide.key).toBe(entries[0]!.target.key);
      if (index !== 0)
        expect(
          c
            .getSnapshot()
            .cost!.messages.some((m) => m.kind === 'selection-summary'),
        ).toBe(false);
    }
    expect(guide.stage).toBe('done');
    expect(
      c
        .getSnapshot()
        .cost!.messages.filter((m) => m.kind === 'selection-summary'),
    ).toHaveLength(1);
  });
  it('does not mistake saved complete product choices for completion of a new guide pass', () => {
    const { c, entries } = setup();
    expect(chooseRemainingProducts(c, entries).ok).toBe(true);
    const s = c.getSnapshot();
    const guide = {
      stage: 'choosing' as const,
      key: entries[0]!.target.key,
      reviewedKeys: [],
    };
    expect(allProductsChosen(s.workspace!.current, s.cost!)).toBe(true);
    expect(
      guideView(s.workspace!.current, s.cost!, entries, guide).complete,
    ).toBe(false);
  });
  it('keeps explicitly requested historical service and primer targets reachable in the guide', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      base = entries.at(-1)!;
    const service = buildSourcingBrief(
      s.workspace!.current,
      'service:paint-labour',
      '',
    )!;
    const serviceEntry: MarketEntry = {
      ...base,
      target: {
        key: 'service:paint-labour',
        label: service.label,
        group: 'Services',
        brief: service,
        matchingWalls: false,
      },
    };
    expect(
      guideView(s.workspace!.current, s.cost!, [serviceEntry], {
        stage: 'choosing',
        key: 'service:paint-labour',
      }).active?.key,
    ).toBe('service:paint-labour');
    const primer = buildSourcingBrief(
      s.workspace!.current,
      'surface:north',
      '',
      true,
    )!;
    const primerEntry: MarketEntry = {
      ...base,
      target: { ...base.target, label: 'Wall primer', brief: primer },
    };
    expect(
      guideView(s.workspace!.current, s.cost!, [primerEntry], {
        stage: 'choosing',
        key: 'surface:north',
      }).active?.brief.kind,
    ).toBe('primer');
  });
  it('never automatically substitutes a primer or other explicit quote role for wall paint', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      base = entries.at(-1)!;
    if (base.update.kind !== 'answer' || !base.update.answer.ok)
      throw Error('fixture');
    const brief = buildSourcingBrief(
      s.workspace!.current,
      'surface:north',
      '',
      true,
    )!;
    const primer = structuredClone(
      sampleEstimateOffers().find((o) => o.kind === 'primer')!,
    );
    const candidates = base.update.answer.reply.candidates.map((candidate) => ({
      ...candidate,
      offer: { ...primer, source: { ...primer.source, url: candidate.url } },
    }));
    const entry: MarketEntry = {
      ...base,
      target: { ...base.target, label: 'Wall primer', brief },
      update: {
        kind: 'answer',
        answer: {
          ...base.update.answer,
          input: { ...base.update.answer.input, brief },
          reply: { notes: [], candidates },
        },
      },
    };
    const before = JSON.stringify(s.cost);
    expect(chooseRemainingProducts(c, [entry]).ok).toBe(false);
    const wrongRole: MarketEntry = { ...entry, target: base.target };
    expect(chooseRemainingProducts(c, [wrongRole]).ok).toBe(false);
    expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
  });
  it('keeps an unsearched item in its correct step without inventing ready options or completing a partial batch', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      partial = entries.slice(0, 2),
      key = entries.at(-1)!.target.key;
    const view = guideView(s.workspace!.current, s.cost!, partial, {
      stage: 'choosing',
      key,
    });
    expect(view.active?.key).toBe(key);
    expect(view.queue).toHaveLength(4);
    expect(view.available).toHaveLength(2);
    expect(chooseRemainingProducts(c, partial).selected).toHaveLength(2);
    expect(
      allProductsChosen(
        c.getSnapshot().workspace!.current,
        c.getSnapshot().cost!,
      ),
    ).toBe(false);
    expect(
      c
        .getSnapshot()
        .cost!.messages.some((m) => m.kind === 'selection-summary'),
    ).toBe(false);
  });
  it('never automatically chooses known wrong-size, unavailable, wrong-unit or foreign-only options', () => {
    const { c, entries } = setup(),
      before = JSON.stringify(c.getSnapshot().cost);
    for (const [index, entry] of entries.entries()) {
      if (entry.update.kind !== 'answer' || !entry.update.answer.ok) continue;
      for (const candidate of entry.update.answer.reply.candidates) {
        if (index < 2) {
          const offer = structuredClone(
            sampleEstimateOffers().find((o) => o.kind === 'furniture')!,
          );
          if (offer.kind !== 'furniture') throw Error('fixture');
          const size = entry.target.brief.size!;
          if (
            size.width === null ||
            size.depth === null ||
            size.height === null
          )
            throw Error('Expected manual dimensions');
          offer.outerSizeMm = {
            width: size.width + (index === 0 ? 100 : 0),
            depth: size.depth,
            height: size.height,
          };
          if (index === 1) offer.availability = 'unavailable';
          candidate.offer = offer;
        } else if (index === 2) candidate.listing!.unit = 'item';
        else candidate.listing!.currency = 'EUR';
      }
    }
    expect(chooseRemainingProducts(c, entries).ok).toBe(false);
    expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
  });
  it('guards explicit batch input identity, duplicates and stale revisions before writing', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      entry = entries[0]!;
    if (entry.update.kind !== 'answer' || !entry.update.answer.ok)
      throw Error('fixture');
    const p = prepareProductChoice(
      s.workspace!.current,
      s.cost!,
      entry.target.brief,
      entry.update.answer.reply.candidates[0]!,
      true,
    );
    if (!p.ok) throw Error(p.reason);
    const before = JSON.stringify(s.cost);
    expect(
      c.chooseCostProducts(
        p.settings,
        p.offers,
        [p.choice, p.choice],
        s.cost!.revision,
        s.workspace!.current.roomRevision,
      ),
    ).toBe(false);
    expect(
      c.chooseCostProducts(
        p.settings,
        p.offers,
        [{ ...p.choice, scope: 'forged' }],
        s.cost!.revision,
        s.workspace!.current.roomRevision,
      ),
    ).toBe(false);
    expect(
      c.chooseCostProducts(
        p.settings,
        p.offers,
        [p.choice],
        s.cost!.revision + 1,
        s.workspace!.current.roomRevision,
      ),
    ).toBe(false);
    expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
  });
  it('starts ready without choosing anything, then follows room furniture/floor/wall order', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      before = JSON.stringify(s.cost);
    const ready = guideView(s.workspace!.current, s.cost!, entries);
    expect(ready.stage).toBe('ready');
    expect(ready.queue.map((t) => t.group)).toEqual([
      'Furniture',
      'Furniture',
      'Flooring',
      'Wall paint',
    ]);
    expect(ready.active?.key).toBe(entries[0]!.target.key);
    expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
    const next = guideView(s.workspace!.current, s.cost!, entries, {
      stage: 'choosing',
      key: entries[1]!.target.key,
    });
    expect(next.next?.group).toBe('Flooring');
  });
  it.each([true, false])(
    'chooses current supported options in one transaction/Undo and announces one breakdown, simulation=%s',
    (simulation) => {
      const { c, entries } = setup(simulation),
        before = c.getSnapshot();
      const result = chooseRemainingProducts(c, entries);
      expect(result.ok).toBe(true);
      expect(result.selected).toHaveLength(4);
      const s = c.getSnapshot();
      expect(allProductsChosen(s.workspace!.current, s.cost!)).toBe(true);
      expect(s.cost!.revision).toBe(before.cost!.revision + 1);
      expect(
        s.cost!.messages.filter((m) => m.kind === 'selection-summary'),
      ).toHaveLength(1);
      const e = calculateRoomEstimate(
        s.workspace!.current,
        s.cost!.settings,
        s.cost!.offers,
      );
      expect(e.ok).toBe(true);
      if (!e.ok) throw Error(e.code);
      expect(e.estimate.knownTotalMinor).toBeGreaterThan(0);
      expect(
        e.estimate.lines.find((l) => l.category === 'walls')!.targets,
      ).toHaveLength(4);
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(before.cost!.settings);
      expect(
        currentProductChoices(
          c.getSnapshot().workspace!.current,
          c.getSnapshot().cost!,
        ),
      ).toHaveLength(0);
      expect(
        guideView(
          c.getSnapshot().workspace!.current,
          c.getSnapshot().cost!,
          entries,
          { stage: 'done', key: null },
        ).stage,
      ).toBe('ready');
    },
  );
  it('preserves an existing visitor choice and chooses only the remaining targets', () => {
    const { c, entries } = setup(),
      s = c.getSnapshot(),
      entry = entries[0]!,
      answer = entry.update.kind === 'answer' ? entry.update.answer : null;
    if (!answer?.ok) throw Error('fixture');
    const selected = answer.reply.candidates[1]!;
    expect(
      chooseProduct(
        c,
        entry.target.brief,
        selected,
        s.cost!.revision,
        s.workspace!.current.roomRevision,
        true,
      ).ok,
    ).toBe(true);
    const before = c.getSnapshot(),
      fresh = entries.map((e) => ({
        ...e,
        costRevision: before.cost!.revision,
      }));
    expect(chooseRemainingProducts(c, fresh).selected).toHaveLength(3);
    expect(
      currentProductChoices(
        c.getSnapshot().workspace!.current,
        c.getSnapshot().cost!,
      )[0]!.url,
    ).toBe(selected.url);
    expect(c.undo().ok).toBe(true);
    expect(c.getSnapshot().cost!.productChoices).toEqual(
      before.cost!.productChoices,
    );
  });
  it('skips unpriced/foreign/unavailable/conditional choices and leaves missing targets unresolved', () => {
    const { c, entries } = setup();
    for (const [i, entry] of entries.entries()) {
      if (entry.update.kind !== 'answer' || !entry.update.answer.ok) continue;
      for (const option of entry.update.answer.reply.candidates) {
        if (i === 0) option.listing = null;
        if (i === 1) option.listing!.currency = 'EUR';
        if (i === 2) option.conditions = 'conditional';
      }
    }
    const result = chooseRemainingProducts(c, entries);
    expect(result.ok).toBe(true);
    expect(result.selected).toHaveLength(1);
    expect(
      c
        .getSnapshot()
        .cost!.messages.some((m) => m.kind === 'selection-summary'),
    ).toBe(false);
    expect(
      allProductsChosen(
        c.getSnapshot().workspace!.current,
        c.getSnapshot().cost!,
      ),
    ).toBe(false);
  });
  it('rejects stale entries and inactive/retired sessions without changing prices', () => {
    const { c, entries } = setup(),
      before = JSON.stringify(c.getSnapshot().cost);
    expect(
      chooseRemainingProducts(
        c,
        entries.map((e) => ({ ...e, costRevision: e.costRevision + 1 })),
      ).ok,
    ).toBe(false);
    expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
    c.setDestination('design');
    expect(chooseRemainingProducts(c, entries).ok).toBe(false);
    c.dispose();
    expect(chooseRemainingProducts(c, entries).ok).toBe(false);
  });
  it('recognizes explicit selection commands without turning next or a negation into automatic choice', () => {
    expect(guideIntent('Choose the rest for me.')).toBe('auto');
    expect(guideIntent('Can you choose the rest for me?')).toBe('auto');
    expect(guideIntent('Next')).toBe('next');
    expect(guideIntent('Start choosing')).toBe('start');
    expect(guideIntent('Review my choices')).toBe('review');
    expect(guideIntent('Do not choose for me')).toBeNull();
    expect(guideIntent('Can you explain next steps?')).toBeNull();
    expect(INITIAL_PRODUCT_GUIDE.stage).toBe('ready');
  });
});
