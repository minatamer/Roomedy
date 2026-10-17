import type { RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';

type Finish = RoomDocument['room']['floorFinish'];
export const FINISH_PALETTE: Readonly<Record<Finish, string>> = Object.freeze({
  oak: '#bd9064',
  ivory: '#f3eee2',
  clay: '#c97f60',
  sage: '#8eaa96',
  walnut: '#735243',
  charcoal: '#344846',
});
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
      room: {
        ...room.room,
        floorFinish: preset.floor,
        wallFinish: preset.wall,
      },
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
