import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import type { Furniture } from '@roomedy/contracts/room';
import { findCatalogueEntry, footprint, wallBand } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { FINISH_PALETTE } from '../catalogue/finishes';
import { failureMessage } from '../room-editor/messages';
import { nudgePosition, planBox, pointInPlan, snapPosition } from './adapter';
import styles from '../room-editor/editor.module.css';

type Gesture = {
  id: string;
  pointerId: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetZ: number;
  revision: number;
  target: SVGGElement;
};
type Ghost = { id: string; x: number; z: number };
export function PlanView({
  controller,
  state,
}: {
  controller: SessionController;
  state: SessionSnapshot;
}) {
  const svg = useRef<SVGSVGElement>(null),
    gesture = useRef<Gesture | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const room = state.candidate?.room ?? state.workspace!.current;
  const checks = state.candidate?.checks ?? state.checks!;
  const view = state.presentation;
  const targetBox = planBox(room, view);
  const [box, setBox] = useState(targetBox);
  const renderedBox = useRef(targetBox);
  useEffect(() => {
    const from = renderedBox.current;
    const to = {
      x: targetBox.x,
      z: targetBox.z,
      width: targetBox.width,
      depth: targetBox.depth,
    };
    if (
      from.x === to.x &&
      from.z === to.z &&
      from.width === to.width &&
      from.depth === to.depth
    )
      return;
    const started = performance.now();
    let frame = 0;
    const advance = (time: number) => {
      const progress = Math.min(1, (time - started) / 180),
        ease = 1 - (1 - progress) ** 3;
      const next = {
        x: from.x + (to.x - from.x) * ease,
        z: from.z + (to.z - from.z) * ease,
        width: from.width + (to.width - from.width) * ease,
        depth: from.depth + (to.depth - from.depth) * ease,
      };
      renderedBox.current = next;
      setBox(next);
      if (progress < 1) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [targetBox.x, targetBox.z, targetBox.width, targetBox.depth]);
  const width = room.room.width.value ?? 4200,
    depth = room.room.depth.value ?? 4800;
  const point = (event: PointerEvent) => {
    const rect = svg.current?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0
      ? pointInPlan({ x: event.clientX, y: event.clientY }, rect, box)
      : null;
  };
  const finishGesture = () => {
    const current = gesture.current;
    gesture.current = null;
    setGhost(null);
    if (current?.target.hasPointerCapture(current.pointerId))
      current.target.releasePointerCapture(current.pointerId);
  };
  useEffect(
    () => () => {
      const current = gesture.current;
      gesture.current = null;
      if (current?.target.hasPointerCapture(current.pointerId))
        current.target.releasePointerCapture(current.pointerId);
    },
    [],
  );
  const cancel = () => {
    if (gesture.current) {
      finishGesture();
      controller.notify('Move cancelled. The room is unchanged.');
    }
  };
  const move = (event: PointerEvent<SVGGElement>, item: Furniture) => {
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const p = point(event);
    if (!p) return;
    const position = snapPosition(
      room,
      item,
      { x: p.x - drag.offsetX, z: p.z - drag.offsetZ },
      view.snap,
    );
    setGhost({ id: item.id, ...position });
  };
  const drop = (event: PointerEvent<SVGGElement>, item: Furniture) => {
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const rect = svg.current!.getBoundingClientRect(),
      p = point(event);
    const revision = controller.getSnapshot().workspace?.current.roomRevision;
    if (
      !p ||
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom ||
      revision !== drag.revision
    ) {
      cancel();
      return;
    }
    if (
      Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < 3
    ) {
      finishGesture();
      return;
    }
    const position = snapPosition(
      room,
      item,
      { x: p.x - drag.offsetX, z: p.z - drag.offsetZ },
      view.snap,
    );
    finishGesture();
    // A click without a translation is selection, not a planned-position confirmation.
    if (position.x === item.pose.centerX && position.z === item.pose.centerZ)
      return;
    const result = controller.dispatch(
      [
        {
          type: 'move',
          id: item.id,
          pose: {
            centerX: position.x,
            centerZ: position.z,
            quarterTurns: item.pose.quarterTurns,
          },
        },
      ],
      'Move piece',
    );
    if (!result.ok) controller.notify(failureMessage(result, room));
  };
  const key = (event: KeyboardEvent<SVGGElement>, item: Furniture) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      controller.select(item.id);
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
        event.key,
      ) ||
      event.nativeEvent.isComposing
    )
      return;
    event.preventDefault();
    controller.select(item.id);
    const r = controller.dispatch(
      [
        {
          type: 'move',
          id: item.id,
          pose: nudgePosition(item, event.key, event.shiftKey, event.altKey),
        },
      ],
      'Nudge piece',
    );
    if (!r.ok) controller.notify(failureMessage(r, room));
  };
  const regions = checks.issues
    .filter(
      (issue) =>
        issue.region &&
        issue.severity !== 'unassessed' &&
        (!view.selectedId || issue.objectIds.includes(view.selectedId)),
    )
    .slice(0, 32);
  return (
    <div className={styles.planWrap}>
      <svg
        ref={svg}
        className={styles.plan}
        viewBox={`${box.x} ${box.z} ${box.width} ${box.depth}`}
        role="group"
        aria-label="Precision 2D room plan. Select a piece to inspect it. Arrow keys move the focused piece."
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) controller.select(null);
        }}
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={depth}
          fill={FINISH_PALETTE[room.room.floorFinish]}
          opacity=".24"
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={depth}
          fill="none"
          stroke="#51463d"
          strokeWidth="60"
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={depth}
          fill="none"
          stroke={FINISH_PALETTE[room.room.wallFinish]}
          strokeWidth="35"
        />
        {room.room.features.map((feature) => {
          const r = wallBand(
            room,
            feature,
            feature.kind === 'obstacle' ? (feature.projection.value ?? 1) : 1,
          );
          if (!r) return null;
          const selected = view.selectedId === feature.id;
          return (
            <g
              key={feature.id}
              role="button"
              tabIndex={0}
              aria-label={`${feature.kind}, ${feature.wall} wall, ${feature.width.value ?? 'unknown'} mm wide`}
              aria-pressed={selected}
              className={styles.feature}
              onClick={() => controller.select(feature.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  controller.select(feature.id);
                }
              }}
            >
              {feature.kind === 'door' &&
                feature.mechanism === 'inward' &&
                feature.width.value !== null &&
                (() => {
                  const band = wallBand(room, feature, feature.width.value!);
                  return (
                    band && (
                      <rect
                        x={band.minX}
                        y={band.minZ}
                        width={band.maxX - band.minX}
                        height={band.maxZ - band.minZ}
                        fill="#9a70491a"
                        stroke="#92745a"
                        strokeWidth="12"
                        strokeDasharray="60 40"
                      />
                    )
                  );
                })()}
              <line
                x1={r.minX}
                y1={r.minZ}
                x2={r.maxX}
                y2={r.maxZ}
                stroke={
                  selected
                    ? '#704830'
                    : feature.kind === 'window'
                      ? '#f7f5ef'
                      : '#77634c'
                }
                strokeWidth={selected ? 140 : 100}
              />
              <line
                x1={r.minX}
                y1={r.minZ}
                x2={r.maxX}
                y2={r.maxZ}
                stroke="transparent"
                strokeWidth="300"
              />
              {feature.kind === 'obstacle' && (
                <rect
                  x={r.minX}
                  y={r.minZ}
                  width={r.maxX - r.minX}
                  height={r.maxZ - r.minZ}
                  fill="#9b8978"
                />
              )}
            </g>
          );
        })}
        {room.furniture.map((item) => {
          const w = item.dimensions.width.value,
            d = item.dimensions.depth.value;
          const selected = view.selectedId === item.id;
          const category =
            findCatalogueEntry(item.catalogueId, item.catalogueVersion)
              ?.category ?? 'piece';
          return (
            <g
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${item.label}, ${w ?? 'unknown'} by ${d ?? 'unknown'} mm, ${item.locks.position ? 'position locked' : 'movable'}`}
              className={styles.piece}
              transform={`translate(${item.pose.centerX} ${item.pose.centerZ})`}
              onKeyDown={(e) => key(e, item)}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (event.button !== 0 || gesture.current) return;
                controller.select(item.id);
                if (item.locks.position) {
                  controller.notify(
                    'Position is locked. Unlock it in properties to move this piece.',
                  );
                  return;
                }
                const p = point(event);
                if (!p) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                gesture.current = {
                  id: item.id,
                  pointerId: event.pointerId,
                  clientX: event.clientX,
                  clientY: event.clientY,
                  offsetX: p.x - item.pose.centerX,
                  offsetZ: p.z - item.pose.centerZ,
                  revision: state.workspace!.current.roomRevision,
                  target: event.currentTarget,
                };
              }}
              onPointerMove={(e) => move(e, item)}
              onPointerUp={(e) => drop(e, item)}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
            >
              {w === null || d === null ? (
                <circle
                  r="260"
                  fill="#f1e8da"
                  stroke="#76634d"
                  strokeWidth="20"
                  strokeDasharray="50 35"
                />
              ) : (
                <g transform={`rotate(${item.pose.quarterTurns * 90})`}>
                  <rect
                    x={-w / 2}
                    y={-d / 2}
                    width={w}
                    height={d}
                    rx="35"
                    fill={FINISH_PALETTE[item.finish]}
                    stroke={selected ? '#332b25' : '#5d5147'}
                    strokeWidth={selected ? 35 : 14}
                  />
                  <path
                    d={`M-90 ${d / 2 - 90}L0 ${d / 2 - 25}L90 ${d / 2 - 90}`}
                    fill="none"
                    stroke="#fffaf2"
                    strokeWidth="25"
                  />
                </g>
              )}
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="185"
                fontWeight="600"
                fill={
                  w !== null &&
                  d !== null &&
                  ['charcoal', 'walnut'].includes(item.finish)
                    ? '#fffaf2'
                    : '#302b25'
                }
                pointerEvents="none"
              >
                {category === 'storage'
                  ? item.catalogueId === 'bedside-storage-fixed'
                    ? 'Cabinet'
                    : 'Shelf'
                  : category[0]!.toUpperCase() + category.slice(1)}
                {w === null || d === null ? ' ?' : ''}
              </text>
              {selected && (
                <circle
                  r="75"
                  fill="#fffaf2"
                  stroke="#332b25"
                  strokeWidth="15"
                  cy="-230"
                />
              )}
            </g>
          );
        })}
        {regions.map((issue) => {
          const r = issue.region!;
          return (
            <g key={issue.id} pointerEvents="none">
              <rect
                x={r.minX}
                y={r.minZ}
                width={r.maxX - r.minX}
                height={r.maxZ - r.minZ}
                fill="none"
                stroke="#fffdf6"
                strokeWidth="50"
              />
              <rect
                x={r.minX}
                y={r.minZ}
                width={r.maxX - r.minX}
                height={r.maxZ - r.minZ}
                fill={issue.severity === 'hard' ? '#af4c2f26' : '#80642f20'}
                stroke={issue.severity === 'hard' ? '#9e3f29' : '#80642f'}
                strokeWidth="25"
                strokeDasharray="45 30"
                pointerEvents="none"
              />
            </g>
          );
        })}
        {ghost &&
          (() => {
            const item = room.furniture.find((f) => f.id === ghost.id);
            if (!item) return null;
            const r = footprint({
              ...item,
              pose: { ...item.pose, centerX: ghost.x, centerZ: ghost.z },
            });
            return (
              r && (
                <rect
                  x={r.minX}
                  y={r.minZ}
                  width={r.maxX - r.minX}
                  height={r.maxZ - r.minZ}
                  fill="#fffaf244"
                  stroke="#4c3a2c"
                  strokeWidth="30"
                  strokeDasharray="60 40"
                  pointerEvents="none"
                />
              )
            );
          })()}
        <text
          x={width / 2}
          y={-170}
          textAnchor="middle"
          fontSize="170"
          fill="#51463d"
          stroke="#fffdf9"
          strokeWidth="40"
          paintOrder="stroke"
          pointerEvents="none"
        >
          {room.room.width.value === null
            ? 'Width unknown'
            : `${width} mm · ${room.room.width.status}`}
        </text>
        <text
          x={-180}
          y={depth / 2}
          textAnchor="middle"
          fontSize="170"
          fill="#51463d"
          stroke="#fffdf9"
          strokeWidth="40"
          paintOrder="stroke"
          pointerEvents="none"
          transform={`rotate(-90 -180 ${depth / 2})`}
        >
          {room.room.depth.value === null
            ? 'Depth unknown'
            : `${depth} mm · ${room.room.depth.status}`}
        </text>
      </svg>
      <p className={styles.planHint}>
        {ghost
          ? `Planned centre: ${ghost.x}, ${ghost.z} mm · release to validate`
          : 'Drag to place · arrow keys to nudge · dimensions in mm'}
      </p>
      {(room.room.width.value === null || room.room.depth.value === null) && (
        <p className={styles.notice}>
          Outline is illustrative until width and depth are measured.
        </p>
      )}
    </div>
  );
}
