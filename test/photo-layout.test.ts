import { expect, it } from 'vitest';
import { footprint, intersection, wallBand } from '@roomedy/spatial';
import {
  photoBackWalls,
  planPhotoPlacement,
} from '../apps/frontend/src/features/room-intake/photo-layout.js';
import {
  adoptHypothesis,
  createDraft,
  draftFurniture,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { displayFurnitureFootprint } from '../apps/frontend/src/features/catalogue/display-size.js';
import { known, unknown } from './fixtures/command-room.js';
import { bedroomExample } from '../apps/backend/src/recognition/fixtures.js';

function bedsideDraft() {
  const draft = createDraft('furnished', 'bedside_room');
  draft.sources = [
    { id: 'one', purpose: 'auto', available: true },
    { id: 'two', purpose: 'auto', available: true },
  ];
  const raw = bedroomExample(draft.sources);
  raw.room = { width: unknown(), depth: unknown(), height: unknown() };
  for (const observation of raw.observations) {
    const bed = observation.catalogueId === 'procedural-bed';
    observation.width = observation.depth = observation.height = unknown();
    observation.wall = bed ? 'north' : 'unknown';
    observation.wallEvidence = bed
      ? { status: 'estimated', sourceId: observation.sourceId }
      : { status: 'unknown', sourceId: null };
    observation.sketch = {
      x: bed ? 0.41 : 0.69,
      z: bed ? 0.23 : 0.25,
      quarterTurns: 0,
    };
  }
  let id = 0;
  const adopted = adoptHypothesis(draft, raw, () => `item_${++id}`);
  if (!adopted.ok) throw new Error(adopted.message);
  return adopted.draft;
}

it.each([0, 1, 2, 3] as const)(
  'plans a uniquely co-visible bedside along its bed wall at rotation %s without changing unknown evidence',
  (turn) => {
    const draft = bedsideDraft(),
      [bed, cabinet] = draft.room.furniture,
      wall = (['north', 'east', 'south', 'west'] as const)[turn];
    const [dx, dz] = [
      [1176, 96],
      [-96, 1176],
      [-1176, -96],
      [96, -1176],
    ][turn]!;
    Object.assign(bed!.pose, {
      centerX: 2100,
      centerZ: 2400,
      quarterTurns: turn,
    });
    Object.assign(cabinet!.pose, {
      centerX: 2100 + dx!,
      centerZ: 2400 + dz!,
      quarterTurns: turn,
    });
    for (const observation of draft.observations) {
      observation.sketch.quarterTurns = turn;
      if (observation.catalogueId === 'procedural-bed') observation.wall = wall;
    }
    const before = structuredClone(draft),
      walls = photoBackWalls(draft);
    expect(walls.get(cabinet!.id)).toBe(wall);
    const result = planPhotoPlacement(
      draft.room,
      [bed!.id, cabinet!.id],
      walls,
    );
    expect(result.unresolved).toEqual([]);
    const boxes = result.room.furniture.map((piece) =>
      displayFurnitureFootprint(piece)!,
    );
    expect(intersection(boxes[0]!, boxes[1]!)).toBeUndefined();
    for (const box of boxes)
      expect(
        wall === 'north'
          ? box.minZ
          : wall === 'east'
            ? 4200 - box.maxX
            : wall === 'south'
              ? 4800 - box.maxZ
              : box.minX,
      ).toBe(50);
    expect(result.room.furniture[1]!.pose.provenance.status).toBe('planned');
    expect(result.room.furniture[1]!.dimensions).toEqual(cabinet!.dimensions);
    expect(draft).toEqual(before);
  },
);

it.each([
  'separate-views',
  'detail-only',
  'conflicting-wall',
  'conflicting-facing',
  'unknown-facing',
  'distant',
  'foot-end',
  'multiple-beds',
  'deliberate-bed',
] as const)('does not infer a bedside wall for %s evidence', (reason) => {
  const draft = bedsideDraft(),
    [bed, cabinet] = draft.room.furniture,
    observations = draft.observations.filter(
      (observation) => observation.catalogueId !== 'procedural-bed',
    );
  if (reason === 'separate-views' || reason === 'detail-only') {
    draft.sources.push({
      id: 'third',
      purpose: 'auto',
      detectedPurpose: reason === 'detail-only' ? 'furniture' : 'room',
      available: true,
    });
    for (const observation of observations) {
      observation.sourceId = 'third';
      observation.poseEvidence.sourceId = 'third';
    }
  }
  if (reason === 'conflicting-wall') observations[0]!.wall = 'east';
  if (reason === 'conflicting-facing') observations[0]!.sketch.quarterTurns = 2;
  if (reason === 'unknown-facing')
    observations.forEach((observation) => {
      observation.poseEvidence = { status: 'unknown', sourceId: null };
    });
  if (reason === 'distant') cabinet!.pose.centerX = 4100;
  if (reason === 'foot-end') cabinet!.pose.centerZ = bed!.pose.centerZ + 2100;
  if (reason === 'deliberate-bed')
    bed!.pose.provenance = { status: 'planned', sourceId: 'visitor-plan' };
  if (reason === 'multiple-beds') {
    const other = structuredClone(bed!);
    other.id = 'another_bed';
    other.pose.centerX = cabinet!.pose.centerX + 1100;
    draft.room.furniture.push(other);
    draft.links.push({
      ...structuredClone(
        draft.links.find((link) => link.entityId === bed!.id)!,
      ),
      entityId: other.id,
    });
  }
  expect(photoBackWalls(draft).has(cabinet!.id)).toBe(false);
});

function photoRoom() {
  const draft = createDraft('furnished', 'photo_room');
  const bed = draftFurniture(draft, 'procedural-bed', 'bed')!;
  draft.room.furniture.push(bed);
  const cabinet = draftFurniture(draft, 'bedside-drawers', 'cabinet')!;
  draft.room.furniture.push(cabinet);
  Object.assign(bed.pose, { centerX: 1500, centerZ: 1800 });
  Object.assign(cabinet.pose, { centerX: 2280, centerZ: 1100 });
  return draft.room;
}

it.each(['north', 'east', 'south', 'west'] as const)(
  'keeps photo-backed pieces near the %s wall while separating them along it',
  (wall) => {
    const room = photoRoom(),
      turn = ['north', 'east', 'south', 'west'].indexOf(wall) as 0 | 1 | 2 | 3;
    for (const piece of room.furniture) piece.pose.quarterTurns = turn;
    const result = planPhotoPlacement(
      room,
      ['bed', 'cabinet'],
      new Map([
        ['bed', wall],
        ['cabinet', wall],
      ]),
    );
    expect(result.unresolved).toEqual([]);
    expect(result.adjusted).toContain('bed');
    const [bed, cabinet] = result.room.furniture.map((piece) =>
      displayFurnitureFootprint(piece)!,
    );
    expect(intersection(bed!, cabinet!)).toBeUndefined();
    for (const box of [bed!, cabinet!]) {
      expect(
        wall === 'north'
          ? box.minZ
          : wall === 'west'
            ? box.minX
            : wall === 'south'
              ? 4800 - box.maxZ
              : 4200 - box.maxX,
      ).toBe(50);
    }
    for (const [index, piece] of result.room.furniture.entries()) {
      expect(piece.pose.quarterTurns).toBe(turn);
      expect(piece.dimensions).toEqual(room.furniture[index]!.dimensions);
    }
  },
);

it('uses consistent room-view back-wall evidence, never detail-only, conflicting or incompatible facing evidence', () => {
  const draft = createDraft('furnished', 'room');
  draft.sources = [
    { id: 'one', purpose: 'auto', available: true },
    { id: 'two', purpose: 'auto', available: true },
  ];
  const raw = bedroomExample([
    { id: 'one', purpose: 'auto' },
    { id: 'two', purpose: 'auto' },
  ]);
  for (const observation of raw.observations) {
    observation.wall = 'north';
    observation.wallEvidence = {
      status: 'estimated',
      sourceId: observation.sourceId,
    };
  }
  let id = 0;
  const result = adoptHypothesis(draft, raw, () => `item_${++id}`);
  if (!result.ok) throw new Error(result.message);
  const adopted = result.draft;
  expect(photoBackWalls(adopted).size).toBe(2);
  adopted.sources.forEach((source) => {
    source.detectedPurpose = 'furniture';
  });
  expect(photoBackWalls(adopted).size).toBe(0);
  adopted.sources.forEach((source) => {
    source.detectedPurpose = 'room';
  });
  adopted.observations
    .filter((observation) => observation.catalogueId === 'procedural-bed')
    .at(-1)!.wall = 'east';
  expect(photoBackWalls(adopted).has(adopted.room.furniture[0]!.id)).toBe(
    false,
  );
  adopted.observations
    .filter(
      (observation) => observation.catalogueId === 'bedside-storage-fixed',
    )
    .forEach((observation) => {
      observation.sketch.quarterTurns = 2;
    });
  expect(photoBackWalls(adopted).size).toBe(0);
});

it.each([0, 1, 2, 3] as const)(
  'separates unknown-size photographed furniture at rotation %s without manufacturing sizes',
  (turn) => {
    const room = photoRoom();
    room.furniture[0]!.pose.quarterTurns = turn;
    const before = structuredClone(room);
    expect(
      intersection(
        displayFurnitureFootprint(room.furniture[0]!)!,
        displayFurnitureFootprint(room.furniture[1]!)!,
      ),
    ).toBeDefined();
    const result = planPhotoPlacement(room, ['bed', 'cabinet']);
    expect(result.unresolved).toEqual([]);
    expect(result.adjusted).toEqual(['cabinet']);
    expect(result.room.furniture[0]).toEqual(before.furniture[0]);
    const cabinet = result.room.furniture[1]!;
    expect(cabinet.pose.provenance).toEqual({
      status: 'planned',
      sourceId: 'photo-layout-plan',
    });
    expect(cabinet.pose.quarterTurns).toBe(
      before.furniture[1]!.pose.quarterTurns,
    );
    expect(cabinet.dimensions).toEqual(before.furniture[1]!.dimensions);
    expect(cabinet.finish).toBe(before.furniture[1]!.finish);
    expect(
      intersection(
        displayFurnitureFootprint(result.room.furniture[0]!)!,
        displayFurnitureFootprint(cabinet)!,
      ),
    ).toBeUndefined();
    expect(footprint(cabinet)).toBeUndefined();
    expect(result.room.room).toEqual(before.room);
    expect(JSON.stringify(result.room)).not.toContain('photo-preview');
    expect(room).toEqual(before);
  },
);

it('keeps measured axes and deliberate/locked positions while moving only a fresh estimate', () => {
  const room = photoRoom();
  const cabinet = room.furniture[1]!;
  cabinet.pose.provenance = { status: 'planned', sourceId: 'visitor-plan' };
  cabinet.locks.position = true;
  cabinet.dimensions.width = known(550);
  const before = structuredClone(cabinet);
  const result = planPhotoPlacement(room, ['bed', 'cabinet']);
  expect(result.unresolved).toEqual([]);
  expect(result.adjusted).toEqual(['bed']);
  expect(result.room.furniture[1]).toEqual(before);
  expect(result.room.furniture[0]!.dimensions).toEqual(
    room.furniture[0]!.dimensions,
  );
  expect(planPhotoPlacement(room, []).room).toBe(room);
});

it('avoids known obstacle regions and stays within the planning frame', () => {
  const room = photoRoom();
  room.room.width = known(4200);
  room.room.depth = known(4800);
  const obstacle = {
    id: 'fixed',
    kind: 'obstacle' as const,
    wall: 'north' as const,
    wallProvenance: { status: 'confirmed' as const, sourceId: 'sample' },
    offset: known(2300),
    width: known(1000),
    projection: known(1500),
    sill: known(0),
    height: known(2000),
  };
  room.room.features = [obstacle];
  const result = planPhotoPlacement(room, ['bed', 'cabinet']);
  expect(result.unresolved).toEqual([]);
  const bounds = displayFurnitureFootprint(result.room.furniture[1]!)!;
  expect(intersection(bounds, wallBand(room, obstacle, 1500)!)).toBeUndefined();
  expect(bounds.minX).toBeGreaterThanOrEqual(0);
  expect(bounds.maxX).toBeLessThanOrEqual(4200);
  expect(bounds.minZ).toBeGreaterThanOrEqual(0);
  expect(bounds.maxZ).toBeLessThanOrEqual(4800);
});

it('clamps an outlying estimated footprint without changing facing or any room dimensions', () => {
  const room = photoRoom();
  room.furniture = [room.furniture[1]!];
  room.furniture[0]!.pose.centerX = 4190;
  const result = planPhotoPlacement(room, ['cabinet']);
  expect(result.adjusted).toEqual(['cabinet']);
  expect(displayFurnitureFootprint(result.room.furniture[0]!)!.maxX).toBe(4200);
  expect(result.room.room.width).toEqual(unknown());
});

it('leaves an impossible or unassessable repair unchanged, without hiding furniture', () => {
  for (const reason of ['too-small', 'unknown-obstacle']) {
    const room = photoRoom();
    if (reason === 'too-small') {
      room.room.width = known(1000);
      room.room.depth = known(1000);
    } else
      room.room.features = [
        {
          id: 'unclear',
          kind: 'obstacle',
          wall: 'unknown',
          wallProvenance: { status: 'unknown', sourceId: null },
          width: unknown(),
          height: unknown(),
          sill: unknown(),
          offset: unknown(),
          projection: unknown(),
        },
      ];
    const before = structuredClone(room),
      result = planPhotoPlacement(room, ['bed', 'cabinet']);
    expect(result.room).toBe(room);
    expect(result.adjusted).toEqual([]);
    expect(result.unresolved.length).toBeGreaterThan(0);
    expect(result.room.furniture).toHaveLength(2);
    expect(room).toEqual(before);
  }
});
