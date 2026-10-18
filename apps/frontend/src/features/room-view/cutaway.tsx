'use client';
import { Component, useCallback, useState } from 'react';
import type { ErrorInfo, ReactNode, MutableRefObject } from 'react';
import { PCFShadowMap } from 'three';
import { Canvas } from '@react-three/fiber';
import { RoomScene } from './scene';
import type { CameraAction, SceneProps } from './scene';
import type { CameraPose } from './adapter';
import { displayRoom, featureBox, pieceRepresentation } from './adapter';
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
};
export default function Cutaway(props: CutawayProps) {
  const [ready, setReady] = useState(false),
    [lost, setLost] = useState(false),
    [assets, setAssets] = useState({ loading: 0, failed: 0 });
  const [action, setAction] = useState<CameraAction | null>(null);
  const onLost = useCallback(() => setLost(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const onNotice = useCallback(
    (loading: number, failed: number) => setAssets({ loading, failed }),
    [],
  );
  const rendered = props.candidate ?? props.room;
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
  const command = (kind: CameraAction['kind']) =>
    setAction((previous) => ({
      kind,
      sequence: (previous?.sequence ?? 0) + 1,
    }));
  return (
    <div className={styles.wrap}>
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
            aria-label={label}
            title={label}
            onClick={() => command(kind)}
            disabled={!ready || lost}
          >
            {text}
          </button>
        ))}
      </div>
      <div className={styles.viewport}>
        {lost ? (
          fallback
        ) : (
          <GraphicsBoundary fallback={fallback} onFailure={() => setLost(true)}>
            <Canvas
              orthographic
              frameloop="demand"
              shadows={{ type: PCFShadowMap }}
              dpr={[1, 1.5]}
              camera={{ position: [7, 7, 9], near: 0.05, far: 200, zoom: 45 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
              fallback={fallback}
              onCreated={({ gl }) => {
                gl.setClearColor('#f7f5f0', 0);
                const canvas = gl.domElement;
                canvas.setAttribute('role', 'img');
                canvas.setAttribute(
                  'aria-label',
                  'Room cutaway. Select furniture with the pointer, or use the furniture list and numeric properties.',
                );
              }}
            >
              <RoomScene
                {...props}
                cameraAction={action}
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
        Drag to orbit · Scroll or pinch to zoom · Select a piece to inspect
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
