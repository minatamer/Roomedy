import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { VERSIONS } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';

const confirmed = (value: number) => ({
  value,
  status: 'confirmed' as const,
  sourceId: 'authored-sample',
});
function piece(
  id: string,
  catalogueId: string,
  x: number,
  z: number,
  turns: 0 | 1 | 2 | 3,
  owned: boolean,
  fixedPosition = false,
): Furniture {
  const entry = findCatalogueEntry(catalogueId, VERSIONS.catalogue)!;
  return {
    id,
    catalogueId,
    catalogueVersion: VERSIONS.catalogue,
    label: entry.label,
    dimensions: {
      width: confirmed(entry.size.width.default),
      depth: confirmed(entry.size.depth.default),
      height: confirmed(entry.size.height.default),
    },
    pose: { centerX: x, centerZ: z, quarterTurns: turns },
    ownership: owned ? 'owned' : 'proposed',
    preference: owned ? 'keep' : 'flexible',
    locks: { dimensions: owned, position: fixedPosition, rotation: false },
    finish: entry.finishes[0]!,
  };
}
const base: RoomDocument = {
  schemaVersion: 1,
  roomId: 'room_sample',
  roomRevision: 0,
  unit: 'mm',
  catalogueVersion: VERSIONS.catalogue,
  rulesVersion: VERSIONS.rules,
  room: {
    shape: 'rectangle',
    width: confirmed(4200),
    depth: confirmed(4800),
    height: confirmed(2600),
    floorFinish: 'oak',
    wallFinish: 'ivory',
    features: [
      {
        id: 'door_entrance',
        kind: 'door',
        wall: 'south',
        offset: confirmed(200),
        width: confirmed(900),
        height: confirmed(2100),
        sill: confirmed(0),
        mechanism: 'inward',
        hinge: 'left',
      },
      {
        id: 'window_work',
        kind: 'window',
        wall: 'north',
        offset: confirmed(2500),
        width: confirmed(1200),
        height: confirmed(1100),
        sill: confirmed(900),
        mechanism: 'fixed',
      },
    ],
  },
  furniture: [
    piece('bed_1', 'procedural-bed', 1000, 1600, 0, true),
    piece('desk_1', 'procedural-desk', 3200, 1000, 0, true),
    piece('chair_1', 'chair-desk-fixed', 3200, 1700, 2, false),
    piece('wardrobe_1', 'wardrobe-hinged', 3250, 3200, 0, true, true),
    piece('storage_1', 'procedural-storage', 2200, 3900, 1, false),
  ],
  intent: {
    condition: 'furnished',
    goals: ['sleep', 'work', 'storage'],
    style: 'warm-simple',
  },
};

export const ROOM_FIXTURE_DESCRIPTIONS = Object.freeze({
  sample:
    'Authored bedroom and work area. Supplied dimensions; similar furniture models.',
  empty:
    'Authored empty room with a door and window, ready for furniture choices.',
  partial:
    'Authored retained bed and fixed wardrobe. Room height is unknown; bed height is estimated.',
  conflict:
    'Test baseline: the desk overlaps the retained bed by 900 × 600 mm. This arrangement needs repair.',
});
export function createRoomFixture(
  kind: keyof typeof ROOM_FIXTURE_DESCRIPTIONS = 'sample',
): RoomDocument {
  const room = structuredClone(base);
  if (kind === 'empty') {
    room.furniture = [];
    room.intent.condition = 'empty';
  }
  if (kind === 'partial') {
    room.furniture = room.furniture.filter((f) =>
      ['bed_1', 'wardrobe_1'].includes(f.id),
    );
    room.intent.condition = 'partial';
    room.room.height = { value: null, status: 'unknown', sourceId: null };
    room.furniture[0]!.dimensions.height = {
      value: 850,
      status: 'estimated',
      sourceId: 'authored-estimate',
    };
  }
  if (kind === 'conflict')
    room.furniture.find((f) => f.id === 'desk_1')!.pose = {
      centerX: 1500,
      centerZ: 1600,
      quarterTurns: 0,
    };
  return roomDocumentSchema.parse(room);
}
