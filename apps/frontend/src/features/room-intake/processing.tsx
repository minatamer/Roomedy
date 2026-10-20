import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { PhotoItem } from './photo-store';
import styles from './processing.module.css';

export function PhotoProcessing({
  phase,
  photos,
  onCancel,
}: {
  phase: 'preparing' | 'drafting' | 'opening';
  photos: readonly PhotoItem[];
  onCancel: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  return (
    <section
      className={styles.processing}
      aria-labelledby="photo-processing-title"
    >
      <h1 id="photo-processing-title" ref={heading} tabIndex={-1}>
        Bringing your room <em>together.</em>
      </h1>
      <div className={styles.visual} aria-hidden="true" aria-busy="true">
        <svg viewBox="0 0 600 365" fill="none">
          <ellipse
            cx="304"
            cy="306"
            rx="193"
            ry="24"
            fill="#7c583d"
            opacity=".07"
          />
          <g className={styles.floor}>
            <path
              d="m104 208 195-105 202 108-194 119Z"
              fill="#d7ba90"
              stroke="#b39670"
            />
            <path
              d="m140 188 202 121m-160-143 201 119m-160-141 199 118m-155-142 197 120"
              stroke="#b39670"
              opacity=".4"
            />
          </g>
          <g className={styles.walls}>
            <path d="M104 208V84L299 9v94Z" fill="#e6d9c5" />
            <path d="M299 9 501 98v113L299 103Z" fill="#d4c3a9" />
            <path d="m104 84 195-75 202 89" stroke="#f9f1e3" strokeWidth="3" />
          </g>
          <g className={styles.window}>
            <path
              d="m367 74 78 35v61l-78-39Z"
              fill="#b6c7bd"
              stroke="#fff7e9"
              strokeWidth="7"
            />
            <path d="m407 94v55" stroke="#fff7e9" strokeWidth="4" />
          </g>
          <g className={styles.bed}>
            <path d="m162 182 88-43 97 54-91 49Z" fill="#f6ecdb" />
            <path
              d="m162 182v31l94 58v-29Zm94 60v29l91-52v-26Z"
              fill="#b7936b"
            />
            <path d="m162 182 88-43v-29l-88 42Z" fill="#c2a884" />
            <path
              d="m175 178 22-11 27 14-23 12Zm29-15 23-11 27 14-24 12Z"
              fill="#fffaf1"
            />
            <path d="m203 206 92-45 52 32-91 49Z" fill="#b68d6c" />
          </g>
          <g className={styles.cabinet}>
            <path d="m350 171 31-16 31 17-31 18Z" fill="#f5ead6" />
            <path
              d="m350 171v34l31 20v-35Zm31 19v35l31-20v-33Z"
              fill="#c6ad89"
            />
            <path d="m352 188 27 16m-14-12 5 3" stroke="#9e7c55" />
          </g>
          <g
            className={styles.scan}
            stroke="#98714d"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M75 131v-20h20m410 20v-20h-20M75 272v20h20m410-20v20h-20" />
            <path d="M88 217h405" strokeDasharray="4 7" opacity=".6" />
          </g>
          <g
            className={styles.spark}
            stroke="#9e7c55"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M457 49v14m-7-7h14M99 259v10m-5-5h10" />
          </g>
        </svg>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {phase === 'preparing'
          ? 'Preparing your photos…'
          : phase === 'drafting'
            ? 'Finding the room and furniture…'
            : 'Opening your studio…'}
      </p>
      <div className={styles.photos} aria-label="Photos being processed">
        {photos.map(
          (photo, index) =>
            photo.previewUrl && (
              <Image
                key={photo.id}
                src={photo.previewUrl}
                alt={`Selected photo ${index + 1}`}
                width={100}
                height={75}
                unoptimized
              />
            ),
        )}
      </div>
      <button type="button" className="glass-control" onClick={onCancel}>
        Cancel
      </button>
    </section>
  );
}
