import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { projectOf } from '../apps/frontend/src/features/session/project.js';
import { startDesignExport } from '../apps/frontend/src/features/design-export/job.js';
import { commandRoom, piece, move } from './fixtures/command-room.js';
const controllers: SessionController[] = [];
afterEach(() => {
  controllers.splice(0).forEach((c) => c.dispose());
  vi.useRealTimers();
});
function setup() {
  let now = 1000;
  const c = new SessionController(commandRoom([piece('desk')]), {
    now: () => now,
  });
  controllers.push(c);
  let resolve!: (blob: Blob) => void;
  const work = new Promise<Blob>((done) => {
    resolve = done;
  });
  const downloads: Blob[] = [];
  const progress: string[] = [];
  const job = startDesignExport(
    c,
    async (port) => {
      port.progress('Creating room views…');
      return work;
    },
    (blob) => downloads.push(blob),
    (text) => progress.push(text),
  );
  return {
    c,
    job,
    downloads,
    progress,
    resolve,
    work,
    advance: (ms: number) => (now += ms),
  };
}
describe('bounded snapshot export authority', () => {
  it('exports the selected saved room and prices while later draft edits remain independent', async () => {
    const c = new SessionController(commandRoom([piece('desk')]));
    controllers.push(c);
    c.setDestination('cost');
    c.saveEstimate('Approved');
    const saved = c.getSnapshot().estimateVersions[0]!,
      before = JSON.stringify(saved),
      downloads: Blob[] = [];
    let finish!: (blob: Blob) => void;
    const pending = new Promise<Blob>((resolve) => {
      finish = resolve;
    });
    const job = startDesignExport(
      c,
      async (port) => {
        expect(port.estimate).toEqual(saved);
        expect(port.project.current).toBe(port.estimate!.room);
        expect(port.project.cost).toBe(port.estimate!.pricing);
        expect(Object.isFrozen(port.estimate!.pricing.offers[0])).toBe(true);
        return pending;
      },
      (blob) => downloads.push(blob),
      () => {},
      undefined,
      { estimateId: saved.id },
    );
    await Promise.resolve();
    const next = structuredClone(c.getSnapshot().cost!.settings);
    next.floor.wasteBps = 2000;
    c.updateCost(next);
    c.dispatch([{ type: 'finish', id: 'desk', finish: 'sage' }], 'Sage');
    finish(new Blob(['selected version']));
    await job.completion;
    expect(downloads).toHaveLength(1);
    expect(c.getSnapshot().workspace!.current.furniture[0]!.finish).toBe(
      'sage',
    );
    expect(JSON.stringify(c.getSnapshot().estimateVersions[0])).toBe(before);
  });
  it.each([
    'reset',
    'import',
    'expiry',
    'dispose',
    'cancel',
    'destination',
  ] as const)('fences selected-version export after %s', async (event) => {
    let now = 1000;
    const c = new SessionController(commandRoom([piece('desk')]), {
      now: () => now,
    });
    controllers.push(c);
    c.setDestination('cost');
    c.saveEstimate('Approved');
    const id = c.getSnapshot().estimateVersions[0]!.id,
      downloads: Blob[] = [];
    let finish!: (blob: Blob) => void;
    const pending = new Promise<Blob>((resolve) => {
      finish = resolve;
    });
    const job = startDesignExport(
      c,
      async () => pending,
      (blob) => downloads.push(blob),
      () => {},
      undefined,
      { estimateId: id },
    );
    await Promise.resolve();
    const rejection = expect(job.completion).rejects.toMatchObject({
      code: event === 'cancel' ? 'cancelled' : 'changed',
    });
    if (event === 'reset') c.reset(commandRoom());
    if (event === 'import') c.importProject(projectOf(c.getSnapshot()));
    if (event === 'expiry') {
      now = c.getSnapshot().expiresAt;
      c.checkExpiry();
    }
    if (event === 'dispose') c.dispose();
    if (event === 'cancel') job.cancel();
    if (event === 'destination') c.setDestination('design');
    await rejection;
    finish(new Blob(['late']));
    await pending;
    expect(downloads).toHaveLength(0);
  });
  it('exports an immutable accepted snapshot without changing room/history/camera', async () => {
    const env = setup(),
      before = env.c.getSnapshot();
    await Promise.resolve();
    env.c.setPanel('assistant');
    env.c.setView({ zoom: 2 });
    env.c.select('desk');
    env.resolve(new Blob(['model']));
    await env.job.completion;
    expect(env.downloads).toHaveLength(1);
    expect(env.c.getSnapshot().workspace).toBe(before.workspace);
    expect(env.c.getSnapshot().undoLabel).toBeNull();
    expect(env.progress).toEqual(['Creating room views…']);
  });
  it('admits one job and only rearms after a cancelled factory settles', async () => {
    const env = setup();
    await Promise.resolve();
    expect(() =>
      startDesignExport(
        env.c,
        async () => new Blob(),
        () => {},
        () => {},
      ),
    ).toThrow('busy');
    env.job.cancel();
    await expect(env.job.completion).rejects.toMatchObject({
      code: 'cancelled',
    });
    expect(() =>
      startDesignExport(
        env.c,
        async () => new Blob(),
        () => {},
        () => {},
      ),
    ).toThrow('busy');
    env.resolve(new Blob(['late']));
    await env.work;
    await new Promise<void>((done) => setTimeout(done, 0));
    const next = startDesignExport(
      env.c,
      async () => new Blob(['next']),
      () => {},
      () => {},
    );
    await next.completion;
    expect(env.downloads).toHaveLength(0);
  });
  it('rejects late output after an accepted move while preserving the real edit', async () => {
    const env = setup();
    await Promise.resolve();
    expect(env.c.dispatch([move('desk', 2500, 2000)], 'Move desk').ok).toBe(
      true,
    );
    env.resolve(new Blob(['stale']));
    await expect(env.job.completion).rejects.toMatchObject({ code: 'changed' });
    expect(env.downloads).toHaveLength(0);
    expect(
      env.c.getSnapshot().workspace!.current.furniture[0]!.pose.centerX,
    ).toBe(2500);
  });
  it.each(['reset', 'import', 'expiry', 'dispose'] as const)(
    'retires a late result after%s',
    async (kind) => {
      const env = setup();
      await Promise.resolve();
      if (kind === 'reset') env.c.reset(commandRoom());
      if (kind === 'import')
        env.c.importProject(projectOf(env.c.getSnapshot())!);
      if (kind === 'expiry') {
        env.advance(7_200_001);
        env.c.checkExpiry();
      }
      if (kind === 'dispose') env.c.dispose();
      env.resolve(new Blob(['late']));
      await expect(env.job.completion).rejects.toMatchObject({
        code: 'changed',
      });
      expect(env.downloads).toHaveLength(0);
    },
  );
  it('rejects on its fixed deadline without waiting for an unresponsive factory or accepting its later output', async () => {
    vi.useFakeTimers();
    const env = setup();
    await Promise.resolve();
    const rejected = expect(env.job.completion).rejects.toMatchObject({
      code: 'failed',
    });
    await vi.advanceTimersByTimeAsync(30_001);
    await rejected;
    env.resolve(new Blob(['too late']));
    await Promise.resolve();
    expect(env.downloads).toHaveLength(0);
  });
  it('fences cancellation before asynchronous work begins', async () => {
    const env = setup();
    env.job.cancel();
    await expect(env.job.completion).rejects.toMatchObject({
      code: 'cancelled',
    });
    env.resolve(new Blob(['late']));
    expect(env.downloads).toHaveLength(0);
  });
});
