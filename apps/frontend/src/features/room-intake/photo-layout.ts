import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { Region } from '@roomedy/contracts/issues';
import { POLICY } from '@roomedy/contracts/policy';
import {
  checkRoom,
  findCatalogueEntry,
  footprint,
  frontBand,
  furnitureBottom,
  intersection,
  localFront,
  planningRoom,
  verticallySeparate,
  wallBand,
  wallMountedPose,
} from '@roomedy/spatial';
import { displayFurnitureSize } from '../catalogue/display-size';
import { displayPosition, isRoomSource } from './draft';
import type { ReviewDraft } from './draft';
import {
  illustratedPhotoPose,
  observedPhotoWall,
  PHOTO_BACK_WALLS,
} from './photo-pose';

type Wall = Exclude<Feature['wall'], 'unknown'>;
const backWalls = PHOTO_BACK_WALLS;
const freshPhotoPose = (piece: Furniture) =>
  !piece.locks.position &&
  ['estimated', 'planned'].includes(piece.pose.provenance.status) &&
  [
    'draft-estimate',
    'photo-wall-plan',
    'photo-relation-plan',
    'photo-mount-plan',
    'photo-layout-plan',
  ].includes(piece.pose.provenance.sourceId ?? '');

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
          observation.sketch.quarterTurns === piece.pose.quarterTurns ||
          (observation.sketch.quarterTurns === null &&
            !!observation.wallView &&
            observation.wall === backWalls[piece.pose.quarterTurns]),
      )
    );
  };
  const walls = new Map<string, Wall>();
  for (const piece of draft.room.furniture) {
    const wall = observedPhotoWall(views.get(piece.id) ?? [], sources);
    if (wall && facing(piece) && wall === backWalls[piece.pose.quarterTurns])
      walls.set(piece.id, backWalls[piece.pose.quarterTurns]!);
  }
  const observedCenter = (piece: Furniture) => {
    const normalized = draft.links.find(
      (link) => link.entityId === piece.id,
    )?.normalized;
    if (piece.pose.provenance.sourceId !== 'photo-wall-plan' || !normalized)
      return piece.pose;
    const original = {
      ...piece,
      pose: { ...piece.pose, ...displayPosition(draft, normalized) },
    };
    const illustration = illustratedPhotoPose(
      draft.room,
      original,
      walls.get(piece.id),
    );
    // An illustrated wall snap must not turn an observed bedside neighbour into
    // a foot-end piece. Deliberately changed positions do not reuse old evidence.
    return illustration.centerX === piece.pose.centerX &&
      illustration.centerZ === piece.pose.centerZ
      ? original.pose
      : piece.pose;
  };
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
      const pieceCenter = observedCenter(piece),
        bedCenter = observedCenter(bed);
      const dx = pieceCenter.centerX - bedCenter.centerX,
        dz = pieceCenter.centerZ - bedCenter.centerZ;
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

const expanded = (r: Region, gap: number): Region => ({
  minX: r.minX - gap,
  maxX: r.maxX + gap,
  minZ: r.minZ - gap,
  maxZ: r.maxZ + gap,
});

type Unit = {
  anchor: Furniture;
  followers: { piece: Furniture; side: number }[];
};
type Layout = { pieces: Furniture[]; cost: number };

/** Owner-selected demo arrangement. Source positions are preferences, not physical constraints.
 * Only planned poses leave the disposable projection; all detected facts remain unchanged. */
export function planPhotoPlacement(
  room: RoomDocument,
  photoIds: readonly string[],
  walls: ReadonlyMap<string, Wall> = new Map(),
) {
  const proxy = planningRoom(room);
  const entry = (p: Furniture) =>
    findCatalogueEntry(p.catalogueId, p.catalogueVersion);
  const eligible = new Set(
    room.furniture
      .filter(
        (p) =>
          photoIds.includes(p.id) &&
          freshPhotoPose(p) &&
          (entry(p)?.placement === 'wall' ||
            entry(p)?.placement === 'ceiling' ||
            furnitureBottom(p) === 0),
      )
      .map((piece) => piece.id),
  );
  const unchanged = (unresolved: string[] = []) => ({
    room,
    adjusted: [] as string[],
    unresolved,
  });
  if (!eligible.size) return unchanged();
  // A wholly unlocatable solid is not permission to invent a safe route around it.
  if (
    room.room.features.some(
      (f) => f.kind === 'obstacle' && f.wall === 'unknown',
    ) ||
    room.furniture.some((p) => !displayFurnitureSize(p))
  )
    return unchanged([...eligible]);
  const width = proxy.room.width.value!,
    depth = proxy.room.depth.value!,
    height = proxy.room.height.value!;
  const movable = proxy.furniture.filter((p) => eligible.has(p.id));
  const fixed = proxy.furniture.filter((p) => !eligible.has(p.id));
  const units = new Map(
    movable.map((anchor): [string, Unit] => [
      anchor.id,
      { anchor, followers: [] },
    ]),
  );
  const distance = (a: Furniture, b: Furniture) =>
    (a.pose.centerX - b.pose.centerX) ** 2 +
    (a.pose.centerZ - b.pose.centerZ) ** 2;
  const occupied = new Set<string>();
  // Nearest unique work pairs, and up to one cabinet on each side of each bed.
  for (const kind of ['chair', 'bedside'] as const) {
    const children = movable.filter((p) =>
      kind === 'chair'
        ? entry(p)?.category === 'chair'
        : ['bedside-drawers', 'bedside-storage-fixed'].includes(p.catalogueId),
    );
    const parents = movable.filter(
      (p) => entry(p)?.category === (kind === 'chair' ? 'desk' : 'bed'),
    );
    const pairs = children
      .flatMap((child) => parents.map((parent) => ({ child, parent })))
      .sort(
        (a, b) =>
          distance(a.child, a.parent) - distance(b.child, b.parent) ||
          a.child.id.localeCompare(b.child.id),
      );
    for (const { child, parent } of pairs) {
      if (!units.has(child.id)) continue;
      const [fx, fz] = localFront(parent.pose.quarterTurns);
      const side =
        kind === 'chair'
          ? 0
          : (child.pose.centerX - parent.pose.centerX) * fz -
                (child.pose.centerZ - parent.pose.centerZ) * fx >=
              0
            ? 1
            : -1;
      const selected = !occupied.has(`${parent.id}:${side}`)
        ? side
        : kind === 'bedside' && !occupied.has(`${parent.id}:${-side}`)
          ? -side
          : null;
      if (selected === null) continue;
      units.get(parent.id)!.followers.push({ piece: child, side: selected });
      occupied.add(`${parent.id}:${selected}`);
      units.delete(child.id);
    }
  }
  const priority = (p: Furniture) =>
    entry(p)?.placement === 'ceiling'
      ? 7
      : [
          'bed',
          'wardrobe',
          'desk',
          'storage',
          'mirror',
          'lighting',
          'chair',
        ].indexOf(entry(p)?.category ?? '');
  const ordered = [...units.values()].sort(
    (a, b) =>
      priority(a.anchor) - priority(b.anchor) ||
      b.anchor.dimensions.width.value! * b.anchor.dimensions.depth.value! -
        a.anchor.dimensions.width.value! * a.anchor.dimensions.depth.value! ||
      a.anchor.id.localeCompare(b.anchor.id),
  );
  const inside = (b: Region) =>
    b.minX >= 0 && b.maxX <= width && b.minZ >= 0 && b.maxZ <= depth;
  const featureBands = proxy.room.features.map((f) => ({
    f,
    box: wallBand(
      proxy,
      f,
      f.kind === 'door'
        ? Math.max(POLICY.doorApproachMm, f.width.value!)
        : f.kind === 'obstacle'
          ? f.projection.value!
          : POLICY.windowBandMm,
    )!,
  }));
  const hardAccess = (p: Furniture) => {
    const e = entry(p);
    return e && e.accessMm && e.accessMechanism !== 'none'
      ? frontBand(
          footprint(p)!,
          e.accessMechanism === 'chair-pullout'
            ? (p.pose.quarterTurns + 2) % 4
            : p.pose.quarterTurns,
          e.accessMm,
        )
      : null;
  };
  const conflict = (a: Furniture, b: Furniture, gap: number) =>
    !verticallySeparate(a, b) &&
    (!!intersection(footprint(a)!, expanded(footprint(b)!, gap)) ||
      !!(hardAccess(a) && intersection(hardAccess(a)!, footprint(b)!)) ||
      !!(hardAccess(b) && intersection(hardAccess(b)!, footprint(a)!)));
  const valid = (pieces: Furniture[], placed: Furniture[]) =>
    pieces.every((p, index) => {
      const e = entry(p),
        bottom = furnitureBottom(p);
      if (
        bottom === null ||
        bottom < 0 ||
        bottom + p.dimensions.height.value! > height ||
        !inside(footprint(p)!) ||
        (hardAccess(p) && !inside(hardAccess(p)!))
      )
        return false;
      if (
        placed.some((other) => conflict(p, other, 50)) ||
        pieces.slice(0, index).some((other) => conflict(p, other, 0))
      )
        return false;
      return !featureBands.some(({ f, box }) => {
        if (
          !box ||
          !intersection(footprint(p)!, box) ||
          bottom >= f.sill.value! + f.height.value! ||
          bottom + p.dimensions.height.value! <= f.sill.value!
        )
          return false;
        if (f.kind !== 'window') return true;
        return (
          e?.placement === 'wall' ||
          ['wardrobe', 'storage', 'mirror'].includes(e?.category ?? '')
        );
      });
    });
  const layout = (unit: Unit, pose: Furniture['pose']) => {
    const anchor = {
      ...unit.anchor,
      pose: wallMountedPose(proxy, unit.anchor, pose),
    };
    const [fx, fz] = localFront(anchor.pose.quarterTurns),
      [rx, rz] = [fz, -fx];
    return [
      anchor,
      ...unit.followers.map(({ piece, side }) => {
        const front =
          side === 0
            ? (anchor.dimensions.depth.value! + piece.dimensions.depth.value!) /
                2 +
              POLICY.searchChairGapMm
            : (piece.dimensions.depth.value! - anchor.dimensions.depth.value!) /
              2;
        const lateral =
          (side *
            (anchor.dimensions.width.value! +
              piece.dimensions.width.value! +
              100)) /
          2;
        return {
          ...piece,
          pose: {
            ...piece.pose,
            centerX: anchor.pose.centerX + fx * front + rx * lateral,
            centerZ: anchor.pose.centerZ + fz * front + rz * lateral,
            quarterTurns: (side === 0
              ? (anchor.pose.quarterTurns + 2) % 4
              : anchor.pose.quarterTurns) as 0 | 1 | 2 | 3,
          },
        };
      }),
    ];
  };
  const axes = (
    origin: number,
    low: number,
    high: number,
    values: number[],
    limit: number,
  ) => {
    if (low > high) return [];
    const clamp = (n: number) =>
      Math.round(Math.max(low, Math.min(high, n)) * 2) / 2;
    return [
      ...new Set([
        low,
        high,
        ...[
          origin,
          low + 50,
          high - 50,
          ...values,
          ...Array.from(
            { length: 15 },
            (_, i) => low + ((high - low) * (i + 1)) / 16,
          ),
        ]
          .map(clamp)
          .sort((a, b) => Math.abs(a - origin) - Math.abs(b - origin) || a - b)
          .slice(0, limit - 2),
      ]),
    ];
  };
  const candidates = (unit: Unit, placed: Furniture[]) => {
    const p = unit.anchor,
      e = entry(p),
      edge = e?.placement !== 'ceiling' && e?.category !== 'chair';
    const turns =
      !edge || p.locks.rotation
        ? [p.pose.quarterTurns]
        : ([0, 1, 2, 3] as const);
    const blockers = [
      ...placed.map((p) => footprint(p)!),
      ...featureBands.map(({ box }) => box).filter(Boolean),
    ];
    const result: Layout[] = [];
    for (const quarterTurns of turns) {
      const relative = layout(unit, {
        ...p.pose,
        centerX: 0,
        centerZ: 0,
        quarterTurns,
      });
      // Wall/ceiling mounting needs the real frame, so derive unit extents relative
      // to its mounted anchor, not to a hypothetical zero wall coordinate.
      const root = relative[0]!,
        boxes = relative.map((q) => footprint(q)!);
      const ext = {
        minX: Math.min(...boxes.map((b) => b.minX - root.pose.centerX)),
        maxX: Math.max(...boxes.map((b) => b.maxX - root.pose.centerX)),
        minZ: Math.min(...boxes.map((b) => b.minZ - root.pose.centerZ)),
        maxZ: Math.max(...boxes.map((b) => b.maxZ - root.pose.centerZ)),
      };
      const xs = axes(
        p.pose.centerX,
        -ext.minX,
        width - ext.maxX,
        blockers.flatMap((b) => [
          b.minX - ext.maxX - 50,
          b.maxX - ext.minX + 50,
        ]),
        edge ? 32 : 12,
      );
      const zs = axes(
        p.pose.centerZ,
        -ext.minZ,
        depth - ext.maxZ,
        blockers.flatMap((b) => [
          b.minZ - ext.maxZ - 50,
          b.maxZ - ext.minZ + 50,
        ]),
        edge ? 32 : 12,
      );
      const own = footprint({
        ...p,
        pose: { ...p.pose, quarterTurns, centerX: 0, centerZ: 0 },
      })!;
      const gap = e?.placement === 'wall' ? 0 : 50;
      const positions = edge
        ? quarterTurns === 0
          ? xs.map((centerX) => ({ centerX, centerZ: -own.minZ + gap }))
          : quarterTurns === 1
            ? zs.map((centerZ) => ({
                centerX: width - own.maxX - gap,
                centerZ,
              }))
            : quarterTurns === 2
              ? xs.map((centerX) => ({
                  centerX,
                  centerZ: depth - own.maxZ - gap,
                }))
              : zs.map((centerZ) => ({ centerX: -own.minX + gap, centerZ }))
        : xs.flatMap((centerX) => zs.map((centerZ) => ({ centerX, centerZ })));
      for (const position of positions) {
        const pieces = layout(unit, { ...p.pose, ...position, quarterTurns });
        if (
          pieces.some(
            (q) =>
              q.locks.rotation &&
              q.pose.quarterTurns !==
                movable.find((v) => v.id === q.id)!.pose.quarterTurns,
          )
        )
          continue;
        const cost =
          pieces.reduce((sum, q) => {
            const old = movable.find((v) => v.id === q.id)!;
            const turns = Math.abs(old.pose.quarterTurns - q.pose.quarterTurns);
            return (
              sum +
              distance(q, old) * (q.id === p.id ? 2 : 1) +
              Math.min(turns, 4 - turns) ** 2 * 90_000
            );
          }, 0) +
          (walls.has(p.id) && walls.get(p.id) !== backWalls[quarterTurns]
            ? (width ** 2 + depth ** 2) * (unit.followers.length + 1) * 4
            : 0);
        result.push({ pieces, cost });
      }
    }
    return result
      .sort(
        (a, b) =>
          a.cost - b.cost ||
          a.pieces[0]!.pose.quarterTurns - b.pieces[0]!.pose.quarterTurns ||
          a.pieces[0]!.pose.centerX - b.pieces[0]!.pose.centerX ||
          a.pieces[0]!.pose.centerZ - b.pieces[0]!.pose.centerZ,
      )
      .slice(0, 128);
  };
  let beam: Layout[] = [{ pieces: fixed, cost: 0 }],
    nodes = 0;
  for (const unit of ordered) {
    const next: Layout[] = [];
    for (const state of beam) {
      let accepted = 0;
      for (const candidate of candidates(unit, state.pieces)) {
        if (++nodes > 32768) return unchanged([...eligible]);
        if (!valid(candidate.pieces, state.pieces)) continue;
        next.push({
          pieces: [...state.pieces, ...candidate.pieces],
          cost: state.cost + candidate.cost,
        });
        if (++accepted === 8) break;
      }
    }
    if (!next.length) return unchanged([...eligible]);
    beam = next.sort((a, b) => a.cost - b.cost).slice(0, 8);
  }
  const selected = beam.find(
    (state) =>
      !checkRoom({ ...proxy, furniture: state.pieces }).issues.some(
        (i) =>
          i.severity === 'hard' && i.objectIds.some((id) => eligible.has(id)),
      ),
  );
  if (!selected) return unchanged([...eligible]);
  const adjusted: string[] = [];
  const furniture = room.furniture.map((p) => {
    if (!eligible.has(p.id)) return p;
    const pose = selected.pieces.find((q) => q.id === p.id)!.pose;
    if (
      ['centerX', 'centerZ', 'quarterTurns', 'bottomY'].every(
        (key) =>
          pose[key as keyof typeof pose] === p.pose[key as keyof typeof pose],
      )
    )
      return p;
    adjusted.push(p.id);
    return {
      ...p,
      pose: {
        ...pose,
        provenance: {
          status: 'planned' as const,
          sourceId: 'photo-layout-plan',
        },
      },
    };
  });
  return {
    room: adjusted.length ? { ...room, furniture } : room,
    adjusted,
    unresolved: [] as string[],
  };
}
