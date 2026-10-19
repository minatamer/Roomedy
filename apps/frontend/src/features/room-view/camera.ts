import type { RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry, footprint, localFront } from '@roomedy/spatial';
import { cameraFrameMetres, displayRoom, featureBox, metres } from './adapter';
import type { CameraPose, CameraView, Triple } from './adapter';
import type { RoomFrame } from '../session/state';

// Camera navigation is presentation only, never a furniture fit/measurement rule.
const padding = 0.18;
const steps = 24;
type Rect = { left: number; right: number; top: number; bottom: number };
function navigation(room: RoomDocument) {
  const bounds = displayRoom(room);
  const obstacles: Rect[] = [];
  for (const piece of room.furniture) {
    const box = footprint(piece);
    if (box)
      obstacles.push({
        left: metres(box.minX) - padding,
        right: metres(box.maxX) + padding,
        top: metres(box.minZ) - padding,
        bottom: metres(box.maxZ) + padding,
      });
  }
  for (const feature of room.room.features) {
    if (feature.kind !== 'obstacle') continue;
    const box = featureBox(room, feature);
    if (box)
      obstacles.push({
        left: box.center[0] - box.size[0] / 2 - padding,
        right: box.center[0] + box.size[0] / 2 + padding,
        top: box.center[2] - box.size[2] / 2 - padding,
        bottom: box.center[2] + box.size[2] / 2 + padding,
      });
  }
  const free = (p: Triple) =>
    p.every(Number.isFinite) &&
    bounds.width >= 0.6 &&
    bounds.depth >= 0.6 &&
    bounds.height >= 0.8 &&
    p[0] >= padding &&
    p[0] <= bounds.width - padding &&
    p[2] >= padding &&
    p[2] <= bounds.depth - padding &&
    p[1] >= 0.15 &&
    p[1] <= bounds.height - 0.12 &&
    !obstacles.some(
      (b) =>
        p[0] >= b.left && p[0] <= b.right && p[2] >= b.top && p[2] <= b.bottom,
    );
  const clear = (a: Triple, b: Triple) =>
    !obstacles.some((box) => {
      let enter = 0,
        leave = 1;
      for (const [axis, low, high] of [
        [0, box.left, box.right],
        [2, box.top, box.bottom],
      ] as const) {
        const delta = b[axis] - a[axis];
        if (Math.abs(delta) < 1e-10) {
          if (a[axis] < low || a[axis] > high) return false;
        } else {
          const x = (low - a[axis]) / delta,
            y = (high - a[axis]) / delta;
          enter = Math.max(enter, Math.min(x, y));
          leave = Math.min(leave, Math.max(x, y));
          if (enter > leave) return false;
        }
      }
      return enter <= leave;
    });
  return { bounds, free, clear };
}
export function cameraPositionAllowed(room: RoomDocument, point: Triple) {
  return navigation(room).free(point);
}
export function cameraViewPose(
  room: RoomDocument,
  view: CameraView,
  frame?: RoomFrame,
): CameraPose | null {
  const nav = navigation(room),
    { bounds } = nav;
  if (view === 'overview') {
    const b = frame ? cameraFrameMetres(frame) : bounds;
    const span = Math.hypot(b.width, b.depth, b.height);
    const target: Triple = [b.width / 2, b.height * 0.28, b.depth / 2];
    return {
      position: [
        target[0] + span * 0.55,
        target[1] + span * 0.75,
        target[2] + span * 0.8,
      ],
      target,
      zoom: 1,
      view,
    };
  }
  const eye = Math.min(1.6, bounds.height - 0.25);
  let preferred: Triple = [0.45, eye, bounds.depth - 0.45];
  let target: Triple = [
    bounds.width / 2,
    Math.min(1.35, eye),
    bounds.depth / 2,
  ];
  if (view === 'doorway') {
    const door = room.room.features.find(
      (f) => f.kind === 'door' && f.wall !== 'unknown',
    );
    if (!door) return null;
    const u = metres((door.offset.value ?? 0) + (door.width.value ?? 900) / 2);
    preferred =
      door.wall === 'north'
        ? [u, eye, 0.4]
        : door.wall === 'south'
          ? [u, eye, bounds.depth - 0.4]
          : door.wall === 'west'
            ? [0.4, eye, u]
            : [bounds.width - 0.4, eye, u];
  }
  if (view === 'work-area') {
    const desk = room.furniture.find(
      (p) =>
        findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
        'desk',
    );
    if (!desk) return null;
    const front = localFront(desk.pose.quarterTurns),
      reach = metres((desk.dimensions.depth.value ?? 600) / 2) + 0.85;
    preferred = [
      metres(desk.pose.centerX) + front[0] * reach,
      eye,
      metres(desk.pose.centerZ) + front[1] * reach,
    ];
    target = [
      metres(desk.pose.centerX),
      Math.min(
        bounds.height - 0.2,
        metres(desk.dimensions.height.value ?? 800),
      ),
      metres(desk.pose.centerZ),
    ];
  }
  const clamp = (v: number, max: number) =>
    Math.max(padding, Math.min(max - padding, v));
  preferred = [
    clamp(preferred[0], bounds.width),
    eye,
    clamp(preferred[2], bounds.depth),
  ];
  let chosen: Triple | null = nav.free(preferred) ? preferred : null,
    best = Infinity;
  if (!chosen)
    for (let z = 0; z <= steps; z++)
      for (let x = 0; x <= steps; x++) {
        const point: Triple = [
          padding + ((bounds.width - padding * 2) * x) / steps,
          eye,
          padding + ((bounds.depth - padding * 2) * z) / steps,
        ];
        const distance =
          (point[0] - preferred[0]) ** 2 + (point[2] - preferred[2]) ** 2;
        if (distance < best && nav.free(point)) {
          chosen = point;
          best = distance;
        }
      }
  return chosen ? { position: chosen, target, zoom: 1, view } : null;
}
/** Clamp a deliberate eye-level step at the first obstacle; never jump over it. */
export function moveCamera(
  room: RoomDocument,
  from: Triple,
  wanted: Triple,
): Triple {
  const nav = navigation(room);
  if (!nav.free(from) || !wanted.every(Number.isFinite)) return [...from];
  const to: Triple = [
    Math.max(padding, Math.min(nav.bounds.width - padding, wanted[0])),
    from[1],
    Math.max(padding, Math.min(nav.bounds.depth - padding, wanted[2])),
  ];
  if (nav.clear(from, to)) return to;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 12; i++) {
    const t = (lo + hi) / 2,
      p: Triple = [
        from[0] + (to[0] - from[0]) * t,
        from[1],
        from[2] + (to[2] - from[2]) * t,
      ];
    if (nav.clear(from, p)) lo = t;
    else hi = t;
  }
  return [
    from[0] + (to[0] - from[0]) * lo,
    from[1],
    from[2] + (to[2] - from[2]) * lo,
  ];
}
/** Finite path through free floor cells; the open cutaway permits an overhead fallback. */
export function cameraJourney(
  room: RoomDocument,
  from: Triple,
  to: Triple,
  interior = true,
): Triple[] {
  if (!from.every(Number.isFinite) || !to.every(Number.isFinite)) return [];
  const nav = navigation(room),
    { bounds } = nav;
  const overhead = () => {
    const high =
      Math.max(
        bounds.height,
        ...room.furniture.map((p) =>
          metres(p.dimensions.height.value ?? bounds.height * 1000),
        ),
      ) + 0.6;
    return [[from[0], high, from[2]], [to[0], high, to[2]], to] as Triple[];
  };
  if (!interior) return nav.free(from) ? overhead() : [to];
  if (!nav.free(to)) return [];
  if (!nav.free(from)) return overhead();
  if (nav.clear(from, to)) return [to];
  const size = steps + 1,
    points: Triple[] = [],
    free: boolean[] = [];
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      const p: Triple = [
        padding + ((bounds.width - padding * 2) * x) / steps,
        to[1],
        padding + ((bounds.depth - padding * 2) * z) / steps,
      ];
      points.push(p);
      free.push(nav.free(p));
    }
  const connect = (p: Triple) =>
    points
      .map((q, id) => ({
        id,
        distance: (q[0] - p[0]) ** 2 + (q[2] - p[2]) ** 2,
      }))
      .sort((a, b) => a.distance - b.distance || a.id - b.id)
      .find((v) => free[v.id] && nav.clear(p, points[v.id]!))?.id;
  const start = connect(from),
    end = connect(to);
  if (start === undefined || end === undefined) return overhead();
  const previous = new Int32Array(points.length).fill(-1),
    queue = [start];
  previous[start] = start;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const at = queue[cursor]!;
    if (at === end) break;
    for (const next of [at - 1, at + 1, at - size, at + size]) {
      if (
        next < 0 ||
        next >= points.length ||
        previous[next] !== -1 ||
        !free[next]
      )
        continue;
      if (
        Math.abs((next % size) - (at % size)) +
          Math.abs(Math.floor(next / size) - Math.floor(at / size)) !==
        1
      )
        continue;
      if (!nav.clear(points[at]!, points[next]!)) continue;
      previous[next] = at;
      queue.push(next);
    }
  }
  if (previous[end] === -1) return overhead();
  const ids = [end];
  while (ids.at(-1) !== start) ids.push(previous[ids.at(-1)!]!);
  ids.reverse();
  const path: Triple[] = [];
  for (let i = 0; i < ids.length; i++) {
    const p = points[ids[i]!]!,
      before = i ? points[ids[i - 1]!]! : from,
      after = i + 1 < ids.length ? points[ids[i + 1]!]! : to;
    if (
      (p[0] - before[0]) * (after[2] - p[2]) !==
      (p[2] - before[2]) * (after[0] - p[0])
    )
      path.push(p);
  }
  path.push(to);
  return path;
}
