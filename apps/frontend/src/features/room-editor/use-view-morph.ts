import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { ViewBridge, viewMorphFrame } from '../room-view/view-morph';
import type { RoomView } from '../room-view/view-morph';
import type { PlanBox } from '../plan-view/adapter';

/** Apply layer opacity after the corresponding WebGL camera frame, not before it. */
export function useViewMorph(
  view: RoomView,
  workspaceId: string | undefined,
  box: PlanBox,
  enabled: boolean,
  plan: RefObject<HTMLDivElement | null>,
  cutaway: RefObject<HTMLDivElement | null>,
) {
  const bridge = useMemo(() => new ViewBridge(workspaceId), [workspaceId]);
  const [availability, setAvailability] = useState<{
    owner: ViewBridge;
    status: 'opening' | 'ready' | 'unavailable';
  }>(() => ({ owner: bridge, status: 'opening' }));
  const [motion, setMotion] = useState<{ owner: ViewBridge; moving: boolean }>(
    () => ({ owner: bridge, moving: false }),
  );
  const status =
    availability.owner === bridge ? availability.status : 'opening';
  const ready = status === 'ready',
    failed = status === 'unavailable';
  const moving = motion.owner === bridge && motion.moving;
  const paint = useCallback(
    (amount: number) => {
      const frame = viewMorphFrame(amount),
        planElement = plan.current,
        sceneElement = cutaway.current;
      planElement?.style.setProperty('opacity', String(frame.plan));
      sceneElement?.style.setProperty('opacity', String(frame.cutaway));
    },
    [plan, cutaway],
  );
  useLayoutEffect(() => {
    bridge.connect(paint, () =>
      queueMicrotask(() => {
        if (bridge.live && !bridge.timeline.moving)
          setMotion((previous) =>
            previous.owner === bridge && !previous.moving
              ? previous
              : { owner: bridge, moving: false },
          );
      }),
    );
    return () => bridge.dispose(performance.now());
  }, [bridge, paint]);
  useLayoutEffect(() => {
    bridge.updateBox(box);
  }, [bridge, box]);
  const onAvailability = useCallback(
    (next: typeof status) => {
      if (!bridge.live) return;
      setAvailability((previous) =>
        previous.owner === bridge && previous.status === next
          ? previous
          : { owner: bridge, status: next },
      );
    },
    [bridge],
  );
  useLayoutEffect(() => {
    let live = true,
      raf = 0;
    const update = (next: boolean) =>
      queueMicrotask(() => {
        if (live && bridge.live)
          setMotion((previous) =>
            previous.owner === bridge && previous.moving === next
              ? previous
              : { owner: bridge, moving: next },
          );
      });
    if (!enabled || failed || !ready) {
      bridge.timeline.snap(failed || !ready ? 'plan' : view);
      bridge.paint(bridge.timeline.amount);
      bridge.invalidate();
      update(false);
    } else {
      const revision = bridge.timeline.request(view, performance.now());
      update(bridge.timeline.moving);
      if (!bridge.timeline.moving) {
        bridge.paint(bridge.timeline.amount);
        bridge.invalidate();
      } else {
        const advance = (now: number) => {
          if (!live || !bridge.live || bridge.timeline.revision !== revision)
            return;
          bridge.timeline.sample(now);
          bridge.invalidate();
          if (bridge.timeline.moving) raf = requestAnimationFrame(advance);
        };
        raf = requestAnimationFrame(advance);
      }
    }
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      bridge.timeline.cancel(performance.now());
    };
  }, [bridge, ready, failed, enabled, view]);
  return {
    bridge,
    ready,
    failed,
    moving,
    onAvailability,
    planInteractive: !moving && (view === 'plan' || !ready || failed),
    cutawayInteractive: !moving && ready && !failed && view === 'cutaway',
  };
}
