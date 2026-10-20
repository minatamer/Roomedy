import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beginWindowEdit,
  clampWindowOffset,
  pointOnWindowWall,
  windowPlacement,
  nudgeWindowOffset,
  roomWithWindowPreview,
  advanceWindowOffset,
  windowDragTarget,
} from '../apps/frontend/src/features/room-view/window-manipulation.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  commandRoom,
  windowFeature,
  known,
  unknown,
  door,
  piece,
} from './fixtures/command-room.js';
import type { FloorRay } from '../apps/frontend/src/features/room-view/manipulation.js';
const sessions: SessionController[] = [];
const session = (room = commandRoom([], [windowFeature()]), now = () => 0) => {
  const s = new SessionController(room, { now });
  sessions.push(s);
  s.setRoomView('plan');
  s.select('window_1');
  return s;
};
afterEach(() => sessions.splice(0).forEach((s) => s.dispose()));
describe('known window moves on its recorded wall', () => {
  for (const wall of ['north', 'south', 'east', 'west'] as const) {
    it(`clamps the whole odd-width opening and maps an actual ${wall} wall ray`, () => {
      const feature = windowFeature();
      feature.wall = wall;
      feature.width = known(1001);
      const room = commandRoom([], [feature]),
        before = JSON.stringify(room);
      const alongX = wall === 'north' || wall === 'south';
      const ray: FloorRay = {
        origin: { x: alongX ? 3 : 5, y: 1, z: alongX ? 5 : 3 },
        direction: {
          x: wall === 'west' ? -1 : wall === 'east' ? 1 : 0,
          y: 0,
          z: wall === 'north' ? -1 : wall === 'south' ? 1 : 0,
        },
      };
      expect(pointOnWindowWall(room, feature, ray)).toBe(3000);
      for (const snap of [false, true]) {
        expect(windowPlacement(room, feature, ray, 250, snap)).toBe(2750);
        expect(clampWindowOffset(room, feature, -20000, snap)).toBe(0);
        expect(clampWindowOffset(room, feature, 20000, snap)).toBe(8999);
      }
      expect(
        nudgeWindowOffset(
          room,
          feature,
          alongX ? 'ArrowRight' : 'ArrowDown',
          true,
        ),
      ).toBe(1100);
      expect(
        nudgeWindowOffset(
          room,
          feature,
          alongX ? 'ArrowLeft' : 'ArrowUp',
          false,
          true,
        ),
      ).toBe(999);
      expect(
        nudgeWindowOffset(room, feature, alongX ? 'ArrowUp' : 'ArrowLeft'),
      ).toBe(1000);
      expect(JSON.stringify(room)).toBe(before);
      const preview = roomWithWindowPreview(room, {
        id: feature.id,
        offset: 8999,
      });
      expect(preview.room.features[0]!.offset.value).toBe(8999);
      expect(room.room.features[0]!.offset.value).toBe(1000);
    });
  }
  it('does not invent unknown bounds, sizes or offsets, or accept impossible geometry/invalid rays', () => {
    const feature = windowFeature(),
      room = commandRoom([], [feature]);
    for (const value of [NaN, Infinity, -Infinity])
      expect(clampWindowOffset(room, feature, value, true)).toBeNull();
    expect(
      pointOnWindowWall(room, feature, {
        origin: { x: 1, y: 1, z: 1 },
        direction: { x: 1, y: 0, z: 0 },
      }),
    ).toBeNull();
    expect(
      pointOnWindowWall(room, feature, {
        origin: { x: 1, y: 1, z: 1 },
        direction: { x: 0, y: 0, z: 1 },
      }),
    ).toBeNull();
    feature.width = known(11000);
    expect(clampWindowOffset(room, feature, 100, false)).toBeNull();
    feature.width = known(1000);
    feature.offset = unknown();
    expect(clampWindowOffset(room, feature, 100, false)).toBeNull();
    feature.offset = known(1000);
    room.room.width = unknown();
    expect(clampWindowOffset(room, feature, 100, false)).toBeNull();
    room.room.width = known(10000);
    feature.wall = 'unknown';
    feature.wallProvenance = { status: 'unknown', sourceId: null };
    expect(clampWindowOffset(room, feature, 100, false)).toBeNull();
  });
  it.each(['plan', 'cutaway'] as const)(
    'commits only planned offset with one Undo in %s; click preserves confirmation',
    (view) => {
      const s = session();
      s.setRoomView(view);
      const before = structuredClone(s.getSnapshot().workspace!.current);
      const noOp = beginWindowEdit(s, 'window_1')!;
      expect(noOp.commit(1000)).toEqual({ ok: true, changed: false });
      expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
      expect(s.getSnapshot().workspace!.current.room.features).toEqual(
        before.room.features,
      );
      const retired = vi.fn(),
        edit = beginWindowEdit(s, 'window_1', retired)!;
      expect(edit.commit(3000)).toMatchObject({ ok: true, changed: true });
      expect(retired).toHaveBeenCalledTimes(1);
      const feature = s.getSnapshot().workspace!.current.room.features[0]!;
      expect(feature).toEqual({
        ...before.room.features[0],
        offset: {
          value: 3000,
          status: 'estimated',
          sourceId: 'visitor-planned',
        },
      });
      expect(s.getSnapshot().workspace!.history.entries).toHaveLength(1);
      expect(s.undo()).toEqual({ ok: true });
      expect(s.getSnapshot().workspace!.current.room.features).toEqual(
        before.room.features,
      );
      expect(edit.commit(4000)).toMatchObject({ ok: false, code: 'stale' });
    },
  );
  it.each([
    'selection',
    'view',
    'before',
    'preview',
    'reset',
    'expiry',
    'revision',
  ] as const)('fences a window release after %s', (change) => {
    let now = 0;
    const s = session(undefined, () => now),
      retired = vi.fn(),
      edit = beginWindowEdit(s, 'window_1', retired)!;
    if (change === 'selection') s.select(null);
    if (change === 'view') s.setRoomView('cutaway');
    if (change === 'before') s.setComparison('before');
    if (change === 'preview')
      s.prepareVisitorPreview(
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        'Preview',
      );
    if (change === 'reset') s.reset();
    if (change === 'expiry') {
      now = 7200000;
      s.checkExpiry();
    }
    if (change === 'revision')
      s.dispatch(
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        'Finish',
      );
    expect(edit.current()).toBe(false);
    expect(edit.commit(4000)).toMatchObject({ ok: false, code: 'stale' });
    expect(retired).toHaveBeenCalledTimes(1);
  });
  it('rechecks a cleanup-triggered reset before the final command', () => {
    const s = session(),
      edit = beginWindowEdit(s, 'window_1', () => s.reset())!;
    expect(edit.commit(2000)).toMatchObject({ ok: false, code: 'stale' });
    expect(s.getSnapshot().workspace).toBeNull();
  });
  it('rejects invalid window release offsets before dispatch', () => {
    const s = session(),
      before = s.getSnapshot().workspace!.current;
    expect(beginWindowEdit(s, 'window_1')!.commit(10001).ok).toBe(false);
    expect(s.getSnapshot().workspace!.current).toBe(before);
    for (const offset of [-1, 0.5, NaN, Infinity])
      expect(beginWindowEdit(s, 'window_1')!.commit(offset)).toMatchObject({
        ok: false,
        code: 'invalid-input',
      });
    expect(s.getSnapshot().workspace!.current).toBe(before);
  });
  it('moves and reverses continuously, settles exactly and never writes the room', () => {
    let offset = 1000;
    offset = advanceWindowOffset(offset, 5000, 1 / 60);
    expect(offset).toBeGreaterThan(1000);
    expect(offset).toBeLessThan(5000);
    const intermediate = offset;
    offset = advanceWindowOffset(offset, 0, 1 / 60);
    expect(offset).toBeLessThan(intermediate);
    expect(offset).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++)
      offset = advanceWindowOffset(offset, 0, 1 / 60);
    expect(offset).toBe(0);
  });
});

it('grabs the displayed animated window while retaining canonical identity and command data', () => {
  const feature = windowFeature(),
    room = commandRoom([], [feature]);
  const displayed = { ...feature, offset: known(1750) };
  const target = windowDragTarget(room, displayed)!;
  expect(target.feature).toBe(feature);
  expect(target.offset).toBe(1750);
  const ray = {
    origin: { x: 2, y: 1, z: 1 },
    direction: { x: 0, y: 0, z: -1 },
  };
  const grab = 2000 - target.offset;
  expect(windowPlacement(room, target.feature, ray, grab, false)).toBe(1750);
  expect(
    windowPlacement(
      room,
      target.feature,
      { ...ray, origin: { ...ray.origin, x: 2.1 } },
      grab,
      false,
    ),
  ).toBe(1850);
  expect(feature.offset).toEqual(known(1000));
  expect(windowDragTarget(commandRoom(), displayed)).toBeNull();
});

it('chooses the nearest exact end in a nearly full-width window and reads only ray coordinates', () => {
  const feature = windowFeature(),
    room = commandRoom([], [feature]);
  feature.width = known(9940);
  expect(clampWindowOffset(room, feature, 40, true)).toBe(60);
  expect(clampWindowOffset(room, feature, 20, true)).toBe(0);
  const origin = { x: 2, y: 1, z: 1, isVector3: true },
    direction = { x: 0, y: 0, z: -1, isVector3: true };
  expect(pointOnWindowWall(room, feature, { origin, direction })).toBe(2000);
});

describe('doors reuse wall gestures without weakening protected deletion', () => {
  it.each(['view', 'preview', 'reset', 'revision', 'expiry'] as const)(
    'retires a door gesture after %s',
    (change) => {
      let now = 0;
      const d = door(),
        s = session(commandRoom([], [d]), () => now);
      s.select(d.id);
      const retired = vi.fn(),
        edit = beginWindowEdit(s, d.id, retired)!;
      if (change === 'view') s.setRoomView('cutaway');
      if (change === 'preview')
        s.prepareVisitorPreview(
          [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
          'Preview',
        );
      if (change === 'reset') s.reset();
      if (change === 'revision')
        s.dispatch(
          [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
          'Finish',
        );
      if (change === 'expiry') {
        now = 7200000;
        s.checkExpiry();
      }
      expect(edit.current()).toBe(false);
      expect(edit.commit(2000)).toMatchObject({ ok: false, code: 'stale' });
      expect(retired).toHaveBeenCalledTimes(1);
    },
  );
  for (const wall of ['north', 'south', 'east', 'west'] as const)
    it(`moves a selected ${wall} door through the same preview/command/Undo owner`, () => {
      const d = { ...door(), wall },
        room = commandRoom([], [d]),
        s = session(room);
      s.select(d.id);
      expect(windowDragTarget(room, d)?.feature).toBe(d);
      expect(clampWindowOffset(room, d, -200, true)).toBe(0);
      expect(
        nudgeWindowOffset(
          room,
          d,
          wall === 'north' || wall === 'south' ? 'ArrowRight' : 'ArrowDown',
        ),
      ).toBe(1010);
      expect(
        roomWithWindowPreview(room, { id: d.id, offset: 2000 }).room
          .features[0]!.offset.value,
      ).toBe(2000);
      expect(beginWindowEdit(s, d.id)!.commit(2000).ok).toBe(true);
      expect(
        s.getSnapshot().workspace!.current.room.features[0]!.offset,
      ).toMatchObject({ value: 2000, status: 'estimated' });
      expect(s.undo().ok).toBe(true);
      expect(s.getSnapshot().workspace!.current.room.features).toEqual([d]);
      const edit = beginWindowEdit(s, d.id)!;
      s.select(null);
      expect(edit.commit(3000)).toMatchObject({ ok: false, code: 'stale' });
    });
  it('clamps a door preview outside blockers and rechecks a forged final offset', () => {
    const d = door(),
      room = commandRoom([piece('blocker', 3000, 300)], [d]),
      s = session(room);
    s.select(d.id);
    expect(clampWindowOffset(room, d, 2800, false)).toBe(3600);
    expect(beginWindowEdit(s, d.id)!.commit(2800)).toMatchObject({
      ok: false,
      code: 'blocked-door',
    });
    expect(s.getSnapshot().workspace!.current).toEqual(room);
    const edit = beginWindowEdit(s, d.id)!;
    expect(edit.commit(1000)).toEqual({ ok: true, changed: false });
  });
});
