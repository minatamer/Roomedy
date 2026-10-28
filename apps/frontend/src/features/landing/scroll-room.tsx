'use client';
import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { ScrollTarget } from './scroll-motion';
import { landingChapterProgress, landingFraming } from './scroll-motion';
import { HouseLoader } from './house-loader';
import styles from './landing.module.css';
import {
  landingAmount,
  landingEstimate,
  landingEstimateAt,
} from './story-estimate';
import { landingFinishState } from './finish-motion';

// Canvas is inert on the server; retaining prerendering lets Next preload this chunk.
const FurnitureScene = dynamic(() => import('./furniture-scene'));

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
    photo = useRef<HTMLPictureElement>(null),
    target = useRef<ScrollTarget>({ progress: 0, visible: true });
  const [ready, setReady] = useState(false),
    [lost, setLost] = useState(false);
  const graphicsReady = useCallback(() => setReady(true), []),
    graphicsLost = useCallback(() => {
      target.current.prepared = false;
      target.current.publish?.(target.current.progress);
      setLost(true);
    }, []);
  useEffect(() => {
    const element = stage.current,
      journey = element?.closest<HTMLElement>('[data-landing-journey]');
    if (!element || !journey) return;
    const chapters = Array.from(
      journey.querySelectorAll<HTMLElement>('[data-room-chapter]'),
      (element) => ({ element, y: '', opacity: '' }),
    );
    const quote = journey.querySelector<HTMLElement>('[data-landing-estimate]'),
      finish = quote?.querySelector<HTMLElement>('[data-example-finish]'),
      floor = quote?.querySelector<HTMLElement>('[data-example-floor]'),
      total = quote?.querySelector<HTMLElement>('[data-example-total]'),
      saving = quote?.querySelector<HTMLElement>('[data-example-saving]'),
      plan = journey.querySelector<HTMLElement>('[data-landing-plan]');
    let previousChoice = '',
      previousPlan = '',
      previousShift = '',
      aspect =
        document.documentElement.clientWidth /
        Math.max(1, document.documentElement.clientHeight);
    const publish = (progress: number) => {
      const shift = `${landingFraming(progress, aspect).shift * 50}%`;
      if (shift !== previousShift) {
        element.style.setProperty('--room-shift', shift);
        previousShift = shift;
      }
      const example = landingEstimateAt(progress);
      if (example.choice !== previousChoice) {
        if (finish) finish.textContent = example.finish;
        if (floor) floor.textContent = landingAmount(example.floor);
        if (total) total.textContent = landingAmount(example.total);
        if (saving) {
          saving.hidden = !example.saving;
          saving.textContent = `${landingEstimate.currency} ${landingAmount(example.saving)} less with this floor`;
        }
        quote?.setAttribute('data-choice', example.choice);
        previousChoice = example.choice;
      }
      const planOpen = landingFinishState(progress).planOpen.toFixed(4);
      if (planOpen !== previousPlan) {
        plan?.style.setProperty('--plan-open', planOpen);
        previousPlan = planOpen;
      }
    };
    const control = target.current;
    control.publish = publish;
    publish(control.progress);
    let frame = 0,
      photoTransform = '';
    const measure = () => {
      frame = 0;
      const rect = journey.getBoundingClientRect();
      // Finish geometry reads before any style writes can invalidate layout.
      const height = document.documentElement.clientHeight,
        positions = chapters.map((chapter) => {
          const bounds = chapter.element.getBoundingClientRect();
          return {
            chapter,
            distance:
              (bounds.top + Math.min(bounds.height, height) / 2 - height / 2) /
              Math.max(1, height),
            offset: bounds.top - rect.top,
          };
        });
      aspect = document.documentElement.clientWidth / Math.max(1, height);
      target.current.progress = landingChapterProgress(
        -rect.top,
        positions.map(({ offset }) => offset),
      );
      const transform = `translate3d(0, ${target.current.progress * -36}px, 0)`;
      if (photo.current && transform !== photoTransform) {
        photo.current.style.transform = transform;
        photoTransform = transform;
      }
      for (const { chapter, distance } of positions) {
        const y = `${Math.max(-16, Math.min(16, distance * 12))}px`,
          opacity = String(1 - Math.min(0.12, Math.abs(distance) * 0.08));
        if (y !== chapter.y) {
          chapter.element.style.setProperty('--copy-y', y);
          chapter.y = y;
        }
        if (opacity !== chapter.opacity) {
          chapter.element.style.setProperty('--copy-opacity', opacity);
          chapter.opacity = opacity;
        }
      }
      if (target.current.visible) target.current.wake?.();
      if (!target.current.prepared) publish(target.current.progress);
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
    for (const chapter of chapters) resize.observe(chapter.element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (control.publish === publish) delete control.publish;
    };
  }, []);
  return (
    <div
      ref={stage}
      className={styles.stage}
      data-room-status={lost ? 'unavailable' : ready ? 'ready' : 'loading'}
    >
      <div
        className={styles.atmosphere}
        aria-hidden="true"
        data-landing-atmosphere
      >
        <picture ref={photo} className={styles.bedroomPhoto}>
          <source
            media="(max-width: 600px)"
            srcSet="/landing/bedroom-narrow.webp"
          />
          <Image
            src="/landing/bedroom-wide.webp"
            alt=""
            fill
            unoptimized
            sizes="100vw"
            loading="eager"
            fetchPriority="low"
            className={styles.photo}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        </picture>
        <div className={styles.daylight} />
      </div>
      <div
        className={styles.roomVisual}
        role={ready && !lost ? 'img' : undefined}
        aria-label={
          ready && !lost
            ? 'The room starts with its walls lowered. Rollers paint the walls, textured floor panels settle into place and furniture is arranged. A flooring alternative changes the room and its illustrative estimate together. The walls rise at the end to reveal the finished room.'
            : undefined
        }
      >
        {!ready && !lost && <HouseLoader />}
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
