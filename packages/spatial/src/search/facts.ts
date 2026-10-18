import type { RoomDocument, CheckFacts } from '@roomedy/contracts/room';
import type { SearchFacts, SearchGoal } from '@roomedy/contracts/search';
import type { Region } from '@roomedy/contracts/issues';
import { footprint, intersection, area, localFront } from '../coordinates.js';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '../catalogue.js';
import { windowPoint } from './positions.js';
function unionArea(rectangles: Region[]) {
  const xs = [...new Set(rectangles.flatMap((r) => [r.minX, r.maxX]))].sort(
    (a, b) => a - b,
  );
  let total = 0;
  for (let i = 1; i < xs.length; i++) {
    const left = xs[i - 1]!,
      right = xs[i]!,
      spans = rectangles
        .filter((r) => r.minX < right && r.maxX > left)
        .map((r) => [r.minZ, r.maxZ] as const)
        .sort((a, b) => a[0] - b[0]);
    let height = 0,
      start = 0,
      end = 0,
      first = true;
    for (const [a, b] of spans) {
      if (first) {
        start = a;
        end = b;
        first = false;
      } else if (a <= end) end = Math.max(end, b);
      else {
        height += end - start;
        start = a;
        end = b;
      }
    }
    if (!first) height += end - start;
    total += (right - left) * height;
  }
  return total;
}
function missingInput(room: RoomDocument, input: string) {
  const [id, field] = input.split(':');
  if (!id || !field) return false;
  if (id === 'room' || id === room.roomId)
    return (
      ['width', 'depth', 'height'].includes(field) &&
      room.room[field as 'width' | 'depth' | 'height'].value === null
    );
  const piece = room.furniture.find((p) => p.id === id);
  if (piece)
    return field === 'pose'
      ? piece.pose.provenance.status === 'unknown'
      : ['width', 'depth', 'height'].includes(field) &&
          piece.dimensions[field as 'width' | 'depth' | 'height'].value ===
            null;
  const feature = room.room.features.find((f) => f.id === id);
  if (!feature) return false;
  if (field === 'wall')
    return (
      feature.wall === 'unknown' || feature.wallProvenance.status === 'unknown'
    );
  if (field === 'mechanism')
    return (
      feature.kind !== 'obstacle' &&
      (feature.mechanism === 'unknown' ||
        feature.mechanismProvenance.status === 'unknown')
    );
  if (field === 'hinge')
    return (
      feature.kind === 'door' &&
      (feature.hinge === 'unknown' ||
        feature.hingeProvenance.status === 'unknown')
    );
  if (field === 'projection')
    return feature.kind === 'obstacle' && feature.projection.value === null;
  return (
    ['width', 'height', 'offset', 'sill'].includes(field) &&
    feature[field as 'width' | 'height' | 'offset' | 'sill'].value === null
  );
}
function roomFacts(room: RoomDocument, goal: SearchGoal) {
  const width = room.room.width.value,
    depth = room.room.depth.value;
  const desks = room.furniture.filter(
    (p) =>
      findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
      'desk',
  );
  const chairs = room.furniture.filter(
    (p) =>
      findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
      'chair',
  );
  const target = windowPoint(room, goal.windowId);
  const relevantDesks = desks.filter(
    (p) =>
      goal.targetIds.includes(p.id) ||
      [...goal.additions, ...goal.replacements].some(
        (choice) => choice.id === p.id,
      ),
  );
  const relevantChairs = chairs.filter(
    (p) =>
      goal.targetIds.includes(p.id) ||
      [...goal.additions, ...goal.replacements].some(
        (choice) => choice.id === p.id,
      ),
  );
  let alignment: number | null = null,
    facing: boolean | null = null;
  for (const desk of relevantDesks)
    for (const chair of relevantChairs) {
      if (
        desk.dimensions.depth.value === null ||
        chair.dimensions.depth.value === null
      )
        continue;
      const front = localFront(desk.pose.quarterTurns),
        distance =
          desk.dimensions.depth.value / 2 +
          chair.dimensions.depth.value / 2 +
          POLICY.searchChairGapMm;
      const offset = Math.hypot(
        chair.pose.centerX - (desk.pose.centerX + front[0] * distance),
        chair.pose.centerZ - (desk.pose.centerZ + front[1] * distance),
      );
      if (alignment === null || offset < alignment) {
        alignment = offset;
        facing = chair.pose.quarterTurns === (desk.pose.quarterTurns + 2) % 4;
      }
    }
  const windowDistance =
    target && relevantDesks.length
      ? Math.min(
          ...relevantDesks.map((p) =>
            Math.hypot(p.pose.centerX - target[0], p.pose.centerZ - target[1]),
          ),
        )
      : null;
  const grouping =
    desks.length && chairs.length
      ? Math.min(
          ...desks.flatMap((d) =>
            chairs.map((c) =>
              Math.hypot(
                d.pose.centerX - c.pose.centerX,
                d.pose.centerZ - c.pose.centerZ,
              ),
            ),
          ),
        )
      : null;
  const footprints = room.furniture.map(footprint);
  let central: number | null = null,
    balance: number | null = null;
  if (
    width !== null &&
    depth !== null &&
    footprints.every((f): f is Region => !!f)
  ) {
    const centre = {
      minX: width * 0.25,
      maxX: width * 0.75,
      minZ: depth * 0.25,
      maxZ: depth * 0.75,
    };
    central = Math.max(
      0,
      area(centre) -
        unionArea(
          footprints
            .map((r) => intersection(r, centre))
            .filter((r): r is Region => !!r),
        ),
    );
    const weight = footprints.reduce((n, r) => n + area(r), 0);
    balance = weight
      ? Math.hypot(
          room.furniture.reduce(
            (n, p, i) => n + p.pose.centerX * area(footprints[i]!),
            0,
          ) /
            weight -
            width / 2,
          room.furniture.reduce(
            (n, p, i) => n + p.pose.centerZ * area(footprints[i]!),
            0,
          ) /
            weight -
            depth / 2,
        )
      : 0;
  }
  return { windowDistance, grouping, alignment, facing, central, balance };
}
export function searchFacts(
  before: RoomDocument,
  after: RoomDocument,
  goal: SearchGoal,
  checks: CheckFacts,
): SearchFacts {
  const a = roomFacts(before, goal),
    b = roomFacts(after, goal),
    changed: string[] = [];
  let displacement = 0;
  for (const item of after.furniture) {
    const old = before.furniture.find((p) => p.id === item.id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item))
      changed.push(item.id);
    if (old)
      displacement += Math.hypot(
        old.pose.centerX - item.pose.centerX,
        old.pose.centerZ - item.pose.centerZ,
      );
  }
  for (const item of before.furniture)
    if (!after.furniture.some((p) => p.id === item.id)) changed.push(item.id);
  if (
    before.room.floorFinish !== after.room.floorFinish ||
    before.room.wallFinish !== after.room.wallFinish
  )
    changed.push(before.roomId);
  return {
    windowDistanceMm: { before: a.windowDistance, after: b.windowDistance },
    centralFreeMm2: { before: a.central, after: b.central },
    deskChairDistanceMm: { before: a.grouping, after: b.grouping },
    deskChairAlignmentMm: { before: a.alignment, after: b.alignment },
    chairFacesDesk: { before: a.facing, after: b.facing },
    balanceDistanceMm: { before: a.balance, after: b.balance },
    displacementMm: displacement,
    changedIds: changed.sort(),
    coordinatedIds: changed.filter((id) => goal.targetIds.includes(id)).sort(),
    requiredPiecesPlaced: goal.additions.filter((p) =>
      after.furniture.some((f) => f.id === p.id),
    ).length,
    approximate: checks.coverage.some(
      (item) =>
        item.confidence === 'approximate' ||
        (item.rule !== 'entry-connectivity' && item.unassessed > 0),
    ),
    missingInputs: [
      ...new Set(
        checks.issues
          .filter(
            (i) =>
              i.severity === 'unassessed' && i.limitation !== 'not-implemented',
          )
          .flatMap((i) => i.requiredInputs)
          .filter((key) => missingInput(after, key)),
      ),
    ]
      .sort()
      .slice(0, 1024),
  };
}
/** Internal lexicographic goals; no unexplained aggregate percentage is displayed. */
export function candidateRank(
  goal: SearchGoal,
  facts: SearchFacts,
  checks: CheckFacts,
): number[] {
  const hard = checks.issues.filter((i) => i.severity === 'hard');
  const primary =
    goal.kind === 'rearrange-owned' ? -(facts.centralFreeMm2.after ?? 0) : 0;
  return [
    hard.length,
    hard.reduce((n, i) => n + (i.areaMm2 ?? 0), 0),
    -facts.requiredPiecesPlaced,
    goal.windowId ? (facts.windowDistanceMm.after ?? Infinity) : 0,
    primary,
    facts.deskChairAlignmentMm.after ?? 0,
    facts.chairFacesDesk.after === false ? 1 : 0,
    facts.changedIds.length,
    facts.displacementMm,
    -(facts.centralFreeMm2.after ?? 0),
    facts.deskChairDistanceMm.after ?? 0,
    facts.balanceDistanceMm.after ?? 0,
  ];
}
