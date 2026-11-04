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
import type { MarketUpdate } from '../apps/frontend/src/features/cost/market-research.js';
const owned: SessionController[] = [];
afterEach(() => {
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
    return Response.json({
      identity: input.identity,
      kind: 'completed',
      draft: null,
      simulation: true,
      message: 'Review',
      sourcing: { candidates: [], notes: [] },
      ...(await answer?.(input)),
    });
  };
  return {
    calls,
    begin: (c: SessionController, b: Parameters<typeof beginResearch>[1]) =>
      beginResearch(c, b, transport),
  };
}
describe('explicit collective market research', () => {
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
  it('uses real admitted client operations serially without changing accepted costs or history', async () => {
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
    expect(result).toEqual({ remaining: [], cancelled: false });
    expect(h.calls).toEqual(targets.map((t) => t.brief.label));
    expect(updates.map((u) => u.kind)).toEqual(
      targets.flatMap(() => ['finding', 'answer']),
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
  it('finds every furniture, floor and wall target beyond six in one serial request', async () => {
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
    expect(maximum).toBe(1);
    expect(result).toEqual({ remaining: [], cancelled: false });
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
      if (h.calls.length === 7) {
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
    });
    expect(h.calls).toHaveLength(7);
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
      expect(h.calls).toHaveLength(1);
      expect(receive.mock.calls.every(([, u]) => u.kind === 'finding')).toBe(
        true,
      );
      if (replacement) expect(c.getSnapshot().pending).toEqual(replacement);
      else expect(c.getSnapshot().pending).toBeNull();
    },
  );
});
