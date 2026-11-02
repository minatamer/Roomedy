import { describe, expect, it } from 'vitest';
import { CATALOGUE, visitorCatalogueFurniture } from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { cataloguePoint } from '../apps/frontend/src/features/room-view/catalogue-point.js';

const entry = CATALOGUE.find((e) => e.id === 'mirror-wall')!;
const item = visitorCatalogueFurniture(
  entry,
  { width: 700, depth: 70 },
  { centerX: 2100, centerZ: 2400, quarterTurns: 0 },
  'wall-test',
);
const room = createRoomFixture('empty');
describe('wall catalogue projection', () => {
  it.each([
    [{ x: 2.1, y: 1.4, z: 2.4 }, { x: 0, y: 0, z: -1 }, 0, { x: 2100, z: 0 }],
    [{ x: 2.1, y: 1.4, z: 2.4 }, { x: 1, y: 0, z: 0 }, 1, { x: 4200, z: 2400 }],
    [{ x: 2.1, y: 1.4, z: 2.4 }, { x: 0, y: 0, z: 1 }, 2, { x: 2100, z: 4800 }],
    [{ x: 2.1, y: 1.4, z: 2.4 }, { x: -1, y: 0, z: 0 }, 3, { x: 0, z: 2400 }],
  ] as const)(
    'hits the interior wall with inward facing %s %s',
    (origin, direction, quarterTurns, point) => {
      expect(cataloguePoint({ origin, direction }, room, item, entry)).toEqual({
        ...point,
        bottomY: 900,
        quarterTurns,
      });
    },
  );
  it('skips the front cutaway wall and uses the visible wall rather than the floor behind it', () => {
    expect(
      cataloguePoint(
        { origin: { x: 2.1, y: 4, z: 8 }, direction: { x: 0, y: -0.4, z: -1 } },
        room,
        item,
        entry,
      ),
    ).toEqual({ x: 2100, z: 0, bottomY: 300, quarterTurns: 0 });
  });
  it('clamps snapped elevation after rounding for non-grid ceiling heights', () => {
    const low = structuredClone(room);
    low.room.height.value = 2527;
    expect(
      cataloguePoint(
        {
          origin: { x: 2.1, y: 2.52, z: 2.4 },
          direction: { x: 0, y: 0, z: -1 },
        },
        low,
        item,
        entry,
      )?.bottomY,
    ).toBe(1527);
  });
  it.each([
    { origin: { x: 2, y: 4, z: 8 }, direction: { x: 0, y: 0, z: -1 } },
    { origin: { x: 2, y: 4, z: 8 }, direction: { x: 0, y: 1, z: 0 } },
    { origin: { x: Infinity, y: 1, z: 2 }, direction: { x: 0, y: 0, z: -1 } },
  ])('rejects rays that cannot hit a visible room wall: %j', (ray) => {
    expect(cataloguePoint(ray, room, item, entry)).toBeNull();
  });
  it('retains floor projection for floor and ceiling fixtures', () => {
    for (const id of ['mirror-standing', 'ceiling-pendant']) {
      const floor = CATALOGUE.find((e) => e.id === id)!;
      expect(floor).toBeDefined();
      expect(
        cataloguePoint(
          { origin: { x: 2, y: 3, z: 2 }, direction: { x: 0, y: -1, z: 0 } },
          room,
          item,
          floor,
        ),
      ).toEqual({ x: 2000, z: 2000 });
    }
  });
});
