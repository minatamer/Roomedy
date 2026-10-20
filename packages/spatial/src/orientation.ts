import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry } from './catalogue.js';
import {
  area,
  footprint,
  frontBand,
  intersection,
  localFront,
} from './coordinates.js';

/** A planning preference, never a fit check or evidence of an observed pose. */
export function backWallGap(
  room: RoomDocument,
  item: Furniture,
): number | null {
  const width = room.room.width.value,
    depth = room.room.depth.value;
  const rect = footprint(item),
    entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion);
  if (
    width === null ||
    depth === null ||
    !rect ||
    !entry ||
    entry.category === 'chair' ||
    item.pose.provenance.status === 'unknown'
  )
    return null;
  return Math.max(
    0,
    [rect.minZ, width - rect.maxX, depth - rect.maxZ, rect.minX][
      item.pose.quarterTurns
    ]!,
  );
}

/** Four bounded suggestions for a NEW piece; full command validation still decides fit. */
export function preferredFurnitureFacing(
  room: RoomDocument,
  item: Furniture,
): Furniture['pose']['quarterTurns'] {
  const width = room.room.width.value,
    depth = room.room.depth.value;
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion);
  if (
    item.locks.rotation ||
    width === null ||
    depth === null ||
    !footprint(item) ||
    !entry ||
    item.pose.provenance.status === 'unknown'
  )
    return item.pose.quarterTurns;
  const bounds = { minX: 0, minZ: 0, maxX: width, maxZ: depth };
  const outside = (rect: typeof bounds) => {
    const inside = intersection(rect, bounds);
    return area(rect) - (inside ? area(inside) : 0);
  };
  const others = room.furniture.filter((p) => p.id !== item.id);
  const desks = others.filter(
    (p) =>
      entry.category === 'chair' &&
      findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
        'desk' &&
      p.pose.provenance.status !== 'unknown',
  );
  const desk = desks.sort(
    (a, b) =>
      Math.hypot(
        a.pose.centerX - item.pose.centerX,
        a.pose.centerZ - item.pose.centerZ,
      ) -
        Math.hypot(
          b.pose.centerX - item.pose.centerX,
          b.pose.centerZ - item.pose.centerZ,
        ) || a.id.localeCompare(b.id),
  )[0];
  let best = item.pose.quarterTurns,
    bestRank: number[] | null = null;
  for (const q of [
    item.pose.quarterTurns,
    ...([0, 1, 2, 3] as const).filter((q) => q !== item.pose.quarterTurns),
  ]) {
    const candidate = { ...item, pose: { ...item.pose, quarterTurns: q } };
    const rect = footprint(candidate)!;
    const access = frontBand(
      rect,
      entry.accessMechanism === 'chair-pullout' ? (q + 2) % 4 : q,
      entry.accessMm,
    );
    let blocked = outside(access),
      solid = outside(rect);
    for (const other of others) {
      const box = footprint(other),
        overlap = box && intersection(access, box),
        body = box && intersection(rect, box);
      if (body) solid += area(body);
      if (
        entry.category === 'desk' &&
        findCatalogueEntry(other.catalogueId, other.catalogueVersion)
          ?.category === 'chair' &&
        other.pose.quarterTurns === (q + 2) % 4
      )
        continue;
      if (overlap) blocked += area(overlap);
    }
    const front = localFront(q);
    const facing =
      entry.category === 'chair' && desk
        ? -(
            (desk.pose.centerX - item.pose.centerX) * front[0] +
            (desk.pose.centerZ - item.pose.centerZ) * front[1]
          )
        : (backWallGap(room, candidate) ?? 0);
    const rank = [solid, blocked, facing];
    if (
      !bestRank ||
      rank.some(
        (value, i) =>
          value < bestRank![i]! &&
          rank.slice(0, i).every((v, j) => v === bestRank![j]),
      )
    ) {
      best = q;
      bestRank = rank;
    }
  }
  return best;
}
