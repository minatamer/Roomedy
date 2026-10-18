import type { ActionScope } from '@roomedy/contracts/commands';
import type { SearchGoal, SearchRequest } from '@roomedy/contracts/search';
import type { RoomDocument } from '@roomedy/contracts/room';
import {
  commandRoom,
  piece,
  known,
  windowFeature,
  door,
} from './command-room.js';

export function goal(patch: Partial<SearchGoal> = {}): SearchGoal {
  return {
    kind: 'window',
    targetIds: [],
    retainedIds: [],
    fixedIds: [],
    windowId: null,
    additions: [],
    replacements: [],
    removals: [],
    roomFinish: null,
    pieceFinishes: [],
    ...patch,
  };
}
export function scopeFor(
  room: RoomDocument,
  selected: SearchGoal,
): ActionScope {
  return {
    roomId: room.roomId,
    roomRevision: room.roomRevision,
    actionKinds: [
      'move',
      'rotate',
      'add',
      'replace',
      'remove',
      'finish',
      'room-finish',
    ],
    targetIds: [
      ...new Set([
        ...selected.targetIds,
        ...selected.replacements.map((p) => p.id),
        ...selected.removals,
        ...selected.pieceFinishes.map((p) => p.id),
      ]),
    ],
    additions: selected.additions.map(({ id, catalogueId }) => ({
      id,
      catalogueId,
    })),
    replacements: selected.replacements.map(({ id, catalogueId }) => ({
      id,
      catalogueId,
    })),
    removals: selected.removals,
    roomFinishes: selected.roomFinish !== null,
  };
}
export function request(
  room: RoomDocument,
  selected: SearchGoal,
  maxNodes = 2000,
): SearchRequest {
  return {
    identity: {
      workspaceId: 'search_workspace',
      generation: 0,
      operationId: 'search_operation',
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
    room,
    goal: selected,
    seed: 42,
    maxNodes,
  };
}
export function windowCase() {
  const desk = piece('desk', 3000, 3000),
    chair = piece('chair', 3000, 3595, {
      catalogueId: 'procedural-chair',
      width: 550,
      depth: 550,
      height: 900,
      quarterTurns: 2,
    }),
    bed = piece('bed', 800, 1050, {
      catalogueId: 'procedural-bed',
      width: 1600,
      depth: 2100,
      height: 850,
    }),
    shelf = piece('unrelated_shelf', 3800, 4500, {
      catalogueId: 'procedural-storage',
      width: 600,
      depth: 350,
      height: 1200,
    });
  bed.locks = { position: true, rotation: true, dimensions: true };
  bed.preference = 'keep';
  const opening = windowFeature();
  opening.offset = known(2200);
  const entrance = door();
  entrance.offset = known(3300);
  entrance.width = known(800);
  const room = commandRoom([desk, chair, bed, shelf], [opening, entrance]);
  room.room.width = known(4200);
  room.room.depth = known(4800);
  const selected = goal({
    targetIds: ['desk', 'chair'],
    retainedIds: ['bed', 'unrelated_shelf'],
    fixedIds: ['bed'],
    windowId: opening.id,
  });
  // Independent feasible control: desk(2700,300,q0), chair(2700,895,q2).
  // Their east edges stop at3300, exactly before the doorway's reserved x[3300,4100].
  return { room, selected, knownWindowDeskDistance: 300 };
}
export function emptyCase() {
  const room = commandRoom();
  room.room.width = known(6000);
  room.room.depth = known(5000);
  room.intent.condition = 'empty';
  const selected = goal({
    kind: 'furnish',
    additions: [
      {
        id: 'new_bed',
        catalogueId: 'procedural-bed',
        size: null,
        finish: 'oak',
      },
      {
        id: 'new_wardrobe',
        catalogueId: 'wardrobe-hinged',
        size: null,
        finish: 'oak',
      },
      {
        id: 'new_desk',
        catalogueId: 'procedural-desk',
        size: null,
        finish: 'oak',
      },
      {
        id: 'new_chair',
        catalogueId: 'procedural-chair',
        size: null,
        finish: 'oak',
      },
    ],
  });
  // Independent feasible control: bed(800,1050,q0), wardrobe(5000,300,q0),
  // desk(5700,2500,q1), chair(5105,2500,q3); all solids/access remain inside6000x5000.
  return { room, selected };
}
export function partialCase() {
  const bed = piece('kept_bed', 800, 1050, {
      catalogueId: 'procedural-bed',
      width: 1600,
      depth: 2100,
      height: 850,
    }),
    wardrobe = piece('fixed_wardrobe', 3900, 300, {
      catalogueId: 'wardrobe-hinged',
      width: 1200,
      depth: 600,
      height: 2100,
    });
  for (const item of [bed, wardrobe]) {
    item.preference = 'keep';
    item.locks = { position: true, rotation: true, dimensions: true };
  }
  const opening = windowFeature();
  opening.offset = known(2000);
  const room = commandRoom([bed, wardrobe], [opening]);
  room.room.width = known(4500);
  room.room.depth = known(4500);
  room.intent.condition = 'partial';
  const selected = goal({
    kind: 'add',
    retainedIds: ['kept_bed', 'fixed_wardrobe'],
    fixedIds: ['kept_bed', 'fixed_wardrobe'],
    windowId: opening.id,
    additions: [
      {
        id: 'new_desk',
        catalogueId: 'procedural-desk',
        size: null,
        finish: 'oak',
      },
      {
        id: 'new_chair',
        catalogueId: 'procedural-chair',
        size: null,
        finish: 'oak',
      },
    ],
  });
  // Independent feasible additions: desk(2500,300,q0), chair(2500,895,q2).
  return { room, selected };
}
export function rearrangeCase() {
  const desk = piece('owned_desk', 2500, 2500),
    chair = piece('owned_chair', 2500, 3095, {
      catalogueId: 'procedural-chair',
      width: 550,
      depth: 550,
      height: 900,
      quarterTurns: 2,
    });
  const room = commandRoom([desk, chair]);
  room.room.width = known(5000);
  room.room.depth = known(5000);
  const selected = goal({
    kind: 'rearrange-owned',
    targetIds: ['owned_desk', 'owned_chair'],
    retainedIds: ['owned_desk', 'owned_chair'],
  });
  // Moving both to the north pair(2500,300)/(2500,895) clears the whole central1250..3750 square.
  return { room, selected };
}

export function maximumCase() {
  const pieces = Array.from({ length: 40 }, (_, i) =>
    piece(
      `item_${i}`,
      1000 + (i % 10) * 1900,
      1000 + Math.floor(i / 10) * 4000,
      { width: 500, depth: 300 },
    ),
  );
  const features = Array.from({ length: 24 }, (_, i) => {
    const f = windowFeature();
    f.id = `window_${i}`;
    f.wall = (['north', 'east', 'south', 'west'] as const)[Math.floor(i / 6)]!;
    f.offset = known(1000 + (i % 6) * 2500);
    f.width = known(500);
    return f;
  });
  const room = commandRoom(pieces, features);
  room.room.width = known(20000);
  room.room.depth = known(20000);
  const selected = goal({
    kind: 'rearrange-owned',
    targetIds: pieces.map((p) => p.id),
    retainedIds: pieces.map((p) => p.id),
  });
  return { room, selected };
}
