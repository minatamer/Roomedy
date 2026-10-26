import { withRoomSurface } from '@roomedy/contracts/surfaces';
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
    locality: { country: 'EG', city: 'Cairo', currency: 'EGP' },
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
  it('does not reuse another currency, market or service city and keeps unsupported fake markets as leads', async () => {
    const i = input(),
      reply = await fakeReply(i);
    reply.candidates[0]!.offer!.market.currency = 'USD';
    expect(
      normalizeSourcing(i, reply, undefined, true, 123, id).candidates[0]!
        .offer,
    ).toBeNull();
    i.locality.city = 'Alexandria';
    expect((await fakeReply(i)).candidates[0]!.offer).toBeNull();
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
  it('emits one fixed strict foreground request, max4 built-in calls and no room command tools', () => {
    const body = JSON.parse(
      responseBody(sourcingRequest(input()), 'synthetic-model'),
    );
    expect(body).toMatchObject({
      store: false,
      stream: false,
      background: false,
      parallel_tool_calls: false,
      max_tool_calls: 4,
      tool_choice: 'required',
    });
    expect(body.tools).toEqual([
      {
        type: 'web_search',
        search_context_size: 'low',
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
  it('admits bounded open/search metadata only for sourcing and rejects unknown/extra/over-budget tools', () => {
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
    ).toBe(false);
    const many = {
      ...raw,
      output: [
        ...Array.from({ length: 5 }, (_, i) => ({
          ...raw.output[0],
          id: `ws${i}`,
        })),
        raw.output[2],
      ],
    };
    expect(decodeResponse(many, [], undefined, true).kind).toBe('malformed');
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
});
