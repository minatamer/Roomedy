import { afterEach, describe, expect, it } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  destinationHref,
  projectDestination,
} from '../apps/frontend/src/features/cost/navigation.js';
import {
  explainCost,
  targetExists,
  targetKey,
} from '../apps/frontend/src/features/cost/state.js';
import {
  inspectionPose,
  inspectionVisible,
} from '../apps/frontend/src/features/room-view/inspection.js';
import { calculateRoomEstimate } from '@roomedy/spatial';
const owned: SessionController[] = [];
function session() {
  const c = new SessionController(createRoomFixture('sample'));
  owned.push(c);
  return c;
}
afterEach(() => {
  owned.forEach((c) => c.dispose());
  owned.length = 0;
});
describe('one project Design / Plan & cost', () => {
  it('preserves accepted design, history, view, conversation and pricing across phase changes', () => {
    const c = session();
    c.setRoomView('plan');
    const piece = c.getSnapshot().workspace!.current.furniture[0]!;
    expect(
      c.dispatch([{ type: 'finish', id: piece.id, finish: 'sage' }], 'Finish')
        .ok,
    ).toBe(true);
    const accepted = c.getSnapshot().workspace;
    expect(c.setDestination('cost')).toBe(true);
    c.costMessage('visitor', 'Explain floor packs');
    const d = c.getSnapshot().cost!;
    const settings = structuredClone(d.settings);
    settings.floor.wasteBps = 2000;
    expect(c.updateCost(settings)).toBe(true);
    c.setDestination('design');
    c.setDestination('cost');
    expect(c.getSnapshot().workspace).toBe(accepted);
    expect(c.getSnapshot().presentation.roomView).toBe('plan');
    expect(c.getSnapshot().cost!.settings.floor.wasteBps).toBe(2000);
    expect(c.getSnapshot().cost!.messages).toMatchObject([
      { role: 'visitor', text: 'Explain floor packs' },
    ]);
    expect(c.undo().ok).toBe(true);
  });
  it('fences pending work, rejects leaving a preview and keeps malformed prices atomic', () => {
    const c = session();
    c.setDestination('cost');
    const token = c.beginOperation()!;
    expect(c.isCurrent(token)).toBe(true);
    c.setDestination('design');
    expect(c.isCurrent(token)).toBe(false);
    c.setDestination('cost');
    const draft = c.getSnapshot().cost;
    expect(
      c.updateCost({
        ...draft!.settings,
        locality: { ...draft!.settings.locality, currency: 'USD' },
      }),
    ).toBe(false);
    expect(c.getSnapshot().cost).toBe(draft);
    const p = c.getSnapshot().workspace!.current.furniture[0]!;
    expect(
      c.prepareVisitorPreview(
        [{ type: 'finish', id: p.id, finish: 'sage' }],
        'Sage',
      ).ok,
    ).toBe(true);
    const preview = c.getSnapshot().candidate;
    expect(c.setDestination('design')).toBe(false);
    expect(c.getSnapshot().candidate).toBe(preview);
    c.cancelPreview();
    expect(c.setDestination('design')).toBe(true);
  });
  it('reconciles deleted furniture and restores its scope on design Undo without inventing selected IDs', () => {
    const c = session();
    c.setDestination('cost');
    const room = c.getSnapshot().workspace!.current,
      p = room.furniture[0]!;
    expect(
      c.dispatch([{ type: 'remove', id: p.id, overrideLocks: true }], 'Remove')
        .ok,
    ).toBe(true);
    const current = c.getSnapshot().workspace!.current,
      d = c.getSnapshot().cost!;
    expect(d.settings.furniture.some((f) => f.id === p.id)).toBe(false);
    expect(targetExists(current, p.id)).toBe(false);
    expect(calculateRoomEstimate(current, d.settings, d.offers).ok).toBe(true);
    c.undo();
    expect(
      c.getSnapshot().cost!.settings.furniture.some((f) => f.id === p.id),
    ).toBe(true);
  });
  it('bounds conversation and clears all cost data on reset/disposal', () => {
    const c = session();
    c.setDestination('cost');
    for (let i = 0; i < 45; i++) c.costMessage('visitor', `Message ${i}`);
    expect(c.getSnapshot().cost!.messages).toHaveLength(40);
    expect(c.costMessage('assistant', 'x'.repeat(4001))).toBe(false);
    c.reset(createRoomFixture('empty'));
    expect(c.getSnapshot()).toMatchObject({
      destination: 'design',
      cost: null,
    });
    c.setDestination('cost');
    c.dispose();
    expect(c.getSnapshot()).toMatchObject({
      cost: null,
      destination: 'design',
      workspace: null,
    });
    expect(c.costMessage('visitor', 'late')).toBe(false);
  });
  it('enforces expiry at every cost entry and a UTF-8 conversation byte ceiling', () => {
    let now = 0;
    const c = new SessionController(createRoomFixture('sample'), {
      now: () => now,
    });
    owned.push(c);
    c.setDestination('cost');
    for (let i = 0; i < 40; i++) c.costMessage('visitor', '界'.repeat(4000));
    expect(
      new TextEncoder().encode(
        c
          .getSnapshot()
          .cost!.messages.map((m) => m.text)
          .join(''),
      ).byteLength,
    ).toBeLessThanOrEqual(131072);
    now = c.getSnapshot().expiresAt;
    expect(c.setDestination('design')).toBe(false);
    expect(c.getSnapshot()).toMatchObject({
      phase: 'expired',
      cost: null,
      workspace: null,
    });
    expect(c.costMessage('visitor', 'late')).toBe(false);
  });
  it('explains actual selected lines with transparent sample quantities', () => {
    const c = session();
    c.setDestination('cost');
    const d = c.getSnapshot().cost!,
      room = c.getSnapshot().workspace!.current;
    const r = calculateRoomEstimate(room, d.settings, d.offers);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(explainCost(r.estimate, 'flooring', null)).toContain('pack');
    expect(targetKey({ kind: 'surface', surface: 'south' })).toBe(
      'surface:south',
    );
    expect(targetKey({ kind: 'room', id: room.roomId })).toBeNull();
    expect(targetExists(room, 'surface:east')).toBe(true);
    expect(targetExists(room, 'surface:roof')).toBe(false);
  });
});
describe('inspection framing / native URL state', () => {
  it('uses a reversible URL destination without dropping entry parameters or hash', () => {
    expect(
      destinationHref('/demo?start=manual&condition=empty#room', 'cost'),
    ).toBe('/demo?start=manual&condition=empty&phase=cost#room');
    expect(destinationHref('/demo?start=photos&phase=cost', 'design')).toBe(
      '/demo?start=photos',
    );
    expect(projectDestination('?phase=cost')).toBe('cost');
    expect(projectDestination('?phase=evil')).toBe('design');
  });
  it('isolates only actual targets and keeps camera output finite without mutating geometry', () => {
    const room = createRoomFixture('sample'),
      before = structuredClone(room);
    const p = room.furniture[0]!;
    expect(inspectionVisible({ target: p.id, isolated: true }, p.id)).toBe(
      true,
    );
    expect(
      inspectionVisible({ target: p.id, isolated: true }, 'surface:floor'),
    ).toBe(false);
    expect(
      inspectionVisible({ target: null, isolated: true }, 'surface:floor'),
    ).toBe(true);
    for (const target of [
      p.id,
      'surface:floor',
      'surface:north',
      'surface:south',
      'surface:east',
      'surface:west',
    ]) {
      const pose = inspectionPose(room, { target, isolated: true });
      expect(pose).not.toBeNull();
      expect(
        [...pose!.position, ...pose!.target, pose!.zoom].every(Number.isFinite),
      ).toBe(true);
    }
    expect(inspectionPose(room, { target: 'gone', isolated: true })).toBeNull();
    expect(room).toEqual(before);
  });
});
