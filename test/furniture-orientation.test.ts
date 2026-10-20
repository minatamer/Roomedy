import { expect, it } from 'vitest';
import {
  preferredFurnitureFacing,
  backWallGap,
  LayoutSearch,
  evaluateScopedBatch,
  checkRoom,
} from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { piece, known, unknown } from './fixtures/command-room.js';
import { goal, request, scopeFor } from './fixtures/search-corpus.js';

it.each([
  [2100, 350, 0],
  [3850, 2400, 1],
  [2100, 4450, 2],
  [350, 2400, 3],
] as const)('faces a new wardrobe into the room at %s,%s', (x, z, q) => {
  const room = createRoomFixture('empty');
  room.room.features = [];
  const item = piece('new', x, z, {
    catalogueId: 'wardrobe-hinged',
    width: 1200,
    depth: 600,
    height: 2100,
  });
  const original = JSON.stringify({ room, item });
  expect(preferredFurnitureFacing(room, item)).toBe(q);
  const suggested = { ...item, pose: { ...item.pose, quarterTurns: q } };
  expect(backWallGap(room, suggested)).toBe(50);
  expect(
    checkRoom({ ...room, furniture: [suggested] }).issues.filter(
      (i) => i.rule === 'front-access' && i.severity !== 'unassessed',
    ),
  ).toEqual([]);
  expect(JSON.stringify({ room, item })).toBe(original);
});

it('prefers clear access over backing when another piece blocks the intended front', () => {
  const room = createRoomFixture('empty');
  room.room.features = [];
  room.furniture = [piece('obstacle', 2200, 2400, { width: 400, depth: 600 })];
  const item = piece('new', 3100, 2400, {
    catalogueId: 'wardrobe-hinged',
    quarterTurns: 1,
  });
  // South-facing body begins at X2500, beyond the obstacle's X2400 edge.
  expect(item.pose.centerX - 1200 / 2).toBeGreaterThan(2200 + 400 / 2);
  expect(preferredFurnitureFacing(room, item)).toBe(0);
});

it('prefers an orientation with no solid overlap before a closer back wall', () => {
  const room = createRoomFixture('empty');
  room.room.features = [];
  room.furniture = [piece('other', 2100, 1800, { width: 500, depth: 500 })];
  const item = piece('new', 2100, 2400);
  expect(preferredFurnitureFacing(room, item)).toBe(0);
});

it('faces a chair toward the desk while keeping pull-out behind its front', () => {
  const room = createRoomFixture('empty');
  room.room.features = [];
  room.furniture = [piece('desk', 2100, 2000)];
  const chair = piece('chair', 2100, 2700, {
    catalogueId: 'procedural-chair',
    width: 550,
    depth: 550,
  });
  expect(preferredFurnitureFacing(room, chair)).toBe(2);
  const suggested = {
    ...chair,
    pose: { ...chair.pose, quarterTurns: 2 as const },
  };
  expect(backWallGap(room, suggested)).toBeNull();
  expect(
    checkRoom({
      ...room,
      furniture: [...room.furniture, suggested],
    }).issues.filter(
      (i) => i.rule === 'front-access' && i.severity !== 'unassessed',
    ),
  ).toEqual([]);
});

it('does not rotate protected or unknown poses or invent missing dimensions', () => {
  const room = createRoomFixture('empty');
  const item = piece('new', 3850, 2400, {
    catalogueId: 'wardrobe-hinged',
    quarterTurns: 3,
  });
  item.locks.rotation = true;
  expect(preferredFurnitureFacing(room, item)).toBe(3);
  item.locks.rotation = false;
  item.pose.provenance = { status: 'unknown', sourceId: null };
  expect(preferredFurnitureFacing(room, item)).toBe(3);
  expect(backWallGap(room, item)).toBeNull();
  item.pose.provenance = { status: 'planned', sourceId: 'visitor-plan' };
  room.room.width = unknown();
  expect(preferredFurnitureFacing(room, item)).toBe(3);
  expect(backWallGap(room, item)).toBeNull();
  room.room.width = known(4200);
  item.dimensions.depth = unknown();
  expect(preferredFurnitureFacing(room, item)).toBe(3);
});

it.each(['partial', 'sample'] as const)(
  'starts %s with the wardrobe backed to the east and front west, without access conflicts',
  (kind) => {
    const room = createRoomFixture(kind);
    const wardrobe = room.furniture.find((p) => p.id === 'wardrobe_1')!;
    expect(wardrobe.pose).toMatchObject({
      centerX: 3850,
      centerZ: 3200,
      quarterTurns: 1,
    });
    expect(wardrobe.pose.centerX + wardrobe.dimensions.depth.value! / 2).toBe(
      4150,
    );
    expect(
      checkRoom(room).issues.filter(
        (i) => i.rule === 'front-access' && i.severity !== 'unassessed',
      ),
    ).toEqual([]);
  },
);

function run(input: ReturnType<typeof request>) {
  const search = new LayoutSearch(input, scopeFor(input.room, input.goal));
  while (!search.step()) {}
  return search.finish();
}
it.each(['wardrobe-hinged', 'procedural-storage'] as const)(
  'places AI-added %s with wall backing and clear access, preserving unrelated pieces',
  (catalogueId) => {
    const room = createRoomFixture('empty');
    room.furniture = [
      piece('retained', 900, 1300, {
        catalogueId: 'procedural-bed',
        width: 1600,
        depth: 2100,
        height: 850,
      }),
    ];
    const original = JSON.stringify(room);
    const selected = goal({
      kind: 'furnish',
      retainedIds: ['retained'],
      additions: [{ id: 'new', catalogueId, size: null, finish: 'oak' }],
    });
    const input = request(room, selected, 500),
      result = run(input);
    expect(result.candidate).not.toBeNull();
    expect(run(input)).toEqual(result);
    expect(result.visitedNodes).toBeLessThanOrEqual(500);
    const evaluated = evaluateScopedBatch(
      room,
      result.candidate!.actions,
      scopeFor(room, selected),
    );
    expect(evaluated.ok).toBe(true);
    if (!evaluated.ok) throw new Error('fixture');
    const added = evaluated.room.furniture.find((p) => p.id === 'new')!;
    expect(backWallGap(evaluated.room, added)).toBe(0);
    expect(
      evaluated.checks.issues.filter(
        (i) =>
          i.rule === 'front-access' &&
          i.objectIds.includes('new') &&
          i.severity !== 'unassessed',
      ),
    ).toEqual([]);
    expect(evaluated.room.furniture.find((p) => p.id === 'retained')).toEqual(
      room.furniture[0],
    );
    expect(added.pose.provenance.status).toBe('planned');
    expect(JSON.stringify(room)).toBe(original);
  },
);

it('respects a fixed rotation while finding a useful back-wall placement', () => {
  const room = createRoomFixture('empty');
  room.room.features = [];
  const wardrobe = piece('wardrobe', 2100, 2400, {
    catalogueId: 'wardrobe-hinged',
    quarterTurns: 3,
  });
  wardrobe.locks.rotation = true;
  room.furniture = [wardrobe];
  const selected = goal({ kind: 'open-space', targetIds: ['wardrobe'] });
  const result = run(request(room, selected, 500));
  expect(result.candidate).not.toBeNull();
  const evaluated = evaluateScopedBatch(
    room,
    result.candidate!.actions,
    scopeFor(room, selected),
  );
  expect(evaluated.ok).toBe(true);
  if (!evaluated.ok) throw new Error('fixture');
  expect(evaluated.room.furniture[0]!.pose.quarterTurns).toBe(3);
  expect(evaluated.room.furniture[0]!.locks).toEqual(wardrobe.locks);
  expect(evaluated.room.furniture[0]!.pose.centerX).toBe(300);
});
