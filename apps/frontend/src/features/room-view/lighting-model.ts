import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { lightSettings } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry, furnitureBottom } from '@roomedy/spatial';

export const LIGHT_LIMIT = 8;
export const SHADOW_LIMIT = 2;
export const isLight = (piece: Furniture) =>
  findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)?.category ===
  'lighting';
export const isCeiling = (piece: Furniture) =>
  findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)?.placement ===
  'ceiling';
export function fixtureSource(piece: Furniture): [number, number, number] {
  const h = piece.dimensions.height.value ?? 1550;
  return [
    piece.pose.centerX / 1000,
    ((furnitureBottom(piece) ?? 0) + (isCeiling(piece) ? -35 : h - 285)) / 1000,
    piece.pose.centerZ / 1000,
  ];
}
export function illuminatedFixtures(
  room: RoomDocument,
  selectedId: string | null,
) {
  return room.furniture
    .filter(
      (piece) =>
        isLight(piece) &&
        lightSettings(piece).on &&
        lightSettings(piece).brightness > 0,
    )
    .toSorted((a, b) =>
      a.id === selectedId
        ? -1
        : b.id === selectedId
          ? 1
          : a.id.localeCompare(b.id),
    )
    .slice(0, LIGHT_LIMIT);
}
export const layerFurniture = (
  room: RoomDocument,
  layer: 'floor' | 'ceiling',
) =>
  room.furniture.filter((piece) => isCeiling(piece) === (layer === 'ceiling'));
