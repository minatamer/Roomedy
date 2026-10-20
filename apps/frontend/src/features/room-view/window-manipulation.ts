import type { Feature, RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { nearestClearDoorOffset } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { beginRoomEdit } from './manipulation';
import type { FloorRay, FloorResult } from './manipulation';
// Historical adapter name: both doors and windows share one wall gesture owner.
export type WindowFeature = Extract<Feature, { kind: 'window' | 'door' }>;
export type WindowPosition = { id: string; offset: number };
export function windowLimit(
  room: RoomDocument,
  feature: Feature,
): number | null {
  const edge =
    feature.wall === 'north' || feature.wall === 'south'
      ? room.room.width.value
      : feature.wall === 'east' || feature.wall === 'west'
        ? room.room.depth.value
        : null;
  if (
    feature.kind === 'obstacle' ||
    edge === null ||
    feature.width.value === null ||
    feature.offset.value === null ||
    feature.width.value > edge
  )
    return null;
  return edge - feature.width.value;
}
export function clampWindowOffset(
  room: RoomDocument,
  feature: Feature,
  raw: number,
  snap: boolean,
): number | null {
  const limit = windowLimit(room, feature);
  if (limit === null || !Number.isFinite(raw)) return null;
  const bounded = Math.max(0, Math.min(limit, raw));
  const nearestEnd = bounded <= limit - bounded ? 0 : limit;
  const value = snap
    ? Math.abs(nearestEnd - bounded) <= 40
      ? nearestEnd
      : Math.round(bounded / 50) * 50
    : Math.round(bounded);
  const offset = Math.max(0, Math.min(limit, value));
  return feature.kind === 'door'
    ? nearestClearDoorOffset(room, feature, offset)
    : offset;
}
/** Intersect the existing vertical wall; only its horizontal coordinate is edited. */
export function pointOnWindowWall(
  room: RoomDocument,
  feature: Feature,
  ray: FloorRay,
): number | null {
  if (
    windowLimit(room, feature) === null ||
    ![
      ray.origin.x,
      ray.origin.y,
      ray.origin.z,
      ray.direction.x,
      ray.direction.y,
      ray.direction.z,
    ].every(Number.isFinite)
  )
    return null;
  const alongX = feature.wall === 'north' || feature.wall === 'south';
  const axis = alongX ? 'z' : 'x';
  const wall =
    feature.wall === 'south'
      ? room.room.depth.value
      : feature.wall === 'east'
        ? room.room.width.value
        : 0;
  if (wall === null || Math.abs(ray.direction[axis]) < 1e-8) return null;
  const distance = (wall / 1000 - ray.origin[axis]) / ray.direction[axis];
  if (!Number.isFinite(distance) || distance < 0) return null;
  const along = alongX ? 'x' : 'z';
  const point = (ray.origin[along] + ray.direction[along] * distance) * 1000;
  return Number.isFinite(point) && Math.abs(point) <= POLICY.coordinateAbsMm
    ? point
    : null;
}
export function windowPlacement(
  room: RoomDocument,
  feature: Feature,
  ray: FloorRay,
  grab: number,
  snap: boolean,
) {
  const point = pointOnWindowWall(room, feature, ray);
  return point === null
    ? null
    : clampWindowOffset(room, feature, point - grab, snap);
}
export function nudgeWindowOffset(
  room: RoomDocument,
  feature: Feature,
  key: string,
  shift = false,
  alt = false,
) {
  const horizontal = feature.wall === 'north' || feature.wall === 'south';
  const change =
    key === (horizontal ? 'ArrowLeft' : 'ArrowUp')
      ? -1
      : key === (horizontal ? 'ArrowRight' : 'ArrowDown')
        ? 1
        : 0;
  return clampWindowOffset(
    room,
    feature,
    (feature.offset.value ?? 0) + change * (alt ? 1 : shift ? 100 : 10),
    false,
  );
}
export function roomWithWindowPreview(
  room: RoomDocument,
  preview: WindowPosition | null,
): RoomDocument {
  if (!preview) return room;
  return {
    ...room,
    room: {
      ...room.room,
      features: room.room.features.map((feature) =>
        feature.kind !== 'obstacle' && feature.id === preview.id
          ? {
              ...feature,
              offset: {
                status: 'estimated',
                value: preview.offset,
                sourceId: 'visitor-planned',
              },
            }
          : feature,
      ),
    },
  };
}
export interface WindowEdit {
  readonly feature: WindowFeature;
  readonly room: RoomDocument;
  current: () => boolean;
  cancel: () => void;
  commit: (offset: number) => FloorResult;
}
export function beginWindowEdit(
  controller: SessionController,
  id: string,
  onRetire: () => void = () => {},
): WindowEdit | null {
  const room = controller.getSnapshot().workspace?.current;
  const feature = room?.room.features.find((f) => f.id === id);
  if (
    !room ||
    !feature ||
    feature.kind === 'obstacle' ||
    windowLimit(room, feature) === null
  )
    return null;
  const edit = beginRoomEdit(controller, id, onRetire);
  if (!edit) return null;
  return {
    feature,
    room,
    current: edit.current,
    cancel: edit.cancel,
    commit(offset) {
      if (!edit.finish()) return { ok: false, code: 'stale' };
      const limit = windowLimit(room, feature);
      if (
        limit === null ||
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset > limit
      )
        return { ok: false, code: 'invalid-input' };
      if (offset === feature.offset.value) return { ok: true, changed: false };
      return controller.dispatch(
        [
          {
            type: 'update-feature',
            id,
            feature: {
              ...feature,
              offset: {
                value: offset,
                status: 'estimated',
                sourceId: 'visitor-planned',
              },
            },
          },
        ],
        feature.kind === 'door' ? 'Move door' : 'Move window',
      );
    },
  };
}

/** Bounded demand-frame movement for command/Undo; direct dragging displays its exact preview. */
export function advanceWindowOffset(
  current: number,
  target: number,
  delta: number,
) {
  return Math.abs(target - current) <= 0.5
    ? target
    : current +
        (target - current) *
          (1 - Math.exp(-Math.max(0, Math.min(delta, 0.05)) * 16));
}

/** Keep canonical identity separate from an interpolated display projection. */
export function windowDragTarget(room: RoomDocument, displayed: Feature) {
  const feature = room.room.features.find((f) => f.id === displayed.id);
  if (
    !feature ||
    feature.kind === 'obstacle' ||
    displayed.kind !== feature.kind ||
    displayed.offset.value === null
  )
    return null;
  return { feature, offset: displayed.offset.value };
}
