import { useEffect, useRef } from 'react';
import styles from '../../room-editor/editor.module.css';
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
      className={styles.projectDialog}
      aria-labelledby="entry-recovery-title"
      onCancel={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <h2 id="entry-recovery-title">Your saved room is here.</h2>
      <p>
        Continue to keep working or export it. Starting fresh replaces the saved
        room in this tab.
      </p>
      <div className={styles.actionRow}>
        <button onClick={onContinue}>Continue saved room</button>
        <button className={styles.primary} onClick={onStart}>
          {photos ? 'Start with photos' : 'Build this room'}
        </button>
      </div>
    </dialog>
  );
}
