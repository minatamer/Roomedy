import { describe, expect, it } from 'vitest';
import {
  cameraViewPose,
  cameraPositionAllowed,
  cameraJourney,
} from '../apps/frontend/src/features/room-view/camera.js';
import {
  commandRoom,
  door,
  known,
  unknown,
  piece,
} from './fixtures/command-room.js';
const roomWithDoor = (
  wall: 'north' | 'south' | 'east' | 'west',
  offset: number,
) => {
  const entry = door();
  entry.wall = wall;
  entry.offset = known(offset);
  const room = commandRoom([], [entry]);
  room.room.width = known(4000);
  room.room.depth = known(6000);
  return room;
};
describe('Corner is diagonally opposite the nearest doorway corner', () => {
  const cases = [
    ['north', 100, 3.55, 5.55],
    ['north', 3000, 0.45, 5.55],
    ['south', 100, 3.55, 0.45],
    ['south', 3000, 0.45, 0.45],
    ['west', 100, 3.55, 5.55],
    ['west', 5000, 3.55, 0.45],
    ['east', 100, 0.45, 5.55],
    ['east', 5000, 0.45, 0.45],
  ] as const;
  it.each(cases)(
    '%s doorway at%s chooses the opposite corner',
    (wall, offset, x, z) => {
      const room = roomWithDoor(wall, offset),
        before = JSON.stringify(room),
        corner = cameraViewPose(room, 'corner');
      expect(corner).not.toBeNull();
      expect(corner!.position).toEqual([x, 1.6, z]);
      expect(corner!.target).toEqual([2, 1.35, 3]);
      expect(cameraPositionAllowed(room, corner!.position)).toBe(true);
      expect(JSON.stringify(room)).toBe(before);
    },
  );
  it.each([
    ['north', 3.55, 5.55],
    ['south', 3.55, 0.45],
    ['west', 3.55, 5.55],
    ['east', 0.45, 5.55],
  ] as const)(
    'breaks a centred %s doorway tie at its origin endpoint',
    (wall, x, z) => {
      const span = wall === 'north' || wall === 'south' ? 4000 : 6000;
      expect(
        cameraViewPose(roomWithDoor(wall, (span - 900) / 2), 'corner')!
          .position,
      ).toEqual([x, 1.6, z]);
    },
  );
  it('uses the same relevant doorway as Doorway, including multiple or overlapping records', () => {
    const room = roomWithDoor('north', 100),
      other = door('second');
    other.wall = 'south';
    other.offset = known(100);
    room.room.features.push(other);
    expect(cameraViewPose(room, 'doorway')!.position).toEqual([0.55, 1.6, 0.4]);
    expect(cameraViewPose(room, 'corner')!.position).toEqual([3.55, 1.6, 5.55]);
    room.room.features.reverse();
    expect(cameraViewPose(room, 'doorway')!.position).toEqual([0.55, 1.6, 5.6]);
    expect(cameraViewPose(room, 'corner')!.position).toEqual([3.55, 1.6, 0.45]);
    room.room.features[1] = { ...other, id: 'overlapping' };
    expect(cameraViewPose(room, 'corner')!.position).toEqual([3.55, 1.6, 0.45]);
  });
  it('does not invent a doorway pose or silently pick a different positioned doorway', () => {
    const room = roomWithDoor('north', 100),
      entry = room.room.features[0]!;
    entry.offset = unknown();
    room.room.features.push(door('positioned_second'));
    expect(cameraViewPose(room, 'doorway')).toBeNull();
    expect(cameraViewPose(room, 'corner')).toBeNull();
    entry.offset = known(100);
    entry.width = unknown();
    expect(cameraViewPose(room, 'corner')).toBeNull();
    entry.width = known(900);
    entry.offset = known(3900);
    expect(cameraViewPose(room, 'corner')).toBeNull();
    room.room.features = [];
    expect(cameraViewPose(room, 'corner')).toBeNull();
  });
  it('skips unknown-wall doors consistently, requires the opposite floor spans, and retains unknown height', () => {
    const room = roomWithDoor('north', 100),
      first = door('unlocated');
    first.wall = 'unknown';
    first.wallProvenance = { status: 'unknown', sourceId: null };
    room.room.features.unshift(first);
    expect(cameraViewPose(room, 'corner')!.position).toEqual([3.55, 1.6, 5.55]);
    room.room.height = unknown();
    const before = JSON.stringify(room);
    expect(cameraViewPose(room, 'corner')).not.toBeNull();
    expect(JSON.stringify(room)).toBe(before);
    room.room.depth = unknown();
    expect(cameraViewPose(room, 'corner')).toBeNull();
    expect(cameraViewPose(room, 'doorway')).not.toBeNull();
    room.room.width = unknown();
    expect(cameraViewPose(room, 'doorway')).toBeNull();
  });
  it('recomputes the opposite target for current dimensions and aspect without altering room facts', () => {
    const room = roomWithDoor('north', 100);
    room.room.width = known(8000);
    room.room.depth = known(4000);
    const before = JSON.stringify(room);
    expect(cameraViewPose(room, 'corner')!.position).toEqual([7.55, 1.6, 3.55]);
    expect(JSON.stringify(room)).toBe(before);
  });
  it('keeps a blocked-corner fallback in the intended quadrant and becomes unavailable when it is fully occupied', () => {
    const room = commandRoom([], [door()]);
    room.room.features[0]!.offset = known(100);
    room.furniture = [
      piece('corner_block', 9250, 9250, { width: 1500, depth: 1500 }),
    ];
    const pose = cameraViewPose(room, 'corner')!;
    expect(pose).not.toBeNull();
    expect(pose.position[0]).toBeGreaterThanOrEqual(5);
    expect(pose.position[2]).toBeGreaterThanOrEqual(5);
    expect(cameraPositionAllowed(room, pose.position)).toBe(true);
    room.furniture = [
      piece('quadrant_block', 7500, 7500, { width: 5000, depth: 5000 }),
    ];
    expect(cameraViewPose(room, 'doorway')).not.toBeNull();
    expect(cameraViewPose(room, 'corner')).toBeNull();
  });
  it('retains finite forward, reverse and interrupted camera journeys to the selected targets', () => {
    const room = roomWithDoor('south', 100),
      a = cameraViewPose(room, 'doorway')!,
      b = cameraViewPose(room, 'corner')!;
    for (const [from, to] of [
      [a.position, b.position],
      [b.position, a.position],
      [[2, 1.6, 3] as [number, number, number], b.position],
    ] as const) {
      const path = cameraJourney(room, from, to);
      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThanOrEqual(626);
      expect(path.at(-1)).toEqual(to);
      expect(path.every((p) => p.every(Number.isFinite))).toBe(true);
    }
  });
});
