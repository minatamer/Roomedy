import type { RoomDocument } from '@roomedy/contracts/room';
import type { Measurement } from '@roomedy/contracts/primitives';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from './catalogue.js';
import { checkRoom } from './checks.js';

const estimate = (value: number): Measurement => ({
  value: Math.round(value),
  status: 'estimated',
  sourceId: 'planning-default',
});
const evidence = { status: 'estimated' as const, sourceId: 'planning-default' };

/** A disposable design projection. Never adopt its assumptions as accepted room measurements. */
export function planningRoom(room: RoomDocument): RoomDocument {
  const missing =
    [room.room.width, room.room.depth, room.room.height].some(
      (m) => m.value === null,
    ) ||
    room.furniture.some(
      (p) =>
        Object.values(p.dimensions).some((m) => m.value === null) ||
        p.pose.provenance.status === 'unknown',
    ) ||
    room.room.features.some(
      (f) =>
        f.wall === 'unknown' ||
        [f.offset, f.width, f.height, f.sill].some((m) => m.value === null) ||
        (f.kind === 'obstacle'
          ? f.projection.value === null
          : f.mechanism === 'unknown' ||
            (f.kind === 'door' && f.hinge === 'unknown')),
    );
  if (!missing) return room;
  const planned: RoomDocument = {
    ...room,
    room: { ...room.room, features: room.room.features.map((f) => ({ ...f })) },
    furniture: room.furniture.map((p) => ({
      ...p,
      dimensions: { ...p.dimensions },
      pose: { ...p.pose },
    })),
  };
  for (const piece of planned.furniture) {
    const entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
    for (const axis of ['width', 'depth', 'height'] as const)
      if (piece.dimensions[axis].value === null)
        piece.dimensions[axis] = estimate(entry?.size[axis].default ?? 1000);
    if (piece.pose.provenance.status === 'unknown')
      piece.pose.provenance = { ...evidence };
  }
  for (const [axis, fallback, position] of [
    ['width', 6000, 'centerX'],
    ['depth', 5000, 'centerZ'],
  ] as const)
    if (planned.room[axis].value === null) {
      const extent = planned.furniture.reduce<number>(
        (max, p) =>
          Math.max(
            max,
            p.pose[position] +
              (p.dimensions[
                p.pose.quarterTurns % 2
                  ? axis === 'width'
                    ? 'depth'
                    : 'width'
                  : axis
              ].value ?? 0) /
                2,
          ),
        fallback,
      );
      planned.room[axis] = estimate(Math.min(POLICY.roomEdgeMm, extent));
    }
  if (planned.room.height.value === null) planned.room.height = estimate(2700);
  for (const feature of planned.room.features) {
    if (feature.wall === 'unknown') {
      feature.wall = feature.kind === 'door' ? 'west' : 'north';
      feature.wallProvenance = { ...evidence };
    }
    const span =
      planned.room[
        feature.wall === 'east' || feature.wall === 'west' ? 'depth' : 'width'
      ].value!;
    if (feature.width.value === null)
      feature.width = estimate(
        Math.min(span, feature.kind === 'door' ? 900 : 1200),
      );
    if (feature.offset.value === null)
      feature.offset = estimate(
        Math.max(
          0,
          feature.kind === 'window'
            ? (span - feature.width.value!) / 2
            : Math.min(200, span - feature.width.value!),
        ),
      );
    if (feature.sill.value === null)
      feature.sill = estimate(
        feature.kind === 'window'
          ? Math.min(900, planned.room.height.value! - 1)
          : 0,
      );
    if (feature.height.value === null)
      feature.height = estimate(
        Math.max(
          1,
          Math.min(
            feature.kind === 'door' ? 2100 : 1200,
            planned.room.height.value! - feature.sill.value!,
          ),
        ),
      );
    if (feature.kind === 'obstacle') {
      if (feature.projection.value === null) feature.projection = estimate(200);
    } else {
      if (feature.mechanism === 'unknown') {
        feature.mechanism = feature.kind === 'door' ? 'inward' : 'fixed';
        feature.mechanismProvenance = { ...evidence };
      }
      if (feature.kind === 'door' && feature.hinge === 'unknown') {
        feature.hinge = 'left';
        feature.hingeProvenance = { ...evidence };
      }
    }
  }
  return planned;
}

/** Missing evidence and unsupported checks are internal metadata, never design interruptions. */
export function planningChecks(room: RoomDocument) {
  const checks = checkRoom(planningRoom(room));
  return {
    ...checks,
    issues: checks.issues.filter((i) => i.severity !== 'unassessed'),
  };
}
