import { describe, expect, it } from 'vitest';
import {
  nudgePosition,
  planBox,
  pointInPlan,
  snapPosition,
} from '../apps/frontend/src/features/plan-view/adapter.js';
import { commandRoom, piece } from './fixtures/command-room.js';
import { comparisonFrame } from '../apps/frontend/src/features/session/state.js';
describe('precision plan display adapter', () => {
  it('compares different recorded room sizes at one world scale and centre', () => {
    const before = commandRoom(),
      current = structuredClone(before);
    before.room.width.value = 4200;
    before.room.depth.value = 4800;
    current.room.width.value = 2000;
    current.room.depth.value = 3000;
    const view = { zoom: 1, panX: 0, panZ: 0 };
    const frame = comparisonFrame({ current, baseline: before });
    const currentBox = planBox(current, view, frame),
      beforeBox = planBox(before, view, frame);
    expect(currentBox).toEqual({ x: -500, z: -500, width: 5200, depth: 5800 });
    expect(currentBox).toEqual(beforeBox);
    const rect = { left: 10, top: 20, width: 520, height: 580 };
    expect(pointInPlan({ x: 210, y: 220 }, rect, currentBox)).toEqual(
      pointInPlan({ x: 210, y: 220 }, rect, beforeBox),
    );
  });
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

describe('dragged furniture stays against the intended physical room edge', () => {
  for (const turns of [0, 1, 2, 3] as const)
    for (const snap of [false, true])
      it(`clamps every outward corner at turn ${turns}, snap ${snap}`, () => {
        const item = piece('odd', 2000, 2500, {
          width: 1501,
          depth: 601,
          quarterTurns: turns,
        });
        const room = commandRoom([item]),
          before = JSON.stringify(room);
        const xRadius = turns % 2 ? 300.5 : 750.5;
        const zRadius = turns % 2 ? 750.5 : 300.5;
        for (const x of [-20000, 20000])
          for (const z of [-20000, 20000])
            expect(snapPosition(room, item, { x, z }, snap)).toEqual({
              x: x < 0 ? xRadius : 10000 - xRadius,
              z: z < 0 ? zRadius : 10000 - zRadius,
            });
        expect(JSON.stringify(room)).toBe(before);
      });
  it('clamps a crossed edge without losing precision on the other axis or inventing unknown bounds', () => {
    const item = piece('a'),
      room = commandRoom([item]);
    expect(snapPosition(room, item, { x: -5000, z: 2300.25 }, false)).toEqual({
      x: 600,
      z: 2300.5,
    });
    room.room.width = { value: null, status: 'unknown', sourceId: null };
    expect(snapPosition(room, item, { x: -5000, z: 20000 }, false)).toEqual({
      x: -5000,
      z: 9700,
    });
    item.dimensions.width = { value: null, status: 'unknown', sourceId: null };
    expect(snapPosition(room, item, { x: -5000, z: 20000 }, true)).toEqual({
      x: -5000,
      z: 20000,
    });
  });
  it('leaves an impossible footprint for shared validation instead of resizing or reversing its interval', () => {
    const item = piece('wide', 2000, 2000, { width: 12000 }),
      room = commandRoom([item]);
    expect(snapPosition(room, item, { x: 12000, z: -5000 }, false)).toEqual({
      x: 12000,
      z: 300,
    });
    expect(item.dimensions.width.value).toBe(12000);
  });
});
