import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const frontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { Group, PerspectiveCamera, Scene } = frontend(
  'three',
) as typeof ThreeTypes;
import type * as ThreeTypes from '../apps/frontend/node_modules/@types/three';
import {
  CATALOGUE,
  visitorCatalogueFurniture,
  wallMountedPose,
  evaluateBatch,
  resolveMedyRequest,
  resolveAssistantTask,
  LayoutSearch,
  validateSearchCandidate,
  furnitureSizePresets,
} from '@roomedy/spatial';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { commandRoom } from './fixtures/command-room.js';
import { assistantInput } from './fixtures/assistant.js';
import { pieceRepresentation } from '../apps/frontend/src/features/room-view/adapter.js';
import { isMirrorPart } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { furniturePartMotion } from '../apps/frontend/src/features/room-view/articulation.js';
import { createMirrorReflection } from '../apps/frontend/src/features/room-view/mirror-reflections.js';
import { createAssistantTools } from '../apps/backend/src/assistant/tools.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
  recoveryOf,
  readRecovery,
} from '../apps/frontend/src/features/session/project.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';

const ids = ['mirror-wall', 'mirror-standing', 'wardrobe-mirrored'];
const make = (id: string) => {
  const e = CATALOGUE.find((e) => e.id === id)!;
  return visitorCatalogueFurniture(
    e,
    {
      width: e.size.width.default,
      depth: e.size.depth.default,
      height: e.size.height.default,
    },
    { centerX: 4000, centerZ: 4000, quarterTurns: 0 },
    id,
    'modern',
  );
};

describe('supported room mirror variants', () => {
  it.each(ids)(
    '%s has bounded frame/glass geometry and a usable standard preset',
    (id) => {
      const e = CATALOGUE.find((e) => e.id === id)!,
        p = make(id);
      expect(
        furnitureSizePresets(e).some(
          (s) =>
            s.width === e.size.width.default &&
            s.height === e.size.height.default,
        ),
      ).toBe(true);
      for (const extent of ['min', 'default', 'max'] as const) {
        for (const axis of ['width', 'depth', 'height'] as const)
          p.dimensions[axis].value = e.size[axis][extent];
        const model = pieceRepresentation(p);
        if (model.kind !== 'procedural') throw Error('missing model');
        expect(model.parts.filter(isMirrorPart)).toHaveLength(1);
        for (const part of model.parts)
          for (let axis = 0; axis < 3; axis++) {
            expect(part.size[axis]).toBeGreaterThan(0);
            const limit =
              axis === 0
                ? p.dimensions.width.value!
                : axis === 1
                  ? p.dimensions.height.value!
                  : p.dimensions.depth.value!;
            expect(
              part.center[axis]! - part.size[axis]! / 2,
            ).toBeGreaterThanOrEqual((axis === 1 ? 0 : -limit / 2) - 0.001);
            expect(
              part.center[axis]! + part.size[axis]! / 2,
            ).toBeLessThanOrEqual((axis === 1 ? limit : limit / 2) + 0.001);
          }
      }
      if (id === 'mirror-standing') {
        const m = pieceRepresentation(p);
        if (m.kind !== 'procedural') throw Error('model');
        expect(m.parts.some((p) => p.name.startsWith('pivot-'))).toBe(true);
        expect(m.parts.some((p) => p.name.startsWith('stand-foot-'))).toBe(
          true,
        );
        expect(m.parts.some((p) => p.name === 'rear-crossbar')).toBe(true);
      }
    },
  );
  it.each(ids)(
    '%s uses canonical Apply/Undo/project/recovery and inherited themes',
    (id) => {
      const p = make(id),
        room = commandRoom();
      p.pose = wallMountedPose(room, p);
      expect(
        roomDocumentSchema.safeParse({ ...room, furniture: [p] }).success,
      ).toBe(true);
      const session = new SessionController(room);
      try {
        const before = session.getSnapshot().workspace!.current;
        const change = session.dispatch(
          [{ type: 'add', furniture: p }],
          'Add mirror',
        );
        expect(change.ok).toBe(true);
        const current = session.getSnapshot().workspace!.current;
        expect(current.furniture[0]!.finish).toBe('walnut');
        const project = exportProject(session.getSnapshot())!;
        expect(readProject(project).ok).toBe(true);
        const recovery = recoveryOf(session.getSnapshot());
        expect(readRecovery(JSON.stringify(recovery), Date.now()).ok).toBe(
          true,
        );
        session.undo();
        expect(session.getSnapshot().workspace!.current.furniture).toEqual(
          before.furniture,
        );
      } finally {
        session.dispose();
      }
    },
  );
  it('uses exact wall/height intents for the mounted mirror without moving other mirrors', () => {
    const room = commandRoom([make('mirror-wall'), make('mirror-standing')]);
    const edit = resolveMedyRequest(
      room,
      'Mount the Wall-hung mirror on the east wall at a bottom height of 1000 mm',
      'mirror-wall',
    );
    expect(edit).toMatchObject({
      kind: 'edits',
      actions: [
        {
          type: 'move',
          id: 'mirror-wall',
          pose: { quarterTurns: 1, bottomY: 1000 },
        },
      ],
    });
  });
  it('attaches exactly one wardrobe mirror to the same hinged leaf, with other door unchanged', () => {
    const model = pieceRepresentation(make('wardrobe-mirrored'));
    if (model.kind !== 'procedural') throw Error('model');
    const panel = model.parts.find(isMirrorPart)!,
      door = model.parts.find((p) => p.name === 'door--1')!,
      other = model.parts.find((p) => p.name === 'door-1')!;
    expect(furniturePartMotion(panel, model.parts, 'hinged', 600)).toEqual(
      furniturePartMotion(door, model.parts, 'hinged', 600),
    );
    expect(
      furniturePartMotion(panel, model.parts, 'hinged', 600)?.turn,
    ).not.toBe(furniturePartMotion(other, model.parts, 'hinged', 600)?.turn);
  });
  it('mounts a wall mirror to all four walls without losing vertical height or locks', () => {
    const room = commandRoom(),
      p = make('mirror-wall');
    for (const quarterTurns of [0, 1, 2, 3] as const) {
      p.pose = wallMountedPose(room, p, { ...p.pose, quarterTurns });
      const result = evaluateBatch(
        room,
        [{ type: 'add', furniture: p }],
        'visitor',
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.furniture[0]!.pose.bottomY).toBe(900);
      }
    }
    p.locks.position = true;
    const owned = { ...room, furniture: [p] };
    expect(
      evaluateBatch(
        owned,
        [
          {
            type: 'move',
            id: p.id,
            pose: {
              centerX: 3000,
              centerZ: 3000,
              quarterTurns: 0,
              bottomY: 1000,
            },
          },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
  });
  it.each(ids)(
    'exports the actual %s reflective face with its frame, without a live target',
    (id) => {
      const p = make(id),
        scene = buildDesignScene(commandRoom([p]));
      try {
        const mesh = scene.root.getObjectByName(
          id === 'wardrobe-mirrored' ? 'mirror-glass-door--1' : 'mirror-glass',
        );
        expect(mesh).toBeDefined();
        expect(scene.root.getObjectByName('Room reflection')).toBeUndefined();
      } finally {
        scene.dispose();
      }
    },
  );
});

describe('Medy mirror variants and provider-free preparation', () => {
  it.each([
    'Add a mirror near the wardrobe',
    'Add a full-length mirror near the wardrobe',
  ])(
    'retains the legacy floor variant for an incidental location: %s',
    (text) => {
      const task = resolveAssistantTask(
        commandRoom([make('wardrobe-mirrored')]),
        text,
        null,
        'mirror-location',
      );
      expect(task.goal?.additions).toHaveLength(1);
      expect(task.goal?.additions[0]?.catalogueId).toBe('full-length-mirror');
    },
  );

  it.each([
    ['Add a wall-hung mirror', 'mirror-wall'],
    ['Add a hanging mirror', 'mirror-wall'],
    ['Add a standing pivot mirror', 'mirror-standing'],
    ['Add a mirror with a pivot', 'mirror-standing'],
    ['Add a mirrored wardrobe', 'wardrobe-mirrored'],
    ['Add a wardrobe with one mirror on the door', 'wardrobe-mirrored'],
  ])('%s selects only the requested variant', async (text, id) => {
    const room = commandRoom(),
      input = assistantInput(room, text);
    const task = resolveAssistantTask(
      room,
      text,
      null,
      input.identity.operationId,
    );
    expect(task.goal?.additions).toHaveLength(1);
    expect(task.goal?.additions[0]?.catalogueId).toBe(id);
    const request = {
      room,
      goal: task.goal!,
      identity: input.identity,
      seed: 42,
      maxNodes: 2000,
    };
    const search = new LayoutSearch(request, task.scope);
    while (!search.step()) {}
    const result = search.finish();
    expect(result.candidate).toBeDefined();
    expect(
      validateSearchCandidate(request, result.candidate!, task.scope),
    ).not.toBeNull();
    const action = result.candidate!.actions.find((a) => a.type === 'add');
    if (action?.type !== 'add') throw Error('add');
    const tools = createAssistantTools(
      input,
      task,
      new AbortController().signal,
    );
    const reply = await tools.execute('prepare_edits', {
      actions: [
        {
          type: 'add',
          id: action.furniture.id,
          catalogueId: id,
          centerX: action.furniture.pose.centerX,
          centerZ: action.furniture.pose.centerZ,
          quarterTurns: action.furniture.pose.quarterTurns,
          finish: null,
          floorFinish: null,
          wallFinish: null,
        },
      ],
    });
    expect(reply.ok).toBe(true);
  });
  it.each([
    ['wall-hung mirror', 'mirror-wall'],
    ['standing pivot mirror', 'mirror-standing'],
    ['mirrored-door wardrobe', 'wardrobe-mirrored'],
  ])('exact coordinate addition selects %s', (label, id) => {
    const edit = resolveMedyRequest(
      commandRoom(),
      `add a ${label} at x 4000 mm z 4000 mm`,
      null,
    );
    expect(edit).toMatchObject({
      kind: 'edits',
      actions: [{ type: 'add', furniture: { catalogueId: id } }],
    });
  });
});

function camera(z = 5) {
  const c = new PerspectiveCamera(50, 1, 0.1, 100);
  c.position.set(0, 1, z);
  c.lookAt(0, 1, 0);
  c.updateMatrixWorld();
  return c;
}
const surface = (id: string, x = 0, z = 0) => {
  const object = new Group();
  object.position.set(x, 1, z);
  return { id, pieceId: id, object, width: 0.7, height: 1.5 };
};
describe('single bounded live mirror pass', () => {
  it('shares one512px non-MSAA target across forty surfaces, prioritizes selection and unregisters', () => {
    const pool = createMirrorReflection(),
      target = pool.reflector.getRenderTarget();
    try {
      expect([target.width, target.height, target.samples]).toEqual([
        512, 512, 0,
      ]);
      const remove = [];
      for (let n = 0; n < 40; n++)
        remove.push(pool.register(surface(`mirror-${n}`, n * 0.01)));
      expect(pool.update(camera(), 'mirror-30')).toBe('mirror-30');
      expect(pool.reflector.getRenderTarget()).toBe(target);
      remove[30]!();
      expect(pool.update(camera(), 'mirror-30')).toBe('mirror-0');
    } finally {
      pool.dispose();
    }
  });
  it('skips rear-facing, offscreen and hidden surfaces and follows their world transforms', () => {
    const pool = createMirrorReflection(),
      s = surface('one'),
      parent = new Group();
    parent.add(s.object);
    const remove = pool.register(s);
    try {
      expect(pool.update(camera(), null)).toBe('one');
      expect(pool.reflector.position.y).toBe(1);
      expect(pool.update(camera(-5), null)).toBeNull();
      s.object.position.x = 100;
      expect(pool.update(camera(), null)).toBeNull();
      s.object.position.x = 0;
      parent.visible = false;
      expect(pool.update(camera(), null)).toBeNull();
      parent.visible = true;
      parent.rotation.y = Math.PI;
      expect(pool.update(camera(), null)).toBeNull();
      parent.rotation.y = 0;
      s.object.position.x = 0.5;
      expect(pool.update(camera(), null)).toBe('one');
      expect(pool.reflector.position.x).toBeCloseTo(0.5);
      remove();
      expect(pool.update(camera(), null)).toBeNull();
    } finally {
      pool.dispose();
    }
  });
  it.each([false, true])(
    'excludes its own glossy backing while retaining other mirrors, restores visibility/state (failure=%s)',
    (fail) => {
      const pool = createMirrorReflection(),
        scene = new Scene(),
        overlay = new Group(),
        backing = new Group(),
        otherMirror = new Group();
      overlay.userData.roomedyEditorOverlay = true;
      backing.userData.roomedyMirrorSurface = 'one';
      otherMirror.userData.roomedyMirrorSurface = 'two';
      scene.add(overlay, backing, otherMirror);
      pool.register(surface('one'));
      pool.update(camera(), null);
      const targets: unknown[] = [];
      const renderer = {
        xr: { enabled: true },
        shadowMap: { autoUpdate: true },
        getRenderTarget: () => null,
        setRenderTarget: (target: unknown) => targets.push(target),
        state: { buffers: { depth: { setMask: () => {} } } },
        autoClear: true,
        render: () => {
          expect(overlay.visible).toBe(false);
          expect(backing.visible).toBe(false);
          expect(otherMirror.visible).toBe(true);
          if (fail) throw Error('optional-gpu-failure');
        },
      };
      try {
        pool.reflector.onBeforeRender(
          renderer as unknown as ThreeTypes.WebGLRenderer,
          scene,
          camera(),
          pool.reflector.geometry,
          Array.isArray(pool.reflector.material)
            ? pool.reflector.material[0]!
            : pool.reflector.material,
          new Group(),
        );
        expect(overlay.visible).toBe(true);
        expect(backing.visible).toBe(true);
        expect(otherMirror.visible).toBe(true);
        expect(renderer.xr.enabled).toBe(true);
        expect(renderer.shadowMap.autoUpdate).toBe(true);
        expect(targets.at(-1)).toBeNull();
        expect(pool.stats).toMatchObject({
          attempts: 1,
          failed: fail,
          surfaces: 1,
        });
        expect(pool.update(camera(), null)).toBe(fail ? null : 'one');
      } finally {
        pool.dispose();
      }
    },
  );
  it('disposes the only target and geometry exactly once and retires registration', () => {
    const pool = createMirrorReflection(),
      target = vi.spyOn(pool.reflector.getRenderTarget(), 'dispose'),
      geometry = vi.spyOn(pool.reflector.geometry, 'dispose');
    pool.register(surface('one'));
    pool.dispose();
    pool.dispose();
    expect(target).toHaveBeenCalledOnce();
    expect(geometry).toHaveBeenCalledOnce();
    expect(pool.update(camera(), null)).toBeNull();
  });
});
