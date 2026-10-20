import { useSyncExternalStore } from 'react';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './selection-controls.module.css';
import { deleteSelectedFurniture } from './selection-actions';

export function DeleteFurnitureButton({
  controller,
  disabled = false,
  beforeDelete,
}: {
  controller: SessionController;
  disabled?: boolean;
  beforeDelete?: () => void;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const selected = state.workspace?.current.furniture.find(
    (piece) => piece.id === state.presentation.selectedId,
  );
  return (
    <button
      type="button"
      className={styles.deleteButton}
      aria-label="Delete selected piece"
      disabled={
        disabled ||
        !selected ||
        state.phase !== 'editor' ||
        state.comparison !== 'current' ||
        !!state.candidate ||
        state.clientLoadFailure
      }
      onClick={() => {
        beforeDelete?.();
        const current = controller.getSnapshot();
        const result = deleteSelectedFurniture(controller);
        if (!result.ok) {
          controller.notify(failureMessage(result, current.workspace?.current));
          return;
        }
        controller.setPanel('inventory');
        requestAnimationFrame(() => {
          const next = controller.getSnapshot();
          if (
            next.phase === 'editor' &&
            next.generation === current.generation &&
            next.workspace?.workspaceId === current.workspace?.workspaceId &&
            next.presentation.panel === 'inventory' &&
            !next.presentation.selectedId
          )
            document
              .querySelector<HTMLElement>('main h1')
              ?.focus({ preventScroll: true });
        });
      }}
    >
      <svg
        viewBox="0 0 20 20"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <path d="M3.5 5.5h13M7 5.5V3.5h6v2M5 5.5l.7 11h8.6l.7-11M8 8v5.5M12 8v5.5" />
      </svg>
      Delete
    </button>
  );
}

export function SnapToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Snap placement"
      title="Align moves to the placement grid"
      className={styles.snapToggle}
      onClick={() => onChange(!checked)}
    >
      Snap
      <span className={styles.track} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
