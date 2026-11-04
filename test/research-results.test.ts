import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
import { VERSIONS } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
import { costConversation } from '../apps/frontend/src/features/cost/conversation.js';
import type { MarketEntry } from '../apps/frontend/src/features/cost/conversation.js';
import { Research } from '../apps/frontend/src/features/cost/research.js';
import {
  chooseGuidedProduct,
  chooseRemainingProducts,
} from '../apps/frontend/src/features/cost/selection-guide.js';

const frontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { createElement } = frontend('react');
const { renderToStaticMarkup } = frontend('react-dom/server');
const sessions: SessionController[] = [];
afterEach(() =>
  sessions.splice(0).forEach((controller) => controller.dispose()),
);

function setup(simulation = true) {
  const controller = new SessionController(createManualRoom('partial'));
  sessions.push(controller);
  controller.setDestination('cost', 'en-US');
  const state = controller.getSnapshot();
  const entries: MarketEntry[] = marketTargets(state.workspace!.current).map(
    (target, index) => ({
      target,
      roomRevision: state.workspace!.current.roomRevision,
      costRevision: state.cost!.revision,
      generation: state.generation,
      workspaceId: state.workspace!.workspaceId,
      update: {
        kind: 'answer',
        answer: {
          ok: true,
          simulation,
          input: {
            kind: 'sourcing',
            schemaVersion: VERSIONS.schema,
            catalogueVersion: VERSIONS.catalogue,
            rulesVersion: VERSIONS.rules,
            identity: {
              workspaceId: state.workspace!.workspaceId,
              generation: state.generation,
              operationId: 'fixture',
              roomId: state.workspace!.current.roomId,
              inputRevision: state.workspace!.current.roomRevision,
            },
            costRevision: state.cost!.revision,
            locality: state.cost!.settings.locality,
            brief: target.brief,
          },
          reply: {
            notes: [],
            candidates: [
              {
                label: `Product ${index}`,
                url: `https://merchant.example/products/${index}`,
                imageUrl: null,
                evidence: 'Offline fixture',
                conditions: 'standard',
                match: 'similar',
                differences: [],
                offer: null,
                listing: {
                  currency: 'USD',
                  country: 'US',
                  priceMinor: 10000,
                  unit:
                    target.brief.kind === 'floor'
                      ? 'pack'
                      : target.brief.kind === 'paint'
                        ? 'can'
                        : 'item',
                  volumeMl: target.brief.kind === 'paint' ? 2500 : null,
                  observedAt: 123,
                },
              },
            ],
          },
        },
      },
    }),
  );
  costConversation(controller).set('entries', entries);
  return { controller, entries, store: costConversation(controller) };
}
function render(controller: SessionController): string {
  return renderToStaticMarkup(
    createElement(Research, {
      controller,
      state: controller.getSnapshot(),
      onInspect: () => {},
      onDesign: () => {},
    }),
  );
}
function expectAll(html: string, entries: MarketEntry[]) {
  for (const entry of entries)
    expect(html).toContain(`aria-label="${entry.target.label} options"`);
  expect(html).not.toContain('Start choosing');
  expect(html).not.toContain('Find the next');
  expect(html).not.toContain('one item in view');
}
describe('all researched products remain directly available', () => {
  it.each([true, false])(
    'shows all returned categories immediately without a guide action: simulation=%s',
    (simulation) => {
      const { controller, entries } = setup(simulation);
      const before = controller.getSnapshot().cost;
      const html = render(controller);
      expectAll(html, entries);
      expect(html).toContain('Flooring market options');
      expect(html).toContain('Wall paint market options');
      expect(controller.getSnapshot().cost).toBe(before);
    },
  );
  it('keeps every card visible after selecting one product and after completing all choices', () => {
    const { controller, entries, store } = setup();
    const first = entries[0]!;
    if (first.update.kind !== 'answer' || !first.update.answer.ok)
      throw Error('Fixture');
    const selected = chooseGuidedProduct(
      controller,
      entries,
      first,
      first.update.answer.reply.candidates[0]!,
      { stage: 'ready', key: null },
    );
    expect(selected.ok).toBe(true);
    if (!selected.ok) throw Error(selected.reason);
    let fresh = entries.map((entry) => ({
      ...entry,
      costRevision: selected.revision,
    }));
    store.set('entries', fresh);
    store.set('guide', selected.guide);
    expectAll(render(controller), fresh);
    expect(chooseRemainingProducts(controller, fresh).ok).toBe(true);
    fresh = fresh.map((entry) => ({
      ...entry,
      costRevision: controller.getSnapshot().cost!.revision,
    }));
    store.set('entries', fresh);
    store.set('guide', {
      stage: 'done',
      key: null,
      reviewedKeys: fresh.map((entry) => entry.target.key),
    });
    expectAll(render(controller), fresh);
  });
  it('shows successful siblings alongside an unsuccessful item instead of hiding the results', () => {
    const { controller, entries, store } = setup();
    const mixed: MarketEntry[] = entries.map((entry, index) =>
      index === 1
        ? {
            ...entry,
            update: {
              kind: 'answer',
              answer: {
                ok: false,
                retired: false,
                message: 'No suitable match for this item.',
              },
            },
          }
        : entry,
    );
    store.set('entries', mixed);
    const html = render(controller);
    expect(html).toContain('No suitable match for this item.');
    expectAll(
      html,
      mixed.filter((_, index) => index !== 1),
    );
    expect(html).toContain('Try this item again');
  });
});
