import { readFile } from 'node:fs/promises';
import { describe, it, expect, vi } from 'vitest';
import { CATALOGUE, visitorCatalogueFurniture } from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  advanceOpening,
  featureOpening,
  furnitureOpening,
  furniturePartMotion,
  openingLeafMotion,
} from '../apps/frontend/src/features/room-view/articulation.js';
import type { PartMotion } from '../apps/frontend/src/features/room-view/articulation.js';
import { proceduralParts } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { detailedParts } from '../apps/frontend/src/features/room-view/surfaces.js';
import { cabinetDoorRig } from '../apps/frontend/src/features/room-view/articulation-model.js';
import { ViewAssets } from '../apps/frontend/src/features/room-view/assets.js';
import type { AssetState } from '../apps/frontend/src/features/room-view/assets.js';

function furniture(id: string) {
  const entry = CATALOGUE.find((e) => e.id === id)!;
  return visitorCatalogueFurniture(
    entry,
    {
      width: entry.size.width.default,
      depth: entry.size.depth.default,
      height: entry.size.height.default,
    },
    { centerX: 1600, centerZ: 1600, quarterTurns: 0 },
    `test_${id}`,
  );
}
function projected(point: readonly number[], motion: PartMotion) {
  const x = point[0]! / 1000 - motion.pivot[0],
    z = point[2]! / 1000 - motion.pivot[2];
  return [
    motion.pivot[0] +
      x * Math.cos(motion.turn) +
      z * Math.sin(motion.turn) +
      motion.travel[0],
    point[1]! / 1000 + motion.travel[1],
    motion.pivot[2] -
      x * Math.sin(motion.turn) +
      z * Math.cos(motion.turn) +
      motion.travel[2],
  ];
}

describe('transient3D opening mechanisms', () => {
  it('offers only actual supported catalogue mechanisms at representable sizes', () => {
    expect(furnitureOpening(furniture('wardrobe-hinged'))?.kind).toBe('hinged');
    expect(furnitureOpening(furniture('wardrobe-sliding'))?.kind).toBe(
      'sliding',
    );
    expect(
      furnitureOpening(furniture('bedside-storage-fixed'))?.openLabel,
    ).toBe('Open door');
    for (const id of [
      'procedural-bed',
      'procedural-storage',
      'chair-desk-fixed',
    ])
      expect(furnitureOpening(furniture(id))).toBeNull();
    const owned = furniture('wardrobe-hinged');
    owned.ownership = 'owned';
    owned.dimensions.width.value = 2401;
    expect(furnitureOpening(owned)).toBeNull();
    owned.dimensions.height = {
      value: null,
      status: 'unknown',
      sourceId: null,
    };
    expect(furnitureOpening(owned)).toBeNull();
    owned.catalogueId = 'missing';
    expect(furnitureOpening(owned)).toBeNull();
  });
  it('never invents unknown hinges/mechanisms or fixed-window motion', () => {
    const door = createRoomFixture('sample').room.features.find(
      (f) => f.kind === 'door',
    )!;
    expect(featureOpening(door)?.kind).toBe('hinged');
    if (door.kind !== 'door') throw new Error('fixture');
    door.hinge = 'unknown';
    expect(featureOpening(door)).toBeNull();
    door.mechanism = 'sliding';
    expect(featureOpening(door)?.kind).toBe('sliding');
    door.mechanism = 'unknown';
    expect(featureOpening(door)).toBeNull();
    const window = createRoomFixture('sample').room.features.find(
      (f) => f.kind === 'window',
    )!;
    if (window.kind !== 'window') throw new Error('fixture');
    expect(featureOpening(window)).toBeNull();
    window.mechanism = 'sliding';
    expect(featureOpening(window)?.openLabel).toBe('Open window');
    window.width.value = null;
    expect(featureOpening(window)).toBeNull();
  });
  it('settles exactly, bounds stalled frames and reverses from the visible fraction', () => {
    let p = 0;
    for (let i = 0; i < 100; i++) p = advanceOpening(p, true, 1 / 60);
    expect(p).toBe(1);
    expect(advanceOpening(0, true, 1000)).toBeCloseTo(
      advanceOpening(0, true, 0.05),
    );
    p = advanceOpening(0, true, 0.05);
    const reverse = advanceOpening(p, false, 0.016);
    expect(reverse).toBeGreaterThan(0);
    expect(reverse).toBeLessThan(p);
    for (let i = 0; i < 100; i++) p = advanceOpening(p, false, 1 / 60);
    expect(p).toBe(0);
    for (const current of [NaN, -1, 2, Infinity])
      for (const dt of [NaN, -10, Infinity, 0.016]) {
        const value = advanceOpening(current, true, dt);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
  });
  it('swings both wardrobe leaves forward around outer hinges with attached handles', () => {
    const size = { width: 1200, depth: 600, height: 2100 };
    const parts = detailedParts(
      proceduralParts('wardrobe', size, 'hinged'),
      size,
    );
    const before = JSON.stringify(parts);
    for (const door of parts.filter((p) => p.name.startsWith('door-'))) {
      const motion = furniturePartMotion(door, parts, 'hinged', size.depth)!;
      expect(projected(door.center, motion)[2]).toBeGreaterThan(
        size.depth / 2000,
      );
      const handle = parts.find((p) => p.name === `handle-${door.name}`)!;
      expect(furniturePartMotion(handle, parts, 'hinged', size.depth)).toEqual(
        motion,
      );
      expect(Math.abs(motion.pivot[0])).toBeCloseTo(0.598);
    }
    expect(JSON.stringify(parts)).toBe(before);
  });
  it('slides one leaf along a separate track and carries its handle', () => {
    const size = { width: 1600, depth: 650, height: 2100 };
    const parts = detailedParts(
      proceduralParts('wardrobe', size, 'sliding'),
      size,
    );
    const left = parts.find((p) => p.name === 'door--1')!,
      right = parts.find((p) => p.name === 'door-1')!;
    const motion = furniturePartMotion(left, parts, 'sliding', size.depth)!;
    expect(furniturePartMotion(right, parts, 'sliding', size.depth)).toBeNull();
    expect(left.center[2] - right.center[2]).toBeGreaterThanOrEqual(
      left.size[2],
    );
    expect(projected(left.center, motion)[0]).toBeCloseTo(
      right.center[0] / 1000,
      1,
    );
    for (const door of [left, right]) {
      const handle = parts.find((p) => p.name === `handle-${door.name}`)!;
      expect(handle.center[2] - door.center[2]).toBe(16);
      expect(furniturePartMotion(handle, parts, 'sliding', size.depth)).toEqual(
        furniturePartMotion(door, parts, 'sliding', size.depth),
      );
    }
  });
  it('keeps the unavailable prepared cabinet model fallback as one left-hinged leaf', () => {
    const size = { width: 540, depth: 440, height: 470 };
    const parts = detailedParts(
      proceduralParts('storage', size, 'hinged'),
      size,
    );
    const doors = parts.filter((p) => p.name.startsWith('door-'));
    expect(doors).toHaveLength(1);
    const door = doors[0]!;
    const motion = furniturePartMotion(door, parts, 'hinged', size.depth)!;
    expect(motion.turn).toBe(-Math.PI / 2);
    expect(motion.pivot[0]).toBeLessThan(0);
    expect(projected(door.center, motion)[2]).toBeGreaterThan(
      size.depth / 2000,
    );
    expect(
      parts.find((p) => p.name === 'handle-door--1')!.center[0],
    ).toBeGreaterThan(0);
  });
  it('extends complete drawer assemblies while the cabinet stays fixed', () => {
    const size = { width: 800, depth: 450, height: 900 };
    const parts = proceduralParts('storage', size, 'drawer');
    for (const part of parts) {
      const motion = furniturePartMotion(part, parts, 'drawer', size.depth);
      if (part.name.startsWith('drawer-')) {
        expect(motion?.travel[2]).toBeCloseTo(0.324);
        expect(motion?.turn).toBe(0);
      } else expect(motion).toBeNull();
    }
    expect(parts.filter((p) => p.name.endsWith('-front'))).toHaveLength(3);
    expect(parts.filter((p) => p.name.endsWith('-handle'))).toHaveLength(3);
  });
  it('respects room-door hinge and inward/outward direction in local room-facing coordinates', () => {
    const door = createRoomFixture('sample').room.features.find(
      (f) => f.kind === 'door',
    )!;
    if (door.kind !== 'door') throw new Error('fixture');
    for (const hinge of ['left', 'right'] as const) {
      door.hinge = hinge;
      door.mechanism = 'inward';
      const inward = openingLeafMotion(door, 0.9, 0.06);
      expect(projected([0, 1000, 0], inward)[2]).toBeGreaterThan(0);
      door.mechanism = 'outward';
      const outward = openingLeafMotion(door, 0.9, 0.06);
      expect(projected([0, 1000, 0], outward)[2]).toBeLessThan(0);
    }
    door.mechanism = 'sliding';
    expect(openingLeafMotion(door, 0.9, 0.06).travel[0]).toBeCloseTo(0.882);
  });
  it('articulates the actual cabinet door clone without mutating the cache or another instance', async () => {
    const bytes = await readFile(
      'apps/frontend/public/catalogue/bedside-storage-v1.glb',
    );
    let asset: AssetState | undefined;
    const owner = new ViewAssets(
      (states) => {
        asset = states.get('/catalogue/bedside-storage-v1.glb');
      },
      { fetch: vi.fn(async () => new Response(bytes)) },
    );
    try {
      owner.load('/catalogue/bedside-storage-v1.glb');
      await vi.waitFor(() => expect(asset?.kind).toBe('ready'));
      if (asset?.kind !== 'ready') throw new Error('model');
      const source = asset.asset.scene,
        a = source.clone(true),
        b = source.clone(true);
      const door = a.getObjectByName('door')!;
      const position = door.position.toArray();
      const rig = cabinetDoorRig(a)!;
      expect(rig).not.toBeNull();
      rig.apply(1);
      expect(door.rotation.y).toBeCloseTo(-Math.PI / 2);
      expect(door.position.toArray()).toEqual(position);
      expect(source.getObjectByName('door')!.rotation.y).toBe(0);
      expect(b.getObjectByName('door')!.rotation.y).toBe(0);
      rig.apply(0);
      expect(door.rotation.y).toBe(0);
    } finally {
      owner.dispose();
    }
  });
});
