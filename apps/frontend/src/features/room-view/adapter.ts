import type { Furniture, RoomDocument, Feature } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';
import { resolveRepresentation } from './representations/definitions';

export type Triple = [number, number, number];
export interface CameraPose {
  position: Triple;
  target: Triple;
  zoom: number;
}
export interface SceneBox {
  center: Triple;
  size: Triple;
}
export const metres = (mm: number) => mm / 1000;
export function piecePose(piece: Furniture) {
  return {
    position: [
      metres(piece.pose.centerX),
      0,
      metres(piece.pose.centerZ),
    ] as Triple,
    // Canonical quarter-turns rotate +X towards +Z; Three's positive Y rotates the other way.
    rotationY: (-piece.pose.quarterTurns * Math.PI) / 2,
  };
}
export function pieceRepresentation(piece: Furniture, assetAvailable = true) {
  const { width, depth, height } = piece.dimensions;
  if (width.value === null || depth.value === null || height.value === null)
    return {
      kind: 'unavailable' as const,
      notice: 'Confirm the missing dimensions to show this piece in 3D.',
    };
  return resolveRepresentation(
    findCatalogueEntry(piece.catalogueId, piece.catalogueVersion),
    { width: width.value, depth: depth.value, height: height.value },
    assetAvailable,
    piece,
  );
}
export function displayRoom(doc: RoomDocument) {
  return {
    width: metres(doc.room.width.value ?? 4200),
    depth: metres(doc.room.depth.value ?? 4800),
    height: metres(doc.room.height.value ?? 2600),
    approximate: [doc.room.width, doc.room.depth, doc.room.height].some(
      (v) => v.status !== 'confirmed',
    ),
  };
}
export function featureBox(doc: RoomDocument, f: Feature): SceneBox | null {
  if (
    f.wall === 'unknown' ||
    f.offset.value === null ||
    f.width.value === null ||
    f.height.value === null ||
    f.sill.value === null ||
    (f.kind === 'obstacle' && f.projection.value === null)
  )
    return null;
  const { width, depth } = displayRoom(doc),
    u = metres(f.offset.value + f.width.value / 2),
    y = metres(f.sill.value + f.height.value / 2),
    reach = f.kind === 'obstacle' ? metres(f.projection.value!) : 0.06;
  switch (f.wall) {
    case 'north':
      return {
        center: [u, y, reach / 2],
        size: [metres(f.width.value), metres(f.height.value), reach],
      };
    case 'south':
      return {
        center: [u, y, depth - reach / 2],
        size: [metres(f.width.value), metres(f.height.value), reach],
      };
    case 'west':
      return {
        center: [reach / 2, y, u],
        size: [reach, metres(f.height.value), metres(f.width.value)],
      };
    case 'east':
      return {
        center: [width - reach / 2, y, u],
        size: [reach, metres(f.height.value), metres(f.width.value)],
      };
  }
}
/** Solid wall spans are the complement of the union of known openings. No guessed holes. */
export function wallBoxes(
  doc: RoomDocument,
  wall: Exclude<Feature['wall'], 'unknown'>,
): SceneBox[] {
  const room = displayRoom(doc),
    horizontal = wall === 'north' || wall === 'south',
    length = horizontal ? room.width : room.depth,
    holes = doc.room.features
      .filter(
        (f) => f.wall === wall && f.kind !== 'obstacle' && featureBox(doc, f),
      )
      .map((f) => ({
        left: Math.max(0, metres(f.offset.value!)),
        right: Math.min(length, metres(f.offset.value! + f.width.value!)),
        bottom: Math.max(0, metres(f.sill.value!)),
        top: Math.min(room.height, metres(f.sill.value! + f.height.value!)),
      }))
      .filter((h) => h.right > h.left && h.top > h.bottom);
  const xs = [
      ...new Set([0, length, ...holes.flatMap((h) => [h.left, h.right])]),
    ].sort((a, b) => a - b),
    result: SceneBox[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const left = xs[i]!,
      right = xs[i + 1]!,
      ranges = holes
        .filter((h) => h.left < right && h.right > left)
        .sort((a, b) => a.bottom - b.bottom);
    let bottom = 0;
    const add = (low: number, high: number) => {
      if (high <= low) return;
      const u = (left + right) / 2,
        y = (low + high) / 2,
        along = right - left;
      result.push({
        center: horizontal
          ? [u, y, wall === 'north' ? -0.06 : room.depth + 0.06]
          : [wall === 'west' ? -0.06 : room.width + 0.06, y, u],
        size: horizontal
          ? [along, high - low, 0.12]
          : [0.12, high - low, along],
      });
    };
    for (const h of ranges) {
      add(bottom, h.bottom);
      bottom = Math.max(bottom, h.top);
    }
    add(bottom, room.height);
  }
  return result;
}
export function changedPieces(current: RoomDocument, candidate?: RoomDocument) {
  if (!candidate) return [];
  return current.furniture.filter(
    (p) =>
      JSON.stringify(p) !==
      JSON.stringify(candidate.furniture.find((n) => n.id === p.id)),
  );
}
