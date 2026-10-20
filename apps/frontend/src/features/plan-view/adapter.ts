import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import {
  findCatalogueEntry,
  footprint,
  localFront,
  wallBand,
  wallMountedPose,
} from '@roomedy/spatial';
import type { Presentation, RoomFrame } from '../session/state';

export interface PlanBox {
  x: number;
  z: number;
  width: number;
  depth: number;
}
/** Compact known names, independent of user-authored labels and model prose. */
export function planFurnitureName(item: Furniture): string {
  const category =
    findCatalogueEntry(item.catalogueId, item.catalogueVersion)?.category ??
    'piece';
  return (
    (
      {
        'tv-stand': 'TV stand',
        'chest-drawers': 'Drawers',
        'bedside-drawers': 'Drawers',
        'bedroom-bench': 'Bench',
        armchair: 'Chair',
        'floor-lamp': 'Lamp',
        'side-table': 'Table',
        'drawer-shelf': 'Shelf',
        'full-length-mirror': 'Mirror',
      } as Record<string, string>
    )[item.catalogueId] ??
    (category === 'tv'
      ? 'TV'
      : category === 'storage'
        ? item.catalogueId === 'bedside-storage-fixed'
          ? 'Cabinet'
          : 'Shelf'
        : category[0]!.toUpperCase() + category.slice(1))
  );
}
export interface PlanTextLayout {
  rotation: 0 | -90;
  fontSize: number;
  lines: string[];
}
export interface PlanLabelLayout extends PlanTextLayout {
  x: number;
  y: number;
  outside: boolean;
}
const inset = (span: number) => span - Math.min(120, span * 0.2);
/** Fixed-work whole-word fitting; prefer horizontal unless sideways helps materially. */
export function fitPlanText(
  text: string,
  width: number,
  depth: number,
  cap = 185,
): PlanTextLayout {
  const words = text.trim().split(/\s+/),
    lineSets = [words.join(' ')].map((line) => [line]);
  for (let i = 1; i < Math.min(words.length, 4); i++)
    lineSets.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
  let best: PlanTextLayout | null = null;
  for (const rotation of [0, -90] as const) {
    for (const lines of lineSets) {
      const fontSize = Math.min(
        cap,
        inset(rotation ? depth : width) /
          (Math.max(1, ...lines.map((line) => line.length)) * 0.6),
        inset(rotation ? width : depth) / (lines.length * 1.15),
      );
      if (
        !best ||
        fontSize > best.fontSize * (rotation !== best.rotation ? 1.12 : 1.08)
      )
        best = { rotation, fontSize, lines };
    }
  }
  return best!;
}
function textSize(layout: PlanTextLayout) {
  const width =
      Math.max(1, ...layout.lines.map((line) => line.length)) *
      layout.fontSize *
      0.6,
    depth = layout.lines.length * layout.fontSize * 1.15;
  return layout.rotation ? { width: depth, depth: width } : { width, depth };
}
const within = (value: number, radius: number, edge: number) =>
  edge < radius * 2
    ? edge / 2
    : Math.max(radius, Math.min(edge - radius, value));
/** Display-only opening caption. Unknown pose/size never invents an opening. */
export function planOpeningLabel(
  room: RoomDocument,
  feature: Extract<Feature, { kind: 'door' | 'window' }>,
): PlanLabelLayout | null {
  const across =
    feature.wall === 'north' || feature.wall === 'south'
      ? room.room.depth.value
      : room.room.width.value;
  const band = wallBand(
    room,
    feature,
    Math.min(
      feature.kind === 'window' ? 400 : (feature.width.value ?? 700),
      700,
      across ?? 700,
    ),
  );
  if (!band) return null;
  const layout: PlanTextLayout =
      feature.kind === 'window'
        ? {
            rotation:
              feature.wall === 'east' || feature.wall === 'west' ? -90 : 0,
            fontSize: Math.min(
              160,
              inset(Math.max(feature.width.value ?? 700, 700)) / 3.6,
              inset(Math.min(400, across ?? 400)) / 1.15,
            ),
            lines: ['Window'],
          }
        : fitPlanText(
            feature.purpose === 'balcony'
              ? 'Balcony Doors'
              : feature.purpose === 'bathroom'
                ? 'Bathroom Door'
                : 'Door',
            band.maxX - band.minX,
            band.maxZ - band.minZ,
            160,
          ),
    size = textSize(layout);
  const label: PlanLabelLayout = {
    ...layout,
    outside: false,
    x: within(
      (band.minX + band.maxX) / 2,
      size.width / 2,
      room.room.width.value ?? 4200,
    ),
    y: within(
      (band.minZ + band.maxZ) / 2,
      size.depth / 2,
      room.room.depth.value ?? 4800,
    ),
  };
  if (
    feature.kind === 'window' &&
    room.furniture.some((item) => {
      const r = footprint(item);
      return (
        r &&
        label.x - size.width / 2 < r.maxX &&
        label.x + size.width / 2 > r.minX &&
        label.y - size.depth / 2 < r.maxZ &&
        label.y + size.depth / 2 > r.minZ
      );
    })
  )
    return {
      ...label,
      outside: true,
      x:
        feature.wall === 'west'
          ? -380
          : feature.wall === 'east'
            ? (room.room.width.value ?? 4200) + 200
            : label.x,
      y:
        feature.wall === 'north'
          ? -380
          : feature.wall === 'south'
            ? (room.room.depth.value ?? 4800) + 200
            : label.y,
    };
  return label;
}
/** Fit inside the usable footprint, or choose one of four bounded nearby captions. */
export function planLabelLayout(
  item: Furniture,
  text: string,
  fontSize = 185,
  room?: RoomDocument,
): PlanLabelLayout {
  const physical = footprint(item),
    bounds = physical ?? {
      minX: item.pose.centerX - 260,
      maxX: item.pose.centerX + 260,
      minZ: item.pose.centerZ - 260,
      maxZ: item.pose.centerZ + 260,
    },
    front = localFront(item.pose.quarterTurns),
    reserve = physical ? Math.min(160, item.dimensions.depth.value! * 0.3) : 0,
    layout = fitPlanText(
      text,
      bounds.maxX - bounds.minX - Math.abs(front[0]) * reserve,
      bounds.maxZ - bounds.minZ - Math.abs(front[1]) * reserve,
      fontSize,
    ),
    tv =
      findCatalogueEntry(item.catalogueId, item.catalogueVersion)?.category ===
      'tv';
  if (!tv && layout.fontSize >= 110)
    return {
      ...layout,
      x: (-front[0] * reserve) / 2,
      y: (-front[1] * reserve) / 2,
      outside: false,
    };
  const caption: PlanTextLayout = {
      rotation: 0,
      fontSize: Math.min(fontSize, 135),
      lines: [text],
    },
    size = textSize(caption),
    overlap = (x: number, y: number, r: typeof bounds) =>
      Math.max(
        0,
        Math.min(x + size.width / 2, r.maxX) -
          Math.max(x - size.width / 2, r.minX),
      ) *
      Math.max(
        0,
        Math.min(y + size.depth / 2, r.maxZ) -
          Math.max(y - size.depth / 2, r.minZ),
      ),
    others =
      room?.furniture
        .filter((other) => other.id !== item.id)
        .map(footprint)
        .filter((r) => !!r) ?? [],
    openings =
      room?.room.features.flatMap((feature) => {
        const label =
          feature.kind !== 'obstacle' ? planOpeningLabel(room, feature) : null;
        if (!label) return [];
        const extent = textSize(label);
        return [
          {
            minX: label.x - extent.width / 2,
            maxX: label.x + extent.width / 2,
            minZ: label.y - extent.depth / 2,
            maxZ: label.y + extent.depth / 2,
          },
        ];
      }) ?? [];
  // Thin footprints draw their front chevron beyond the body (up to110mm).
  const gap = physical && item.dimensions.depth.value! < 250 ? 150 : 80;
  let best = { x: item.pose.centerX, y: item.pose.centerZ, score: Infinity };
  for (const [dx, dz] of [
    front,
    [-front[0], -front[1]],
    [front[1], -front[0]],
    [-front[1], front[0]],
  ]) {
    let x =
        dx! > 0
          ? bounds.maxX + gap + size.width / 2
          : dx! < 0
            ? bounds.minX - gap - size.width / 2
            : item.pose.centerX,
      y =
        dz! > 0
          ? bounds.maxZ + gap + size.depth / 2
          : dz! < 0
            ? bounds.minZ - gap - size.depth / 2
            : item.pose.centerZ;
    if (room) {
      x = within(x, size.width / 2, room.room.width.value ?? 4200);
      y = within(y, size.depth / 2, room.room.depth.value ?? 4800);
    }
    const score =
      overlap(x, y, bounds) * 4 +
      [...others, ...openings].reduce((sum, r) => sum + overlap(x, y, r), 0);
    if (score < best.score) best = { x, y, score };
    if (score === 0) break;
  }
  return {
    ...caption,
    outside: true,
    x: best.x - item.pose.centerX,
    y: best.y - item.pose.centerZ,
  };
}
/** Keep the old-position outline; omit its annotation when it crosses the proposal. */
export function planPreviousLabelVisible(
  room: RoomDocument,
  previous: Furniture,
): boolean {
  const annotation = {
    minX: previous.pose.centerX - 570,
    maxX: previous.pose.centerX + 570,
    minZ: previous.pose.centerZ - 130,
    maxZ: previous.pose.centerZ + 30,
  };
  const overlaps = (r: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }) =>
    annotation.minX < r.maxX &&
    annotation.maxX > r.minX &&
    annotation.minZ < r.maxZ &&
    annotation.maxZ > r.minZ;
  if (
    room.furniture.some((item) => {
      const r = footprint(item);
      return r && overlaps(r);
    })
  )
    return false;
  return !room.room.features.some((feature) => {
    const label =
      feature.kind !== 'obstacle' ? planOpeningLabel(room, feature) : null;
    if (!label) return false;
    const size = textSize(label);
    return overlaps({
      minX: label.x - size.width / 2,
      maxX: label.x + size.width / 2,
      minZ: label.y - size.depth / 2,
      maxZ: label.y + size.depth / 2,
    });
  });
}
/** SVG +x right/east, +y down/south; SVG y is semantic Z, all units are mm. */
export function planBox(
  room: RoomDocument,
  view: Pick<Presentation, 'zoom' | 'panX' | 'panZ'>,
  frame?: Pick<RoomFrame, 'width' | 'depth'>,
): PlanBox {
  const width = frame?.width ?? room.room.width.value ?? 4200,
    depth = frame?.depth ?? room.room.depth.value ?? 4800;
  const spanX = (width + 1000) / view.zoom,
    spanZ = (depth + 1000) / view.zoom;
  return {
    x: width / 2 - spanX / 2 + view.panX,
    z: depth / 2 - spanZ / 2 + view.panZ,
    width: spanX,
    depth: spanZ,
  };
}
/** Independent viewport conversion, including SVG's centred meet letterboxing. */
export function pointInPlan(
  client: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  box: PlanBox,
) {
  const scale = Math.min(rect.width / box.width, rect.height / box.depth);
  return {
    x:
      box.x +
      (client.x - rect.left - (rect.width - box.width * scale) / 2) / scale,
    z:
      box.z +
      (client.y - rect.top - (rect.height - box.depth * scale) / 2) / scale,
  };
}
const half = (v: number) => Math.round(v * 2) / 2;
export function snapPosition(
  room: RoomDocument,
  item: Furniture,
  raw: { x: number; z: number },
  enabled: boolean,
) {
  const bounds = footprint(item);
  if (!bounds) return { x: half(raw.x), z: half(raw.z) };
  const w = (bounds.maxX - bounds.minX) / 2,
    d = (bounds.maxZ - bounds.minZ) / 2;
  const constrain = (v: number, radius: number, edge: number | null) =>
    edge !== null && edge >= radius * 2
      ? Math.max(radius, Math.min(edge - radius, half(v)))
      : half(v);
  const inside = (point: { x: number; z: number }) => {
    const pose = wallMountedPose(room, item, {
      ...item.pose,
      centerX: constrain(point.x, w, room.room.width.value),
      centerZ: constrain(point.z, d, room.room.depth.value),
    });
    return { x: pose.centerX, z: pose.centerZ };
  };
  // Clamping is independent of optional grid/edge snapping, in actual physical mm.
  const requested = inside(raw);
  if (!enabled) return requested;
  const xs: number[] = [],
    zs: number[] = [];
  if (room.room.width.value !== null) xs.push(w, room.room.width.value - w);
  if (room.room.depth.value !== null) zs.push(d, room.room.depth.value - d);
  for (const other of room.furniture) {
    if (other.id === item.id) continue;
    const r = footprint(other);
    if (!r) continue;
    // Edge contact only when the perpendicular spans actually meet.
    if (requested.z + d >= r.minZ && requested.z - d <= r.maxZ)
      xs.push(r.minX - w, r.maxX + w);
    if (requested.x + w >= r.minX && requested.x - w <= r.maxX)
      zs.push(r.minZ - d, r.maxZ + d);
  }
  const closest = (v: number, targets: number[]) => {
    const eligible = targets
      .filter((t) => Math.abs(v - t) <= 40)
      .sort((a, b) => Math.abs(a - v) - Math.abs(b - v) || a - b);
    return half(eligible[0] ?? Math.round(v / 50) * 50);
  };
  return inside({ x: closest(requested.x, xs), z: closest(requested.z, zs) });
}
export function nudgePosition(
  item: Furniture,
  key: string,
  shift = false,
  alt = false,
) {
  const step = alt ? 0.5 : shift ? 100 : 10;
  const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
  const dz = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
  return {
    centerX: half(item.pose.centerX + dx),
    centerZ: half(item.pose.centerZ + dz),
    quarterTurns: item.pose.quarterTurns,
  };
}
