import { describe, expect, it } from 'vitest';
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
  portfolioFacts,
  measurement,
} from '../apps/frontend/src/features/design-export/facts.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { objFiles } from '../apps/frontend/src/features/design-export/obj.js';
import { portfolioPdf } from '../apps/frontend/src/features/design-export/pdf.js';
import { coverCrop } from '../apps/frontend/src/features/design-export/capture.js';
import { wallBoxes } from '../apps/frontend/src/features/room-view/adapter.js';
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
  it.each([
    [0, 3],
    [1, 4],
    [16, 4],
    [17, 5],
    [32, 5],
    [40, 6],
  ] as const)(
    'paginates %s furniture into %s useful pages without fillers',
    (count, pages) => {
      const p = project(count),
        before = JSON.stringify(p),
        facts = portfolioFacts(p);
      expect(facts.pages).toBe(pages);
      expect(facts.inventory.flat().length).toBe(count);
      expect(facts.inventory.every((part) => part.length <= 16)).toBe(true);
      expect(JSON.stringify(p)).toBe(before);
    },
  );
  it('retains Unicode labels, exact half-mm movement and estimated/unknown measurements', () => {
    const p = project();
    p.current.furniture[0]!.label = 'Desk — مكتب 🌿';
    p.current.furniture[0]!.pose.centerX += 0.5;
    p.current.room.width = {
      value: 10000,
      status: 'estimated',
      sourceId: 'visitor-estimate',
    };
    p.current.room.height = unknown();
    p.current.furniture[0]!.dimensions.depth = unknown();
    const facts = portfolioFacts(p);
    expect(facts.moved).toBe(1);
    expect(facts.inventory[0]![0]!.label).toBe('Desk — مكتب 🌿');
    expect(facts.missingSize).toBe(1);
    expect(facts.uncertain).toBe(true);
    expect(facts.area).toMatch(/^~/);
    expect(measurement(p.current.room.height)).toBe('Not recorded');
    expect(measurement(known(1201))).toBe('1.201 m');
  });
});
describe('canonical3D export projection', () => {
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
describe('generated portfolio PDF', () => {
  it('writes a real multipage landscape PDF containing only generated page images', async () => {
    const bytes = await portfolioPdf([jpeg, jpeg, jpeg]),
      text = Buffer.from(bytes).toString('latin1');
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.match(/\/Type \/Page\b/g)).toHaveLength(3);
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(3);
    expect(text).toContain('/MediaBox [ 0 0 841.89 595.28 ]');
    expect(text).toContain('xref');
    expect(text).not.toContain('/JavaScript');
    expect(text).not.toContain('/EmbeddedFiles');
  });
  it('rejects empty or excessive page work before image parsing', async () => {
    await expect(portfolioPdf([])).rejects.toMatchObject({ code: 'too-large' });
    await expect(
      portfolioPdf(
        Array.from({ length: POLICY.designExportPages + 1 }, () => jpeg),
      ),
    ).rejects.toMatchObject({ code: 'too-large' });
  });
  it('fences cancellation before or between generated pages', async () => {
    let calls = 0;
    await expect(
      portfolioPdf([jpeg, jpeg], () => {
        if (++calls === 2) throw new Error('cancel');
      }),
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
