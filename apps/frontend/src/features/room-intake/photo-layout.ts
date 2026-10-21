import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { Region } from '@roomedy/contracts/issues';
import { POLICY } from '@roomedy/contracts/policy';
import {
  checkRoom,
  findCatalogueEntry,
  footprint,
  furnitureBottom,
  intersection,
  localFront,
  verticallySeparate,
  wallBand,
} from '@roomedy/spatial';
import { displayFurnitureSize } from '../catalogue/display-size';
import { isRoomSource } from './draft';
import type { ReviewDraft } from './draft';

type Wall = Exclude<Feature['wall'], 'unknown'>;
const backWalls: readonly Wall[] = ['north', 'east', 'south', 'west'];
const freshPhotoPose = (piece: Furniture) =>
  !piece.locks.position &&
  piece.pose.provenance.status === 'estimated' &&
  piece.pose.provenance.sourceId === 'draft-estimate';

/** Direct room-view walls anchor the plan; a uniquely co-visible bedside may follow its bed.
 * This planning relationship never changes photographic evidence or measurements. */
export function photoBackWalls(draft: ReviewDraft) {
  const sources = new Set(
    draft.sources
      .filter((source) => source.available && isRoomSource(source))
      .map((source) => source.id),
  );
  const views = new Map(
    draft.links.map((link) => [
      link.entityId,
      draft.observations.filter(
        (observation) =>
          link.observations.includes(observation.ref) &&
          sources.has(observation.sourceId) &&
          observation.kind === 'furniture',
      ),
    ]),
  );
  const facing = (piece: Furniture) => {
    const observed = (views.get(piece.id) ?? []).filter(
      (observation) =>
        observation.poseEvidence.status !== 'unknown' &&
        sources.has(observation.poseEvidence.sourceId ?? ''),
    );
    return (
      observed.length > 0 &&
      observed.every(
        (observation) =>
          observation.sketch.quarterTurns === piece.pose.quarterTurns,
      )
    );
  };
  const walls = new Map<string, Wall>();
  for (const piece of draft.room.furniture) {
    const observations = (views.get(piece.id) ?? []).filter(
      (observation) =>
        observation.wall !== 'unknown' &&
        observation.wallEvidence.status !== 'unknown' &&
        sources.has(observation.wallEvidence.sourceId ?? ''),
    );
    const known = new Set(observations.map((observation) => observation.wall));
    if (
      known.size === 1 &&
      facing(piece) &&
      known.has(backWalls[piece.pose.quarterTurns]!)
    )
      walls.set(piece.id, backWalls[piece.pose.quarterTurns]!);
  }
  const beds = draft.room.furniture.filter(
    (piece) =>
      walls.has(piece.id) &&
      freshPhotoPose(piece) &&
      findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
        ?.category === 'bed',
  );
  for (const piece of draft.room.furniture) {
    const observations = views.get(piece.id) ?? [];
    if (
      walls.has(piece.id) ||
      !freshPhotoPose(piece) ||
      !['bedside-drawers', 'bedside-storage-fixed'].includes(
        piece.catalogueId,
      ) ||
      !facing(piece) ||
      observations.some((observation) => observation.wall !== 'unknown')
    )
      continue;
    const size = displayFurnitureSize(piece);
    if (!size) continue;
    const candidates = beds.filter((bed) => {
      if (bed.pose.quarterTurns !== piece.pose.quarterTurns) return false;
      const bedViews = views.get(bed.id) ?? [];
      if (
        !observations.some((observation) =>
          bedViews.some((view) => view.sourceId === observation.sourceId),
        )
      )
        return false;
      const bedSize = displayFurnitureSize(bed);
      if (!bedSize) return false;
      const [frontX, frontZ] = localFront(bed.pose.quarterTurns);
      const dx = piece.pose.centerX - bed.pose.centerX,
        dz = piece.pose.centerZ - bed.pose.centerZ;
      const lateral = Math.abs(dx * frontZ - dz * frontX),
        forward = dx * frontX + dz * frontZ;
      return (
        lateral >= Math.max(0, (bedSize.width - size.width) / 2) &&
        lateral <= (bedSize.width + size.width) / 2 + 600 &&
        forward >= -bedSize.depth / 2 - size.depth &&
        forward <= bedSize.depth / 4
      );
    });
    if (candidates.length === 1)
      walls.set(piece.id, walls.get(candidates[0]!.id)!);
  }
  return walls;
}

const estimate = (value: number) => ({
  value,
  status: 'estimated' as const,
  sourceId: 'photo-preview',
});
const expanded = (r: Region, gap: number): Region => ({
  minX: r.minX - gap,
  maxX: r.maxX + gap,
  minZ: r.minZ - gap,
  maxZ: r.maxZ + gap,
});

/** Reconcile fresh photo centres with the illustrated envelopes before accepting one baseline.
 * Proxy sizes/frame never leave this function or become measurement/check evidence. */
export function planPhotoPlacement(
  room: RoomDocument,
  photoIds: readonly string[],
  walls: ReadonlyMap<string, Wall> = new Map(),
) {
  const proxy = structuredClone(room),
    next = structuredClone(room);
  for (const [axis, fallback] of [
    ['width', 4200],
    ['depth', 4800],
    ['height', 2600],
  ] as const)
    if (proxy.room[axis].value === null) proxy.room[axis] = estimate(fallback);
  for (const piece of proxy.furniture) {
    const size = displayFurnitureSize(piece);
    if (size)
      for (const axis of ['width', 'depth', 'height'] as const)
        if (piece.dimensions[axis].value === null)
          piece.dimensions[axis] = estimate(size[axis]);
  }
  const eligible = new Set(
    room.furniture
      .filter((piece) => {
        const entry = findCatalogueEntry(
          piece.catalogueId,
          piece.catalogueVersion,
        );
        return (
          photoIds.includes(piece.id) &&
          freshPhotoPose(piece) &&
          furnitureBottom(piece) === 0 &&
          (!entry?.placement || entry.placement === 'floor')
        );
      })
      .map((piece) => piece.id),
  );
  const placed = proxy.furniture.filter((piece) => !eligible.has(piece.id));
  const movable = proxy.furniture
    .filter((piece) => eligible.has(piece.id))
    .sort((a, b) => {
      const x = footprint(a),
        y = footprint(b);
      return (
        (y ? (y.maxX - y.minX) * (y.maxZ - y.minZ) : 0) -
        (x ? (x.maxX - x.minX) * (x.maxZ - x.minZ) : 0)
      );
    });
  const features: Region[] = [];
  let unknownObstruction = false;
  for (const feature of proxy.room.features) {
    if (feature.kind === 'window') continue;
    const reach =
      feature.kind === 'obstacle'
        ? feature.projection.value
        : feature.mechanism === 'inward' || feature.mechanism === 'unknown'
          ? Math.max(feature.width.value ?? 0, POLICY.doorApproachMm)
          : POLICY.doorApproachMm;
    const region = reach === null ? undefined : wallBand(proxy, feature, reach);
    if (region) features.push(region);
    else unknownObstruction = true;
  }
  const adjusted: string[] = [],
    unresolved: string[] = [];
  const width = proxy.room.width.value!,
    depth = proxy.room.depth.value!;
  for (const piece of movable) {
    const bounds = footprint(piece);
    if (!bounds) {
      unresolved.push(piece.id);
      continue;
    }
    const halfX = (bounds.maxX - bounds.minX) / 2,
      halfZ = (bounds.maxZ - bounds.minZ) / 2;
    const wall =
      walls.get(piece.id) === backWalls[piece.pose.quarterTurns]
        ? walls.get(piece.id)
        : undefined;
    const pinX =
      wall === 'west'
        ? halfX + 50
        : wall === 'east'
          ? width - halfX - 50
          : undefined;
    const pinZ =
      wall === 'north'
        ? halfZ + 50
        : wall === 'south'
          ? depth - halfZ - 50
          : undefined;
    const start = {
      centerX: pinX ?? piece.pose.centerX,
      centerZ: pinZ ?? piece.pose.centerZ,
    };
    const record = (position: typeof start) => {
      const changed =
        position.centerX !== piece.pose.centerX ||
        position.centerZ !== piece.pose.centerZ;
      piece.pose = { ...piece.pose, ...position };
      placed.push(piece);
      if (!changed) return;
      const target = next.furniture.find((other) => other.id === piece.id)!;
      target.pose = {
        ...target.pose,
        ...position,
        provenance: { status: 'planned', sourceId: 'photo-layout-plan' },
      };
      adjusted.push(piece.id);
    };
    const blockers = [
      ...placed
        .filter((other) => !verticallySeparate(piece, other))
        .flatMap((other) => {
          const box = footprint(other);
          return box ? [expanded(box, 50)] : [];
        }),
      ...features,
    ];
    const valid = (candidate: Furniture) => {
      const box = footprint(candidate)!;
      return (
        box.minX >= 0 &&
        box.maxX <= width &&
        box.minZ >= 0 &&
        box.maxZ <= depth &&
        !blockers.some((other) => intersection(box, other)) &&
        !checkRoom({ ...proxy, furniture: [...placed, candidate] }).issues.some(
          (issue) =>
            issue.severity === 'hard' && issue.objectIds.includes(candidate.id),
        )
      );
    };
    if (
      unknownObstruction &&
      (start.centerX !== piece.pose.centerX ||
        start.centerZ !== piece.pose.centerZ)
    ) {
      unresolved.push(piece.id);
      continue;
    }
    if (valid({ ...piece, pose: { ...piece.pose, ...start } })) {
      record(start);
      continue;
    }
    if (unknownObstruction || halfX * 2 > width || halfZ * 2 > depth) {
      unresolved.push(piece.id);
      continue;
    }
    const axes = (
      origin: number,
      half: number,
      edge: number,
      values: number[],
    ) =>
      [
        ...new Set(
          [origin, half, edge - half, ...values].map(
            (value) =>
              Math.round(Math.max(half, Math.min(edge - half, value)) * 2) / 2,
          ),
        ),
      ]
        .sort((a, b) => Math.abs(a - origin) - Math.abs(b - origin) || a - b)
        .slice(0, 16);
    const xs =
      pinX === undefined
        ? axes(
            piece.pose.centerX,
            halfX,
            width,
            blockers.flatMap((box) => [box.minX - halfX, box.maxX + halfX]),
          )
        : [pinX];
    const zs =
      pinZ === undefined
        ? axes(
            piece.pose.centerZ,
            halfZ,
            depth,
            blockers.flatMap((box) => [box.minZ - halfZ, box.maxZ + halfZ]),
          )
        : [pinZ];
    const candidates = xs
      .flatMap((centerX) => zs.map((centerZ) => ({ centerX, centerZ })))
      .sort(
        (a, b) =>
          (a.centerX - piece.pose.centerX) ** 2 +
            (a.centerZ - piece.pose.centerZ) ** 2 -
            ((b.centerX - piece.pose.centerX) ** 2 +
              (b.centerZ - piece.pose.centerZ) ** 2) ||
          a.centerX - b.centerX ||
          a.centerZ - b.centerZ,
      );
    const position = candidates.find((position) =>
      valid({ ...piece, pose: { ...piece.pose, ...position } }),
    );
    if (!position) {
      unresolved.push(piece.id);
      continue;
    }
    record(position);
  }
  // Never publish a partial repair that still leaves another starting estimate unresolved.
  return unresolved.length
    ? { room, adjusted: [], unresolved }
    : { room: adjusted.length ? next : room, adjusted, unresolved };
}
