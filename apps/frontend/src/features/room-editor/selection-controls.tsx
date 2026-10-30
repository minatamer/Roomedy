import { useSyncExternalStore } from 'react';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './selection-controls.module.css';
import { canUndo, deleteSelection } from './selection-actions';

export function DeleteSelectionButton({
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
  const piece = state.workspace?.current.furniture.find(
    (piece) => piece.id === state.presentation.selectedId,
  );
  const feature = state.workspace?.current.room.features.find(
    (feature) => feature.id === state.presentation.selectedId,
  );
  return (
    <button
      type="button"
      className={styles.deleteButton}
      aria-label={`Delete selected ${piece ? 'piece' : (feature?.kind ?? 'item')}`}
      disabled={
        disabled ||
        (!piece && (!feature || feature.kind === 'door')) ||
        state.phase !== 'editor' ||
        state.comparison !== 'current' ||
        !!state.candidate ||
        state.clientLoadFailure
      }
      onClick={() => {
        beforeDelete?.();
        const current = controller.getSnapshot();
        const result = deleteSelection(controller);
        if (!result.ok) {
          controller.notify(failureMessage(result, current.workspace?.current));
          return;
        }
        controller.setPanel(piece ? 'inventory' : 'room');
        requestAnimationFrame(() => {
          const next = controller.getSnapshot();
          if (
            next.phase === 'editor' &&
            next.generation === current.generation &&
            next.workspace?.workspaceId === current.workspace?.workspaceId &&
            next.presentation.panel === (piece ? 'inventory' : 'room') &&
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

export function UndoSelectionButton({
  controller,
  onUndo,
  beforeUndo,
  historyTarget = true,
}: {
  controller: SessionController;
  onUndo?: (() => void) | undefined;
  beforeUndo?: (() => void) | undefined;
  historyTarget?: boolean;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const label =
    state.candidate?.source === 'inspector'
      ? 'Undo preview changes'
      : state.undoLabel
        ? `Undo: ${state.undoLabel}`
        : 'Undo last change';
  return (
    <button
      type="button"
      data-room-target={historyTarget ? 'history' : undefined}
      aria-label={label}
      title={canUndo(state) ? label : 'No changes to undo yet'}
      disabled={!canUndo(state)}
      className={styles.undoButton}
      onClick={() => {
        if (!canUndo(controller.getSnapshot())) return;
        beforeUndo?.();
        if (onUndo) onUndo();
        else {
          const result = controller.undo();
          if (!result.ok)
            controller.notify(
              failureMessage(
                result,
                controller.getSnapshot().workspace?.current,
              ),
            );
        }
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
        <path
          d="M7 4 3 8l4 4M3 8h8a5 5 0 0 1 0 10"
          transform="translate(0 -2)"
        />
      </svg>
      Undo
    </button>
  );
}
