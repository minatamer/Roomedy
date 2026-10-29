import { describe, expect, it } from 'vitest';
import {
  safeProductImage,
  sourcingReplySchema,
} from '@roomedy/contracts/sourcing';
import { VERSIONS } from '@roomedy/contracts/policy';
import { sourcingInputSchema } from '@roomedy/contracts/operations';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { createCostDraft } from '../apps/frontend/src/features/cost/state.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  normalizeSourcing,
  sourcingRequest,
} from '../apps/backend/src/sourcing/sourcing.js';
import { sourceSizeNeedsReview } from '../apps/frontend/src/features/cost/attach-offer.js';
import { sourcingFakeResponse } from '../apps/backend/src/sourcing/fake.js';
import { shoppingLocality } from '../apps/frontend/src/features/cost/journey.js';

function fixture(country = 'DE') {
  const room = createRoomFixture('sample'),
    draft = createCostDraft(room, `en-${country}`);
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
    ...draft.offers.find((o) => o.kind === 'floor')!,
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
  it('offers size review only when a product changes a known axis or fills an unknown one', () => {
    const room = createRoomFixture('sample'),
      draft = createCostDraft(room, 'en-US');
    const piece = room.furniture[0]!,
      brief = buildSourcingBrief(room, piece.id)!;
    const offer = draft.offers.find(
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
  it('only exposes live merchant media from an opened non-discovery product page', () => {
    const { input, reply, url, imageUrl } = fixture();
    const unopened = normalizeSourcing(
      input,
      reply,
      { calls: 1, opened: [], sources: [url] },
      false,
      124,
      () => 'price',
    );
    expect(unopened.candidates[0]!.imageUrl).toBeNull();
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
