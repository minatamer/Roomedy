import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { footprint } from '@roomedy/spatial';
import type { Presentation } from '../session/state';

export interface PlanBox {
  x: number;
  z: number;
  width: number;
  depth: number;
}
/** SVG +x right/east, +y down/south; SVG y is semantic Z, all units are mm. */
export function planBox(
  room: RoomDocument,
  view: Pick<Presentation, 'zoom' | 'panX' | 'panZ'>,
): PlanBox {
  const width = room.room.width.value ?? 4200,
    depth = room.room.depth.value ?? 4800;
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
  if (!enabled) return { x: half(raw.x), z: half(raw.z) };
  const bounds = footprint(item);
  if (!bounds) return { x: half(raw.x), z: half(raw.z) };
  const w = (bounds.maxX - bounds.minX) / 2,
    d = (bounds.maxZ - bounds.minZ) / 2;
  const xs: number[] = [],
    zs: number[] = [];
  if (room.room.width.value !== null) xs.push(w, room.room.width.value - w);
  if (room.room.depth.value !== null) zs.push(d, room.room.depth.value - d);
  for (const other of room.furniture) {
    if (other.id === item.id) continue;
    const r = footprint(other);
    if (!r) continue;
    // Edge contact only when the perpendicular spans actually meet.
    if (raw.z + d >= r.minZ && raw.z - d <= r.maxZ)
      xs.push(r.minX - w, r.maxX + w);
    if (raw.x + w >= r.minX && raw.x - w <= r.maxX)
      zs.push(r.minZ - d, r.maxZ + d);
  }
  const closest = (v: number, targets: number[]) => {
    const eligible = targets
      .filter((t) => Math.abs(v - t) <= 40)
      .sort((a, b) => Math.abs(a - v) - Math.abs(b - v) || a - b);
    return half(eligible[0] ?? Math.round(v / 50) * 50);
  };
  return { x: closest(raw.x, xs), z: closest(raw.z, zs) };
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
