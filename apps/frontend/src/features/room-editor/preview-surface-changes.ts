import type { RoomDocument } from '@roomedy/contracts/room';
import {
  roomSurface,
  roomSurfaceDetail,
  WALLS,
} from '@roomedy/contracts/surfaces';

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function surfacePreviewChanges(
  current: RoomDocument,
  proposed: RoomDocument,
) {
  const changes: string[] = [];
  for (const surface of ['floor', 'walls', ...WALLS] as const) {
    if (
      WALLS.some((wall) => wall === surface) &&
      !current.room.surfaces?.[surface] &&
      !proposed.room.surfaces?.[surface]
    )
      continue;
    const before = roomSurface(current.room, surface),
      after = roomSurface(proposed.room, surface);
    const beforeDetail = roomSurfaceDetail(current.room, surface),
      detail = roomSurfaceDetail(proposed.room, surface);
    if (same(before, after) && same(beforeDetail, detail)) continue;
    const name =
      surface === 'floor' || surface === 'walls' ? surface : `${surface} wall`;
    changes.push(
      `${name}: ${after.color}, ${after.texture}${same(beforeDetail, detail) ? '' : `; pattern ${detail.repeatWidthMm / 10} × ${detail.repeatHeightMm / 10} cm, ${detail.direction * 90}°, ${detail.sheen}`}`,
    );
  }
  return changes;
}
