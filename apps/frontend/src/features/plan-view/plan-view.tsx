import {
  featureLabel,
  furnitureByElevation,
  projectedLabelVisible,
} from '@roomedy/spatial';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import type { Feature, Furniture } from '@roomedy/contracts/room';
import {
  findCatalogueEntry,
  footprint,
  wallBand,
  checkRoom,
} from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { comparisonFrame } from '../session/state';
import { FINISH_PALETTE } from '../catalogue/finishes';
import { roomSurface } from '@roomedy/contracts/surfaces';
import { failureMessage } from '../room-editor/messages';
import {
  nudgePosition,
  planBox,
  planLabelLayout,
  planOpeningLabel,
  planFurnitureName,
  planPreviousLabelVisible,
  pointInPlan,
  snapPosition,
} from './adapter';
import type { PlanLabelLayout } from './adapter';
import styles from '../room-editor/editor.module.css';
import type { CataloguePlacement } from '../room-editor/catalogue-placement';
import { CataloguePlanGhost } from '../room-editor/catalogue-placement-ui';
import {
  beginWindowEdit,
  clampWindowOffset,
  nudgeWindowOffset,
  roomWithWindowPreview,
} from '../room-view/window-manipulation';
import type {
  WindowEdit,
  WindowPosition,
} from '../room-view/window-manipulation';

type Gesture = {
  id: string;
  pointerId: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetZ: number;
  revision: number;
  target: SVGGElement;
  viewport: { left: number; top: number; width: number; height: number };
  viewBox: string;
};
type WindowGesture = Pick<
  Gesture,
  'pointerId' | 'clientX' | 'clientY' | 'target' | 'viewport' | 'viewBox'
> & { edit: WindowEdit; grab: number };
type Ghost = { id: string; x: number; z: number };
const noSubscribe = () => () => {};
const noEntry = () => null;
function OrientedFootprint({
  item,
  selected,
}: {
  item: Furniture;
  selected: boolean;
}) {
  const quarter = useRef(item.pose.quarterTurns);
  const [angle, setAngle] = useState(item.pose.quarterTurns * 90);
  useLayoutEffect(() => {
    const difference = ((item.pose.quarterTurns - quarter.current + 6) % 4) - 2;
    quarter.current = item.pose.quarterTurns;
    if (difference) setAngle((previous) => previous + difference * 90);
  }, [item.pose.quarterTurns]);
  const w = item.dimensions.width.value,
    d = item.dimensions.depth.value;
  if (w === null || d === null) return null;
  return (
    <g className={styles.pieceFootprint} transform={`rotate(${angle})`}>
      <rect
        x={-w / 2}
        y={-d / 2}
        width={w}
        height={d}
        rx="35"
        fill={
          findCatalogueEntry(item.catalogueId, item.catalogueVersion)
            ?.category === 'tv'
            ? '#282b2a'
            : FINISH_PALETTE[item.finish]
        }
        stroke={selected ? '#332b25' : '#5d5147'}
        strokeWidth={selected ? 35 : 14}
      />
      <path
        d={
          d < 250
            ? `M-90 ${d / 2 + 40}L0 ${d / 2 + 110}L90 ${d / 2 + 40}`
            : `M-90 ${d / 2 - 90}L0 ${d / 2 - 25}L90 ${d / 2 - 90}`
        }
        fill="none"
        stroke="#fffaf2"
        strokeWidth="25"
      />
    </g>
  );
}
function PlanLabel({
  layout,
  fill = '#302b25',
  halo = false,
  moving = false,
  onSelect,
}: {
  layout: PlanLabelLayout;
  fill?: string;
  halo?: boolean;
  moving?: boolean;
  onSelect?: (() => void) | undefined;
}) {
  return (
    <g
      className={styles.pieceLabel}
      transform={`translate(${layout.x} ${layout.y}) rotate(${layout.rotation})`}
      fontSize={layout.fontSize}
      style={moving ? { transition: 'none' } : undefined}
      aria-hidden="true"
      pointerEvents={onSelect ? 'visiblePainted' : 'none'}
      onPointerDown={
        onSelect
          ? (event) => {
              event.stopPropagation();
              if (event.button === 0) onSelect();
            }
          : undefined
      }
    >
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="600"
        fill={layout.outside ? '#302b25' : fill}
        stroke={halo || layout.outside ? '#fff8ee' : undefined}
        strokeWidth={halo || layout.outside ? 35 : undefined}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {layout.lines.map((line, index) => (
          <tspan
            key={index}
            x={0}
            y={(index - (layout.lines.length - 1) / 2) * layout.fontSize * 1.15}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
export function PlanView({
  controller,
  state,
  placement,
  arranging = true,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  placement?: CataloguePlacement;
  arranging?: boolean;
}) {
  const adding = useSyncExternalStore(
    placement?.subscribe ?? noSubscribe,
    placement?.getEntry ?? noEntry,
    noEntry,
  );
  const svg = useRef<SVGSVGElement>(null),
    gesture = useRef<Gesture | null>(null),
    windowGesture = useRef<WindowGesture | null>(null);
  const descriptionId = useId();
  const [movementGhost, setGhost] = useState<Ghost | null>(null);
  const [windowGhost, setWindowGhost] = useState<WindowPosition | null>(null);
  const before = state.comparison === 'before',
    readOnly =
      before || !!state.candidate || state.clientLoadFailure || !!adding;
  const ghost = readOnly || !arranging ? null : movementGhost;
  const canonicalRoom = before
    ? state.workspace!.baseline
    : (state.candidate?.room ?? state.workspace!.current);
  const room = roomWithWindowPreview(
    canonicalRoom,
    readOnly || !arranging ? null : windowGhost,
  );
  const checks = before
    ? checkRoom(room)
    : (state.candidate?.checks ?? state.checks!);
  const view = state.presentation;
  const targetBox = planBox(room, view, comparisonFrame(state.workspace!));
  const [box, setBox] = useState(targetBox);
  const renderedBox = useRef(targetBox);
  useEffect(() => {
    const element = svg.current;
    if (!placement || !element) return;
    return placement.registerTarget({
      element,
      point: (client) =>
        pointInPlan(
          client,
          element.getBoundingClientRect(),
          renderedBox.current,
        ),
    });
  }, [placement]);
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
  const escapeSelection = () => {
    if (windowGesture.current) windowGesture.current.edit.cancel();
    else if (gesture.current) cancel();
    else controller.select(null);
  };
  const sameViewport = (drag: Pick<Gesture, 'viewport' | 'viewBox'>) => {
    const rect = svg.current?.getBoundingClientRect();
    return (
      !!rect &&
      (['left', 'top', 'width', 'height'] as const).every(
        (axis) => Math.abs(rect[axis] - drag.viewport[axis]) <= 1,
      ) &&
      drag.viewBox === `${box.x} ${box.z} ${box.width} ${box.depth}`
    );
  };
  const finishWindow = () => {
    const old = windowGesture.current;
    windowGesture.current = null;
    setWindowGhost(null);
    if (old?.target.hasPointerCapture(old.pointerId))
      old.target.releasePointerCapture(old.pointerId);
  };
  useEffect(() => {
    const stop = () => windowGesture.current?.edit.cancel();
    const second = (event: globalThis.PointerEvent) => {
      if (
        windowGesture.current &&
        event.pointerId !== windowGesture.current.pointerId
      ) {
        event.preventDefault();
        event.stopPropagation();
        stop();
      }
    };
    window.addEventListener('blur', stop);
    window.addEventListener('scroll', stop, true);
    window.addEventListener('resize', stop);
    window.addEventListener('pointerdown', second, true);
    return () => {
      stop();
      window.removeEventListener('blur', stop);
      window.removeEventListener('scroll', stop, true);
      window.removeEventListener('resize', stop);
      window.removeEventListener('pointerdown', second, true);
    };
  }, [controller]);
  useEffect(() => {
    if (!arranging) {
      const current = gesture.current;
      gesture.current = null;
      if (current?.target.hasPointerCapture(current.pointerId))
        current.target.releasePointerCapture(current.pointerId);
      windowGesture.current?.edit.cancel();
      let live = true;
      queueMicrotask(() => {
        if (live) setGhost(null);
      });
      return () => {
        live = false;
      };
    }
  }, [arranging]);
  const windowDown = (event: PointerEvent<SVGGElement>, feature: Feature) => {
    if (
      feature.kind !== 'window' ||
      !arranging ||
      readOnly ||
      event.button !== 0 ||
      !event.isPrimary ||
      gesture.current ||
      windowGesture.current
    )
      return;
    event.stopPropagation();
    controller.select(feature.id);
    const p = point(event),
      edit = beginWindowEdit(controller, feature.id, finishWindow);
    if (
      !p ||
      !edit ||
      edit.feature !==
        canonicalRoom.room.features.find((f) => f.id === feature.id)
    ) {
      edit?.cancel();
      controller.notify(
        'Review the window width, position and wall measurements before moving it.',
      );
      return;
    }
    const along =
      feature.wall === 'north' || feature.wall === 'south' ? p.x : p.z;
    let displayedOffset = feature.offset.value!;
    const transform = getComputedStyle(event.currentTarget).transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      const value =
        feature.wall === 'north' || feature.wall === 'south'
          ? matrix.m41
          : matrix.m42;
      if (Number.isFinite(value)) displayedOffset = value;
    }
    windowGesture.current = {
      edit,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      grab: along - displayedOffset,
      target: event.currentTarget,
      viewport: svg.current!.getBoundingClientRect(),
      viewBox: `${box.x} ${box.z} ${box.width} ${box.depth}`,
    };
    setWindowGhost({ id: feature.id, offset: displayedOffset });
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const windowMove = (event: PointerEvent<SVGGElement>, drop = false) => {
    const old = windowGesture.current;
    if (!old || event.pointerId !== old.pointerId) return;
    event.stopPropagation();
    if (!old.edit.current() || !sameViewport(old)) {
      old.edit.cancel();
      return;
    }
    if (
      Math.hypot(event.clientX - old.clientX, event.clientY - old.clientY) < 3
    ) {
      if (drop) old.edit.cancel();
      return;
    }
    const p = point(event);
    if (!p) {
      if (drop) old.edit.cancel();
      return;
    }
    const feature = old.edit.feature,
      along = feature.wall === 'north' || feature.wall === 'south' ? p.x : p.z;
    const offset = clampWindowOffset(
      old.edit.room,
      feature,
      along - old.grab,
      view.snap,
    );
    if (offset === null) {
      old.edit.cancel();
      return;
    }
    if (drop) {
      const result = old.edit.commit(offset);
      if (!result.ok) controller.notify(failureMessage(result, old.edit.room));
    } else setWindowGhost({ id: feature.id, offset });
  };
  const move = (event: PointerEvent<SVGGElement>, item: Furniture) => {
    if (readOnly || !arranging) return;
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!sameViewport(drag)) {
      cancel();
      return;
    }
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
    if (!controller.canEdit() || !arranging) {
      finishGesture();
      return;
    }
    const drag = gesture.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const p = point(event);
    const revision = controller.getSnapshot().workspace?.current.roomRevision;
    if (!p || !sameViewport(drag) || revision !== drag.revision) {
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
    if (readOnly || !arranging) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        controller.select(item.id);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      escapeSelection();
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
        issue.rule !== 'front-access' &&
        issue.severity !== 'unassessed' &&
        (!view.selectedId || issue.objectIds.includes(view.selectedId)),
    )
    .slice(0, 32);
  return (
    <div className={styles.planWrap}>
      <svg
        ref={svg}
        tabIndex={adding || !arranging ? 0 : undefined}
        className={styles.plan}
        viewBox={`${box.x} ${box.z} ${box.width} ${box.depth}`}
        role="group"
        aria-describedby={descriptionId}
        aria-label={
          before
            ? 'Before room plan. Read-only. Select a piece to inspect it.'
            : state.candidate
              ? 'Proposed 2D room plan. Select a piece to inspect the preview. Current is unchanged.'
              : arranging
                ? 'Precision 2D room plan. Select a piece to inspect it. Arrow keys move the focused piece.'
                : 'Precision 2D room plan. Explore view. Select a piece to inspect it. Arrow keys pan.'
        }
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            escapeSelection();
            return;
          }
          if (
            arranging ||
            event.nativeEvent.isComposing ||
            event.ctrlKey ||
            event.metaKey
          )
            return;
          const delta = {
            ArrowLeft: [-250, 0],
            ArrowRight: [250, 0],
            ArrowUp: [0, -250],
            ArrowDown: [0, 250],
          }[event.key];
          if (!delta) return;
          event.preventDefault();
          controller.setView({
            panX: view.panX + delta[0]!,
            panZ: view.panZ + delta[1]!,
          });
        }}
        onPointerDown={(event) => {
          if (!(event.target as Element).closest('[role="button"]'))
            controller.select(null);
        }}
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={depth}
          fill={roomSurface(room.room, 'floor').color}
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
          stroke={roomSurface(room.room, 'walls').color}
          strokeWidth="35"
        />
        {/* Previous positions stay behind the current room and its names. */}
        {state.candidate &&
          state
            .workspace!.current.furniture.filter((before) => {
              const after = state.candidate!.room.furniture.find(
                (p) => p.id === before.id,
              );
              return (
                !after ||
                after.pose.centerX !== before.pose.centerX ||
                after.pose.centerZ !== before.pose.centerZ ||
                after.pose.quarterTurns !== before.pose.quarterTurns
              );
            })
            .map((before) => {
              const box = footprint(before);
              if (!box) return null;
              return (
                <g key={`previous-${before.id}`} pointerEvents="none">
                  <rect
                    x={box.minX}
                    y={box.minZ}
                    width={box.maxX - box.minX}
                    height={box.maxZ - box.minZ}
                    className={styles.previousPiece}
                  />
                  {planPreviousLabelVisible(room, before) && (
                    <text
                      x={before.pose.centerX}
                      y={before.pose.centerZ}
                      textAnchor="middle"
                      fontSize="110"
                      fill="#775b43"
                    >
                      Previous position
                    </text>
                  )}
                </g>
              );
            })}
        {room.room.features.map((feature) => {
          const r = wallBand(
            room,
            feature.kind === 'window' && feature.offset.value !== null
              ? {
                  ...feature,
                  offset: {
                    value: 0,
                    status: 'estimated',
                    sourceId: 'display-origin',
                  },
                }
              : feature,
            feature.kind === 'obstacle' ? (feature.projection.value ?? 1) : 1,
          );
          if (!r) return null;
          const selected = view.selectedId === feature.id;
          return (
            <g
              key={feature.id}
              role="button"
              tabIndex={0}
              aria-label={`${featureLabel(feature).toLowerCase()}, ${feature.wall} wall, ${feature.width.value ?? 'unknown'} mm wide`}
              aria-pressed={selected}
              className={styles.feature}
              style={
                feature.kind === 'window'
                  ? {
                      transform: `translate(${feature.wall === 'north' || feature.wall === 'south' ? feature.offset.value : 0}px, ${feature.wall === 'east' || feature.wall === 'west' ? feature.offset.value : 0}px)`,
                      transition:
                        windowGhost?.id === feature.id
                          ? 'none'
                          : 'transform 180ms cubic-bezier(.2,.75,.2,1)',
                      cursor:
                        readOnly || !arranging
                          ? 'pointer'
                          : feature.wall === 'north' || feature.wall === 'south'
                            ? 'ew-resize'
                            : 'ns-resize',
                    }
                  : undefined
              }
              onPointerDown={(event) => windowDown(event, feature)}
              onPointerMove={(event) => windowMove(event)}
              onPointerUp={(event) => windowMove(event, true)}
              onPointerCancel={() => windowGesture.current?.edit.cancel()}
              onLostPointerCapture={() => windowGesture.current?.edit.cancel()}
              onClick={() => {
                if (!gesture.current && !windowGesture.current)
                  controller.select(feature.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.stopPropagation();
                  escapeSelection();
                  return;
                }
                if (
                  feature.kind === 'window' &&
                  arranging &&
                  !readOnly &&
                  !e.nativeEvent.isComposing &&
                  !e.ctrlKey &&
                  !e.metaKey &&
                  e.key.startsWith('Arrow')
                ) {
                  e.preventDefault();
                  if (windowGesture.current) return;
                  controller.select(feature.id);
                  const offset = nudgeWindowOffset(
                    canonicalRoom,
                    feature,
                    e.key,
                    e.shiftKey,
                    e.altKey,
                  );
                  const edit = beginWindowEdit(controller, feature.id);
                  if (edit && offset !== null) {
                    const result = edit.commit(offset);
                    if (!result.ok)
                      controller.notify(failureMessage(result, canonicalRoom));
                  } else
                    controller.notify(
                      'Review the window width, position and wall measurements before moving it.',
                    );
                  return;
                }
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
        {furnitureByElevation(room).map((item) => {
          const w = item.dimensions.width.value,
            d = item.dimensions.depth.value;
          const selected = view.selectedId === item.id;
          const category =
            findCatalogueEntry(item.catalogueId, item.catalogueVersion)
              ?.category ?? 'piece';
          const label = planFurnitureName(item);
          const labelLayout = planLabelLayout(
            item,
            label + (w === null || d === null ? ' ?' : ''),
            category === 'tv' ? 135 : 185,
            room,
          );
          return (
            <g
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${item.label}, ${w ?? 'unknown'} by ${d ?? 'unknown'} mm, ${before ? 'Before, read-only' : state.candidate ? 'proposal preview' : state.clientLoadFailure ? 'read-only' : item.locks.position ? 'position locked' : 'movable'}`}
              className={`${styles.piece} ${readOnly || !arranging ? styles.piecePreview : ''}`}
              transform={`translate(${item.pose.centerX} ${item.pose.centerZ})`}
              onKeyDown={(e) => key(e, item)}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (event.button !== 0 || gesture.current) return;
                controller.select(item.id);
                if (readOnly || !arranging) return;
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
                  viewport: svg.current!.getBoundingClientRect(),
                  viewBox: `${box.x} ${box.z} ${box.width} ${box.depth}`,
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
                <OrientedFootprint item={item} selected={selected} />
              )}
              {projectedLabelVisible(room, item) && (
                <PlanLabel
                  layout={labelLayout}
                  fill={
                    w !== null &&
                    d !== null &&
                    ['charcoal', 'walnut'].includes(item.finish)
                      ? '#fffaf2'
                      : '#302b25'
                  }
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
            : `${width} mm${room.room.width.status === 'confirmed' ? '' : ` · ${room.room.width.status}`}`}
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
            : `${depth} mm${room.room.depth.status === 'confirmed' ? '' : ` · ${room.room.depth.status}`}`}
        </text>
        {placement && <CataloguePlanGhost placement={placement} />}
        {/* Keep opening names above preview and drag overlays. */}
        {room.room.features.map((feature) => {
          const layout =
            feature.kind !== 'obstacle'
              ? planOpeningLabel(room, feature)
              : null;
          return layout ? (
            <PlanLabel
              key={`label-${feature.id}`}
              layout={layout}
              halo
              moving={!readOnly && arranging && windowGhost?.id === feature.id}
              onSelect={
                !adding ? () => controller.select(feature.id) : undefined
              }
            />
          ) : null;
        })}
      </svg>
      <div id={descriptionId} className={styles.announcement}>
        <p>
          {ghost
            ? `Planned centre: ${ghost.x}, ${ghost.z} mm · release to validate`
            : before
              ? 'Before is read-only · Return to Current to edit'
              : state.clientLoadFailure
                ? 'Editor load failed · Export your layout or reload to continue'
                : state.candidate
                  ? 'Preview only · Ghosts mark current positions · Cancel to edit by hand'
                  : arranging
                    ? 'Drag to place · arrow keys to nudge · dimensions in mm'
                    : 'Select a piece to inspect · arrow keys pan · dimensions in mm'}
        </p>
        {(room.room.width.value === null || room.room.depth.value === null) && (
          <p>Outline is illustrative until width and depth are measured.</p>
        )}
      </div>
    </div>
  );
}
