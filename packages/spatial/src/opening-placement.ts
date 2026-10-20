import type { Feature, RoomDocument } from '@roomedy/contracts/room';
import type { Region } from '@roomedy/contracts/issues';
import { POLICY } from '@roomedy/contracts/policy';
import { footprint, wallBand, wallInterval } from './coordinates.js';
import { verticalSpan } from './elevation.js';

type Door = Extract<Feature, { kind: 'door' }>;
type Interval = readonly [number, number];
const walls = ['north', 'east', 'south', 'west'] as const;
const alongX = (feature: Feature) =>
  feature.wall === 'north' || feature.wall === 'south';
const reach = (door: Door) =>
  door.mechanism === 'inward' || door.mechanism === 'unknown'
    ? Math.max(door.width.value ?? 0, POLICY.doorApproachMm)
    : POLICY.doorApproachMm;

/** Integer offset intervals; exact edge contact is allowed, positive overlap is not. */
export function clearDoorIntervals(
  room: RoomDocument,
  door: Door,
): Interval[] | null {
  const width = room.room.width.value,
    depth = room.room.depth.value,
    size = door.width.value;
  if (
    width === null ||
    depth === null ||
    size === null ||
    door.wall === 'unknown'
  )
    return null;
  const horizontal = alongX(door),
    edge = horizontal ? width : depth;
  if (size > edge || reach(door) > (horizontal ? depth : width)) return [];
  if (
    room.room.height.value !== null &&
    door.height.value !== null &&
    door.sill.value !== null &&
    door.height.value + door.sill.value > room.room.height.value
  )
    return [];
  let free: Interval[] = [[0, edge - size]];
  const subtract = (start: number, end: number) => {
    const lo = Math.floor(start - size) + 1,
      hi = Math.ceil(end) - 1;
    free = free.flatMap(([a, b]): Interval[] =>
      hi < a || lo > b
        ? [[a, b]]
        : [
            ...(a < lo ? ([[a, lo - 1]] as Interval[]) : []),
            ...(b > hi ? ([[hi + 1, b]] as Interval[]) : []),
          ],
    );
  };
  const band = wallBand(
    room,
    {
      ...door,
      offset: { value: 0, status: 'estimated', sourceId: 'visitor-plan' },
      width: { value: edge, status: 'estimated', sourceId: 'visitor-plan' },
    },
    reach(door),
  )!;
  const blockRegion = (box: Region) => {
    if (
      horizontal
        ? box.maxZ > band.minZ && box.minZ < band.maxZ
        : box.maxX > band.minX && box.minX < band.maxX
    )
      subtract(
        horizontal ? box.minX : box.minZ,
        horizontal ? box.maxX : box.maxZ,
      );
  };
  for (const item of room.furniture) {
    const box = footprint(item);
    if (!box) return null;
    const span = verticalSpan(item);
    if (
      span &&
      door.sill.value !== null &&
      door.height.value !== null &&
      (span[1] <= door.sill.value ||
        span[0] >= door.sill.value + door.height.value)
    )
      continue;
    blockRegion(box);
  }
  for (const other of room.room.features) {
    if (other.id === door.id) continue;
    if (other.wall === 'unknown') return null;
    const interval = wallInterval(other);
    if (other.wall === door.wall) {
      if (!interval) return null;
      subtract(...interval);
    }
    if (other.kind === 'window') continue;
    const distance =
      other.kind === 'door' ? reach(other) : other.projection.value;
    if (distance === null) return null;
    const box = wallBand(room, other, distance);
    if (!box) return null;
    blockRegion(box);
  }
  return free;
}

export function nearestClearDoorOffset(
  room: RoomDocument,
  door: Door,
  offset: number,
) {
  if (!Number.isFinite(offset)) return null;
  const free = clearDoorIntervals(room, door);
  let best: number | null = null;
  for (const [lo, hi] of free ?? []) {
    const next = Math.max(lo, Math.min(hi, Math.round(offset)));
    if (best === null || Math.abs(next - offset) < Math.abs(best - offset))
      best = next;
  }
  return best;
}

/** Bounded first fit. Planning a doorway never confirms its observed physical position. */
export function placeDoor(room: RoomDocument, door: Door): Door | null {
  const candidates = door.wall === 'unknown' ? walls : [door.wall];
  for (const wall of candidates) {
    const candidate: Door = { ...door, wall };
    const first = clearDoorIntervals(room, candidate)?.[0]?.[0];
    if (first !== undefined)
      return {
        ...candidate,
        wallProvenance:
          door.wall === 'unknown'
            ? { status: 'estimated', sourceId: 'visitor-planned' }
            : door.wallProvenance,
        offset: {
          value: first,
          status: 'estimated',
          sourceId: 'visitor-planned',
        },
      };
  }
  return null;
}
