import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import type { FloorEdit, FloorPoint } from './manipulation';

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
type Gesture = {
  edit: FloorEdit;
  pointerId: number;
  startX: number;
  startY: number;
  offset: FloorPoint;
  target: CaptureTarget;
  rect: Viewport;
};
export function useFloorEdit(
  controller: SessionController,
  enabled: boolean,
  ready: boolean,
  snap: boolean,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  invalidate: () => void,
) {
  const gesture = useRef<Gesture | null>(null),
    pose = useRef<MovingPose | null>(null);
  const finish = useCallback(() => {
    const old = gesture.current;
    gesture.current = null;
    pose.current = null;
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
  const down = useCallback(
    (event: Pointer, piece: Furniture, displayed?: FloorPoint) => {
      const canvas = canvasRef.current;
      const target = event.target;
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
      controller.select(piece.id);
      if (piece.locks.position) {
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
      const edit = beginFloorEdit(controller, piece.id, finish);
      if (!edit) return;
      if (edit.item !== piece) {
        edit.cancel();
        return;
      }
      const initial =
        displayed &&
        Number.isFinite(displayed.x) &&
        Number.isFinite(displayed.z)
          ? displayed
          : { x: piece.pose.centerX, z: piece.pose.centerZ };
      gesture.current = {
        edit,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offset: { x: point.x - initial.x, z: point.z - initial.z },
        target,
        rect: canvas.getBoundingClientRect(),
      };
      pose.current = { id: piece.id, ...initial };
      canvasRef.current?.focus({ preventScroll: true });
      canvasRef.current?.style.setProperty('cursor', 'grabbing');
      event.nativeEvent.preventDefault();
      target.setPointerCapture(event.pointerId);
      invalidate();
    },
    [controller, enabled, finish, canvasRef, invalidate],
  );
  const move = useCallback(
    (event: Pointer, piece: Furniture) => {
      const old = gesture.current;
      if (
        !old ||
        old.pointerId !== event.pointerId ||
        old.edit.item.id !== piece.id
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
      const next = floorPlacement(
        old.edit.room,
        old.edit.item,
        event.ray,
        old.offset,
        snap,
      );
      if (!next) return;
      pose.current = { id: piece.id, ...next };
      invalidate();
    },
    [snap, invalidate, canvasRef, cancel],
  );
  const up = useCallback(
    (event: Pointer, piece: Furniture) => {
      const old = gesture.current;
      if (
        !old ||
        old.pointerId !== event.pointerId ||
        old.edit.item.id !== piece.id
      )
        return;
      event.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      const next = floorPlacement(
        old.edit.room,
        old.edit.item,
        event.ray,
        old.offset,
        snap,
      );
      if (
        !next ||
        !rect ||
        !sameViewport(rect, old.rect) ||
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        cancel(true);
        return;
      }
      if (
        Math.hypot(event.clientX - old.startX, event.clientY - old.startY) < 3
      ) {
        old.edit.cancel();
        return;
      }
      const result = old.edit.commit(next);
      if (!result.ok) controller.notify(failureMessage(result, old.edit.room));
    },
    [canvasRef, controller, snap, cancel],
  );
  const rotate = useCallback(() => {
    cancel();
    const result = rotateFloorSelection(controller);
    if (!result.ok)
      controller.notify(
        failureMessage(result, controller.getSnapshot().workspace?.current),
      );
  }, [cancel, controller]);
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
        ? 'Room in 3D. Drag furniture on the floor. Arrow keys nudge the selected piece; Shift moves 100 mm, Alt moves half a millimetre. R rotates; Escape cancels.'
        : 'Room in 3D. Arrow keys look around; plus and minus zoom. Inside the room, W A S D move. Select furniture to inspect.',
    );
    const key = (event: KeyboardEvent) => {
      if (!enabled || event.isComposing || event.ctrlKey || event.metaKey)
        return;
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel(true);
        return;
      }
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
        item = state.workspace?.current.furniture.find(
          (p) => p.id === state.presentation.selectedId,
        );
      if (!item) {
        controller.notify('Select a piece to edit.');
        return;
      }
      if (!arrow) {
        rotate();
        return;
      }
      const edit = beginFloorEdit(controller, item.id);
      if (!edit) return;
      const next = nudgePosition(item, event.key, event.shiftKey, event.altKey);
      const result = edit.commit({ x: next.centerX, z: next.centerZ });
      if (!result.ok)
        controller.notify(failureMessage(result, state.workspace!.current));
    };
    const interrupted = () => cancel();
    const pointerCancel = (e: PointerEvent) => {
      if (gesture.current?.pointerId === e.pointerId) cancel(true);
    };
    const anotherPointer = (e: PointerEvent) => {
      if (gesture.current && gesture.current.pointerId !== e.pointerId) {
        e.preventDefault();
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
    () => ({ enabled, pose, down, move, up, cancel, rotate }),
    [enabled, down, move, up, cancel, rotate],
  );
}
export type FloorEditing = ReturnType<typeof useFloorEdit>;
