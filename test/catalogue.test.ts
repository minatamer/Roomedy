import { describe, expect, it } from 'vitest';
import {
  CATALOGUE,
  findCatalogueEntry,
  supportsDimensions,
} from '@roomedy/spatial';
import { catalogueEntrySchema } from '@roomedy/contracts/catalogue';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { VERSIONS } from '@roomedy/contracts/policy';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  FINISH_PRESETS,
  previewFinishPreset,
} from '../apps/frontend/src/features/catalogue/finishes.js';
import {
  resolveRepresentation,
  proceduralParts,
} from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { SAMPLE_EXPECTATIONS } from './fixtures/spatial-expectations.js';

describe('dimensioned catalogue and representations', () => {
  it('resolves versioned essentials and rejects invented commerce fields', () => {
    expect(new Set(CATALOGUE.map((e) => e.category))).toEqual(
      new Set([
        'bed',
        'desk',
        'chair',
        'wardrobe',
        'storage',
        'mirror',
        'tv',
        'seating',
        'table',
        'lighting',
      ]),
    );
    for (const entry of CATALOGUE) {
      expect(catalogueEntrySchema.safeParse(entry).success).toBe(true);
      expect(
        catalogueEntrySchema.safeParse({ ...entry, price: 1 }).success,
      ).toBe(false);
      expect(Object.isFrozen(entry.size.width)).toBe(true);
    }
    expect(findCatalogueEntry('procedural-bed', 'unsupported')).toBeUndefined();
  });
  it('builds min/max procedural variants inside their semantic envelope and on the floor', () => {
    for (const entry of CATALOGUE)
      for (const bound of ['min', 'max'] as const) {
        const size = {
          width: entry.size.width[bound],
          depth: entry.size.depth[bound],
          height: entry.size.height[bound],
        };
        const parts = proceduralParts(
          entry.category,
          size,
          entry.accessMechanism,
          entry.assetId,
        );
        const lows = [Infinity, Infinity, Infinity],
          highs = [-Infinity, -Infinity, -Infinity];
        for (const part of parts)
          for (const axis of [0, 1, 2] as const) {
            expect(part.size[axis]).toBeGreaterThan(0);
            lows[axis] = Math.min(
              lows[axis]!,
              part.center[axis] - part.size[axis] / 2,
            );
            highs[axis] = Math.max(
              highs[axis]!,
              part.center[axis] + part.size[axis] / 2,
            );
          }
        expect(lows[0]).toBeGreaterThanOrEqual(-size.width / 2);
        expect(highs[0]).toBeLessThanOrEqual(size.width / 2);
        expect(lows[2]).toBeGreaterThanOrEqual(-size.depth / 2);
        expect(highs[2]).toBeLessThanOrEqual(size.depth / 2);
        expect(lows[1]).toBe(0);
        expect(highs[1]).toBeLessThanOrEqual(size.height);
      }
  });
  it('does not stretch fixed meshes or silently change size when a mesh is missing', () => {
    const entry = findCatalogueEntry('chair-desk-fixed', VERSIONS.catalogue)!;
    const size = { width: 670, depth: 630, height: 1216 };
    expect(resolveRepresentation(entry, size).kind).toBe('mesh');
    const fallback = resolveRepresentation(entry, size, false);
    expect(fallback).toMatchObject({ kind: 'procedural', footprint: size });
    expect(resolveRepresentation(entry, { ...size, width: 671 }).kind).toBe(
      'unavailable',
    );
    expect(supportsDimensions(entry, { ...size, width: NaN })).toBe(false);
    expect(resolveRepresentation(undefined, size).kind).toBe('unavailable');
  });
  it.each([
    ['chair-desk-fixed', { width: 680, depth: 630, height: 1216 }, 'clay'],
    ['procedural-desk', { width: 1900, depth: 600, height: 740 }, 'oak'],
  ] as const)(
    'preserves measured owned dimensions beyond %s representation eligibility',
    (id, size, finish) => {
      const entry = findCatalogueEntry(id, VERSIONS.catalogue)!;
      expect(supportsDimensions(entry, size)).toBe(false);
      expect(resolveRepresentation(entry, size).kind).toBe('unavailable');
      const owned = resolveRepresentation(entry, size, true, {
        ownership: 'owned',
        finish,
      });
      expect(owned.kind).toBe('procedural');
      expect(owned).toMatchObject({ footprint: size });
      expect(
        resolveRepresentation(entry, { ...size, width: Infinity }, true, {
          ownership: 'owned',
          finish,
        }).kind,
      ).toBe('unavailable');
    },
  );
});

describe('authored fixture truth', () => {
  it('keeps the three starting conditions and disclosed conflict independent and structurally valid', () => {
    for (const kind of ['sample', 'empty', 'partial', 'conflict'] as const)
      expect(
        roomDocumentSchema.safeParse(createRoomFixture(kind)).success,
      ).toBe(true);
    expect(createRoomFixture('empty').furniture).toEqual([]);
    expect(createRoomFixture('partial').intent.condition).toBe('partial');
    expect(createRoomFixture('partial').room.height.status).toBe('unknown');
    const a = createRoomFixture();
    a.furniture[0]!.pose.centerX = 9999;
    expect(createRoomFixture().furniture[0]!.pose.centerX).toBe(1000);
  });
  it('matches hand-derived corners, opening intervals and known overlap without a spatial-engine oracle', () => {
    const room = createRoomFixture();
    for (const item of room.furniture) {
      const width = item.dimensions.width.value!,
        depth = item.dimensions.depth.value!;
      const [w, d] =
        item.pose.quarterTurns % 2 ? [depth, width] : [width, depth];
      const { centerX: x, centerZ: z } = item.pose;
      expect([
        [x - w / 2, z - d / 2],
        [x + w / 2, z - d / 2],
        [x + w / 2, z + d / 2],
        [x - w / 2, z + d / 2],
      ]).toEqual(
        SAMPLE_EXPECTATIONS.corners[
          item.id as keyof typeof SAMPLE_EXPECTATIONS.corners
        ],
      );
    }
    for (const feature of room.room.features) {
      const expected =
        SAMPLE_EXPECTATIONS.openings[
          feature.id as keyof typeof SAMPLE_EXPECTATIONS.openings
        ];
      expect({
        wall: feature.wall,
        start: feature.offset.value,
        end: feature.offset.value! + feature.width.value!,
      }).toEqual(expected);
    }
    const conflict = createRoomFixture('conflict');
    const bed = conflict.furniture[0]!,
      desk = conflict.furniture[1]!;
    const overlapX =
      Math.min(bed.pose.centerX + 800, desk.pose.centerX + 600) -
      Math.max(bed.pose.centerX - 800, desk.pose.centerX - 600);
    const overlapZ =
      Math.min(bed.pose.centerZ + 1050, desk.pose.centerZ + 300) -
      Math.max(bed.pose.centerZ - 1050, desk.pose.centerZ - 300);
    expect(overlapX * overlapZ).toBe(SAMPLE_EXPECTATIONS.conflict.areaMm2);
  });
  it('finish previews preserve identity, geometry, ownership, locks and revision, reporting unavailable recolors', () => {
    const room = createRoomFixture();
    const before = structuredClone(room);
    for (const preset of FINISH_PRESETS) {
      const preview = previewFinishPreset(room, preset.id);
      for (const [i, item] of preview.room.furniture.entries()) {
        const original = before.furniture[i]!;
        expect({ ...item, finish: original.finish }).toEqual(original);
        if (original.ownership === 'owned')
          expect(item.finish).toBe(original.finish);
      }
      expect(preview.room.roomRevision).toBe(room.roomRevision);
      expect(preview.unavailableIds).toContain('chair_1');
    }
    expect(room).toEqual(before);
  });
  it('keeps the sample shelf and its front access outside the entrance swing envelope', () => {
    const storage = createRoomFixture().furniture.find(
      (item) => item.id === 'storage_1',
    )!;
    // Quarter-turn 1: 350 mm across X, front/access toward -X; entrance ends at X=1100.
    const nearestAccessX = storage.pose.centerX - 350 / 2 - 600;
    expect(nearestAccessX).toBeGreaterThan(1100);
  });
});

describe('owner-selected initial furniture protection', () => {
  it('starts owned and proposed presets movable and rotatable, protects only dimensions and isolates lock changes', () => {
    for (const kind of ['sample', 'partial'] as const) {
      const room = createRoomFixture(kind);
      for (const item of room.furniture)
        expect(item.locks).toEqual({
          position: false,
          rotation: false,
          dimensions: true,
        });
      room.furniture[0]!.locks.position = true;
      expect(createRoomFixture(kind).furniture[0]!.locks.position).toBe(false);
    }
  });
});
