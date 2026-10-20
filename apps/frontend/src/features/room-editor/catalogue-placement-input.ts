import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointer } from 'react';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { CataloguePlacement } from './catalogue-placement';
import { focusProperties } from './focus';

type Held = {
  id: number;
  x: number;
  y: number;
  target: Element;
  catalogue: boolean;
};
/** One captured pointer and at most one pending frame; no canonical writes until release. */
export function useCataloguePlacementInput(placement: CataloguePlacement) {
  const held = useRef<Held | null>(null),
    ignoreClick = useRef(false);
  const release = useCallback(() => {
    const old = held.current;
    held.current = null;
    if (old?.target.hasPointerCapture(old.id))
      old.target.releasePointerCapture(old.id);
  }, []);
  const choose = useCallback(
    (entry: CatalogueEntry) => {
      if (!placement.ready()) {
        placement.session.notify('Open the 2D or 3D room to place furniture.');
        return;
      }
      if (placement.start(entry)) placement.focusTarget();
    },
    [placement],
  );
  const beginDrag = useCallback(
    (event: ReactPointer<HTMLButtonElement>, entry: CatalogueEntry) => {
      if (event.pointerType === 'touch') ignoreClick.current = false;
      if (
        event.button !== 0 ||
        event.isPrimary === false ||
        (event.pointerType === 'touch' &&
          !(
            event.target instanceof Element &&
            event.target.closest('[data-placement-grip]')
          ))
      )
        return false;
      if (!placement.ready()) return false;
      event.preventDefault();
      event.stopPropagation();
      release();
      if (!placement.start(entry, false)) return false;
      ignoreClick.current = true;
      held.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        target: event.currentTarget,
        catalogue: true,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return true;
    },
    [placement, release],
  );
  useEffect(() => {
    let frame = 0;
    let last: { x: number; y: number } | null = null;
    const update = () => {
      if (last) placement.move(placement.locate(last));
    };
    const animate = () => {
      frame = 0;
      if (!placement.getSnapshot()) return;
      update();
      if (held.current && last) {
        const before = window.scrollY;
        if (last.y < 44) window.scrollBy(0, -12);
        else if (last.y > innerHeight - 44) window.scrollBy(0, 12);
        if (window.scrollY !== before) frame = requestAnimationFrame(animate);
      }
    };
    const move = (event: PointerEvent) => {
      if (
        !placement.getSnapshot() ||
        (held.current && held.current.id !== event.pointerId)
      )
        return;
      last = { x: event.clientX, y: event.clientY };
      if (held.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const down = (event: PointerEvent) => {
      if (!placement.getSnapshot()) return;
      if (held.current) {
        if (held.current.id !== event.pointerId) {
          release();
          placement.cancel();
        }
        return;
      }
      if (
        event.button !== 0 ||
        (event.target instanceof Element &&
          event.target.closest(
            'button,input,select,textarea,summary,[aria-label="Furniture placement"]',
          ))
      )
        return;
      const point = placement.locate({ x: event.clientX, y: event.clientY }),
        target = placement.targetElement();
      if (!point || !target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      held.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        target,
        catalogue: false,
      };
      target.setPointerCapture(event.pointerId);
      last = { x: event.clientX, y: event.clientY };
      update();
    };
    const up = (event: PointerEvent) => {
      const old = held.current;
      if (!old || old.id !== event.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      last = { x: event.clientX, y: event.clientY };
      update();
      release();
      if (
        old.catalogue &&
        Math.hypot(event.clientX - old.x, event.clientY - old.y) < 6
      ) {
        const item = placement.getSnapshot()?.item;
        if (item)
          placement.move({ x: item.pose.centerX, z: item.pose.centerZ });
        placement.focusTarget();
      } else if (!placement.getSnapshot()?.inside) placement.cancel();
      else if (placement.commit().ok) focusProperties(placement.session);
      else placement.focusTarget();
    };
    const cancel = () => {
      release();
      placement.cancel();
    };
    const hidden = () => {
      if (document.hidden) cancel();
    };
    const lost = (event: PointerEvent) => {
      if (held.current?.id === event.pointerId) cancel();
    };
    const key = (event: KeyboardEvent) => {
      const state = placement.getSnapshot();
      if (!state) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancel();
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input,textarea,select,button,summary,[contenteditable="true"]',
        )
      )
        return;
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (placement.commit().ok) focusProperties(placement.session);
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        event.stopImmediatePropagation();
        placement.rotate();
      } else if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const step = event.altKey ? 0.5 : event.shiftKey ? 10 : 100;
        placement.move(
          {
            x:
              state.item.pose.centerX +
              (event.key === 'ArrowLeft'
                ? -step
                : event.key === 'ArrowRight'
                  ? step
                  : 0),
            z:
              state.item.pose.centerZ +
              (event.key === 'ArrowUp'
                ? -step
                : event.key === 'ArrowDown'
                  ? step
                  : 0),
          },
          true,
          false,
        );
      }
    };
    const unsubscribe = placement.subscribe(() => {
      if (!placement.getSnapshot()) {
        release();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, {
      capture: true,
      passive: false,
    });
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', lost, true);
    window.addEventListener('lostpointercapture', lost, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('resize', cancel);
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', lost, true);
      window.removeEventListener('lostpointercapture', lost, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', hidden);
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      release();
      placement.cancel();
    };
  }, [placement, release]);
  return {
    beginDrag,
    choose,
    consumeClick: () => {
      const ignored = ignoreClick.current;
      ignoreClick.current = false;
      return ignored;
    },
  };
}
