import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { landingSurfaces } from '../apps/frontend/src/features/landing/finish-motion.js';
import {
  advanceScroll,
  landingFraming,
  landingPixelRatio,
  landingFurniture,
  landingFurniturePose,
  landingFurnitureAssembly,
  boundedProgress,
  roomChoreography,
} from '../apps/frontend/src/features/landing/scroll-motion.js';

const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { PerspectiveCamera, Vector3 } = await import(
  pathToFileURL(requireFrontend.resolve('three/src/Three.js')).href
);

describe('scroll-driven room presentation', () => {
  it('bounds malformed/out-of-range targets without inventing a motion command', () => {
    for (const n of [NaN, Infinity, -Infinity, -100, 0, 0.5, 1, 100]) {
      const pose = roomChoreography(n);
      for (const value of Object.values(pose)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
    expect(boundedProgress(2)).toBe(1);
    expect(roomChoreography(0)).toEqual({
      rotation: 0,
      opening: 1,
    });
    expect(roomChoreography(1)).toEqual({
      rotation: 1,
      opening: 0,
    });
  });
  it('retraces continuous turning and late wall raising on backward scroll', () => {
    const samples = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(i / 1000),
    );
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.rotation).toBeGreaterThanOrEqual(
        samples[i - 1]!.rotation,
      );
      expect(samples[i]!.opening).toBeLessThanOrEqual(samples[i - 1]!.opening);
      for (const key of ['rotation', 'opening'] as const)
        expect(Math.abs(samples[i]![key] - samples[i - 1]![key])).toBeLessThan(
          0.007,
        );
    }
    const backwards = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(1 - i / 1000),
    );
    backwards.reverse().forEach((pose, i) => {
      for (const key of ['rotation', 'opening'] as const)
        expect(pose[key]).toBeCloseTo(samples[i]![key], 10);
    });
  });
  it('keeps walls lowered through finishing/cost and raises them to an upright completion', () => {
    for (const p of [0, 0.19, 0.31, 0.4, 0.49, 0.65, 0.74])
      expect(roomChoreography(p).opening).toBe(1);
    const halfway = roomChoreography(0.86).opening;
    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(1);
    for (const p of [0.98, 1, 2]) expect(roomChoreography(p).opening).toBe(0);
  });
  it('interrupts from the displayed state and settles both directions without overshoot', () => {
    let displayed = 0;
    for (let i = 0; i < 5; i++) displayed = advanceScroll(displayed, 1, 1 / 60);
    const interrupted = displayed;
    displayed = advanceScroll(displayed, 0, 1 / 60);
    expect(displayed).toBeGreaterThan(0);
    expect(displayed).toBeLessThan(interrupted);
    expect(advanceScroll(0, 1, 50)).toBe(advanceScroll(0, 1, 0.05));
    expect(advanceScroll(0.4, 0.8, NaN)).toBe(0.4);
    for (const target of [1, 0.3, 0.75, 0]) {
      for (let i = 0; i < 100; i++)
        displayed = advanceScroll(displayed, target, 1 / 60);
      expect(displayed).toBe(target);
    }
  });
});

describe('full-viewport landing framing', () => {
  it('keeps framing finite and continuous across scroll, reversal and viewport ratios', () => {
    for (const aspect of [0, NaN, Infinity, 0.35, 0.8, 1.3, 1.8, 4]) {
      let prior = landingFraming(0, aspect);
      for (let i = 0; i <= 1000; i++) {
        const current = landingFraming(i / 1000, aspect);
        for (const n of [
          ...current.camera,
          ...current.lookAt,
          current.scale,
          current.turn,
          current.shift,
        ])
          expect(Number.isFinite(n)).toBe(true);
        current.camera.forEach((n, k) =>
          expect(
            Math.abs(n - prior.camera[k]!) / Math.hypot(...prior.camera),
          ).toBeLessThan(0.006),
        );
        expect(Math.abs(current.shift - prior.shift)).toBeLessThan(0.02);
        prior = current;
      }
    }
  });
  it('keeps the enlarged floor visible, fits narrow/final walls and bounds decorative lowered-wall cropping', () => {
    let extent = 0,
      coreExtent = 0,
      fittedExtent = 0;
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [430, 932],
      [768, 1024],
      [1024, 768],
      [1280, 600],
      [1280, 560],
      [1350, 577],
      [1280, 720],
      [1366, 768],
      [1920, 1080],
    ]) {
      const aspect = width! / height!,
        camera = new PerspectiveCamera(38, aspect, 0.1, 80);
      for (let i = 0; i <= 100; i++) {
        const p = i / 100,
          f = landingFraming(p, aspect),
          opening = roomChoreography(p).opening;
        camera.position.set(...f.camera);
        camera.lookAt(new Vector3(...f.lookAt));
        camera.setViewOffset(aspect, 1, (-f.shift * aspect) / 2, 0, aspect, 1);
        camera.updateMatrixWorld();
        const project = (point: InstanceType<typeof Vector3>, core = false) => {
          point
            .multiplyScalar(f.scale)
            .applyAxisAngle(new Vector3(0, 1, 0), f.turn)
            .project(camera);
          extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y));
          if (core)
            coreExtent = Math.max(
              coreExtent,
              Math.abs(point.x),
              Math.abs(point.y),
            );
          if (aspect <= 1.3 || p >= 0.84)
            fittedExtent = Math.max(
              fittedExtent,
              Math.abs(point.x),
              Math.abs(point.y),
            );
          expect(point.z).toBeGreaterThan(-1);
          expect(point.z).toBeLessThan(1);
        };
        for (const side of ['north', 'west'] as const) {
          for (const x of side === 'north'
            ? [-landingSurfaces.northWidth / 2, landingSurfaces.northWidth / 2]
            : [-0.06, 0.06])
            for (const y of [
              landingSurfaces.wallBottom,
              landingSurfaces.wallBottom + landingSurfaces.wallHeight,
            ])
              for (const z of side === 'north'
                ? [-0.06, 0.06]
                : [
                    -landingSurfaces.westWidth / 2,
                    landingSurfaces.westWidth / 2,
                  ]) {
                const point = new Vector3(x, y, z);
                point.applyAxisAngle(
                  new Vector3(...(side === 'north' ? [1, 0, 0] : [0, 0, 1])),
                  ((opening * Math.PI) / 2.2) * (side === 'north' ? -1 : 1),
                );
                point.add(
                  new Vector3(
                    ...(side === 'north' ? [0, 0, -2.45] : [-2.2, 0, 0]),
                  ),
                );
                project(point);
              }
        }
        for (const x of [-2.225, 2.225])
          for (const z of [-2.525, 2.525])
            project(new Vector3(x, -0.02, z), true);
      }
    }
    expect(Number.isFinite(extent)).toBe(true);
    expect(coreExtent).toBeLessThan(0.99);
    expect(fittedExtent).toBeLessThan(0.98);
    expect(extent).toBeLessThan(1.4);
  });
  it('places the room opposite alternating desktop copy and restores a substantial opening floor', () => {
    for (const p of [0, 0.15, 0.49])
      expect(landingFraming(p, 16 / 9).shift).toBeGreaterThan(0.2);
    for (const p of [0.31, 0.65])
      expect(landingFraming(p, 16 / 9).shift).toBeLessThan(-0.2);
    for (const p of [0.82, 1])
      expect(landingFraming(p, 16 / 9).shift).toBeCloseTo(0);
    for (const p of [0, 0.31, 0.49, 0.65, 1])
      expect(landingFraming(p, 390 / 844).shift).toBeCloseTo(0);
    const aspect = 16 / 9,
      f = landingFraming(0, aspect),
      camera = new PerspectiveCamera(38, aspect, 0.1, 80);
    camera.position.set(...f.camera);
    camera.lookAt(new Vector3(...f.lookAt));
    camera.setViewOffset(aspect, 1, (-f.shift * aspect) / 2, 0, aspect, 1);
    camera.updateMatrixWorld();
    const points = [-2.225, 2.225].flatMap((x) =>
      [-2.525, 2.525].map(
        (z) =>
          new Vector3(x, -0.02, z).multiplyScalar(f.scale).project(camera).x,
      ),
    );
    expect(Math.max(...points) - Math.min(...points)).toBeGreaterThan(1.15);
    expect((Math.max(...points) + Math.min(...points)) / 2).toBeGreaterThan(
      0.2,
    );
  });
  it('bounds the backing buffer without shrinking the full CSS stage or disabling motion', () => {
    for (const [w, h] of [
      [320, 568],
      [1920, 1080],
      [3840, 2160],
      [7680, 4320],
      [800, 10000],
    ]) {
      for (const device of [0, NaN, 1, 1.5, 2, 3]) {
        const ratio = landingPixelRatio(w!, h!, device);
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThanOrEqual(1.5);
        expect(w! * h! * ratio * ratio).toBeLessThanOrEqual(2_000_000.001);
      }
    }
    expect(Number.isFinite(landingPixelRatio(NaN, 0, Infinity))).toBe(true);
  });
});

describe('purposeful authored furniture travel', () => {
  it('starts with two pieces, continuously assembles the first chapter and retraces on reverse', () => {
    for (const item of landingFurniture) {
      expect(landingFurnitureAssembly(item.key, 0)).toBe(
        item.key === 'bed' || item.key === 'bedside' ? 1 : 0,
      );
      expect(landingFurnitureAssembly(item.key, 0.495)).toBe(1);
      expect(landingFurnitureAssembly(item.key, NaN)).toBe(
        landingFurnitureAssembly(item.key, 0),
      );
      let previous = landingFurnitureAssembly(item.key, 0);
      const forward = [];
      for (let step = 0; step <= 1000; step++) {
        const amount = landingFurnitureAssembly(item.key, step / 1000);
        expect(amount).toBeGreaterThanOrEqual(previous);
        expect(amount).toBeLessThanOrEqual(1);
        expect(amount - previous).toBeLessThan(0.04);
        forward.push(amount);
        previous = amount;
      }
      for (let step = 1000; step >= 0; step--)
        expect(landingFurnitureAssembly(item.key, step / 1000)).toBe(
          forward[step],
        );
    }
    expect(landingFurnitureAssembly('shelf', 0.43)).toBeGreaterThan(0);
    expect(landingFurnitureAssembly('desk', 0.42)).toBe(0);
    expect(landingFurnitureAssembly('chair', 0.44)).toBe(0);
  });
  function footprint(
    piece: (typeof landingFurniture)[number],
    progress: number,
  ) {
    const pose = landingFurniturePose(piece.key, progress),
      c = Math.abs(Math.cos(pose.turn)),
      s = Math.abs(Math.sin(pose.turn)),
      x = pose.position[0],
      z = pose.position[2],
      hx = (piece.size.width * c + piece.size.depth * s) / 2000,
      hz = (piece.size.width * s + piece.size.depth * c) / 2000;
    return { left: x - hx, right: x + hx, top: z - hz, bottom: z + hz };
  }
  it('stays grounded, inside the room and clear of other pieces throughout the staged moves', () => {
    const previous = landingFurniture.map((piece) =>
      landingFurniturePose(piece.key, 0),
    );
    for (let i = 0; i <= 1000; i++) {
      const progress = i / 1000;
      const boxes = landingFurniture.map((piece, index) => {
        const pose = landingFurniturePose(piece.key, progress),
          prior = previous[index]!;
        expect(pose.position[1]).toBe(0);
        pose.position.forEach((n, k) => {
          expect(Number.isFinite(n)).toBe(true);
          expect(Math.abs(n - prior.position[k]!)).toBeLessThan(0.08);
        });
        expect(Math.abs(pose.turn - prior.turn)).toBeLessThan(0.08);
        previous[index] = pose;
        const b = footprint(piece, progress);
        expect(b.left, `${piece.key} at ${progress}`).toBeGreaterThanOrEqual(
          -2.2,
        );
        expect(b.right, `${piece.key} at ${progress}`).toBeLessThanOrEqual(2.2);
        expect(b.top, `${piece.key} at ${progress}`).toBeGreaterThanOrEqual(
          -2.45,
        );
        expect(b.bottom, `${piece.key} at ${progress}`).toBeLessThanOrEqual(
          2.45,
        );
        return b;
      });
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) {
          const x = boxes[a]!,
            y = boxes[b]!;
          expect(
            x.right <= y.left ||
              y.right <= x.left ||
              x.bottom <= y.top ||
              y.bottom <= x.top,
            `${landingFurniture[a]!.key}/${landingFurniture[b]!.key} at ${progress}`,
          ).toBe(true);
        }
    }
  });
  it('moves the desk toward the window, opens the center and visibly rotates the resting pieces', () => {
    const before = landingFurniturePose('desk', 0),
      after = landingFurniturePose('desk', 1);
    const windowDistance = (p: typeof before) =>
      Math.hypot(p.position[0] - 0.95, p.position[2] + 2.45);
    expect(windowDistance(before) - windowDistance(after)).toBeGreaterThan(3);
    const bed = landingFurniture.find((p) => p.key === 'bed')!;
    const start = footprint(bed, 0),
      end = footprint(bed, 1);
    expect(
      start.left < 0 && start.right > 0 && start.top < 0 && start.bottom > 0,
    ).toBe(true);
    expect(end.right).toBeLessThan(0);
    for (const key of ['bed', 'desk', 'chair', 'shelf'] as const)
      expect(
        Math.abs(
          landingFurniturePose(key, 1).turn - landingFurniturePose(key, 0).turn,
        ),
      ).toBeGreaterThan(1);
    expect(landingFurniturePose('bed', NaN)).toEqual(
      landingFurniturePose('bed', 0),
    );
  });
});
