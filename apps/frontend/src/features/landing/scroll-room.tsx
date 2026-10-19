'use client';
import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { ScrollTarget } from './scroll-motion';
import { boundedProgress } from './scroll-motion';
import styles from './landing.module.css';

const FurnitureScene = dynamic(() => import('./furniture-scene'), {
  ssr: false,
});

class GraphicsBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onFailure();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ScrollRoom() {
  const stage = useRef<HTMLDivElement>(null),
    target = useRef<ScrollTarget>({ progress: 0, visible: true });
  const [ready, setReady] = useState(false),
    [lost, setLost] = useState(false);
  const graphicsReady = useCallback(() => setReady(true), []),
    graphicsLost = useCallback(() => setLost(true), []);
  useEffect(() => {
    const element = stage.current,
      journey = element?.closest<HTMLElement>('[data-landing-journey]');
    if (!element || !journey) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = journey.getBoundingClientRect();
      target.current.progress = boundedProgress(
        -rect.top /
          Math.max(1, rect.height - document.documentElement.clientHeight),
      );
      for (const chapter of journey.querySelectorAll<HTMLElement>(
        '[data-room-chapter]',
      )) {
        const bounds = chapter.getBoundingClientRect(),
          distance =
            (bounds.top +
              Math.min(bounds.height, document.documentElement.clientHeight) /
                2 -
              document.documentElement.clientHeight / 2) /
            Math.max(1, document.documentElement.clientHeight);
        chapter.style.setProperty(
          '--copy-y',
          `${Math.max(-16, Math.min(16, distance * 12))}px`,
        );
        chapter.style.setProperty(
          '--copy-opacity',
          String(1 - Math.min(0.12, Math.abs(distance) * 0.08)),
        );
      }
      if (target.current.visible) target.current.wake?.();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new IntersectionObserver(([entry]) => {
      target.current.visible = !!entry?.isIntersecting;
      if (target.current.visible) schedule();
      else target.current.wake?.();
    });
    observer.observe(element);
    const resize = new ResizeObserver(schedule);
    resize.observe(journey);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return (
    <div ref={stage} className={styles.stage}>
      <div
        className={styles.roomVisual}
        role={ready && !lost ? 'img' : undefined}
        aria-label={
          ready && !lost
            ? 'Furniture slides and turns into a more open bedroom and workspace, with the desk moving toward the window as you scroll.'
            : undefined
        }
      >
        {!lost && (
          <div
            className={`${styles.canvas} ${ready ? styles.canvasReady : ''}`}
          >
            <GraphicsBoundary onFailure={graphicsLost}>
              <FurnitureScene
                targetRef={target}
                onReady={graphicsReady}
                onLost={graphicsLost}
              />
            </GraphicsBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
