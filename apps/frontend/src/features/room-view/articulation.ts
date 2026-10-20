import type { Feature, Furniture } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';
import { pieceRepresentation, metres } from './adapter';
import type { BoxPart } from './representations/definitions';

export type OpeningKind = 'hinged' | 'sliding' | 'drawer';
export interface OpeningCapability {
  kind: OpeningKind;
  openLabel: string;
  closeLabel: string;
}
export interface PartMotion {
  pivot: [number, number, number];
  travel: [number, number, number];
  turn: number;
}
export function furnitureOpening(piece: Furniture): OpeningCapability | null {
  const entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
  if (
    !entry ||
    !['hinged', 'sliding', 'drawer'].includes(entry.accessMechanism)
  )
    return null;
  const representation = pieceRepresentation(piece);
  if (
    representation.kind === 'unavailable' ||
    (representation.kind === 'procedural' &&
      representation.parts.some((p) => p.name === 'physical-bounds'))
  )
    return null;
  const kind = entry.accessMechanism as OpeningKind;
  return {
    kind,
    openLabel:
      kind === 'drawer'
        ? 'Open drawers'
        : kind === 'sliding'
          ? 'Slide open'
          : entry.id === 'bedside-storage-fixed'
            ? 'Open door'
            : 'Open doors',
    closeLabel:
      kind === 'drawer'
        ? 'Close drawers'
        : kind === 'sliding'
          ? 'Slide closed'
          : entry.id === 'bedside-storage-fixed'
            ? 'Close door'
            : 'Close doors',
  };
}
export function featureOpening(feature: Feature): OpeningCapability | null {
  if (
    feature.kind === 'obstacle' ||
    feature.wall === 'unknown' ||
    [feature.offset, feature.width, feature.height, feature.sill].some(
      (m) => m.value === null,
    ) ||
    !['inward', 'outward', 'sliding'].includes(feature.mechanism) ||
    (feature.kind === 'door' &&
      feature.mechanism !== 'sliding' &&
      feature.hinge === 'unknown')
  )
    return null;
  return {
    kind: feature.mechanism === 'sliding' ? 'sliding' : 'hinged',
    openLabel: feature.kind === 'door' ? 'Open door' : 'Open window',
    closeLabel: feature.kind === 'door' ? 'Close door' : 'Close window',
  };
}
/** Seconds are clamped after background suspension. Endpoints settle exactly. */
export function advanceOpening(current: number, open: boolean, delta: number) {
  const from = Number.isFinite(current) ? Math.max(0, Math.min(1, current)) : 0;
  const target = open ? 1 : 0;
  const dt = Number.isFinite(delta) ? Math.max(0, Math.min(0.05, delta)) : 0;
  const next = from + (target - from) * (1 - Math.exp(-dt * 10));
  return Math.abs(target - next) < 0.0005 ? target : next;
}
/** Parts and attached handles receive the same rigid transform, in local metres. */
export function furniturePartMotion(
  part: BoxPart,
  parts: BoxPart[],
  kind: OpeningKind,
  depth: number,
): PartMotion | null {
  if (kind === 'drawer')
    return part.name.startsWith('drawer-')
      ? { pivot: [0, 0, 0], travel: [0, 0, metres(depth * 0.72)], turn: 0 }
      : null;
  const name = part.name.replace(/^handle-/, '');
  const door = parts.find((p) => p.name === name && name.startsWith('door-'));
  if (!door) return null;
  if (kind === 'sliding')
    return door.center[0] < 0
      ? {
          pivot: [0, 0, 0],
          travel: [metres(door.size[0] * 0.96), 0, 0],
          turn: 0,
        }
      : null;
  const side = door.center[0] === 0 ? -1 : Math.sign(door.center[0]);
  return {
    pivot: [
      metres(door.center[0] + (side * door.size[0]) / 2),
      0,
      metres(door.center[2]),
    ],
    travel: [0, 0, 0],
    turn: (side * Math.PI) / 2,
  };
}
export function openingLeafMotion(
  feature: Exclude<Feature, { kind: 'obstacle' }>,
  width: number,
  depth: number,
): PartMotion {
  if (feature.mechanism === 'sliding')
    return {
      pivot: [0, 0, 0],
      travel: [width * (feature.kind === 'door' ? 0.98 : 0.48), 0, 0],
      turn: 0,
    };
  const side = feature.kind === 'door' && feature.hinge === 'right' ? 1 : -1;
  return {
    pivot: [(side * width) / 2, 0, depth * 0.32],
    travel: [0, 0, 0],
    turn: (side * (feature.mechanism === 'outward' ? -1 : 1) * Math.PI) / 2,
  };
}
