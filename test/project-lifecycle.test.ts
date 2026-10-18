import { afterEach, it, expect, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
  readRecovery,
  projectOf,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import { BrowserLayoutSearch } from '../apps/frontend/src/features/layout-search/client.js';
import type { SearchWorker } from '../apps/frontend/src/features/layout-search/client.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import type { PreparedPhoto } from '../apps/frontend/src/features/room-intake/images.js';
import {
  commandRoom,
  piece,
  windowFeature,
  unknown,
  known,
} from './fixtures/command-room.js';
import { windowCase, scopeFor } from './fixtures/search-corpus.js';

const sessions: SessionController[] = [];
function session(room = commandRoom([piece('desk')]), now = () => 0) {
  const value = new SessionController(room, { now });
  sessions.push(value);
  return value;
}
const finish = [
  {
    type: 'room-finish' as const,
    floorFinish: 'walnut' as const,
    wallFinish: 'sage' as const,
  },
];
afterEach(() => {
  sessions.splice(0).forEach((s) => s.dispose());
  vi.useRealTimers();
});
it('Before blocks semantic edits/Undo/assistant work while retaining the same view and immutable baseline', () => {
  const s = session(),
    baseline = s.getSnapshot().workspace!.baseline;
  expect(s.dispatch(finish, 'Room finish').ok).toBe(true);
  s.setRoomView('cutaway');
  s.setView({ zoom: 1.4, panX: 250 });
  const current = s.getSnapshot().workspace!.current,
    history = s.getSnapshot().workspace!.history;
  expect(s.setComparison('before')).toBe(true);
  s.select('desk');
  expect(s.getSnapshot().presentation.selectedId).toBe('desk');
  expect(s.getSnapshot().presentation.roomView).toBe('cutaway');
  expect(s.getSnapshot().presentation.zoom).toBe(1.4);
  expect(s.dispatch(finish, 'Blocked').ok).toBe(false);
  expect(s.previewVisitor(finish).ok).toBe(false);
  expect(s.undo().ok).toBe(false);
  expect(s.beginOperation()).toBeNull();
  expect(s.getSnapshot().workspace!.current).toBe(current);
  expect(s.getSnapshot().workspace!.history).toBe(history);
  expect(s.getSnapshot().workspace!.baseline).toBe(baseline);
  expect(s.setComparison('current')).toBe(true);
  expect(s.undo().ok).toBe(true);
  expect(s.getSnapshot().workspace!.baseline).toBe(baseline);
});
it('requires explicit preview resolution, then fences pending work when comparison begins', () => {
  const s = session(),
    before = s.getSnapshot().workspace!.current;
  expect(s.prepareVisitorPreview(finish, 'Palette').ok).toBe(true);
  expect(s.setComparison('before')).toBe(false);
  expect(s.setComparison('current')).toBe(false);
  expect(s.getSnapshot().candidate).not.toBeNull();
  s.cancelPreview();
  const token = s.beginOperation()!,
    cleaned = vi.fn();
  s.ownResource(cleaned, token);
  expect(s.setComparison('before')).toBe(true);
  expect(cleaned).toHaveBeenCalledTimes(1);
  expect(
    s.completeOperation(token, () => {
      throw new Error('stale');
    }),
  ).toBe(false);
  expect(s.getSnapshot().workspace!.current).toEqual(before);
  expect(s.getSnapshot().workspace!.history.entries).toHaveLength(0);
});
it('round-trips half-mm centres, true owned size, unknown evidence and baseline without operational or photo data', () => {
  const room = commandRoom([piece('desk', 2000.5, 2500.5)], [windowFeature()]);
  room.furniture[0]!.dimensions.width = known(3500);
  room.furniture[0]!.dimensions.height = unknown();
  room.furniture[0]!.pose.provenance = {
    status: 'planned',
    sourceId: 'visitor-position',
  };
  const s = session(room),
    original = s.getSnapshot().workspace!.baseline;
  expect(s.dispatch(finish, 'Finish').ok).toBe(true);
  const dirty = {
    ...s.getSnapshot(),
    photos: ['PRIVATE_FILENAME.png'],
    chat: ['PRIVATE_CHAT'],
    grant: 'PRIVATE_GRANT',
    runtime: { mode: 'live', paid: true },
  };
  const text = exportProject(dirty)!;
  expect(text).not.toMatch(
    /PRIVATE_|blob:|receipts|commandSequence|history|pending|runtime/,
  );
  const parsed = readProject(text);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  const imported = session(commandRoom());
  expect(imported.importProject(parsed.value)).toBe(true);
  const state = imported.getSnapshot();
  expect(state.workspace!.baseline).toEqual(original);
  expect(state.workspace!.current.furniture[0]!.pose.centerX).toBe(2000.5);
  expect(state.workspace!.current.furniture[0]!.dimensions).toEqual(
    room.furniture[0]!.dimensions,
  );
  expect(state.workspace!.current.furniture[0]!.pose.provenance.status).toBe(
    'planned',
  );
  expect(state.workspace!.history.entries).toHaveLength(0);
  expect(state.workspace!.receipts).toHaveLength(0);
  expect(state.imported).toBe(true);
  expect(state.workspace!.workspaceId).not.toBe(
    s.getSnapshot().workspace!.workspaceId,
  );
});
it.each([
  'version',
  'asset',
  'duplicate',
  'baseline',
  'fractional-size',
  'extra',
  'invalid-json',
  'bytes',
] as const)('rejects %s before replacing any useful room', (kind) => {
  const s = session(),
    snapshot = s.getSnapshot(),
    project = projectOf(snapshot)!;
  if (kind === 'version') project.version = 9 as 1;
  if (kind === 'asset')
    project.current.furniture[0]!.catalogueId = 'remote-asset';
  if (kind === 'duplicate')
    project.current.furniture.push(
      structuredClone(project.current.furniture[0]!),
    );
  if (kind === 'baseline') project.baseline.roomId = 'another_room';
  if (kind === 'fractional-size')
    project.current.furniture[0]!.dimensions.width = known(1200.5);
  const text =
    kind === 'invalid-json'
      ? '{'
      : kind === 'bytes'
        ? 'x'.repeat(POLICY.projectBytes + 1)
        : JSON.stringify(
            kind === 'extra'
              ? {
                  ...project,
                  photos: ['PRIVATE'],
                  script: '<script>bad</script>',
                  mode: 'live',
                }
              : project,
          );
  expect(readProject(text).ok).toBe(false);
  expect(s.getSnapshot()).toBe(snapshot);
});
it('new import retires old tokens and starting locks remain authoritative despite imported confirmed labels', () => {
  const s = session(),
    project = projectOf(s.getSnapshot())!,
    token = s.beginOperation()!,
    cleanup = vi.fn();
  s.ownResource(cleanup, token);
  project.current.furniture[0]!.locks.position = true;
  expect(s.importProject(project)).toBe(true);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(s.isCurrent(token)).toBe(false);
  expect(s.applyAssistantPreview().ok).toBe(false);
  expect(
    s.dispatch(
      [
        {
          type: 'move',
          id: 'desk',
          pose: { centerX: 3000, centerZ: 2500, quarterTurns: 0 },
        },
      ],
      'Attempt',
    ).ok,
  ).toBe(false);
  expect(s.getSnapshot().workspace!.current.furniture[0]!.locks.position).toBe(
    true,
  );
});
it('restores at1:59:59 without extending creation and expires at2:00:00 on action entry', () => {
  let now = 0;
  const s = session(undefined, () => now),
    saved = recoveryOf(s.getSnapshot())!;
  now = POLICY.guestLifetimeMs - 1000;
  const read = readRecovery(JSON.stringify(saved), now);
  expect(read.ok).toBe(true);
  const restored = session(commandRoom(), () => now);
  if (!read.ok) return;
  expect(restored.restore(read.value)).toBe(true);
  expect(restored.dispatch(finish, 'Last change').ok).toBe(true);
  expect(restored.getSnapshot().expiresAt).toBe(POLICY.guestLifetimeMs);
  now = POLICY.guestLifetimeMs;
  expect(restored.dispatch(finish, 'Too late').ok).toBe(false);
  expect(restored.getSnapshot().phase).toBe('expired');
  expect(restored.getSnapshot().workspace).toBeNull();
  expect(readRecovery(JSON.stringify(saved), now).ok).toBe(false);
});
it('warns five minutes before fixed expiry and never supplies an extension', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const s = session(undefined, Date.now);
  s.startTimer();
  await vi.advanceTimersByTimeAsync(POLICY.guestLifetimeMs - 5 * 60_000);
  expect(s.getSnapshot().expiresSoon).toBe(true);
  expect(s.getSnapshot().expiresAt).toBe(POLICY.guestLifetimeMs);
  await vi.advanceTimersByTimeAsync(5 * 60_000);
  expect(s.getSnapshot().phase).toBe('expired');
});
it('client load failure fences work and preserves exportable accepted data without automatic reload or replay', () => {
  const s = session();
  s.dispatch(finish, 'Finish');
  const token = s.beginOperation()!,
    cleanup = vi.fn(),
    accepted = s.getSnapshot().workspace!.current;
  s.ownResource(cleanup, token);
  s.clientPartFailed();
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(s.getSnapshot().clientLoadFailure).toBe(true);
  expect(s.getSnapshot().workspace!.current).toBe(accepted);
  expect(s.beginOperation()).toBeNull();
  expect(s.dispatch(finish, 'Blocked').ok).toBe(false);
  expect(exportProject(s.getSnapshot())).not.toBeNull();
  const saved = recoveryOf(s.getSnapshot())!,
    fresh = session();
  expect(fresh.restore(saved)).toBe(true);
  expect(fresh.getSnapshot().clientLoadFailure).toBe(false);
  expect(fresh.getSnapshot().pending).toBeNull();
  expect(fresh.getSnapshot().workspace!.history.entries).toHaveLength(0);
});
it('worker load errors terminate once and retain accepted semantics for explicit recovery', async () => {
  const { room, selected } = windowCase(),
    s = session(room),
    token = s.beginOperation()!;
  const worker: SearchWorker = {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  };
  const client = new BrowserLayoutSearch(s, () => worker),
    pending = client.run(token, selected, scopeFor(room, selected));
  worker.onerror!({} as ErrorEvent);
  await pending;
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(s.getSnapshot().clientLoadFailure).toBe(true);
  expect(s.getSnapshot().workspace!.current).toEqual(room);
  expect(s.getSnapshot().candidate).toBeNull();
});
it('import during photo decode fences the actual review/photo owner and late decode cannot recreate URLs or drafts', async () => {
  const s = new SessionController(undefined, { now: () => 0 });
  sessions.push(s);
  let settle: (value: PreparedPhoto) => void = () => undefined;
  const createUrl = vi.fn(() => 'blob:late'),
    revokeUrl = vi.fn(),
    review = new ReviewController(s, 'partial', () => 'review_id', {
      id: () => 'photo_id',
      createUrl,
      revokeUrl,
      prepare: () =>
        new Promise((resolve) => {
          settle = resolve;
        }),
    });
  review.addPhotos([new File(['raw'], 'PRIVATE_FILENAME.png')], 'room');
  await vi.waitFor(() =>
    expect(review.photos.getSnapshot()[0]?.status).toBe('processing'),
  );
  const source = session(),
    project = projectOf(source.getSnapshot())!;
  expect(s.importProject(project)).toBe(true);
  const state = s.getSnapshot();
  settle({
    normalized: new Blob(['normalized']),
    preview: new Blob(['preview']),
    type: 'image/png',
    inputWidth: 10,
    inputHeight: 10,
    width: 10,
    height: 10,
    decodeMs: 1,
    prepareMs: 1,
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(s.getSnapshot()).toBe(state);
  expect(review.photos.getSnapshot()).toHaveLength(0);
  expect(createUrl).not.toHaveBeenCalled();
  review.dispose();
});
