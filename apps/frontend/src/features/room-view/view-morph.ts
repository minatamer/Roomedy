import { Matrix4, Quaternion, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import type { CameraView } from './adapter';
import type { PlanBox } from '../plan-view/adapter';

export type RoomView = 'plan' | 'cutaway';
export const VIEW_MORPH_MS = 520;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};

/** One reversible finite clock; camera travel precedes the aligned dissolve. */
export class ViewTimeline {
  amount = 1;
  revision = 0;
  private flight: {
    from: number;
    to: number;
    at: number;
    duration: number;
  } | null = null;
  get moving() {
    return this.flight !== null;
  }
  sample(now: number) {
    const f = this.flight;
    if (!f || !Number.isFinite(now)) return this.amount;
    const p = clamp((now - f.at) / f.duration);
    this.amount = f.from + (f.to - f.from) * p;
    if (p === 1) {
      this.amount = f.to;
      this.flight = null;
    }
    return this.amount;
  }
  request(view: RoomView, now: number) {
    if (!Number.isFinite(now)) return this.revision;
    this.sample(now);
    const to = view === 'plan' ? 1 : 0;
    this.revision++;
    this.flight =
      this.amount === to
        ? null
        : {
            from: this.amount,
            to,
            at: now,
            duration: VIEW_MORPH_MS * Math.abs(to - this.amount),
          };
    return this.revision;
  }
  cancel(now: number) {
    this.sample(now);
    this.flight = null;
    this.revision++;
  }
  snap(view: RoomView) {
    this.flight = null;
    this.amount = view === 'plan' ? 1 : 0;
    this.revision++;
  }
}
export function viewMorphFrame(amount: number) {
  const a = Number.isFinite(amount) ? clamp(amount) : 1;
  const camera = smooth(a / 0.7),
    plan = smooth((a - 0.7) / 0.3);
  return { camera, plan, cutaway: 1 - plan };
}
export function overheadFrame(
  box: PlanBox,
  size: { width: number; height: number },
  roomHeight: number,
) {
  if (
    ![
      box.x,
      box.z,
      box.width,
      box.depth,
      size.width,
      size.height,
      roomHeight,
    ].every(Number.isFinite) ||
    box.width <= 0 ||
    box.depth <= 0 ||
    size.width <= 0 ||
    size.height <= 0
  )
    return null;
  const aspect = size.width / size.height;
  const height = Math.max(box.depth / 1000, box.width / 1000 / aspect);
  return {
    x: (box.x + box.width / 2) / 1000,
    z: (box.z + box.depth / 2) / 1000,
    width: height * aspect,
    height,
    lift: Math.max(20, height, height * aspect, roomHeight + 4),
  };
}
/** Mutable animation resources live behind methods, outside React-owned state. */
export class ViewBridge {
  readonly timeline = new ViewTimeline();
  box: PlanBox = { x: -500, z: -500, width: 5200, depth: 5800 };
  private invalidator = () => {};
  private painter = (_amount: number) => {};
  private settled = () => {};
  private alive = false;
  private reported = -1;
  constructor(readonly workspaceId?: string) {}
  get live() {
    return this.alive;
  }
  invalidate() {
    if (this.alive) this.invalidator();
  }
  updateBox(box: PlanBox) {
    this.box = { ...box };
    this.invalidate();
  }
  attachInvalidator(callback: () => void) {
    this.invalidator = callback;
    return () => {
      if (this.invalidator === callback) this.invalidator = () => {};
    };
  }
  connect(painter: (amount: number) => void, settled: () => void) {
    this.alive = true;
    this.painter = painter;
    this.settled = settled;
    this.paint(1);
  }
  paint(amount: number) {
    if (this.alive) this.painter(amount);
  }
  onFrame(amount: number) {
    if (!this.alive) return;
    this.paint(amount);
    if (
      !this.timeline.moving &&
      amount === this.timeline.amount &&
      this.reported !== this.timeline.revision
    ) {
      this.reported = this.timeline.revision;
      this.settled();
    }
  }
  dispose(now: number) {
    this.alive = false;
    this.timeline.cancel(now);
    this.painter = () => {};
    this.settled = () => {};
    this.invalidator = () => {};
  }
}
const overheadQuaternion = new Quaternion().setFromAxisAngle(
  new Vector3(1, 0, 0),
  -Math.PI / 2,
);
const overheadUp = new Vector3(0, 0, -1);
export function captureViewCamera(
  camera: PerspectiveCamera,
  target: Vector3,
  view: CameraView,
  fit: number,
) {
  return {
    camera: camera.clone(),
    target: target.clone(),
    zoom: camera.zoom / (view === 'overview' ? fit : 1),
    view,
    perspective: new Matrix4(),
    orthographic: new Matrix4(),
    focus: new Vector3(),
  };
}
export type SavedViewCamera = ReturnType<typeof captureViewCamera>;
/** Homogeneous projection blend keeps focus-plane scale steady while perspective flattens. */
export function applyViewCamera(
  camera: PerspectiveCamera,
  target: Vector3,
  saved: SavedViewCamera,
  amount: number,
  box: PlanBox,
  size: { width: number; height: number },
  roomHeight: number,
) {
  const frame = overheadFrame(box, size, roomHeight);
  if (!frame) return null;
  const mix = viewMorphFrame(amount).camera;
  const base = saved.camera;
  base.aspect = size.width / size.height;
  base.zoom =
    saved.zoom * (saved.view === 'overview' ? Math.min(1, base.aspect) : 1);
  base.updateProjectionMatrix();
  camera.zoom = base.zoom;
  camera.aspect = base.aspect;
  camera.near = base.near;
  camera.far =
    mix === 0 ? base.far : Math.max(base.far, frame.lift + roomHeight + 10);
  saved.focus.set(frame.x, 0, frame.z);
  camera.quaternion.copy(base.quaternion).slerp(overheadQuaternion, mix);
  camera.up.copy(base.up).lerp(overheadUp, mix).normalize();
  target.copy(saved.target).lerp(saved.focus, mix);
  const baseDistance = base.position.distanceTo(saved.target);
  if (mix === 0) camera.position.copy(base.position);
  else
    camera.position
      .set(0, 0, 1)
      .applyQuaternion(camera.quaternion)
      .multiplyScalar(baseDistance + (frame.lift - baseDistance) * mix)
      .add(target);
  if (mix === 0) camera.projectionMatrix.copy(base.projectionMatrix);
  else {
    const fromHeight =
      (Math.tan((base.fov * Math.PI) / 360) * baseDistance) / base.zoom;
    const halfHeight = fromHeight + (frame.height / 2 - fromHeight) * mix;
    const halfWidth = halfHeight * base.aspect;
    const distance = Math.max(0.05, camera.position.distanceTo(target));
    const nearHeight = (halfHeight * camera.near) / distance,
      nearWidth = (halfWidth * camera.near) / distance;
    saved.perspective.makePerspective(
      -nearWidth,
      nearWidth,
      nearHeight,
      -nearHeight,
      camera.near,
      camera.far,
    );
    saved.orthographic.makeOrthographic(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      camera.near,
      camera.far,
    );
    for (let i = 0; i < 16; i++)
      camera.projectionMatrix.elements[i] =
        (saved.perspective.elements[i]! / distance) * (1 - mix) +
        saved.orthographic.elements[i]! * mix;
  }
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld();
  return frame;
}
