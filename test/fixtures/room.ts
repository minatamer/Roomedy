import type { RoomDocument } from '@roomedy/contracts/room';
import { VERSIONS } from '@roomedy/contracts/policy';

// Controlled schema fixture, not a photographed room or a spatial/recognition pass.
export function roomFixture(): RoomDocument {
  const m = (value: number) => ({
    value,
    status: 'confirmed' as const,
    sourceId: 'authored-sample',
  });
  return {
    schemaVersion: 1,
    roomId: 'room_sample',
    roomRevision: 0,
    unit: 'mm',
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    room: {
      shape: 'rectangle',
      width: m(3600),
      depth: m(4200),
      height: m(2600),
      floorFinish: 'oak',
      wallFinish: 'ivory',
      features: [],
    },
    furniture: [
      {
        id: 'desk_1',
        label: 'Desk',
        catalogueId: 'procedural-desk',
        catalogueVersion: VERSIONS.catalogue,
        dimensions: { width: m(1200), depth: m(600), height: m(740) },
        pose: { centerX: 2900, centerZ: 2200, quarterTurns: 0 },
        ownership: 'owned',
        preference: 'keep',
        locks: { dimensions: true, position: false, rotation: false },
        finish: 'oak',
      },
    ],
    intent: {
      condition: 'partial',
      goals: ['sleep', 'work'],
      style: 'warm-simple',
    },
  };
}
