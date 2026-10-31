import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import styles from './workspace.module.css';

export function ProductCarousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode[];
}) {
  const id = useId(),
    track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = children.length;
  const position = Math.min(active, Math.max(0, count - 1));
  const move = (index: number) => {
    const rail = track.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    const slide = rail?.children[Math.max(0, Math.min(index, count - 1))] as
      HTMLElement | undefined;
    if (!rail || !first || !slide) return;
    rail.scrollTo({
      left: slide.offsetLeft - first.offsetLeft,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || count < 2) return;
    const next =
      event.key === 'ArrowRight'
        ? position + 1
        : event.key === 'ArrowLeft'
          ? position - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    move(next);
  };
  return (
    <section
      className={styles.productCarousel}
      aria-label={`${label} choices`}
      aria-roledescription="carousel"
    >
      {count > 1 && (
        <div className={styles.carouselControls}>
          <span
            className={styles.carouselPosition}
            aria-live="polite"
            aria-atomic="true"
          >
            {position + 1} / {count}
          </span>
          <button
            className={styles.carouselControl}
            aria-label={`Previous ${label} option`}
            aria-controls={id}
            disabled={position === 0}
            onClick={() => move(position - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className={styles.carouselControl}
            aria-label={`Next ${label} option`}
            aria-controls={id}
            disabled={position === count - 1}
            onClick={() => move(position + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
      <div
        id={id}
        ref={track}
        className={`${styles.sourceCards} ${styles.carouselTrack}`}
        tabIndex={count > 1 ? 0 : undefined}
        aria-label={
          count > 1
            ? `${label} options. Use left and right arrow keys to compare.`
            : undefined
        }
        onKeyDown={keyDown}
        onScroll={() => {
          const rail = track.current;
          if (!rail) return;
          const slides = Array.from(rail.children) as HTMLElement[];
          const first = slides[0];
          if (!first) return;
          const closest = slides.reduce(
            (best, slide, index) =>
              Math.abs(slide.offsetLeft - first.offsetLeft - rail.scrollLeft) <
              Math.abs(
                slides[best]!.offsetLeft - first.offsetLeft - rail.scrollLeft,
              )
                ? index
                : best,
            0,
          );
          setActive(closest);
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className={styles.productSlide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
          >
            {child}
          </div>
        ))}
      </div>
    </section>
  );
}
