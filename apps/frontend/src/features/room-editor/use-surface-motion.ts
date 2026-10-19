import { useLayoutEffect, useRef } from 'react';

/** Animate a natural-size surface without remounting its controls or state. */
export function useSurfaceMotion(context: string) {
  const surface = useRef<HTMLDivElement>(null);
  const height = useRef(0);
  useLayoutEffect(() => {
    const shell = surface.current;
    const content = shell?.firstElementChild;
    if (!shell || !(content instanceof HTMLElement)) return;
    let geometry: Animation | null = null;
    let sampleFrame = 0;
    const reveal = content.animate(
      [
        { opacity: 0.4, transform: 'translateY(9px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 300, easing: 'cubic-bezier(.2,.75,.2,1)' },
    );
    const resize = () => {
      const next = content.getBoundingClientRect().height;
      if (next <= 0) return;
      const from = geometry
        ? shell.getBoundingClientRect().height
        : height.current || next;
      height.current = next;
      if (Math.abs(from - next) < 1) return;
      geometry?.cancel();
      shell.style.height = `${next}px`;
      shell.style.overflow = 'clip';
      const running = shell.animate(
        [{ height: `${from}px` }, { height: `${next}px` }],
        { duration: 340, easing: 'cubic-bezier(.2,.75,.2,1)' },
      );
      geometry = running;
      // Bounded local observation only; no probe or frame work in production.
      const intervals: number[] = [];
      const sizes = new Set<number>();
      let previous = performance.now();
      const sample = (time: number) => {
        if (geometry !== running) return;
        intervals.push(time - previous);
        previous = time;
        sizes.add(Math.round(shell.getBoundingClientRect().height));
        if (intervals.length < 90) sampleFrame = requestAnimationFrame(sample);
      };
      cancelAnimationFrame(sampleFrame);
      if (process.env.NODE_ENV === 'development')
        sampleFrame = requestAnimationFrame(sample);
      running.onfinish = () => {
        if (geometry !== running) return;
        cancelAnimationFrame(sampleFrame);
        if (process.env.NODE_ENV === 'development') {
          const sorted = intervals.slice(1).sort((a, b) => a - b);
          shell.dataset.motionObservation = JSON.stringify({
            frames: sorted.length,
            p95: sorted[Math.floor(sorted.length * 0.95)] ?? null,
            max: sorted.at(-1) ?? null,
            distinctHeights: sizes.size,
          });
        }
        geometry = null;
        shell.style.height = '';
        shell.style.overflow = '';
      };
    };
    resize();
    // Observe natural content, never our animated outer height.
    const observer = new ResizeObserver(resize);
    observer.observe(content);
    return () => {
      // React has already replaced the children during layout-effect cleanup.
      // Preserve the last natural height unless an animation is interrupted.
      if (geometry) height.current = shell.getBoundingClientRect().height;
      observer.disconnect();
      cancelAnimationFrame(sampleFrame);
      reveal.cancel();
      geometry?.cancel();
      shell.style.height = '';
      shell.style.overflow = '';
    };
  }, [context]);
  return surface;
}
