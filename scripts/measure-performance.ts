import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, platform, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { isolateOffline } from './isolated-mode.js';

// This CLI never loads environment files or a listener/provider. Isolation precedes app imports.
isolateOffline();
if (process.argv.length !== 2) throw new Error('performance-no-options');
const { POLICY } = await import('@roomedy/contracts/policy');
const { LayoutSearch, checkRoom, jsonBytes } = await import('@roomedy/spatial');
const { windowCase, maximumCase, request, scopeFor } =
  await import('../test/fixtures/search-corpus.js');
const { SessionController } =
  await import('../apps/frontend/src/features/session/controller.js');
const { exportProject, readProject, recoveryOf } =
  await import('../apps/frontend/src/features/session/project.js');
const { runBackendLayoutSearch } =
  await import('../apps/backend/src/assistant/layout-search.js');

const samples: Record<string, unknown>[] = [];
const runtimeBudgetFailures: string[] = [];
const exploratoryThroughputMisses: string[] = [];
const round = (n: number) => Math.round(n * 1000) / 1000;
function summary(values: number[], budgetMs: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: values.length,
    samplesMs: values.map(round),
    p50Ms: round(sorted[Math.floor(sorted.length * 0.5)]!),
    p95Ms: round(
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]!,
    ),
    maxMs: round(sorted.at(-1)!),
    budgetMs,
    passed: Math.max(...values) <= budgetMs,
  };
}
function measure(action: () => void, n: number) {
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const started = performance.now();
    action();
    values.push(performance.now() - started);
  }
  return values;
}
function must(ok: boolean) {
  if (!ok) throw new Error('performance-fixture-or-authority');
}

for (const [name, fixture] of [
  ['representative', windowCase()],
  ['maximum', maximumCase()],
] as const) {
  const room = fixture.room,
    current = new SessionController(room),
    budget = name === 'maximum' ? 100 : 50,
    counts = {
      furniture: room.furniture.length,
      features: room.room.features.length,
    };
  try {
    const check = measure(() => {
      checkRoom(room);
    }, 31);
    let moved = false;
    const target = name === 'maximum' ? 'item_0' : 'unrelated_shelf',
      piece = room.furniture.find((item) => item.id === target)!;
    const move = measure(() => {
      moved = !moved;
      must(
        current.dispatch(
          [
            {
              type: 'move',
              id: target,
              pose: {
                centerZ: piece.pose.centerZ,
                quarterTurns: piece.pose.quarterTurns,
                centerX: piece.pose.centerX + (moved ? 0.5 : 0),
              },
            },
          ],
          'Measured numeric move',
        ).ok,
      );
    }, 31);
    const before = current.getSnapshot().workspace!.current;
    const prepares: number[] = [],
      applies: number[] = [],
      undoes: number[] = [];
    for (let i = 0; i < 11; i++) {
      let start = performance.now();
      must(
        current.prepareVisitorPreview(
          [
            {
              type: 'room-finish',
              floorFinish: 'walnut',
              wallFinish: 'sage',
            },
          ],
          'Measured palette',
        ).ok,
      );
      prepares.push(performance.now() - start);
      start = performance.now();
      must(current.applyVisitorPreview().ok);
      applies.push(performance.now() - start);
      start = performance.now();
      must(current.undo().ok);
      undoes.push(performance.now() - start);
    }
    must(
      current.getSnapshot().workspace!.current.room.floorFinish ===
        before.room.floorFinish,
    );
    const serialized = exportProject(current.getSnapshot());
    must(!!serialized);
    const project = measure(() => {
      must(readProject(serialized!).ok);
    }, 31);
    const state = current.getSnapshot(),
      history = state.workspace!.history;
    const recovery = recoveryOf(state)!;
    must(
      history.entries.length <= POLICY.undoEntries &&
        history.bytes <= POLICY.undoBytes &&
        Buffer.byteLength(serialized!) <= POLICY.projectBytes,
    );
    const timings = {
      check: summary(check, budget),
      numericCommand: summary(move, budget),
      prepare: summary(prepares, budget),
      apply: summary(applies, budget),
      undo: summary(undoes, budget),
      projectRead: summary(project, budget),
    };
    for (const [kind, measured] of Object.entries(timings))
      if (!measured.passed) runtimeBudgetFailures.push(`${name}:${kind}`);
    samples.push({
      name,
      counts,
      measurementState:
        'Sequential same-process runs; first recorded sample retained. Constructor/import work already occurred; no isolated cold-start proof.',
      ...timings,
      storage: {
        projectBytes: Buffer.byteLength(serialized!),
        recoveryBytes: jsonBytes(recovery),
        historyEntries: history.entries.length,
        historyBytes: history.bytes,
        historyBudgetBytes: POLICY.undoBytes,
        historyBudgetEntries: POLICY.undoEntries,
      },
    });
    if (name === 'maximum') {
      await mkdir('.release', { recursive: true });
      await writeFile('.release/performance-maximum.roomedy.json', serialized!);
    }

    const input = request(room, fixture.selected, POLICY.searchCandidates),
      scope = scopeFor(room, fixture.selected),
      searches = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now(),
        result = await runBackendLayoutSearch(
          input,
          scope,
          new AbortController().signal,
        );
      searches.push({
        elapsedMs: round(performance.now() - start),
        visitedNodes: result.visitedNodes,
        evaluated: result.evaluated,
        termination: result.termination,
        candidate: result.candidate !== null,
      });
    }
    const fixedInput = request(room, fixture.selected, 200),
      prefixes: string[] = [];
    const fixed = measure(() => {
      const engine = new LayoutSearch(fixedInput, scope);
      while (!engine.step()) {
        /* finite fixed work, independently of wall clock */
      }
      prefixes.push(
        createHash('sha256')
          .update(JSON.stringify(engine.finish()))
          .digest('hex'),
      );
    }, 3);
    must(new Set(prefixes).size === 1);
    if (searches.some((r) => r.elapsedMs > POLICY.searchMs + 100))
      runtimeBudgetFailures.push(`${name}:deadline-search`);
    if (Math.max(...fixed) > POLICY.searchMs)
      exploratoryThroughputMisses.push(`${name}:fixed-200-nodes`);
    samples.push({
      name: name + '-search',
      counts,
      seed: input.seed,
      deadlineRuns: searches,
      deadlineBudgetMs: POLICY.searchMs + 100,
      deadlinePassed: searches.every(
        (r) => r.elapsedMs <= POLICY.searchMs + 100,
      ),
      fixed200Nodes: summary(fixed, POLICY.searchMs),
      fixedWorkDisposition:
        'Exploratory throughput target, deliberately bypassing the runtime deadline. Retain misses explicitly; interactive paths must use the deadline adapter and report the visited prefix.',
      reproduciblePrefix: true,
    });
  } finally {
    current.dispose();
  }
}

const concurrent = [];
for (let repetition = 0; repetition < 3; repetition++) {
  const fixture = maximumCase(),
    input = request(fixture.room, fixture.selected, POLICY.searchCandidates),
    scope = scopeFor(fixture.room, fixture.selected),
    abort = new AbortController();
  const started = performance.now();
  let firedAt = 0,
    largestTickMs = 0,
    previous = started;
  const heartbeat = setInterval(() => {
    const now = performance.now();
    largestTickMs = Math.max(largestTickMs, now - previous);
    previous = now;
  }, 10);
  const timer = setTimeout(() => {
    firedAt = performance.now();
    abort.abort();
  }, 30);
  try {
    const results = await Promise.all(
      [0, 1].map(() => runBackendLayoutSearch(input, scope, abort.signal)),
    );
    must(
      firedAt > 0 &&
        results.every(
          (r) => r.termination === 'cancelled' && r.candidate === null,
        ),
    );
    concurrent.push({
      operations: 2,
      abortTimerRequestedMs: 30,
      abortTimerFiredMs: round(firedAt - started),
      abortSettlementMs: round(performance.now() - firedAt),
      largestHeartbeatGapMs: round(largestTickMs),
      visitedPrefixes: results.map((r) => r.visitedNodes),
    });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timer);
  }
}

const resetRoom = windowCase().room,
  lifecycle = new SessionController(resetRoom);
let cleaned = 0;
const reset = measure(() => {
  const token = lifecycle.beginOperation()!;
  must(
    !!lifecycle.ownResource(() => {
      cleaned++;
    }, token),
  );
  must(lifecycle.reset(resetRoom));
}, 100);
must(cleaned === 100 && lifecycle.getSnapshot().candidate === null);
lifecycle.dispose();
if (Math.max(...reset) > 50) runtimeBudgetFailures.push('reset');
if (
  concurrent.some(
    (r) =>
      r.abortTimerFiredMs > 80 ||
      r.abortSettlementMs > 50 ||
      r.largestHeartbeatGapMs > 50,
  )
)
  runtimeBudgetFailures.push('concurrent-search-cancellation');

const files = [
  ...new Set([
    ...execFileSync(
      'git',
      [
        'ls-files',
        '--',
        'apps',
        'packages',
        'scripts',
        'test',
        'package.json',
        'pnpm-lock.yaml',
        'tsconfig.base.json',
      ],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n')
      .filter((p) => p && !p.endsWith('.md')),
    'scripts/measure-performance.ts',
  ]),
].sort();
must(files.length <= 2000);
const hash = createHash('sha256');
for (const file of files)
  hash.update(
    file +
      '\0' +
      createHash('sha256')
        .update(await readFile(file))
        .digest('hex') +
      '\n',
  );
const report = {
  recordedAt: new Date().toISOString(),
  mode: 'isolated-fake-paid-off-no-external-transports',
  runtime: {
    node: process.version,
    os: platform(),
    release: release(),
    cpu: cpus()[0]?.model,
    parallelism: cpus().length,
    build:
      'tsx loads actual TS owners; shared packages use built public exports; no browser/GPU measurement',
  },
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  inputFiles: files.length,
  inputSha256: hash.digest('hex'),
  samples,
  concurrent,
  runtimeBudgetFailures,
  exploratoryThroughputMisses,
  reset100: summary(reset, 50),
  resourceCleanups: cleaned,
  processMemory: {
    ...process.memoryUsage(),
    maxRssKiB: process.resourceUsage().maxRSS,
    meaning:
      'Entire Node benchmark process high-water RSS; not browser decode, renderer, GPU, hosted or application-only peak.',
  },
  unperformed: [
    'browser-native decode peak',
    'production continuous frames',
    'physical touch/GPU/assistive',
    'hosted/provider/account capacity',
  ],
};
await writeFile(
  'docs/design/performance-results.json',
  JSON.stringify(report, null, 2) + '\n',
);
process.stdout.write(
  JSON.stringify({
    inputSha256: report.inputSha256,
    cases: samples.length,
    concurrent,
    reset100: {
      n: report.reset100.n,
      p95Ms: report.reset100.p95Ms,
      maxMs: report.reset100.maxMs,
    },
    runtimeBudgetFailures,
    exploratoryThroughputMisses,
    maxRssKiB: report.processMemory.maxRssKiB,
  }) + '\n',
);
if (runtimeBudgetFailures.length) process.exitCode = 1;
