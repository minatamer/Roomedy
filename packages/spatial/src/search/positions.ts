import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { SearchGoal } from '@roomedy/contracts/search';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '../catalogue.js';
import { localFront } from '../coordinates.js';
export type SearchPose = Pick<
  Furniture['pose'],
  'centerX' | 'centerZ' | 'quarterTurns'
>;
export function stableOrder(seed: number, text: string) {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash;
}
export function windowPoint(
  room: RoomDocument,
  id: string | null,
): readonly [number, number] | null {
  const feature = room.room.features.find(
    (f) => f.kind === 'window' && f.id === id,
  );
  const width = room.room.width.value,
    depth = room.room.depth.value;
  if (
    !feature ||
    feature.wall === 'unknown' ||
    feature.offset.value === null ||
    feature.width.value === null ||
    width === null ||
    depth === null
  )
    return null;
  const along = feature.offset.value + feature.width.value / 2;
  return feature.wall === 'north'
    ? [along, 0]
    : feature.wall === 'east'
      ? [width, along]
      : feature.wall === 'south'
        ? [along, depth]
        : [0, along];
}
/** Finite goal/group/opening placements precede wall anchors, then a small broad grid. */
export function candidatePositions(
  piece: Furniture,
  room: RoomDocument,
  goal: SearchGoal,
  seed: number,
): SearchPose[] {
  const width = room.room.width.value!,
    depth = room.room.depth.value!;
  const ownWidth = piece.dimensions.width.value!,
    ownDepth = piece.dimensions.depth.value!;
  const category = findCatalogueEntry(
    piece.catalogueId,
    piece.catalogueVersion,
  )!.category;
  const targetWindow = windowPoint(room, goal.windowId);
  const choices = new Map<
    string,
    { pose: SearchPose; priority: number; distance: number; tie: number }
  >();
  const add = (
    x: number,
    z: number,
    q: number,
    priority: number,
    distance = 0,
  ) => {
    if (choices.size >= POLICY.searchPositions) return;
    const pose = {
      centerX: Math.round(x * 2) / 2,
      centerZ: Math.round(z * 2) / 2,
      quarterTurns: q as 0 | 1 | 2 | 3,
    };
    if (
      (piece.locks.position &&
        (pose.centerX !== piece.pose.centerX ||
          pose.centerZ !== piece.pose.centerZ)) ||
      (piece.locks.rotation && pose.quarterTurns !== piece.pose.quarterTurns)
    )
      return;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const key = `${pose.centerX}/${pose.centerZ}/${q}`;
    if (!choices.has(key))
      choices.set(key, {
        pose,
        priority,
        distance,
        tie: stableOrder(seed, `${piece.id}/${key}`),
      });
  };
  if (category === 'chair') {
    for (const desk of room.furniture
      .filter(
        (p) =>
          findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
          'desk',
      )
      .sort((a, b) => a.id.localeCompare(b.id))) {
      if (desk.dimensions.depth.value === null) continue;
      const front = localFront(desk.pose.quarterTurns),
        separation =
          desk.dimensions.depth.value / 2 +
          ownDepth / 2 +
          POLICY.searchChairGapMm;
      add(
        desk.pose.centerX + front[0] * separation,
        desk.pose.centerZ + front[1] * separation,
        (desk.pose.quarterTurns + 2) % 4,
        0,
      );
    }
  }
  if (category === 'desk' && targetWindow) {
    const f = room.room.features.find((f) => f.id === goal.windowId)!;
    const q =
      f.wall === 'north'
        ? 0
        : f.wall === 'east'
          ? 1
          : f.wall === 'south'
            ? 2
            : 3;
    const front = localFront(q);
    for (const turns of [q, ...[0, 1, 2, 3].filter((value) => value !== q)]) {
      const half =
        f.wall === 'north' || f.wall === 'south'
          ? (turns % 2 ? ownWidth : ownDepth) / 2
          : (turns % 2 ? ownDepth : ownWidth) / 2;
      for (const extra of [0, 100, 300])
        add(
          targetWindow[0] + front[0] * (half + extra),
          targetWindow[1] + front[1] * (half + extra),
          turns,
          0,
          extra * 4 + (turns === q ? 0 : 1),
        );
    }
  }
  for (const q of [
    piece.pose.quarterTurns,
    ...[0, 1, 2, 3].filter((value) => value !== piece.pose.quarterTurns),
  ])
    add(piece.pose.centerX, piece.pose.centerZ, q, 1);
  for (const margin of [0, 100])
    for (const q of [0, 1, 2, 3]) {
      const w = (q % 2 ? ownDepth : ownWidth) / 2,
        d = (q % 2 ? ownWidth : ownDepth) / 2;
      const anchors =
        q % 2
          ? [d, depth * 0.25, depth / 2, depth * 0.75, depth - d]
          : [w, width * 0.25, width / 2, width * 0.75, width - w];
      for (const along of anchors) {
        const x = q === 1 ? width - w - margin : q === 3 ? w + margin : along;
        const z = q === 0 ? d + margin : q === 2 ? depth - d - margin : along;
        add(
          x,
          z,
          q,
          2,
          targetWindow && category === 'desk'
            ? Math.hypot(x - targetWindow[0], z - targetWindow[1])
            : 0,
        );
      }
    }
  for (const q of [0, 1, 2, 3])
    for (const x of [0.25, 0.5, 0.75])
      for (const z of [0.25, 0.5, 0.75]) add(width * x, depth * z, q, 3);
  return [...choices.values()]
    .sort(
      (a, b) =>
        a.priority - b.priority || a.distance - b.distance || a.tie - b.tie,
    )
    .map((choice) => choice.pose);
}
