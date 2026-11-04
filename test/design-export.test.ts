import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { Box3, Vector3, PerspectiveCamera } = (await import(
  pathToFileURL(requireFrontend.resolve('three/src/Three.js')).href
)) as {
  Box3: new () => Parameters<typeof coverCrop>[0];
  Vector3: new (
    x?: number,
    y?: number,
    z?: number,
  ) => Parameters<typeof coverCrop>[0]['min'];
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => Parameters<typeof coverCrop>[1];
};
import { POLICY } from '@roomedy/contracts/policy';
import {
  commandRoom,
  piece,
  known,
  unknown,
  door,
  windowFeature,
} from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  projectOf,
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import {
  buildDesignScene,
  prepareGlbTextures,
} from '../apps/frontend/src/features/design-export/scene.js';
import { objFiles } from '../apps/frontend/src/features/design-export/obj.js';
import { designPortfolioPdf } from '../apps/frontend/src/features/design-export/document.js';
import { coverCrop } from '../apps/frontend/src/features/design-export/capture.js';
import { displayFurnitureSize } from '../apps/frontend/src/features/catalogue/display-size.js';
import { wallBoxes } from '../apps/frontend/src/features/room-view/adapter.js';
import { documentNavigationRoom } from '../apps/frontend/src/features/design-export/document-views.js';
import {
  cameraViewPose,
  cameraPositionAllowed,
} from '../apps/frontend/src/features/room-view/camera.js';
const project = (count = 1) => {
  const c = new SessionController(
    commandRoom(
      Array.from({ length: count }, (_, i) =>
        piece(
          `desk_${i}`,
          1000 + (i % 5) * 1700,
          1000 + Math.floor(i / 5) * 1000,
        ),
      ),
    ),
  );
  const p = projectOf(c.getSnapshot())!;
  c.dispose();
  return p;
};
describe('editable projects and bounded portfolio facts', () => {
  it('exports paired balcony glass and frame geometry with one shared material lifetime', () => {
    const feature = {
        ...door('balcony'),
        purpose: 'balcony' as const,
        mechanism: 'sliding' as const,
        wall: 'north' as const,
        width: known(2400),
        height: known(2100),
      },
      room = commandRoom([], [feature]),
      before = structuredClone(room),
      scene = buildDesignScene(room);
    let disposed = 0;
    try {
      const opening = scene.root.getObjectByName('Balcony doors')!;
      expect(opening).toBeDefined();
      const first = opening.getObjectByName('Balcony glass 1')!,
        second = opening.getObjectByName('Balcony glass 2')!;
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(opening.getObjectByName('Balcony handle 1')).toBeDefined();
      expect(opening.getObjectByName('Balcony handle 2')).toBeDefined();
      expect(opening.getObjectByName('Door panel')).toBeUndefined();
      const size = new Box3().setFromObject(opening).getSize(new Vector3());
      expect(size.x).toBeCloseTo(2.4, 4);
      expect(size.y).toBeCloseTo(2.1, 4);
      if (!('material' in first) || !('material' in second))
        throw new Error('fixture');
      const glass = first.material as {
        transmission: number;
        addEventListener(type: string, callback: () => void): void;
      };
      expect(second.material).toBe(glass);
      expect(glass.transmission).toBeGreaterThan(0);
      glass.addEventListener('dispose', () => disposed++);
      expect(room).toEqual(before);
    } finally {
      scene.dispose();
      scene.dispose();
    }
    expect(disposed).toBe(1);
  });
  it('round-trips the same closed editable data while excluding transient room state', () => {
    const c = new SessionController(commandRoom([piece('desk')]));
    try {
      c.setRoomView('cutaway');
      c.select('desk');
      const text = exportProject(c.getSnapshot())!,
        parsed = readProject(text);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(parsed.value).toEqual(projectOf(c.getSnapshot()));
      expect(text).not.toContain('workspaceId');
      expect(text).not.toContain('presentation');
      expect(
        readProject(text.replace('roomedy-project', 'unsupported-format')).ok,
      ).toBe(false);
    } finally {
      c.dispose();
    }
  });
});
describe('canonical3D export projection', () => {
  it('uses nominal camera obstacles for unmeasured furniture without changing saved measurement/pose facts', () => {
    const room = commandRoom([piece('desk', 2500, 2500)], [door()]);
    room.room.width = unknown();
    room.room.depth = unknown();
    room.furniture[0]!.dimensions.depth = unknown();
    const before = JSON.stringify(room),
      visual = documentNavigationRoom(room);
    expect(visual.furniture[0]!.dimensions.depth.value).toBeGreaterThan(0);
    expect(visual.furniture[0]!.pose).toEqual(room.furniture[0]!.pose);
    const doorway = cameraViewPose(visual, 'doorway'),
      corner = cameraViewPose(visual, 'corner');
    expect(doorway).not.toBeNull();
    expect(corner).not.toBeNull();
    expect(doorway!.position).not.toEqual(corner!.position);
    expect(cameraPositionAllowed(visual, doorway!.position)).toBe(true);
    expect(cameraPositionAllowed(visual, corner!.position)).toBe(true);
    expect(cameraPositionAllowed(visual, [2.5, 1.6, 2.5])).toBe(false);
    expect(JSON.stringify(room)).toBe(before);
  });
  it.each([
    ['procedural-desk', 0],
    ['mirror-wall', 900],
    ['ceiling-pendant', 2100],
  ] as const)(
    'renders unmeasured %s in PDF pictures without changing strict model exports or measured facts',
    (catalogueId, bottomY) => {
      const item = piece('photo-piece', 2600.5, 1900.5, {
        catalogueId,
        quarterTurns: 1,
      });
      item.dimensions = {
        width: unknown(),
        depth: unknown(),
        height: unknown(),
      };
      item.pose.bottomY = bottomY;
      // A supplied axis must win over the nominal size for that same axis.
      item.dimensions.width = known(1201);
      const room = commandRoom([item]),
        before = JSON.stringify(room),
        strict = buildDesignScene(room),
        picture = buildDesignScene(room, new Map(), {}, true);
      try {
        const fallback = strict.root.children.find(
            (n) => n.userData.roomedy?.id === item.id,
          )!,
          rendered = picture.root.children.find(
            (n) => n.userData.roomedy?.id === item.id,
          )!,
          size = new Box3().setFromObject(rendered).getSize(new Vector3()),
          shown = displayFurnitureSize(item)!;
        expect(fallback.children[0]!.name).toBe('Size not recorded');
        expect(rendered.children.length).toBeGreaterThan(0);
        expect(
          rendered.children.some((n) => n.name === 'Size not recorded'),
        ).toBe(false);
        expect(size.x).toBeCloseTo(shown.depth / 1000, 4);
        expect(size.z).toBeCloseTo(1.201, 4);
        expect(rendered.position.toArray()).toEqual([
          2.6005,
          bottomY / 1000,
          1.9005,
        ]);
        expect(rendered.rotation.y).toBe(-Math.PI / 2);
        expect(rendered.userData.roomedy.dimensions.depth.value).toBeNull();
        expect(JSON.stringify(room)).toBe(before);
      } finally {
        strict.dispose();
        picture.dispose();
      }
    },
  );
  it.each([0, 1, 2, 3] as const)(
    'keeps true odd dimensions, physical half-mm centre and quarter-turn%s',
    (turn) => {
      const p = piece('odd', 2600.5, 1900.5, {
          width: 1201,
          depth: 651,
          quarterTurns: turn,
        }),
        room = commandRoom([p]),
        before = JSON.stringify(room),
        scene = buildDesignScene(room);
      try {
        const node = scene.root.children.find(
            (n) => n.userData.roomedy?.id === 'odd',
          )!,
          box = new Box3().setFromObject(node),
          size = box.getSize(new Vector3()),
          center = box.getCenter(new Vector3());
        expect(node.rotation.y).toBe((-turn * Math.PI) / 2);
        expect(node.userData.roomedy.dimensions.width.value).toBe(1.201);
        expect(scene.root.userData.roomedy.width.value).toBe(10);
        expect(scene.root.userData.roomedy.units).toBe('metres');
        expect(center.x).toBeCloseTo(2.6005, 5);
        expect(center.z).toBeCloseTo(1.9005, 5);
        expect(size.x).toBeCloseTo(turn % 2 ? 0.651 : 1.201, 5);
        expect(size.z).toBeCloseTo(turn % 2 ? 1.201 : 0.651, 5);
        expect(JSON.stringify(room)).toBe(before);
      } finally {
        scene.dispose();
      }
    },
  );
  it('preserves same wall opening geometry and restores all walls for a full model', () => {
    const room = commandRoom([], [door(), windowFeature()]),
      scene = buildDesignScene(room);
    try {
      const north = scene.root.getObjectByName('Wall north')!;
      expect(
        north.children.filter((n) => 'isMesh' in n && n.isMesh),
      ).toHaveLength(wallBoxes(room, 'north').length);
      scene.setCutaway([1, 3, 1], false);
      expect(north.visible).toBe(false);
      scene.full();
      expect(scene.root.getObjectByName('Wall north')!.visible).toBe(true);
      expect(scene.root.getObjectByName('Wall south')!.visible).toBe(true);
    } finally {
      scene.dispose();
    }
  });
  it('keeps unknown dimensions explicit instead of enlarging a guessed furniture model', () => {
    const room = commandRoom([piece('unmeasured')]);
    room.room.height = unknown();
    room.furniture[0]!.dimensions.width = unknown();
    const scene = buildDesignScene(room);
    try {
      const node = scene.root.children.find(
        (n) => n.userData.roomedy?.id === 'unmeasured',
      )!;
      expect(node.children[0]!.name).toBe('Size not recorded');
      expect(node.userData.roomedy.dimensions.width.value).toBeNull();
      expect(scene.root.userData.roomedy.height.value).toBeNull();
      expect(scene.root.userData.roomedy.displayBounds.approximate).toBe(true);
      expect(JSON.stringify(scene.root.userData)).not.toContain('sourceId');
    } finally {
      scene.dispose();
    }
  });
  it('uses true owned-size bounds outside an offered variant and retires maps exactly once', () => {
    const room = commandRoom([
        piece('large', 4000, 4000, { width: 3001, depth: 1201 }),
      ]),
      scene = buildDesignScene(room);
    let retired = 0;
    const floor = scene.root.getObjectByName('Floor');
    if (!floor || !('material' in floor)) throw new Error('fixture');
    const material = floor.material as {
      map: { addEventListener(type: string, callback: () => void): void };
    };
    material.map.addEventListener('dispose', () => retired++);
    const item = scene.root.children.find(
      (n) => n.userData.roomedy?.id === 'large',
    )!;
    const size = new Box3().setFromObject(item).getSize(new Vector3());
    expect(size.x).toBeCloseTo(3.001, 5);
    expect(size.z).toBeCloseTo(1.201, 5);
    expect(scene.nodes).toBeLessThanOrEqual(POLICY.designExportNodes);
    scene.dispose();
    scene.dispose();
    expect(retired).toBe(1);
  });
});
describe('shared local export materials', () => {
  it('retires partial GLB canvas copies on graphics failure and restores borrowed samplers', () => {
    const scene = buildDesignScene(commandRoom([piece('desk')]));
    const before = JSON.stringify(scene.root.toJSON());
    const canvases: { width: number; height: number }[] = [];
    let calls = 0;
    try {
      expect(() =>
        prepareGlbTextures(scene.root, () => {
          const target = {
            width: 0,
            height: 0,
            getContext: () =>
              ++calls === 2
                ? null
                : {
                    createImageData: (w: number, h: number) => ({
                      data: new Uint8ClampedArray(w * h * 4),
                    }),
                    putImageData: () => undefined,
                  },
          };
          canvases.push(target);
          return target as unknown as HTMLCanvasElement;
        }),
      ).toThrow('graphics');
      expect(canvases.length).toBe(2);
      expect(canvases.every((c) => c.width === 1 && c.height === 1)).toBe(true);
      expect(JSON.stringify(scene.root.toJSON())).toBe(before);
    } finally {
      scene.dispose();
    }
  });
  it('prepares the same stable normal/roughness/albedo maps without altering room facts or geometry', async () => {
    const room = commandRoom([piece('desk')]),
      before = JSON.stringify(room);
    const scene = buildDesignScene(room, new Map(), {
      fetch: async (url) =>
        new Response(
          Uint8Array.from(readFileSync('apps/frontend/public' + String(url))),
        ),
      decode: async (_bytes, edge) => {
        const data = new Uint8Array(edge * edge * 4);
        for (let at = 0; at < data.length; at += 4)
          data.set([201, 216, 255, 255], at);
        return data;
      },
    });
    const floor = scene.root.getObjectByName('Floor') as unknown as {
      material: {
        map: { image: { data: Uint8Array } };
        normalMap: { colorSpace: string };
        roughnessMap: { colorSpace: string };
        metalness: number;
        metalnessMap: unknown;
      };
    };
    const original = floor.material.map,
      extent = new Box3()
        .setFromObject(scene.root)
        .getSize(new Vector3())
        .toArray();
    try {
      expect(await scene.prepareSurfaces(new AbortController().signal)).toEqual(
        { loaded: 4, failed: 0 },
      );
      expect(floor.material.map).toBe(original);
      expect([...original.image.data.slice(0, 4)]).toEqual([
        201, 201, 201, 255,
      ]);
      expect(floor.material.normalMap.colorSpace).toBe('');
      expect(floor.material.roughnessMap.colorSpace).toBe('');
      expect(floor.material.metalnessMap).toBeNull();
      const canvases: { width: number; height: number }[] = [];
      const originalNormal = floor.material.normalMap,
        originalRoughness = floor.material.roughnessMap;
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
        };
        canvases.push(canvas);
        return canvas as unknown as HTMLCanvasElement;
      });
      expect(floor.material.normalMap).not.toBe(originalNormal);
      expect(floor.material.roughnessMap).not.toBe(originalRoughness);
      expect(floor.material.metalnessMap).toBeNull();
      expect(floor.material.metalness).toBe(0);
      expect(canvases.length).toBeLessThanOrEqual(8);
      retire();
      retire();
      expect(floor.material.normalMap).toBe(originalNormal);
      expect(floor.material.roughnessMap).toBe(originalRoughness);
      expect(canvases.every((c) => c.width === 1 && c.height === 1)).toBe(true);
      expect(
        new Box3().setFromObject(scene.root).getSize(new Vector3()).toArray(),
      ).toEqual(extent);
      expect(JSON.stringify(room)).toBe(before);
    } finally {
      scene.dispose();
    }
  });
});

describe('cover room framing', () => {
  it.each([
    ['empty', 10000, 10000, 2800, 0],
    ['wide', 12000, 2000, 2800, 0],
    ['tall', 2200, 2200, 6000, 0],
    ['translated furniture', 4200, 4800, 2800, 10000],
  ] as const)(
    'removes unused overview background without clipping %s geometry',
    (_label, width, depth, height, offset) => {
      const room = commandRoom(
        offset ? [piece('outside', offset, offset)] : [],
      );
      room.room.width = known(width);
      room.room.depth = known(depth);
      room.room.height = known(height);
      const before = JSON.stringify(room),
        scene = buildDesignScene(room);
      try {
        const bounds = new Box3().setFromObject(scene.root),
          center = bounds.getCenter(new Vector3()),
          radius = bounds.getSize(new Vector3()).length() / 2,
          camera = new PerspectiveCamera(50, 1.6, 0.04, 200);
        camera.position
          .copy(center)
          .add(
            new Vector3(0.55, 0.75, 0.8)
              .normalize()
              .multiplyScalar((radius / Math.sin((25 * Math.PI) / 180)) * 1.15),
          );
        camera.lookAt(center);
        camera.updateMatrixWorld();
        const crop = coverCrop(bounds, camera);
        expect(crop.width * crop.height).toBeLessThan(1600 * 1000 * 0.9);
        expect(crop.x).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.width).toBeLessThanOrEqual(1600);
        expect(crop.y + crop.height).toBeLessThanOrEqual(1000);
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const p = new Vector3(x, y, z).project(camera),
                px = ((p.x + 1) * 1600) / 2,
                py = ((1 - p.y) * 1000) / 2;
              expect(px).toBeGreaterThan(crop.x);
              expect(px).toBeLessThan(crop.x + crop.width);
              expect(py).toBeGreaterThan(crop.y);
              expect(py).toBeLessThan(crop.y + crop.height);
            }
        expect(JSON.stringify(room)).toBe(before);
      } finally {
        scene.dispose();
      }
    },
  );
  it('clamps a partially off-image projection to the finite render', () => {
    const bounds = new Box3().set(
        new Vector3(-10, -10, -10),
        new Vector3(10, 10, 10),
      ),
      camera = new PerspectiveCamera(50, 1.6, 0.04, 200);
    camera.position.set(0, 0, 15);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    expect(coverCrop(bounds, camera)).toEqual({
      x: 0,
      y: 0,
      width: 1600,
      height: 1000,
    });
  });
});
const jpeg = Uint8Array.from(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAA//Z',
    'base64',
  ),
);
describe('shared professional design-only PDF', () => {
  it('generates a bounded portrait design document without changing editable facts', async () => {
    const room = project().current,
      before = JSON.stringify(room);
    room.furniture[0]!.label = 'Desk — مكتب 🌿';
    const marked = JSON.stringify(room);
    const bytes = await designPortfolioPdf(
        room,
        { overview: jpeg, plan: jpeg },
        () => {},
      ),
      text = Buffer.from(bytes).toString('latin1');
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.match(/\/Type \/Page\b/g)).toHaveLength(6);
    expect(text).toContain('/MediaBox [ 0 0 595.28 841.89 ]');
    expect(text).not.toContain('/JavaScript');
    expect(text).not.toContain('/EmbeddedFiles');
    expect(JSON.stringify(room)).toBe(marked);
    expect(marked).not.toBe(before);
  });
  it('rejects excessive view work instead of accepting unbounded design pages', async () => {
    await expect(
      designPortfolioPdf(
        project().current,
        {
          overview: jpeg,
          plan: jpeg,
          views: Array.from({ length: 4 }, () => ({
            image: jpeg,
            label: 'extra',
          })),
        },
        () => {},
      ),
    ).rejects.toMatchObject({ code: 'too-large' });
  });
  it('fences cancellation between document pages', async () => {
    let calls = 0;
    await expect(
      designPortfolioPdf(
        project().current,
        { overview: jpeg, plan: jpeg },
        () => {
          if (++calls === 2) throw new Error('cancel');
        },
      ),
    ).rejects.toThrow('cancel');
    expect(calls).toBe(2);
  });
});

describe('Wavefront geometry and companion materials', () => {
  it('serializes finite world-space faces, matching material references and local textures', async () => {
    const scene = buildDesignScene(
      commandRoom([piece('desk', 2600.5, 1900.5, { quarterTurns: 1 })]),
    );
    try {
      const files = await objFiles(
        scene.root,
        new AbortController().signal,
        () => {},
        async () => new Uint8Array([137, 80, 78, 71]),
      );
      const text = new TextDecoder().decode(files['roomedy-design.obj']);
      const mtl = new TextDecoder().decode(files['roomedy-design.mtl']);
      const vertices = text
        .split('\n')
        .filter((line) => line.startsWith('v '))
        .map((line) => line.split(' ').slice(1).map(Number));
      expect(vertices.length).toBeGreaterThan(20);
      expect(vertices.flat().every(Number.isFinite)).toBe(true);
      for (const face of text
        .split('\n')
        .filter((line) => line.startsWith('f ')))
        for (const token of face.slice(2).split(' ')) {
          const index = Number(token.split('/')[0]);
          expect(index).toBeGreaterThan(0);
          expect(index).toBeLessThanOrEqual(vertices.length);
        }
      for (const name of text.matchAll(/usemtl (\w+)/g))
        expect(mtl).toContain('newmtl ' + name[1]);
      expect(mtl).toContain('map_Kd -s');
      expect(
        Object.keys(files).some((name) => name.startsWith('textures/')),
      ).toBe(true);
      expect(text).not.toContain('NaN');
      expect(text).toContain('Units: metres. Y is up.');
      expect(Object.keys(files).every((name) => !name.includes('..'))).toBe(
        true,
      );
    } finally {
      scene.dispose();
    }
  });
  it('yields to cancellation during bounded mesh work without producing an archive', async () => {
    const scene = buildDesignScene(commandRoom([piece('desk')]));
    let checks = 0;
    try {
      await expect(
        objFiles(scene.root, new AbortController().signal, () => {
          if (++checks === 3) throw Error('cancel');
        }),
      ).rejects.toThrow('cancel');
    } finally {
      scene.dispose();
    }
  });
});
