import type { ReactNode } from 'react';
import type { SessionController } from '../session/controller';
import { DeleteSelectionButton, SnapToggle } from './selection-controls';
import styles from './view-controls.module.css';

export function ViewControls({
  controller,
  arranging,
  onArrange,
  ready = true,
  readOnly,
  rotationLocked,
  onRotate,
  snap,
  onSnap,
  onZoom,
  onFit,
  zoomOutDisabled = false,
  zoomInDisabled = false,
  beforeDelete,
  children,
}: {
  controller: SessionController;
  arranging: boolean;
  onArrange: (arranging: boolean) => void;
  ready?: boolean;
  readOnly: boolean;
  rotationLocked: boolean;
  onRotate: (direction: -1 | 1) => void;
  snap: boolean;
  onSnap: (snap: boolean) => void;
  onZoom: (direction: -1 | 1) => void;
  onFit: () => void;
  zoomOutDisabled?: boolean;
  zoomInDisabled?: boolean;
  beforeDelete?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      <div role="group" aria-label="Room interaction" className={styles.tools}>
        <button
          aria-pressed={!arranging}
          disabled={!ready}
          onClick={() => onArrange(false)}
        >
          Explore view
        </button>
        <button
          aria-pressed={arranging}
          disabled={!ready || readOnly}
          onClick={() => onArrange(true)}
        >
          Arrange room
        </button>
      </div>
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
        <SnapToggle checked={snap} onChange={onSnap} />
      </div>
    </div>
  );
}

export function FrameControls({
  view,
  onView,
}: {
  view: 'plan' | 'cutaway';
  onView: (view: 'plan' | 'cutaway') => void;
}) {
  return (
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
  );
}
