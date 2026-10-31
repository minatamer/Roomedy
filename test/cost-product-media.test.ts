import { describe, expect, it } from 'vitest';
import {
  safeProductImage,
  sourcingReplySchema,
} from '@roomedy/contracts/sourcing';
import { readSearchAction } from '../apps/backend/src/providers/web-search.js';
import { VERSIONS } from '@roomedy/contracts/policy';
import { sourcingInputSchema } from '@roomedy/contracts/operations';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { sampleEstimateOffers } from '@roomedy/spatial';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  normalizeSourcing,
  sourcingRequest,
} from '../apps/backend/src/sourcing/sourcing.js';
import { sourceSizeNeedsReview } from '../apps/frontend/src/features/cost/attach-offer.js';
import { sourcingFakeResponse } from '../apps/backend/src/sourcing/fake.js';
import { shoppingLocality } from '../apps/frontend/src/features/cost/journey.js';

function fixture(country = 'DE') {
  const room = createRoomFixture('sample');
  const input = sourcingInputSchema.parse({
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    kind: 'sourcing',
    identity: {
      workspaceId: 'workspace',
      generation: 0,
      operationId: 'operation',
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
    costRevision: 0,
    locality: shoppingLocality(country),
    brief: buildSourcingBrief(room, 'surface:floor')!,
  });
  const url = 'https://merchant.example/product',
    imageUrl = 'https://cdn.example/product.jpg';
  const offer = {
    ...sampleEstimateOffers().find((o) => o.kind === 'floor')!,
    market: { country: 'FR', city: 'Paris', currency: 'USD' as const },
    source: {
      kind: 'sourced' as const,
      label: 'Merchant',
      url,
      observedAt: 123,
      evidence: 'Opened variant',
    },
  };
  const reply = sourcingReplySchema.parse({
    candidates: [
      {
        label: 'Comparable floor',
        match: 'similar',
        url,
        imageUrl,
        evidence: 'Opened variant',
        conditions: 'standard',
        differences: [],
        offer,
      },
    ],
    notes: [],
  });
  return { input, reply, url, imageUrl };
}
describe('bounded product photos and regional source evidence', () => {
  it('retains three independent product choices without promoting an unopened price into an estimate offer', () => {
    const { input, reply, url } = fixture();
    const first = reply.candidates[0]!;
    const candidates = [0, 1, 2].map((index) => {
      const productUrl = `${url}/${index}`;
      return {
        ...structuredClone(first),
        url: productUrl,
        listing: {
          priceMinor: 4200 + index * 100,
          currency: 'USD' as const,
          country: 'FR',
          unit: 'pack' as const,
          volumeMl: null,
          observedAt: 123,
        },
        offer: {
          ...first.offer!,
          source: { ...first.offer!.source, url: productUrl },
        },
      };
    });
    const checked = sourcingReplySchema.parse({ candidates, notes: [] });
    let id = 0;
    const result = normalizeSourcing(
      input,
      checked,
      {
        calls: 3,
        opened: candidates.slice(0, 2).map((c) => c.url),
        sources: candidates.map((c) => c.url),
      },
      false,
      124,
      () => `offer_${++id}`,
    );
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates.map((c) => c.listing?.priceMinor)).toEqual([
      4200, 4300, 4400,
    ]);
    expect(result.candidates.map((c) => !!c.offer)).toEqual([
      true,
      true,
      false,
    ]);
    expect(result.candidates[2]!.imageUrl).toBe(first.imageUrl);
  });
  it('does not promote model-authored FX into either an offer or a display listing', () => {
    const { input, reply, url } = fixture();
    const c = reply.candidates[0]!;
    c.offer!.fx = {
      currency: 'EGP',
      usdPerUnit: '0.02',
      date: '2026-10-30',
      observedAt: 123,
      url: 'https://fx.example/rate',
      inputs: [{ key: 'price', minor: 1000 }],
    };
    c.listing = {
      priceMinor: 200,
      currency: 'USD',
      country: 'FR',
      unit: 'pack',
      volumeMl: null,
      observedAt: 123,
    };
    const a = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [url], sources: [] },
      false,
      124,
      () => 'offer',
    );
    expect(a.candidates[0]!.offer).toBeNull();
    expect(a.candidates[0]!.listing).toBeNull();
  });

  it('uses canonical image results only for their exact product page, independently of quote opening', () => {
    const { input, reply, url, imageUrl } = fixture();
    reply.candidates[0]!.imageUrl = null;
    const evidence = {
      calls: 0,
      opened: [url],
      sources: [] as string[],
      images: [] as { imageUrl: string; sourceUrl: string; caption: string }[],
    };
    expect(
      readSearchAction(
        {
          type: 'web_search_call',
          id: 'images',
          status: 'completed',
          action: { type: 'search', query: 'flooring' },
          results: [
            {
              type: 'image_result',
              image_url: imageUrl,
              source_website_url: url,
              thumbnail_url: 'https://thumbnail.example/image.jpg',
              caption: 'This product',
            },
          ],
        },
        evidence,
      ),
    ).toBe(true);
    expect(
      normalizeSourcing(input, reply, evidence, false, 124, () => 'offer')
        .candidates[0]!.imageUrl,
    ).toBe(imageUrl);
    evidence.opened = [];
    expect(
      normalizeSourcing(input, reply, evidence, false, 124, () => 'offer')
        .candidates[0]!.imageUrl,
    ).toBe(imageUrl);
    evidence.opened = [url];
    evidence.images[0]!.sourceUrl = 'https://merchant.example/other';
    expect(
      normalizeSourcing(input, reply, evidence, false, 124, () => 'offer')
        .candidates[0]!.imageUrl,
    ).toBeNull();
  });
  it('retains a valid USD listing for discovery without authorizing an estimate offer', () => {
    const { input, reply, url } = fixture();
    const c = reply.candidates[0]!;
    c.offer = null;
    c.match = 'lead';
    c.listing = {
      priceMinor: 4299,
      currency: 'USD',
      country: 'FR',
      unit: 'pack',
      volumeMl: null,
      observedAt: 123,
    };
    const a = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [url], sources: [] },
      false,
      124,
      () => 'offer',
    );
    expect(a.candidates[0]!.offer).toBeNull();
    expect(a.candidates[0]!.listing!.priceMinor).toBe(4299);
    expect(
      normalizeSourcing(
        input,
        reply,
        { calls: 1, opened: [], sources: [] },
        false,
        124,
        () => 'offer',
      ).candidates[0]!.listing,
    ).toBeNull();
  });

  it('shows a cited merchant comparison price without authorizing an unopened quote', () => {
    const { input, reply, url, imageUrl } = fixture('US');
    reply.candidates[0]!.listing = {
      priceMinor: 4299,
      currency: 'USD',
      country: 'US',
      unit: 'pack',
      volumeMl: null,
      observedAt: 123,
    };
    const candidate = normalizeSourcing(
      input,
      reply,
      {
        calls: 1,
        opened: [],
        sources: [url],
        images: [{ imageUrl, sourceUrl: url, caption: 'Actual product' }],
      },
      false,
      124,
      () => 'offer',
    ).candidates[0]!;
    expect(candidate.listing?.priceMinor).toBe(4299);
    expect(candidate.imageUrl).toBe(imageUrl);
    expect(candidate.offer).toBeNull();
    expect(
      normalizeSourcing(
        input,
        reply,
        { calls: 1, opened: [], sources: [] },
        false,
        124,
        () => 'offer',
      ).candidates[0]!.listing,
    ).toBeNull();
  });
  it('matches attributed product links for comparison while keeping variant and quote opening checks strict', () => {
    const { input, reply, url, imageUrl } = fixture();
    const c = reply.candidates[0]!;
    c.listing = {
      priceMinor: 4299,
      currency: 'USD',
      country: 'FR',
      unit: 'pack',
      volumeMl: null,
      observedAt: 123,
    };
    const tracked =
      'https://www.merchant.example/product/?MERCH=REC-_-related&utm_source=search';
    const result = normalizeSourcing(
      input,
      reply,
      { calls: 2, opened: [tracked], sources: [tracked] },
      false,
      124,
      () => 'offer',
    ).candidates[0]!;
    expect(result.listing?.priceMinor).toBe(4299);
    expect(result.imageUrl).toBe(imageUrl);
    expect(result.offer).toBeNull();
    expect(
      normalizeSourcing(
        input,
        reply,
        { calls: 2, opened: [], sources: [url + '?variant=other'] },
        false,
        124,
        () => 'offer',
      ).candidates[0]!.listing,
    ).toBeNull();
  });
  it('offers size review only when a product changes a known axis or fills an unknown one', () => {
    const room = createRoomFixture('sample');
    const piece = room.furniture[0]!,
      brief = buildSourcingBrief(room, piece.id)!;
    const offer = sampleEstimateOffers().find(
      (o) => o.kind === 'furniture' && o.category === 'bed',
    );
    if (offer?.kind !== 'furniture' || !brief.size) throw new Error('fixture');
    const size = {
      depth: brief.size.depth!,
      height: brief.size.height!,
      width: brief.size.width!,
    };
    expect(sourceSizeNeedsReview(brief, { ...offer, outerSizeMm: size })).toBe(
      false,
    );
    expect(
      sourceSizeNeedsReview(brief, {
        ...offer,
        outerSizeMm: { ...size, width: size.width + 100 },
      }),
    ).toBe(true);
    expect(
      sourceSizeNeedsReview(
        { ...brief, size: { ...brief.size, width: null } },
        { ...offer, outerSizeMm: size },
      ),
    ).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml,x',
    'http://merchant.example/p.jpg',
    'https://user:password@merchant.example/p.jpg',
    'https://127.0.0.1/p.jpg',
    'https://merchant.local/p.jpg',
    'https://merchant.example:444/p.jpg',
  ])('does not render unsafe image URL %s', (url) => {
    expect(safeProductImage(url)).toBeNull();
    const { reply } = fixture();
    reply.candidates[0]!.imageUrl = url;
    expect(sourcingReplySchema.safeParse(reply).success).toBe(false);
  });
  it('accepts older replies without images and preserves a public optional image', () => {
    const { reply, imageUrl } = fixture();
    expect(safeProductImage(imageUrl)).toBe(imageUrl);
    delete reply.candidates[0]!.imageUrl;
    expect(sourcingReplySchema.safeParse(reply).success).toBe(true);
  });
  it('exposes cited product media while retaining the opened-page requirement for estimate offers', () => {
    const { input, reply, url, imageUrl } = fixture();
    const unopened = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [], sources: [url] },
      false,
      124,
      () => 'price',
    );
    expect(unopened.candidates[0]!.imageUrl).toBe(imageUrl);
    expect(unopened.candidates[0]!.offer).toBeNull();
    const opened = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [url], sources: [url] },
      false,
      124,
      () => 'price',
    );
    expect(opened.candidates[0]!.imageUrl).toBe(imageUrl);
    expect(opened.candidates[0]!.offer!.market).toMatchObject({
      country: 'FR',
      currency: 'USD',
    });
    expect(opened.candidates[0]!.offer!.source.observedAt).toBe(124);
    const actual = opened.candidates[0]!.offer,
      expected = reply.candidates[0]!.offer;
    if (actual?.kind !== 'floor' || expected?.kind !== 'floor')
      throw new Error('missing floor');
    expect(actual.priceMinor).toBe(expected.priceMinor);
  });
  it('keeps cross-region products as unpriced leads and sends only the coarse allowed region', () => {
    const { input, reply, url } = fixture('EG');
    const answer = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [url], sources: [url] },
      false,
      124,
      () => 'price',
    );
    expect(answer.candidates[0]!.offer).toBeNull();
    const request = sourcingRequest(input);
    const content = request.input[0]!.content as { text: string }[];
    const payload = JSON.parse(content[0]!.text);
    expect(payload.shoppingCountries).toContain('AE');
    expect(payload.shoppingCountries).not.toContain('FR');
  });
  it('returns labelled authored USD examples for US and European fake journeys without merchant-price assertions', async () => {
    for (const country of ['US', 'FR']) {
      const room = createRoomFixture('sample');
      const base = fixture().input;
      const input = {
        ...base,
        locality: shoppingLocality(country),
        brief: buildSourcingBrief(room, room.furniture[0]!.id)!,
      };
      const output = await sourcingFakeResponse(
        sourcingRequest(input),
        new AbortController().signal,
      );
      if (output.kind !== 'completed') throw new Error(output.kind);
      const parsed = sourcingReplySchema.parse(output.data);
      expect(parsed.candidates.length).toBeLessThanOrEqual(3);
      expect(parsed.candidates[0]!.offer!.market.currency).toBe('USD');
      expect(parsed.candidates[0]!.offer!.source.kind).toBe('sample');
      expect(parsed.candidates.some((c) => !!c.imageUrl)).toBe(true);
      expect(
        parsed.candidates.some((c) => c.match === 'lead' && c.offer === null),
      ).toBe(true);
    }
  });
});
