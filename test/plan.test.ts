import { describe, expect, it } from 'vitest';
import {
  nudgePosition,
  planBox,
  pointInPlan,
  snapPosition,
} from '../apps/frontend/src/features/plan-view/adapter.js';
import { commandRoom, piece } from './fixtures/command-room.js';
describe('precision plan display adapter', () => {
  it('maps letterboxed and scaled/panned SVG coordinates without changing semantic units', () => {
    const box = { x: 100, z: 200, width: 4000, depth: 2000 };
    expect(
      pointInPlan(
        { x: 260, y: 270 },
        { left: 10, top: 20, width: 500, height: 500 },
        box,
      ),
    ).toEqual({ x: 2100, z: 1200 });
    expect(
      pointInPlan(
        { x: 10, y: 145 },
        { left: 10, top: 20, width: 500, height: 500 },
        box,
      ),
    ).toEqual({ x: 100, z: 200 });
    const room = commandRoom([]),
      view = planBox(room, { zoom: 2, panX: 500, panZ: -250 });
    expect(view.x + view.width / 2).toBe(room.room.width.value! / 2 + 500);
    expect(view.z + view.depth / 2).toBe(room.room.depth.value! / 2 - 250);
  });
  it.each([0, 1, 2, 3] as const)(
    'preserves odd-size half-mm wall contact at quarter-turn %s',
    (turns) => {
      const item = piece('odd');
      item.dimensions.width.value = 1501;
      item.dimensions.depth.value = 601;
      item.pose.quarterTurns = turns;
      const room = commandRoom([item]);
      const halfWidth = turns % 2 ? 300.5 : 750.5;
      expect(
        snapPosition(room, item, { x: halfWidth + 12, z: 2500 }, true),
      ).toEqual({ x: halfWidth, z: 2500 });
      expect(nudgePosition(item, 'ArrowRight', false, true).centerX).toBe(
        item.pose.centerX + 0.5,
      );
    },
  );
  it('snaps to exact neighboring edges, while free movement rounds only to the half-mm lattice', () => {
    const a = piece('a', 2000),
      b = piece('b', 5000),
      room = commandRoom([a, b]);
    // Fixture desks are 1000 mm wide: target a centre=4000 contacts b's west edge.
    a.dimensions.width.value = 1000;
    b.dimensions.width.value = 1000;
    expect(snapPosition(room, a, { x: 3988, z: 2000 }, true).x).toBe(4000);
    expect(snapPosition(room, a, { x: 3988.27, z: 2000.24 }, false)).toEqual({
      x: 3988.5,
      z: 2000,
    });
    expect(nudgePosition(a, 'ArrowDown', true).centerZ).toBe(2100);
  });
});
