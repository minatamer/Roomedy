import { it, expect, vi } from 'vitest';
import requestHttp from 'supertest';
import { LayoutSearch } from '@roomedy/spatial';
import { POLICY } from '@roomedy/contracts/policy';
import { searchJobSchema } from '@roomedy/contracts/search';
import { BrowserLayoutSearch } from '../apps/frontend/src/features/layout-search/client.js';
import type { SearchWorker } from '../apps/frontend/src/features/layout-search/client.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { runBackendLayoutSearch } from '../apps/backend/src/assistant/layout-search.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import {
  operationInput,
  operationResult,
  identityIds,
} from './fixtures/operation.js';
import {
  windowCase,
  request,
  scopeFor,
  maximumCase,
} from './fixtures/search-corpus.js';
class WorkerFixture implements SearchWorker {
  onmessage: SearchWorker['onmessage'] = null;
  onerror: SearchWorker['onerror'] = null;
  posted: unknown;
  terminated = 0;
  postMessage(value: unknown) {
    this.posted = value;
  }
  terminate() {
    this.terminated++;
  }
  result() {
    const job = searchJobSchema.parse(this.posted),
      search = new LayoutSearch(job.request, job.scope);
    while (!search.step()) {}
    return search.finish();
  }
}
it('keeps one worker and rejects late results after manual edit/new goal/reset/expiry', async () => {
  for (const change of ['edit', 'new-goal', 'reset', 'expiry'] as const) {
    const fixture = windowCase();
    let now = 0;
    const session = new SessionController(fixture.room, { now: () => now }),
      workers: WorkerFixture[] = [];
    const search = new BrowserLayoutSearch(session, () => {
      const worker = new WorkerFixture();
      workers.push(worker);
      return worker;
    });
    const token = session.beginOperation()!,
      before = JSON.stringify(session.getSnapshot().workspace?.current),
      pending = search.run(
        token,
        fixture.selected,
        scopeFor(fixture.room, fixture.selected),
        42,
        120,
      );
    const worker = workers[0]!,
      late = worker.onmessage!,
      result = worker.result();
    if (change === 'edit')
      expect(
        session.dispatch(
          [
            {
              type: 'move',
              id: 'desk',
              pose: { centerX: 3100, centerZ: 3000, quarterTurns: 0 },
            },
          ],
          'Nudge desk',
        ).ok,
      ).toBe(true);
    else if (change === 'new-goal') session.beginOperation();
    else if (change === 'reset') session.reset(fixture.room);
    else {
      now = POLICY.guestLifetimeMs;
      session.isCurrent(token);
    }
    expect((await pending).termination).toBe('cancelled');
    expect(worker.terminated).toBe(1);
    late({ data: result } as MessageEvent<unknown>);
    expect(session.getSnapshot().candidate).toBeNull();
    if (change === 'new-goal' || change === 'reset')
      expect(JSON.stringify(session.getSnapshot().workspace?.current)).toBe(
        before,
      );
    search.dispose();
    session.dispose();
    expect(worker.terminated).toBe(1);
  }
});
it('revalidates a successful worker reply without mutating accepted state, and retires superseded jobs once', async () => {
  const fixture = windowCase(),
    session = new SessionController(fixture.room),
    workers: WorkerFixture[] = [];
  const client = new BrowserLayoutSearch(session, () => {
      const worker = new WorkerFixture();
      workers.push(worker);
      return worker;
    }),
    token = session.beginOperation()!;
  const capturedScope = scopeFor(fixture.room, fixture.selected);
  const a = client.run(
      token,
      fixture.selected,
      scopeFor(fixture.room, fixture.selected),
      42,
      120,
    ),
    b = client.run(token, fixture.selected, capturedScope, 42, 120);
  expect((await a).termination).toBe('cancelled');
  capturedScope.targetIds = [];
  const worker = workers[1]!,
    result = worker.result();
  worker.onmessage!({ data: result } as MessageEvent<unknown>);
  const actual = await b;
  expect(actual.identity).toEqual(token);
  expect(actual.candidate).not.toBeNull();
  expect(worker.terminated).toBe(1);
  expect(session.getSnapshot().workspace?.current).toEqual(fixture.room);
  expect(session.getSnapshot().candidate).toBeNull();
  expect(session.isCurrent(token)).toBe(true);
  client.dispose();
  session.dispose();
});
it('bounds startup silence and malformed worker messages without accepting stale flags', async () => {
  vi.useFakeTimers();
  const fixture = windowCase(),
    session = new SessionController(fixture.room),
    workers: WorkerFixture[] = [];
  const client = new BrowserLayoutSearch(session, () => {
    const worker = new WorkerFixture();
    workers.push(worker);
    return worker;
  });
  try {
    const token = session.beginOperation()!,
      pending = client.run(
        token,
        fixture.selected,
        scopeFor(fixture.room, fixture.selected),
      );
    await vi.advanceTimersByTimeAsync(POLICY.searchMs + 2000);
    expect((await pending).termination).toBe('deadline');
    expect(workers[0]!.terminated).toBe(1);
    const second = client.run(
      token,
      fixture.selected,
      scopeFor(fixture.room, fixture.selected),
    );
    workers[1]!.onmessage!({ data: { pass: true } } as MessageEvent<unknown>);
    expect((await second).termination).toBe('invalid-input');
  } finally {
    client.dispose();
    session.dispose();
    vi.useRealTimers();
  }
});
it('uses an independent backend deadline and records its reproducible visited prefix', async () => {
  const fixture = windowCase(),
    input = request(fixture.room, fixture.selected, 20000);
  let tick = 0;
  const capturedScope = scopeFor(fixture.room, fixture.selected);
  const pending = runBackendLayoutSearch(
    input,
    capturedScope,
    new AbortController().signal,
    () => {
      tick += 50;
      return tick;
    },
  );
  capturedScope.targetIds = [];
  const result = await pending;
  expect(result.termination).toBe('deadline');
  expect(result.visitedNodes).toBeLessThanOrEqual(4 * POLICY.searchSliceNodes);
  const replay = new LayoutSearch(
    { ...input, maxNodes: Math.max(1, result.visitedNodes) },
    scopeFor(fixture.room, fixture.selected),
  );
  while (!replay.step()) {}
  expect(result.candidate).toEqual(replay.finish().candidate);
});
it('yields maximum bounded backend work so a real loopback health request and cancellation can complete', async () => {
  const fixture = maximumCase(),
    input = request(fixture.room, fixture.selected, 20000),
    scope = scopeFor(fixture.room, fixture.selected),
    abort = new AbortController();
  let start: () => void = () => undefined;
  const started = new Promise<void>((resolve) => {
    start = resolve;
  });
  const runtime = createRuntime(
    parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic' }),
    {
      now: Date.now,
      nextId: identityIds(),
      log: vi.fn(),
      handlers: {
        assistant: async (current) => {
          start();
          await runBackendLayoutSearch(input, scope, abort.signal, () => 0);
          return operationResult(current);
        },
      },
    },
  );
  const app = createApp(runtime),
    body = operationInput();
  body.room = fixture.room;
  body.identity.roomId = fixture.room.roomId;
  body.identity.inputRevision = fixture.room.roomRevision;
  const admission = await requestHttp(app)
    .post('/v1/admission')
    .set('Authorization', 'Bearer synthetic')
    .set('Origin', 'http://127.0.0.1:4320')
    .send({ input: body, proof: null });
  expect(admission.status).toBe(200);
  const pending = requestHttp(app)
    .post('/v1/assistant')
    .set('Authorization', 'Bearer synthetic')
    .set('Origin', 'http://127.0.0.1:4320')
    .send({ input: body, grant: admission.body.grant })
    .then((value) => value);
  try {
    await started;
    expect((await requestHttp(app).get('/v1/health')).status).toBe(200);
    abort.abort();
    expect((await pending).status).toBe(200);
    expect(runtime.meteredDispatches()).toBe(0);
  } finally {
    abort.abort();
    runtime.operations.close();
  }
});
