import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { RefObject } from 'react';
import {
  bindDrawerInteraction,
  COMPACT_PROPERTIES,
  followDrawerViewport,
  FULLSCREEN_PROPERTIES,
  OPEN_PROPERTIES,
  returnDrawerFocus,
} from './properties-drawer';

function mediaStore(query: string) {
  return {
    subscribe: (update: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    },
    snapshot: () => window.matchMedia(query).matches,
    server: () => false,
  };
}
const compactStore = mediaStore(COMPACT_PROPERTIES),
  fullStore = mediaStore(FULLSCREEN_PROPERTIES);
export function usePropertiesDrawer(
  scope: string,
  active: boolean,
  panel: RefObject<HTMLElement | null>,
  fallback: RefObject<HTMLElement | null>,
) {
  const compact = useSyncExternalStore(
    compactStore.subscribe,
    compactStore.snapshot,
    compactStore.server,
  );
  const full = useSyncExternalStore(
    fullStore.subscribe,
    fullStore.snapshot,
    fullStore.server,
  );
  const [request, setRequest] = useState({ scope, expanded: false });
  if (request.scope !== scope || ((!active || !compact) && request.expanded))
    setRequest({ scope, expanded: false });
  const expanded =
    active && compact && request.scope === scope && request.expanded;
  const trigger = useRef<HTMLButtonElement>(null),
    panelId = useId();
  const open = useCallback(() => {
    if (active && compact) setRequest({ scope, expanded: true });
  }, [active, compact, scope]);
  const close = useCallback(
    (restore = true) => {
      setRequest({ scope, expanded: false });
      if (restore)
        requestAnimationFrame(() =>
          returnDrawerFocus(trigger.current, fallback.current),
        );
    },
    [scope, fallback],
  );
  useEffect(() => {
    const target = panel.current;
    if (!target) return;
    target.addEventListener(OPEN_PROPERTIES, open);
    return () => target.removeEventListener(OPEN_PROPERTIES, open);
  }, [panel, open]);
  useEffect(() => {
    const target = panel.current;
    if (!target || !expanded) return;
    const release = bindDrawerInteraction(target, full, () => close());
    const releaseViewport = full
      ? followDrawerViewport(target, window.visualViewport)
      : () => {};
    const frame = requestAnimationFrame(() => {
      if (!target.contains(document.activeElement))
        target
          .querySelector<HTMLElement>('[data-drawer-close]')
          ?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      release();
      releaseViewport();
    };
  }, [expanded, full, panel, close]);
  useEffect(() => {
    if (
      active &&
      compact &&
      !expanded &&
      panel.current?.contains(document.activeElement)
    )
      returnDrawerFocus(trigger.current, fallback.current);
  }, [active, compact, expanded, panel, fallback]);
  return {
    compact,
    expanded,
    modal: expanded && full,
    full,
    open,
    close,
    trigger,
    panelId,
  };
}
