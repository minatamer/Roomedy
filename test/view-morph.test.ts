import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  applyViewCamera,
  captureViewCamera,
  overheadFrame,
  ViewTimeline,
  ViewBridge,
  VIEW_MORPH_MS,
  viewMorphFrame,
} from '../apps/frontend/src/features/room-view/view-morph.js';
const uiRequire = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const threeUrl = new URL(
  './three.module.js',
  pathToFileURL(uiRequire.resolve('three')),
);
const { PerspectiveCamera, Vector3 } = (await import(threeUrl.href)) as {
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => Parameters<typeof captureViewCamera>[0];
  Vector3: new (
    x?: number,
    y?: number,
    z?: number,
  ) => Parameters<typeof captureViewCamera>[1];
};
function setup(width = 640, height = 600, inside = false) {
  const camera = new PerspectiveCamera(50, width / height, 0.05, 200);
  const target = new Vector3(2.1, inside ? 1.35 : 0.7, 2.4);
  camera.position.set(
    ...((inside ? [2.1, 1.6, 4.3] : [7, 7, 9]) as [number, number, number]),
  );
  camera.zoom = inside ? 1 : Math.min(1, width / height);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return {
    camera,
    target,
    saved: captureViewCamera(
      camera,
      target,
      inside ? 'doorway' : 'overview',
      Math.min(1, width / height),
    ),
    size: { width, height },
  };
}
const box = { x: -500, z: -500, width: 5200, depth: 5800 };
describe('room-view transition clock', () => {
  it('reports a rendered endpoint once and ignores retired frame callbacks', () => {
    const bridge = new ViewBridge('first');
    const frames: number[] = [];
    let settled = 0,
      invalidates = 0;
    bridge.connect(
      (amount) => frames.push(amount),
      () => {
        settled++;
      },
    );
    bridge.attachInvalidator(() => {
      invalidates++;
    });
    bridge.timeline.request('cutaway', 0);
    bridge.timeline.sample(520);
    bridge.onFrame(0);
    bridge.onFrame(0);
    expect(settled).toBe(1);
    expect(frames).toEqual([1, 0, 0]);
    bridge.dispose(520);
    bridge.onFrame(1);
    bridge.invalidate();
    expect(frames).toEqual([1, 0, 0]);
    expect(invalidates).toBe(0);
    expect(bridge.live).toBe(false);
  });
  it('does not let stale canvas cleanup detach the current invalidator', () => {
    const bridge = new ViewBridge();
    let first = 0,
      second = 0;
    bridge.connect(
      () => {},
      () => {},
    );
    const old = bridge.attachInvalidator(() => {
      first++;
    });
    const current = bridge.attachInvalidator(() => {
      second++;
    });
    old();
    bridge.invalidate();
    expect(first).toBe(0);
    expect(second).toBe(1);
    current();
    bridge.invalidate();
    expect(second).toBe(1);
    const revision = bridge.timeline.revision;
    bridge.timeline.request('cutaway', NaN);
    expect(bridge.timeline.revision).toBe(revision);
  });
  it('travels quickly then blends only while exactly overhead', () => {
    expect(VIEW_MORPH_MS).toBe(520);
    expect(viewMorphFrame(0)).toEqual({ camera: 0, plan: 0, cutaway: 1 });
    expect(viewMorphFrame(0.7)).toEqual({ camera: 1, plan: 0, cutaway: 1 });
    expect(viewMorphFrame(0.85).plan).toBeCloseTo(0.5);
    expect(viewMorphFrame(1)).toEqual({ camera: 1, plan: 1, cutaway: 0 });
    expect(viewMorphFrame(NaN).plan).toBe(1);
  });
  it('reverses continuously and retires each finite request', () => {
    const t = new ViewTimeline();
    t.request('cutaway', 0);
    expect(t.sample(260)).toBeCloseTo(0.5);
    const revision = t.request('plan', 260);
    expect(t.amount).toBeCloseTo(0.5);
    expect(t.sample(390)).toBeCloseTo(0.75);
    expect(t.sample(520)).toBe(1);
    expect(t.moving).toBe(false);
    expect(t.revision).toBe(revision);
    t.request('plan', 600);
    expect(t.moving).toBe(false);
  });
  it('cancels stale owners and snaps lifecycle changes without a running clock', () => {
    const t = new ViewTimeline();
    t.request('cutaway', 0);
    const revision = t.revision;
    t.cancel(100);
    const stopped = t.amount;
    expect(t.revision).toBeGreaterThan(revision);
    expect(t.moving).toBe(false);
    expect(t.sample(10000)).toBe(stopped);
    t.snap('cutaway');
    expect(t.amount).toBe(0);
    expect(t.moving).toBe(false);
    t.snap('plan');
    expect(t.amount).toBe(1);
  });
});
describe('actual camera projection for SVG alignment', () => {
  it.each([
    [640, 600, 1, 0, 0],
    [320, 568, 1, 0, 0],
    [1280, 568, 0.6, 700, -800],
    [760, 260, 3, -1200, 900],
    [390, 844, 1.8, 340, 500],
    [1400, 900, 0.8, -500, 1300],
  ])(
    'matches plan letterboxing at %s×%s, zoom %s',
    (width, height, zoom, panX, panZ) => {
      const { camera, target, saved, size } = setup(width, height);
      const b = {
        x: 2100 - 2600 / zoom + panX,
        z: 2400 - 2900 / zoom + panZ,
        width: 5200 / zoom,
        depth: 5800 / zoom,
      };
      applyViewCamera(camera, target, saved, 1, b, size, 2.6);
      const scale = Math.min(width / b.width, height / b.depth);
      for (const [x, z] of [
        [0, 0],
        [4200, 0],
        [4200, 4800],
        [0, 4800],
        [1800, 2000],
      ]) {
        const p = new Vector3(x! / 1000, 0, z! / 1000).project(camera);
        expect(((p.x + 1) * width) / 2).toBeCloseTo(
          (x! - b.x) * scale + (width - b.width * scale) / 2,
          8,
        );
        expect(((1 - p.y) * height) / 2).toBeCloseTo(
          (z! - b.z) * scale + (height - b.depth * scale) / 2,
          8,
        );
      }
    },
  );
  it('keeps north up and exact footprint scale independent of furniture height', () => {
    const { camera, target, saved, size } = setup();
    applyViewCamera(camera, target, saved, 1, box, size, 2.6);
    const floor = new Vector3(1, 0, 1).project(camera),
      top = new Vector3(1, 2, 1).project(camera);
    expect(top.x).toBeCloseTo(floor.x, 12);
    expect(top.y).toBeCloseTo(floor.y, 12);
    expect(new Vector3(1, 0, 0).project(camera).y).toBeGreaterThan(
      new Vector3(1, 0, 4).project(camera).y,
    );
    expect(new Vector3(4, 0, 1).project(camera).x).toBeGreaterThan(floor.x);
  });
  it('restores the exact prior pose, up vector, zoom and perspective after reversing', () => {
    const { camera, target, saved, size } = setup(390, 844, true);
    const before = {
      position: camera.position.toArray(),
      q: camera.quaternion.toArray(),
      up: camera.up.toArray(),
      projection: [...camera.projectionMatrix.elements],
      target: target.toArray(),
      zoom: camera.zoom,
    };
    applyViewCamera(camera, target, saved, 1, box, size, 2.6);
    applyViewCamera(camera, target, saved, 0, box, size, 2.6);
    expect(camera.position.toArray()).toEqual(before.position);
    expect(camera.quaternion.toArray()).toEqual(before.q);
    expect(camera.up.toArray()).toEqual(before.up);
    expect(target.toArray()).toEqual(before.target);
    expect(camera.zoom).toBe(before.zoom);
    expect(camera.projectionMatrix.elements).toEqual(before.projection);
  });
  it('keeps projection invertible and the focus centred throughout both directions', () => {
    const { camera, target, saved, size } = setup();
    for (const a of [
      ...Array.from({ length: 41 }, (_, i) => i / 40),
      ...Array.from({ length: 41 }, (_, i) => 1 - i / 40),
    ]) {
      applyViewCamera(camera, target, saved, a, box, size, 2.6);
      const focus = target.clone().project(camera);
      expect(focus.x).toBeCloseTo(0, 10);
      expect(focus.y).toBeCloseTo(0, 10);
      expect(camera.projectionMatrix.elements.every(Number.isFinite)).toBe(
        true,
      );
      const p = new Vector3(2, 0.5, 2),
        unprojected = p.clone().project(camera).unproject(camera);
      expect(unprojected.distanceTo(p)).toBeLessThan(1e-8);
    }
  });
  it('recomputes resize framing and refuses zero/invalid viewports', () => {
    const { camera, target, saved } = setup();
    expect(
      applyViewCamera(
        camera,
        target,
        saved,
        1,
        box,
        { width: 0, height: 0 },
        2.6,
      ),
    ).toBeNull();
    expect(
      overheadFrame({ ...box, width: NaN }, { width: 500, height: 500 }, 2.6),
    ).toBeNull();
    for (const size of [
      { width: 640, height: 600 },
      { width: 320, height: 568 },
      { width: 1280, height: 320 },
    ]) {
      applyViewCamera(camera, target, saved, 1, box, size, 2.6);
      const p = new Vector3(2.1, 0, 2.4).project(camera);
      expect(p.x).toBeCloseTo(0, 12);
      expect(p.y).toBeCloseTo(0, 12);
    }
  });
});
