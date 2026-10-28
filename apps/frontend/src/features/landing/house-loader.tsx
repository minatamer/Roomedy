import styles from './landing.module.css';

/** A small code-native house assembles only while the real room is preparing. */
export function HouseLoader() {
  return (
    <div
      className={styles.houseLoader}
      role="status"
      aria-label="Preparing your 3D room"
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.loaderOutline}
          d="m37 104 43 23 43-23V68L94 44 66 36 37 68v36Zm0-36 43 23 43-23M80 91v36M66 36l20 61"
        />
        <path
          className={styles.loaderGuide}
          d="m22 110 58 31 58-31-58-31-58 31Z"
        />
        <g className={styles.loaderBase}>
          <path d="m37 104 43 23 43-23-43-23-43 23Z" fill="#ddc9a9" />
          <path d="m37 104 43 23 43-23M80 127v-8" />
        </g>
        <g className={styles.loaderWallLeft}>
          <path d="M37 104V68l43 23v36l-43-23Z" fill="#eee2cd" />
          <path d="M49 110V89l13 7v21M37 68v36l43 23V91L37 68Z" />
        </g>
        <g className={styles.loaderWallRight}>
          <path d="M80 127V91l43-23v36l-43 23Z" fill="#c9b28f" />
          <path d="M80 127V91l43-23v36l-43 23ZM94 91v13l14-8V83l-14 8Z" />
        </g>
        <g className={styles.loaderRoof}>
          <path d="m30 67 36-31 64 34-44 27-56-30Z" fill="#dfc49e" />
          <path d="m66 36 28 8 36 26M66 36l20 61m-56-30 36-31 64 34-44 27-56-30Z" />
        </g>
      </svg>
      <span className={styles.loaderCaption}>Making room</span>
    </div>
  );
}
