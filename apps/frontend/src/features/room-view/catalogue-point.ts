import type { RoomDocument, Furniture } from '@roomedy/contracts/room';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { FloorRay, FloorPoint } from './manipulation';
import { pointOnFloor } from './manipulation';

export type CataloguePoint = FloorPoint & {
  bottomY?: number;
  quarterTurns?: Furniture['pose']['quarterTurns'];
};
/** Ray hits visible room walls, not the floor behind an elevated pointer. */
export function cataloguePoint(
  ray: FloorRay,
  room: RoomDocument,
  item: Furniture,
  entry: CatalogueEntry,
): CataloguePoint | null {
  if (entry.placement !== 'wall') return pointOnFloor(ray);
  const width = (room.room.width.value ?? 4200) / 1000,
    depth = (room.room.depth.value ?? 4800) / 1000,
    height = (room.room.height.value ?? 2600) / 1000;
  const { origin: o, direction: d } = ray;
  if (![o.x, o.y, o.z, d.x, d.y, d.z].every(Number.isFinite)) return null;
  const inside =
    o.x > 0 && o.x < width && o.z > 0 && o.z < depth && o.y > 0 && o.y < height;
  const hits: { t: number; point: CataloguePoint }[] = [];
  for (const q of [0, 1, 2, 3] as const) {
    const horizontal = q === 0 || q === 2,
      axis = horizontal ? 'z' : 'x',
      wall = q === 0 || q === 3 ? 0 : horizontal ? depth : width;
    const front =
      q === 0
        ? o.z < depth / 2
        : q === 2
          ? o.z > depth / 2
          : q === 3
            ? o.x < width / 2
            : o.x > width / 2;
    if ((!inside && front) || Math.abs(d[axis]) < 1e-8) continue;
    const t = (wall - o[axis]) / d[axis];
    if (t < 0) continue;
    const x = o.x + d.x * t,
      y = o.y + d.y * t,
      z = o.z + d.z * t;
    if (
      x < -0.0001 ||
      x > width + 0.0001 ||
      z < -0.0001 ||
      z > depth + 0.0001 ||
      y < 0 ||
      y > height
    )
      continue;
    const itemHeight =
      item.dimensions.height.value ?? entry.size.height.default;
    const maxBottom = Math.max(0, height * 1000 - itemHeight);
    const bottom = Math.max(0, Math.min(maxBottom, y * 1000 - itemHeight / 2));
    hits.push({
      t,
      point: {
        x: x * 1000,
        z: z * 1000,
        bottomY: Math.min(maxBottom, Math.round(bottom / 50) * 50),
        quarterTurns: q,
      },
    });
  }
  return hits.sort((a, b) => a.t - b.t)[0]?.point ?? null;
}
