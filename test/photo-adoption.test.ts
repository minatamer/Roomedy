import { expect, it } from 'vitest';
import { recognitionFixture } from '../apps/backend/src/recognition/fixtures.js';
import {
  adoptHypothesis,
  createDraft,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import { CATALOGUE, furnitureBottom } from '@roomedy/spatial';
import { displayFurnitureFootprint } from '../apps/frontend/src/features/catalogue/display-size';
import { intersection } from '@roomedy/spatial';

function besideWallPhoto(
  pieceId: string,
  targetId: string,
  turn: 0 | 1 | 2 | 3,
) {
  const raw = recognitionFixture('two-identical', ['scene']);
  raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
  const [target, piece] = raw.observations;
  for (const o of raw.observations) {
    o.width = o.depth = o.height = unknown();
    o.wall = 'unknown';
    o.wallEvidence = { status: 'unknown', sourceId: null };
    o.poseEvidence = { status: 'estimated', sourceId: 'scene' };
    o.sketch = { x: 0.5, z: 0.5, quarterTurns: null };
  }
  Object.assign(target!, {
    catalogueId: targetId,
    wall: (['north', 'east', 'south', 'west'] as const)[turn],
    wallEvidence: { status: 'estimated', sourceId: 'scene' },
  });
  Object.assign(piece!, {
    catalogueId: pieceId,
    relation: { kind: 'beside', targetRef: target!.ref, side: 'right' },
  });
  return raw;
}

it.each(
  ([0, 1, 2, 3] as const).flatMap((turn) =>
    [
      ['floor-lamp', 'procedural-desk'],
      ['mirror-standing', 'bedside-drawers'],
      ['mirror-wall', 'wardrobe-mirrored'],
    ].map(([piece, target]) => [piece!, target!, turn] as const),
  ),
)(
  'places observed %s beside wall-backed %s at turn %s',
  (pieceId, targetId, turn) => {
    const [target, piece] = adopt(besideWallPhoto(pieceId, targetId, turn)).room
      .furniture;
    expect(piece!.pose.provenance.sourceId).toBe('photo-relation-plan');
    expect(piece!.pose.quarterTurns).toBe(turn);
    const [a, b] = [target, piece].map((p) => displayFurnitureFootprint(p!)!);
    expect(intersection(a!, b!)).toBeUndefined();
    if (pieceId === 'mirror-wall') {
      expect([b!.minZ, 4200 - b!.maxX, 4800 - b!.maxZ, b!.minX][turn]).toBe(0);
      expect(piece!.pose.bottomY).toBe(900);
    } else {
      expect([b!.minZ, 4200 - b!.maxX, 4800 - b!.maxZ, b!.minX][turn]).toBe(50);
    }
    for (const p of [target!, piece!])
      expect(Object.values(p.dimensions).every((m) => m.value === null)).toBe(
        true,
      );
  },
);

it('resolves a same-wall neighbor chain before its dependent mirror regardless of observation order', () => {
  const raw = besideWallPhoto('bedside-drawers', 'procedural-bed', 0);
  const [bed, cabinet] = raw.observations;
  bed!.sketch.x = 0.28;
  const mirror = structuredClone(cabinet!);
  mirror.ref = 'dependent_mirror';
  mirror.catalogueId = 'mirror-standing';
  mirror.sketch = { x: 0.6, z: 0.7, quarterTurns: null };
  mirror.relation!.targetRef = cabinet!.ref;
  raw.observations = [mirror, cabinet!, bed!];
  raw.groups = raw.observations.map((o) => [o.ref]);
  const room = adopt(raw).room;
  const [m, c, b] = [
    'mirror-standing',
    'bedside-drawers',
    'procedural-bed',
  ].map((id) => room.furniture.find((p) => p.catalogueId === id)!);
  expect(m!.pose.provenance.sourceId).toBe('photo-relation-plan');
  expect(m!.pose.centerX).toBeGreaterThan(c!.pose.centerX);
  expect(c!.pose.centerX).toBeGreaterThan(b!.pose.centerX);
  expect(displayFurnitureFootprint(m!)!.minZ).toBe(50);
  expect(displayFurnitureFootprint(c!)!.minZ).toBe(50);
});

it.each([
  'unknown-wall',
  'contradictory-wall',
  'cycle',
  'outside',
  'blocked',
] as const)(
  'does not plan an unsafe or unsupported same-wall relation: %s',
  (reason) => {
    const raw = besideWallPhoto('floor-lamp', 'procedural-desk', 1);
    const [target, piece] = raw.observations;
    if (reason === 'unknown-wall') {
      target!.wall = 'unknown';
      target!.wallEvidence = { status: 'unknown', sourceId: null };
    }
    if (reason === 'contradictory-wall') {
      piece!.wall = 'north';
      piece!.wallEvidence = { status: 'estimated', sourceId: 'scene' };
    }
    if (reason === 'cycle')
      target!.relation = {
        kind: 'beside',
        targetRef: piece!.ref,
        side: 'left',
      };
    if (reason === 'outside') target!.sketch.z = 0.98;
    if (reason === 'blocked') {
      const obstruction = structuredClone(target!);
      obstruction.ref = 'other_piece';
      obstruction.catalogueId = 'wardrobe-hinged';
      obstruction.wall = 'unknown';
      obstruction.wallEvidence = { status: 'unknown', sourceId: null };
      obstruction.sketch = { x: 0.88, z: 0.7, quarterTurns: 0 };
      raw.observations.push(obstruction);
      raw.groups.push([obstruction.ref]);
    }
    const room = adopt(raw).room;
    expect(
      room.furniture.find((p) => p.catalogueId === 'floor-lamp')!.pose
        .provenance.sourceId,
    ).not.toBe('photo-relation-plan');
  },
);

it.each([
  ['south-west', 'left', 0],
  ['south-west', 'right', 1],
  ['south-east', 'left', 3],
  ['south-east', 'right', 0],
  ['north-east', 'left', 2],
  ['north-east', 'right', 3],
  ['north-west', 'left', 1],
  ['north-west', 'right', 2],
] as const)(
  'maps camera %s wall plane %s without asking the model for global orientation',
  (corner, side, turn) => {
    const raw = recognitionFixture('repeated-desk', ['scene']);
    raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
    raw.roomViews = [{ sourceId: 'scene', corner }];
    Object.assign(raw.observations[0]!, {
      catalogueId: 'mirror-wall',
      wall: 'unknown',
      wallEvidence: { status: 'unknown', sourceId: null },
      wallView: { sourceId: 'scene', side },
      sketch: { x: 0.65, z: 0.6, quarterTurns: null },
    });
    const p = adopt(raw).room.furniture[0]!;
    expect(p.pose.quarterTurns).toBe(turn);
    expect(p.pose.provenance.status).toBe('planned');
    expect(p.dimensions.width.value).toBeNull();
  },
);
it.each([
  'foreign',
  'detail',
  'duplicate',
  'conflict',
  'missing-target',
] as const)('rejects %s room-view/relationship evidence', (reason) => {
  const raw = recognitionFixture('repeated-desk', ['scene']);
  raw.sourcePurposes = [
    { id: 'scene', purpose: reason === 'detail' ? 'furniture' : 'room' },
  ];
  raw.roomViews = [
    {
      sourceId: reason === 'foreign' ? 'foreign' : 'scene',
      corner: 'north-east',
    },
  ];
  const o = raw.observations[0]!;
  o.wallView = { sourceId: 'scene', side: 'right' };
  o.wall = 'unknown';
  o.wallEvidence = { status: 'unknown', sourceId: null };
  if (reason === 'duplicate') raw.roomViews.push({ ...raw.roomViews[0]! });
  if (reason === 'conflict') {
    o.wall = 'east';
    o.wallEvidence = { status: 'estimated', sourceId: 'scene' };
  }
  if (reason === 'missing-target')
    o.relation = { kind: 'faces', targetRef: 'missing', side: null };
  expect(parseDraftHypothesis(raw, ['scene'])).toBeNull();
});
it.each([0, 1, 2, 3] as const)(
  'keeps an observed chair facing and aligned with its desk at turn %s',
  (turn) => {
    const raw = recognitionFixture('two-identical', ['scene']);
    raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
    const [desk, chair] = raw.observations;
    Object.assign(desk!, {
      catalogueId: 'procedural-desk',
      sketch: { x: 0.5, z: 0.5, quarterTurns: turn },
    });
    Object.assign(chair!, {
      catalogueId: 'procedural-chair',
      sketch: { x: 0.7, z: 0.65, quarterTurns: null },
      relation: { kind: 'faces', targetRef: desk!.ref, side: null },
    });
    for (const o of raw.observations) {
      o.width = o.depth = o.height = unknown();
      o.poseEvidence = { status: 'estimated', sourceId: 'scene' };
    }
    const result = adopt(raw),
      [a, b] = result.room.furniture;
    expect(b!.pose.quarterTurns).toBe((turn + 2) % 4);
    expect(turn % 2 ? b!.pose.centerZ : b!.pose.centerX).toBe(
      turn % 2 ? a!.pose.centerZ : a!.pose.centerX,
    );
    expect(
      intersection(
        displayFurnitureFootprint(a!)!,
        displayFurnitureFootprint(b!)!,
      ),
    ).toBeUndefined();
    expect(b!.pose.provenance.sourceId).toBe('photo-relation-plan');
    expect(result.room.room.width.value).toBeNull();
    chair!.relation!.side = 'left';
    expect(parseDraftHypothesis(raw, ['scene'])).toBeNull();
  },
);
it.each(['left', 'right'] as const)(
  'keeps an observed %s bedside at its bed headboard without measured dimensions',
  (side) => {
    const raw = recognitionFixture('two-identical', ['scene']);
    raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
    const [bed, cabinet] = raw.observations;
    Object.assign(bed!, {
      catalogueId: 'procedural-bed',
      wall: 'north',
      wallEvidence: { status: 'estimated', sourceId: 'scene' },
      sketch: { x: 0.5, z: 0.4, quarterTurns: 0 },
    });
    Object.assign(cabinet!, {
      catalogueId: 'bedside-drawers',
      sketch: { x: 0.6, z: 0.4, quarterTurns: null },
      relation: { kind: 'beside', targetRef: bed!.ref, side },
    });
    for (const o of raw.observations) {
      o.width = o.depth = o.height = unknown();
      o.poseEvidence = { status: 'estimated', sourceId: 'scene' };
    }
    const [a, b] = adopt(raw).room.furniture;
    const boxes = [a, b].map((p) => displayFurnitureFootprint(p!)!);
    expect(boxes[0]!.minZ).toBe(50);
    expect(boxes[1]!.minZ).toBe(50);
    expect(intersection(boxes[0]!, boxes[1]!)).toBeUndefined();
    expect(
      side === 'right'
        ? b!.pose.centerX > a!.pose.centerX
        : b!.pose.centerX < a!.pose.centerX,
    ).toBe(true);
  },
);

const unknown = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
it('does not collapse two observed chairs onto one desk-facing position', () => {
  const raw = recognitionFixture('two-identical', ['scene']);
  raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
  raw.observations[1]!.catalogueId = 'procedural-chair';
  raw.observations[1]!.sketch.quarterTurns = null;
  raw.observations[1]!.relation = {
    kind: 'faces',
    targetRef: raw.observations[0]!.ref,
    side: null,
  };
  const other = structuredClone(raw.observations[1]!);
  other.ref = 'another_chair';
  other.sketch.x = 0.8;
  raw.observations.push(other);
  raw.groups.push([other.ref]);
  const room = adopt(raw).room;
  expect(room.furniture).toHaveLength(3);
  expect(
    room.furniture.every(
      (p) => p.pose.provenance.sourceId !== 'photo-relation-plan',
    ),
  ).toBe(true);
});
it('never moves a previously accepted desk when a later photo links a new chair to it', () => {
  const original = recognitionFixture('repeated-desk', ['scene']);
  const before = adopt(original);
  before.room.furniture[0]!.locks.position = true;
  before.room.furniture[0]!.pose.provenance = {
    status: 'planned',
    sourceId: 'visitor-plan',
  };
  const expected = structuredClone(before.room.furniture[0]);
  const raw = recognitionFixture('two-identical', ['scene']);
  raw.sourcePurposes = [{ id: 'scene', purpose: 'room' }];
  Object.assign(raw.observations[1]!, {
    catalogueId: 'procedural-chair',
    sketch: { x: 0.25, z: 0.3, quarterTurns: null },
    relation: {
      kind: 'faces',
      targetRef: raw.observations[0]!.ref,
      side: null,
    },
  });
  let n = 0;
  const result = adoptHypothesis(before, raw, () => `new_${++n}`);
  if (!result.ok) throw new Error(result.message);
  expect(result.draft.room.furniture[0]).toEqual(expected);
  expect(result.draft.room.furniture[1]!.pose.provenance.sourceId).not.toBe(
    'photo-relation-plan',
  );
});
it('retains a unique visible supported wall mirror omitted from the grouping list', () => {
  const raw = recognitionFixture('repeated-desk', ['room']);
  raw.observations[0]!.catalogueId = 'mirror-wall';
  raw.groups = [];
  expect(adopt(raw).room.furniture.map((p) => p.catalogueId)).toEqual([
    'mirror-wall',
  ]);
});
it('keeps ambiguous ungrouped same-catalogue observations unassigned rather than duplicating furniture', () => {
  const raw = recognitionFixture('two-identical', ['room']);
  raw.groups = [];
  expect(adopt(raw).room.furniture).toHaveLength(0);
  raw.groups = [[raw.observations[0]!.ref]];
  expect(adopt(raw).room.furniture).toHaveLength(1);
});
it.each([0, 1, 2, 3] as const)(
  'projects evidenced back-wall placement at turn %s without inventing measured sizes',
  (turn) => {
    const raw = recognitionFixture('repeated-desk', ['detail', 'room']);
    for (const o of raw.observations) {
      o.catalogueId = 'wardrobe-mirrored';
      o.width = o.depth = o.height = unknown();
      o.wall = (['north', 'east', 'south', 'west'] as const)[turn];
      o.wallEvidence = o.poseEvidence = {
        status: 'estimated',
        sourceId: 'room',
      };
      o.sketch = { x: 0.85, z: 0.7, quarterTurns: turn };
    }
    const result = adopt(raw, ['furniture', 'room']),
      p = result.room.furniture[0]!;
    expect(turn % 2 ? p.pose.centerX : p.pose.centerZ).toBe(
      [350, 3850, 4450, 350][turn],
    );
    expect(p.pose.quarterTurns).toBe(turn);
    expect(p.pose.provenance).toEqual({
      status: 'planned',
      sourceId: 'photo-wall-plan',
    });
    expect(Object.values(p.dimensions).every((m) => m.value === null)).toBe(
      true,
    );
    expect(result.room.room.width.value).toBeNull();
  },
);
it('uses an evidenced back-wall orientation only when photographed facing is unknown', () => {
  const raw = recognitionFixture('repeated-desk', ['room']);
  const o = raw.observations[0]!;
  o.catalogueId = 'mirror-wall';
  o.wall = 'west';
  o.wallEvidence = { status: 'estimated', sourceId: 'room' };
  o.sketch.quarterTurns = null;
  expect(adopt(raw).room.furniture[0]!.pose).toMatchObject({
    quarterTurns: 3,
    centerX: 35,
  });
  o.sketch.quarterTurns = 0;
  expect(adopt(raw).room.furniture[0]!.pose.quarterTurns).toBe(0);
});
function adopt(
  raw: ReturnType<typeof recognitionFixture>,
  purposes?: ('room' | 'furniture')[],
) {
  const draft = createDraft('furnished', 'photo_adoption');
  const sources = [...new Set(raw.observations.map((o) => o.sourceId))];
  draft.sources = sources.map((id, i) => ({
    id,
    purpose: purposes?.[i] ?? 'room',
    available: true,
  }));
  let n = 0;
  const result = adoptHypothesis(draft, raw, () => `item_${++n}`);
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}
it('uses a later room-view pose when the first grouped furniture detail has no pose', () => {
  const raw = recognitionFixture('repeated-desk', ['detail', 'room']);
  raw.observations[0]!.sketch = { x: null, z: null, quarterTurns: null };
  raw.observations[0]!.poseEvidence = { status: 'unknown', sourceId: null };
  raw.observations[1]!.sketch = { x: 0.75, z: 0.2, quarterTurns: 3 };
  const result = adopt(raw, ['furniture', 'room']);
  expect(result.room.furniture).toHaveLength(1);
  expect(result.room.furniture[0]!.pose).toMatchObject({
    centerX: 3150,
    centerZ: 960,
    quarterTurns: 3,
  });
  expect(result.room.furniture[0]!.dimensions.width.value).toBeNull();
});
it('keeps separate provisional placeholders for distinct unlocated categories without invented normalized evidence', () => {
  const raw = recognitionFixture('two-identical', ['room']);
  raw.observations[1]!.catalogueId = 'chair-desk-fixed';
  for (const o of raw.observations) {
    o.sketch = { x: null, z: null, quarterTurns: null };
    o.poseEvidence = { status: 'unknown', sourceId: null };
  }
  const result = adopt(raw);
  expect(result.room.furniture).toHaveLength(2);
  expect(
    new Set(
      result.room.furniture.map((p) => `${p.pose.centerX}:${p.pose.centerZ}`),
    ).size,
  ).toBe(2);
  expect(result.links.every((l) => l.normalized === null)).toBe(true);
});
it.each([
  ['ceiling-pendant', 2100],
  ['ceiling-flush', 2500],
  ['ceiling-track', 2380],
  ['mirror-wall', 900],
] as const)(
  'plans the %s mount without converting nominal dimensions to photo measurements',
  (catalogueId, bottomY) => {
    const raw = recognitionFixture('repeated-desk', ['room']);
    raw.observations[0]!.catalogueId = catalogueId;
    raw.observations[0]!.width =
      raw.observations[0]!.depth =
      raw.observations[0]!.height =
        unknown();
    const result = adopt(raw),
      piece = result.room.furniture[0]!;
    expect(piece.pose.bottomY).toBe(bottomY);
    expect(piece.pose.provenance).toEqual({
      status: 'planned',
      sourceId: 'photo-mount-plan',
    });
    expect(Object.values(piece.dimensions).every((m) => m.value === null)).toBe(
      true,
    );
    expect(result.room.room.height.value).toBeNull();
    if (catalogueId === 'mirror-wall') expect(piece.pose.centerZ).toBe(35);
  },
);
it('retains a supported photographed bathroom purpose and rejects it on a furniture observation', () => {
  const raw = recognitionFixture('unknown-hinge', ['room']);
  const door = raw.observations.find((o) => o.kind === 'door')!;
  Object.assign(door, { doorPurpose: 'bathroom' });
  const result = adopt(raw);
  expect(
    result.room.room.features.find((f) => f.kind === 'door'),
  ).toMatchObject({ purpose: 'bathroom' });
  Object.assign(
    raw.observations.find((o) => o.kind === 'furniture')!,
    { doorPurpose: 'bathroom' },
  );
  expect(parseDraftHypothesis(raw, ['room'])).toBeNull();
});
it.each(CATALOGUE)(
  'adopts the current $id representation without inventing owned dimensions',
  (entry) => {
    const raw = recognitionFixture('repeated-desk', ['room']);
    Object.assign(raw.observations[0]!, {
      catalogueId: entry.id,
      finish: entry.finishes[0],
    });
    const result = adopt(raw),
      piece = result.room.furniture[0]!;
    expect(result.room.furniture).toHaveLength(1);
    expect(piece.catalogueId).toBe(entry.id);
    expect(Object.values(piece.dimensions).every((m) => m.value === null)).toBe(
      true,
    );
    if (entry.placement && entry.placement !== 'floor')
      expect(furnitureBottom(piece)).not.toBeNull();
  },
);
