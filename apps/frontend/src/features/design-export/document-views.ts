import type { RoomDocument } from '@roomedy/contracts/room';
import { displayFurnitureSize } from '../catalogue/display-size';
import { displayRoom, presentationRoom } from '../room-view/adapter';

type Measurement = RoomDocument['room']['width'];

/** Disposable camera collision geometry, matching the editor's visual sizes only. */
export function documentNavigationRoom(input: RoomDocument): RoomDocument {
  const room = presentationRoom(input),
    bounds = displayRoom(room);
  const shown = (value: Measurement, fallback: number): Measurement =>
    value.value === null
      ? { value: fallback, status: 'estimated', sourceId: 'display-estimate' }
      : value;
  return {
    ...room,
    room: {
      ...room.room,
      width: shown(room.room.width, bounds.width * 1000),
      depth: shown(room.room.depth, bounds.depth * 1000),
      height: shown(room.room.height, bounds.height * 1000),
    },
    furniture: room.furniture.map((piece) => {
      const size = displayFurnitureSize(piece);
      return !size
        ? piece
        : {
            ...piece,
            dimensions: {
              width: shown(piece.dimensions.width, size.width),
              depth: shown(piece.dimensions.depth, size.depth),
              height: shown(piece.dimensions.height, size.height),
            },
          };
    }),
  };
}
