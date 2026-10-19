import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, it, expect, vi } from 'vitest';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  changedPieces,
  displayRoom,
  cameraFrameMetres,
  featureBox,
  piecePose,
  pieceRepresentation,
  wallBoxes,
} from '../apps/frontend/src/features/room-view/adapter.js';
import {
  ViewAssets,
  LOCAL_MODELS,
} from '../apps/frontend/src/features/room-view/assets.js';
import type { AssetState } from '../apps/frontend/src/features/room-view/assets.js';
import { comparisonFrame } from '../apps/frontend/src/features/session/state.js';
import {
  cameraJourney,
  cameraPositionAllowed,
  cameraViewPose,
  moveCamera,
} from '../apps/frontend/src/features/room-view/camera.js';
import type { Triple } from '../apps/frontend/src/features/room-view/adapter.js';
import { CATALOGUE } from '@roomedy/spatial';
import { proceduralParts } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import {
  advanceSurfaceColor,
  createSurfaces,
  detailedParts,
  surfaceModel,
} from '../apps/frontend/src/features/room-view/surfaces.js';
import {
  floorPlacement,
  pointOnFloor,
} from '../apps/frontend/src/features/room-view/manipulation.js';
import { commandRoom, piece as commandPiece } from './fixtures/command-room.js';

const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { Color } = (await import(
  pathToFileURL(requireFrontend.resolve('three/src/math/Color.js')).href
)) as {
  Color: new (value: string) => Parameters<typeof advanceSurfaceColor>[0];
};

describe('3D floor projection into the existing placement policy', () => {
  it('intersects the actual forward ray with floor zero and converts metres to semantic millimetres once', () => {
    const ray = {
        origin: { x: 1, y: 2, z: 3 },
        direction: { x: 0.5, y: -1, z: 1 },
      },
      before = structuredClone(ray);
    expect(pointOnFloor(ray)).toEqual({ x: 2000, z: 5000 });
    expect(ray).toEqual(before);
    for (const direction of [
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 1, z: 0 },
      { x: NaN, y: -1, z: 0 },
      { x: 1, y: -1e-7, z: 1 },
    ])
      expect(pointOnFloor({ origin: ray.origin, direction })).toBeNull();
    expect(
      pointOnFloor({
        origin: { x: Infinity, y: 1, z: 0 },
        direction: ray.direction,
      }),
    ).toBeNull();
  });
  it('retains grab offset, exact odd-size wall contact and half-mm precision at every supported turn', () => {
    const item = commandPiece('odd', 2000, 2500, { width: 1501, depth: 601 });
    const room = commandRoom([item]),
      before = JSON.stringify(room);
    for (const turn of [0, 1, 2, 3] as const) {
      item.pose.quarterTurns = turn;
      const x = turn % 2 ? 0.31 : 0.76;
      const next = floorPlacement(
        room,
        item,
        { origin: { x, y: 1, z: 2.5 }, direction: { x: 0, y: -1, z: 0 } },
        { x: 0, z: 0 },
        true,
      );
      expect(next).toEqual({ x: turn % 2 ? 300.5 : 750.5, z: 2500 });
    }
    item.pose.quarterTurns = 0;
    expect(JSON.stringify(room)).toBe(before);
    expect(
      floorPlacement(
        room,
        item,
        {
          origin: { x: 2.00024, y: 1, z: 3.00026 },
          direction: { x: 0, y: -1, z: 0 },
        },
        { x: 1.25, z: 0.1 },
        false,
      ),
    ).toEqual({ x: 1999, z: 3000 });
    expect(
      floorPlacement(
        room,
        item,
        { origin: { x: 0, y: 1, z: 0 }, direction: { x: 0, y: -1, z: 0 } },
        { x: Infinity, z: 0 },
        true,
      ),
    ).toBeNull();
  });
});

describe('finite close-up surface ownership and physical envelopes', () => {
  it('keeps finish movement awake until exact convergence without changing the target', () => {
    const current = new Color('#f3eee2'),
      target = new Color('#879080'),
      original = current.clone(),
      unchangedTarget = target.clone();
    expect(advanceSurfaceColor(current, target, 1 / 60)).toBe(true);
    expect(current.equals(original)).toBe(false);
    expect(current.equals(target)).toBe(false);
    let frames = 1;
    while (advanceSurfaceColor(current, target, 1 / 60) && frames < 120)
      frames++;
    expect(frames).toBeLessThan(60);
    expect(current.equals(target)).toBe(true);
    expect(target.equals(unchangedTarget)).toBe(true);
    expect(advanceSurfaceColor(current, target, 1 / 60)).toBe(false);
  });

  it('retargets from the displayed color and caps a resumed long frame', () => {
    const current = new Color('#f3eee2'),
      first = new Color('#879080'),
      next = new Color('#735243');
    advanceSurfaceColor(current, first, 1 / 60);
    const visible = current.clone(),
      expected = visible.clone().lerp(next, 1 - Math.exp(-0.05 * 16));
    expect(advanceSurfaceColor(current, next, 5)).toBe(true);
    expect(current.equals(expected)).toBe(true);
    expect(current.equals(first)).toBe(false);
    expect(current.equals(next)).toBe(false);
  });

  it('creates deterministic bounded mipmapped surfaces and finite bevels inside the original unit box', () => {
    const a = createSurfaces(),
      b = createSurfaces();
    let bytes = 0,
      disposed = 0,
      otherDisposed = 0;
    for (const key of [
      'floor',
      'wood',
      'fabric',
      'plaster',
      'smooth',
      'tile',
      'concrete',
    ] as const) {
      const map = a[key],
        other = b[key];
      const pixels = map.image.data,
        otherPixels = other.image.data;
      if (!pixels || !otherPixels) throw new Error('surface-pixels-missing');
      expect(map.image.width).toBeLessThanOrEqual(512);
      expect(map.image.height).toBeLessThanOrEqual(512);
      bytes += pixels.byteLength;
      expect(createHash('sha256').update(pixels).digest('hex')).toBe(
        createHash('sha256').update(otherPixels).digest('hex'),
      );
      if (key === 'smooth') expect(new Set(pixels).size).toBe(1);
      else expect(new Set(pixels).size).toBeGreaterThan(2);
      expect(map.generateMipmaps).toBe(true);
      map.addEventListener('dispose', () => disposed++);
      other.addEventListener('dispose', () => otherDisposed++);
    }
    expect(bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
    for (const key of ['hard', 'soft'] as const) {
      const g = a[key];
      g.computeBoundingBox();
      expect(g.getAttribute('position').count / 3).toBeLessThanOrEqual(108);
      expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(
        true,
      );
      expect([...g.getAttribute('normal').array].every(Number.isFinite)).toBe(
        true,
      );
      for (const axis of ['x', 'y', 'z'] as const) {
        expect(g.boundingBox!.min[axis]).toBeCloseTo(-0.5);
        expect(g.boundingBox!.max[axis]).toBeCloseTo(0.5);
      }
      g.addEventListener('dispose', () => disposed++);
      b[key].addEventListener('dispose', () => otherDisposed++);
    }
    a.dispose();
    expect(disposed).toBe(9);
    expect(otherDisposed).toBe(0);
    expect(() => a.dispose()).not.toThrow();
    b.dispose();
    expect(otherDisposed).toBe(9);
  });
  it('keeps decorative pillows, recessed fronts and handles within every min/max physical envelope', () => {
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
          ),
          original = JSON.stringify(parts);
        for (const part of detailedParts(parts, size)) {
          const low = [-size.width / 2, 0, -size.depth / 2],
            high = [size.width / 2, size.height, size.depth / 2];
          for (const axis of [0, 1, 2] as const) {
            expect(part.size[axis]).toBeGreaterThan(0);
            expect(
              part.center[axis] - part.size[axis] / 2,
            ).toBeGreaterThanOrEqual(low[axis]!);
            expect(part.center[axis] + part.size[axis] / 2).toBeLessThanOrEqual(
              high[axis]!,
            );
          }
        }
        expect(JSON.stringify(parts)).toBe(original);
      }
  });
  it('polishes only instance materials and retires them independently of immutable cache geometry and textures', async () => {
    const bytes = await readFile(
      'apps/frontend/public/catalogue/chair-desk-v1.glb',
    );
    let state: AssetState | undefined;
    const cache = new ViewAssets(
      (s) => {
        state = s.get(LOCAL_MODELS[0]);
      },
      { fetch: async () => new Response(bytes) },
    );
    cache.load(LOCAL_MODELS[0]);
    await vi.waitFor(() => expect(state?.kind).toBe('ready'));
    if (state?.kind !== 'ready') throw new Error('local-fixture-not-ready');
    const surfaces = createSurfaces(),
      source = state.asset.scene,
      before = JSON.stringify(source.toJSON());
    let sourceDisposed = 0,
      texturesDisposed = 0;
    source.traverse((o) => {
      type Disposable = {
        addEventListener: (kind: string, fn: () => void) => void;
      };
      const mesh = o as unknown as {
        geometry?: Disposable;
        material?: Disposable | Disposable[];
      };
      mesh.geometry?.addEventListener('dispose', () => sourceDisposed++);
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [])
        material.addEventListener('dispose', () => sourceDisposed++);
    });
    surfaces.fabric.addEventListener('dispose', () => texturesDisposed++);
    const instance = surfaceModel(source, surfaces);
    expect(instance.object).not.toBe(source);
    expect(JSON.stringify(source.toJSON())).toBe(before);
    instance.dispose();
    instance.dispose();
    expect(sourceDisposed).toBe(0);
    expect(texturesDisposed).toBe(0);
    surfaces.dispose();
    expect(texturesDisposed).toBe(1);
    cache.dispose();
    expect(sourceDisposed).toBeGreaterThan(0);
  });
});

describe('bounded presentation camera navigation', () => {
  it('chooses meaningful free eye positions without mutating accepted or approximate facts', () => {
    for (const condition of ['sample', 'empty', 'partial'] as const) {
      const room = createRoomFixture(condition),
        before = JSON.stringify(room);
      for (const view of ['doorway', 'corner', 'work-area'] as const) {
        const pose = cameraViewPose(room, view);
        if (view === 'work-area' && condition !== 'sample')
          expect(pose).toBeNull();
        else {
          expect(pose).not.toBeNull();
          expect(cameraPositionAllowed(room, pose!.position)).toBe(true);
          expect(pose!.position[1]).toBe(1.6);
          expect(pose!.target.every(Number.isFinite)).toBe(true);
        }
      }
      expect(JSON.stringify(room)).toBe(before);
    }
  });
  it('does not offer a room-interior pose when no safe floor or head space exists', () => {
    const room = createRoomFixture('sample');
    room.furniture = [room.furniture[0]!];
    room.furniture[0]!.dimensions.width.value = 4200;
    room.furniture[0]!.dimensions.depth.value = 4800;
    room.furniture[0]!.pose.centerX = 2100;
    room.furniture[0]!.pose.centerZ = 2400;
    expect(cameraViewPose(room, 'corner')).toBeNull();
    room.furniture = [];
    room.room.width.value = 500;
    expect(cameraViewPose(room, 'doorway')).toBeNull();
    room.room.width.value = 4200;
    room.room.height.value = 600;
    expect(cameraViewPose(room, 'corner')).toBeNull();
    expect(
      cameraViewPose(room, 'overview')!.position.every(Number.isFinite),
    ).toBe(true);
  });
  it('routes around a barrier with bounded finite clear segments and stops deliberate steps at its edge', () => {
    const room = createRoomFixture('sample');
    room.furniture = [room.furniture[0]!];
    const barrier = room.furniture[0]!;
    barrier.dimensions.width.value = 1200;
    barrier.dimensions.depth.value = 2400;
    barrier.pose.centerX = 2100;
    barrier.pose.centerZ = 2400;
    barrier.pose.quarterTurns = 0;
    const from: Triple = [0.4, 1.6, 2.4],
      to: Triple = [3.8, 1.6, 2.4];
    const path = cameraJourney(room, from, to);
    expect(path.length).toBeGreaterThan(1);
    expect(path.length).toBeLessThanOrEqual(626);
    expect(path.at(-1)).toEqual(to);
    let previous = from;
    for (const p of path) {
      for (let n = 0; n <= 20; n++)
        expect(
          cameraPositionAllowed(
            room,
            previous.map((v, i) => v + ((p[i]! - v) * n) / 20) as Triple,
          ),
        ).toBe(true);
      previous = p;
    }
    const stopped = moveCamera(room, from, to);
    expect(stopped[0]).toBeGreaterThan(1.3);
    expect(stopped[0]).toBeLessThan(1.32);
    expect(stopped[1]).toBe(1.6);
    expect(cameraPositionAllowed(room, stopped)).toBe(true);
    expect(moveCamera(room, from, [NaN, 0, 0])).toEqual(from);
    expect(moveCamera(room, from, [-20, 0, 2.4])).toEqual([0.18, 1.6, 2.4]);
  });
  it('uses the open roof for disconnected travel and keeps comparison overview framing identical', () => {
    const room = createRoomFixture('sample');
    room.furniture = [room.furniture[0]!];
    const barrier = room.furniture[0]!;
    barrier.dimensions.width.value = 1200;
    barrier.dimensions.depth.value = 4800;
    barrier.pose.centerX = 2100;
    barrier.pose.centerZ = 2400;
    barrier.pose.quarterTurns = 0;
    const path = cameraJourney(room, [0.4, 1.6, 2.4], [3.8, 1.6, 2.4]);
    expect(path).toHaveLength(3);
    expect(path[0]![1]).toBeGreaterThan(2.6);
    expect(path[1]![1]).toBe(path[0]![1]);
    const current = structuredClone(room);
    current.room.width.value = 3000;
    const frame = comparisonFrame({ current, baseline: room });
    expect(cameraViewPose(current, 'overview', frame)).toEqual(
      cameraViewPose(room, 'overview', frame),
    );
    expect(cameraJourney(room, [NaN, 1, 0], [1, 1, 1])).toEqual([]);
  });
});

describe('cutaway projection over semantic snapshots', () => {
  it('uses identical physical camera bounds for Before/Current after dimension correction without changing shell geometry', () => {
    const baseline = createRoomFixture('sample'),
      current = structuredClone(baseline);
    current.room.width.value = 3000;
    current.room.depth.value = 5000;
    current.room.height.value = 2400;
    const before = structuredClone(baseline),
      frame = comparisonFrame({ current, baseline });
    expect(cameraFrameMetres(frame)).toEqual({
      width: 4.2,
      depth: 5,
      height: 2.6,
    });
    expect(displayRoom(current).width).toBe(3);
    expect(displayRoom(baseline).depth).toBe(4.8);
    expect(baseline).toEqual(before);
  });
  it('preserves odd dimensions, half-mm centres and the independent front at every turn', () => {
    const p = createRoomFixture('sample').furniture[1]!;
    p.pose.centerX = 750.5;
    p.pose.centerZ = 1000.5;
    for (const q of [0, 1, 2, 3] as const) {
      p.pose.quarterTurns = q;
      const pose = piecePose(p);
      expect(pose.position).toEqual([0.7505, 0, 1.0005]);
      expect(Math.sin(pose.rotationY)).toBeCloseTo([0, -1, 0, 1][q]!);
      expect(Math.cos(pose.rotationY)).toBeCloseTo([1, 0, -1, 0][q]!);
    }
  });
  it('builds exact opening gaps and retains union area when openings overlap', () => {
    const room = createRoomFixture('sample'),
      window = room.room.features[1]!;
    expect(featureBox(room, window)).toEqual({
      center: [3.1, 1.45, 0.03],
      size: [1.2, 1.1, 0.06],
    });
    const area = () =>
      wallBoxes(room, 'north').reduce(
        (sum, b) => sum + b.size[0] * b.size[1],
        0,
      );
    expect(area()).toBeCloseTo(4.2 * 2.6 - 1.2 * 1.1);
    room.room.features.push({
      ...structuredClone(window),
      id: 'duplicate-window',
    });
    expect(area()).toBeCloseTo(4.2 * 2.6 - 1.2 * 1.1);
    window.wall = 'unknown';
    expect(featureBox(room, window)).toBeNull();
    room.room.features.pop();
    expect(area()).toBeCloseTo(4.2 * 2.6);
  });
  it('projects east and south obstacles using the actual wall depth and sill', () => {
    const room = createRoomFixture('empty'),
      f = {
        ...room.room.features[1]!,
        kind: 'obstacle' as const,
        wall: 'east' as const,
        projection: {
          value: 350,
          status: 'confirmed' as const,
          sourceId: 'sample',
        },
      };
    expect(featureBox(room, f)).toEqual({
      center: [4.025, 1.45, 3.1],
      size: [0.35, 1.1, 1.2],
    });
    expect(featureBox(room, { ...f, wall: 'south' })).toEqual({
      center: [3.1, 1.45, 4.625],
      size: [1.2, 1.1, 0.35],
    });
  });
  it('keeps owned size truth and unknown dimensions distinct from representation availability', () => {
    const room = createRoomFixture('sample'),
      p = room.furniture[0]!;
    p.dimensions.width.value = 2501;
    const before = JSON.stringify(room),
      rep = pieceRepresentation(p);
    expect(rep.kind).toBe('procedural');
    if (rep.kind === 'procedural') {
      expect(rep.footprint.width).toBe(2501);
      expect(rep.parts[0]?.name).toBe('physical-bounds');
      expect(rep.notice).toBeTruthy();
    }
    expect(JSON.stringify(room)).toBe(before);
    p.dimensions.height.value = null;
    p.dimensions.height.status = 'unknown';
    expect(pieceRepresentation(p).kind).toBe('unavailable');
    expect(displayRoom(createRoomFixture('partial'))).toMatchObject({
      height: 2.6,
      approximate: true,
    });
  });
  it('accepts readonly baseline/current/candidate projections without mutation', () => {
    const baseline = createRoomFixture('sample'),
      candidate = structuredClone(baseline);
    candidate.furniture[1]!.pose.centerX = 3400.5;
    const before = JSON.stringify(baseline);
    expect(changedPieces(baseline, candidate).map((p) => p.id)).toEqual([
      'desk_1',
    ]);
    expect(changedPieces(baseline)).toEqual([]);
    expect(piecePose(baseline.furniture[1]!).position).toEqual([3.2, 0, 1]);
    expect(piecePose(candidate.furniture[1]!).position).toEqual([3.4005, 0, 1]);
    expect(JSON.stringify(baseline)).toBe(before);
  });
});

describe('finite per-canvas model ownership', () => {
  it('loads only the reviewed local GLBs once, disposes one view without retiring another', async () => {
    const bytes = await readFile(
      'apps/frontend/public/catalogue/chair-desk-v1.glb',
    );
    const fetch = vi.fn(async () => new Response(bytes));
    const a = new Map<string, AssetState>(),
      b = new Map<string, AssetState>();
    const owner = new ViewAssets(
      (s) => {
        a.clear();
        s.forEach((v, k) => a.set(k, v));
      },
      { fetch },
    );
    const other = new ViewAssets(
      (s) => {
        b.clear();
        s.forEach((v, k) => b.set(k, v));
      },
      { fetch },
    );
    owner.load('https://example.invalid/other.glb');
    owner.load(LOCAL_MODELS[0]);
    owner.load(LOCAL_MODELS[0]);
    other.load(LOCAL_MODELS[0]);
    await vi.waitFor(() => {
      expect(a.get(LOCAL_MODELS[0])?.kind).toBe('ready');
      expect(b.get(LOCAL_MODELS[0])?.kind).toBe('ready');
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    const first = a.get(LOCAL_MODELS[0]),
      second = b.get(LOCAL_MODELS[0]);
    let disposed = 0,
      otherDisposed = 0;
    if (first?.kind === 'ready' && second?.kind === 'ready') {
      expect(first.asset.scene).not.toBe(second.asset.scene);
      for (const [asset, increment] of [
        [first.asset, () => disposed++],
        [second.asset, () => otherDisposed++],
      ] as const)
        asset.scene.traverse((o) => {
          const mesh = o as unknown as {
            geometry?: {
              addEventListener: (kind: string, callback: () => void) => void;
            };
          };
          mesh.geometry?.addEventListener('dispose', increment);
        });
    }
    owner.dispose();
    owner.dispose();
    expect(disposed).toBeGreaterThan(0);
    expect(otherDisposed).toBe(0);
    other.dispose();
    expect(otherDisposed).toBeGreaterThan(0);
  });
  it('rejects excessive local bytes/fragments and parser failure with a safe fallback', async () => {
    for (const response of [
      () => new Response(new Uint8Array(256 * 1024 + 1)),
      () =>
        new Response(
          new ReadableStream({
            start(c) {
              for (let i = 0; i < 1025; i++) c.enqueue(new Uint8Array([1]));
              c.close();
            },
          }),
        ),
      () => new Response(new Uint8Array([1])),
    ]) {
      let last: AssetState | undefined;
      const parse = vi.fn(async () => {
        throw new Error('private-parser-detail');
      });
      const owner = new ViewAssets(
        (s) => {
          last = s.get(LOCAL_MODELS[0]);
        },
        { fetch: async () => response(), parse },
      );
      owner.load(LOCAL_MODELS[0]);
      await vi.waitFor(() => expect(last).toEqual({ kind: 'failed' }));
      owner.dispose();
    }
  });
  it('retires a late decode after deadline or unmount before it can publish', async () => {
    vi.useFakeTimers();
    try {
      for (const retire of ['deadline', 'unmount']) {
        type LoadedAsset = Extract<AssetState, { kind: 'ready' }>['asset'];
        let release: ((asset: LoadedAsset) => void) | undefined;
        // A no-mesh asset is sufficient to verify publication fencing independently of GLTF parsing.
        const asset = { scenes: [], scene: {} } as unknown as LoadedAsset;
        const updates: AssetState[] = [];
        const owner = new ViewAssets(
          (s) => updates.push(s.get(LOCAL_MODELS[0])!),
          {
            fetch: async () => new Response(new Uint8Array([1])),
            parse: () =>
              new Promise((resolve) => {
                release = resolve;
              }),
          },
        );
        owner.load(LOCAL_MODELS[0]);
        await vi.waitFor(() => expect(release).toBeDefined());
        if (retire === 'deadline') await vi.advanceTimersByTimeAsync(10001);
        else owner.dispose();
        const count = updates.length;
        release!(asset);
        await vi.advanceTimersByTimeAsync(1);
        expect(updates).not.toContainEqual(
          expect.objectContaining({ kind: 'ready' }),
        );
        expect(updates).toHaveLength(count);
        owner.dispose();
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('outward 3D floor dragging', () => {
  it('uses the same bounded physical corner as2D and retains the grab offset', () => {
    const item = commandPiece('odd', 2000, 2500, { width: 1501, depth: 601 });
    const room = commandRoom([item]);
    for (const snap of [false, true])
      expect(
        floorPlacement(
          room,
          item,
          { origin: { x: -5, y: 2, z: 15 }, direction: { x: 0, y: -1, z: 0 } },
          { x: 200, z: 300 },
          snap,
        ),
      ).toEqual({ x: 750.5, z: 9699.5 });
    expect(item.pose.centerX).toBe(2000);
  });
});
