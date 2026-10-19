'use client';
import { Component, useCallback, useMemo, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode, MutableRefObject } from 'react';
import { PCFShadowMap } from 'three';
import { Canvas } from '@react-three/fiber';
import { RoomScene } from './scene';
import type { CameraAction, SceneProps } from './scene';
import type { CameraPose, CameraView } from './adapter';
import { cameraViewPose } from './camera';
import { displayRoom, featureBox, pieceRepresentation } from './adapter';
import { useSurfaceMotion } from '../room-editor/use-surface-motion';
import { useFloorEdit } from './use-floor-edit';
import type { SessionController } from '../session/controller';
import styles from './room-view.module.css';

class GraphicsBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure();
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export type CutawayProps = Pick<
  SceneProps,
  'room' | 'candidate' | 'checks' | 'selectedId' | 'onSelect' | 'cameraFrame'
> & {
  cameraStateRef: MutableRefObject<CameraPose | null>;
  onPlan: () => void;
  openedAt: number;
  controller: SessionController;
  readOnly: boolean;
  snap: boolean;
};
export default function Cutaway({
  controller,
  readOnly,
  snap,
  ...props
}: CutawayProps) {
  const [ready, setReady] = useState(false),
    [lost, setLost] = useState(false),
    [assets, setAssets] = useState({ loading: 0, failed: 0 });
  const [action, setAction] = useState<CameraAction | null>(null);
  const [cameraView, setCameraView] = useState<CameraView>(
    props.cameraStateRef.current?.view ?? 'overview',
  );
  const [interaction, setInteraction] = useState<'explore' | 'move'>('explore');
  const moving = interaction === 'move' && !readOnly && !lost;
  const canvasRef = useRef<HTMLCanvasElement | null>(null),
    invalidateRef = useRef<() => void>(() => {});
  const invalidate = useCallback(() => invalidateRef.current(), []);
  const editing = useFloorEdit(
    controller,
    moving && ready && !lost,
    ready && !lost,
    snap,
    canvasRef,
    invalidate,
  );
  const toolsMotion = useSurfaceMotion(String(moving));
  const selectedPiece = props.room.furniture.find(
    (p) => p.id === props.selectedId,
  );
  const onLost = useCallback(() => {
    editing.cancel();
    setLost(true);
  }, [editing, setLost]);
  const onReady = useCallback(() => setReady(true), [setReady]);
  const onNotice = useCallback(
    (loading: number, failed: number) => setAssets({ loading, failed }),
    [setAssets],
  );
  const rendered = props.candidate ?? props.room;
  const views = useMemo(
    () =>
      (
        [
          ['overview', 'Overview'],
          ['doorway', 'Doorway'],
          ['work-area', 'Work area'],
          ['corner', 'Corner'],
        ] as const
      ).map(([view, label]) => ({
        view,
        label,
        available: !!cameraViewPose(rendered, view),
      })),
    [rendered],
  );
  const incompleteFeatures = rendered.room.features.some(
    (feature) => featureBox(rendered, feature) === null,
  );
  const unavailable = rendered.furniture.filter((p) => {
    const r = pieceRepresentation(p);
    return r.kind === 'unavailable' || (r.kind === 'procedural' && r.notice);
  }).length;
  const fallback = (
    <div className={styles.fallback} role="status">
      <h2>Continue in the 2D plan.</h2>
      <p>
        The 3D view is unavailable here. Your room and measurements are still
        ready to edit.
      </p>
      <button onClick={props.onPlan}>Open 2D plan</button>
    </div>
  );
  const command = (kind: CameraAction['kind']) => {
    editing.cancel();
    if (kind === 'reset') setCameraView('overview');
    else if (views.some((v) => v.view === kind))
      setCameraView(kind as CameraView);
    setAction((previous) => ({
      kind,
      sequence: (previous?.sequence ?? 0) + 1,
    }));
  };
  return (
    <div className={styles.wrap}>
      <div ref={toolsMotion} className="motion-surface">
        <div className="motion-flow">
          <div
            role="group"
            aria-label="Room viewpoints"
            className={styles.tools}
          >
            {views.map(({ view, label, available }) => (
              <button
                key={view}
                aria-pressed={cameraView === view}
                disabled={!ready || lost || !available}
                title={
                  available
                    ? label
                    : `${label} needs a clear position in this room`
                }
                onClick={() => command(view)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="3D interaction"
            className={styles.tools}
          >
            <button
              aria-pressed={!moving}
              disabled={!ready || lost}
              onClick={() => {
                editing.cancel();
                setInteraction('explore');
              }}
            >
              Explore view
            </button>
            <button
              aria-pressed={moving}
              disabled={readOnly || !ready || lost}
              onClick={() => {
                editing.cancel();
                setInteraction('move');
              }}
            >
              Move furniture
            </button>
          </div>
          {moving ? (
            <div
              role="group"
              aria-label="3D placement controls"
              className={styles.tools}
            >
              <button
                aria-label="Rotate selected piece 90 degrees"
                disabled={
                  !editing.enabled ||
                  !selectedPiece ||
                  selectedPiece.locks.rotation
                }
                onClick={editing.rotate}
              >
                Rotate 90°
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={snap}
                  onChange={(e) => {
                    editing.cancel();
                    controller.setView({ snap: e.target.checked });
                  }}
                  aria-label="Snap 3D placement"
                />{' '}
                Snap
              </label>
            </div>
          ) : (
            <div
              role="group"
              aria-label="3D camera controls"
              className={styles.tools}
            >
              {(
                [
                  ['left', 'Orbit left', '↶'],
                  ['right', 'Orbit right', '↷'],
                  ['up', 'Orbit up', '↑'],
                  ['down', 'Orbit down', '↓'],
                  ['out', 'Zoom 3D out', '−'],
                  ['in', 'Zoom 3D in', '+'],
                  ['reset', 'Reset camera', 'Reset'],
                ] as const
              ).map(([kind, label, text]) => (
                <button
                  key={kind}
                  aria-label={
                    cameraView === 'overview'
                      ? label
                      : label.replace('Orbit', 'Look')
                  }
                  title={
                    cameraView === 'overview'
                      ? label
                      : label.replace('Orbit', 'Look')
                  }
                  onClick={() => command(kind)}
                  disabled={!ready || lost}
                >
                  {text}
                </button>
              ))}
              {cameraView !== 'overview' && (
                <>
                  <button
                    onClick={() => command('forward')}
                    disabled={!ready || lost}
                  >
                    Step forward
                  </button>
                  <button
                    onClick={() => command('backward')}
                    disabled={!ready || lost}
                  >
                    Step back
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.viewport} data-mode={moving ? 'move' : 'explore'}>
        {lost ? (
          fallback
        ) : (
          <GraphicsBoundary fallback={fallback} onFailure={onLost}>
            <Canvas
              frameloop="demand"
              shadows={{ type: PCFShadowMap }}
              dpr={[1, 1.5]}
              camera={{ position: [7, 7, 9], near: 0.05, far: 200, fov: 50 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
              fallback={fallback}
              onCreated={({ gl, invalidate }) => {
                gl.setClearColor('#f7f5f0', 0);
                const canvas = gl.domElement;
                canvasRef.current = canvas;
                invalidateRef.current = invalidate;
                canvas.tabIndex = 0;
                canvas.setAttribute('role', 'img');
                canvas.setAttribute(
                  'aria-label',
                  'Room in 3D. Arrow keys look around; plus and minus zoom. Inside the room, W A S D move. Select furniture to inspect.',
                );
              }}
            >
              <RoomScene
                {...props}
                cameraAction={action}
                cameraView={cameraView}
                editing={editing}
                onReady={onReady}
                onLost={onLost}
                onNotice={onNotice}
              />
            </Canvas>
          </GraphicsBoundary>
        )}
        {!ready && !lost && (
          <p role="status" className={styles.loading}>
            Opening the cutaway…
          </p>
        )}
      </div>
      <p className={styles.hint}>
        {moving
          ? 'Drag a piece to place · Arrow keys nudge · R rotates · Esc cancels'
          : cameraView === 'overview'
            ? 'Drag to orbit'
            : 'Drag to look · W A S D to move'}{' '}
        {moving
          ? '· Scroll to zoom'
          : '· Scroll or pinch to zoom · Select a piece to inspect'}
      </p>
      {(assets.loading > 0 ||
        assets.failed > 0 ||
        unavailable > 0 ||
        incompleteFeatures ||
        displayRoom(rendered).approximate ||
        props.candidate) && (
        <p role="status" className={styles.notice}>
          {assets.loading > 0 ? 'Loading furniture detail. ' : ''}
          {assets.failed > 0
            ? 'Some model detail could not load; simple shapes preserve the same sizes. '
            : ''}
          {unavailable > 0
            ? 'Some pieces use simple bounds or await dimensions; inspect their properties. '
            : ''}
          {displayRoom(rendered).approximate
            ? 'Room height or outline is approximate. '
            : ''}
          {incompleteFeatures
            ? 'Some openings or obstacles await measurements; review them in the plan. '
            : ''}
          {props.candidate
            ? 'Preview: outlined shapes mark changes; pale outlines show the current arrangement.'
            : ''}
        </p>
      )}
    </div>
  );
}
