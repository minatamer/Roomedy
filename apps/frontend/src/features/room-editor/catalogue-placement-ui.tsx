import { useSyncExternalStore } from 'react';
import type { CataloguePlacement } from './catalogue-placement';
import styles from './catalogue-placement.module.css';

export function CataloguePlacementHint({
  placement,
}: {
  placement: CataloguePlacement;
}) {
  const state = useSyncExternalStore(
    placement.subscribe,
    placement.getSnapshot,
    placement.getSnapshot,
  );
  if (!state) return null;
  return (
    <div className={styles.hint} aria-label="Furniture placement">
      <div role="status">
        <strong>Place {state.entry.label}</strong>
        <span>
          {state.inside && !state.valid
            ? state.error
            : 'Drop or click in the room · R to rotate · Esc to cancel'}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          onClick={() => placement.rotate()}
          aria-label="Rotate new piece 90 degrees"
        >
          ↻
        </button>
        <button onClick={() => placement.cancel()}>Cancel</button>
      </div>
      <span className={styles.keyboard}>
        Arrow keys position · Enter places
      </span>
    </div>
  );
}

export function CataloguePlanGhost({
  placement,
}: {
  placement: CataloguePlacement;
}) {
  const state = useSyncExternalStore(
    placement.subscribe,
    placement.getSnapshot,
    placement.getSnapshot,
  );
  if (!state?.inside) return null;
  const { item, valid } = state,
    w = item.dimensions.width.value!,
    d = item.dimensions.depth.value!;
  return (
    <g
      pointerEvents="none"
      transform={`translate(${item.pose.centerX} ${item.pose.centerZ})`}
      aria-hidden="true"
    >
      <g transform={`rotate(${item.pose.quarterTurns * 90})`}>
        <rect
          x={-w / 2}
          y={-d / 2}
          width={w}
          height={d}
          rx={30}
          fill={valid ? '#8eaa9666' : '#c97f6066'}
          stroke={valid ? '#516b50' : '#9b432e'}
          strokeWidth={30}
          strokeDasharray="70 35"
        />
        <path
          d={`M-90 ${d / 2 - 90}L0 ${d / 2 - 25}L90 ${d / 2 - 90}`}
          fill="none"
          stroke="#43352a"
          strokeWidth={25}
        />
      </g>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={150}
        fill="#43352a"
      >
        {item.label}
      </text>
    </g>
  );
}
