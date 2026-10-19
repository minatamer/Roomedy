'use client';
import Image from 'next/image';
import styles from './demo.module.css';

/** One static decorative photograph; no landing scene, frame loop or room state. */
export function DemoAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true" data-demo-atmosphere>
      <picture>
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
    </div>
  );
}
