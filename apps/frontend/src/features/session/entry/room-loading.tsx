import { Brand } from '../../landing/brand';
import styles from './room-loading.module.css';

/** Shared module/session fallback; the ready owner replaces it immediately. */
export function RoomLoading() {
  return (
    <main id="main-content" className={styles.loading}>
      <div className={styles.content}>
        <div className={styles.identity}>
          <Brand />
        </div>
        <div className={styles.progress} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.status}>Opening your room…</span>
        </div>
      </div>
    </main>
  );
}
