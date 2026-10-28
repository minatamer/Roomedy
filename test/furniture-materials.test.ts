import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import {
  CATALOGUE,
  evaluateBatch,
  resolveMedyRequest,
  findCatalogueEntry,
} from '@roomedy/spatial';
import {
  furnitureMaterialsSchema,
  furnitureMaterialRoles,
  furnitureMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import { proposalActionSchema } from '@roomedy/contracts/commands';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { piece, commandRoom } from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import {
  createSurfaces,
  surfaceModel,
} from '../apps/frontend/src/features/room-view/surfaces.js';
import { createFurnitureMaterials } from '../apps/frontend/src/features/room-view/furniture-material.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { ViewAssets } from '../apps/frontend/src/features/room-view/assets.js';
import type { AssetState } from '../apps/frontend/src/features/room-view/assets.js';
import { cabinetDoorRig } from '../apps/frontend/src/features/room-view/articulation-model.js';

type Model = Parameters<typeof surfaceModel>[0];
type Material = ReturnType<
  typeof createFurnitureMaterials
>['materials']['frame'];

describe('planned furniture materials retain independent room authority', () => {
  it.each([
    {},
    { body: 'glass' },
    { upholstery: 'wood' },
    { softColor: '#123' },
    { hardware: 'gold' },
    { body: 'wood', url: 'https://example.test/a' },
  ])('rejects unbounded or empty choices %j', (input) => {
    expect(furnitureMaterialsSchema.safeParse(input).success).toBe(false);
  });
  it('keeps original defaults without adding facts to legacy rooms', () => {
    const room = commandRoom([piece('desk')]);
    expect(roomDocumentSchema.parse(room)).toEqual(room);
    expect(
      furnitureMaterialTargets(room.furniture[0]!, 'desk').frame,
    ).toMatchObject({ color: '#bd9064', surface: 'wood', metalness: 0 });
    expect(
      furnitureMaterialTargets({ finish: 'sage' }, 'chair').soft.color,
    ).toBe('#8eaa96');
    expect(furnitureMaterialTargets({ finish: 'sage' }, 'bed').soft.color).toBe(
      '#eee5d5',
    );
  });
  it('offers only physical part roles, with an honest bounds-only fallback', () => {
    expect(
      furnitureMaterialRoles(
        findCatalogueEntry('procedural-storage', 'catalogue-v1')!,
      ),
    ).toEqual({ body: true, soft: false, hardware: false });
    expect(
      furnitureMaterialRoles(
        findCatalogueEntry('chair-desk-fixed', 'catalogue-v1')!,
      ),
    ).toEqual({ body: true, soft: true, hardware: true });
    for (const entry of CATALOGUE)
      expect(furnitureMaterialRoles(entry, false)).toEqual({
        body: true,
        soft: false,
        hardware: false,
      });
  });
  it('merges a whole appearance change through one Undo without changing physical facts or baseline', () => {
    const desk = piece('desk');
    desk.locks = { dimensions: true, position: true, rotation: true };
    const room = commandRoom([desk]),
      session = new SessionController(room);
    try {
      const result = session.dispatch(
        [
          {
            type: 'set-furniture-materials',
            id: desk.id,
            materials: { body: 'metal', hardware: 'brass' },
          },
        ],
        'Desk materials',
      );
      expect(result.ok).toBe(true);
      const current = session.getSnapshot().workspace!.current;
      expect(current.furniture[0]).toEqual({
        ...desk,
        materials: { body: 'metal', hardware: 'brass' },
      });
      const imported = readProject(exportProject(session.getSnapshot())!);
      expect(imported.ok).toBe(true);
      if (imported.ok) {
        expect(imported.value.current).toEqual(current);
        expect(imported.value.baseline).toEqual(room);
      }
      expect(session.undo()).toEqual({ ok: true });
      expect(session.getSnapshot().workspace!.current.furniture[0]).toEqual(
        desk,
      );
    } finally {
      session.dispose();
    }
  });
  it('rejects incompatible roles atomically and preserves existing material choices', () => {
    const desk = piece('desk');
    desk.materials = { body: 'painted' };
    const room = commandRoom([desk]);
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'set-furniture-materials',
            id: desk.id,
            materials: { body: 'metal', upholstery: 'leather' },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'unsupported-variant' });
    expect(room.furniture[0]!.materials).toEqual({ body: 'painted' });
    const result = evaluateBatch(
      room,
      [
        {
          type: 'set-furniture-materials',
          id: desk.id,
          materials: { hardware: 'steel' },
        },
      ],
      'visitor',
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.room.furniture[0]!.materials).toEqual({
      body: 'painted',
      hardware: 'steel',
    });
    const action = {
      type: 'set-furniture-materials',
      id: desk.id,
      materials: { body: 'metal' },
    };
    expect(proposalActionSchema.safeParse(action).success).toBe(false);
    expect(evaluateBatch(room, [action], 'assistant')).toMatchObject({
      ok: false,
      code: 'invalid-input',
    });
  });
  it('routes explicit human material requests through reviewed visitor edits', () => {
    const room = commandRoom([piece('desk')]);
    const request = resolveMedyRequest(
      room,
      'make this piece frame material metal and hardware brass',
      'desk',
    );
    expect(request?.kind).toBe('edits');
    if (request?.kind !== 'edits') throw new Error('expected-edits');
    expect(request.actions).toEqual([
      {
        type: 'set-furniture-materials',
        id: 'desk',
        materials: { body: 'metal', hardware: 'brass' },
      },
    ]);
    expect(evaluateBatch(room, request.actions, 'visitor').ok).toBe(true);
    expect(room.furniture[0]!.materials).toBeUndefined();
  });
  it('clears only a custom soft colour through the same command while retaining upholstery and hardware', () => {
    const chair = piece('chair', 2000, 2000, {
      catalogueId: 'chair-desk-fixed',
      width: 670,
      depth: 630,
      height: 1216,
    });
    chair.finish = 'clay';
    chair.materials = {
      upholstery: 'velvet',
      softColor: '#526577',
      hardware: 'steel',
    };
    const room = commandRoom([chair]);
    const edit = resolveMedyRequest(
      room,
      'make this piece soft colour default',
      chair.id,
    );
    if (edit?.kind !== 'edits') throw new Error('expected-reset');
    expect(edit.actions).toEqual([
      {
        type: 'set-furniture-materials',
        id: chair.id,
        materials: { softColor: null },
      },
    ]);
    const result = evaluateBatch(room, edit.actions, 'visitor');
    if (!result.ok) throw new Error(result.code);
    const updated = result.room.furniture[0]!;
    expect(updated.materials).toEqual({
      upholstery: 'velvet',
      softColor: null,
      hardware: 'steel',
    });
    expect(furnitureMaterialTargets(updated, 'chair').soft.color).toBe(
      '#c97f60',
    );
    expect(room.furniture[0]!.materials?.softColor).toBe('#526577');
  });
  it('keeps bedding and shade choices appropriate to their construction', () => {
    for (const [category, upholstery] of [
      ['bed', 'leather'],
      ['lighting', 'velvet'],
    ] as const) {
      const entry = CATALOGUE.find((value) => value.category === category)!;
      const item = piece('chosen', 2000, 2000, {
        catalogueId: entry.id,
        width: entry.size.width.default,
        depth: entry.size.depth.default,
        height: entry.size.height.default,
      });
      expect(
        evaluateBatch(
          commandRoom([item]),
          [
            {
              type: 'set-furniture-materials',
              id: item.id,
              materials: { upholstery },
            },
          ],
          'visitor',
        ),
      ).toMatchObject({ ok: false, code: 'unsupported-variant' });
    }
  });
  it('offers frame appearance for an owned bounds fallback without stretching the fixed chair', () => {
    const chair = piece('chair', 2000, 2000, {
      catalogueId: 'chair-desk-fixed',
      width: 700,
      depth: 630,
      height: 1216,
    });
    const room = commandRoom([chair]);
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'set-furniture-materials',
            id: chair.id,
            materials: { upholstery: 'leather' },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'unsupported-variant' });
    const result = evaluateBatch(
      room,
      [
        {
          type: 'set-furniture-materials',
          id: chair.id,
          materials: { body: 'metal' },
        },
      ],
      'visitor',
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.room.furniture[0]!.dimensions).toEqual(chair.dimensions);
    expect(result.room.furniture[0]!.materials).toEqual({ body: 'metal' });
  });
});

describe('owned editor and exported material appearance', () => {
  it('retargets finitely, re-enters its layout owner and retires only owned materials', () => {
    const surfaces = createSurfaces(),
      item = piece('desk');
    const owner = createFurnitureMaterials(
      furnitureMaterialTargets(item, 'desk'),
      surfaces,
    );
    let textureRetired = 0,
      materialRetired = 0;
    surfaces.wood.addEventListener('dispose', () => textureRetired++);
    owner.materials.frame.addEventListener('dispose', () => materialRetired++);
    const target = furnitureMaterialTargets(
      {
        ...item,
        materials: {
          body: 'metal',
          hardware: 'brass',
          upholstery: 'leather',
          softColor: '#526577',
        },
      },
      'chair',
    );
    owner.choose(target);
    expect(owner.advance(0.02)).toBe(true);
    for (let frame = 0; frame < 140; frame++) owner.advance(0.02);
    expect(owner.advance(0.02)).toBe(false);
    expect(owner.materials.frame.metalness).toBe(0.72);
    expect(owner.materials.soft.map).toBe(surfaces.smooth);
    expect(owner.materials.soft.color.getHexString()).toBe('526577');
    expect(owner.materials.metal.color.getHexString()).toBe('c7a15e');
    owner.dispose();
    owner.dispose();
    expect(materialRetired).toBe(1);
    expect(textureRetired).toBe(0);
    expect(owner.advance(0.02)).toBe(false);
    owner.choose(target);
    expect(owner.advance(0.02)).toBe(false);
    owner.dispose();
    expect(materialRetired).toBe(2);
    surfaces.dispose();
    expect(textureRetired).toBe(1);
  });
  it.each([
    ['chair-desk', 'chair-desk-fixed', 670, 630, 1216, 'carpet'],
    ['bedside-storage', 'bedside-storage-fixed', 540, 440, 470, 'wood'],
  ] as const)(
    'preserves actual %s cache/geometry/articulation and exports the selected parts',
    async (assetId, catalogueId, width, depth, height, materialName) => {
      const url = `/catalogue/${assetId}-v1.glb`,
        bytes = await readFile(`apps/frontend/public${url}`);
      let state: AssetState | undefined;
      const cache = new ViewAssets(
        (states) => {
          state = states.get(url);
        },
        { fetch: async () => new Response(bytes) },
      );
      const surfaces = createSurfaces();
      try {
        cache.load(url);
        await vi.waitFor(() => expect(state?.kind).toBe('ready'));
        if (state?.kind !== 'ready') throw new Error('asset');
        const source = state.asset.scene,
          before = JSON.stringify(source.toJSON());
        const settings =
          assetId === 'chair-desk'
            ? {
                upholstery: 'leather' as const,
                softColor: '#526577',
                hardware: 'brass' as const,
              }
            : { body: 'metal' as const, hardware: 'brass' as const };
        const instance = surfaceModel(source, surfaces, 'sage', settings);
        const other = surfaceModel(source, surfaces, 'ivory');
        try {
          expect(instance.object.scale.toArray()).toEqual(
            source.scale.toArray(),
          );
          expect(instance.object.position.toArray()).toEqual(
            source.position.toArray(),
          );
          const rig = cabinetDoorRig(instance.object);
          if (assetId === 'bedside-storage') {
            expect(rig).not.toBeNull();
            rig!.apply(1);
          }
          instance.chooseFinish('clay', settings);
          for (let frame = 0; frame < 140; frame++) instance.advance(0.02);
          expect(instance.advance(0.02)).toBe(false);
          if (rig)
            expect(
              instance.object.getObjectByName('door')!.rotation.y,
            ).toBeCloseTo(-Math.PI / 2);
          const furniture = piece('chosen', 2000, 2000, {
            catalogueId,
            width,
            depth,
            height,
          });
          furniture.finish = 'clay';
          furniture.materials = settings;
          const exported = buildDesignScene(
            commandRoom([furniture]),
            new Map([[url, state.asset]]),
          );
          try {
            const named = (root: Model, name: string) => {
              const result: Material[] = [];
              root.traverse((node) => {
                const mesh = node as Model & {
                  material?: Material | Material[];
                };
                for (const material of Array.isArray(mesh.material)
                  ? mesh.material
                  : mesh.material
                    ? [mesh.material]
                    : [])
                  if (material.name.toLowerCase().includes(name))
                    result.push(material);
              });
              return result;
            };
            const live = named(instance.object, materialName),
              output = named(exported.root, materialName);
            expect(live.length).toBeGreaterThan(0);
            expect(output.length).toBe(live.length);
            expect(
              output.map((m) => [
                m.color.getHexString(),
                m.roughness,
                m.metalness,
                m.map?.name,
              ]),
            ).toEqual(
              live.map((m) => [
                m.color.getHexString(),
                m.roughness,
                m.metalness,
                m.map?.name,
              ]),
            );
            expect(
              named(instance.object, 'metal').every(
                (m) => m.color.getHexString() === 'c7a15e',
              ),
            ).toBe(true);
            expect(
              named(other.object, materialName).every(
                (m) => m.color.getHexString() === 'f3eee2',
              ),
            ).toBe(true);
          } finally {
            exported.dispose();
          }
          expect(JSON.stringify(source.toJSON())).toBe(before);
        } finally {
          instance.dispose();
          other.dispose();
        }
      } finally {
        surfaces.dispose();
        cache.dispose();
      }
    },
  );
  it('keeps TV screens distinct from a selected metal body and brass feet in exports', () => {
    const tv = piece('tv', 3000, 3000, {
      catalogueId: 'tv-tabletop',
      width: 1120,
      depth: 250,
      height: 710,
    });
    tv.pose.bottomY = 600;
    tv.materials = { body: 'metal', hardware: 'brass' };
    const exported = buildDesignScene(commandRoom([tv]));
    try {
      const screen = exported.root.getObjectByName('tv-screen') as Model & {
        material: Material;
      };
      expect(screen).toBeDefined();
      expect((screen.material as Material).color.getHexString()).toBe('101820');
      const foot = exported.root.getObjectByName('tv-foot--1') as Model & {
        material: Material;
      };
      expect((foot.material as Material).color.getHexString()).toBe('c7a15e');
    } finally {
      exported.dispose();
    }
  });
});
