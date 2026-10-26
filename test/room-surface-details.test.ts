import { describe, expect, it } from 'vitest';
import { evaluateBatch, resolveMedyRequest } from '@roomedy/spatial';
import { visitorActionSchema } from '@roomedy/contracts/commands';
import {
  DEFAULT_SURFACE_DETAIL,
  emptySurfaceAppearance,
  roomSurface,
  roomSurfaceDetail,
  surfaceDetailSchema,
  changedRoomSurface,
} from '@roomedy/contracts/surfaces';
import type { SurfaceDetail } from '@roomedy/contracts/surfaces';
import {
  commandRoom,
  door,
  piece,
  windowFeature,
} from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import {
  buildDesignScene,
  prepareGlbTextures,
} from '../apps/frontend/src/features/design-export/scene.js';
import {
  animateRoomMaterial,
  roomTexturePoint,
} from '../apps/frontend/src/features/room-view/room-material.js';
import type { roomSurfaceGeometry } from '../apps/frontend/src/features/room-view/room-material.js';
import { createSurfaceBlend } from '../apps/frontend/src/features/room-view/surfaces.js';

const detail: SurfaceDetail = {
  repeatWidthMm: 600,
  repeatHeightMm: 1200,
  direction: 1,
  sheen: 'satin',
};
const roomWithWalls = () => {
  const room = commandRoom([piece('desk')], [door(), windowFeature()]);
  room.room.surfaces = {
    walls: {
      color: { value: '#e6dfd2', status: 'estimated', sourceId: 'photo1' },
      texture: { value: 'plaster', status: 'estimated', sourceId: 'photo1' },
    },
  };
  return room;
};

describe('individual room materials retain domain truth', () => {
  it('inherits independent missing wall facts, patches one wall and undoes the whole choice', () => {
    const room = roomWithWalls(),
      session = new SessionController(room);
    try {
      expect(roomSurfaceDetail(room.room, 'north')).toEqual(
        DEFAULT_SURFACE_DETAIL,
      );
      expect(
        session.dispatch(
          [
            {
              type: 'set-room-surface',
              surface: 'north',
              texture: 'wood',
              detail,
            },
          ],
          'North panels',
        ).ok,
      ).toBe(true);
      const current = session.getSnapshot().workspace!.current;
      expect(roomSurface(current.room, 'north')).toEqual({
        color: '#e6dfd2',
        texture: 'wood',
      });
      expect(roomSurface(current.room, 'east')).toEqual({
        color: '#e6dfd2',
        texture: 'plaster',
      });
      expect(current.room.surfaces!.north!.color.status).toBe('unknown');
      expect(current.room.surfaces!.walls).toEqual(room.room.surfaces!.walls);
      expect(current.furniture).toEqual(room.furniture);
      expect(current.room.width).toEqual(room.room.width);
      expect(current.room.features).toEqual(room.room.features);
      expect(roomSurfaceDetail(current.room, 'north')).toEqual(detail);
      session.undo();
      expect(session.getSnapshot().workspace!.current.room).toEqual(room.room);
    } finally {
      session.dispose();
    }
  });

  it('all-walls colour patches preserve independent textures/detail and field evidence', () => {
    const room = roomWithWalls();
    room.room.surfaces!.north = {
      ...emptySurfaceAppearance(),
      texture: { value: 'wood', status: 'planned', sourceId: 'visitor-plan' },
      detail,
    };
    expect(
      changedRoomSurface(room.room, 'walls', {
        color: '#112233',
        texture: 'plaster',
        detail: DEFAULT_SURFACE_DETAIL,
      }),
    ).toEqual({ surface: 'walls', color: '#112233' });
    expect(
      changedRoomSurface(room.room, 'walls', {
        color: '#e6dfd2',
        texture: 'plaster',
        detail: DEFAULT_SURFACE_DETAIL,
      }),
    ).toEqual({
      surface: 'walls',
      color: '#e6dfd2',
      texture: 'plaster',
      detail: DEFAULT_SURFACE_DETAIL,
    });
    const result = evaluateBatch(
      room,
      [{ type: 'set-room-surface', surface: 'walls', color: '#112233' }],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    expect(roomSurface(result.room.room, 'north')).toEqual({
      color: '#112233',
      texture: 'wood',
    });
    expect(roomSurface(result.room.room, 'south')).toEqual({
      color: '#112233',
      texture: 'plaster',
    });
    expect(roomSurfaceDetail(result.room.room, 'north')).toEqual(detail);
    expect(result.room.room.surfaces!.walls!.texture).toEqual(
      room.room.surfaces!.walls!.texture,
    );
    expect(roomSurface(room.room, 'north').color).toBe('#e6dfd2');
  });

  it('does not invent an explicit override or provenance change for an inherited no-op', () => {
    const room = roomWithWalls();
    const result = evaluateBatch(
      room,
      [{ type: 'set-room-surface', surface: 'north', color: '#e6dfd2' }],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.room.room.surfaces).toEqual(room.room.surfaces);
  });

  it.each([0, 99, 3001, Number.NaN, Number.POSITIVE_INFINITY, 100.5])(
    'rejects invalid pattern size %s',
    (repeatWidthMm) => {
      expect(
        surfaceDetailSchema.safeParse({ ...detail, repeatWidthMm }).success,
      ).toBe(false);
    },
  );
  it('rejects a floor-only material on a named wall atomically', () => {
    expect(
      visitorActionSchema.safeParse({
        type: 'set-room-surface',
        surface: 'west',
        texture: 'tile',
      }).success,
    ).toBe(false);
    expect(
      surfaceDetailSchema.safeParse({
        ...detail,
        url: 'https://example.test/a',
      }).success,
    ).toBe(false);
  });

  it('round-trips new choices without changing baseline and reads legacy projects', () => {
    const room = roomWithWalls(),
      session = new SessionController(room);
    try {
      session.dispatch(
        [
          {
            type: 'set-room-surface',
            surface: 'west',
            color: '#123456',
            detail,
          },
        ],
        'West finish',
      );
      const restored = readProject(exportProject(session.getSnapshot())!);
      expect(restored.ok).toBe(true);
      if (restored.ok) {
        expect(roomSurfaceDetail(restored.value.current.room, 'west')).toEqual(
          detail,
        );
        expect(restored.value.baseline.room.surfaces).toEqual(
          room.room.surfaces,
        );
      }
      const legacy = new SessionController(commandRoom([]));
      try {
        expect(readProject(exportProject(legacy.getSnapshot())!).ok).toBe(true);
      } finally {
        legacy.dispose();
      }
    } finally {
      session.dispose();
    }
  });

  it('Medy names the correct wall and validates its material detail through normal commands', () => {
    const room = roomWithWalls();
    const result = resolveMedyRequest(
      room,
      'make the north wall wood with satin finish and pattern 60 x 120 cm',
      null,
    );
    expect(result?.kind).toBe('edits');
    if (result?.kind !== 'edits') throw new Error('expected-edits');
    expect(result.label).toBe('Change north wall finish');
    expect(result.actions).toEqual([
      {
        type: 'set-room-surface',
        surface: 'north',
        texture: 'wood',
        detail: { ...detail, direction: 0 },
      },
    ]);
    expect(evaluateBatch(room, result.actions, 'visitor').ok).toBe(true);
  });
});

describe('continuous physical texture coordinates and export ownership', () => {
  it('exports independently scaled wall samplers within the existing eight-canvas pixel budget', () => {
    const room = roomWithWalls();
    for (const [i, wall] of (
      ['north', 'east', 'south', 'west'] as const
    ).entries())
      room.room.surfaces![wall] = {
        ...emptySurfaceAppearance(),
        texture: {
          value: i % 2 ? 'linen' : 'wood',
          status: 'planned',
          sourceId: 'visitor-plan',
        },
        detail: { ...detail, repeatWidthMm: 400 + i * 100 },
      };
    const scene = buildDesignScene(room);
    const canvases: HTMLCanvasElement[] = [];
    try {
      const retire = prepareGlbTextures(scene.root, () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            createImageData: (w: number, h: number) => ({
              data: new Uint8ClampedArray(w * h * 4),
            }),
            putImageData: () => undefined,
          }),
        } as unknown as HTMLCanvasElement;
        canvases.push(canvas);
        return canvas;
      });
      expect(canvases.length).toBeLessThanOrEqual(8);
      retire();
      retire();
      expect(
        canvases.every((canvas) => canvas.width === 1 && canvas.height === 1),
      ).toBe(true);
    } finally {
      scene.dispose();
    }
  });
  it('projects independent wall axes in metres and exports each actual material', () => {
    expect(roomTexturePoint('floor', 2, 3, 4)).toEqual([2, 4]);
    expect(roomTexturePoint('north', 2, 3, 4)).toEqual([2, 3]);
    expect(roomTexturePoint('west', 2, 3, 4)).toEqual([4, 3]);
    const room = roomWithWalls();
    room.room.surfaces!.north = {
      color: { value: '#123456', status: 'planned', sourceId: 'visitor-plan' },
      texture: { value: 'wood', status: 'planned', sourceId: 'visitor-plan' },
      detail,
    };
    const scene = buildDesignScene(room);
    try {
      const wall = scene.root.getObjectByName('Wall north 0');
      if (!wall || !('material' in wall) || !('geometry' in wall))
        throw new Error('wall-missing');
      const material = wall.material as Parameters<
        typeof animateRoomMaterial
      >[0];
      const geometry = wall.geometry as ReturnType<typeof roomSurfaceGeometry>;
      expect(material.color.getHexString()).toBe('123456');
      expect(material.map!.repeat.x).toBeCloseTo(1 / 0.6);
      expect(material.map!.repeat.y).toBeCloseTo(1 / 1.2);
      expect(material.map!.rotation).toBeCloseTo(Math.PI / 2);
      expect(material.roughness).toBe(0.58);
      const position = geometry.getAttribute('position'),
        uv = geometry.getAttribute('uv');
      // Cube-local half extents plus the actual exported transform, independent of aperture segmentation.
      expect(uv.getX(0)).toBeCloseTo(
        position.getX(0) * wall.scale.x + wall.position.x,
      );
      expect(uv.getY(0)).toBeCloseTo(
        position.getY(0) * wall.scale.y + wall.position.y,
      );
      const east = scene.root.getObjectByName('Wall east 0');
      if (!east || !('material' in east)) throw new Error('east-missing');
      expect((east.material as typeof material).color.getHexString()).toBe(
        'e6dfd2',
      );
      expect((east.material as typeof material).map).not.toBe(material.map);
      let disposed = 0;
      material.map!.addEventListener('dispose', () => disposed++);
      scene.dispose();
      scene.dispose();
      expect(disposed).toBe(1);
    } finally {
      scene.dispose();
    }
  });

  it('retargets material detail finitely while keeping borrowed samplers and room state unchanged', () => {
    const room = roomWithWalls(),
      before = structuredClone(room),
      scene = buildDesignScene(room);
    try {
      const floor = scene.root.getObjectByName('Floor');
      if (!floor || !('material' in floor)) throw new Error('floor-missing');
      const material = floor.material as Parameters<
        typeof animateRoomMaterial
      >[0];
      const map = material.map;
      createSurfaceBlend(material);
      const motion = animateRoomMaterial(
        material,
        'floor',
        DEFAULT_SURFACE_DETAIL,
      );
      expect(
        animateRoomMaterial(material, 'floor', DEFAULT_SURFACE_DETAIL),
      ).toBe(motion);
      const shader = {
        uniforms: {},
        vertexShader: '#include <uv_vertex>\n#include <project_vertex>',
        fragmentShader: '#include <map_fragment>',
      } as Parameters<typeof material.onBeforeCompile>[0];
      material.onBeforeCompile(
        shader,
        {} as Parameters<typeof material.onBeforeCompile>[1],
      );
      expect(
        shader.vertexShader.match(/uniform vec4 roomedyPattern;/g),
      ).toHaveLength(1);
      expect(shader.vertexShader.match(/vec4 roomedyWorld =/g)).toHaveLength(1);
      createSurfaceBlend(material);
      expect(
        animateRoomMaterial(material, 'floor', DEFAULT_SURFACE_DETAIL),
      ).toBe(motion);
      expect(material.customProgramCacheKey()).toBe(
        'roomedy-world-surface-v1-floor',
      );
      motion.choose({ ...detail, direction: 2, sheen: 'gloss' });
      expect(motion.advance(0.02)).toBe(true);
      for (let i = 0; i < 100; i++) motion.advance(0.05);
      expect(motion.advance(0.05)).toBe(false);
      expect(material.roughness).toBe(0.28);
      expect(material.map).toBe(map);
      expect(room).toEqual(before);
    } finally {
      scene.dispose();
    }
  });
});
