import { describe, expect, it } from 'vitest';
import {
  clearDoorIntervals,
  nearestClearDoorOffset,
  placeDoor,
  evaluateBatch,
  resolveMedyRequest,
} from '@roomedy/spatial';
import {
  commandRoom,
  door,
  known,
  piece,
  unknown,
  windowFeature,
} from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';

const bathroom = () => ({
  ...door('bathroom'),
  purpose: 'bathroom' as const,
  wall: 'unknown' as const,
  wallProvenance: { status: 'unknown' as const, sourceId: null },
  mechanism: 'unknown' as const,
  mechanismProvenance: { status: 'unknown' as const, sourceId: null },
  hinge: 'unknown' as const,
  hingeProvenance: { status: 'unknown' as const, sourceId: null },
});

describe('clear doorway planning', () => {
  for (const wall of ['north', 'east', 'south', 'west'] as const)
    it(`finds exact clear intervals on ${wall}, including odd-size footprints`, () => {
      const d = { ...door(), wall },
        horizontal = wall === 'north' || wall === 'south';
      const f = piece(
        'blocker',
        horizontal ? 1500 : wall === 'east' ? 9700 : 300,
        horizontal ? (wall === 'south' ? 9700 : 300) : 1500,
        { width: horizontal ? 1001 : 600, depth: horizontal ? 600 : 1001 },
      );
      const r = commandRoom([f], [d]);
      expect(clearDoorIntervals(r, d)).toEqual([
        [0, 99],
        [2001, 9100],
      ]);
      expect(nearestClearDoorOffset(r, d, -100)).toBe(0);
      expect(nearestClearDoorOffset(r, d, 20000)).toBe(9100);
      expect(nearestClearDoorOffset(r, d, NaN)).toBeNull();
    });
  it('allows exact contact and removes every same-wall window/door interval', () => {
    const d = door('new'),
      w = windowFeature(),
      other = door('old');
    w.offset = known(900);
    other.offset = known(3000);
    const r = commandRoom([], [w, other]);
    expect(clearDoorIntervals(r, d)).toEqual([
      [0, 0],
      [1900, 2100],
      [3900, 9100],
    ]);
    expect(nearestClearDoorOffset(r, d, 1800)).toBe(1900);
    expect(nearestClearDoorOffset(r, d, 1000)).toBe(1900);
  });
  it('first fits in fixed wall/offset order without mutating or confirming facts', () => {
    const d = bathroom(),
      r = commandRoom(
        [piece('blocker', 700, 450, { width: 1400, depth: 900 })],
        [windowFeature()],
      );
    const before = structuredClone(r),
      placed = placeDoor(r, d)!;
    expect(placed.wall).toBe('north');
    expect(placed.offset.value).toBe(2000);
    expect(placed.wallProvenance.status).toBe('estimated');
    expect(placed.offset).toMatchObject({
      status: 'estimated',
      sourceId: 'visitor-planned',
    });
    expect(placed.mechanism).toBe('unknown');
    expect(placed.hinge).toBe('unknown');
    expect(placed.width).toEqual(d.width);
    expect(placeDoor(r, d)).toEqual(placed);
    expect(r).toEqual(before);
  });
  it('tries the next wall and refuses fully occupied or unassessable rooms', () => {
    const r = commandRoom([
      piece('north-wall', 5000, 450, { width: 10000, depth: 900 }),
    ]);
    expect(placeDoor(r, bathroom())).toMatchObject({
      wall: 'east',
      offset: { value: 900 },
    });
    r.furniture = [
      piece('whole-room', 5000, 5000, { width: 10000, depth: 10000 }),
    ];
    expect(placeDoor(r, bathroom())).toBeNull();
    r.furniture[0]!.dimensions.width = unknown();
    expect(placeDoor(r, bathroom())).toBeNull();
    r.furniture = [];
    r.room.width = unknown();
    expect(placeDoor(r, bathroom())).toBeNull();
    r.room.width = known(10000);
    const unplaced = windowFeature();
    unplaced.wall = 'unknown';
    unplaced.wallProvenance = { status: 'unknown', sourceId: null };
    r.room.features = [unplaced];
    expect(placeDoor(r, bathroom())).toBeNull();
  });
  it('accounts for vertical separation, obstacles and another wall’s door approach', () => {
    const f = piece('high', 450, 300, { width: 900, depth: 600, height: 200 });
    f.pose.bottomY = 2300;
    const d = door(),
      r = commandRoom([f]);
    expect(clearDoorIntervals(r, d)?.[0]?.[0]).toBe(0);
    f.pose.bottomY = 1900;
    expect(clearDoorIntervals(r, d)?.[0]?.[0]).toBe(900);
    const other = { ...door('west'), wall: 'west' as const, offset: known(0) };
    r.furniture = [];
    r.room.features = [other];
    expect(clearDoorIntervals(r, d)?.[0]?.[0]).toBe(900);
    r.room.features = [
      {
        ...windowFeature(),
        kind: 'obstacle',
        projection: known(300),
        offset: known(200),
        width: known(600),
      },
    ];
    expect(clearDoorIntervals(r, d)?.[0]?.[0]).toBe(800);
  });
  it('rechecks final pose at the shared command boundary, with atomic repair and Undo', () => {
    const d = door(),
      w = windowFeature();
    w.offset = known(4000);
    const r = commandRoom([piece('blocker', 3000, 300)], [d, w]);
    const s = new SessionController(r);
    try {
      const move = (offset: number) => ({
        type: 'update-feature' as const,
        id: d.id,
        feature: { ...d, offset: known(offset) },
      });
      expect(s.dispatch([move(2600)], 'Blocked')).toMatchObject({
        ok: false,
        code: 'blocked-door',
      });
      expect(s.dispatch([move(4200)], 'Overlap')).toMatchObject({
        ok: false,
        code: 'blocked-door',
      });
      expect(s.getSnapshot().workspace!.current).toEqual(r);
      expect(
        s.dispatch(
          [
            {
              type: 'move',
              id: 'blocker',
              pose: { centerX: 3000, centerZ: 5000, quarterTurns: 0 },
            },
            move(2600),
          ],
          'Move both',
        ).ok,
      ).toBe(true);
      expect(s.undo().ok).toBe(true);
      expect(s.getSnapshot().workspace!.current.room).toEqual(r.room);
      expect(s.getSnapshot().workspace!.current.furniture).toEqual(r.furniture);
      const added = placeDoor(r, bathroom())!;
      expect(
        s.dispatch(
          [{ type: 'add-feature', feature: added }],
          'Add bathroom door',
        ).ok,
      ).toBe(true);
      expect(s.undo().ok).toBe(true);
      expect(s.getSnapshot().workspace!.current.room).toEqual(r.room);
      expect(s.getSnapshot().workspace!.current.furniture).toEqual(r.furniture);
      expect(
        evaluateBatch(r, [{ type: 'remove-feature', id: d.id }], 'visitor'),
      ).toMatchObject({ ok: false, code: 'protected-door' });
    } finally {
      s.dispose();
    }
  });
  it('preserves unrelated review work and validates additions even with unknown mechanisms', () => {
    const r = commandRoom([piece('blocker', 450, 300)]),
      added = {
        ...bathroom(),
        wall: 'north' as const,
        wallProvenance: {
          status: 'estimated' as const,
          sourceId: 'visitor-plan',
        },
        offset: known(0),
      };
    expect(
      evaluateBatch(r, [{ type: 'add-feature', feature: added }], 'visitor'),
    ).toMatchObject({ ok: false, code: 'blocked-door' });
    r.room.features = [added];
    expect(
      evaluateBatch(
        r,
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        'visitor',
      ).ok,
    ).toBe(true);
  });
  it('can record a measured existing doorway with issues, while new planning estimates must be clear', () => {
    const r = commandRoom([piece('blocker', 1450, 450)]),
      d = door();
    const recorded = evaluateBatch(
      r,
      [{ type: 'add-feature', feature: d }],
      'visitor',
    );
    expect(recorded.ok).toBe(true);
    if (recorded.ok)
      expect(
        recorded.checks.issues.some(
          (issue) =>
            issue.rule === 'door-envelope' && issue.severity === 'hard',
        ),
      ).toBe(true);
    const planned = {
      ...d,
      offset: {
        value: d.offset.value!,
        status: 'estimated' as const,
        sourceId: 'visitor-planned',
      },
    };
    expect(
      evaluateBatch(r, [{ type: 'add-feature', feature: planned }], 'visitor'),
    ).toMatchObject({ ok: false, code: 'blocked-door' });
  });
  it('Medy uses identical placement, preserves an explicit wall/offset and handles no room', () => {
    const r = commandRoom(
      [piece('blocker', 700, 450, { width: 1400, depth: 900 })],
      [windowFeature()],
    );
    const result = resolveMedyRequest(r, 'add a bathroom door', null);
    expect(result?.kind).toBe('edits');
    if (result?.kind !== 'edits') throw new Error('expected-edits');
    const add = result.actions[0];
    expect(add?.type).toBe('add-feature');
    if (add?.type !== 'add-feature' || add.feature.kind !== 'door')
      throw new Error('expected-door');
    expect(add.feature.wall).toBe('north');
    expect(add.feature.offset.value).toBe(2000);
    expect(evaluateBatch(r, result.actions, 'visitor').ok).toBe(true);
    const explicit = resolveMedyRequest(
      r,
      'add bathroom door on east wall at offset 3000 mm',
      null,
    );
    expect(explicit?.kind).toBe('edits');
    if (explicit?.kind === 'edits')
      expect(explicit.actions[0]).toMatchObject({
        feature: { wall: 'east', offset: { value: 3000 } },
      });
    r.furniture = [piece('full', 5000, 5000, { width: 10000, depth: 10000 })];
    expect(resolveMedyRequest(r, 'add bathroom door', null)).toMatchObject({
      kind: 'reply',
      summary: expect.stringContaining('clear spot'),
    });
  });
});
