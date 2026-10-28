import { furnitureMaterialRoles } from '@roomedy/contracts/furniture-materials';
import { FINISH_COLORS } from '@roomedy/contracts/surfaces';
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
      color: planned(FINISH_COLORS.ivory),
      texture: planned('concrete'),
    },
    walls: { color: planned(FINISH_COLORS.ivory), texture: planned('smooth') },
  };
  for (const piece of room.furniture) {
    const entry = findCatalogueEntry(
      piece.catalogueId,
      piece.catalogueVersion,
    )!;
    const roles = furnitureMaterialRoles(entry);
    piece.finish = 'ivory';
    piece.materials = {
      ...(roles.body ? { body: 'plain' as const } : {}),
      ...(roles.soft
        ? { upholstery: 'plain' as const, softColor: FINISH_COLORS.ivory }
        : {}),
    };
  }
  return room;
}
