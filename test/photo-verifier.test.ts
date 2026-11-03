import { expect, it } from 'vitest';
import { planPhotoPlacement } from '../apps/frontend/src/features/room-intake/photo-layout';
import {
  createDraft,
  draftFurniture,
} from '../apps/frontend/src/features/room-intake/draft';
import { displayFurnitureFootprint } from '../apps/frontend/src/features/catalogue/display-size';
import {
  findCatalogueEntry,
  footprint,
  furnitureBottom,
  intersection,
  localFront,
  planningRoom,
  verticallySeparate,
  wallBand,
} from '@roomedy/spatial';
import { known, unknown } from './fixtures/command-room';
import type { Furniture, RoomDocument } from '@roomedy/contracts/room';

function scene(
  ids = [
    'procedural-bed',
    'bedside-drawers',
    'procedural-desk',
    'chair-desk-fixed',
    'wardrobe-mirrored',
    'mirror-standing',
    'mirror-wall',
    'floor-lamp',
    'ceiling-pendant',
    'ceiling-track',
  ],
) {
  const draft = createDraft('furnished', 'layout-regression');
  draft.room.furniture = ids.map((id, index) => {
    const p = draftFurniture(draft, id, `piece_${index}`, true)!;
    p.dimensions = { width: unknown(), depth: unknown(), height: unknown() };
    p.pose = {
      ...p.pose,
      centerX: 2100,
      centerZ: 2400,
      provenance: { status: 'estimated', sourceId: 'draft-estimate' },
    };
    const entry = findCatalogueEntry(id, p.catalogueVersion)!;
    if (entry.placement === 'wall')
      Object.assign(p.pose, {
        bottomY: 900,
        provenance: { status: 'planned', sourceId: 'photo-mount-plan' },
      });
    if (entry.placement === 'ceiling')
      Object.assign(p.pose, {
        bottomY: id === 'ceiling-track' ? 2380 : 2100,
        provenance: { status: 'planned', sourceId: 'photo-mount-plan' },
      });
    return p;
  });
  return draft.room;
}
const ids = (room: RoomDocument) => room.furniture.map((p) => p.id);
const entry = (p: Furniture) =>
  findCatalogueEntry(p.catalogueId, p.catalogueVersion)!;
const get = (room: RoomDocument, id: string) =>
  room.furniture.find((p) => p.catalogueId === id)!;
function nearestEdge(room: RoomDocument, p: Furniture) {
  const b = displayFurnitureFootprint(p)!;
  return Math.min(
    b.minX,
    b.minZ,
    (room.room.width.value ?? 4200) - b.maxX,
    (room.room.depth.value ?? 4800) - b.maxZ,
  );
}
function assertClear(room: RoomDocument) {
  const proxy = planningRoom(room);
  for (const p of proxy.furniture) {
    const b = footprint(p)!;
    expect(b.minX).toBeGreaterThanOrEqual(0);
    expect(b.minZ).toBeGreaterThanOrEqual(0);
    expect(b.maxX).toBeLessThanOrEqual(proxy.room.width.value!);
    expect(b.maxZ).toBeLessThanOrEqual(proxy.room.depth.value!);
    for (const other of proxy.furniture)
      if (other.id !== p.id && !verticallySeparate(p, other))
        expect(intersection(b, footprint(other)!)).toBeUndefined();
    for (const f of proxy.room.features) {
      if (f.kind === 'door' && furnitureBottom(p) === 0)
        expect(
          intersection(b, wallBand(proxy, f, Math.max(600, f.width.value!))!),
        ).toBeUndefined();
      if (f.kind === 'window' && entry(p).category === 'wardrobe')
        expect(intersection(b, wallBand(proxy, f, 100)!)).toBeUndefined();
    }
  }
}

it('repairs a complete overlapping scan with unmeasured openings, without changing detected facts or inventory', () => {
  const room = scene();
  room.room.features = [
    {
      id: 'exit',
      kind: 'door',
      wall: 'south',
      wallProvenance: { status: 'estimated', sourceId: 'photo' },
      width: unknown(),
      offset: unknown(),
      height: unknown(),
      sill: unknown(),
      mechanism: 'unknown',
      mechanismProvenance: { status: 'unknown', sourceId: null },
      hinge: 'unknown',
      hingeProvenance: { status: 'unknown', sourceId: null },
    },
    {
      id: 'daylight',
      kind: 'window',
      wall: 'east',
      wallProvenance: { status: 'estimated', sourceId: 'photo' },
      width: unknown(),
      offset: unknown(),
      height: unknown(),
      sill: unknown(),
      mechanism: 'unknown',
      mechanismProvenance: { status: 'unknown', sourceId: null },
    },
  ];
  const before = structuredClone(room),
    result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  expect(result.adjusted.length).toBeGreaterThan(0);
  assertClear(result.room);
  expect(result.room.room).toEqual(before.room);
  expect(result.room.furniture.map(({ pose: _pose, ...p }) => p)).toEqual(
    before.furniture.map(({ pose: _pose, ...p }) => p),
  );
  for (const id of ['mirror-standing', 'floor-lamp', 'wardrobe-mirrored'])
    expect(nearestEdge(result.room, get(result.room, id))).toBeLessThanOrEqual(
      50,
    );
  expect(nearestEdge(result.room, get(result.room, 'mirror-wall'))).toBe(0);
  expect(get(result.room, 'mirror-wall').pose.bottomY).toBe(900);
  const desk = get(result.room, 'procedural-desk'),
    chair = get(result.room, 'chair-desk-fixed');
  const [fx, fz] = localFront(desk.pose.quarterTurns);
  expect(chair.pose.quarterTurns).toBe((desk.pose.quarterTurns + 2) % 4);
  expect(
    (chair.pose.centerX - desk.pose.centerX) * fx +
      (chair.pose.centerZ - desk.pose.centerZ) * fz,
  ).toBeGreaterThan(0);
  expect(fx ? chair.pose.centerZ : chair.pose.centerX).toBe(
    fx ? desk.pose.centerZ : desk.pose.centerX,
  );
  expect(room).toEqual(before);
});

it.each([0, 1, 2, 3] as const)(
  'moves a wardrobe away from the doorway and window at quarter-turn %s',
  (turn) => {
    const room = scene(['wardrobe-mirrored']);
    const p = room.furniture[0]!;
    p.pose = {
      ...p.pose,
      centerX: [2100, 3850, 2100, 350][turn]!,
      centerZ: [350, 2400, 4450, 2400][turn]!,
      quarterTurns: turn,
    };
    const wall = (['north', 'east', 'south', 'west'] as const)[turn];
    room.room.features = [
      {
        id: 'exit',
        kind: 'door',
        wall,
        wallProvenance: { status: 'estimated', sourceId: 'photo' },
        width: known(900),
        offset: known(turn % 2 ? 1950 : 1650),
        height: known(2100),
        sill: known(0),
        mechanism: 'inward',
        mechanismProvenance: { status: 'estimated', sourceId: 'photo' },
        hinge: 'left',
        hingeProvenance: { status: 'estimated', sourceId: 'photo' },
      },
      {
        id: 'glass',
        kind: 'window',
        wall,
        wallProvenance: { status: 'estimated', sourceId: 'photo' },
        width: known(1200),
        offset: known(0),
        height: known(1200),
        sill: known(900),
        mechanism: 'fixed',
        mechanismProvenance: { status: 'estimated', sourceId: 'photo' },
      },
    ];
    const result = planPhotoPlacement(room, ids(room), new Map([[p.id, wall]]));
    expect(result.unresolved).toEqual([]);
    assertClear(result.room);
    expect(
      nearestEdge(result.room, result.room.furniture[0]!),
    ).toBeLessThanOrEqual(50);
  },
);

it.each(['procedural-bed', 'procedural-desk'])(
  'allows a %s below a window and keeps its nearby scan placement',
  (id) => {
    const room = scene([id]);
    const p = room.furniture[0]!;
    Object.assign(p.pose, {
      centerX: 2100,
      centerZ: id === 'procedural-bed' ? 1100 : 350,
    });
    room.room.features = [
      {
        id: 'glass',
        kind: 'window',
        wall: 'north',
        wallProvenance: { status: 'estimated', sourceId: 'photo' },
        width: known(2000),
        offset: known(1100),
        height: known(1200),
        sill: known(900),
        mechanism: 'fixed',
        mechanismProvenance: { status: 'estimated', sourceId: 'photo' },
      },
    ];
    const result = planPhotoPlacement(
      room,
      ids(room),
      new Map([[p.id, 'north']]),
    );
    expect(result.unresolved).toEqual([]);
    expect(result.room.furniture[0]!.pose).toEqual(p.pose);
  },
);

it('rechecks source-paired photo plans rather than letting them block the whole repair', () => {
  const room = scene([
    'procedural-bed',
    'bedside-drawers',
    'mirror-standing',
    'floor-lamp',
  ]);
  for (const p of room.furniture)
    p.pose.provenance = { status: 'planned', sourceId: 'photo-relation-plan' };
  const result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  assertClear(result.room);
  for (const p of result.room.furniture)
    expect(nearestEdge(result.room, p)).toBeLessThanOrEqual(50);
});

it('preserves a deliberate locked pose and measured axes, and is deterministic and idempotent', () => {
  const room = scene([
    'procedural-bed',
    'procedural-desk',
    'chair-desk-fixed',
    'floor-lamp',
  ]);
  const fixed = room.furniture[0]!;
  Object.assign(fixed.pose, {
    centerX: 1100,
    centerZ: 1100,
    provenance: { status: 'planned', sourceId: 'visitor-plan' },
  });
  fixed.locks.position = true;
  fixed.dimensions.width = known(1700);
  const before = structuredClone(fixed),
    result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  expect(result.room.furniture[0]).toEqual(before);
  expect(planPhotoPlacement(room, ids(room))).toEqual(result);
  expect(planPhotoPlacement(result.room, ids(room)).room).toEqual(result.room);
  expect(planPhotoPlacement(room, []).room).toBe(room);
});

it.each(['small-room', 'unlocatable-obstacle'] as const)(
  'retains the entire original inventory when repair is impossible: %s',
  (reason) => {
    const room = scene([
      'procedural-bed',
      'wardrobe-mirrored',
      'mirror-standing',
    ]);
    if (reason === 'small-room') {
      room.room.width = known(1000);
      room.room.depth = known(1000);
    } else
      room.room.features = [
        {
          id: 'unknown',
          kind: 'obstacle',
          wall: 'unknown',
          wallProvenance: { status: 'unknown', sourceId: null },
          width: unknown(),
          offset: unknown(),
          height: unknown(),
          sill: unknown(),
          projection: unknown(),
        },
      ];
    const before = structuredClone(room),
      result = planPhotoPlacement(room, ids(room));
    expect(result.unresolved.length).toBeGreaterThan(0);
    expect(result.room).toBe(room);
    expect(result.room).toEqual(before);
    expect(result.adjusted).toEqual([]);
  },
);

it('keeps two distinct work areas and bed groups instead of collapsing their chairs or cabinets', () => {
  const room = scene([
    'procedural-bed',
    'procedural-bed',
    'bedside-drawers',
    'bedside-drawers',
    'procedural-desk',
    'procedural-desk',
    'chair-desk-fixed',
    'chair-desk-fixed',
  ]);
  const poses = [
    [1000, 1100, 0],
    [3200, 3700, 2],
    [2075, 250, 0],
    [2125, 4550, 2],
    [3850, 1500, 1],
    [350, 3300, 3],
    [3215, 1500, 3],
    [985, 3300, 1],
  ];
  room.furniture.forEach((p, i) =>
    Object.assign(p.pose, {
      centerX: poses[i]![0],
      centerZ: poses[i]![1],
      quarterTurns: poses[i]![2],
    }),
  );
  const result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  assertClear(result.room);
  expect(result.room.furniture.map((p) => p.pose)).toEqual(
    room.furniture.map((p) => p.pose),
  );
});

it('puts two bedside units on opposite sides of one bed', () => {
  const room = scene(['procedural-bed', 'bedside-drawers', 'bedside-drawers']);
  const result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  assertClear(result.room);
  const [bed, a, b] = result.room.furniture;
  const [fx, fz] = localFront(bed!.pose.quarterTurns);
  const lateral = (p: Furniture) =>
    (p.pose.centerX - bed!.pose.centerX) * fz -
    (p.pose.centerZ - bed!.pose.centerZ) * fx;
  expect(lateral(a!) * lateral(b!)).toBeLessThan(0);
});

it('respects a fresh wardrobe rotation lock while moving it to its compatible wall', () => {
  const room = scene(['wardrobe-mirrored']);
  room.furniture[0]!.pose.quarterTurns = 2;
  room.furniture[0]!.locks.rotation = true;
  const result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  expect(result.room.furniture[0]!.pose.quarterTurns).toBe(2);
  expect(nearestEdge(result.room, result.room.furniture[0]!)).toBe(50);
  expect(result.room.furniture[0]!.locks).toEqual(room.furniture[0]!.locks);
});

it('moves a hanging mirror off window glass while keeping it mounted and above the floor', () => {
  const room = scene(['mirror-wall']);
  Object.assign(room.furniture[0]!.pose, { centerX: 2100, centerZ: 35 });
  room.room.features = [
    {
      id: 'glass',
      kind: 'window',
      wall: 'north',
      wallProvenance: { status: 'estimated', sourceId: 'photo' },
      width: known(2000),
      offset: known(1100),
      height: known(1200),
      sill: known(900),
      mechanism: 'fixed',
      mechanismProvenance: { status: 'estimated', sourceId: 'photo' },
    },
  ];
  const result = planPhotoPlacement(room, ids(room));
  expect(result.unresolved).toEqual([]);
  const proxy = planningRoom(result.room),
    mirror = proxy.furniture[0]!;
  expect(
    intersection(
      footprint(mirror)!,
      wallBand(proxy, proxy.room.features[0]!, 100)!,
    ),
  ).toBeUndefined();
  expect(nearestEdge(result.room, result.room.furniture[0]!)).toBe(0);
  expect(mirror.pose.bottomY).toBe(900);
});
