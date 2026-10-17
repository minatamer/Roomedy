import type { Furniture, Feature, RoomDocument } from '@roomedy/contracts/room';
import type { Region } from '@roomedy/contracts/issues';

export type Point = readonly [number, number];
export function rotatePoint([x, z]: Point, quarterTurns: number): Point {
  switch (quarterTurns) {
    case 0:
      return [x, z];
    case 1:
      return [-z, x];
    case 2:
      return [-x, -z];
    case 3:
      return [z, -x];
    default:
      throw new Error('unsupported-rotation');
  }
}
export function localFront(turns: number): Point {
  return rotatePoint([0, 1], turns);
}
export function footprint(item: Furniture): Region | undefined {
  const width = item.dimensions.width.value,
    depth = item.dimensions.depth.value;
  if (width === null || depth === null) return undefined;
  const [w, d] = item.pose.quarterTurns % 2 ? [depth, width] : [width, depth];
  return {
    minX: item.pose.centerX - w / 2,
    maxX: item.pose.centerX + w / 2,
    minZ: item.pose.centerZ - d / 2,
    maxZ: item.pose.centerZ + d / 2,
  };
}
/** World corner order is always NW, NE, SE, SW, independent of furniture front. */
export function corners(rect: Region): readonly Point[] {
  return [
    [rect.minX, rect.minZ],
    [rect.maxX, rect.minZ],
    [rect.maxX, rect.maxZ],
    [rect.minX, rect.maxZ],
  ];
}
export function intersection(a: Region, b: Region): Region | undefined {
  const r = {
    minX: Math.max(a.minX, b.minX),
    minZ: Math.max(a.minZ, b.minZ),
    maxX: Math.min(a.maxX, b.maxX),
    maxZ: Math.min(a.maxZ, b.maxZ),
  };
  return r.maxX > r.minX && r.maxZ > r.minZ ? r : undefined;
}
export function area(r: Region): number {
  return (r.maxX - r.minX) * (r.maxZ - r.minZ);
}
export function subsetRegion(a: Region, b: Region): boolean {
  return (
    a.minX >= b.minX && a.minZ >= b.minZ && a.maxX <= b.maxX && a.maxZ <= b.maxZ
  );
}
export function outsideRegions(
  r: Region,
  width: number,
  depth: number,
): { side: string; region: Region; deficit: number }[] {
  const result: { side: string; region: Region; deficit: number }[] = [];
  if (r.minX < 0)
    result.push({
      side: 'west',
      region: { ...r, maxX: Math.min(0, r.maxX) },
      deficit: -r.minX,
    });
  if (r.maxX > width)
    result.push({
      side: 'east',
      region: { ...r, minX: Math.max(width, r.minX) },
      deficit: r.maxX - width,
    });
  if (r.minZ < 0)
    result.push({
      side: 'north',
      region: { ...r, maxZ: Math.min(0, r.maxZ) },
      deficit: -r.minZ,
    });
  if (r.maxZ > depth)
    result.push({
      side: 'south',
      region: { ...r, minZ: Math.max(depth, r.minZ) },
      deficit: r.maxZ - depth,
    });
  return result;
}
export function frontBand(r: Region, turns: number, clearance: number): Region {
  switch (turns) {
    case 0:
      return { ...r, minZ: r.maxZ, maxZ: r.maxZ + clearance };
    case 1:
      return { ...r, maxX: r.minX, minX: r.minX - clearance };
    case 2:
      return { ...r, maxZ: r.minZ, minZ: r.minZ - clearance };
    case 3:
      return { ...r, minX: r.maxX, maxX: r.maxX + clearance };
    default:
      throw new Error('unsupported-rotation');
  }
}
export function wallInterval(
  feature: Feature,
): readonly [number, number] | undefined {
  const offset = feature.offset.value,
    width = feature.width.value;
  return offset === null || width === null
    ? undefined
    : [offset, offset + width];
}
export function wallBand(
  room: RoomDocument,
  feature: Feature,
  reach: number,
): Region | undefined {
  const interval = wallInterval(feature);
  if (!interval) return undefined;
  const [start, end] = interval;
  switch (feature.wall) {
    case 'unknown':
      return undefined;
    case 'north':
      return { minX: start, maxX: end, minZ: 0, maxZ: reach };
    case 'west':
      return { minX: 0, maxX: reach, minZ: start, maxZ: end };
    case 'south': {
      const d = room.room.depth.value;
      return d === null
        ? undefined
        : { minX: start, maxX: end, minZ: d - reach, maxZ: d };
    }
    case 'east': {
      const w = room.room.width.value;
      return w === null
        ? undefined
        : { minX: w - reach, maxX: w, minZ: start, maxZ: end };
    }
  }
}
