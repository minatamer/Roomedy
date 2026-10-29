import { furnitureMaterialRoles } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry } from '@roomedy/spatial';
import { createRoomFixture } from '../fixtures/rooms';
import type { RoomCondition } from './entry-state';

/** Fresh manual starts only; recovered/imported/photo rooms retain their recorded choices. */
export function createManualRoom(condition: RoomCondition) {
  const room = createRoomFixture(
    condition === 'furnished' ? 'sample' : condition,
  );
  const planned = <T extends string>(value: T) => ({
    value,
    status: 'planned' as const,
    sourceId: 'manual-start',
  });
  room.room.floorFinish = room.room.wallFinish = 'ivory';
  room.room.surfaces = {
    floor: {
      color: planned('#b0b0ab'),
      texture: planned('smooth'),
    },
    walls: { color: planned('#f5f3ec'), texture: planned('smooth') },
  };
  for (const piece of room.furniture) {
    const entry = findCatalogueEntry(
      piece.catalogueId,
      piece.catalogueVersion,
    )!;
    const roles = furnitureMaterialRoles(entry);
    piece.finish = ['wardrobe', 'storage'].includes(entry.category)
      ? 'walnut'
      : 'oak';
    piece.materials = {
      ...(roles.body ? { body: 'plain' as const } : {}),
      ...(roles.soft
        ? {
            upholstery: 'plain' as const,
            softColor:
              entry.category === 'lighting'
                ? '#d9c8af'
                : entry.category === 'bed'
                  ? '#e8ddca'
                  : '#9ba99c',
            ...(entry.category === 'bed'
              ? {
                  pillowColor: '#f4f0e8',
                  sheetColor: '#e8ddca',
                  coverColor: '#c4ac92',
                }
              : {}),
          }
        : {}),
    };
  }
  for (const feature of room.room.features)
    if (feature.kind !== 'obstacle')
      feature.materials = {
        ...feature.materials,
        ...(feature.kind === 'door' ? { texture: 'smooth' as const } : {}),
        frameTexture: 'smooth',
      };
  return room;
}
