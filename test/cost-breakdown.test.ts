import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import {
  calculateRoomEstimate,
  sampleEstimateOffers,
  defaultEstimateSettings,
} from '@roomedy/spatial';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  costSectionRequest,
  simpleEstimateInputs,
} from '../apps/frontend/src/features/cost/journey.js';
import { money } from '../apps/frontend/src/features/cost/state.js';
import { EstimateReview } from '../apps/frontend/src/features/cost/estimate-review.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';

const sessions: SessionController[] = [];
function session(source: 'manual' | 'sourced' | 'sample' | false = 'manual') {
  const controller = new SessionController(createRoomFixture('sample'));
  sessions.push(controller);
  controller.setDestination('cost', 'en-US');
  if (source) {
    const draft = controller.getSnapshot().cost!;
    const paint = sampleEstimateOffers().find(
      (offer) => offer.kind === 'paint',
    )!;
    paint.market = { ...draft.settings.locality };
    if (paint.kind === 'paint')
      paint.colour = buildSourcingBrief(
        controller.getSnapshot().workspace!.current,
        'surface:north',
      )!.colour!;
    paint.source = {
      ...paint.source,
      kind: source,
      url: source === 'manual' ? null : 'https://example.com/paint',
      observedAt: source === 'sourced' ? 123 : null,
    };
    const settings = structuredClone(draft.settings);
    settings.walls.forEach((wall) => {
      wall.paintOfferId = paint.id;
    });
    expect(controller.updateCost(settings, [paint])).toBe(true);
  }
  return controller;
}
afterEach(() => {
  sessions.forEach((controller) => controller.dispose());
  sessions.length = 0;
});

describe('app-owned conversational cost breakdown', () => {
  it('routes the actual shortcut phrase and typed variants without swallowing specific cost questions', () => {
    for (const text of [
      'Show my cost breakdown.',
      'cost breakdown',
      'Show me my full cost breakdown!',
      'full breakdown',
      'Open the estimate',
      'all costs',
    ])
      expect(costSectionRequest(text)).toBe('review');
    for (const text of [
      'Why did my floor cost more?',
      'Explain this bed cost',
      'Find a cheaper floor',
    ])
      expect(costSectionRequest(text)).toBeNull();
  });
  it.each(['manual', 'sourced', 'sample'] as const)(
    'posts actual %s pricing inside a bounded reply without changing project authority',
    (flow) => {
      const controller = session(flow);
      const before = controller.getSnapshot();
      const result = calculateRoomEstimate(
        before.workspace!.current,
        before.cost!.settings,
        before.cost!.offers,
      );
      if (!result.ok) throw new Error(result.code);
      expect(controller.costMessage('visitor', 'Show my cost breakdown.')).toBe(
        true,
      );
      expect(controller.costBreakdown()).toBe(true);
      const after = controller.getSnapshot();
      expect(after.cost!.messages).toMatchObject([
        { role: 'visitor', text: 'Show my cost breakdown.' },
        {
          role: 'assistant',
          kind: 'breakdown',
          roomRevision: before.cost!.roomRevision,
          costRevision: before.cost!.revision,
        },
      ]);
      expect(after.cost!.messages[0]!.kind).toBeUndefined();
      expect(after.cost!.messages[1]!.text).toContain(
        money(result.estimate.knownTotalMinor, 'USD'),
      );
      if (!result.estimate.complete)
        expect(after.cost!.messages[1]!.text).toContain('known subtotal');
      expect(after.workspace).toBe(before.workspace);
      expect(after.cost!.settings).toBe(before.cost!.settings);
      expect(after.cost!.offers).toBe(before.cost!.offers);
      expect(after.cost!.revision).toBe(before.cost!.revision);
      expect(after.estimateVersions).toBe(before.estimateVersions);
      expect(after.pending).toBe(before.pending);
    },
  );

  it.each(['fresh', 'unselected', 'seeded'] as const)(
    'guides an unpriced %s draft without adding prices, history or saved versions',
    (flow) => {
      const controller = session(false);
      const room = controller.getSnapshot().workspace!.current;
      const inputs =
        flow === 'seeded'
          ? {
              settings: defaultEstimateSettings(room),
              offers: sampleEstimateOffers(),
            }
          : simpleEstimateInputs(room);
      if (flow === 'unselected')
        inputs.offers = sampleEstimateOffers().map((offer) => ({
          ...offer,
          market: inputs.settings.locality,
          source: { ...offer.source, url: 'https://example.com/researched' },
        }));
      expect(controller.updateCost(inputs.settings, inputs.offers)).toBe(true);
      const before = controller.getSnapshot();
      expect(controller.costMessage('visitor', 'Show my cost breakdown.')).toBe(
        true,
      );
      expect(controller.costBreakdown()).toBe(true);
      const after = controller.getSnapshot();
      expect(after.cost!.messages.at(-1)).toMatchObject({
        kind: 'find-options',
        role: 'assistant',
        roomRevision: before.cost!.roomRevision,
        costRevision: before.cost!.revision,
      });
      expect(after.cost!.messages.at(-1)!.text).toContain('find options');
      expect(after.cost!.messages.at(-1)!.text).not.toMatch(/\$|USD|subtotal/);
      expect(after.cost!.settings).toBe(before.cost!.settings);
      expect(after.cost!.offers).toBe(before.cost!.offers);
      expect(after.cost!.revision).toBe(before.cost!.revision);
      expect(after.workspace).toBe(before.workspace);
      expect(after.estimateVersions).toBe(before.estimateVersions);
      expect(after.pending).toBe(before.pending);
    },
  );

  it('does not count zero-cost reuse as a chosen price and switches to an honest subtotal only after a choice', () => {
    const controller = session(false);
    expect(controller.costBreakdown()).toBe(true);
    expect(controller.getSnapshot().cost!.messages.at(-1)!.kind).toBe(
      'find-options',
    );
    const draft = controller.getSnapshot().cost!,
      settings = structuredClone(draft.settings);
    const paint = sampleEstimateOffers().find(
      (offer) => offer.kind === 'paint',
    )!;
    paint.market = { ...settings.locality };
    paint.source = { ...paint.source, kind: 'manual' };
    settings.walls[0]!.paintOfferId = paint.id;
    expect(controller.updateCost(settings, [paint])).toBe(true);
    expect(controller.costBreakdown()).toBe(true);
    expect(controller.getSnapshot().cost!.messages.at(-1)).toMatchObject({
      kind: 'breakdown',
    });
    expect(controller.getSnapshot().cost!.messages.at(-1)!.text).toContain(
      'known subtotal',
    );
    expect(controller.getSnapshot().cost!.messages.at(-1)!.text).toContain(
      'still need',
    );
    expect(controller.undo().ok).toBe(true);
    expect(controller.costBreakdown()).toBe(true);
    expect(controller.getSnapshot().cost!.messages.at(-1)!.kind).toBe(
      'find-options',
    );
  });

  it('keeps repeated requests as separate ordered messages and retains them across phases', () => {
    const controller = session();
    for (let i = 0; i < 2; i++) {
      controller.costMessage('visitor', 'Show my cost breakdown.');
      controller.costBreakdown();
    }
    controller.costMessage('visitor', 'What about the floor?');
    controller.costMessage('assistant', 'Let’s look at the floor.');
    const messages = controller.getSnapshot().cost!.messages;
    expect(messages).toHaveLength(6);
    expect(
      messages.filter((message) => message.kind === 'breakdown'),
    ).toHaveLength(2);
    expect(new Set(messages.map((message) => message.id)).size).toBe(6);
    controller.setDestination('design');
    expect(controller.costBreakdown()).toBe(false);
    controller.setDestination('cost');
    expect(controller.getSnapshot().cost!.messages).toBe(messages);
  });

  it('keeps the old total and revision identity honest after pricing and room edits', () => {
    const controller = session();
    controller.costBreakdown();
    const before = controller.getSnapshot();
    const historical = structuredClone(before.cost!.messages[0]);
    const settings = structuredClone(before.cost!.settings);
    settings.floor.wasteBps = 2000;
    expect(controller.updateCost(settings)).toBe(true);
    expect(controller.getSnapshot().cost!.messages[0]).toEqual(historical);
    expect(controller.getSnapshot().cost!.revision).not.toBe(
      historical!.costRevision,
    );
    const piece = controller.getSnapshot().workspace!.current.furniture[0]!;
    expect(
      controller.dispatch(
        [{ type: 'finish', id: piece.id, finish: 'sage' }],
        'Sage',
      ).ok,
    ).toBe(true);
    expect(controller.getSnapshot().workspace!.current.roomRevision).not.toBe(
      historical!.roomRevision,
    );
    expect(controller.getSnapshot().cost!.messages[0]).toEqual(historical);
    expect(controller.costBreakdown()).toBe(true);
    expect(controller.getSnapshot().cost!.messages.at(-1)).toMatchObject({
      roomRevision: controller.getSnapshot().workspace!.current.roomRevision,
      costRevision: controller.getSnapshot().cost!.revision,
    });
    expect(controller.getSnapshot().estimateVersions).toHaveLength(0);
  });

  it('cannot manufacture a breakdown from arbitrary prose or bypass a preview', () => {
    const controller = session();
    controller.costMessage('assistant', 'Here is a cost breakdown.');
    expect(controller.getSnapshot().cost!.messages[0]!.kind).toBeUndefined();
    const piece = controller.getSnapshot().workspace!.current.furniture[0]!;
    expect(
      controller.prepareVisitorPreview(
        [{ type: 'finish', id: piece.id, finish: 'sage' }],
        'Sage',
      ).ok,
    ).toBe(true);
    const before = controller.getSnapshot();
    expect(controller.costBreakdown()).toBe(false);
    expect(controller.getSnapshot()).toBe(before);
    controller.cancelPreview();
    expect(controller.costBreakdown()).toBe(true);
  });

  it('retains the existing message ceiling and rejects replies after expiry/reset/disposal', () => {
    const controller = session();
    for (let i = 0; i < 50; i++) expect(controller.costBreakdown()).toBe(true);
    expect(controller.getSnapshot().cost!.messages).toHaveLength(40);
    controller.reset(createRoomFixture('empty'));
    expect(controller.costBreakdown()).toBe(false);
    controller.dispose();
    expect(controller.costBreakdown()).toBe(false);
    let now = 0;
    const expiring = new SessionController(createRoomFixture('sample'), {
      now: () => now,
    });
    sessions.push(expiring);
    expiring.setDestination('cost');
    now = expiring.getSnapshot().expiresAt;
    expect(expiring.costBreakdown()).toBe(false);
    expect(expiring.getSnapshot().cost).toBeNull();
  });

  it('gives repeated inline reports distinct working category anchors', () => {
    const controller = session(),
      state = controller.getSnapshot();
    const result = calculateRoomEstimate(
      state.workspace!.current,
      state.cost!.settings,
      state.cost!.offers,
    );
    if (!result.ok) throw new Error(result.code);
    const frontend = createRequire(
      new URL('../apps/frontend/package.json', import.meta.url),
    );
    const { createElement } = frontend('react');
    const { renderToStaticMarkup } = frontend('react-dom/server');
    const props = {
      estimate: result.estimate,
      room: state.workspace!.current,
      offers: state.cost!.offers,
      materialsOnly: false,
      download: null,
    };
    const html: string = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement(EstimateReview, props),
        createElement(EstimateReview, props),
      ),
    );
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(anchors.length).toBeGreaterThan(2);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors.every((anchor) => ids.includes(anchor))).toBe(true);
  });
});
