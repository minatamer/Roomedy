import type { RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';
import { FINISH_COLORS, withSurfacePalette } from '@roomedy/contracts/surfaces';

type Finish = RoomDocument['room']['floorFinish'];
export const FINISH_PALETTE: Readonly<Record<Finish, string>> =
  Object.freeze(FINISH_COLORS);
export const FINISH_PRESETS = Object.freeze([
  {
    id: 'warm-simple',
    label: 'Warm & simple',
    floor: 'oak',
    wall: 'ivory',
    furniture: 'oak',
  },
  {
    id: 'light-airy',
    label: 'Light & airy',
    floor: 'oak',
    wall: 'ivory',
    furniture: 'ivory',
  },
  {
    id: 'calm-focused',
    label: 'Calm & focused',
    floor: 'walnut',
    wall: 'sage',
    furniture: 'sage',
  },
] as const);

/** Appearance-only preview. This never commits a revision or bypasses the command controller. */
export function previewFinishPreset(
  room: RoomDocument,
  id: RoomDocument['intent']['style'],
): { room: RoomDocument; unavailableIds: string[] } {
  const preset = FINISH_PRESETS.find((item) => item.id === id)!;
  const unavailableIds: string[] = [];
  return {
    room: {
      ...room,
      room: withSurfacePalette(room.room, preset.floor, preset.wall),
      furniture: room.furniture.map((item) => {
        if (item.ownership === 'owned') return item;
        const entry = findCatalogueEntry(
          item.catalogueId,
          item.catalogueVersion,
        );
        if (!entry?.finishes.includes(preset.furniture)) {
          unavailableIds.push(item.id);
          return item;
        }
        return { ...item, finish: preset.furniture };
      }),
    },
    unavailableIds,
  };
}
