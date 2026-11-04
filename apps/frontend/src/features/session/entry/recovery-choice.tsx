import { useEffect, useRef } from 'react';
import styles from './recovery-choice.module.css';
/** A fresh entry choice never silently replaces accepted tab recovery. */
export function RecoveryChoice({
  photos,
  onContinue,
  onStart,
}: {
  photos: boolean;
  onContinue: () => void;
  onStart: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.dialog} roomedy-scroll`}
      aria-labelledby="entry-recovery-title"
      aria-describedby="entry-recovery-description entry-recovery-note"
      onCancel={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <div className={styles.roomMark} aria-hidden="true">
        <svg
          width="30"
          height="30"
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          <path d="M6 25V7h11l9 7v11H6ZM6 7l9 7h11M15 14v11M19 25v-7h4v7" />
        </svg>
      </div>
      <p className={styles.eyebrow}>Your saved room</p>
      <h2 id="entry-recovery-title" className={styles.title}>
        Pick up where you left off.
      </h2>
      <p id="entry-recovery-description" className={styles.description}>
        Your design and both conversations are saved in this tab, ready to
        continue.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className="button primary"
          onClick={onContinue}
          autoFocus
        >
          <span>Continue saved room</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          className={`button ${styles.start}`}
          onClick={onStart}
        >
          <span>{photos ? 'Start with photos' : 'Start a new room'}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <p id="entry-recovery-note" className={styles.note}>
        Starting fresh replaces the saved room in this tab.
      </p>
    </dialog>
  );
}
