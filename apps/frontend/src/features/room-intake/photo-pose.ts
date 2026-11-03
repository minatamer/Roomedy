import type { DraftObservation } from '@roomedy/contracts/intake';
import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import {
  displayFurnitureFootprint,
  displayFurnitureSize,
} from '../catalogue/display-size';
import { POLICY } from '@roomedy/contracts/policy';
import {
  findCatalogueEntry,
  localFront,
  intersection,
  wallMountedPose,
} from '@roomedy/spatial';

export type PhotoWall = Exclude<Feature['wall'], 'unknown'>;
export const PHOTO_BACK_WALLS: readonly PhotoWall[] = [
  'north',
  'east',
  'south',
  'west',
];

/** Evidence may come from a room view independently of the clearest detail image. */
export function observedPhotoWall(
  observations: readonly DraftObservation[],
  roomSources: ReadonlySet<string>,
) {
  const walls = new Set(
    observations
      .filter(
        (o) =>
          o.wall !== 'unknown' &&
          o.wallEvidence.status !== 'unknown' &&
          roomSources.has(o.wallEvidence.sourceId ?? ''),
      )
      .map((o) => o.wall as PhotoWall),
  );
  return walls.size === 1 ? [...walls][0] : undefined;
}

/** Project observed relative placement into the existing nominal illustration only.
 * This is not collision repair or authority to adopt a physical measurement. */
export function illustratedPhotoPose(
  room: RoomDocument,
  piece: Furniture,
  wall?: PhotoWall,
): Furniture['pose'] {
  if (!Object.values(piece.dimensions).some((m) => m.value === null))
    return piece.pose;
  const size = displayFurnitureSize(piece);
  if (!size) return piece.pose;
  const width = room.room.width.value ?? 4200,
    depth = room.room.depth.value ?? 4800;
  const [halfX, halfZ] =
    piece.pose.quarterTurns % 2
      ? [size.depth / 2, size.width / 2]
      : [size.width / 2, size.depth / 2];
  if (halfX * 2 > width || halfZ * 2 > depth) return piece.pose;
  const backed =
    wall === PHOTO_BACK_WALLS[piece.pose.quarterTurns] ? wall : undefined;
  const centerX =
    backed === 'west'
      ? halfX + 50
      : backed === 'east'
        ? width - halfX - 50
        : Math.max(halfX, Math.min(width - halfX, piece.pose.centerX));
  const centerZ =
    backed === 'north'
      ? halfZ + 50
      : backed === 'south'
        ? depth - halfZ - 50
        : Math.max(halfZ, Math.min(depth - halfZ, piece.pose.centerZ));
  if (
    centerX < halfX ||
    centerX > width - halfX ||
    centerZ < halfZ ||
    centerZ > depth - halfZ ||
    (centerX === piece.pose.centerX && centerZ === piece.pose.centerZ)
  )
    return piece.pose;
  return {
    ...piece.pose,
    centerX,
    centerZ,
    provenance: { status: 'planned', sourceId: 'photo-wall-plan' },
  };
}

/** Only explicit, unambiguous observed pairs use this nominal illustration. */
export function illustratedPhotoRelation(
  room: RoomDocument,
  piece: Furniture,
  target: Furniture,
  relation: NonNullable<DraftObservation['relation']>,
  wall?: PhotoWall,
) {
  if (
    piece.id === target.id ||
    piece.locks.position ||
    piece.locks.rotation ||
    target.locks.position ||
    target.locks.rotation ||
    Object.values(piece.dimensions).every((m) => m.value !== null)
  )
    return null;
  const entry = (p: Furniture) =>
    findCatalogueEntry(p.catalogueId, p.catalogueVersion);
  const pieceEntry = entry(piece),
    targetEntry = entry(target);
  const a = displayFurnitureSize(piece),
    b = displayFurnitureSize(target);
  if (!a || !b) return null;
  const [fx, fz] = localFront(target.pose.quarterTurns),
    [rx, rz] = [fz, -fx];
  let dx: number,
    dz: number,
    turn = target.pose.quarterTurns;
  if (
    relation.kind === 'faces' &&
    pieceEntry?.category === 'chair' &&
    targetEntry?.category === 'desk'
  ) {
    const distance = (a.depth + b.depth) / 2 + POLICY.searchChairGapMm;
    dx = fx * distance;
    dz = fz * distance;
    turn = ((turn + 2) % 4) as 0 | 1 | 2 | 3;
  } else if (
    relation.kind === 'beside' &&
    relation.side &&
    pieceEntry &&
    targetEntry &&
    (!targetEntry.placement || targetEntry.placement === 'floor') &&
    (!pieceEntry.placement ||
      ['floor', 'wall'].includes(pieceEntry.placement)) &&
    (wall === PHOTO_BACK_WALLS[target.pose.quarterTurns] ||
      (['bedside-drawers', 'bedside-storage-fixed'].includes(
        piece.catalogueId,
      ) &&
        targetEntry.category === 'bed'))
  ) {
    const lateral =
        ((a.width + b.width) / 2 + 50) * (relation.side === 'right' ? 1 : -1),
      forward = (a.depth - b.depth) / 2;
    dx = rx * lateral + fx * forward;
    dz = rz * lateral + fz * forward;
  } else return null;
  const candidate: Furniture = {
    ...piece,
    pose: {
      ...piece.pose,
      centerX: target.pose.centerX + dx,
      centerZ: target.pose.centerZ + dz,
      quarterTurns: turn,
      provenance: {
        status: 'planned' as const,
        sourceId: 'photo-relation-plan',
      },
    },
  };
  const box = displayFurnitureFootprint(candidate)!;
  if (
    box.minX < 0 ||
    box.maxX > (room.room.width.value ?? 4200) ||
    box.minZ < 0 ||
    box.maxZ > (room.room.depth.value ?? 4800)
  )
    return null;
  if (pieceEntry?.placement === 'wall') {
    // Mount only the disposable illustration. Catalogue envelopes never become
    // owned measurements, and an out-of-bounds neighbour is rejected above.
    const estimate = (value: number) => ({
      value,
      status: 'estimated' as const,
      sourceId: 'photo-preview',
    });
    const proxy = {
      ...room,
      room: {
        ...room.room,
        width:
          room.room.width.value === null ? estimate(4200) : room.room.width,
        depth:
          room.room.depth.value === null ? estimate(4800) : room.room.depth,
      },
    };
    const nominal = {
      ...candidate,
      dimensions: {
        width: estimate(a.width),
        depth: estimate(a.depth),
        height: estimate(a.height),
      },
    };
    candidate.pose = wallMountedPose(proxy, nominal, candidate.pose);
  }
  const mountedBox = displayFurnitureFootprint(candidate)!;
  if (
    room.furniture.some((p) => {
      if (p.id === piece.id || p.id === target.id) return false;
      const placement = findCatalogueEntry(
        p.catalogueId,
        p.catalogueVersion,
      )?.placement;
      if (placement && placement !== 'floor') return false;
      const other = displayFurnitureFootprint(p);
      return !other || !!intersection(mountedBox, other);
    })
  )
    return null;
  return candidate.pose;
}
