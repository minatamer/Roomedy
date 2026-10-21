import type { Furniture } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';

/** Editor illustration only. Never use these nominal sizes for commands or fit checks. */
export function displayFurnitureSize(piece: Furniture) {
  const entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
  if (
    !entry &&
    Object.values(piece.dimensions).some((axis) => axis.value === null)
  )
    return null;
  return {
    width: piece.dimensions.width.value ?? entry!.size.width.default,
    depth: piece.dimensions.depth.value ?? entry!.size.depth.default,
    height: piece.dimensions.height.value ?? entry!.size.height.default,
  };
}

export function hasIllustrativeSize(piece: Furniture) {
  return (
    Object.values(piece.dimensions).some((axis) => axis.value === null) &&
    displayFurnitureSize(piece) !== null
  );
}

export function displayFurnitureFootprint(piece: Furniture) {
  const size = displayFurnitureSize(piece);
  if (!size) return null;
  const [width, depth] =
    piece.pose.quarterTurns % 2
      ? [size.depth, size.width]
      : [size.width, size.depth];
  return {
    minX: piece.pose.centerX - width! / 2,
    maxX: piece.pose.centerX + width! / 2,
    minZ: piece.pose.centerZ - depth! / 2,
    maxZ: piece.pose.centerZ + depth! / 2,
  };
}

export const ILLUSTRATIVE_SIZE_NOTICE =
  'Illustrative furniture sizes. Add measurements in properties before checking fit or exporting.';
