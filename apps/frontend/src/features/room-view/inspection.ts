import type { RoomDocument } from '@roomedy/contracts/room';
import { displayRoom, piecePose } from './adapter';
import type { CameraPose } from './adapter';
import { displayFurnitureSize } from '../catalogue/display-size';
export interface Inspection {
  target: string | null;
  isolated: boolean;
}
export function inspectionVisible(
  inspection: Inspection | undefined,
  key: string,
) {
  return (
    !inspection?.isolated || !inspection.target || inspection.target === key
  );
}
/** Display framing only; fallback sizes never become measurement or estimate evidence. */
export function inspectionPose(
  room: RoomDocument,
  inspection: Inspection | undefined,
): CameraPose | null {
  if (!inspection?.target) return null;
  const bounds = displayRoom(room);
  const piece = room.furniture.find((p) => p.id === inspection.target);
  if (piece) {
    const pose = piecePose(piece),
      size = displayFurnitureSize(piece);
    if (!size) return null;
    const span = Math.max(size.width, size.depth, size.height) / 1000;
    const target: [number, number, number] = [
      pose.position[0],
      pose.position[1] + size.height / 2000,
      pose.position[2],
    ];
    return {
      position: [
        target[0] + span * 1.4,
        target[1] + span * 1.2,
        target[2] + span * 1.6,
      ],
      target,
      zoom: 1,
      view: 'overview',
    };
  }
  if (inspection.target.startsWith('surface:')) {
    const wall = inspection.target.slice(8),
      w = bounds.width,
      d = bounds.depth,
      h = bounds.height;
    const target: [number, number, number] =
      wall === 'north'
        ? [w / 2, h / 2, 0]
        : wall === 'south'
          ? [w / 2, h / 2, d]
          : wall === 'west'
            ? [0, h / 2, d / 2]
            : wall === 'east'
              ? [w, h / 2, d / 2]
              : [w / 2, 0, d / 2];
    const span = Math.max(w, d);
    return {
      position: [
        w / 2 +
          (wall === 'east'
            ? -span * 0.7
            : wall === 'west'
              ? span * 0.7
              : span * 0.15),
        h + span * 0.45,
        d / 2 + (wall === 'south' ? -span : span),
      ],
      target,
      zoom: 1,
      view: 'overview',
    };
  }
  return null;
}
