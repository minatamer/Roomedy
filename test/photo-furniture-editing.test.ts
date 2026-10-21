import { readFile } from 'node:fs/promises';
import { expect, it, vi } from 'vitest';
import { FINISH_COLORS } from '@roomedy/contracts/surfaces';
import {
  CATALOGUE,
  evaluateBatch,
  visitorCatalogueFurniture,
} from '@roomedy/spatial';
import { bedroomExample } from '../apps/backend/src/recognition/fixtures.js';
import {
  adoptHypothesis,
  correctDraft,
  createDraft,
} from '../apps/frontend/src/features/room-intake/draft.js';
import type { ReviewResult } from '../apps/frontend/src/features/room-intake/draft.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { ViewAssets } from '../apps/frontend/src/features/room-view/assets.js';
import type { AssetState } from '../apps/frontend/src/features/room-view/assets.js';
import {
  createSurfaces,
  surfaceModel,
} from '../apps/frontend/src/features/room-view/surfaces.js';
import type { createSurfaceBlend } from '../apps/frontend/src/features/room-view/surfaces.js';
import { cabinetDoorRig } from '../apps/frontend/src/features/room-view/articulation-model.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { commandRoom, piece } from './fixtures/command-room.js';

const palette = Object.keys(FINISH_COLORS) as (keyof typeof FINISH_COLORS)[];
function take(result: ReviewResult) {
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}
function photoDraft() {
  const draft = createDraft('furnished', 'photo_room');
  draft.sources = [{ id: 'p1', purpose: 'auto', available: true }];
  let id = 0;
  const raw = bedroomExample([{ id: 'p1', purpose: 'auto' }]);
  return {
    draft: take(adoptHypothesis(draft, raw, () => `piece_${++id}`)),
    raw,
  };
}

it('keeps every catalogue finish selectable through the actual visitor command, retaining defaults and independent facts', () => {
  for (const entry of CATALOGUE) {
    expect(new Set(entry.finishes)).toEqual(new Set(palette));
    const item = visitorCatalogueFurniture(
      entry,
      {
        width: entry.size.width.default,
        depth: entry.size.depth.default,
        height: entry.size.height.default,
      },
      { centerX: 2000, centerZ: 2000, quarterTurns: 0 },
      'a',
    );
    const room = commandRoom([item]);
    for (const finish of palette) {
      const result = evaluateBatch(
        room,
        [{ type: 'finish', id: 'a', finish }],
        'visitor',
      );
      expect(result.ok, `${entry.id}: ${finish}`).toBe(true);
      if (result.ok)
        expect(result.room.furniture[0]).toEqual({ ...item, finish });
    }
  }
  expect(CATALOGUE.find((e) => e.id === 'chair-desk-fixed')!.finishes[0]).toBe(
    'clay',
  );
  expect(CATALOGUE.find((e) => e.id === 'tv-tabletop')!.finishes[0]).toBe(
    'charcoal',
  );
});

it('leaves new photo estimates unlocked and retains explicit finish, size, pose and locks on later recognition and project import', () => {
  const { draft, raw } = photoDraft();
  expect(draft.room.furniture).not.toHaveLength(0);
  for (const item of draft.room.furniture)
    expect(item.locks).toEqual({
      position: false,
      rotation: false,
      dimensions: false,
    });
  const cabinet = draft.room.furniture.find(
    (p) => p.catalogueId === 'bedside-storage-fixed',
  )!;
  const edited = take(
    correctDraft(draft, [
      { type: 'finish', id: cabinet.id, finish: 'sage' },
      {
        type: 'set-size-estimate',
        id: cabinet.id,
        width: cabinet.dimensions.width.value!,
        depth: cabinet.dimensions.depth.value!,
        height: 500,
      },
      {
        type: 'set-locks',
        id: cabinet.id,
        locks: { position: true, rotation: true, dimensions: true },
      },
    ]),
  );
  const next = take(adoptHypothesis(edited, raw, () => 'unexpected'));
  expect(next.room.furniture.find((p) => p.id === cabinet.id)).toEqual(
    edited.room.furniture.find((p) => p.id === cabinet.id),
  );
  const session = new SessionController(next.room);
  try {
    const saved = readProject(exportProject(session.getSnapshot())!);
    expect(saved.ok).toBe(true);
    if (saved.ok)
      expect(saved.value.current.furniture).toEqual(next.room.furniture);
  } finally {
    session.dispose();
  }
});

it('lets a photo cabinet change finish and size with per-axis estimate evidence and separate Undo, keeping its original baseline', () => {
  const { draft } = photoDraft(),
    session = new SessionController(draft.room);
  try {
    const original = session.getSnapshot().workspace!.current;
    const cabinet = original.furniture.find(
      (p) => p.catalogueId === 'bedside-storage-fixed',
    )!;
    expect(
      session.dispatch(
        [{ type: 'finish', id: cabinet.id, finish: 'walnut' }],
        'Finish',
      ),
    ).toMatchObject({ ok: true, changed: true });
    expect(
      session.dispatch(
        [
          {
            type: 'set-size-estimate',
            id: cabinet.id,
            width: cabinet.dimensions.width.value!,
            depth: cabinet.dimensions.depth.value!,
            height: 510,
          },
        ],
        'Size',
      ),
    ).toMatchObject({ ok: true, changed: true });
    const current = session
      .getSnapshot()
      .workspace!.current.furniture.find((p) => p.id === cabinet.id)!;
    expect(current.dimensions.height).toMatchObject({
      value: 510,
      status: 'estimated',
      sourceId: 'visitor-estimate',
    });
    expect(current.dimensions.width).toEqual(cabinet.dimensions.width);
    expect(current.dimensions.depth).toEqual(cabinet.dimensions.depth);
    expect(current.locks).toEqual(cabinet.locks);
    expect(session.getSnapshot().workspace!.baseline).toEqual(original);
    expect(session.undo().ok).toBe(true);
    expect(
      session
        .getSnapshot()
        .workspace!.current.furniture.find((p) => p.id === cabinet.id),
    ).toEqual({ ...cabinet, finish: 'walnut' });
    expect(session.undo().ok).toBe(true);
    expect(session.getSnapshot().workspace!.current.furniture).toEqual(
      original.furniture,
    );
  } finally {
    session.dispose();
  }
});

type Model = Parameters<typeof surfaceModel>[0];
type Material = Parameters<typeof createSurfaceBlend>[0];
function namedMaterials(model: Model, name: string) {
  const found = new Set<Material>();
  model.traverse((node) => {
    const mesh = node as typeof node & { material?: Material | Material[] };
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [])
      if (material.name.toLowerCase().includes(name)) found.add(material);
  });
  return [...found];
}

it.each([
  ['chair-desk', 'chair-desk-fixed', 'carpet', 670, 630, 1216],
  ['bedside-storage', 'bedside-storage-fixed', 'wood', 540, 440, 470],
] as const)(
  'recolours actual %s materials with finite retargeting, isolated cache/other instances and matching export',
  async (assetId, catalogueId, name, width, depth, height) => {
    const url = `/catalogue/${assetId}-v1.glb`,
      bytes = await readFile(`apps/frontend/public${url}`);
    let state: AssetState | undefined;
    const owner = new ViewAssets(
      (states) => {
        state = states.get(url);
      },
      { fetch: async () => new Response(bytes) },
    );
    const surfaces = createSurfaces();
    try {
      owner.load(url);
      await vi.waitFor(() => expect(state?.kind).toBe('ready'));
      if (state?.kind !== 'ready') throw new Error('asset');
      const source = state.asset.scene,
        before = JSON.stringify(source.toJSON());
      const first = surfaceModel(source, surfaces, 'sage'),
        other = surfaceModel(source, surfaces, 'ivory');
      try {
        const materials = namedMaterials(first.object, name),
          metals = namedMaterials(first.object, 'metal');
        expect(materials.length).toBeGreaterThan(0);
        const metalColors = metals.map((m) => m.color.getHexString());
        expect(
          materials.every(
            (m) => m.color.getHexString() === FINISH_COLORS.sage.slice(1),
          ),
        ).toBe(true);
        first.chooseFinish('clay');
        expect(first.advance(0.02)).toBe(true);
        first.chooseFinish('walnut');
        first.chooseFinish('charcoal');
        for (let frame = 0; frame < 100; frame++) first.advance(0.02);
        expect(first.advance(0.02)).toBe(false);
        expect(
          materials.every(
            (m) => m.color.getHexString() === FINISH_COLORS.charcoal.slice(1),
          ),
        ).toBe(true);
        expect(
          namedMaterials(other.object, name).every(
            (m) => m.color.getHexString() === FINISH_COLORS.ivory.slice(1),
          ),
        ).toBe(true);
        expect(metals.map((m) => m.color.getHexString())).toEqual(metalColors);
        if (assetId === 'bedside-storage') {
          const rig = cabinetDoorRig(first.object)!;
          rig.apply(1);
          first.chooseFinish('sage');
          first.advance(0.02);
          expect(first.object.getObjectByName('door')!.rotation.y).toBeCloseTo(
            -Math.PI / 2,
          );
        }
        const furniture = piece('a', 2000, 2000, {
          catalogueId,
          width,
          depth,
          height,
        });
        furniture.finish = 'charcoal';
        const exported = buildDesignScene(
          commandRoom([furniture]),
          new Map([[url, state.asset]]),
        );
        try {
          expect(
            namedMaterials(exported.root, name).every(
              (m) => m.color.getHexString() === FINISH_COLORS.charcoal.slice(1),
            ),
          ).toBe(true);
          expect(namedMaterials(exported.root, name).length).toBeGreaterThan(0);
        } finally {
          exported.dispose();
        }
        expect(JSON.stringify(source.toJSON())).toBe(before);
      } finally {
        first.dispose();
        other.dispose();
      }
      expect(first.advance(0.02)).toBe(false);
    } finally {
      surfaces.dispose();
      owner.dispose();
    }
  },
);

it.each(['floor-lamp', 'tv-tabletop'])(
  'shows selected %s finish on its surface while retaining distinct metal/screen',
  (catalogueId) => {
    const entry = CATALOGUE.find((e) => e.id === catalogueId)!;
    const furniture = piece('a', 2000, 2000, {
      catalogueId,
      width: entry.size.width.default,
      depth: entry.size.depth.default,
      height: entry.size.height.default,
    });
    furniture.finish = 'sage';
    if (catalogueId === 'tv-tabletop') furniture.pose.bottomY = 600;
    const exported = buildDesignScene(commandRoom([furniture]));
    try {
      const visible = exported.root.getObjectByName(
        catalogueId === 'floor-lamp' ? 'lamp-shade' : 'tv-body',
      ) as Model & { material: Material };
      expect(visible.material.color.getHexString()).toBe(
        FINISH_COLORS.sage.slice(1),
      );
      if (catalogueId === 'tv-tabletop') {
        const screen = exported.root.getObjectByName(
          'tv-screen',
        ) as typeof visible;
        expect(screen.material.color.getHexString()).toBe('101820');
      }
    } finally {
      exported.dispose();
    }
  },
);
