import { afterEach, it, expect, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  SessionPersistence,
  RECOVERY_KEY,
} from '../apps/frontend/src/features/session/persistence.js';
import {
  projectOf,
  readRecovery,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import { commandRoom, piece } from './fixtures/command-room.js';

class MemoryStorage {
  values = new Map<string, string>();
  writes = 0;
  failRead = false;
  failWrite = false;
  afterWrite: (() => void) | null = null;
  getItem(key: string) {
    if (this.failRead) throw new Error('denied');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error('quota');
    this.values.set(key, value);
    this.writes++;
    this.afterWrite?.();
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
const owned: Array<() => void> = [];
function setup(storage = new MemoryStorage(), now = () => 0) {
  const session = new SessionController(commandRoom([piece('desk')]), { now }),
    persistence = new SessionPersistence(session, storage, now);
  owned.push(() => {
    persistence.dispose();
    session.dispose();
  });
  return { session, persistence, storage };
}
afterEach(() => {
  owned.splice(0).forEach((close) => close());
  vi.useRealTimers();
});
const finish = [
  {
    type: 'room-finish' as const,
    floorFinish: 'walnut' as const,
    wallFinish: 'sage' as const,
  },
];
it('coalesces accepted changes and excludes candidate/chat/history/operations from the saved projection', async () => {
  vi.useFakeTimers();
  const { session: s, persistence: p, storage } = setup();
  s.dispatch(finish, 'Finish');
  s.select('desk');
  s.setView({ zoom: 1.4 });
  s.prepareVisitorPreview(
    [{ type: 'room-finish', floorFinish: 'clay', wallFinish: 'ivory' }],
    'Unapplied',
  );
  await vi.advanceTimersByTimeAsync(250);
  expect(storage.writes).toBe(1);
  const text = storage.getItem(RECOVERY_KEY)!;
  expect(text).not.toMatch(
    /candidate|pending|history|receipts|grant|chat|photos|zoom|workspaceId/,
  );
  const saved = readRecovery(text, 0);
  expect(saved.ok && saved.value.project.current.room.floorFinish).toBe(
    'walnut',
  );
  expect(saved.ok && saved.value.project.baseline.room.floorFinish).toBe('oak');
  expect(s.getSnapshot().persistence).toBe('saved');
  expect(p.flush()).toBe(true);
  expect(storage.writes).toBe(1);
});
it('recovers price-only edits and saved versions without serializing or rewriting chat', async () => {
  vi.useFakeTimers();
  const { session: s, persistence: p, storage } = setup();
  s.setDestination('cost');
  const settings = structuredClone(s.getSnapshot().cost!.settings);
  settings.floor.wasteBps = 2000;
  s.updateCost(settings);
  expect(s.saveEstimate('Reviewed').ok).toBe(true);
  await vi.advanceTimersByTimeAsync(250);
  const writes = storage.writes;
  s.costMessage('visitor', 'PRIVATE_COST_CHAT');
  await vi.advanceTimersByTimeAsync(300);
  expect(storage.writes).toBe(writes);
  expect(storage.getItem(RECOVERY_KEY)).not.toContain('PRIVATE_COST_CHAT');
  const read = readRecovery(storage.getItem(RECOVERY_KEY)!, 0);
  expect(read.ok).toBe(true);
  if (read.ok) {
    expect(read.value.project.cost!.settings.floor.wasteBps).toBe(2000);
    expect(read.value.project.versions).toHaveLength(1);
    expect(read.value.ui.destination).toBe('cost');
  }
  expect(p.flush()).toBe(true);
});
it('does not claim a reentrant old price write saved after the same workspace changes prices', () => {
  const { session: s, persistence: p, storage } = setup();
  s.setDestination('cost');
  storage.afterWrite = () => {
    storage.afterWrite = null;
    const next = structuredClone(s.getSnapshot().cost!.settings);
    next.floor.wasteBps = 2500;
    s.updateCost(next);
  };
  expect(p.flush()).toBe(false);
  expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  expect(p.flush()).toBe(true);
  const read = readRecovery(storage.getItem(RECOVERY_KEY)!, 0);
  expect(read.ok && read.value.project.cost!.settings.floor.wasteBps).toBe(
    2500,
  );
});
it.each(['reset', 'expiry', 'dispose'] as const)(
  'releases persistence-owned financial references after %s without deleting a valid teardown save',
  (event) => {
    let now = 0;
    const { session: s, persistence: p, storage } = setup(undefined, () => now);
    s.setDestination('cost');
    s.saveEstimate('Reviewed');
    p.flush();
    const state = s.getSnapshot(),
      references = [
        state.cost!.settings,
        state.cost!.offers,
        state.estimateVersions,
      ],
      saved = storage.getItem(RECOVERY_KEY);
    if (event === 'reset') s.reset();
    if (event === 'expiry') {
      now = state.expiresAt;
      s.checkExpiry();
    }
    if (event === 'dispose') p.dispose();
    for (const value of references)
      expect(Object.values(p)).not.toContain(value);
    expect(storage.getItem(RECOVERY_KEY)).toBe(
      event === 'dispose' ? saved : null,
    );
  },
);
it.each(['reset', 'import', 'expiry', 'dispose'] as const)(
  'a scheduled old write cannot resurrect data after %s',
  async (event) => {
    vi.useFakeTimers();
    let now = 0;
    const { session: s, persistence: p, storage } = setup(undefined, () => now),
      project = projectOf(s.getSnapshot())!;
    storage.values.set('unrelated-app', 'keep');
    s.dispatch(finish, 'Old finish');
    if (event === 'reset') s.reset();
    if (event === 'import') s.importProject(project);
    if (event === 'expiry') {
      now = POLICY.guestLifetimeMs;
      s.checkExpiry();
    }
    if (event === 'dispose') {
      p.dispose();
      s.dispose();
    }
    await vi.advanceTimersByTimeAsync(1000);
    const text = storage.getItem(RECOVERY_KEY);
    if (event === 'import') {
      const read = readRecovery(text!, now);
      expect(read.ok && read.value.project.current.room.floorFinish).toBe(
        'oak',
      );
    } else expect(text).toBeNull();
    expect(storage.getItem('unrelated-app')).toBe('keep');
  },
);
it('checks generation after a reentrant storage write and never erases its newer replacement', () => {
  const { session: s, persistence: p, storage } = setup(),
    project = projectOf(s.getSnapshot())!;
  storage.afterWrite = () => {
    storage.afterWrite = null;
    s.importProject(project);
    p.flush();
  };
  expect(p.flush()).toBe(false);
  const read = readRecovery(storage.getItem(RECOVERY_KEY)!, 0);
  expect(read.ok).toBe(true);
  expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
});
it('a retiring failed write cannot delete or mark its newer successful replacement unsaved', () => {
  const { session: s, persistence: p, storage } = setup(),
    project = projectOf(s.getSnapshot())!;
  storage.afterWrite = () => {
    storage.afterWrite = null;
    s.importProject(project);
    p.flush();
    throw new Error('retired-storage-failure');
  };
  expect(p.flush()).toBe(false);
  expect(storage.getItem(RECOVERY_KEY)).not.toBeNull();
  expect(s.getSnapshot().persistence).toBe('saved');
});
it('an older success cannot replace a newer same-workspace save failure with a saved claim', () => {
  const { session: s, persistence: p, storage } = setup();
  storage.afterWrite = () => {
    storage.afterWrite = null;
    storage.failWrite = true;
    s.dispatch(finish, 'Newer unsaved room');
    p.flush();
  };
  expect(p.flush()).toBe(false);
  expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  expect(s.getSnapshot().persistence).toBe('memory-only');
});
it.each(['denied', 'quota'] as const)(
  '%s storage stays honest and useful memory-only edits continue',
  (kind) => {
    const storage = new MemoryStorage();
    storage.failRead = kind === 'denied';
    storage.failWrite = kind === 'quota';
    const { session: s, persistence: p } = setup(storage);
    p.flush();
    expect(s.getSnapshot().persistence).toBe('memory-only');
    expect(s.dispatch(finish, 'Memory change').ok).toBe(true);
    expect(s.getSnapshot().workspace!.current.room.floorFinish).toBe('walnut');
  },
);
it('a failed update removes its stale saved snapshot when storage still permits removal', () => {
  const { session: s, persistence: p, storage } = setup();
  expect(p.flush()).toBe(true);
  storage.failWrite = true;
  s.dispatch(finish, 'Unstored change');
  expect(p.flush()).toBe(false);
  expect(storage.getItem(RECOVERY_KEY)).toBeNull();
  expect(s.getSnapshot().persistence).toBe('memory-only');
  expect(s.getSnapshot().workspace!.current.room.floorFinish).toBe('walnut');
});
it.each(['corrupt', 'future-version', 'extra-runtime', 'expired'] as const)(
  'rejects %s stored state and preserves unrelated browser records',
  (kind) => {
    const storage = new MemoryStorage(),
      source = new SessionController(commandRoom(), { now: () => 0 }),
      record = recoveryOf(source.getSnapshot())!;
    source.dispose();
    const raw =
      kind === 'corrupt'
        ? '{'
        : JSON.stringify(
            kind === 'extra-runtime'
              ? { ...record, mode: 'live', paidEnabled: true }
              : kind === 'future-version'
                ? { ...record, project: { ...record.project, version: 9 } }
                : record,
          );
    storage.values.set(RECOVERY_KEY, raw);
    storage.values.set('unrelated-app', 'keep');
    const { session: s } = setup(storage, () =>
      kind === 'expired' ? POLICY.guestLifetimeMs : 0,
    );
    expect(s.getSnapshot().recovered).toBe(false);
    expect(storage.getItem('unrelated-app')).toBe('keep');
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
    if (kind === 'expired') expect(s.getSnapshot().phase).toBe('expired');
  },
);
it('refresh restores accepted semantics with original expiry and fresh command/provider identity', () => {
  let now = 0;
  const { session: s, persistence: p, storage } = setup(undefined, () => now);
  s.dispatch(finish, 'Finish');
  s.setRoomView('cutaway');
  p.flush();
  const oldId = s.getSnapshot().workspace!.workspaceId,
    expiresAt = s.getSnapshot().expiresAt;
  p.dispose();
  s.dispose();
  now = POLICY.guestLifetimeMs - 1000;
  const { session: restored } = setup(storage, () => now),
    state = restored.getSnapshot();
  expect(state.recovered).toBe(true);
  expect(state.expiresAt).toBe(expiresAt);
  expect(state.workspace!.workspaceId).not.toBe(oldId);
  expect(state.workspace!.current.room.floorFinish).toBe('walnut');
  expect(state.presentation.roomView).toBe('cutaway');
  expect(state.workspace!.history.entries).toHaveLength(0);
  expect(state.workspace!.lastCommandSequence).toBe(0);
  expect(state.workspace!.receipts).toHaveLength(0);
  expect(state.candidate).toBeNull();
  expect(state.pending).toBeNull();
});
it('a duplicate-tab storage copy gets independent state and resetting it cannot clear the original tab', () => {
  const first = setup();
  first.session.dispatch(finish, 'Finish');
  first.persistence.flush();
  const copied = new MemoryStorage();
  copied.values = new Map(first.storage.values);
  const second = setup(copied);
  expect(second.session.getSnapshot().recovered).toBe(true);
  expect(second.session.getSnapshot().workspace!.workspaceId).not.toBe(
    first.session.getSnapshot().workspace!.workspaceId,
  );
  second.session.reset();
  expect(second.storage.getItem(RECOVERY_KEY)).toBeNull();
  expect(first.storage.getItem(RECOVERY_KEY)).not.toBeNull();
  expect(first.session.getSnapshot().workspace!.current.room.floorFinish).toBe(
    'walnut',
  );
});

it('reports only a successful recovery without changing its room or treating missing/invalid data as a recovered conflict', () => {
  vi.useFakeTimers();
  const first = setup();
  expect(first.session.getSnapshot().recovered).toBe(false);
  first.session.dispatch(finish, 'Finish');
  first.persistence.flush();
  const saved = first.storage.getItem(RECOVERY_KEY);
  const restored = setup(first.storage);
  expect(restored.session.getSnapshot().recovered).toBe(true);
  expect(
    restored.session.getSnapshot().workspace!.current.room.floorFinish,
  ).toBe('walnut');
  expect(restored.storage.getItem(RECOVERY_KEY)).toBe(saved);
  const invalid = new MemoryStorage();
  invalid.values.set(RECOVERY_KEY, '{}');
  expect(setup(invalid).session.getSnapshot().recovered).toBe(false);
});
