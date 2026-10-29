import { describe, expect, it } from 'vitest';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { estimateSettingsSchema } from '@roomedy/contracts/estimates';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { createCostDraft } from '../apps/frontend/src/features/cost/state.js';
import {
  shoppingLocality,
  localityCorrection,
  costSectionRequest,
  furniturePurchase,
  simplifyCostScope,
  changeShoppingLocality,
  researchLocality,
} from '../apps/frontend/src/features/cost/journey.js';
import { captureVersion } from '../apps/frontend/src/features/cost/versions.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import { selectOffer } from '../apps/frontend/src/features/cost/attach-offer.js';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';

describe('guided materials and furniture journey', () => {
  it('defaults fresh shopping to US while preserving explicit and historical markets', () => {
    expect(shoppingLocality()).toEqual({
      country: 'US',
      city: 'United States',
      currency: 'USD',
    });
    const unknown = {
      country: 'ZZ',
      city: 'No location shared',
      currency: 'USD' as const,
    };
    expect(researchLocality(unknown).country).toBe('US');
    expect(unknown.country).toBe('ZZ');
    expect(researchLocality(unknown, false)).toEqual(unknown);
    expect(researchLocality(shoppingLocality('EG')).country).toBe('EG');
    expect(researchLocality({ ...unknown, currency: 'EUR' })).toEqual({
      ...unknown,
      currency: 'EUR',
    });
    for (const locale of ['en-US', 'ar-EG', 'ja-JP', ''])
      expect(
        createCostDraft(createRoomFixture('sample'), locale).settings.locality
          .country,
      ).toBe('US');
  });
  it('clears incompatible prices on a legacy market correction while retaining regional choices in simple scope', () => {
    const draft = createCostDraft(createRoomFixture('sample'), 'de-DE');
    const initial = changeShoppingLocality(draft, shoppingLocality('DE'));
    draft.settings = initial.settings;
    draft.offers = initial.offers;
    const paint = draft.offers.find((offer) => offer.kind === 'paint')!;
    paint.source = {
      ...paint.source,
      kind: 'sourced',
      url: 'https://merchant.example/paint',
      observedAt: 123,
    };
    draft.settings.walls.forEach((wall) => {
      wall.paintOfferId = paint.id;
    });
    const regional = changeShoppingLocality(draft, shoppingLocality('FR'));
    expect(
      regional.settings.walls.every((wall) => wall.paintOfferId === paint.id),
    ).toBe(true);
    delete draft.settings.demoScope;
    const legacy = changeShoppingLocality(draft, shoppingLocality('FR'));
    expect(
      legacy.settings.walls.every((wall) => wall.paintOfferId === null),
    ).toBe(true);
    expect(legacy.offers.find((offer) => offer.id === paint.id)).toEqual(paint);
  });
  it('prices an explicitly chosen replacement floor without changing its drawn finish or legacy full-scope guard', () => {
    const room = createManualRoom('partial'),
      before = JSON.stringify(room);
    const c = new SessionController(room),
      legacy = new SessionController(room);
    try {
      c.setDestination('cost', 'en-US');
      legacy.setDestination('cost');
      const brief = buildSourcingBrief(room, 'surface:floor')!;
      const draft = c.getSnapshot().cost!;
      const offer = {
        ...draft.offers.find((o) => o.kind === 'floor')!,
        id: 'new-floor',
      };
      const candidate: SourcingCandidate = {
        label: 'New floor alternative',
        match: 'similar',
        url: 'https://example.com/floor',
        evidence: 'Authored test',
        conditions: 'standard',
        differences: ['Replacement material; drawn finish unchanged.'],
        offer,
      };
      expect(
        selectOffer(c, brief, candidate, draft.revision, room.roomRevision).ok,
      ).toBe(true);
      const current = c.getSnapshot().cost!;
      const result = calculateRoomEstimate(
        room,
        current.settings,
        current.offers,
      );
      if (!result.ok) throw new Error(result.code);
      expect(
        result.estimate.lines.find((l) => l.offerIds.includes('new-floor'))
          ?.amountMinor,
      ).toBeGreaterThan(0);
      const old = legacy.getSnapshot().cost!;
      expect(
        selectOffer(
          legacy,
          brief,
          { ...candidate, offer: { ...offer, market: old.settings.locality } },
          old.revision,
          room.roomRevision,
        ).ok,
      ).toBe(false);
      expect(c.getSnapshot().workspace!.current).toEqual(JSON.parse(before));
    } finally {
      c.dispose();
      legacy.dispose();
    }
  });
  it.each([
    ['US', 'US'],
    ['GB', 'GB'],
    ['FR', 'FR'],
    ['EG', 'EG'],
    ['SA', 'SA'],
    ['JP', 'JP'],
    ['ar', 'ZZ'],
    ['en-US', 'ZZ'],
    ['', 'ZZ'],
  ])(
    'uses only an explicit country %s, never a browser-language guess',
    (country, expected) => {
      expect(shoppingLocality(country)).toMatchObject({
        country: expected,
        currency: 'USD',
      });
    },
  );
  it('only interprets explicit location corrections and real section choices', () => {
    expect(localityCorrection("I'm in Egypt")).toMatchObject({
      country: 'EG',
      currency: 'USD',
    });
    expect(localityCorrection('Shop in Europe')).toMatchObject({
      country: 'DE',
      city: 'Europe',
    });
    expect(localityCorrection('American walnut bed')).toBeNull();
    expect(localityCorrection('Find a desk in Egypt')).toBeNull();
    expect(costSectionRequest('Show flooring')).toBe('floor');
    expect(costSectionRequest('Choose furniture')).toBe('furniture');
    expect(costSectionRequest('Plan your flooring')).toBe('floor');
    expect(costSectionRequest('Choose wall paint')).toBe('walls');
    expect(costSectionRequest('full breakdown')).toBe('review');
    expect(costSectionRequest('buy a cheaper floor')).toBeNull();
  });
  it('starts a simple fresh browser draft without migrating a legacy scope', () => {
    const room = createRoomFixture('sample');
    const old = createCostDraft(room),
      fresh = createCostDraft(room, 'en-US');
    expect(old.settings.demoScope).toBeUndefined();
    expect(old.settings.locality.country).toBe('EG');
    const oldBytes = JSON.stringify(old),
      simple = simplifyCostScope(old);
    expect(simple.locality).toEqual(old.settings.locality);
    expect(simple.services.every((service) => !service.enabled)).toBe(true);
    expect(JSON.stringify(old)).toBe(oldBytes);
    expect(fresh.settings.locality.country).toBe('US');
    expect(fresh.settings.demoScope).toBe('materials');
    expect(fresh.settings.floor.enabled).toBe(false);
    expect(fresh.settings.floor.offerId).toBeNull();
    expect(fresh.settings.services.every((s) => !s.enabled)).toBe(true);
    expect(fresh.settings.walls.every((w) => w.primer === 'exclude')).toBe(
      true,
    );
    expect(
      fresh.offers.every(
        (o) =>
          o.source.kind === 'sample' &&
          o.market.country === 'US' &&
          o.market.currency === 'USD',
      ),
    ).toBe(true);
    const result = calculateRoomEstimate(room, fresh.settings, fresh.offers);
    if (!result.ok) throw new Error(result.code);
    expect(
      result.estimate.lines.some((l) =>
        /underlay|primer|assessment|preparation|trim|delivery/i.test(l.label),
      ),
    ).toBe(false);
    expect(result.estimate.assumptions.join(' ')).toContain('are excluded');
    const invalid = structuredClone(fresh.settings);
    invalid.services[0]!.enabled = true;
    expect(estimateSettingsSchema.safeParse(invalid).success).toBe(false);
  });
  it('prices disposable planning quantities while keeping unknown room facts in a frozen version', () => {
    const room = createRoomFixture('sample');
    room.room.width = { value: null, status: 'unknown', sourceId: null };
    room.room.depth = { value: null, status: 'unknown', sourceId: null };
    const before = JSON.stringify(room),
      draft = createCostDraft(room, 'en-US');
    draft.settings.floor.enabled = true;
    draft.settings.floor.offerId = 'sample-floor-oak';
    const result = calculateRoomEstimate(room, draft.settings, draft.offers);
    if (!result.ok) throw new Error(result.code);
    expect(
      result.estimate.lines.find((l) => l.category === 'floor')?.quantity,
    ).not.toBeNull();
    expect(result.estimate.assumptions.join(' ')).toContain(
      'planning estimates',
    );
    const version = captureVersion(
      room,
      { settings: draft.settings, offers: draft.offers, budgetMinor: null },
      'version',
      'Material plan',
      123,
    );
    expect(version?.room.room.width.value).toBeNull();
    expect(version?.pricing.settings.demoScope).toBe('materials');
    expect(JSON.stringify(room)).toBe(before);
  });
  it('keeps furniture and budget changes reviewable with whole-change Undo', () => {
    const c = new SessionController(createRoomFixture('sample'));
    try {
      c.setDestination('cost', 'en-US');
      const before = c.getSnapshot(),
        draft = before.cost!,
        id = draft.settings.furniture[0]!.id;
      const buy = draft.settings.furniture[0]!.mode === 'reuse';
      const next = furniturePurchase(draft.settings, id, buy)!;
      expect(c.updateCost(next)).toBe(true);
      expect(c.getSnapshot().cost!.settings.furniture[0]!.mode).toBe(
        buy ? 'buy' : 'reuse',
      );
      expect(c.getSnapshot().workspace!.current).toBe(
        before.workspace!.current,
      );
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(draft.settings);
      const changed = changeShoppingLocality(
        c.getSnapshot().cost!,
        shoppingLocality('EG'),
      );
      expect(c.updateCost(changed.settings, changed.offers)).toBe(true);
      c.setDestination('design');
      c.setDestination('cost', 'fr-FR');
      expect(c.getSnapshot().cost!.settings.locality.country).toBe('EG');
    } finally {
      c.dispose();
    }
  });
  it('applies a deliberately shared paint price only to matching walls, atomically and once', () => {
    const room = createRoomFixture('sample');
    room.room.surfaces = {
      ...room.room.surfaces,
      west: {
        color: { value: '#123456', status: 'estimated', sourceId: 'manual' },
        texture: { value: 'smooth', status: 'estimated', sourceId: 'manual' },
      },
    };
    const c = new SessionController(room);
    try {
      c.setDestination('cost', 'en-US');
      const draft = c.getSnapshot().cost!,
        brief = buildSourcingBrief(room, 'surface:north')!;
      const offer = {
        ...draft.offers.find((o) => o.kind === 'paint')!,
        id: 'chosen-paint',
      };
      const candidate: SourcingCandidate = {
        label: 'Paint option',
        match: 'similar',
        url: 'https://example.com/paint',
        evidence: 'Authored test',
        conditions: 'standard',
        differences: [],
        offer,
      };
      const rev = room.roomRevision;
      expect(
        selectOffer(c, brief, candidate, draft.revision, rev, true).ok,
      ).toBe(true);
      const selected = c.getSnapshot().cost!.settings.walls;
      expect(
        selected
          .filter((w) => w.paintOfferId === 'chosen-paint')
          .map((w) => w.wall),
      ).toEqual(['north', 'east', 'south']);
      expect(selected.find((w) => w.wall === 'west')!.paintOfferId).not.toBe(
        'chosen-paint',
      );
      expect(
        selectOffer(c, brief, candidate, draft.revision, rev, true).ok,
      ).toBe(false);
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(draft.settings);
    } finally {
      c.dispose();
    }
  });
});
