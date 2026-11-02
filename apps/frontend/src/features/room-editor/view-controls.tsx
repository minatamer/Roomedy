import type { ReactNode } from 'react';
import type { SessionController } from '../session/controller';
import {
  DeleteSelectionButton,
  UndoSelectionButton,
} from './selection-controls';
import styles from './view-controls.module.css';

export function ViewControls({
  controller,
  arranging,
  ready = true,
  readOnly,
  rotationLocked,
  onRotate,
  onUndo,
  beforeUndo,
  historyTarget = true,
  onZoom,
  onFit,
  zoomOutDisabled = false,
  zoomInDisabled = false,
  beforeDelete,
  children,
}: {
  controller: SessionController;
  arranging: boolean;
  ready?: boolean;
  readOnly: boolean;
  rotationLocked: boolean;
  onRotate: (direction: -1 | 1) => void;
  onUndo?: (() => void) | undefined;
  beforeUndo?: (() => void) | undefined;
  historyTarget?: boolean;
  onZoom: (direction: -1 | 1) => void;
  onFit: () => void;
  zoomOutDisabled?: boolean;
  zoomInDisabled?: boolean;
  beforeDelete?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      <div
        role="group"
        aria-label="View navigation"
        className={`${styles.tools} ${styles.navigation}`}
      >
        <button
          aria-label="Zoom out"
          disabled={!ready || zoomOutDisabled}
          onClick={() => onZoom(-1)}
        >
          −
        </button>
        <button
          aria-label="Zoom in"
          disabled={!ready || zoomInDisabled}
          onClick={() => onZoom(1)}
        >
          +
        </button>
        <button disabled={!ready} onClick={onFit}>
          Fit room
        </button>
      </div>
      {children}
      <div
        role="group"
        aria-label="Furniture placement"
        className={styles.tools}
      >
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            aria-label={`Rotate selected piece 90 degrees ${direction === -1 ? 'counterclockwise' : 'clockwise'}`}
            disabled={!ready || readOnly || !arranging || rotationLocked}
            onClick={() => onRotate(direction)}
          >
            {direction === -1 ? '↶' : '↷'} 90°
          </button>
        ))}
        <DeleteSelectionButton
          controller={controller}
          disabled={!ready || readOnly}
          beforeDelete={() => beforeDelete?.()}
        />
        <UndoSelectionButton
          controller={controller}
          onUndo={onUndo}
          beforeUndo={beforeUndo}
          historyTarget={historyTarget}
        />
      </div>
    </div>
  );
}

export function FrameControls({
  view,
  onView,
  children,
}: {
  view: 'plan' | 'cutaway';
  onView: (view: 'plan' | 'cutaway') => void;
  children?: ReactNode;
}) {
  return (
    <>
      {children && (
        <div
          className={`${styles.frameControls} ${styles.environmentControls}`}
        >
          {children}
        </div>
      )}
      <div className={styles.frameControls}>
        <div
          role="group"
          aria-label="Room view"
          className={styles.viewSwitch}
          data-view={view}
        >
          <span className={styles.viewThumb} aria-hidden="true" />
          <button aria-pressed={view === 'plan'} onClick={() => onView('plan')}>
            2D
          </button>
          <button
            aria-pressed={view === 'cutaway'}
            onClick={() => onView('cutaway')}
          >
            3D
          </button>
        </div>
      </div>
    </>
  );
}
