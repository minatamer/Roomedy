import { POLICY } from '@roomedy/contracts/policy';
import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { snapPosition } from '../plan-view/adapter';

type Vector = { x: number; y: number; z: number };
export type FloorPoint = { x: number; z: number };
export type FloorRay = { origin: Vector; direction: Vector };
export type FloorResult = ReturnType<SessionController['dispatch']>;
export interface FloorEdit {
  readonly item: Furniture;
  readonly room: RoomDocument;
  current: () => boolean;
  cancel: () => void;
  commit: (point: FloorPoint) => FloorResult;
}
const withinCoordinates = (p: FloorPoint) =>
  Number.isFinite(p.x) &&
  Number.isFinite(p.z) &&
  Math.abs(p.x) <= POLICY.coordinateAbsMm &&
  Math.abs(p.z) <= POLICY.coordinateAbsMm;

/** Actual perspective ray → floor Y0 → semantic mm; never use decorative mesh bounds. */
export function pointOnFloor(ray: FloorRay): FloorPoint | null {
  if (
    ![
      ray.origin.x,
      ray.origin.y,
      ray.origin.z,
      ray.direction.x,
      ray.direction.y,
      ray.direction.z,
    ].every(Number.isFinite) ||
    Math.abs(ray.direction.y) < 1e-8
  )
    return null;
  const t = -ray.origin.y / ray.direction.y;
  if (t < 0 || !Number.isFinite(t)) return null;
  const point = {
    x: (ray.origin.x + ray.direction.x * t) * 1000,
    z: (ray.origin.z + ray.direction.z * t) * 1000,
  };
  return withinCoordinates(point) ? point : null;
}
export function floorPlacement(
  room: RoomDocument,
  item: Furniture,
  ray: FloorRay,
  offset: FloorPoint,
  snap: boolean,
): FloorPoint | null {
  const point = pointOnFloor(ray);
  if (!point) return null;
  const raw = { x: point.x - offset.x, z: point.z - offset.z };
  return withinCoordinates(raw) ? snapPosition(room, item, raw, snap) : null;
}
function editable(state: SessionSnapshot) {
  return (
    state.phase === 'editor' &&
    state.workspace &&
    state.comparison === 'current' &&
    !state.candidate &&
    !state.clientLoadFailure
  );
}
/** Shared gesture lifetime only; callers still select their target and command kind. */
export function beginRoomEdit(
  controller: SessionController,
  id: string,
  onRetire: () => void = () => {},
) {
  if (!controller.canEdit()) return null;
  const snapshot = controller.getSnapshot(),
    workspace = snapshot.workspace;
  if (
    !workspace ||
    !editable(snapshot) ||
    snapshot.presentation.selectedId !== id
  )
    return null;
  const view = snapshot.presentation.roomView;
  let live = true,
    unsubscribe = () => {},
    release: (() => void) | null = null;
  const sameContext = () => {
    const state = controller.getSnapshot();
    return (
      !!editable(state) &&
      state.workspace === workspace &&
      state.presentation.selectedId === id &&
      state.presentation.roomView === view
    );
  };
  const retire = () => {
    if (!live) return;
    live = false;
    unsubscribe();
    onRetire();
  };
  const cancel = () => {
    if (release) release();
    else retire();
  };
  unsubscribe = controller.subscribe(() => {
    if (!sameContext()) cancel();
  });
  release = controller.ownResource(retire);
  if (!release || !live) {
    unsubscribe();
    return null;
  }
  const current = () => live && controller.canEdit() && sameContext();
  return {
    room: workspace.current,
    current,
    cancel,
    finish() {
      if (!current()) {
        cancel();
        return false;
      }
      cancel();
      // Cleanup can synchronously replace/expire the room; fence before dispatch.
      return controller.canEdit() && sameContext();
    },
  };
}
/** One live floor gesture, restricted to the main3D view. */
export function beginFloorEdit(
  controller: SessionController,
  id: string,
  onRetire: () => void = () => {},
): FloorEdit | null {
  const snapshot = controller.getSnapshot();
  const item = snapshot.workspace?.current.furniture.find((p) => p.id === id);
  if (!item || snapshot.presentation.roomView !== 'cutaway') return null;
  const edit = beginRoomEdit(controller, id, onRetire);
  if (!edit) return null;
  return {
    item,
    room: edit.room,
    current: edit.current,
    cancel: edit.cancel,
    commit(point) {
      if (!edit.finish()) return { ok: false, code: 'stale' };
      if (point.x === item.pose.centerX && point.z === item.pose.centerZ)
        return { ok: true, changed: false };
      return controller.dispatch(
        [
          {
            type: 'move',
            id,
            pose: {
              centerX: point.x,
              centerZ: point.z,
              quarterTurns: item.pose.quarterTurns,
            },
          },
        ],
        'Move piece',
      );
    },
  };
}
export function rotateFloorSelection(
  controller: SessionController,
): FloorResult {
  if (!controller.canEdit()) return { ok: false, code: 'stale' };
  const state = controller.getSnapshot();
  if (!editable(state) || state.presentation.roomView !== 'cutaway')
    return { ok: false, code: 'stale' };
  const item = state.workspace!.current.furniture.find(
    (p) => p.id === state.presentation.selectedId,
  );
  if (!item) return { ok: false, code: 'invalid-input' };
  return controller.dispatch(
    [
      {
        type: 'rotate',
        id: item.id,
        quarterTurns: ((item.pose.quarterTurns + 1) % 4) as 0 | 1 | 2 | 3,
      },
    ],
    'Rotate piece',
  );
}
