import type { Furniture, RoomDocument, Feature } from '@roomedy/contracts/room';
import { findCatalogueEntry } from './catalogue.js';
import { footprint } from './coordinates.js';

export const featureLabel = (feature: Feature) =>
  feature.kind === 'door' && feature.purpose === 'bathroom'
    ? 'Bathroom door'
    : feature.kind === 'door'
      ? 'Door'
      : feature.kind === 'window'
        ? 'Window'
        : 'Fixed obstacle';
export const wallMounted = (item: Furniture) =>
  findCatalogueEntry(item.catalogueId, item.catalogueVersion)?.placement ===
  'wall';
/** Missing height is unknown for elevated entries. Legacy floor poses remain at zero. */
export function furnitureBottom(item: Furniture): number | null {
  const placement = findCatalogueEntry(
    item.catalogueId,
    item.catalogueVersion,
  )?.placement;
  return item.pose.bottomY ?? (placement && placement !== 'floor' ? null : 0);
}
export function verticalSpan(item: Furniture): [number, number] | null {
  const bottom = furnitureBottom(item),
    height = item.dimensions.height.value;
  return bottom === null || height === null ? null : [bottom, bottom + height];
}
/** Floor-to-floor collision never depends on unknown heights. */
export function verticallySeparate(a: Furniture, b: Furniture): boolean | null {
  if (furnitureBottom(a) === 0 && furnitureBottom(b) === 0) return false;
  const sa = verticalSpan(a),
    sb = verticalSpan(b);
  return sa && sb ? sa[1] <= sb[0] || sb[1] <= sa[0] : null;
}
/** Back of a wall item touches its wall. Along-wall motion is physically bounded. */
export function wallMountedPose(
  room: RoomDocument,
  item: Furniture,
  pose = item.pose,
): Furniture['pose'] {
  if (!wallMounted(item)) return { ...pose };
  const width = item.dimensions.width.value,
    depth = item.dimensions.depth.value;
  const rw = room.room.width.value,
    rd = room.room.depth.value;
  if (width === null || depth === null || rw === null || rd === null)
    return { ...pose };
  const clamp = (v: number, edge: number) =>
    Math.round(Math.max(width / 2, Math.min(edge - width / 2, v)) * 2) / 2;
  switch (pose.quarterTurns) {
    case 0:
      return { ...pose, centerX: clamp(pose.centerX, rw), centerZ: depth / 2 };
    case 1:
      return {
        ...pose,
        centerX: rw - depth / 2,
        centerZ: clamp(pose.centerZ, rd),
      };
    case 2:
      return {
        ...pose,
        centerX: clamp(pose.centerX, rw),
        centerZ: rd - depth / 2,
      };
    case 3:
      return { ...pose, centerX: depth / 2, centerZ: clamp(pose.centerZ, rd) };
  }
}

/** Wire commands intentionally exclude pose evidence; the shared command owner authors it. */
export const placementTarget = (pose: Furniture['pose']) => ({
  centerX: pose.centerX,
  centerZ: pose.centerZ,
  quarterTurns: pose.quarterTurns,
  ...(pose.bottomY === undefined ? {} : { bottomY: pose.bottomY }),
});

/** Plan projection stays floor-to-top regardless of insertion order. */
export const furnitureByElevation = (room: RoomDocument) =>
  room.furniture.toSorted(
    (a, b) => (furnitureBottom(a) ?? 0) - (furnitureBottom(b) ?? 0),
  );
export function projectedLabelVisible(
  room: RoomDocument,
  item: Furniture,
): boolean {
  const bottom = furnitureBottom(item);
  return (
    bottom === null ||
    !room.furniture.some((other) => {
      const top = furnitureBottom(other),
        rect = footprint(other);
      return (
        other.id !== item.id &&
        top !== null &&
        top > bottom &&
        rect &&
        item.pose.centerX >= rect.minX &&
        item.pose.centerX <= rect.maxX &&
        item.pose.centerZ >= rect.minZ &&
        item.pose.centerZ <= rect.maxZ
      );
    })
  );
}
