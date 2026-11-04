import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface ReadingRuntime {
  request(callback: FrameRequestCallback): number;
  cancel(frame: number): void;
  observe(log: HTMLElement, changed: () => void): () => void;
}
const runtime: ReadingRuntime = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (frame) => cancelAnimationFrame(frame),
  observe(log, changed) {
    const observer = new ResizeObserver(changed);
    observer.observe(log);
    for (const child of log.children) observer.observe(child);
    return () => observer.disconnect();
  },
};

/** Own only this transcript's reading position, never the surrounding page. */
export function createChatReading(log: HTMLElement, clock = runtime) {
  let live = true,
    history = false,
    tracking = false;
  let target: HTMLElement | null = null,
    frame: number | null = null;
  let lastTop: number | null = null;
  let request: string | undefined;
  let stopObserving = () => {};
  const schedule = () => {
    if (!live || !tracking || frame !== null) return;
    frame = clock.request(() => {
      frame = null;
      if (!live || !tracking || !target || !log.contains(target)) return;
      const top = Math.max(
        0,
        Math.min(
          log.scrollHeight - log.clientHeight,
          log.scrollTop +
            target.getBoundingClientRect().top -
            log.getBoundingClientRect().top -
            log.clientTop -
            8,
        ),
      );
      if (lastTop !== null && Math.abs(top - lastTop) < 1) return;
      lastTop = top;
      log.scrollTo({ top, behavior: 'smooth' });
    });
  };
  const pause = () => {
    tracking = false;
  };
  const manual = () => {
    pause();
    history = true;
  };
  const pointer = (event: PointerEvent) => {
    pause();
    if (event.target === log) history = true;
  };
  const key = (event: KeyboardEvent) => {
    pause();
    if (
      event.target === log &&
      [
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        ' ',
      ].includes(event.key)
    )
      manual();
  };
  const scroll = () => {
    if (history && log.scrollHeight - log.clientHeight - log.scrollTop <= 24)
      history = false;
  };
  log.addEventListener('wheel', manual, { passive: true });
  log.addEventListener('touchmove', manual, { passive: true });
  log.addEventListener('pointerdown', pointer, { passive: true });
  log.addEventListener('keydown', key);
  log.addEventListener('scroll', scroll, { passive: true });
  return {
    show(next: HTMLElement | null, explicit = false, requestKey?: string) {
      if (!live || !next || !log.contains(next)) return false;
      if (explicit || (requestKey !== undefined && requestKey !== request))
        history = false;
      request = requestKey;
      if (history) return false;
      stopObserving();
      target = next;
      lastTop = null;
      tracking = true;
      stopObserving = clock.observe(log, schedule);
      schedule();
      return true;
    },
    dispose() {
      live = false;
      tracking = false;
      if (frame !== null) clock.cancel(frame);
      stopObserving();
      log.removeEventListener('wheel', manual);
      log.removeEventListener('touchmove', manual);
      log.removeEventListener('pointerdown', pointer);
      log.removeEventListener('keydown', key);
      log.removeEventListener('scroll', scroll);
    },
  };
}

export function useChatReading(log: RefObject<HTMLDivElement | null>) {
  const owner = useRef<ReturnType<typeof createChatReading> | null>(null);
  useEffect(() => {
    if (!log.current) return;
    const reading = createChatReading(log.current);
    owner.current = reading;
    return () => {
      reading.dispose();
      owner.current = null;
    };
  }, [log]);
  return useCallback(
    (target: HTMLElement | null, explicit = false, requestKey?: string) =>
      owner.current?.show(target, explicit, requestKey),
    [],
  );
}
