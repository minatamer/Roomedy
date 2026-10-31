import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { productChoices } from '../apps/frontend/src/features/cost/source-card.js';
import { ProductCarousel } from '../apps/frontend/src/features/cost/product-carousel.js';

function candidate(
  url: string,
  priced = false,
  photo = false,
): SourcingCandidate {
  return {
    label: url,
    url,
    imageUrl: photo ? 'https://images.example/product.jpg' : null,
    match: 'lead',
    conditions: 'standard',
    evidence: 'Authored fixture',
    differences: [],
    offer: null,
    listing: priced
      ? {
          priceMinor: 12300,
          currency: 'USD',
          country: 'US',
          unit: 'item',
          volumeMl: null,
          observedAt: 123,
        }
      : null,
  };
}
const frontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { createElement } = frontend('react');
const { renderToStaticMarkup } = frontend('react-dom/server');

describe('product comparison carousel', () => {
  it('keeps actual unpriced products and removes generic store/search directories', () => {
    const product = candidate('https://shop.example/product/wardrobe');
    const choices = [
      candidate('https://www.ikea.com/us/en/search/?q=bed'),
      product,
      candidate('https://www.google.com/search?q=wardrobe'),
    ];
    expect(productChoices(choices)).toEqual([product]);
    expect(product.listing).toBeNull();
    expect(product.offer).toBeNull();
    expect(choices).toHaveLength(3);
  });
  it('shows all three real choices, preferring priced photos without mutating source order', () => {
    const unpriced = candidate('https://a.example/product'),
      priced = candidate('https://b.example/product', true),
      pictured = candidate('https://c.example/product', true, true);
    const choices = [unpriced, priced, pictured];
    expect(productChoices(choices)).toEqual([pictured, priced, unpriced]);
    expect(choices).toEqual([unpriced, priced, pictured]);
  });
  it('gives each always-present slide a position and independent labelled navigation', () => {
    const cards = ['one', 'two', 'three'].map((text) =>
      createElement('article', { key: text }, text),
    );
    const html: string = renderToStaticMarkup(
      createElement(
        'main',
        null,
        createElement(ProductCarousel, { label: 'Bed', children: cards }),
        createElement(ProductCarousel, { label: 'Flooring', children: cards }),
      ),
    );
    expect(html.match(/aria-roledescription="slide"/g)).toHaveLength(6);
    expect(html).toContain('aria-label="3 of 3"');
    expect(html).toContain('aria-label="Previous Bed option"');
    expect(html).toContain('aria-label="Next Flooring option"');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(controls.every((id) => ids.includes(id))).toBe(true);
    expect(html).not.toContain('<summary');
  });
  it('shows a single product without redundant navigation controls', () => {
    const html: string = renderToStaticMarkup(
      createElement(ProductCarousel, {
        label: 'Walls',
        children: [createElement('article', { key: 'one' }, 'Only option')],
      }),
    );
    expect(html).toContain('Only option');
    expect(html).toContain('aria-label="1 of 1"');
    expect(html).not.toContain('<button');
  });
});
