'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { startScrollJourney } from './scroll-journey';

let cancelActive: (() => void) | undefined;

function revealSection(id: string) {
  const target =
    document.getElementById(id) ??
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-scroll-target]'),
    ).find((element) => element.dataset.scrollTarget === id);
  if (!target) return;
  cancelActive?.();
  const heading = target.querySelector<HTMLElement>('h1, h2') ?? target;
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  const from = window.scrollY,
    to = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        from + target.getBoundingClientRect().top - 30,
      ),
    ),
    events = [
      'wheel',
      'touchstart',
      'pointerdown',
      'keydown',
      'resize',
    ] as const;
  const interrupt = () => cancelActive?.();
  const hidden = () => {
    if (document.hidden) interrupt();
  };
  const stop = startScrollJourney(from, to, {
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (frame) => cancelAnimationFrame(frame),
    write: (top) => window.scrollTo({ top, behavior: 'instant' }),
    done: () => {
      for (const event of events) window.removeEventListener(event, interrupt);
      document.removeEventListener('visibilitychange', hidden);
      if (cancelActive === stop) cancelActive = undefined;
    },
  });
  cancelActive = stop;
  for (const event of events)
    window.addEventListener(event, interrupt, { passive: true });
  document.addEventListener('visibilitychange', hidden);
}

export function SectionScroll({
  target,
  className,
  children,
}: {
  target: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  useEffect(() => () => cancelActive?.(), []);
  return (
    <button
      type="button"
      className={className}
      onClick={() => revealSection(target)}
    >
      {children}
    </button>
  );
}

/** Retain Next's history state; old shared fragment URLs no longer become routes. */
export function CleanLandingFragment() {
  const original = useRef('');
  useEffect(() => {
    const reveal = (fragment: string) => {
      if (
        [
          'how-it-works',
          'make-it-yours',
          'a-fresh-angle',
          'main-content',
        ].includes(fragment)
      )
        revealSection(fragment);
    };
    const clean = () => {
      const fragment = window.location.hash.slice(1);
      if (!fragment) return;
      original.current = fragment;
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
      reveal(fragment);
    };
    if (window.location.hash) clean();
    else if (original.current) reveal(original.current);
    window.addEventListener('hashchange', clean);
    return () => {
      window.removeEventListener('hashchange', clean);
      cancelActive?.();
    };
  }, []);
  return null;
}
