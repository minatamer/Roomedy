import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Furniture } from '@roomedy/contracts/room';
import type { SessionController } from '../session/controller';
import { nudgePosition } from '../plan-view/adapter';
import { failureMessage } from '../room-editor/messages';
import {
  beginFloorEdit,
  floorPlacement,
  pointOnFloor,
  rotateFloorSelection,
} from './manipulation';
import type { FloorEdit, FloorPoint, FloorResult } from './manipulation';
import {
  beginWindowEdit,
  clampWindowOffset,
  nudgeWindowOffset,
  pointOnWindowWall,
  windowPlacement,
} from './window-manipulation';
import type {
  WindowEdit,
  WindowFeature,
  WindowPosition,
} from './window-manipulation';
type Pointer = ThreeEvent<PointerEvent>;
type CaptureTarget = {
  hasPointerCapture: (id: number) => boolean;
  setPointerCapture: (id: number) => void;
  releasePointerCapture: (id: number) => void;
};
function captures(
  target: EventTarget | null,
): target is EventTarget & CaptureTarget {
  return (
    !!target &&
    'hasPointerCapture' in target &&
    typeof target.hasPointerCapture === 'function' &&
    'setPointerCapture' in target &&
    typeof target.setPointerCapture === 'function' &&
    'releasePointerCapture' in target &&
    typeof target.releasePointerCapture === 'function'
  );
}
type Viewport = { left: number; top: number; width: number; height: number };
const sameViewport = (a: Viewport, b: Viewport) =>
  (['left', 'top', 'width', 'height'] as const).every(
    (key) => Math.abs(a[key] - b[key]) <= 1,
  );
export type MovingPose = { id: string; x: number; z: number };
type BaseGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  target: CaptureTarget;
  rect: Viewport;
};
type Gesture = BaseGesture &
  (
    | { kind: 'floor'; edit: FloorEdit; offset: FloorPoint }
    | { kind: 'window'; edit: WindowEdit; offset: number }
  );
/** One pointer/cancellation owner for floor pieces and same-wall windows. */
export function useFloorEdit(
  controller: SessionController,
  enabled: boolean,
  ready: boolean,
  snap: boolean,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  invalidate: () => void,
) {
  const gesture = useRef<Gesture | null>(null),
    pose = useRef<MovingPose | null>(null),
    dragging = useRef(false),
    windowPose = useRef<WindowPosition | null>(null);
  const [windowPreview, setWindowPreview] = useState<WindowPosition | null>(
    null,
  );
  const finish = useCallback(() => {
    const old = gesture.current;
    gesture.current = null;
    pose.current = null;
    dragging.current = false;
    if (old?.kind === 'window') {
      windowPose.current = null;
      setWindowPreview(null);
    }
    canvasRef.current?.style.removeProperty('cursor');
    invalidate();
    if (old?.target.hasPointerCapture(old.pointerId))
      old.target.releasePointerCapture(old.pointerId);
  }, [canvasRef, invalidate]);
  const cancel = useCallback(
    (announce = false) => {
      const old = gesture.current;
      if (!old) return;
      old.edit.cancel();
      if (announce) controller.notify('Move cancelled.');
    },
    [controller],
  );
  const begin = useCallback(
    (
      event: Pointer,
      item: Furniture | WindowFeature,
      displayed?: FloorPoint | number,
    ) => {
      const canvas = canvasRef.current,
        target = event.target;
      if (
        !enabled ||
        !canvas?.isConnected ||
        !captures(target) ||
        event.button !== 0 ||
        event.nativeEvent.isPrimary === false ||
        event.nativeEvent.defaultPrevented ||
        gesture.current
      )
        return;
      event.stopPropagation();
      controller.select(item.id);
      const base = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        target,
        rect: canvas.getBoundingClientRect(),
      };
      if ('catalogueId' in item) {
        if (item.locks.position) {
          controller.notify(
            'Position is locked. Unlock it in properties to move this piece.',
          );
          return;
        }
        const point = pointOnFloor(event.ray);
        if (!point) {
          controller.notify('Use Overview to place this piece on the floor.');
          return;
        }
        const edit = beginFloorEdit(controller, item.id, finish);
        if (!edit) return;
        if (edit.item !== item) {
          edit.cancel();
          return;
        }
        const initial =
          typeof displayed === 'object' &&
          displayed !== null &&
          Number.isFinite(displayed.x) &&
          Number.isFinite(displayed.z)
            ? displayed
            : { x: item.pose.centerX, z: item.pose.centerZ };
        gesture.current = {
          ...base,
          kind: 'floor',
          edit,
          offset: { x: point.x - initial.x, z: point.z - initial.z },
        };
        pose.current = { id: item.id, ...initial };
      } else {
        const room = controller.getSnapshot().workspace?.current;
        const point = room && pointOnWindowWall(room, item, event.ray);
        if (point === undefined || point === null) {
          controller.notify(
            'Review the window width, position and wall measurements before moving it.',
          );
          return;
        }
        const edit = beginWindowEdit(controller, item.id, finish);
        if (!edit) return;
        if (edit.feature !== item) {
          edit.cancel();
          return;
        }
        const initialOffset =
          typeof displayed === 'number' && Number.isFinite(displayed)
            ? displayed
            : item.offset.value!;
        gesture.current = {
          ...base,
          kind: 'window',
          edit,
          offset: point - initialOffset,
        };
        windowPose.current = { id: item.id, offset: initialOffset };
        setWindowPreview(windowPose.current);
      }
      dragging.current = true;
      canvas.focus({ preventScroll: true });
      canvas.style.setProperty('cursor', 'grabbing');
      event.nativeEvent.preventDefault();
      target.setPointerCapture(event.pointerId);
      invalidate();
    },
    [controller, enabled, finish, canvasRef, invalidate],
  );
  const down = useCallback(
    (event: Pointer, piece: Furniture, displayed?: FloorPoint) =>
      begin(event, piece, displayed),
    [begin],
  );
  const downWindow = useCallback(
    (event: Pointer, feature: WindowFeature, displayed?: number) =>
      begin(event, feature, displayed),
    [begin],
  );
  const move = useCallback(
    (event: Pointer, item: { id: string }) => {
      const old = gesture.current;
      if (
        !old ||
        old.pointerId !== event.pointerId ||
        (old.kind === 'floor' ? old.edit.item.id : old.edit.feature.id) !==
          item.id
      )
        return;
      event.stopPropagation();
      if (!old.edit.current()) {
        old.edit.cancel();
        return;
      }
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !sameViewport(rect, old.rect)) {
        cancel(true);
        return;
      }
      if (
        Math.hypot(event.clientX - old.startX, event.clientY - old.startY) < 3
      )
        return;
      if (old.kind === 'floor') {
        const next = floorPlacement(
          old.edit.room,
          old.edit.item,
          event.ray,
          old.offset,
          snap,
        );
        if (next) pose.current = { id: item.id, ...next };
      } else {
        const next = windowPlacement(
          old.edit.room,
          old.edit.feature,
          event.ray,
          old.offset,
          snap,
        );
        if (next !== null) {
          windowPose.current = { id: item.id, offset: next };
          setWindowPreview(windowPose.current);
        }
      }
      invalidate();
    },
    [snap, invalidate, canvasRef, cancel],
  );
  const up = useCallback(
    (event: Pointer, item: { id: string }) => {
      const old = gesture.current;
      if (
        !old ||
        old.pointerId !== event.pointerId ||
        (old.kind === 'floor' ? old.edit.item.id : old.edit.feature.id) !==
          item.id
      )
        return;
      event.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !sameViewport(rect, old.rect)) {
        cancel(true);
        return;
      }
      if (
        Math.hypot(event.clientX - old.startX, event.clientY - old.startY) < 3
      ) {
        old.edit.cancel();
        return;
      }
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      let result: FloorResult;
      if (old.kind === 'floor') {
        const projected = floorPlacement(
            old.edit.room,
            old.edit.item,
            event.ray,
            old.offset,
            snap,
          ),
          displayed = pose.current;
        const next =
          projected ??
          (outside && displayed?.id === item.id
            ? { x: displayed.x, z: displayed.z }
            : null);
        if (!next) {
          cancel(true);
          return;
        }
        result = old.edit.commit(next);
      } else {
        const projected = windowPlacement(
            old.edit.room,
            old.edit.feature,
            event.ray,
            old.offset,
            snap,
          ),
          displayed = windowPose.current;
        const next =
          projected ??
          (outside && displayed?.id === item.id
            ? clampWindowOffset(
                old.edit.room,
                old.edit.feature,
                displayed.offset,
                false,
              )
            : null);
        if (next === null) {
          cancel(true);
          return;
        }
        result = old.edit.commit(next);
      }
      if (!result.ok) controller.notify(failureMessage(result, old.edit.room));
    },
    [canvasRef, controller, snap, cancel],
  );
  const rotate = useCallback(
    (direction: -1 | 1 = 1) => {
      cancel();
      const result = rotateFloorSelection(controller, direction);
      if (!result.ok)
        controller.notify(
          failureMessage(result, controller.getSnapshot().workspace?.current),
        );
    },
    [cancel, controller],
  );
  useEffect(() => {
    if (!enabled) cancel();
    return () => cancel();
  }, [enabled, snap, cancel]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    canvas.setAttribute(
      'aria-label',
      enabled
        ? 'Room in 3D. Drag furniture on the floor or slide windows along their wall. Arrow keys nudge; R rotates furniture; Escape cancels.'
        : 'Room in 3D. Arrow keys look around; plus and minus zoom. Inside the room, W A S D move. Select an item to inspect.',
    );
    const key = (event: KeyboardEvent) => {
      if (event.isComposing || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (gesture.current) cancel(true);
        else controller.select(null);
        return;
      }
      if (!enabled) return;
      const arrow = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ].includes(event.key);
      if (!arrow && event.key.toLowerCase() !== 'r') return;
      event.preventDefault();
      if (gesture.current) return;
      const state = controller.getSnapshot(),
        room = state.workspace?.current;
      const feature = room?.room.features.find(
        (f) => f.id === state.presentation.selectedId,
      );
      if (feature?.kind === 'window' && room) {
        if (!arrow) return;
        const next = nudgeWindowOffset(
          room,
          feature,
          event.key,
          event.shiftKey,
          event.altKey,
        );
        const edit = beginWindowEdit(controller, feature.id);
        if (!edit || next === null) {
          controller.notify(
            'Review the window width, position and wall measurements before moving it.',
          );
          return;
        }
        const result = edit.commit(next);
        if (!result.ok) controller.notify(failureMessage(result, room));
        return;
      }
      const item = room?.furniture.find(
        (p) => p.id === state.presentation.selectedId,
      );
      if (!item) {
        controller.notify('Select an item to edit.');
        return;
      }
      if (!arrow) {
        rotate();
        return;
      }
      const edit = beginFloorEdit(controller, item.id);
      if (!edit) return;
      const next = nudgePosition(item, event.key, event.shiftKey, event.altKey),
        result = edit.commit({ x: next.centerX, z: next.centerZ });
      if (!result.ok) controller.notify(failureMessage(result, room));
    };
    const interrupted = () => cancel();
    const pointerCancel = (event: PointerEvent) => {
      if (gesture.current?.pointerId === event.pointerId) cancel(true);
    };
    const anotherPointer = (event: PointerEvent) => {
      if (gesture.current && gesture.current.pointerId !== event.pointerId) {
        event.preventDefault();
        cancel(true);
      }
    };
    let width = canvas.clientWidth,
      height = canvas.clientHeight;
    const observer = new ResizeObserver(() => {
      if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        cancel();
      }
    });
    observer.observe(canvas);
    canvas.addEventListener('keydown', key);
    canvas.addEventListener('blur', interrupted);
    canvas.addEventListener('pointerdown', anotherPointer, true);
    canvas.addEventListener('pointercancel', pointerCancel);
    canvas.addEventListener('lostpointercapture', pointerCancel);
    window.addEventListener('blur', interrupted);
    window.addEventListener('scroll', interrupted, true);
    return () => {
      cancel();
      observer.disconnect();
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('blur', interrupted);
      canvas.removeEventListener('pointerdown', anotherPointer, true);
      canvas.removeEventListener('pointercancel', pointerCancel);
      canvas.removeEventListener('lostpointercapture', pointerCancel);
      window.removeEventListener('blur', interrupted);
      window.removeEventListener('scroll', interrupted, true);
    };
  }, [canvasRef, ready, enabled, cancel, controller, rotate]);
  return useMemo(
    () => ({
      enabled,
      pose,
      dragging,
      windowPreview,
      down,
      downWindow,
      move,
      up,
      cancel,
      rotate,
    }),
    [enabled, windowPreview, down, downWindow, move, up, cancel, rotate],
  );
}
export type FloorEditing = ReturnType<typeof useFloorEdit>;
