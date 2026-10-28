import { describe, expect, it } from 'vitest';
import {
  furnitureMaterialTargets,
  furnitureAppearanceSwatches,
  openingMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import {
  proposalActionSchema,
  visitorActionSchema,
} from '@roomedy/contracts/commands';
import { evaluateBatch, resolveMedyRequest } from '@roomedy/spatial';
import {
  commandRoom,
  piece,
  door,
  windowFeature,
} from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { createFurnitureMaterials } from '../apps/frontend/src/features/room-view/furniture-material.js';
import { createSurfaces } from '../apps/frontend/src/features/room-view/surfaces.js';

describe('RGB and neutral patterns keep one canonical appearance', () => {
  it('applies leaf/frame/body colours and patterns in one command, persists and undoes exactly', () => {
    const opening = door(),
      room = commandRoom([piece('desk')], [opening]),
      session = new SessionController(room);
    try {
      const result = session.dispatch(
        [
          {
            type: 'set-opening-materials',
            id: opening.id,
            materials: {
              color: '#234567',
              texture: 'stripes',
              frameColor: '#eeeeee',
            },
          },
          {
            type: 'set-furniture-materials',
            id: 'desk',
            materials: { bodyColor: '#13579b', bodyPattern: 'checker' },
          },
        ],
        'Appearance',
      );
      expect(result.ok).toBe(true);
      const current = session.getSnapshot().workspace!.current;
      const imported = readProject(exportProject(session.getSnapshot())!);
      expect(imported.ok && imported.value.current).toEqual(current);
      expect(current.room.features[0]).toMatchObject({
        ...opening,
        materials: {
          color: '#234567',
          texture: 'stripes',
          frameColor: '#eeeeee',
        },
      });
      expect(session.undo()).toEqual({ ok: true });
      expect(session.getSnapshot().workspace!.current.furniture).toEqual(
        room.furniture,
      );
      expect(session.getSnapshot().workspace!.current.room.features).toEqual(
        room.room.features,
      );
    } finally {
      session.dispose();
    }
  });
  it('keeps colour independent from patterns and material choices', () => {
    const a = furnitureMaterialTargets(
      {
        finish: 'oak',
        materials: {
          bodyColor: '#13579b',
          bodyPattern: 'stripes',
          softColor: '#c0ffee',
          softPattern: 'checker',
        },
      },
      'bed',
    );
    expect(a.frame).toMatchObject({ color: '#13579b', surface: 'stripes' });
    expect(a.soft).toMatchObject({ color: '#c0ffee', surface: 'checker' });
    expect(a.blanket.color).toBe('#c0ffee');
    expect(openingMaterialTargets()).toMatchObject({
      color: '#765238',
      frameColor: '#e8e0d3',
    });
  });
  it('shows changed soft-part RGB even when the frame already has a custom colour', () => {
    const before = {
        finish: 'oak' as const,
        materials: { bodyColor: '#b69a78', softColor: '#d9d5ca' },
      },
      after = {
        ...before,
        materials: { ...before.materials, softColor: '#708e85' },
      };
    expect(furnitureAppearanceSwatches(before, after, 'bed')).toEqual({
      role: 'soft',
      before: '#d9d5ca',
      after: '#708e85',
    });
  });
  it('keeps frame RGB independent of default upholstery colour', () => {
    const targets = furnitureMaterialTargets(
      { finish: 'sage', materials: { bodyColor: '#123456' } },
      'chair',
    );
    expect(targets.frame.color).toBe('#123456');
    expect(targets.soft.color).toBe('#8eaa96');
  });
  it('colours the glass balcony door frame instead of an absent solid leaf', () => {
    const balcony = { ...door(), purpose: 'balcony' as const };
    expect(
      resolveMedyRequest(
        commandRoom([], [balcony]),
        'Paint the balcony door #123456',
        balcony.id,
      ),
    ).toMatchObject({
      kind: 'edits',
      actions: [
        { type: 'set-opening-materials', materials: { frameColor: '#123456' } },
      ],
    });
  });
  it('rejects window leaf edits, unsupported parts and model appearance authority', () => {
    const room = commandRoom([piece('desk')], [windowFeature()]);
    const action = {
      type: 'set-opening-materials',
      id: 'window_1',
      materials: { color: '#123456' },
    };
    expect(visitorActionSchema.safeParse(action).success).toBe(true);
    expect(proposalActionSchema.safeParse(action).success).toBe(false);
    expect(evaluateBatch(room, [action], 'visitor')).toMatchObject({
      ok: false,
    });
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'set-furniture-materials',
            id: 'desk',
            materials: { softPattern: 'checker' },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: false });
    expect(evaluateBatch(room, [action], 'assistant')).toMatchObject({
      ok: false,
    });
    expect(
      visitorActionSchema.safeParse({
        ...action,
        materials: { frameColor: 'rgb(1,2,3)' },
      }).success,
    ).toBe(false);
  });
  it.each([
    [
      'Paint the door rgb(35,69,103)',
      'door_1',
      'set-opening-materials',
      { color: '#234567' },
    ],
    [
      'Paint the door navy',
      'door_1',
      'set-opening-materials',
      { color: '#283e56' },
    ],
    [
      'Change the window frame color to #123456',
      'window_1',
      'set-opening-materials',
      { frameColor: '#123456' },
    ],
    [
      'Change desk frame color to rgb(19,87,155)',
      'desk',
      'set-furniture-materials',
      { bodyColor: '#13579b' },
    ],
    [
      'Change desk frame pattern to checker',
      'desk',
      'set-furniture-materials',
      { bodyPattern: 'checker' },
    ],
  ])(
    'compiles %s through visitor preview only',
    (request, id, type, materials) => {
      const result = resolveMedyRequest(
        commandRoom([piece('desk')], [door(), windowFeature()]),
        request,
        id,
      );
      expect(result).toMatchObject({
        kind: 'edits',
        actions: [{ type, id, materials }],
      });
    },
  );
  it('distinguishes a frame material from an independent pattern and rejects competing patterns', () => {
    const room = commandRoom([piece('desk')]);
    expect(
      resolveMedyRequest(
        room,
        'Change desk frame material to wood with checker pattern #13579b',
        'desk',
      ),
    ).toMatchObject({
      kind: 'edits',
      actions: [
        {
          materials: {
            body: 'wood',
            bodyColor: '#13579b',
            bodyPattern: 'checker',
          },
        },
      ],
    });
    expect(
      resolveMedyRequest(
        room,
        'Change desk frame pattern to stripes and checker',
        'desk',
      ),
    ).toMatchObject({ kind: 'reply' });
  });
  it('rejects out-of-range RGB without interpreting it as dimensions', () => {
    expect(
      resolveMedyRequest(
        commandRoom([piece('desk')]),
        'Paint desk rgb(256,0,0)',
        'desk',
      ),
    ).toMatchObject({ kind: 'reply' });
  });
  it('keeps material choice and custom RGB in the same request and chooses soft parts for an implicit bed colour', () => {
    const bed = piece('bed', 2000, 2000, {
      catalogueId: 'procedural-bed',
      width: 1600,
      depth: 2100,
      height: 850,
    });
    const room = commandRoom([bed]);
    expect(
      resolveMedyRequest(
        room,
        'Change the bed bedding material to linen #123456',
        'bed',
      ),
    ).toMatchObject({
      kind: 'edits',
      actions: [{ materials: { upholstery: 'linen', softColor: '#123456' } }],
    });
    expect(
      resolveMedyRequest(room, 'Paint the bed rgb(35,69,103)', 'bed'),
    ).toMatchObject({
      kind: 'edits',
      actions: [{ materials: { softColor: '#234567' } }],
    });
    expect(
      resolveMedyRequest(
        room,
        'Change the bed frame material to wood #13579b',
        'bed',
      ),
    ).toMatchObject({
      kind: 'edits',
      actions: [
        {
          materials: { body: 'wood', bodyColor: '#13579b', bodyPattern: null },
        },
      ],
    });
  });
  it('allocates only selected patterns, caches them and fences late allocation after disposal', () => {
    const surfaces = createSurfaces();
    expect(surfaces.textures).toHaveLength(15);
    const stripes = surfaces.stripes;
    expect(surfaces.stripes).toBe(stripes);
    expect(surfaces.textures).toHaveLength(16);
    let disposed = 0;
    stripes.addEventListener('dispose', () => disposed++);
    surfaces.dispose();
    surfaces.dispose();
    expect(disposed).toBe(1);
    expect(surfaces.checker).toBe(surfaces.smooth);
    expect(surfaces.textures).toHaveLength(15);
  });
  it('renders the same RGB/pattern maps in owned editor materials and export meshes, with cleanup', () => {
    const d = door();
    d.materials = {
      color: '#234567',
      texture: 'stripes',
      frameColor: '#eeeeee',
      frameTexture: 'smooth',
    };
    const furniture = piece('desk');
    furniture.materials = { bodyColor: '#13579b', bodyPattern: 'checker' };
    const surfaces = createSurfaces(),
      owned = createFurnitureMaterials(
        furnitureMaterialTargets(furniture, 'desk'),
        surfaces,
      ),
      scene = buildDesignScene(commandRoom([furniture], [d]));
    try {
      expect(owned.materials.frame.color.getHexString()).toBe('13579b');
      expect(owned.materials.frame.map?.name).toBe('roomedy-checker');
      const leaf = scene.root.getObjectByName('door') as unknown as {
        material: typeof owned.materials.frame;
      };
      expect(leaf.material.color.getHexString()).toBe('234567');
      expect(leaf.material.map?.name).toBe('roomedy-stripes');
      const trim = scene.root.getObjectByName('Opening trim') as unknown as {
        material: typeof owned.materials.frame;
      };
      expect(trim.material.color.getHexString()).toBe('eeeeee');
      expect(trim.material.map?.name).toBe('roomedy-smooth');
    } finally {
      owned.dispose();
      surfaces.dispose();
      scene.dispose();
    }
  });
});
