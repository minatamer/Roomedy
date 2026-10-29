import { describe, it, expect } from 'vitest';
import {
  roomSurface,
  isEstimatedPlainSurface,
} from '@roomedy/contracts/surfaces';
import {
  furnitureMaterialTargets,
  furnitureAppearanceSwatches,
} from '@roomedy/contracts/furniture-materials';
import { evaluateBatch, resolveMedyRequest } from '@roomedy/spatial';
import {
  bedroomExample,
  recognitionFixture,
} from '../apps/backend/src/recognition/fixtures.js';
import {
  createDraft,
  adoptHypothesis,
} from '../apps/frontend/src/features/room-intake/draft.js';
import {
  presentationRoom,
  featureBox,
  wallBoxes,
} from '../apps/frontend/src/features/room-view/adapter.js';
import {
  createSurfaces,
  detailedParts,
} from '../apps/frontend/src/features/room-view/surfaces.js';
import { proceduralParts } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';

const unknown = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
const draft = () => {
  const d = createDraft('furnished', 'photo-room');
  d.sources = [{ id: 'photo', purpose: 'room', available: true }];
  return d;
};
const adopt = (raw: unknown) => {
  let n = 0;
  const result = adoptHypothesis(draft(), raw, () => `entity${++n}`);
  if (!result.ok) throw new Error(result.message);
  return result.draft;
};

describe('general photo material evidence', () => {
  it('previews a cover edit with cover swatches while keeping the pillow colour separate', () => {
    const before = {
      finish: 'ivory' as const,
      materials: { softColor: '#f0eee7', coverColor: '#b8a48d' },
    };
    expect(
      furnitureAppearanceSwatches(
        before,
        {
          ...before,
          materials: { ...before.materials, coverColor: '#426b95' },
        },
        'bed',
      ),
    ).toEqual({ role: 'blanket', before: '#b8a48d', after: '#426b95' });
    expect(
      furnitureAppearanceSwatches(
        before,
        { ...before, materials: { ...before.materials, coverColor: null } },
        'bed',
      ),
    ).toEqual({ role: 'blanket', before: '#b8a48d', after: '#f0eee7' });
  });
  it.each(['#294e8c', '#a26c43'])(
    'keeps an independently observed cover %s and unrelated floor material',
    (cover) => {
      const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
      const bed = raw.observations.find(
        (o) => o.catalogueId === 'procedural-bed',
      )!;
      bed.appearance = {
        ...bed.appearance!,
        softColor: '#f0eee7',
        coverColor: cover,
        coverPattern: 'fabric',
      };
      raw.surfaces!.floor.color = {
        value: '#346b7c',
        status: 'estimated',
        sourceId: 'photo',
      };
      raw.surfaces!.floor.texture = {
        value: 'tile',
        status: 'estimated',
        sourceId: 'photo',
      };
      const d = adopt(raw),
        piece = d.room.furniture.find(
          (p) => p.catalogueId === 'procedural-bed',
        )!;
      expect(piece.materials).toMatchObject({
        softColor: '#f0eee7',
        coverColor: cover,
        coverPattern: 'fabric',
      });
      const targets = furnitureMaterialTargets(piece, 'bed');
      expect(targets.soft.color).toBe('#f0eee7');
      expect(targets.blanket.color).toBe(cover);
      expect(roomSurface(d.room.room, 'floor')).toEqual({
        color: '#346b7c',
        texture: 'tile',
      });
      expect(d.room.room.surfaces!.floor!.color.sourceId).toBe('photo');
    },
  );
  it('uses a neutral unknown floor while preserving legacy and explicit floor choices', () => {
    const fresh = draft();
    expect(roomSurface(fresh.room.room, 'floor')).toEqual({
      color: '#b0b0ab',
      texture: 'smooth',
    });
    expect(fresh.room.room.surfaces!.floor!.color.status).toBe('unknown');
    expect(
      roomSurface({ floorFinish: 'oak', wallFinish: 'ivory' }, 'floor').texture,
    ).toBe('planks');
  });
  it('allows appearance edits on illustrated photo furniture without assigning missing dimensions', () => {
    const room = createManualRoom('partial'),
      bed = room.furniture.find((p) => p.catalogueId === 'procedural-bed')!;
    bed.dimensions = { width: unknown(), depth: unknown(), height: unknown() };
    const result = evaluateBatch(
      room,
      [
        {
          type: 'set-furniture-materials',
          id: bed.id,
          materials: { coverColor: '#426b95', softPattern: 'fabric' },
        },
      ],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    const changed = result.room.furniture.find((p) => p.id === bed.id)!;
    expect(changed.dimensions).toEqual(bed.dimensions);
    expect(changed.materials?.coverColor).toBe('#426b95');
  });
  it('keeps cover changes reviewable and rejects cover roles on unrelated pieces', () => {
    const room = createManualRoom('partial'),
      bed = room.furniture.find((p) => p.catalogueId === 'procedural-bed')!;
    const request = resolveMedyRequest(
      room,
      'Paint the bed cover #426b95',
      bed.id,
    );
    expect(request?.kind).toBe('edits');
    if (request?.kind !== 'edits') throw new Error('missing-cover-request');
    const result = evaluateBatch(room, request.actions, 'visitor');
    if (!result.ok) throw new Error(result.code);
    expect(
      result.room.furniture.find((p) => p.id === bed.id)!.materials?.coverColor,
    ).toBe('#426b95');
    expect(
      result.room.furniture.find((p) => p.id === bed.id)!.materials?.softColor,
    ).toBe(bed.materials?.softColor);
    const wardrobe = room.furniture.find((p) => p.id !== bed.id)!;
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'set-furniture-materials',
            id: wardrobe.id,
            materials: { coverColor: '#426b95' },
          },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
  });
});

describe('observed openings survive incomplete grouping and geometry', () => {
  it('adopts one visible ungrouped door without fabricating metric or hinge facts', () => {
    const raw = recognitionFixture('unknown-hinge', ['photo']);
    const door = raw.observations.find((o) => o.kind === 'door')!;
    for (const field of ['width', 'height', 'offset', 'sill'] as const)
      door[field] = unknown();
    raw.groups = raw.groups
      .map((group) => group.filter((ref) => ref !== door.ref))
      .filter((group) => group.length);
    const d = adopt(raw),
      before = structuredClone(d.room),
      feature = d.room.room.features.find((f) => f.kind === 'door')!;
    expect(feature).toBeDefined();
    expect(feature.width.value).toBeNull();
    expect(featureBox(d.room, feature)).toBeNull();
    const projected = presentationRoom(d.room),
      shown = projected.room.features.find((f) => f.id === feature.id)!;
    expect(featureBox(projected, shown)).not.toBeNull();
    expect(shown.width.status).toBe('estimated');
    if (shown.kind === 'door' && feature.kind === 'door')
      expect(shown.hinge).toBe(feature.hinge);
    expect(wallBoxes(projected, shown.wall as 'north')).not.toEqual(
      wallBoxes(
        { ...projected, room: { ...projected.room, features: [] } },
        shown.wall as 'north',
      ),
    );
    expect(d.room).toEqual(before);
  });
  it('does not invent a door from the room type or merge ambiguous ungrouped candidates', () => {
    const raw = recognitionFixture('unknown-hinge', ['photo']);
    const door = raw.observations.find((o) => o.kind === 'door')!;
    const absent = structuredClone(raw);
    absent.observations = absent.observations.filter((o) => o.kind !== 'door');
    absent.groups = absent.groups
      .map((group) => group.filter((ref) => ref !== door.ref))
      .filter((group) => group.length);
    expect(
      adopt(absent).room.room.features.some((f) => f.kind === 'door'),
    ).toBe(false);
    raw.groups = raw.groups
      .map((group) => group.filter((ref) => ref !== door.ref))
      .filter((group) => group.length);
    raw.observations.push({
      ...structuredClone(door),
      ref: 'another-visible-door',
      wall: 'unknown',
      wallEvidence: { status: 'unknown', sourceId: null },
    });
    expect(adopt(raw).room.room.features.some((f) => f.kind === 'door')).toBe(
      false,
    );
  });
});

describe('subtle detail shares live and export material owners', () => {
  it('keeps planned plain pixels uniform and allocates fine paint only when requested', () => {
    const surfaces = createSurfaces();
    try {
      expect(
        [...(surfaces.smooth.image.data as Uint8Array)].every((c) => c === 255),
      ).toBe(true);
      const data = surfaces.paint.image.data as Uint8Array;
      expect(Math.min(...data)).toBe(252);
      expect(Math.max(...data)).toBe(255);
      const room = createManualRoom('partial');
      expect(isEstimatedPlainSurface(room.room, 'walls')).toBe(false);
      room.room.surfaces!.walls!.texture = {
        value: 'smooth',
        status: 'estimated',
        sourceId: 'photo',
      };
      expect(isEstimatedPlainSurface(room.room, 'walls')).toBe(true);
    } finally {
      surfaces.dispose();
    }
  });
  it('gives drawer gaps and bedding piping dark detail without changing the piece envelope', () => {
    const size = { width: 500, depth: 450, height: 550 };
    const parts = proceduralParts('storage', size, 'drawer', 'bedside-drawers');
    expect(parts.find((p) => p.name === 'panel-reveal')?.role).toBe('detail');
    const hinged = proceduralParts(
      'storage',
      size,
      'hinged',
      'bedside-storage-fixed',
    );
    const face = hinged.find((p) => p.name === 'door--1')!,
      reveal = hinged.find((p) => p.name === 'panel-reveal')!;
    expect(face.size[0]).toBeLessThan(reveal.size[0]);
    expect(face.size[1]).toBeLessThan(reveal.size[1]);
    const bedSize = { width: 1600, depth: 2100, height: 1000 };
    expect(
      detailedParts(proceduralParts('bed', bedSize, 'none'), bedSize)
        .filter((p) => p.name.includes('-seam-'))
        .every((p) => p.role === 'detail'),
    ).toBe(true);
    const room = createManualRoom('partial'),
      bed = room.furniture.find((p) => p.catalogueId === 'procedural-bed')!;
    bed.materials = {
      ...bed.materials,
      upholstery: 'linen',
      softColor: '#eeeeee',
      coverColor: '#426b95',
      coverPattern: 'fabric',
    };
    const scene = buildDesignScene(room);
    try {
      const covers: string[] = [],
        seams: string[] = [];
      scene.root.traverse((node) => {
        const mesh = node as typeof node & {
          isMesh?: boolean;
          material?: { color: { getHexString(): string } };
        };
        if (!mesh.isMesh || !mesh.material) return;
        const m = mesh.material;
        if (node.name === 'blanket') covers.push(m.color.getHexString());
        if (node.name.includes('-seam-')) seams.push(m.color.getHexString());
      });
      expect(covers).toContain('426b95');
      expect(seams.length).toBeGreaterThan(0);
      expect(seams.every((color) => color !== 'eeeeee')).toBe(true);
    } finally {
      scene.dispose();
    }
  });
});
