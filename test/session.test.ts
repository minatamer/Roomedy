import { afterEach, describe, expect, it, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ResourceRegistry } from '../apps/frontend/src/features/session/effects.js';
import { failureMessage } from '../apps/frontend/src/features/room-editor/messages.js';
import { hasBaselineChanges } from '../apps/frontend/src/features/session/state.js';
import { commandRoom, piece } from './fixtures/command-room.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import {
  beginFloorEdit,
  rotateFloorSelection,
} from '../apps/frontend/src/features/room-view/manipulation.js';

const controllers: SessionController[] = [];
let now = 0,
  nextId = 0;
function session(room = commandRoom([piece('a')])) {
  const controller = new SessionController(room, {
    now: () => now,
    id: () => `id_${++nextId}`,
  });
  controllers.push(controller);
  return controller;
}
afterEach(() => {
  controllers.forEach((c) => c.dispose());
  controllers.length = 0;
  now = 0;
  vi.useRealTimers();
});

describe('3D gestures use the canonical session command and lifecycle', () => {
  function floorSession(room = commandRoom([piece('a')])) {
    const s = session(room);
    s.setRoomView('cutaway');
    s.select('a');
    return s;
  }
  it('keeps a click uncommitted, records one accepted drop and makes the retired gesture unreplayable', () => {
    const s = floorSession(),
      original = s.getSnapshot().workspace!;
    const click = beginFloorEdit(s, 'a')!;
    expect(click.commit({ x: 2000, z: 2000 })).toEqual({
      ok: true,
      changed: false,
    });
    expect(s.getSnapshot().workspace).toBe(original);
    expect(original.current.furniture[0]!.pose.provenance.status).toBe(
      'confirmed',
    );
    const ended = vi.fn(),
      edit = beginFloorEdit(s, 'a', ended)!;
    expect(edit.room).toBe(original.current);
    expect(s.getSnapshot().pending).toBeNull();
    expect(original.history.entries).toHaveLength(0);
    expect(edit.commit({ x: 2500.5, z: 2600 })).toEqual({
      ok: true,
      changed: true,
    });
    expect(ended).toHaveBeenCalledOnce();
    expect(edit.commit({ x: 3000, z: 3000 })).toEqual({
      ok: false,
      code: 'stale',
    });
    const changed = s.getSnapshot().workspace!;
    expect(changed.history.entries).toHaveLength(1);
    expect(changed.current.furniture[0]!.pose).toMatchObject({
      centerX: 2500.5,
      centerZ: 2600,
      quarterTurns: 0,
      provenance: { status: 'planned' },
    });
    expect(changed.baseline).toBe(original.baseline);
    expect(s.undo()).toEqual({ ok: true });
    expect(s.getSnapshot().workspace!.current.furniture[0]!.pose).toEqual(
      original.current.furniture[0]!.pose,
    );
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
  });
  it('delegates position/rotation locks and space conflicts to the same spatial authority', () => {
    const room = commandRoom([piece('a')]);
    room.furniture[0]!.locks.position = true;
    const locked = floorSession(room),
      original = locked.getSnapshot().workspace;
    expect(
      beginFloorEdit(locked, 'a')!.commit({ x: 2500, z: 2000 }),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(locked.getSnapshot().workspace).toBe(original);
    const s = floorSession();
    expect(beginFloorEdit(s, 'a')!.commit({ x: -100, z: 2000 })).toMatchObject({
      ok: false,
      code: 'new-conflict',
      issue: { code: 'outside-room' },
    });
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
    expect(rotateFloorSelection(s)).toEqual({ ok: true, changed: true });
    expect(
      s.getSnapshot().workspace!.current.furniture[0]!.pose.quarterTurns,
    ).toBe(1);
    const rotationRoom = commandRoom([piece('a')]);
    rotationRoom.furniture[0]!.locks.rotation = true;
    const rotationLocked = floorSession(rotationRoom);
    expect(rotateFloorSelection(rotationLocked)).toMatchObject({
      ok: false,
      code: 'locked',
    });
    expect(
      beginFloorEdit(rotationLocked, 'a')!.commit({ x: 2500, z: 2000 }),
    ).toEqual({ ok: true, changed: true });
  });
  it('cannot revive a gesture through Before/Current, preview cancellation, view switching, reselection or replacement', () => {
    const changes = [
      (s: SessionController) => {
        s.setComparison('before');
        s.setComparison('current');
        s.select('a');
      },
      (s: SessionController) => {
        s.prepareVisitorPreview(
          [{ type: 'finish', id: 'a', finish: 'ivory' }],
          'Finish',
        );
        s.cancelPreview();
      },
      (s: SessionController) => {
        s.setRoomView('plan');
        s.setRoomView('cutaway');
      },
      (s: SessionController) => {
        s.select(null);
        s.select('a');
      },
      (s: SessionController) => {
        s.reset(commandRoom([piece('a')]));
        s.setRoomView('cutaway');
        s.select('a');
      },
    ];
    for (const change of changes) {
      const s = floorSession(),
        retired = vi.fn(),
        edit = beginFloorEdit(s, 'a', retired)!;
      change(s);
      expect(retired).toHaveBeenCalledOnce();
      expect(edit.commit({ x: 2500, z: 2500 })).toEqual({
        ok: false,
        code: 'stale',
      });
      expect(
        s.getSnapshot().workspace!.current.furniture[0]!.pose.centerX,
      ).toBe(2000);
      expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
    }
  });
  it('fences sleeping expiry and cleanup reentrancy before a late release can write', () => {
    const s = floorSession(),
      retired = vi.fn(() => expect(s.getSnapshot().phase).toBe('expired'));
    const edit = beginFloorEdit(s, 'a', retired)!;
    now = POLICY.guestLifetimeMs;
    expect(edit.commit({ x: 2500, z: 2500 })).toEqual({
      ok: false,
      code: 'stale',
    });
    expect(s.getSnapshot().workspace).toBeNull();
    expect(retired).toHaveBeenCalledOnce();
    now = 0;
    const other = floorSession(),
      original = other.getSnapshot().workspace!;
    const reentrant = beginFloorEdit(other, 'a', () =>
      other.reset(commandRoom([piece('a')])),
    )!;
    expect(reentrant.commit({ x: 2500, z: 2500 })).toEqual({
      ok: false,
      code: 'stale',
    });
    expect(other.getSnapshot().workspace).not.toBe(original);
    expect(
      other.getSnapshot().workspace!.current.furniture[0]!.pose.centerX,
    ).toBe(2000);
  });
  it('preserves pending assistance until an actual visitor commit and releases cancelled ownership beyond capacity', () => {
    const s = floorSession(),
      token = s.beginOperation()!;
    for (let i = 0; i < 80; i++) {
      const edit = beginFloorEdit(s, 'a');
      expect(edit).not.toBeNull();
      edit!.cancel();
      edit!.cancel();
      expect(edit!.current()).toBe(false);
    }
    expect(s.isCurrent(token)).toBe(true);
    expect(beginFloorEdit(s, 'a')!.commit({ x: 2500, z: 2500 })).toEqual({
      ok: true,
      changed: true,
    });
    expect(s.isCurrent(token)).toBe(false);
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(1);
  });
});
describe('one canonical session and effect authority', () => {
  it('keeps unknown and prototype-like error codes safe for text rendering', () => {
    for (const code of [
      'constructor',
      '__proto__',
      'toString',
      'unrecognized-operation',
    ])
      expect(typeof failureMessage(code)).toBe('string');
  });
  it('captures immutable baseline, records one committed gesture and undoes as a new revision', () => {
    const s = session(),
      before = s.getSnapshot().workspace!.baseline;
    expect(hasBaselineChanges(s.getSnapshot().workspace)).toBe(false);
    expect(
      s.previewVisitor([
        {
          type: 'move',
          id: 'a',
          pose: { centerX: 2500.5, centerZ: 2500, quarterTurns: 0 },
        },
      ]).ok,
    ).toBe(true);
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
    expect(
      s.dispatch(
        [
          {
            type: 'move',
            id: 'a',
            pose: { centerX: 2500.5, centerZ: 2500, quarterTurns: 0 },
          },
        ],
        'Move piece',
      ),
    ).toEqual({ ok: true, changed: true });
    const edited = s.getSnapshot().workspace!;
    expect(hasBaselineChanges(s.getSnapshot().workspace)).toBe(true);
    expect(s.getSnapshot().checks!.roomRevision).toBe(
      edited.current.roomRevision,
    );
    expect(edited.history.entries).toHaveLength(1);
    expect(edited.current.furniture[0]!.pose).toMatchObject({
      centerX: 2500.5,
      provenance: { status: 'planned' },
    });
    expect(edited.baseline).toBe(before);
    expect(Object.isFrozen(before.furniture[0]!.pose)).toBe(true);
    expect(s.undo()).toEqual({ ok: true });
    expect(s.getSnapshot().workspace!.current.furniture[0]!.pose).toEqual(
      before.furniture[0]!.pose,
    );
    expect(s.getSnapshot().workspace!.current.roomRevision).toBe(2);
    expect(s.getSnapshot().workspace!.baseline).toBe(before);
    expect(hasBaselineChanges(s.getSnapshot().workspace)).toBe(false);
  });
  it('rejects invalid drops/locked gestures without history or semantic mutation', () => {
    const room = commandRoom([piece('a')]);
    room.furniture[0]!.locks.rotation = true;
    const s = session(room),
      before = s.getSnapshot().workspace;
    expect(
      s.dispatch(
        [
          {
            type: 'move',
            id: 'a',
            pose: { centerX: -100, centerZ: 2000, quarterTurns: 0 },
          },
        ],
        'Move piece',
      ),
    ).toMatchObject({
      ok: false,
      code: 'new-conflict',
      issue: { code: 'outside-room', objectIds: ['a'] },
    });
    expect(
      s.dispatch(
        [{ type: 'rotate', id: 'a', quarterTurns: 1 }],
        'Rotate piece',
      ),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(s.getSnapshot().workspace).toBe(before);
  });
  it('inspection keeps valid operations; committed edits and goals abort and fence late results', () => {
    const s = session(),
      token = s.beginOperation()!,
      abort = vi.fn(),
      accept = vi.fn();
    s.ownResource(abort, token);
    s.select('a');
    s.setView({ zoom: 2, panX: 100 });
    s.setPanel('checks');
    expect(s.isCurrent(token)).toBe(true);
    expect(s.getSnapshot().workspace!.current.roomRevision).toBe(0);
    s.dispatch([{ type: 'finish', id: 'a', finish: 'ivory' }], 'Change finish');
    expect(abort).toHaveBeenCalledOnce();
    expect(s.completeOperation(token, accept)).toBe(false);
    expect(accept).not.toHaveBeenCalled();
    const goalToken = s.beginOperation()!;
    expect(
      s.dispatch(
        [
          {
            type: 'set-intent',
            intent: {
              ...s.getSnapshot().workspace!.current.intent,
              goals: ['sleep'],
            },
          },
        ],
        'Change goals',
      ),
    ).toEqual({ ok: true, changed: true });
    expect(s.isCurrent(goalToken)).toBe(false);
  });
  it('new operations supersede old work and completion is single-use', () => {
    const s = session(),
      a = s.beginOperation()!,
      oldCleanup = vi.fn();
    s.ownResource(oldCleanup, a);
    const b = s.beginOperation()!,
      accept = vi.fn();
    expect(oldCleanup).toHaveBeenCalledOnce();
    expect(s.completeOperation(a, accept)).toBe(false);
    expect(s.completeOperation(b, accept)).toBe(true);
    expect(s.completeOperation(b, accept)).toBe(false);
    expect(accept).toHaveBeenCalledOnce();
    const late = vi.fn();
    expect(s.ownResource(late, a)).toBeNull();
    expect(late).toHaveBeenCalledOnce();
  });
  it('reset fences identity before cleanup and cannot revive old callbacks', () => {
    const s = session(),
      token = s.beginOperation()!,
      accept = vi.fn();
    s.ownResource(() => {
      expect(s.isCurrent(token)).toBe(false);
      s.completeOperation(token, accept);
    }, token);
    const release = vi.fn();
    s.ownResource(release);
    expect(s.reset(createRoomFixture('empty'))).toBe(true);
    expect(s.getSnapshot().generation).toBe(1);
    expect(s.getSnapshot().workspace!.current.furniture).toHaveLength(0);
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
    expect(release).toHaveBeenCalledOnce();
    expect(accept).not.toHaveBeenCalled();
  });
  it('sleeping expiry is enforced at action/result entry before mutation and resource release', () => {
    const s = session(),
      token = s.beginOperation()!,
      accept = vi.fn(),
      cleanup = vi.fn(() => expect(s.getSnapshot().phase).toBe('expired'));
    s.ownResource(cleanup);
    now = POLICY.guestLifetimeMs;
    expect(
      s.dispatch(
        [{ type: 'finish', id: 'a', finish: 'ivory' }],
        'Change finish',
      ),
    ).toEqual({ ok: false, code: 'stale' });
    expect(s.getSnapshot().workspace).toBeNull();
    expect(s.completeOperation(token, accept)).toBe(false);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(accept).not.toHaveBeenCalled();
  });
  it('timer expiry and unmount dispose every owned resource once', () => {
    vi.useFakeTimers();
    const s = session(),
      cleanup = vi.fn();
    s.ownResource(cleanup);
    s.startTimer();
    now = POLICY.guestLifetimeMs;
    vi.advanceTimersByTime(POLICY.guestLifetimeMs);
    expect(s.getSnapshot().phase).toBe('expired');
    s.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('accepted intake captures baseline once without extending the existing fixed lifetime', () => {
    const s = new SessionController(undefined, {
      now: () => now,
      id: () => `id_${++nextId}`,
    });
    controllers.push(s);
    const expires = s.getSnapshot().expiresAt;
    expect(s.beginIntake()).toBe(true);
    now = 1000;
    expect(s.acceptRoom(createRoomFixture('partial'))).toBe(true);
    expect(s.getSnapshot().phase).toBe('editor');
    expect(s.getSnapshot().expiresAt).toBe(expires);
    expect(s.acceptRoom(createRoomFixture('empty'))).toBe(false);
  });
  it('preserves individual measurement evidence and true owned dimensions outside representation bounds', () => {
    const s = session(createRoomFixture('partial'));
    expect(
      s.dispatch(
        [
          {
            type: 'confirm-measurement',
            target: { kind: 'furniture', id: 'bed_1', field: 'width' },
            value: 2501,
          },
        ],
        'Correct measured width',
      ).ok,
    ).toBe(true);
    const bed = s.getSnapshot().workspace!.current.furniture[0]!;
    expect(bed.dimensions.width).toMatchObject({
      value: 2501,
      status: 'confirmed',
      sourceId: 'visitor-confirmed',
    });
    expect(bed.dimensions.height.status).toBe('estimated');
    expect(bed.locks.dimensions).toBe(true);
    expect(
      s.getSnapshot().checks!.issues.some((i) => i.severity === 'hard'),
    ).toBe(true);
  });
  it('long editing keeps bounded history/replay and no-op commands usable', () => {
    const s = session();
    for (let i = 0; i < 300; i++)
      expect(
        s.dispatch(
          [
            {
              type: 'move',
              id: 'a',
              pose: { centerX: 2500 + (i % 2), centerZ: 2500, quarterTurns: 0 },
            },
          ],
          'Move piece',
        ).ok,
      ).toBe(true);
    const w = s.getSnapshot().workspace!;
    expect(w.lastCommandSequence).toBe(300);
    expect(w.history.entries.length).toBeLessThanOrEqual(POLICY.undoEntries);
    expect(w.receipts.length).toBeLessThanOrEqual(POLICY.receiptEntries);
    const revision = w.current.roomRevision,
      token = s.beginOperation()!;
    expect(
      s.dispatch(
        [{ type: 'finish', id: 'a', finish: w.current.furniture[0]!.finish }],
        'Change finish',
      ),
    ).toEqual({ ok: true, changed: false });
    expect(s.isCurrent(token)).toBe(true);
    expect(s.getSnapshot().workspace!.current.roomRevision).toBe(revision);
    expect(s.undo().ok).toBe(true);
    while (s.getSnapshot().workspace!.history.entries.length)
      expect(s.undo().ok).toBe(true);
    expect(hasBaselineChanges(s.getSnapshot().workspace)).toBe(true);
  });
  it('keeps cleanup bounded and continues after an individual release fails', () => {
    const registry = new ResourceRegistry(2),
      last = vi.fn(),
      rejected = vi.fn();
    const first = registry.own(() => {
      throw new Error('private-test-value');
    })!;
    registry.own(last);
    expect(registry.own(rejected)).toBeNull();
    expect(rejected).toHaveBeenCalledOnce();
    registry.clear();
    first();
    expect(last).toHaveBeenCalledOnce();
    expect(registry.size).toBe(0);
    expect(registry.cleanupFailures).toBe(1);
  });
  it('previews separately, cancels a no-change replacement preview, then applies a palette once with whole Undo', () => {
    const s = session(),
      before = s.getSnapshot().workspace!;
    const actions = [
      {
        type: 'room-finish' as const,
        floorFinish: 'walnut' as const,
        wallFinish: 'sage' as const,
      },
    ];
    expect(s.prepareVisitorPreview(actions, 'Apply palette')).toEqual({
      ok: true,
    });
    expect(s.getSnapshot().candidate!.room.room.floorFinish).toBe('walnut');
    expect(s.getSnapshot().workspace).toBe(before);
    expect(
      s.prepareVisitorPreview(
        [
          {
            type: 'room-finish',
            floorFinish: before.current.room.floorFinish,
            wallFinish: before.current.room.wallFinish,
          },
        ],
        'Keep palette',
      ),
    ).toEqual({ ok: true });
    expect(s.getSnapshot().candidate).toBeNull();
    expect(s.applyVisitorPreview().ok).toBe(false);
    s.prepareVisitorPreview(actions, 'Apply palette');
    expect(s.applyVisitorPreview()).toEqual({ ok: true, changed: true });
    expect(s.getSnapshot().candidate).toBeNull();
    expect(s.applyVisitorPreview().ok).toBe(false);
    expect(s.getSnapshot().workspace!.history.entries).toHaveLength(1);
    expect(s.undo().ok).toBe(true);
    expect(s.getSnapshot().workspace!.current.room).toEqual(
      before.current.room,
    );
    s.prepareVisitorPreview(actions, 'Apply palette');
    s.dispatch(
      [
        {
          type: 'move',
          id: 'a',
          pose: { centerX: 2500, centerZ: 2500, quarterTurns: 0 },
        },
      ],
      'Move piece',
    );
    expect(s.getSnapshot().candidate).toBeNull();
    expect(s.applyVisitorPreview().ok).toBe(false);
  });
  it('corrects a feature through shared authority without confirming unrelated measurements', () => {
    const input = createRoomFixture('partial');
    input.room.features[0]!.wallProvenance = {
      status: 'estimated',
      sourceId: 'authored-estimate',
    };
    const s = session(input),
      before = s.getSnapshot().workspace!;
    const feature = before.current.room.features[0]!;
    expect(
      s.dispatch(
        [
          {
            type: 'update-feature',
            id: feature.id,
            feature: {
              ...feature,
              wallProvenance: {
                status: 'confirmed',
                sourceId: 'visitor-confirmed',
              },
            },
          },
        ],
        'Confirm wall',
      ),
    ).toEqual({ ok: true, changed: true });
    expect(s.getSnapshot().workspace!.current.room.features[0]!.wall).toBe(
      feature.wall,
    );
    expect(s.getSnapshot().workspace!.current.room.features[0]!.width).toEqual(
      feature.width,
    );
    expect(
      s.getSnapshot().workspace!.baseline.room.features[0]!.wallProvenance
        .status,
    ).toBe('estimated');
    expect(
      s.dispatch(
        [
          {
            type: 'update-feature',
            id: feature.id,
            feature: {
              ...feature,
              wall: 'east',
              wallProvenance: {
                status: 'confirmed',
                sourceId: 'visitor-confirmed',
              },
            },
          },
        ],
        'Correct wall',
      ).ok,
    ).toBe(true);
    expect(s.getSnapshot().workspace!.current.room.features[0]!.wall).toBe(
      'east',
    );
    expect(s.getSnapshot().workspace!.current.room.height.status).toBe(
      'unknown',
    );
    expect(s.getSnapshot().workspace!.baseline).toBe(before.baseline);
  });
  it('rechecks expiry after operation cleanup before accepting its synchronous result', () => {
    const s = session(),
      token = s.beginOperation()!,
      accept = vi.fn();
    s.ownResource(() => {
      now = POLICY.guestLifetimeMs;
    }, token);
    expect(s.completeOperation(token, accept)).toBe(false);
    expect(accept).not.toHaveBeenCalled();
    expect(s.getSnapshot().phase).toBe('expired');
  });
});
