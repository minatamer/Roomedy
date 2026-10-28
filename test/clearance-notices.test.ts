import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRoom } from '@roomedy/spatial';
import { clearanceNotice } from '../apps/frontend/src/features/session/clearance.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { projectOf } from '../apps/frontend/src/features/session/project.js';
import { commandRoom, move, piece, unknown } from './fixtures/command-room.js';

const controllers: SessionController[] = [];
afterEach(() => {
  controllers.splice(0).forEach((c) => c.dispose());
  vi.useRealTimers();
});
function room(close = true) {
  const bed = piece('bed', 2000, 2000, {
      catalogueId: 'procedural-bed',
      width: 1600,
      depth: 2100,
      height: 850,
    }),
    wardrobe = piece('wardrobe', 2000, close ? 3450 : 4300, {
      catalogueId: 'wardrobe-hinged',
      width: 1200,
      depth: 600,
      height: 2100,
    });
  bed.label = 'Simple bed';
  wardrobe.label = 'Hinged wardrobe';
  return commandRoom([bed, wardrobe, piece('desk', 7000, 7000)]);
}
function session(close = true) {
  const c = new SessionController(room(close), { now: () => 0 });
  controllers.push(c);
  return c;
}
describe('fact-owned furniture access notices', () => {
  it.each(['bed', 'wardrobe'])(
    'explains the bed access overlap when selecting %s without changing semantics',
    (id) => {
      const c = session(),
        before = c.getSnapshot(),
        conflict = before.checks!.issues.find((i) => i.code === 'access')!;
      expect(conflict).toMatchObject({
        rule: 'front-access',
        severity: 'warning',
        objectIds: ['bed', 'wardrobe'],
        region: { minZ: 3150, maxZ: 3650 },
      });
      c.select(id);
      expect(c.getSnapshot().message).toMatch(/Simple bed.*Hinged wardrobe/);
      expect(c.getSnapshot().messageKind).toBe('clearance');
      expect(c.getSnapshot().workspace).toBe(before.workspace);
      expect(c.getSnapshot().checks).toBe(before.checks);
      expect(c.getSnapshot().undoLabel).toBeNull();
    },
  );
  it.each([
    ['procedural-bed', 8800, 2100],
    ['procedural-chair', 350, 550],
  ] as const)(
    'describes single-piece %s access without guessing a direction or another object',
    (catalogueId, centerZ, depth) => {
      const one = piece('one', 2000, centerZ, { catalogueId, depth }),
        r = commandRoom([one]);
      const message = clearanceNotice(r, checkRoom(r), 'one');
      expect(message).toContain('around one');
      expect(message).not.toContain('between');
      expect(message).not.toContain('in front');
    },
  );
  it('retains approximate/incomplete evidence and skips missing-footprint assessments', () => {
    const r = room();
    r.furniture[0]!.pose.provenance = {
      status: 'estimated',
      sourceId: 'photo_1',
    };
    expect(clearanceNotice(r, checkRoom(r), 'bed')).toMatch(
      /^Estimated clearance:/,
    );
    r.furniture[0]!.pose.provenance = { status: 'unknown', sourceId: null };
    expect(clearanceNotice(r, checkRoom(r), 'bed')).toContain(
      'Leave more space',
    );
    r.furniture[0]!.dimensions.width = unknown();
    expect(clearanceNotice(r, checkRoom(r), 'bed')).toBeNull();
  });
  it('does not treat an unrelated selected piece, another rule or missing region as an access conflict', () => {
    const r = room(),
      checks = checkRoom(r);
    expect(clearanceNotice(r, checks, 'desk')).toBeNull();
    expect(clearanceNotice(r, checks, null)).toBeNull();
    expect(
      clearanceNotice(
        r,
        {
          ...checks,
          issues: checks.issues.map((i) => ({ ...i, region: null })),
        },
        'bed',
      ),
    ).toBeNull();
    expect(
      clearanceNotice(
        r,
        {
          ...checks,
          issues: checks.issues.map((i) => ({ ...i, rule: 'solid' })),
        },
        'bed',
      ),
    ).toBeNull();
  });
  it('bounds long labels and does not mutate the evaluator facts', () => {
    const r = room();
    r.furniture.forEach((p) => (p.label = 'Long furniture name '.repeat(8)));
    const checks = checkRoom(r),
      before = JSON.stringify(checks),
      message = clearanceNotice(r, checks, 'bed')!;
    expect(message.length).toBeLessThanOrEqual(240);
    expect(message).toContain('for access');
    expect(JSON.stringify(checks)).toBe(before);
  });
  it('prefers the selected pair when several real access conflicts exist', () => {
    const r = room(),
      second = structuredClone(r.furniture.slice(0, 2));
    second[0]!.id = 'guest_bed';
    second[0]!.label = 'Guest bed';
    second[1]!.id = 'guest_wardrobe';
    second[1]!.label = 'Tall wardrobe';
    second.forEach((p) => (p.pose.centerX = 6500));
    r.furniture.push(...second);
    const message = clearanceNotice(r, checkRoom(r), 'guest_bed')!;
    expect(message).toMatch(/Guest bed.*Tall wardrobe/);
    expect(message).not.toContain('Simple bed');
  });
});

describe('shared access-toast lifecycle', () => {
  it('keeps preview messaging intact and announces a conflict only after actual Apply', () => {
    const c = session(false),
      current = c.getSnapshot().workspace!.current,
      token = c.beginOperation()!;
    expect(
      c.prepareAssistant(
        token,
        [
          {
            type: 'move',
            id: 'wardrobe',
            pose: { centerX: 2000, centerZ: 3450, quarterTurns: 0 },
          },
        ],
        {
          roomId: current.roomId,
          roomRevision: current.roomRevision,
          actionKinds: ['move'],
          targetIds: ['wardrobe'],
          additions: [],
          replacements: [],
          removals: [],
          roomFinishes: false,
        },
        'Move wardrobe',
      ).ok,
    ).toBe(true);
    c.select('bed');
    expect(c.getSnapshot().message).toContain('Proposal ready');
    expect(c.getSnapshot().workspace!.current).toBe(current);
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'applied',
    });
    expect(c.getSnapshot().messageKind).toBe('clearance');
    expect(c.getSnapshot().message).toMatch(/Simple bed.*Hinged wardrobe/);
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(1);
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'already-applied',
    });
    expect(c.getSnapshot().messageKind).toBe('confirmation');
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(1);
  });
  it('announces a newly accepted close placement and clears it when resolved', () => {
    const c = session(false);
    expect(c.dispatch([move('wardrobe', 2000, 3450)], 'Move wardrobe').ok).toBe(
      true,
    );
    expect(c.getSnapshot()).toMatchObject({ messageKind: 'clearance' });
    expect(c.getSnapshot().message).toMatch(/Simple bed.*Hinged wardrobe/);
    expect(c.dispatch([move('wardrobe', 2000, 4300)], 'Move wardrobe').ok).toBe(
      true,
    );
    expect(c.getSnapshot()).toMatchObject({
      messageKind: 'confirmation',
      message: 'Move wardrobe.',
    });
  });
  it('notices changed access geometry and Undo restoring a conflict', () => {
    const c = session();
    expect(c.dispatch([move('wardrobe', 2000, 3500)], 'Move wardrobe').ok).toBe(
      true,
    );
    expect(c.getSnapshot().messageKind).toBe('clearance');
    expect(c.dispatch([move('wardrobe', 2000, 4300)], 'Move wardrobe').ok).toBe(
      true,
    );
    expect(c.undo().ok).toBe(true);
    expect(c.getSnapshot().messageKind).toBe('clearance');
    expect(c.getSnapshot().workspace!.current.furniture[1]!.pose.centerZ).toBe(
      3500,
    );
  });
  it('does not replay an existing conflict for finish, unrelated movement or no-op', () => {
    const c = session();
    c.select('bed');
    for (const actions of [
      [{ type: 'finish' as const, id: 'bed', finish: 'ivory' as const }],
      [move('desk', 7200, 7000)],
      [move('desk', 7200, 7000)],
    ]) {
      expect(c.dispatch(actions, 'Edit piece').ok).toBe(true);
      expect(c.getSnapshot().messageKind).toBe('confirmation');
    }
  });
  it('keeps hard spatial rejection and accepted facts unchanged', () => {
    const c = session(false),
      before = c.getSnapshot();
    expect(
      c.dispatch([move('wardrobe', 2000, 2800)], 'Move wardrobe'),
    ).toMatchObject({ ok: false, code: 'new-conflict' });
    expect(c.getSnapshot()).toBe(before);
  });
  it('expires once after four seconds without a camera/panel update restarting it', () => {
    vi.useFakeTimers();
    const c = session();
    c.select('bed');
    vi.advanceTimersByTime(3000);
    c.setRoomView('plan');
    c.setPanel('room');
    c.setView({ zoom: 1.2 });
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(c.getSnapshot().message).toBe('');
    expect(vi.getTimerCount()).toBe(0);
    c.select('bed');
    expect(c.getSnapshot().messageKind).toBe('clearance');
  });
  it('clears only an access notice on unrelated selection or deselection', () => {
    const c = session();
    c.select('bed');
    c.select('desk');
    expect(c.getSnapshot().message).toBe('');
    c.select('wardrobe');
    c.select(null);
    expect(c.getSnapshot().message).toBe('');
    c.notify('A different useful error');
    c.select('desk');
    expect(c.getSnapshot().message).toBe('A different useful error');
  });
  it.each(['pending', 'preview', 'before', 'load-failure'] as const)(
    'does not replace %s messages on selection',
    (state) => {
      const c = session();
      if (state === 'pending') c.beginOperation();
      if (state === 'preview')
        c.prepareVisitorPreview(
          [{ type: 'finish', id: 'bed', finish: 'ivory' }],
          'Palette',
        );
      if (state === 'before') c.setComparison('before');
      if (state === 'load-failure') c.clientPartFailed();
      const before = c.getSnapshot();
      c.select('bed');
      expect(c.getSnapshot().message).toBe(before.message);
      expect(c.getSnapshot().candidate).toBe(before.candidate);
      expect(c.getSnapshot().pending).toBe(before.pending);
    },
  );
  it.each(['reset', 'import', 'expiry', 'dispose'] as const)(
    '%s retires the access timer without late resurrection',
    (action) => {
      vi.useFakeTimers();
      const c = session(),
        project = projectOf(c.getSnapshot())!;
      c.select('bed');
      if (action === 'reset') c.reset(room(false));
      if (action === 'import') c.importProject(project);
      if (action === 'expiry') c.expiredRecovery();
      if (action === 'dispose') c.dispose();
      const retired = c.getSnapshot();
      vi.advanceTimersByTime(5000);
      expect(c.getSnapshot()).toBe(retired);
      // Reset/import retain their new session's lifetime timer, never the old notice.
      expect(vi.getTimerCount()).toBe(
        action === 'reset' || action === 'import' ? 1 : 0,
      );
    },
  );
});
