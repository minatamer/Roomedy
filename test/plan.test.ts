import { CATALOGUE, furnitureSizePresets, footprint } from '@roomedy/spatial';
import { describe, expect, it } from 'vitest';
import {
  nudgePosition,
  planBox,
  planLabelLayout,
  planOpeningLabel,
  fitPlanText,
  planFurnitureName,
  planPreviousLabelVisible,
  pointInPlan,
  snapPosition,
} from '../apps/frontend/src/features/plan-view/adapter.js';
import {
  commandRoom,
  piece,
  door,
  windowFeature,
  known,
  unknown,
} from './fixtures/command-room.js';
import { comparisonFrame } from '../apps/frontend/src/features/session/state.js';
import {
  displayFurnitureFootprint,
  displayFurnitureSize,
} from '../apps/frontend/src/features/catalogue/display-size.js';
describe('precision plan display adapter', () => {
  it('uses shared illustrative bounds without making unknown dimensions usable as fit facts', () => {
    const item = piece('unknown');
    item.dimensions.width = unknown();
    item.dimensions.height = unknown();
    item.pose.quarterTurns = 1;
    const before = JSON.stringify(item),
      entry = CATALOGUE.find((entry) => entry.id === item.catalogueId)!;
    const size = displayFurnitureSize(item)!;
    expect(size.width).toBe(entry.size.width.default);
    expect(size.depth).toBe(item.dimensions.depth.value);
    expect(footprint(item)).toBeUndefined();
    const shown = displayFurnitureFootprint(item)!;
    expect(shown.maxX - shown.minX).toBe(size.depth);
    expect(shown.maxZ - shown.minZ).toBe(size.width);
    const label = planLabelLayout(item, 'Desk ?');
    expect(label.fontSize).toBeGreaterThanOrEqual(110);
    expect(JSON.stringify(item)).toBe(before);
    expect(
      displayFurnitureSize({ ...item, catalogueId: 'unavailable' }),
    ).toBeNull();
  });
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

describe('adaptive whole-word plan labels', () => {
  it.each([0, 1, 2, 3] as const)(
    'keeps wardrobe words whole at turn %s',
    (quarterTurns) => {
      const item = piece('wardrobe', 2000, 2000, {
        width: 1200,
        depth: 600,
        quarterTurns,
      });
      const before = structuredClone(item);
      expect(planLabelLayout(item, 'Wardrobe')).toMatchObject({
        rotation: quarterTurns % 2 ? -90 : 0,
        fontSize: 185,
        lines: ['Wardrobe'],
        outside: false,
      });
      expect(item).toEqual(before);
    },
  );
  it('keeps short names horizontal and wraps whole words to use square space', () => {
    const bed = piece('bed', 2000, 2000, { width: 1600, depth: 2100 });
    expect(planLabelLayout(bed, 'Bed')).toMatchObject({
      rotation: 0,
      fontSize: 185,
    });
    bed.pose.quarterTurns = 1;
    expect(planLabelLayout(bed, 'Bed').rotation).toBe(0);
    const label = fitPlanText('TV stand', 600, 600);
    expect(label.lines).toEqual(['TV', 'stand']);
    expect(label.fontSize).toBeGreaterThan(150);
    expect(label.rotation).toBe(0);
    const shelf = piece('shelf', 2000, 2000, { width: 300, depth: 1000 });
    expect(planLabelLayout(shelf, 'Shelf').rotation).toBe(-90);
  });
  it.each([
    ['Cabinet', 'bedside-storage-fixed', 450, 450],
    ['Mirror', 'full-length-mirror', 650, 60],
    ['TV', 'tv-wall', 1200, 80],
    ['TV', 'tv-tabletop', 1200, 80],
  ])(
    'uses a readable caption for %s (%s), rather than microscopic or overlapping text',
    (name, catalogueId, width, depth) => {
      const item = piece('small', 2000, 2000, {
        catalogueId: String(catalogueId),
        width: Number(width),
        depth: Number(depth),
        quarterTurns: 1,
      });
      const layout = planLabelLayout(item, String(name));
      expect(layout).toMatchObject({
        outside: true,
        rotation: 0,
        fontSize: 135,
        lines: [name],
      });
      expect(Math.abs(layout.x) + Math.abs(layout.y)).toBeGreaterThan(0);
    },
  );
  it('keeps a thin-piece caption beyond its protruding front arrow', () => {
    const mirror = piece('mirror', 2000, 2000, {
      catalogueId: 'full-length-mirror',
      width: 650,
      depth: 60,
    });
    const layout = planLabelLayout(mirror, 'Mirror');
    expect(layout.outside).toBe(true);
    expect(layout.y - (layout.fontSize * 1.15) / 2).toBeGreaterThan(160);
  });
  it('chooses a nearby clear side and never mutates room facts', () => {
    const mirror = piece('mirror', 2000, 2000, {
      catalogueId: 'full-length-mirror',
      width: 650,
      depth: 60,
    });
    const block = piece('block', 2000, 2300, { width: 1200, depth: 500 });
    const room = commandRoom([mirror, block]),
      before = structuredClone(room);
    const layout = planLabelLayout(mirror, 'Mirror', 185, room);
    expect(layout.outside).toBe(true);
    expect(layout.y).toBeLessThan(0);
    expect(planLabelLayout(mirror, 'Mirror', 185, room)).toEqual(layout);
    expect(room).toEqual(before);
    mirror.dimensions.width = unknown();
    const missing = planLabelLayout(mirror, 'Mirror ?', 185, room);
    expect(missing.lines.join(' ')).toContain('?');
    expect(Number.isFinite(missing.x) && Number.isFinite(missing.y)).toBe(true);
    expect(mirror.dimensions.width.value).toBeNull();
  });
  it('keeps catalogue extrema/presets finite, inside the frame and clear of their own footprint', () => {
    let cases = 0;
    for (const entry of CATALOGUE) {
      const sizes = [
        ...(['min', 'default', 'max'] as const).map((key) => ({
          width: entry.size.width[key],
          depth: entry.size.depth[key],
        })),
        ...furnitureSizePresets(entry),
      ];
      for (const size of sizes)
        for (const quarterTurns of [0, 1, 2, 3] as const) {
          const item = piece('item', 5000, 5000, {
            catalogueId: entry.id,
            width: size.width,
            depth: size.depth,
            quarterTurns,
          });
          const room = commandRoom([item]),
            before = structuredClone(room);
          const layout = planLabelLayout(
            item,
            planFurnitureName(item),
            185,
            room,
          );
          const along =
              Math.max(...layout.lines.map((line) => line.length)) *
              layout.fontSize *
              0.6,
            across = layout.lines.length * layout.fontSize * 1.15,
            w = layout.rotation ? across : along,
            d = layout.rotation ? along : across,
            x = item.pose.centerX + layout.x,
            z = item.pose.centerZ + layout.y,
            r = footprint(item)!;
          expect(layout.fontSize).toBeGreaterThanOrEqual(110);
          expect(layout.fontSize).toBeLessThanOrEqual(185);
          expect(x - w / 2).toBeGreaterThanOrEqual(0);
          expect(x + w / 2).toBeLessThanOrEqual(10000);
          expect(z - d / 2).toBeGreaterThanOrEqual(0);
          expect(z + d / 2).toBeLessThanOrEqual(10000);
          if (layout.outside)
            expect(
              x + w / 2 <= r.minX ||
                x - w / 2 >= r.maxX ||
                z + d / 2 <= r.minZ ||
                z - d / 2 >= r.maxZ,
            ).toBe(true);
          else {
            expect(x - w / 2).toBeGreaterThanOrEqual(r.minX);
            expect(x + w / 2).toBeLessThanOrEqual(r.maxX);
            expect(z - d / 2).toBeGreaterThanOrEqual(r.minZ);
            expect(z + d / 2).toBeLessThanOrEqual(r.maxZ);
          }
          expect(room).toEqual(before);
          cases++;
        }
    }
    expect(cases).toBeGreaterThan(300);
  });
  it.each([0, 1, 2, 3] as const)(
    'clamps captions at room corners at turn %s',
    (quarterTurns) => {
      const item = piece('mirror', 5000, 5000, {
        catalogueId: 'full-length-mirror',
        width: 650,
        depth: 60,
        quarterTurns,
      });
      const r = footprint(item)!;
      item.pose.centerX = (r.maxX - r.minX) / 2;
      item.pose.centerZ = (r.maxZ - r.minZ) / 2;
      const room = commandRoom([item]),
        layout = planLabelLayout(item, 'Mirror', 185, room);
      const width = 6 * 135 * 0.6,
        depth = 135 * 1.15;
      expect(item.pose.centerX + layout.x - width / 2).toBeGreaterThanOrEqual(
        0,
      );
      expect(item.pose.centerZ + layout.y - depth / 2).toBeGreaterThanOrEqual(
        0,
      );
    },
  );
});

describe('wall-aligned window captions', () => {
  it.each(['north', 'east', 'south', 'west'] as const)(
    'keeps small and ordinary windows readable at both ends of the %s wall',
    (wall) => {
      for (const width of [300, 1200])
        for (const offset of [0, 10000 - width]) {
          const feature = {
              ...windowFeature(),
              wall,
              width: known(width),
              offset: known(offset),
            },
            room = commandRoom([], [feature]),
            before = structuredClone(room),
            layout = planOpeningLabel(room, feature)!;
          expect(layout.lines).toEqual(['Window']);
          expect(layout.fontSize).toBe(160);
          expect(layout.rotation).toBe(
            wall === 'east' || wall === 'west' ? -90 : 0,
          );
          const halfAlong = (160 * 6 * 0.6) / 2,
            halfAcross = (160 * 1.15) / 2,
            xRadius = layout.rotation ? halfAcross : halfAlong,
            yRadius = layout.rotation ? halfAlong : halfAcross;
          expect(layout.x - xRadius).toBeGreaterThanOrEqual(0);
          expect(layout.x + xRadius).toBeLessThanOrEqual(10000);
          expect(layout.y - yRadius).toBeGreaterThanOrEqual(0);
          expect(layout.y + yRadius).toBeLessThanOrEqual(10000);
          expect(room).toEqual(before);
        }
    },
  );
  it('keeps windows with unknown opening geometry unplaced', () => {
    const feature = windowFeature(),
      room = commandRoom([], [feature]);
    feature.offset = unknown();
    expect(planOpeningLabel(room, feature)).toBeNull();
    feature.offset = known(1000);
    feature.width = unknown();
    expect(planOpeningLabel(room, feature)).toBeNull();
    feature.width = known(1000);
    feature.wall = 'unknown';
    expect(planOpeningLabel(room, feature)).toBeNull();
  });
  it.each(['north', 'east', 'south', 'west'] as const)(
    'uses the clear frame margin when furniture covers the %s window caption',
    (wall) => {
      const feature = { ...windowFeature(), wall },
        item = piece(
          'near-window',
          wall === 'west' ? 500 : wall === 'east' ? 9500 : 1500,
          wall === 'north' ? 500 : wall === 'south' ? 9500 : 1500,
          { width: 1000, depth: 1000 },
        ),
        room = commandRoom([item], [feature]),
        before = structuredClone(room),
        label = planOpeningLabel(room, feature)!;
      expect(label.outside).toBe(true);
      expect(label.x).toBeGreaterThan(-500);
      expect(label.y).toBeGreaterThan(-500);
      expect(label.x).toBeLessThan(10500);
      expect(label.y).toBeLessThan(10500);
      expect(
        wall === 'west'
          ? label.x < -180
          : wall === 'east'
            ? label.x > 10000
            : wall === 'north'
              ? label.y < -170
              : label.y > 10000,
      ).toBe(true);
      expect(room).toEqual(before);
    },
  );
});

describe('purpose-aware door captions', () => {
  it.each(['north', 'east', 'south', 'west'] as const)(
    'names only the actual door on the %s wall for every mechanism/purpose',
    (wall) => {
      for (const mechanism of [
        'inward',
        'outward',
        'sliding',
        'unknown',
      ] as const)
        for (const purpose of [undefined, 'room', 'bathroom'] as const) {
          const feature = {
              ...door(),
              wall,
              mechanism,
              ...(purpose ? { purpose } : {}),
            },
            room = commandRoom([], [feature]),
            before = structuredClone(room),
            layout = planOpeningLabel(room, feature)!;
          expect(layout.lines.join(' ')).toBe(
            purpose === 'bathroom' ? 'Bathroom Door' : 'Door',
          );
          expect(layout.fontSize).toBeGreaterThan(100);
          expect(layout.fontSize).toBeLessThanOrEqual(160);
          expect(layout.x).toBeGreaterThan(0);
          expect(layout.x).toBeLessThan(10000);
          expect(layout.y).toBeGreaterThan(0);
          expect(layout.y).toBeLessThan(10000);
          expect(room).toEqual(before);
        }
    },
  );
  it('wraps Bathroom Door and preserves unknown geometry instead of inventing a position', () => {
    const feature = { ...door(), purpose: 'bathroom' as const },
      room = commandRoom([], [feature]);
    expect(planOpeningLabel(room, feature)?.lines).toEqual([
      'Bathroom',
      'Door',
    ]);
    feature.offset = unknown();
    expect(planOpeningLabel(room, feature)).toBeNull();
    feature.offset = structuredClone(door().offset);
    feature.width = unknown();
    expect(planOpeningLabel(room, feature)).toBeNull();
    feature.width = structuredClone(door().width);
    feature.wall = 'unknown';
    expect(planOpeningLabel(room, feature)).toBeNull();
  });
});

it('keeps previous-position text from crossing proposed furniture or door names', () => {
  const previous = piece('old', 9650, 650),
    moved = piece('old', 4000, 4000);
  expect(planPreviousLabelVisible(commandRoom([moved]), previous)).toBe(true);
  const overlapping = piece('new', 9650, 650);
  expect(
    planPreviousLabelVisible(commandRoom([moved, overlapping]), previous),
  ).toBe(false);
  const opening = {
    ...door(),
    wall: 'east' as const,
    offset: known(200),
    purpose: 'bathroom' as const,
  };
  expect(
    planPreviousLabelVisible(commandRoom([moved], [opening]), previous),
  ).toBe(false);
  expect(previous.pose.centerX).toBe(9650);
});
