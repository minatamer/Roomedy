import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { proposalActionSchema } from '@roomedy/contracts/commands';
import {
  FINISH_COLORS,
  roomSurface,
  emptySurfaceAppearance,
} from '@roomedy/contracts/surfaces';
import type { SurfaceTexture } from '@roomedy/contracts/surfaces';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import { evaluateBatch } from '@roomedy/spatial';
import { commandRoom, piece } from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import {
  createDraft,
  adoptHypothesis,
  correctDraft,
  reconcileRoomEvidence,
} from '../apps/frontend/src/features/room-intake/draft.js';
import type { ReviewResult } from '../apps/frontend/src/features/room-intake/draft.js';
import {
  recognitionFixture,
  bedroomExample,
} from '../apps/backend/src/recognition/fixtures.js';
import { recognitionRequest } from '../apps/backend/src/recognition/recognize.js';
import { recognitionInput } from './fixtures/operation.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import {
  createSurfaces,
  roomSurfaceMap,
  createSurfaceBlend,
  surfaceProperties,
} from '../apps/frontend/src/features/room-view/surfaces.js';

const take = (result: ReviewResult) => {
  if (!result.ok) throw new Error(result.message);
  return result.draft;
};
const estimated = <T>(value: T) => ({
  value,
  status: 'estimated' as const,
  sourceId: 'p1',
});
const hypothesis = () => ({
  ...recognitionFixture('empty', ['p1']),
  sourcePurposes: [
    { id: 'p1', purpose: 'room' as 'room' | 'furniture' | 'unknown' },
  ],
  surfaces: {
    floor: {
      color: estimated('#b9986f'),
      texture: estimated('planks' as const),
    },
    walls: {
      color: estimated('#e6dfd2'),
      texture: estimated('smooth' as SurfaceTexture),
    },
  },
});
const draft = () => {
  const d = createDraft('partial', 'room');
  d.sources = [{ id: 'p1', purpose: 'auto', available: true }];
  return d;
};

describe('independent bounded room appearance', () => {
  it('keeps legacy defaults and leaves geometry/evidence/other surface unchanged for one Undo-able choice', () => {
    const room = commandRoom([piece('a')]),
      session = new SessionController(room);
    try {
      expect(roomSurface(room.room, 'floor')).toEqual({
        color: FINISH_COLORS.oak,
        texture: 'planks',
      });
      expect(roomSurface(room.room, 'walls')).toEqual({
        color: FINISH_COLORS.ivory,
        texture: 'plaster',
      });
      expect(
        session.dispatch(
          [
            {
              type: 'set-room-surface',
              surface: 'walls',
              color: '#336699',
              texture: 'linen',
            },
          ],
          'Wall finish',
        ),
      ).toMatchObject({ ok: true, changed: true });
      const after = session.getSnapshot().workspace!.current;
      expect(after.furniture).toEqual(room.furniture);
      const { surfaces, ...rest } = after.room;
      expect(rest).toEqual(room.room);
      expect(surfaces?.walls?.color).toEqual({
        value: '#336699',
        status: 'planned',
        sourceId: 'visitor-plan',
      });
      expect(surfaces?.floor).toBeUndefined();
      expect(session.undo()).toMatchObject({ ok: true });
      expect(session.getSnapshot().workspace!.current.room).toEqual(room.room);
    } finally {
      session.dispose();
    }
  });
  it('does not rewrite evidence for unchanged or omitted fields, or create an empty override on a no-op', () => {
    const room = commandRoom([]);
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'set-room-surface',
            surface: 'walls',
            color: FINISH_COLORS.ivory,
            texture: 'plaster',
          },
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: true, changed: false });
    room.room.surfaces = {
      walls: { color: estimated('#e6dfd2'), texture: estimated('smooth') },
    };
    const result = evaluateBatch(
      room,
      [
        {
          type: 'set-room-surface',
          surface: 'walls',
          color: '#e6dfd2',
          texture: 'linen',
        },
      ],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.room.surfaces?.walls?.color).toEqual(
        room.room.surfaces.walls!.color,
      );
      expect(result.room.room.surfaces?.walls?.texture.status).toBe('planned');
    }
  });
  it.each([
    { surface: 'walls', color: 'red' },
    { surface: 'floor', color: '#123' },
    { surface: 'floor', texture: 'linen' },
    { surface: 'walls', texture: 'tile' },
    { surface: 'floor', texture: 'http://remote.test/map' },
    { surface: 'ceiling', color: '#ffffff' },
  ])(
    'rejects unsupported appearance without relaxing assistant or room schemas: %j',
    (input) => {
      const action = { type: 'set-room-surface', ...input };
      expect(evaluateBatch(commandRoom([]), [action], 'visitor')).toMatchObject(
        { ok: false, code: 'invalid-input' },
      );
      expect(proposalActionSchema.safeParse(action).success).toBe(false);
    },
  );
  it('allows a nonspatial finish choice without changing existing physical conflicts', () => {
    const room = commandRoom([piece('a'), piece('b')]);
    const r = evaluateBatch(
      room,
      [{ type: 'set-room-surface', surface: 'floor', texture: 'tile' }],
      'visitor',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.room.furniture).toEqual(room.furniture);
  });
  it('legacy palette actions replace custom colour while preserving independently chosen texture', () => {
    const room = commandRoom([]);
    room.room.surfaces = {
      walls: { color: estimated('#112233'), texture: estimated('wood') },
    };
    const r = evaluateBatch(
      room,
      [{ type: 'room-finish', floorFinish: 'oak', wallFinish: 'ivory' }],
      'visitor',
    );
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(roomSurface(r.room.room, 'walls')).toEqual({
        color: FINISH_COLORS.ivory,
        texture: 'wood',
      });
  });
  it('round-trips optional appearance with baseline intact and rejects a cross-surface texture on import', () => {
    const s = new SessionController(commandRoom([]));
    try {
      s.dispatch(
        [
          {
            type: 'set-room-surface',
            surface: 'floor',
            color: '#8693a1',
            texture: 'concrete',
          },
        ],
        'Floor',
      );
      const r = readProject(exportProject(s.getSnapshot())!);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(roomSurface(r.value.current.room, 'floor')).toEqual({
          color: '#8693a1',
          texture: 'concrete',
        });
        expect(r.value.baseline.room.surfaces).toBeUndefined();
        r.value.current.room.surfaces!.floor!.texture = {
          value: 'linen',
          status: 'planned',
          sourceId: 'visitor-plan',
        };
        expect(roomDocumentSchema.safeParse(r.value.current).success).toBe(
          false,
        );
      }
    } finally {
      s.dispose();
    }
  });
});

describe('source-bound photo appearance estimates', () => {
  it('adopts useful room appearance without inventing room measurements or frame confirmation', () => {
    const next = take(adoptHypothesis(draft(), hypothesis(), () => 'unused'));
    expect(next.room.room.width.value).toBeNull();
    expect(next.shape).toBe('unknown');
    expect(next.room.room.surfaces?.walls?.color).toEqual(estimated('#e6dfd2'));
  });
  it('preserves a deliberate colour correction while accepting texture evidence, then retires only removed-source estimates', () => {
    const initial = take(
      adoptHypothesis(draft(), hypothesis(), () => 'unused'),
    );
    const changed = take(
      correctDraft(initial, [
        { type: 'set-room-surface', surface: 'walls', color: '#445566' },
      ]),
    );
    const raw = hypothesis();
    raw.surfaces.walls.texture = estimated('plaster');
    const merged = take(adoptHypothesis(changed, raw, () => 'unused'));
    expect(merged.room.room.surfaces?.walls?.color.status).toBe('planned');
    expect(merged.room.room.surfaces?.walls?.texture.value).toBe('plaster');
    merged.sources = [];
    reconcileRoomEvidence(merged);
    expect(merged.room.room.surfaces?.walls?.color.value).toBe('#445566');
    expect(merged.room.room.surfaces?.walls?.texture.status).toBe('unknown');
    expect(merged.room.room.surfaces?.floor?.color.status).toBe('unknown');
  });
  it.each(['furniture', 'unknown'] as const)(
    'downgrades %s source appearance and retires its prior unreviewed evidence',
    (purpose) => {
      const raw = hypothesis();
      raw.sourcePurposes = [{ id: 'p1', purpose }];
      const parsed = parseDraftHypothesis(raw, ['p1'], ['p1']);
      expect(parsed?.surfaces?.walls).toEqual(emptySurfaceAppearance());
      const prior = take(
        adoptHypothesis(draft(), hypothesis(), () => 'unused'),
      );
      const next = take(adoptHypothesis(prior, raw, () => 'unused'));
      expect(next.room.room.surfaces?.walls?.color.status).toBe('unknown');
    },
  );
  it('does not allow an explicit furniture-only image to establish the room finish', () => {
    const d = draft();
    d.sources[0]!.purpose = 'furniture';
    expect(
      take(adoptHypothesis(d, hypothesis(), () => 'unused')).room.room.surfaces
        ?.walls?.color.status,
    ).toBe('unknown');
  });
  it.each(['foreign', 'bad-colour', 'confirmed', 'wrong-texture'])(
    'rejects %s appearance evidence',
    (kind) => {
      const raw: Record<string, unknown> = structuredClone(hypothesis());
      const surfaces = raw.surfaces as ReturnType<
        typeof hypothesis
      >['surfaces'];
      if (kind === 'foreign') surfaces.walls.color.sourceId = 'not-supplied';
      if (kind === 'bad-colour') surfaces.walls.color.value = '#xyzxyz';
      if (kind === 'confirmed')
        Object.assign(surfaces.walls.color, { status: 'confirmed' });
      if (kind === 'wrong-texture')
        Object.assign(surfaces.walls.texture, { value: 'carpet' });
      expect(parseDraftHypothesis(raw, ['p1'], ['p1'])).toBeNull();
    },
  );
  it('builds a bounded strict provider request and authors coherent fake example surfaces', async () => {
    const input = await recognitionInput(),
      request = recognitionRequest(input, []);
    expect(request.instructions).toContain('six-digit #RRGGBB');
    expect(JSON.stringify(request.format.schema)).toContain('surfaces');
    const example = bedroomExample([{ id: 'p1', purpose: 'auto' }]);
    const parsed = parseDraftHypothesis(example, ['p1'], ['p1']);
    expect(parsed?.surfaces?.floor.texture.value).toBe('planks');
    expect(parsed?.surfaces?.walls.color.status).toBe('estimated');
  });
});

describe('owned textures, finite blending and export appearance', () => {
  it('exports semantic custom colours and texture targets with bounded owned maps', () => {
    const room = commandRoom([]);
    room.room.surfaces = {
      floor: { color: estimated('#445566'), texture: estimated('tile') },
      walls: { color: estimated('#998877'), texture: estimated('linen') },
    };
    const scene = buildDesignScene(room);
    try {
      const floor = scene.root.getObjectByName('Floor');
      if (!floor || !('material' in floor)) throw new Error('floor-missing');
      const mat = floor.material as {
        color: { getHexString(): string };
        map: { name: string };
      };
      expect(mat.color.getHexString()).toBe('445566');
      expect(mat.map.name).toBe('roomedy-tile');
    } finally {
      scene.dispose();
    }
  });
  it('blends without per-frame allocation and settles the latest queued retarget', async () => {
    const requireFrontend = createRequire(
      new URL('../apps/frontend/package.json', import.meta.url),
    );
    type Material = Parameters<typeof createSurfaceBlend>[0];
    const { MeshStandardMaterial } = (await import(
      pathToFileURL(
        requireFrontend.resolve('three/src/materials/MeshStandardMaterial.js'),
      ).href
    )) as { MeshStandardMaterial: new () => Material };
    const maps = createSurfaces(),
      mat = new MeshStandardMaterial();
    mat.map = maps.floor;
    const blend = createSurfaceBlend(mat);
    const shader = {
      uniforms: {},
      fragmentShader: '#include <map_fragment>',
      vertexShader: '',
    } as Parameters<Material['onBeforeCompile']>[0];
    mat.onBeforeCompile(
      shader,
      {} as Parameters<Material['onBeforeCompile']>[1],
    );
    expect(shader.fragmentShader).toContain('mix(texture2D');
    blend.choose(roomSurfaceMap(maps, 'tile'));
    blend.advance(0.02);
    expect(mat.map).toBe(maps.tile);
    expect(mat.normalMap).toBeNull();
    expect(mat.roughnessMap).toBeNull();
    const first = shader.uniforms.roomedySurfaceMix!.value as number;
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(1);
    blend.choose(maps.concrete);
    blend.choose(maps.plaster);
    for (let i = 0; i < 40; i++) blend.advance(0.02);
    expect(mat.map).toBe(maps.plaster);
    expect(mat.normalMap).toBe(surfaceProperties(maps.plaster).normalMap);
    expect(mat.roughnessMap).toBe(surfaceProperties(maps.plaster).roughnessMap);
    expect(blend.advance(0.02)).toBe(false);
    expect(shader.uniforms.roomedySurfaceMix!.value).toBe(1);
    mat.dispose();
    maps.dispose();
  });
});
