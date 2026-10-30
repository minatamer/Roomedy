import { withRoomSurface } from '@roomedy/contracts/surfaces';
import { shoppingCountries } from '@roomedy/contracts/estimates';
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { PUBLIC_LIMITS, POLICY, VERSIONS } from '@roomedy/contracts/policy';
import {
  sourcingInputSchema,
  operationResultSchema,
} from '@roomedy/contracts/operations';
import {
  sourcingReplySchema,
  sourcingBriefSchema,
} from '@roomedy/contracts/sourcing';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  attachOffer,
  selectOffer,
} from '../apps/frontend/src/features/cost/attach-offer.js';
import {
  beginResearch,
  researchProducts,
} from '../apps/frontend/src/features/cost/client.js';
import { createCostDraft } from '../apps/frontend/src/features/cost/state.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import { createRoomedyFakeProvider } from '../apps/backend/src/providers/fake.js';
import {
  createSourcingHandler,
  normalizeSourcing,
  sourcingRequest,
} from '../apps/backend/src/sourcing/sourcing.js';
import { sourcingFakeResponse } from '../apps/backend/src/sourcing/fake.js';
import {
  decodeResponse,
  responseBody,
  createResponsesProvider,
} from '../apps/backend/src/providers/responses.js';
import { readSearchAction } from '../apps/backend/src/providers/web-search.js';
import { bridgePost } from '../apps/frontend/src/server/bridge-post.js';
let next = 0;
const id = () => `sourcing_${++next}`;
const controllers: SessionController[] = [];
afterEach(() => {
  controllers.forEach((c) => c.dispose());
  controllers.length = 0;
  vi.useRealTimers();
});
function input(key = 'surface:floor') {
  const room = createRoomFixture('sample');
  return sourcingInputSchema.parse({
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    kind: 'sourcing',
    identity: {
      workspaceId: 'workspace',
      generation: 0,
      operationId: id(),
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
    costRevision: 0,
    locality: { country: 'EG', city: 'Cairo', currency: 'USD' },
    brief: buildSourcingBrief(room, key)!,
  });
}
async function fakeReply(i = input()) {
  const r = await sourcingFakeResponse(
    sourcingRequest(i),
    new AbortController().signal,
  );
  expect(r.kind).toBe('completed');
  if (r.kind !== 'completed') throw new Error('fixture');
  return sourcingReplySchema.parse(r.data);
}
function runtime() {
  return createRuntime(
    parseRuntimeConfig({
      FAKE_MODE: 'true',
      PAID_DEMO_ENABLED: 'false',
      ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge',
    }),
    {
      now: Date.now,
      nextId: id,
      log: vi.fn(),
      provider: createRoomedyFakeProvider(),
      handlers: { sourcing: createSourcingHandler(true, Date.now, id) },
    },
  );
}
const config = () => ({
  mode: 'fake',
  capabilities: {
    manual: true,
    recognition: true,
    assistant: true,
    sourcing: true,
    simulation: true,
  },
  limits: PUBLIC_LIMITS,
});
describe('strict admitted source contracts and evidence', () => {
  it('bounds search output independently while accepting interleaved reasoning across multiple stores', () => {
    const output = Array.from(
      { length: POLICY.sourcingSearchCalls },
      (_, i) => [
        {
          type: 'reasoning',
          id: `r${i}a`,
          encrypted_content: 'synthetic',
          summary: [],
        },
        {
          type: 'web_search_call',
          id: `w${i}`,
          status: 'completed',
          action: { type: 'search', query: 'product' },
        },
        {
          type: 'reasoning',
          id: `r${i}b`,
          encrypted_content: 'synthetic',
          summary: [],
        },
      ],
    ).flat();
    const raw = {
      status: 'completed',
      output: [
        ...output,
        {
          type: 'message',
          content: [
            { type: 'output_text', text: '{"candidates":[],"notes":[]}' },
          ],
        },
      ],
    };
    expect(decodeResponse(raw, [], undefined, true).kind).toBe('completed');
    expect(
      decodeResponse(
        {
          ...raw,
          output: [
            ...raw.output,
            ...Array.from({ length: 70 }, () => raw.output[0]),
          ],
        },
        [],
        undefined,
        true,
      ).kind,
    ).toBe('malformed');
  });

  it('preserves successful search evidence after failed/incomplete store tool outcomes', () => {
    const url = 'https://merchant.example/exact';
    const result = decodeResponse(
      {
        status: 'completed',
        output: [
          {
            type: 'web_search_call',
            id: 'blocked',
            status: 'failed',
            action: { type: 'open_page', url: 'https://blocked.example/item' },
          },
          { type: 'web_search_call', id: 'partial', status: 'incomplete' },
          {
            type: 'web_search_call',
            id: 'images',
            status: 'completed',
            results: [
              { url: 'https://merchant.example/text-only-result' },
              {
                type: 'image_result',
                image_url: 'https://cdn.example/product.jpg',
                source_website_url: url,
              },
            ],
          },
          {
            type: 'web_search_call',
            id: 'opened',
            status: 'completed',
            action: { type: 'open_page', url },
          },
          {
            type: 'message',
            content: [
              { type: 'output_text', text: '{"candidates":[],"notes":[]}' },
            ],
          },
        ],
      },
      [],
      undefined,
      true,
    );
    expect(result.kind).toBe('completed');
    if (result.kind !== 'completed') throw new Error('decode');
    expect(result.search!.opened).toEqual([url]);
    expect(result.search!.calls).toBe(4);
    expect(result.search!.images).toHaveLength(1);
  });

  it('keeps a real opened-page listing price when incomplete pack specification prevents estimate selection', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    reply.candidates = [candidate];
    candidate.url = 'https://merchant.example/product';
    candidate.offer!.source.url = candidate.url;
    if (candidate.offer!.kind !== 'floor') throw new Error('floor fixture');
    candidate.offer!.coverageMm2 = 0;
    const result = await createSourcingHandler(
      false,
      () => 123,
      id,
    )(i, {
      signal: new AbortController().signal,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: reply,
        search: { calls: 2, opened: [candidate.url], sources: [] },
      }),
    });
    expect(result.kind).toBe('completed');
    expect(result.sourcing!.candidates[0]).toMatchObject({
      offer: null,
      listing: {
        currency: 'USD',
        priceMinor: candidate.offer!.priceMinor,
        unit: 'pack',
        observedAt: 123,
      },
    });
    expect(operationResultSchema.safeParse(result).success).toBe(true);
  });
  it.each(['exact', 'mapped', 'other-product', 'unavailable'] as const)(
    'enriches missing photos once without changing comparison prices: %s',
    async (mode) => {
      const i = input(),
        reply = await fakeReply(i),
        candidate = reply.candidates[0]!;
      const url = 'https://merchant.example/product',
        image = 'https://cdn.example/product.jpg';
      reply.candidates = [
        {
          ...candidate,
          url,
          imageUrl: null,
          offer: null,
          listing: {
            priceMinor: 4299,
            currency: 'USD',
            country: 'AE',
            unit: 'pack',
            volumeMl: null,
            observedAt: null,
          },
        },
      ];
      let calls = 0;
      const result = await createSourcingHandler(
        false,
        () => 123,
        id,
      )(i, {
        signal: new AbortController().signal,
        remainingMs: 60_000,
        call: async (request) => {
          if (++calls === 1)
            return {
              kind: 'completed',
              data: reply,
              calls: [],
              search: { calls: 2, opened: [], sources: [url] },
            };
          const body = JSON.parse(responseBody(request, 'synthetic-model'));
          expect(body.tools[0].search_content_types).toEqual(['image']);
          expect(body.max_tool_calls).toBe(4);
          expect(request.format.name).toBe('room_product_images_1');
          if (mode === 'unavailable') return { kind: 'unavailable' };
          return {
            kind: 'completed',
            calls: [],
            data: {
              images:
                mode === 'mapped' || mode === 'other-product'
                  ? [{ url, imageUrl: image }]
                  : [],
            },
            search: {
              calls: 1,
              opened: [],
              sources: [],
              images:
                mode === 'mapped'
                  ? []
                  : [
                      {
                        sourceUrl:
                          mode === 'exact'
                            ? url
                            : 'https://merchant.example/other',
                        imageUrl: image,
                        caption: 'Product photo',
                      },
                    ],
            },
          };
        },
      });
      expect(calls).toBe(2);
      expect(result.kind).toBe('completed');
      expect(result.sourcing!.candidates[0]!.listing?.priceMinor).toBe(4299);
      expect(result.sourcing!.candidates[0]!.offer).toBeNull();
      expect(result.sourcing!.candidates[0]!.imageUrl).toBe(
        mode === 'exact' || mode === 'mapped' ? image : null,
      );
    },
  );
  it('skips optional media when the owning operation has too little time left', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    const url = 'https://merchant.example/product';
    reply.candidates = [
      {
        ...candidate,
        url,
        imageUrl: null,
        offer: null,
        listing: {
          priceMinor: 4299,
          currency: 'USD',
          country: 'AE',
          unit: 'pack',
          volumeMl: null,
          observedAt: null,
        },
      },
    ];
    const call = vi.fn(async () => ({
      kind: 'completed' as const,
      calls: [],
      data: reply,
      search: { calls: 1, opened: [], sources: [url] },
    }));
    const result = await createSourcingHandler(
      false,
      () => 123,
      id,
    )(i, { signal: new AbortController().signal, remainingMs: 20_000, call });
    expect(result.kind).toBe('completed');
    expect(call).toHaveBeenCalledOnce();
  });
  it('keeps an independent valid listing when a separate quote cites another page', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    candidate.url = 'https://merchant.example/product';
    candidate.offer!.source.url = 'https://merchant.example/other';
    candidate.listing = {
      priceMinor: 4299,
      currency: 'USD',
      country: 'AE',
      unit: 'pack',
      volumeMl: null,
      observedAt: null,
    };
    reply.candidates = [candidate];
    const result = await createSourcingHandler(
      false,
      () => 123,
      id,
    )(i, {
      signal: new AbortController().signal,
      remainingMs: 20_000,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: reply,
        search: { calls: 2, opened: [candidate.url], sources: [] },
      }),
    });
    expect(result.kind).toBe('completed');
    expect(result.sourcing!.candidates[0]!.listing?.priceMinor).toBe(4299);
    expect(result.sourcing!.candidates[0]!.offer).toBeNull();
  });
  it('replaces a model page URL with actual product metadata without changing prices or extra paid rounds', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    candidate.url = 'https://merchant.example/product';
    candidate.imageUrl = candidate.url;
    candidate.offer!.source.url = candidate.url;
    reply.candidates = [candidate];
    const image = vi.fn<(url: string, signal: AbortSignal) => Promise<string>>(
      async () => 'https://cdn.example/actual-product.jpg',
    );
    if (candidate.offer!.kind !== 'floor') throw new Error('floor fixture');
    const call = vi.fn(async () => ({
      kind: 'completed' as const,
      calls: [],
      data: reply,
      search: { calls: 2, opened: [candidate.url], sources: [] },
    }));
    const result = await createSourcingHandler(
      false,
      () => 123,
      id,
      undefined,
      undefined,
      undefined,
      image,
    )(i, { signal: new AbortController().signal, remainingMs: 60_000, call });
    expect(result.kind).toBe('completed');
    expect(call).toHaveBeenCalledOnce();
    expect(image.mock.calls[0]?.[0]).toBe(candidate.url);
    expect(result.sourcing!.candidates[0]!.imageUrl).toBe(
      'https://cdn.example/actual-product.jpg',
    );
    expect(result.sourcing!.candidates[0]!.listing?.priceMinor).toBe(
      candidate.offer!.priceMinor,
    );
  });
  it('assigns application-owned quote IDs before strict validation without repairing money', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    reply.candidates = [candidate];
    candidate.offer!.id = 'invalid model identifier';
    candidate.offer!.supplierId = 'invalid supplier identifier';
    candidate.offer!.deliveryGroup = 'invalid delivery identifier';
    const result = await createSourcingHandler(
      true,
      () => 123,
      id,
    )(i, {
      signal: new AbortController().signal,
      call: async () => ({ kind: 'completed', calls: [], data: reply }),
    });
    expect(result.kind).toBe('completed');
    expect(result.sourcing!.candidates[0]!.offer).not.toBeNull();
    expect(result.sourcing!.candidates[0]!.offer!.id).toMatch(/^sourcing_/);
  });

  it('preserves schema-valid product links and valid siblings when one offer has invalid money', async () => {
    const i = input(),
      reply = await fakeReply(i),
      good = structuredClone(reply.candidates[0]!);
    good.url = 'https://merchant.example/good';
    good.offer!.source.url = good.url;
    const bad = structuredClone(good);
    bad.url = 'https://merchant.example/unpriced';
    bad.offer!.source.url = bad.url;
    if ('priceMinor' in bad.offer!) bad.offer!.priceMinor = -1;
    else throw new Error('expected floor fixture');
    const invalid = vi.fn();
    const result = await createSourcingHandler(
      false,
      () => 123,
      id,
      undefined,
      invalid,
    )(i, {
      signal: new AbortController().signal,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: { ...reply, candidates: [bad, good] },
        search: { calls: 2, opened: [bad.url, good.url], sources: [] },
      }),
    });
    expect(result.kind).toBe('completed');
    expect(result.sourcing!.candidates).toHaveLength(2);
    expect(result.sourcing!.candidates[0]).toMatchObject({
      url: bad.url,
      offer: null,
      match: 'lead',
    });
    expect(result.sourcing!.candidates[1]!.offer).not.toBeNull();
    expect(invalid).toHaveBeenCalledOnce();
    expect(operationResultSchema.safeParse(result).success).toBe(true);
  });
  it('never preserves an unsafe URL when recovering a valid sibling', async () => {
    const i = input(),
      reply = await fakeReply(i),
      good = reply.candidates[0]!;
    const result = await createSourcingHandler(
      true,
      () => 123,
      id,
    )(i, {
      signal: new AbortController().signal,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: {
          ...reply,
          candidates: [{ ...good, url: 'javascript:bad' }, good],
        },
      }),
    });
    expect(result.kind).toBe('completed');
    expect(result.sourcing!.candidates).toHaveLength(1);
    expect(result.sourcing!.candidates[0]!.url).toBe(good.url);
  });
  it.each(['surface:floor', 'surface:north'] as const)(
    'requests only the selected offer role for %s without relaxing local validation',
    (key) => {
      const i = input(key),
        wire = JSON.parse(responseBody(sourcingRequest(i), 'synthetic-model'))
          .text.format.schema;
      const roles: string[] = [];
      const visit = (x: unknown) => {
        if (!x || typeof x !== 'object') return;
        if (Array.isArray(x)) {
          x.forEach(visit);
          return;
        }
        const n = x as Record<string, unknown>;
        if (n.properties && typeof n.properties === 'object') {
          const kind = (n.properties as Record<string, unknown>).kind as
            { enum?: string[] } | undefined;
          if (kind?.enum && 'pricing' in n.properties) roles.push(...kind.enum);
        }
        Object.values(n).forEach(visit);
      };
      visit(wire);
      expect(roles.length).toBeGreaterThan(0);
      expect(new Set(roles)).toEqual(new Set([i.brief.kind]));
    },
  );

  it('researches without a location hint when the visitor skips and retains real example source countries', async () => {
    const requestInput = input();
    requestInput.locality = {
      country: 'ZZ',
      city: 'No location shared',
      currency: 'USD',
    };
    const request = sourcingRequest(requestInput);
    const body = JSON.parse(responseBody(request, 'synthetic-model'));
    expect(body.tools[0]).toEqual({
      type: 'web_search',
      search_context_size: 'medium',
      search_content_types: ['text', 'image'],
      image_settings: { max_results: 3, caption: true },
    });
    expect(body.tools[0]).not.toHaveProperty('user_location');
    const data = JSON.parse(body.input[0].content[0].text);
    expect(data.shoppingCountries).toContain('US');
    expect(data.shoppingCountries).toContain('EG');
    const reply = await fakeReply(requestInput);
    expect(reply.candidates[0]!.offer!.market.country).toBe('US');
    expect(
      normalizeSourcing(requestInput, reply, undefined, true, 123, id)
        .candidates[0]!.offer!.market.currency,
    ).toBe('USD');
  });

  it('rejects oversized local briefs safely before admission, without truncating constraints', () => {
    const room = createRoomFixture('sample');
    for (const key of [
      room.furniture[0]!.id,
      'surface:north',
      'service:moving',
    ]) {
      expect(buildSourcingBrief(room, key, 'x'.repeat(241))).toBeNull();
      expect(
        buildSourcingBrief(room, key, 'x'.repeat(240))?.query,
      ).toHaveLength(240);
    }
  });
  it('projects only the selected item and explicit locality, never photos/full room/chat', () => {
    const room = createRoomFixture('sample'),
      p = room.furniture[0]!;
    const brief = buildSourcingBrief(room, p.id, 'washable');
    expect(brief?.target).toEqual({ kind: 'furniture', id: p.id });
    expect(JSON.stringify(brief)).not.toContain('centerX');
    expect(JSON.stringify(brief)).not.toContain('features');
    expect(buildSourcingBrief(room, 'gone')).toBeNull();
    expect(
      sourcingBriefSchema.safeParse({
        ...brief,
        target: { kind: 'surface', surface: 'floor' },
      }).success,
    ).toBe(false);
    expect(
      sourcingInputSchema.safeParse({
        ...input(),
        endpoint: 'https://foreign.invalid',
      }).success,
    ).toBe(false);
    expect(
      sourcingReplySchema.safeParse({
        candidates: [{ url: 'javascript:alert(1)' }],
        notes: [],
      }).success,
    ).toBe(false);
  });
  it('runs one fake HTTP grant/dispatch, rejects changed brief/replay and keeps the room immutable', async () => {
    const r = runtime(),
      app = createApp(r),
      i = input(),
      before = structuredClone(i);
    const post = (path: string, body: object) =>
      request(app)
        .post('/v1/' + path)
        .set('Authorization', 'Bearer synthetic-bridge')
        .set('Origin', 'http://127.0.0.1:4320')
        .send(body);
    try {
      expect(
        (await request(app).get('/v1/config')).body.capabilities.sourcing,
      ).toBe(true);
      expect((await post('sourcing', i)).status).toBe(400);
      expect(
        (await request(app).post('/v1/sourcing').send({ input: i, grant: 'x' }))
          .status,
      ).toBe(403);
      const g = await post('admission', { input: i, proof: null });
      expect(g.status).toBe(200);
      expect(r.operations.calls()).toBe(0);
      expect(
        (
          await post('sourcing', {
            input: { ...i, costRevision: 1 },
            grant: g.body.grant,
          })
        ).status,
      ).toBe(409);
      const result = await post('sourcing', { input: i, grant: g.body.grant });
      expect(result.status).toBe(200);
      const parsed = operationResultSchema.parse(result.body);
      expect(parsed.kind).toBe('completed');
      expect(parsed.simulation).toBe(true);
      expect(parsed.sourcing!.candidates[0]!.offer!.source.kind).toBe('sample');
      expect(parsed.sourcing!.candidates[0]!.offer!.availability).toBe(
        'unknown',
      );
      expect(
        (await post('sourcing', { input: i, grant: g.body.grant })).status,
      ).toBe(409);
      expect(r.operations.calls()).toBe(1);
      expect(r.meteredDispatches()).toBe(0);
      expect(i).toEqual(before);
    } finally {
      r.operations.close();
    }
  });
  it.each(['conditional', 'from', 'unknown'] as const)(
    'keeps %s amounts as excluded leads',
    async (conditions) => {
      const i = input(),
        reply = await fakeReply(i);
      reply.candidates[0]!.conditions = conditions;
      const result = normalizeSourcing(
        i,
        reply,
        { calls: 2, opened: [reply.candidates[0]!.url], sources: [] },
        false,
        123,
        id,
      );
      expect(result.candidates[0]!.offer).toBeNull();
    },
  );
  it('requires a page opening and matching price URL, never a snippet/citation or invented date', async () => {
    const i = input(),
      reply = await fakeReply(i),
      c = reply.candidates[0]!;
    c.url = 'https://merchant.example/product';
    c.offer!.source = {
      kind: 'sourced',
      label: 'Observed page',
      url: c.url,
      observedAt: 999999999,
      evidence: 'Variant and pack price observed',
    };
    expect(
      normalizeSourcing(
        i,
        reply,
        { calls: 1, opened: [], sources: [c.url] },
        false,
        123,
        id,
      ).candidates[0]!.offer,
    ).toBeNull();
    const normalized = normalizeSourcing(
      i,
      reply,
      { calls: 2, opened: [c.url], sources: [c.url] },
      false,
      123,
      id,
    ).candidates[0]!.offer!;
    expect(normalized.source.observedAt).toBe(123);
    expect(normalized.id).not.toBe(c.offer!.id);
    expect(normalized.deliveryGroup).toMatch(/^merchant_/);
    c.offer!.source.url = 'https://elsewhere.example/product';
    expect(
      normalizeSourcing(
        i,
        reply,
        { calls: 2, opened: [c.url], sources: [] },
        false,
        123,
        id,
      ).candidates[0]!.offer,
    ).toBeNull();
  });
  it('groups a seller consistently without merging different sellers on one marketplace host', async () => {
    const i = input(),
      raw = await fakeReply(i),
      base = raw.candidates[0]!;
    const candidates = ['Seller A', 'Seller B', 'Seller A'].map(
      (supplier, index) => {
        const candidate = structuredClone(base);
        candidate.url = `https://market.example/product-${index}`;
        candidate.offer!.supplier = supplier;
        candidate.offer!.source.url = candidate.url;
        return candidate;
      },
    );
    const normalized = normalizeSourcing(
      i,
      { candidates, notes: [] },
      { calls: 4, opened: candidates.map((c) => c.url), sources: [] },
      false,
      123,
      id,
    ).candidates;
    expect(normalized[0]!.offer!.deliveryGroup).not.toBe(
      normalized[1]!.offer!.deliveryGroup,
    );
    expect(normalized[0]!.offer!.deliveryGroup).toBe(
      normalized[2]!.offer!.deliveryGroup,
    );
  });
  it('does not reuse another currency or service city and labels regional fake prices as authored', async () => {
    const i = input(),
      reply = await fakeReply(i);
    expect(reply.candidates[0]!.offer!.market.currency).toBe('USD');
    reply.candidates[0]!.offer!.market.currency = 'EUR';
    expect(
      normalizeSourcing(i, reply, undefined, true, 123, id).candidates[0]!
        .offer,
    ).toBeNull();
    i.locality.currency = 'EGP';
    expect((await fakeReply(i)).candidates[0]!.offer).toBeNull();
    i.locality.currency = 'USD';
    i.locality.city = 'Alexandria';
    expect((await fakeReply(i)).candidates[0]!.offer).toMatchObject({
      market: { city: 'Alexandria', currency: 'USD' },
      source: { kind: 'sample' },
    });
    const service = input('service:moving'),
      s = await fakeReply(service);
    s.candidates[0]!.offer!.market.city = 'Alexandria';
    expect(
      normalizeSourcing(service, s, undefined, true, 123, id).candidates[0]!
        .offer,
    ).toBeNull();
  });
});
describe('bounded existing Responses web-search wire', () => {
  it('keeps application-owned FX out of the provider schema', () => {
    expect(JSON.stringify(sourcingRequest(input()).format)).not.toContain(
      'usdPerUnit',
    );
    expect(JSON.stringify(sourcingRequest(input()).format)).not.toContain(
      '"fx"',
    );
    expect(sourcingRequest(input()).instructions).toContain(
      'never guess an exchange rate',
    );
    const wire = JSON.parse(
      responseBody(sourcingRequest(input()), 'synthetic-model'),
    ).text.format.schema;
    const countries: unknown[] = [];
    function visit(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      const node = value as Record<string, unknown>;
      if (node.properties && typeof node.properties === 'object') {
        const country = (node.properties as Record<string, unknown>).country;
        if (country) countries.push(country);
      }
      Object.values(node).forEach(visit);
    }
    visit(wire);
    expect(countries.length).toBeGreaterThan(0);
    expect(
      countries.every(
        (country) =>
          JSON.stringify(country) ===
          JSON.stringify({ type: 'string', enum: shoppingCountries('EG') }),
      ),
    ).toBe(true);
  });
  it('emits one fixed strict foreground request, bounded built-in calls and no room command tools', () => {
    const body = JSON.parse(
      responseBody(sourcingRequest(input()), 'synthetic-model'),
    );
    expect(body).toMatchObject({
      store: false,
      stream: false,
      background: false,
      parallel_tool_calls: false,
      max_tool_calls: POLICY.sourcingSearchCalls,
      tool_choice: 'required',
    });
    expect(body.tools).toEqual([
      {
        type: 'web_search',
        search_context_size: 'medium',
        search_content_types: ['text', 'image'],
        image_settings: { max_results: 3, caption: true },
        user_location: { type: 'approximate', country: 'EG', city: 'Cairo' },
      },
    ]);
    expect(body.include).toContain('web_search_call.action.sources');
    expect(body.text.format.strict).toBe(true);
    expect(() =>
      responseBody(
        {
          ...sourcingRequest(input()),
          format: {
            name: 'room_observations_3',
            schema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },
        'synthetic-model',
      ),
    ).toThrow();
  });
  it('admits bounded search metadata only for sourcing without trusting unknown fields or over-budget tools', () => {
    const url = 'https://merchant.example/product',
      raw = {
        status: 'completed',
        output: [
          {
            type: 'web_search_call',
            id: 'ws1',
            status: 'completed',
            action: {
              type: 'search',
              queries: ['chair Cairo'],
              sources: [{ type: 'url', url }],
            },
          },
          {
            type: 'web_search_call',
            id: 'ws2',
            status: 'completed',
            action: { type: 'open_page', url },
          },
          {
            type: 'message',
            content: [
              { type: 'output_text', text: '{"candidates":[],"notes":[]}' },
            ],
          },
        ],
      };
    expect(decodeResponse(raw, []).kind).toBe('malformed');
    expect(decodeResponse(raw, [], undefined, true)).toMatchObject({
      kind: 'completed',
      search: { calls: 2, opened: [url] },
    });
    const evidence = {
      calls: 0,
      opened: [] as string[],
      sources: [] as string[],
    };
    expect(
      readSearchAction(
        { ...raw.output[0], action: { type: 'execute', url } },
        evidence,
      ),
    ).toBe(false);
    expect(
      readSearchAction({ ...raw.output[0], endpoint: url }, evidence),
    ).toBe(true);
    const many = {
      ...raw,
      output: [
        ...Array.from({ length: POLICY.sourcingActionItems + 1 }, (_, i) => ({
          ...raw.output[0],
          id: `ws${i}`,
        })),
        raw.output[2],
      ],
    };
    expect(decodeResponse(many, [], undefined, true).kind).toBe('malformed');
  });
  it('keeps successful products when unused search metadata is nullable or malformed', () => {
    const url = 'https://merchant.example/product';
    const result = decodeResponse(
      {
        status: 'completed',
        output: [
          {
            type: 'web_search_call',
            id: 'search',
            status: 'completed',
            action: {
              type: 'search',
              query: null,
              queries: null,
              sources: null,
              metadata: { unused: true },
            },
          },
          {
            type: 'web_search_call',
            id: 'bad',
            status: 'completed',
            action: { type: 'unsupported', url: 'https://bad.example/product' },
            results: [
              {
                type: 'image_result',
                image_url: 'https://bad.example/photo.jpg',
                source_website_url: url,
              },
            ],
          },
          {
            type: 'web_search_call',
            id: 'open',
            status: 'completed',
            action: { type: 'open_page', url, optional_metadata: null },
          },
          {
            type: 'message',
            content: [
              { type: 'output_text', text: '{"candidates":[],"notes":[]}' },
            ],
          },
        ],
      },
      [],
      undefined,
      true,
    );
    expect(result).toMatchObject({
      kind: 'completed',
      search: { calls: 3, opened: [url], sources: [url] },
    });
    if (result.kind !== 'completed') throw new Error(result.kind);
    expect(result.search?.images).toBeUndefined();
  });
  it('uses safe API citations as display evidence without claiming the page was opened', () => {
    const url = 'https://merchant.example/product';
    const result = decodeResponse(
      {
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: '{"candidates":[],"notes":[]}',
                annotations: [
                  { type: 'url_citation', url },
                  { type: 'url_citation', url: 'https://127.0.0.1/private' },
                  { type: 'other', url: 'https://other.example/' },
                ],
              },
            ],
          },
        ],
      },
      [],
      undefined,
      true,
    );
    expect(result).toMatchObject({
      kind: 'completed',
      search: { sources: [url], opened: [] },
    });
  });
  it('uses injected fixed fetch once, with no retry or actual metered endpoint request', async () => {
    let attempts = 0;
    const provider = createResponsesProvider(
      'synthetic-key',
      'synthetic-model',
      async (url, options) => {
        attempts++;
        expect(String(url)).toBe('https://api.openai.com/v1/responses');
        expect(options?.redirect).toBe('error');
        return Response.json({
          status: 'completed',
          output: [
            {
              type: 'message',
              content: [
                { type: 'output_text', text: '{"candidates":[],"notes":[]}' },
              ],
            },
          ],
        });
      },
    );
    const call = provider.start(
      sourcingRequest(input()),
      new AbortController().signal,
    );
    expect((await call.result).kind).toBe('completed');
    await call.settled;
    expect(attempts).toBe(1);
  });
});
describe('server-owned USD sourcing equivalents', () => {
  it('rejects model-authored FX and logs only schema codes/paths for malformed input', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    candidate.offer!.fx = {
      currency: 'EGP',
      usdPerUnit: '0.017831',
      date: '2026-10-28',
      observedAt: Date.UTC(2026, 9, 28),
      url: 'https://api.frankfurter.dev/v2/rate/egp/usd',
      inputs: [{ key: 'price', minor: 19 }],
    };
    expect(
      normalizeSourcing(i, reply, undefined, true, 123, id).candidates[0]!
        .offer,
    ).toBeNull();
    candidate.url = 'javascript:PRIVATE_SOURCE_TEXT';
    reply.candidates = [candidate]; // All-invalid metadata must still reject the response.
    const invalid = vi.fn<(issues: { code: string; path: string }[]) => void>();
    const result = await createSourcingHandler(
      false,
      Date.now,
      id,
      undefined,
      invalid,
    )(i, {
      signal: new AbortController().signal,
      call: async () => ({ kind: 'completed', data: reply, calls: [] }),
    });
    expect(result.kind).toBe('malformed');
    const diagnostics = invalid.mock.calls[0]![0];
    expect(diagnostics.length).toBeLessThanOrEqual(6);
    expect(diagnostics).toContainEqual({
      code: 'invalid_format',
      path: 'candidates.0.url',
    });
    expect(JSON.stringify(diagnostics)).not.toContain('PRIVATE_SOURCE_TEXT');
    expect(Object.keys(diagnostics[0]!)).toEqual(['code', 'path']);
  });
  async function run(
    mode:
      | 'priced'
      | 'unopened'
      | 'conditional'
      | 'missing-rate'
      | 'cancelled'
      | 'extra-notes'
      | 'long-notes',
  ) {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    candidate.url = 'https://merchant.example/exact-variant';
    candidate.match = 'similar';
    candidate.conditions = mode === 'conditional' ? 'conditional' : 'standard';
    candidate.evidence = 'Price EGP 11995; variant verified';
    candidate.differences = ['Listed in EGP, local checkout required'];
    if (mode === 'extra-notes')
      candidate.differences = [
        'Dimensions differ.',
        'Colour differs.',
        'Stock is unconfirmed.',
        'Delivery is separate.',
        'Tax needs review.',
      ];
    if (mode === 'long-notes')
      candidate.differences = Array.from(
        { length: 5 },
        (_, index) => `${index} ${'x'.repeat(198)}`,
      );
    reply.notes = ['Native price EGP 11995'];
    candidate.offer!.market.currency = 'EGP';
    candidate.offer!.source.url = candidate.url;
    candidate.offer!.source.kind = 'sourced';
    candidate.offer!.source.observedAt = null; // Models supply no clock authority.
    candidate.offer!.source.evidence = '';
    if ('priceMinor' in candidate.offer!) candidate.offer!.priceMinor = 1199500;
    const abort = new AbortController();
    const lookup = vi.fn(async () => {
      if (mode === 'cancelled') abort.abort();
      return mode === 'missing-rate'
        ? null
        : {
            usdPerUnit: '0.017831',
            date: '2026-10-28',
            observedAt: Date.UTC(2026, 9, 28, 12),
            url: 'https://api.frankfurter.dev/v2/rate/egp/usd',
          };
    });
    const call = vi.fn(async () => ({
      kind: 'completed' as const,
      calls: [],
      data: reply,
      search: {
        calls: 2,
        opened: mode === 'unopened' ? [] : [candidate.url],
        sources: [],
      },
    }));
    const result = await createSourcingHandler(
      false,
      () => Date.UTC(2026, 9, 28, 12),
      id,
      lookup,
    )(i, { signal: abort.signal, remainingMs: 20_000, call });
    return { result, lookup, call };
  }
  it('prices an opened local offer in USD, keeps exact source inputs and removes native-price prose', async () => {
    const { result, lookup, call } = await run('priced');
    expect(result.kind).toBe('completed');
    const candidate = result.sourcing!.candidates[0]!;
    expect(candidate.offer?.market.currency).toBe('USD');
    expect(
      candidate.offer &&
        'priceMinor' in candidate.offer &&
        candidate.offer.priceMinor,
    ).toBe(21388);
    expect(candidate.offer?.fx?.inputs).toEqual([
      { key: 'price', minor: 1199500 },
    ]);
    expect(candidate.offer?.source.url).toBe(candidate.url);
    expect(
      candidate.evidence +
        candidate.differences.join(' ') +
        result.sourcing!.notes.join(' '),
    ).not.toMatch(/EGP|11995/);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledTimes(1);
  });
  it.each(['unopened', 'conditional'] as const)(
    'never fetches a rate for a %s lead',
    async (mode) => {
      const { result, lookup } = await run(mode);
      expect(result.sourcing!.candidates[0]!.offer).toBeNull();
      expect(lookup).not.toHaveBeenCalled();
    },
  );
  it('keeps every short qualification when compacting prose, or excludes a lead if they cannot fit', async () => {
    const short = await run('extra-notes'),
      candidate = short.result.sourcing!.candidates[0]!;
    expect(candidate.offer?.market.currency).toBe('USD');
    expect(candidate.differences.length).toBeLessThanOrEqual(4);
    for (const fact of [
      'Dimensions differ.',
      'Colour differs.',
      'Stock is unconfirmed.',
      'Delivery is separate.',
      'Tax needs review.',
    ])
      expect(candidate.differences.join(' ')).toContain(fact);
    const long = await run('long-notes');
    expect(long.result.sourcing!.candidates[0]!.offer).toBeNull();
    expect(
      long.result.sourcing!.candidates[0]!.differences.join(' '),
    ).toContain('Further qualifications need review');
    expect(long.lookup).not.toHaveBeenCalled();
  });
  it('keeps a missing-rate offer unpriced and fences cancellation without a second model call', async () => {
    const missing = await run('missing-rate');
    expect(missing.result.sourcing!.candidates[0]!.match).toBe('lead');
    expect(missing.result.sourcing!.candidates[0]!.offer).toBeNull();
    const cancelled = await run('cancelled');
    expect(cancelled.result.kind).toBe('cancelled');
    expect(cancelled.call).toHaveBeenCalledTimes(1);
  });
});
describe('selected prices and lifecycle', () => {
  it('attaches a matching furniture price without changing geometry and rejects a wider alternative', async () => {
    const room = createRoomFixture('sample'),
      p = room.furniture[0]!,
      draft = createCostDraft(room),
      i = input(p.id),
      raw = await fakeReply(i),
      reply = normalizeSourcing(i, raw, undefined, true, 123, id),
      before = structuredClone(room);
    const attached = attachOffer(room, draft, i.brief, reply.candidates[0]!);
    expect(attached.ok).toBe(true);
    if (attached.ok) {
      expect(attached.settings.furniture.find((f) => f.id === p.id)?.mode).toBe(
        'buy',
      );
      expect(
        attached.settings.deliveries.some(
          (d) => d.group === reply.candidates[0]!.offer!.deliveryGroup,
        ),
      ).toBe(true);
      expect(
        attached.estimate.lines.some(
          (l) => l.category === 'delivery' && l.amountMinor === null,
        ),
      ).toBe(true);
    }
    const wider = attachOffer(room, draft, i.brief, reply.candidates[1]!);
    expect(wider).toMatchObject({ ok: false });
    expect(room).toEqual(before);
  });
  it('rejects stale and duplicate price selection at the actual commit boundary', async () => {
    const c = new SessionController(createRoomFixture('sample'));
    controllers.push(c);
    c.setDestination('cost');
    const i = input(),
      reply = normalizeSourcing(
        i,
        await fakeReply(i),
        undefined,
        true,
        123,
        id,
      );
    expect(selectOffer(c, i.brief, reply.candidates[0]!, 0, 0).ok).toBe(true);
    const accepted = c.getSnapshot().cost;
    expect(selectOffer(c, i.brief, reply.candidates[0]!, 0, 0).ok).toBe(false);
    expect(c.getSnapshot().cost).toBe(accepted);
  });
  it('keeps discovery pages out of live prices even when opened', async () => {
    const i = input(),
      reply = await fakeReply(i),
      candidate = reply.candidates[0]!;
    candidate.offer!.source.url = candidate.url;
    expect(
      normalizeSourcing(
        i,
        reply,
        { calls: 2, opened: [candidate.url], sources: [] },
        false,
        123,
        id,
      ).candidates[0]!.offer,
    ).toBeNull();
  });
  it('keeps unsupported floor and changed colour variants review-only', async () => {
    const room = createRoomFixture('sample'),
      draft = createCostDraft(room),
      i = input(),
      reply = normalizeSourcing(
        i,
        await fakeReply(i),
        undefined,
        true,
        123,
        id,
      );
    room.room = withRoomSurface(room.room, {
      surface: 'floor',
      texture: 'tile',
    });
    expect(attachOffer(room, draft, i.brief, reply.candidates[0]!).ok).toBe(
      false,
    );
  });
  it('rejects a sourced paint colour that differs from the accepted wall', async () => {
    const room = createRoomFixture('sample'),
      i = input('surface:north'),
      reply = normalizeSourcing(
        i,
        await fakeReply(i),
        undefined,
        true,
        123,
        id,
      ),
      candidate = reply.candidates[0]!;
    if (candidate.offer?.kind !== 'paint') throw new Error('fixture');
    candidate.offer = {
      ...candidate.offer,
      colour: '#ff0000',
      source: {
        kind: 'sourced',
        label: 'Page',
        url: candidate.url,
        observedAt: 123,
        evidence: 'Specific red variant',
      },
    };
    expect(
      attachOffer(room, createCostDraft(room), i.brief, candidate).ok,
    ).toBe(false);
  });
  it('uses the fixed bridge operation and rejects endpoint/body substitution before upstream work', async () => {
    const i = input(),
      seen: string[] = [],
      reply = normalizeSourcing(
        i,
        await fakeReply(i),
        undefined,
        true,
        123,
        id,
      );
    const config = {
      backendOrigin: 'http://127.0.0.1:4321',
      publicOrigin: 'http://127.0.0.1:4320',
      secret: 'synthetic-bridge',
    };
    const req = (body: unknown) =>
      new Request('http://127.0.0.1:4320/api/roomedy/v1/sourcing', {
        method: 'POST',
        headers: {
          Origin: config.publicOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    const fetcher: typeof fetch = async (url) => {
      seen.push(String(url));
      return Response.json({
        identity: i.identity,
        kind: 'completed',
        draft: null,
        simulation: true,
        message: 'Review',
        sourcing: reply,
      });
    };
    expect(
      (
        await bridgePost(
          'sourcing',
          req({ input: i, grant: 'grant' }),
          config,
          fetcher,
        )
      ).status,
    ).toBe(200);
    expect(seen).toEqual(['http://127.0.0.1:4321/v1/sourcing']);
    expect(
      (
        await bridgePost(
          'sourcing',
          req({
            input: { ...i, endpoint: 'https://foreign.example' },
            grant: 'grant',
          }),
          config,
          fetcher,
        )
      ).status,
    ).toBe(400);
    expect(seen).toHaveLength(1);
  });
  it('cancels a hanging transport visibly and fences results after changed cost scope', async () => {
    const c = new SessionController(createRoomFixture('sample'));
    controllers.push(c);
    c.setDestination('cost');
    const task = beginResearch(
      c,
      buildSourcingBrief(c.getSnapshot().workspace!.current, 'surface:floor')!,
      async () => new Promise<Response>(() => {}),
    )!;
    task.cancel();
    expect((await task.result).ok).toBe(false);
    expect(c.getSnapshot().pending).toBeNull();
    const old = beginResearch(
      c,
      buildSourcingBrief(c.getSnapshot().workspace!.current, 'surface:floor')!,
      async () => new Promise<Response>(() => {}),
    )!;
    const d = c.getSnapshot().cost!;
    c.updateCost({
      ...d.settings,
      floor: { ...d.settings.floor, wasteBps: 2000 },
    });
    expect((await old.result).ok).toBe(false);
    expect(c.getSnapshot().cost!.settings.floor.wasteBps).toBe(2000);
  });
  it.each([
    ['furniture', 'US'],
    ['surface:floor', 'US'],
    ['surface:north', 'US'],
    ['service:moving', 'ZZ'],
  ])(
    'keeps %s research in market %s without rewriting historical settings',
    async (target, expectedCountry) => {
      const c = new SessionController(createRoomFixture('sample'));
      controllers.push(c);
      c.setDestination('cost', 'en-US');
      const draft = c.getSnapshot().cost!;
      expect(
        c.updateCost({
          ...draft.settings,
          locality: {
            country: 'ZZ',
            city: 'No location shared',
            currency: 'USD',
          },
        }),
      ).toBe(true);
      const before = JSON.stringify(c.getSnapshot().cost);
      const room = c.getSnapshot().workspace!.current;
      const key = target === 'furniture' ? room.furniture[0]!.id : target;
      const brief = buildSourcingBrief(room, key)!;
      const markets: string[] = [];
      const transport: typeof fetch = async (url, init) => {
        if (String(url).endsWith('/config')) return Response.json(config());
        const body = JSON.parse(String(init?.body));
        markets.push(body.input.locality.country);
        if (String(url).endsWith('/admission'))
          return Response.json({
            kind: 'granted',
            grant: 'grant',
            expiresAt: 123,
            simulation: true,
          });
        return Response.json({
          identity: body.input.identity,
          kind: 'completed',
          draft: null,
          simulation: true,
          message: 'Review',
          sourcing: { candidates: [], notes: [] },
        });
      };
      const task = beginResearch(c, brief, transport)!;
      const answer = await task.result;
      expect(answer.ok).toBe(true);
      if (!answer.ok) throw new Error(answer.message);
      expect(markets).toEqual([expectedCountry, expectedCountry]);
      expect(answer.input.locality).toEqual({
        country: expectedCountry,
        city: expectedCountry === 'US' ? 'United States' : 'No location shared',
        currency: 'USD',
      });
      expect(JSON.stringify(c.getSnapshot().cost)).toBe(before);
    },
  );
  it('enforces a visible deadline even if config fetch ignores abort, and never resumes after disposal', async () => {
    vi.useFakeTimers();
    const c = new SessionController(createRoomFixture('sample'));
    controllers.push(c);
    c.setDestination('cost');
    const task = beginResearch(
      c,
      buildSourcingBrief(c.getSnapshot().workspace!.current, 'surface:floor')!,
      async () => new Promise<Response>(() => {}),
    )!;
    await vi.advanceTimersByTimeAsync(POLICY.operationBridgeMs + 1);
    expect((await task.result).ok).toBe(false);
    expect(c.getSnapshot().pending).toBeNull();
    const again = beginResearch(
      c,
      buildSourcingBrief(c.getSnapshot().workspace!.current, 'surface:floor')!,
      async () => new Promise<Response>(() => {}),
    )!;
    c.dispose();
    expect((await again.result).ok).toBe(false);
    expect(c.getSnapshot().cost).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('returns a completed strict fake client response and does not silently fall back when unavailable', async () => {
    const i = input(),
      reply = normalizeSourcing(
        i,
        await fakeReply(i),
        undefined,
        true,
        123,
        id,
      ),
      seen: string[] = [];
    const transport: typeof fetch = async (url) => {
      seen.push(String(url));
      return String(url).endsWith('/admission')
        ? Response.json({
            kind: 'granted',
            grant: 'grant',
            expiresAt: 123,
            simulation: true,
          })
        : Response.json({
            identity: i.identity,
            kind: 'completed',
            draft: null,
            simulation: true,
            message: 'Review',
            sourcing: reply,
          });
    };
    expect(
      (await researchProducts(i, new AbortController().signal, transport)).ok,
    ).toBe(true);
    expect(seen).toEqual([
      '/api/roomedy/v1/admission',
      '/api/roomedy/v1/sourcing',
    ]);
    const c = new SessionController(createRoomFixture('sample'));
    controllers.push(c);
    c.setDestination('cost');
    const unavailable = beginResearch(c, i.brief, async () =>
      Response.json({
        ...config(),
        capabilities: { ...config().capabilities, sourcing: false },
      }),
    )!;
    expect((await unavailable.result).ok).toBe(false);
  });
  it.each(['timeout', 'malformed', 'refused'] as const)(
    'explains an identity-checked %s without retrying or changing prices',
    async (kind) => {
      const i = input();
      const transport = vi.fn<typeof fetch>().mockImplementation(async (url) =>
        String(url).endsWith('/admission')
          ? Response.json({
              kind: 'granted',
              grant: 'grant',
              expiresAt: 123,
              simulation: true,
            })
          : Response.json({
              identity: i.identity,
              kind,
              draft: null,
              simulation: true,
              message: 'Server failure',
            }),
      );
      const result = await researchProducts(
        i,
        new AbortController().signal,
        transport,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain('Your accepted prices are unchanged');
        expect(result.message).toContain('try another store');
        expect(result.message).not.toContain('Server failure');
        if (kind === 'timeout') expect(result.message).toContain('time limit');
      }
      expect(transport).toHaveBeenCalledTimes(2);
    },
  );
});
