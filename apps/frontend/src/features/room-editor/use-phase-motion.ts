import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';
import type { ProjectDestination } from '../cost/navigation';
import { animatePhase, boundedPanel } from './phase-motion';

export function usePhaseMotion(
  destination: ProjectDestination,
  stage: RefObject<HTMLElement | null>,
  properties: RefObject<HTMLElement | null>,
  costPanel: RefObject<HTMLElement | null>,
  designHeading: RefObject<HTMLHeadingElement | null>,
  context: string | undefined,
) {
  const previous = useRef(destination),
    cancel = useRef<(() => void) | null>(null),
    focusPending = useRef(false);
  const captured = useRef<DOMRect | null>(null);
  const scope = useRef(context);
  const capture = useCallback(() => {
    captured.current =
      (previous.current === 'cost'
        ? costPanel.current
        : properties.current
      )?.getBoundingClientRect() ?? null;
  }, [costPanel, properties]);
  const [moving, setMoving] = useState(false),
    [present, setPresent] = useState(destination === 'cost');
  useLayoutEffect(() => {
    let live = true;
    const update = (isMoving: boolean, isPresent: boolean) =>
      queueMicrotask(() => {
        if (!live) return;
        setMoving(isMoving);
        setPresent(isPresent);
      });
    const retire = () => {
      live = false;
    };
    const area = stage.current;
    area?.style.setProperty(
      '--phase-top',
      `${Math.max(0, area.getBoundingClientRect().top)}px`,
    );
    if (scope.current !== context) {
      scope.current = context;
      previous.current = destination;
      cancel.current?.();
      cancel.current = null;
      captured.current = null;
      focusPending.current = false;
      update(false, destination === 'cost');
      return retire;
    }
    if (previous.current === destination) return retire;
    previous.current = destination;
    const panel = costPanel.current,
      side = properties.current;
    const interrupted = !!cancel.current,
      visual = panel?.getBoundingClientRect();
    const opacity = panel
      ? Array.from(panel.children).map(
          (child) => getComputedStyle(child).opacity,
        )
      : [];
    cancel.current?.();
    cancel.current = null;
    focusPending.current = false;
    if (!panel || !side || !area) {
      focusPending.current = true;
      update(false, destination === 'cost');
      return retire;
    }
    update(true, true);
    const sidebar = boundedPanel(
      side.getBoundingClientRect(),
      area.getBoundingClientRect(),
    );
    const base = panel.getBoundingClientRect();
    const start = captured.current;
    captured.current = null;
    const finish = () => {
      focusPending.current = true;
      update(false, true);
    };
    cancel.current = animatePhase(
      panel,
      start ??
        (destination === 'cost'
          ? interrupted && visual
            ? visual
            : sidebar
          : (visual ?? base)),
      destination === 'cost' ? base : sidebar,
      destination === 'cost',
      finish,
      opacity,
    );
    const resize = () => {
      finish();
    };
    window.addEventListener('resize', resize);
    return () => {
      retire();
      window.removeEventListener('resize', resize);
    };
  }, [destination, stage, properties, costPanel, context]);
  useLayoutEffect(() => {
    if (moving || !focusPending.current) return;
    // React has hidden/settled the retiring layer. Releasing fill styles earlier
    // can briefly restore its natural full-width rectangle during the return.
    cancel.current?.();
    cancel.current = null;
  }, [moving, destination]);
  useEffect(() => {
    if (moving || !focusPending.current) return;
    focusPending.current = false;
    const target =
      destination === 'design'
        ? designHeading.current
        : costPanel.current?.querySelector<HTMLElement>('[data-cost-focus]');
    target?.focus({ preventScroll: true });
  }, [moving, destination, designHeading, costPanel]);
  useEffect(
    () => () => {
      cancel.current?.();
      cancel.current = null;
    },
    [],
  );
  return { moving, present, capture };
}
