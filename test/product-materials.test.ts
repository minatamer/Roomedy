import { describe, expect, it } from 'vitest';
import { productMaterialsFromHtml } from '../apps/backend/src/sourcing/product-materials.js';
const page = new URL('https://merchant.example/product?variant=oak');
function html(product: unknown) {
  return `<script type="application/ld+json">${JSON.stringify(product)}</script>`;
}
function product(extra: Record<string, unknown> = {}) {
  return { '@type': 'Product', url: page.href, ...extra };
}
describe('material specifications on the exact product page', () => {
  it('retires a bounded malformed page with many unclosed script tags without repeated body scans', () => {
    const malformed = '<script type="application/ld+json">'.repeat(12000),
      start = performance.now();
    expect(productMaterialsFromHtml(malformed, page, 'floor', 'US')).toEqual(
      {},
    );
    expect(performance.now() - start).toBeLessThan(1000);
  });
  it('reads decimal-comma values and rejects negative measurements without matching a numeric suffix', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            size: '2,5 L',
            additionalProperty: [
              { name: 'Coverage per litre per coat', value: '8,5 m²' },
            ],
          }),
        ),
        page,
        'paint',
        'GB',
      ),
    ).toEqual({ volumeMl: 2500, coverageMm2PerLitre: 8_500_000 });
    expect(
      productMaterialsFromHtml(
        html(
          product({
            additionalProperty: [{ name: 'Pack area', value: '-2.2 m²' }],
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({});
  });
  it('reads explicit metric pack area and retains no unrelated dimensions', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            additionalProperty: [
              { name: 'Coverage per pack', value: 2.2, unitText: 'm²' },
              { name: 'Room size', value: 20, unitText: 'm²' },
            ],
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({ coverageMm2: 2_200_000 });
  });
  it('converts square feet per box without relabelling the source amount', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            additionalProperty: [
              { name: 'Coverage per box (sq. ft.)', value: 23.91 },
            ],
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({ coverageMm2: Math.round(23.91 * 92903.04) });
  });
  it('reads litre can size and explicit per-litre per-coat paint yield', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            size: '2.5 L',
            additionalProperty: [
              { name: 'Coverage per litre per coat', value: 8, unitText: 'm²' },
            ],
          }),
        ),
        page,
        'paint',
        'GB',
      ),
    ).toEqual({ volumeMl: 2500, coverageMm2PerLitre: 8_000_000 });
  });
  it('reads explicit per-coat slash notation without assuming a missing coat basis', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            size: '5 L',
            additionalProperty: [
              { name: 'Coverage', value: 10, unitText: 'm²/L/coat' },
            ],
          }),
        ),
        page,
        'paint',
        'US',
      ),
    ).toEqual({ volumeMl: 5000, coverageMm2PerLitre: 10_000_000 });
  });
  it('converts US gallons and square-feet-per-gallon-per-coat precisely', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            size: '1 gallon',
            additionalProperty: [
              {
                name: 'Coverage per gallon per coat',
                value: 400,
                unitText: 'sq. ft.',
              },
            ],
          }),
        ),
        page,
        'paint',
        'US',
      ),
    ).toEqual({
      volumeMl: 3785,
      coverageMm2PerLitre: Math.floor((400 * 92903.04) / 3.785411784),
    });
  });
  it('never assumes a non-US gallon is a US gallon', () => {
    expect(
      productMaterialsFromHtml(
        html(product({ size: '1 gallon' })),
        page,
        'paint',
        'GB',
      ),
    ).toEqual({});
  });
  it('does not borrow another variant or ambiguous recommendation products', () => {
    const properties = {
      size: '5 L',
      additionalProperty: [{ name: 'Pack area', value: '2 m²' }],
    };
    expect(
      productMaterialsFromHtml(
        html(
          product({
            ...properties,
            url: 'https://merchant.example/product?variant=walnut',
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({});
    expect(
      productMaterialsFromHtml(
        html([
          { '@type': 'Product', ...properties },
          { '@type': 'Product', ...properties },
        ]),
        page,
        'paint',
        'US',
      ),
    ).toEqual({});
  });
  it('matches the selected Product in a variant graph', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            url: 'https://merchant.example/product',
            hasVariant: [
              product({
                additionalProperty: [{ name: 'Pack area', value: '1.9 m²' }],
              }),
              product({ url: 'https://merchant.example/other', size: '20 L' }),
            ],
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({ coverageMm2: 1_900_000 });
  });
  it('ignores known attribution differences while retaining the selected variant query', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            additionalProperty: [{ name: 'Pack area', value: '2.2 m²' }],
          }),
        ),
        new URL(page.href + '&utm_source=roomedy'),
        'floor',
        'US',
      ),
    ).toEqual({ coverageMm2: 2_200_000 });
  });
  it('rejects conflicting areas, ranges and multi-coat coverage claims', () => {
    expect(
      productMaterialsFromHtml(
        html(
          product({
            additionalProperty: [
              { name: 'Pack area', value: '2 m²' },
              { name: 'Coverage per box', value: '3 m²' },
            ],
          }),
        ),
        page,
        'floor',
        'US',
      ),
    ).toEqual({});
    for (const value of ['350-400 sq ft', 'up to 400 sq ft'])
      expect(
        productMaterialsFromHtml(
          html(
            product({
              additionalProperty: [
                { name: 'Coverage per gallon per coat', value },
              ],
            }),
          ),
          page,
          'paint',
          'US',
        ),
      ).toEqual({});
    expect(
      productMaterialsFromHtml(
        html(
          product({
            size: '5 L',
            description: 'Coverage for two coats is 40 m² per can.',
          }),
        ),
        page,
        'paint',
        'US',
      ),
    ).toEqual({ volumeMl: 5000 });
  });
  it('reads explicit product descriptions but ignores arbitrary surrounding page text', () => {
    expect(
      productMaterialsFromHtml(
        'Recommended pack covers 99 m²' +
          html(product({ description: 'This pack covers 2.2 m².' })),
        page,
        'floor',
        'US',
      ),
    ).toEqual({ coverageMm2: 2_200_000 });
    expect(
      productMaterialsFromHtml(
        'Pack covers 99 m²' + html(product({})),
        page,
        'floor',
        'US',
      ),
    ).toEqual({});
  });
  it('bounds malformed/oversized/irrelevant metadata without executing scripts', () => {
    for (const source of [
      '<script type="application/ld+json">bad</script>',
      `<scripture type="application/ld+json">${JSON.stringify(product({ additionalProperty: [{ name: 'Pack area', value: '9 m²' }] }))}</scripture>`,
      `<script data-type="application/ld+json">${JSON.stringify(product({ additionalProperty: [{ name: 'Pack area', value: '9 m²' }] }))}</script>`,
      'x'.repeat(512 * 1024 + 1),
    ])
      expect(productMaterialsFromHtml(source, page, 'floor', 'US')).toEqual({});
    expect(
      productMaterialsFromHtml(
        html(product({ size: '5 L' })),
        page,
        'furniture',
        'US',
      ),
    ).toEqual({});
  });
});
