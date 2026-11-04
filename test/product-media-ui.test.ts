import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import {
  ProductVisual,
  productReference,
} from '../apps/frontend/src/features/cost/product-visual.js';
import { SourceCard } from '../apps/frontend/src/features/cost/source-card.js';
import { ChosenProducts } from '../apps/frontend/src/features/cost/chosen-products.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { createCostDraft } from '../apps/frontend/src/features/cost/state.js';
import { prepareProductChoice } from '../apps/frontend/src/features/cost/attach-offer.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
const frontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { createElement } = frontend('react'),
  { renderToStaticMarkup } = frontend('react-dom/server');
const candidate: SourcingCandidate = {
  label: 'Actual product',
  url: 'https://merchant.example/products/one',
  imageUrl: null,
  match: 'similar',
  conditions: 'unknown',
  evidence: 'Offline source',
  differences: [],
  offer: null,
};
describe('selected product visuals', () => {
  it('renders the actual room finish colour and texture when no product photo exists', () => {
    const room = createRoomFixture('sample'),
      reference = productReference(room, 'surface:floor');
    const html: string = renderToStaticMarkup(
      createElement(ProductVisual, {
        imageUrl: null,
        url: candidate.url,
        label: candidate.label,
        simulation: false,
        reference,
      }),
    );
    expect(reference.color).toMatch(/^#[a-f0-9]{6}$/i);
    expect(html).toContain(`data-texture="${reference.texture}"`);
    expect(html).toContain('Design reference');
    expect(html).toContain(reference.color);
    expect(html).not.toContain('source product photo');
  });
  it('uses the room catalogue reference for furniture and preserves real source images when available', () => {
    const room = createRoomFixture('sample'),
      reference = productReference(room, room.furniture[0]!.id);
    expect(reference.thumbnail).toContain('/catalogue/');
    const fallback: string = renderToStaticMarkup(
      createElement(ProductVisual, {
        url: candidate.url,
        label: candidate.label,
        simulation: false,
        reference,
      }),
    );
    expect(fallback).toContain(reference.thumbnail!);
    const photo: string = renderToStaticMarkup(
      createElement(ProductVisual, {
        imageUrl: 'https://images.merchant.example/real.jpg',
        url: candidate.url,
        label: candidate.label,
        simulation: false,
        reference,
      }),
    );
    expect(photo).toContain('source product photo');
    expect(photo).not.toContain('Design reference');
  });
  it('marks a selected card pressed and inert and leaves another product choosable', () => {
    const props = {
      candidate,
      simulation: false,
      selected: true,
      disabled: false,
      onSelect: () => {},
      onReview: () => {},
    };
    const selected: string = renderToStaticMarkup(
      createElement(SourceCard, props),
    );
    expect(selected).toContain('aria-pressed="true"');
    expect(selected).toContain('disabled=""');
    expect(selected).toContain('Selected');
    expect(selected).not.toContain('Keep this product');
    const other: string = renderToStaticMarkup(
      createElement(SourceCard, { ...props, selected: false }),
    );
    expect(other).toContain('aria-pressed="false"');
    expect(other).toContain('Choose this product');
  });
  it('renders a selected-product visual and retains source/quantity details without changing money', () => {
    const room = createRoomFixture('sample'),
      draft = createCostDraft(room),
      brief = buildSourcingBrief(room, room.furniture[0]!.id)!;
    const prepared = prepareProductChoice(room, draft, brief, candidate, false);
    if (!prepared.ok) throw Error(prepared.reason);
    const pricing = {
      settings: prepared.settings,
      offers: prepared.offers,
      budgetMinor: null,
      productChoices: [prepared.choice],
    };
    const result = calculateRoomEstimate(
      room,
      pricing.settings,
      pricing.offers,
    );
    if (!result.ok) throw Error(result.code);
    const before = JSON.stringify(pricing),
      html: string = renderToStaticMarkup(
        createElement(ChosenProducts, {
          room,
          pricing,
          estimate: result.estimate,
        }),
      );
    expect(html).toContain('Design reference');
    expect(html).toContain('Quantity &amp; source details');
    expect(html).toContain(candidate.label);
    expect(JSON.stringify(pricing)).toBe(before);
  });
});
