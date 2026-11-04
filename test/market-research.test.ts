import { afterEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import { withRoomSurface } from '@roomedy/contracts/surfaces';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { beginResearch } from '../apps/frontend/src/features/cost/client.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';
import {
  MARKET_TARGET_LIMIT,
  marketTargets,
  runMarketResearch,
} from '../apps/frontend/src/features/cost/market-research.js';
import type { ResearchScope } from '../apps/frontend/src/features/cost/research-scope.js';
import type { MarketUpdate } from '../apps/frontend/src/features/cost/market-research.js';
import { verificationSnapshot } from '../apps/frontend/src/features/verification/state.js';
const owned: SessionController[] = [];
afterEach(() => {
  verificationSnapshot()?.finish();
  owned.splice(0).forEach((c) => c.dispose());
});
function session() {
  const c = new SessionController(createRoomFixture('sample'));
  owned.push(c);
  c.setDestination('cost');
  return c;
}
function transportFor(
  answer?: (input: Record<string, unknown>) => Promise<Record<string, unknown>>,
) {
  const calls: string[] = [];
  const transport: typeof fetch = async (url, init) => {
    if (String(url).endsWith('/config'))
      return Response.json({
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
    const input = JSON.parse(String(init?.body)).input;
    if (String(url).endsWith('/admission'))
      return Response.json({
        kind: 'granted',
        grant: 'synthetic',
        expiresAt: 123,
        simulation: true,
      });
    calls.push(input.brief.label);
    const extra = await answer?.(input);
    if (extra?.error) return Response.json(extra);
    return Response.json({
      identity: input.identity,
      kind: 'completed',
      draft: null,
      simulation: true,
      message: 'Review',
      sourcing: { candidates: [], notes: [] },
      ...extra,
    });
  };
  return {
    calls,
    begin: (
      c: SessionController,
      b: Parameters<typeof beginResearch>[1],
      scope: ResearchScope,
    ) => beginResearch(c, b, transport, scope),
  };
}
describe('explicit collective market research', () => {
  it('does not replace another foreground operation or launch from the wrong phase', async () => {
    const c = session(),
      targets = marketTargets(c.getSnapshot().workspace!.current),
      h = transportFor();
    const pending = c.beginOperation();
    const blocked = await runMarketResearch(c, targets, () => {}, h.begin)
      .result;
    expect(blocked.remaining).toEqual(targets);
    expect(c.getSnapshot().pending).toBe(pending);
    expect(h.calls).toHaveLength(0);
    c.setDestination('design');
    await runMarketResearch(c, targets, () => {}, h.begin).result;
    expect(h.calls).toHaveLength(0);
    expect(c.getSnapshot().pending).toBeNull();
  });
  it('retires both proof callers and ignores an old proof after cancellation', async () => {
    const c = session(),
      targets = marketTargets(c.getSnapshot().workspace!.current).slice(0, 2);
    let admissions = 0,
      sourced = 0;
    const transport: typeof fetch = async (url) => {
      if (String(url).endsWith('/config'))
        return Response.json({
          mode: 'live',
          capabilities: {
            manual: true,
            recognition: true,
            assistant: true,
            sourcing: true,
            simulation: false,
          },
          limits: PUBLIC_LIMITS,
        });
      if (String(url).endsWith('/admission')) {
        admissions++;
        return Response.json({
          kind: 'verification',
          state: 'interaction',
          simulation: false,
          challenge: {
            siteKey: 'synthetic',
            action: 'roomedy-ai',
            inputHash: (admissions === 1 ? 'a' : 'b').repeat(64),
          },
        });
      }
      sourced++;
      throw new Error('unexpected sourcing');
    };
    const receive = vi.fn();
    const batch = runMarketResearch(
      c,
      targets,
      receive,
      (session, brief, scope) =>
        beginResearch(session, brief, transport, scope),
    );
    await vi.waitFor(() => expect(admissions).toBe(2));
    await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
    const old = verificationSnapshot()!;
    batch.cancel();
    expect((await batch.result).cancelled).toBe(true);
    old.finish('late-proof');
    await Promise.resolve();
    expect(verificationSnapshot()).toBeNull();
    expect(c.getSnapshot().pending).toBeNull();
    expect(sourced).toBe(0);
    expect(
      receive.mock.calls.every(([, update]) => update.kind === 'finding'),
    ).toBe(true);
  });
  it('keeps two admitted searches active, distinct and owned until out-of-order completion', async () => {
    const c = session(),
      targets = marketTargets(c.getSnapshot().workspace!.current).slice(0, 3);
    const releases: (() => void)[] = [],
      identities: string[] = [];
    const h = transportFor(async (input) => {
      identities.push(JSON.stringify(input.identity));
      await new Promise<void>((resolve) => releases.push(resolve));
      return {};
    });
    const answered: string[] = [];
    const batch = runMarketResearch(
      c,
      targets,
      (target, update) => {
        if (update.kind === 'answer') answered.push(target.key);
      },
      h.begin,
    );
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    const parent = c.getSnapshot().pending;
    expect(
      identities.every((identity) => identity !== JSON.stringify(parent)),
    ).toBe(true);
    releases[1]!();
    await vi.waitFor(() => expect(releases).toHaveLength(3));
    expect(answered).toEqual([targets[1]!.key]);
    expect(c.getSnapshot().pending).toEqual(parent);
    releases[0]!();
    releases[2]!();
    expect(await batch.result).toEqual({
      remaining: [],
      cancelled: false,
      paused: false,
    });
    expect(new Set(identities).size).toBe(3);
    expect(answered).toEqual([
      targets[1]!.key,
      targets[0]!.key,
      targets[2]!.key,
    ]);
    expect(c.getSnapshot().pending).toBeNull();
  });
  it.each([
    'busy',
    'not-available',
    'upstream-unavailable',
    'provider-unavailable',
  ])(
    'pauses unscheduled targets after %s, retaining the active sibling with no retry',
    async (code) => {
      const c = session(),
        targets = marketTargets(c.getSnapshot().workspace!.current).slice(0, 3);
      const releases: (() => void)[] = [];
      const h = transportFor(async () => {
        const index = releases.length;
        await new Promise<void>((resolve) => releases.push(resolve));
        return index
          ? {}
          : code === 'provider-unavailable'
            ? { kind: 'unavailable', sourcing: undefined }
            : {
                error: {
                  code,
                  message: 'Synthetic',
                  reference: 'synthetic',
                  retryable: true,
                },
              };
      });
      const answers: MarketUpdate[] = [];
      const batch = runMarketResearch(
        c,
        targets,
        (_, update) => {
          if (update.kind === 'answer') answers.push(update);
        },
        h.begin,
      );
      await vi.waitFor(() => expect(releases).toHaveLength(2));
      releases[0]!();
      await vi.waitFor(() => expect(answers).toHaveLength(1));
      expect(c.getSnapshot().pending).not.toBeNull();
      releases[1]!();
      expect(await batch.result).toEqual({
        remaining: targets.slice(2),
        cancelled: false,
        paused: true,
      });
      expect(h.calls).toHaveLength(2);
      expect(answers[1]).toMatchObject({ answer: { ok: true } });
    },
  );
  it('binds serialized verification proofs and grants to distinct concurrently sourced inputs', async () => {
    const c = session(),
      targets = marketTargets(c.getSnapshot().workspace!.current).slice(0, 2);
    const hashes = new Map<string, string>(),
      proofs: string[] = [],
      releases: (() => void)[] = [];
    const transport: typeof fetch = async (url, init) => {
      if (String(url).endsWith('/config'))
        return Response.json({
          mode: 'live',
          capabilities: {
            manual: true,
            recognition: true,
            assistant: true,
            sourcing: true,
            simulation: false,
          },
          limits: PUBLIC_LIMITS,
        });
      const body = JSON.parse(String(init?.body)),
        id = body.input.identity.operationId;
      if (String(url).endsWith('/admission')) {
        if (!hashes.has(id))
          hashes.set(id, (hashes.size ? 'b' : 'a').repeat(64));
        if (!body.proof)
          return Response.json({
            kind: 'verification',
            state: 'interaction',
            simulation: false,
            challenge: {
              siteKey: 'synthetic',
              action: 'roomedy-ai',
              inputHash: hashes.get(id),
            },
          });
        expect(body.proof).toBe(hashes.get(id));
        proofs.push(body.proof);
        return Response.json({
          kind: 'granted',
          grant: id,
          expiresAt: 123,
          simulation: false,
        });
      }
      expect(body.grant).toBe(id);
      await new Promise<void>((resolve) => releases.push(resolve));
      return Response.json({
        identity: body.input.identity,
        kind: 'completed',
        draft: null,
        simulation: false,
        message: 'Review',
        sourcing: { candidates: [], notes: [] },
      });
    };
    const batch = runMarketResearch(
      c,
      targets,
      () => {},
      (session, brief, scope) =>
        beginResearch(session, brief, transport, scope),
    );
    for (const key of ['a', 'b']) {
      await vi.waitFor(() =>
        expect(verificationSnapshot()?.challenge.inputHash).toBe(
          key.repeat(64),
        ),
      );
      verificationSnapshot()!.finish(key.repeat(64));
    }
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    expect(proofs).toEqual(['a'.repeat(64), 'b'.repeat(64)]);
    releases.forEach((release) => release());
    expect((await batch.result).cancelled).toBe(false);
  });
  it('keeps fully customized bed parts in a bounded valid shopping brief', () => {
    const room = createRoomFixture('partial'),
      bed = room.furniture[0]!;
    bed.materials = {
      body: 'painted',
      upholstery: 'velvet',
      hardware: 'brass',
      bodyColor: '#aabbcc',
      bodyPattern: 'herringbone',
      softColor: '#112233',
      softPattern: 'checker',
      pillowColor: '#445566',
      pillowPattern: 'stripes',
      sheetColor: '#778899',
      sheetPattern: 'herringbone',
      coverColor: '#aaccff',
      coverPattern: 'fabric',
      hardwareColor: '#112244',
    };
    const brief = buildSourcingBrief(room, bed.id)!;
    expect(brief).not.toBeNull();
    expect(brief.appearance.length).toBeLessThanOrEqual(400);
    for (const value of [
      '#aabbcc',
      '#445566',
      '#778899',
      '#aaccff',
      'velvet',
      'stripes',
    ]) {
      expect(brief.appearance).toContain(value);
    }
    expect(marketTargets(room).some((target) => target.key === bed.id)).toBe(
      true,
    );
  });
  it('covers every piece and floor, grouping identical wall finishes but keeping distinct paint', () => {
    const room = createRoomFixture('sample');
    room.room = withRoomSurface(room.room, {
      surface: 'walls',
      color: '#eeeeee',
      texture: 'smooth',
    });
    const first = marketTargets(room);
    expect(
      first.filter((t) => t.group === 'Furniture').map((t) => t.key),
    ).toEqual(room.furniture.map((p) => p.id));
    expect(first.filter((t) => t.group === 'Flooring')).toHaveLength(1);
    expect(first.filter((t) => t.group === 'Wall paint')).toMatchObject([
      { label: 'All walls', matchingWalls: true },
    ]);
    room.room = withRoomSurface(room.room, {
      surface: 'east',
      color: '#bbaabb',
    });
    const paint = marketTargets(room).filter((t) => t.group === 'Wall paint');
    expect(paint).toHaveLength(2);
    expect(paint.find((t) => t.key === 'surface:east')!.matchingWalls).toBe(
      false,
    );
    expect(paint.find((t) => t.key !== 'surface:east')!.matchingWalls).toBe(
      true,
    );
  });
  it('uses real admitted client operations concurrently without changing accepted costs or history', async () => {
    const c = session(),
      before = c.getSnapshot().cost,
      history = c.getSnapshot().workspace!.history;
    const all = marketTargets(c.getSnapshot().workspace!.current),
      targets = [all[0]!, ...all.filter((t) => t.group !== 'Furniture')],
      h = transportFor();
    const updates: MarketUpdate[] = [];
    const result = await runMarketResearch(
      c,
      targets,
      (_, u) => updates.push(u),
      h.begin,
    ).result;
    expect(result).toEqual({ remaining: [], cancelled: false, paused: false });
    expect(h.calls).toEqual(targets.map((t) => t.brief.label));
    expect(updates.filter((u) => u.kind === 'finding')).toHaveLength(
      targets.length,
    );
    expect(updates.filter((u) => u.kind === 'answer')).toHaveLength(
      targets.length,
    );
    expect(
      updates.filter((u) => u.kind === 'answer').every((u) => u.answer.ok),
    ).toBe(true);
    expect(c.getSnapshot().cost).toBe(before);
    expect(c.getSnapshot().workspace!.history).toBe(history);
    expect(c.getSnapshot().pending).toBeNull();
  });
  it('keeps the complete request bounded to the maximum supported room target count', async () => {
    const c = session(),
      base = marketTargets(c.getSnapshot().workspace!.current),
      h = transportFor();
    const targets = Array.from({ length: MARKET_TARGET_LIMIT + 2 }, (_, i) => ({
      ...base[0]!,
      key: `target-${i}`,
    }));
    const result = await runMarketResearch(c, targets, () => {}, h.begin)
      .result;
    expect(h.calls).toHaveLength(MARKET_TARGET_LIMIT);
    expect(result.remaining).toEqual(targets.slice(MARKET_TARGET_LIMIT));
  });
  it('finds every furniture, floor and wall target beyond six in one bounded request', async () => {
    const room = createRoomFixture('sample');
    room.furniture = Array.from({ length: 9 }, (_, i) => ({
      ...structuredClone(room.furniture[0]!),
      id: `piece-${i}`,
      label: `Piece ${i}`,
    }));
    const c = new SessionController(room);
    owned.push(c);
    c.setDestination('cost');
    const targets = marketTargets(room),
      before = c.getSnapshot().cost;
    let active = 0,
      maximum = 0;
    const h = transportFor(async () => {
      active++;
      maximum = Math.max(maximum, active);
      await Promise.resolve();
      active--;
      return {};
    });
    const answered: string[] = [];
    const result = await runMarketResearch(
      c,
      targets,
      (target, update) => {
        if (update.kind === 'answer') answered.push(target.key);
      },
      h.begin,
    ).result;
    expect(targets).toHaveLength(11);
    expect(h.calls).toEqual(targets.map((target) => target.brief.label));
    expect(answered).toEqual(targets.map((target) => target.key));
    expect(maximum).toBe(2);
    expect(result).toEqual({ remaining: [], cancelled: false, paused: false });
    expect(c.getSnapshot().cost).toBe(before);
  });
  it('retires a later in-flight target after six completed results without dispatching another', async () => {
    const c = session(),
      base = marketTargets(c.getSnapshot().workspace!.current);
    const targets = Array.from({ length: 11 }, (_, i) => ({
      ...base[0]!,
      key: `target-${i}`,
    }));
    let reached!: () => void;
    const seventh = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const h = transportFor(async () => {
      if (h.calls.length >= 7) {
        reached();
        return new Promise(() => {});
      }
      return {};
    });
    const answered: string[] = [];
    const run = runMarketResearch(
      c,
      targets,
      (target, update) => {
        if (update.kind === 'answer') answered.push(target.key);
      },
      h.begin,
    );
    await seventh;
    c.setDestination('design');
    expect(await run.result).toEqual({
      remaining: targets.slice(6),
      cancelled: true,
      paused: false,
    });
    expect(h.calls).toHaveLength(8);
    expect(answered).toEqual(targets.slice(0, 6).map((target) => target.key));
    expect(c.getSnapshot().pending).toBeNull();
  });
  it('keeps successful siblings after a target failure, with no automatic retry', async () => {
    const c = session(),
      targets = marketTargets(c.getSnapshot().workspace!.current).slice(0, 3),
      h = transportFor(async () =>
        h.calls.length === 1 ? { kind: 'malformed', sourcing: undefined } : {},
      );
    const answers: MarketUpdate[] = [];
    await runMarketResearch(
      c,
      targets,
      (_, u) => {
        if (u.kind === 'answer') answers.push(u);
      },
      h.begin,
    ).result;
    expect(h.calls).toHaveLength(targets.length);
    expect(answers).toHaveLength(targets.length);
    expect(answers[0]).toMatchObject({ kind: 'answer', answer: { ok: false } });
    expect(answers[1]).toMatchObject({ kind: 'answer', answer: { ok: true } });
  });
  it.each([
    'phase',
    'scope',
    'room',
    'reset',
    'dispose',
    'cancel',
    'superseded',
    'expiry',
  ] as const)(
    'retires hanging work and prevents later dispatch after %s',
    async (change) => {
      const c = session(),
        targets = marketTargets(c.getSnapshot().workspace!.current);
      let started!: () => void;
      const dispatched = new Promise<void>((r) => {
        started = r;
      });
      const h = transportFor(async () => {
        started();
        return new Promise(() => {});
      });
      const receive = vi.fn();
      const batch = runMarketResearch(c, targets, receive, h.begin);
      await dispatched;
      if (change === 'phase') c.setDestination('design');
      if (change === 'scope') {
        const d = c.getSnapshot().cost!;
        c.updateCost({
          ...d.settings,
          floor: { ...d.settings.floor, wasteBps: 2000 },
        });
      }
      if (change === 'room')
        c.dispatch(
          [
            {
              type: 'finish',
              id: c.getSnapshot().workspace!.current.furniture[0]!.id,
              finish: 'walnut',
            },
          ],
          'Change finish',
        );
      if (change === 'expiry') c.expiredRecovery();
      const replacement = change === 'superseded' ? c.beginOperation() : null;
      if (change === 'reset') c.reset(createRoomFixture('empty'));
      if (change === 'dispose') c.dispose();
      if (change === 'cancel') batch.cancel();
      expect((await batch.result).cancelled).toBe(true);
      expect(h.calls).toHaveLength(2);
      expect(receive.mock.calls.every(([, u]) => u.kind === 'finding')).toBe(
        true,
      );
      if (replacement) expect(c.getSnapshot().pending).toEqual(replacement);
      else expect(c.getSnapshot().pending).toBeNull();
    },
  );
});
