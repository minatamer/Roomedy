import { it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  loadCorpus,
  parseCorpus,
  caseInput,
} from '../scripts/evaluation/corpus.js';
import {
  parseOptions,
  parseLivePolicy,
  selectCases,
  livePrerequisites,
} from '../scripts/evaluation/options.js';
import type { LivePolicy } from '../scripts/evaluation/options.js';
import { EvaluationBudget } from '../scripts/evaluation/live-budget.js';
import { scoreRecognition } from '../scripts/evaluation/scoring.js';
import { runEvaluation, assistantCases } from '../scripts/evaluation/runner.js';
import { recognitionFixture } from '../apps/backend/src/recognition/fixtures.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import type {
  ProviderRequest,
  ProviderPort,
} from '../apps/backend/src/providers/provider.js';
import { POLICY } from '@roomedy/contracts/policy';
const policy: LivePolicy = {
  model: 'synthetic-test-only',
  cases: ['empty-a'],
  maxCases: 1,
  maxDispatches: 2,
  maxReservedTokens: 100_000,
  maxMs: 2000,
  imageTokenUpperBound: 10_000,
  approval: 'synthetic',
  funding: 'synthetic',
  fundedAllowanceUsd: 1,
  privacy: 'synthetic',
  dataRights: 'synthetic',
  compatibility: 'synthetic',
};
const request: ProviderRequest = {
  instructions: 'Synthetic',
  input: [
    {
      role: 'user',
      content: [
        { type: 'input_image', image_url: 'data:image/jpeg;base64,AA==' },
      ],
    },
  ],
  format: {
    name: 'synthetic',
    schema: {
      type: 'object',
      properties: { answer: { type: 'string' } },
      required: ['answer'],
      additionalProperties: false,
    },
  },
  tools: [],
};
it('predeclares independent room groups, rejects view leakage and normalizes actual EXIF pixels', async () => {
  const { corpus } = await loadCorpus();
  expect(corpus.images).toHaveLength(11);
  expect(corpus.cases).toHaveLength(11);
  expect(
    new Set(
      corpus.cases.filter((c) => c.split === 'held-out').map((c) => c.group),
    ).size,
  ).toBe(4);
  const leaked = structuredClone(corpus);
  leaked.cases.find((c) => c.id === 'reordered-b')!.split = 'held-out';
  expect(() => parseCorpus(leaked)).toThrow('evaluation-leakage');
  for (const id of ['repeated-b', 'rotated-b', 'furnished-c']) {
    const input = await caseInput(
      corpus,
      corpus.cases.find((c) => c.id === id)!,
    );
    expect(
      input.manifest.every((i) => i.width === 800 && i.height === 600),
    ).toBe(true);
  }
  expect(() =>
    parseCorpus({
      ...corpus,
      images: [{ ...corpus.images[0], file: '../../secret' }],
    }),
  ).toThrow();
});
it('grades independent visibility/grouping/provenance, without turning missed detections into false merges', async () => {
  const { corpus } = await loadCorpus(),
    repeated = corpus.cases.find((c) => c.id === 'repeated-b')!,
    distinct = corpus.cases.find((c) => c.id === 'distinct-d')!;
  const draft = recognitionFixture('repeated-desk', repeated.images);
  expect(scoreRecognition(corpus, repeated, draft)).toMatchObject({
    missing: 4,
    falseMerges: 0,
    falseSplits: 0,
    humanRepairActions: null,
  });
  draft.groups = draft.observations.map((o) => [o.ref]);
  expect(scoreRecognition(corpus, repeated, draft).falseSplits).toBe(1);
  const missed = scoreRecognition(
    corpus,
    distinct,
    recognitionFixture('repeated-desk', distinct.images),
  );
  expect(missed).toMatchObject({ missing: 3, falseMerges: 0 });
  expect(missed.groupingUnscored).toBeGreaterThan(0);
  const merged = recognitionFixture('two-identical', distinct.images);
  merged.groups = [merged.observations.map((o) => o.ref)];
  expect(scoreRecognition(corpus, distinct, merged).falseMerges).toBe(1);
  merged.room.width = {
    status: 'estimated',
    value: 5000,
    sourceId: distinct.images[0]!,
  };
  expect(
    scoreRecognition(corpus, distinct, merged).unsupportedMetricClaims,
  ).toBe(1);
});
it('fails live scope/opt-in before provider construction; offline does not inherit live authorization', async () => {
  expect(parseOptions([])).toMatchObject({
    mode: 'offline',
    executeLive: false,
  });
  for (const args of [
    ['--mode', 'live', '--mode', 'offline'],
    ['--execute-live'],
    ['--max-cases', '0'],
    ['--cases', 'a,a'],
  ])
    expect(() => parseOptions(args)).toThrow();
  const options = parseOptions([
    '--mode',
    'live',
    '--cases',
    'empty-a',
    '--max-cases',
    '1',
    '--policy',
    'synthetic.json',
  ]);
  expect(selectCases(options, ['empty-a'], policy)).toEqual(['empty-a']);
  expect(() =>
    selectCases({ ...options, cases: ['other'] }, ['empty-a'], policy),
  ).toThrow();
  expect(() =>
    selectCases({ ...options, cases: [] }, ['empty-a'], policy),
  ).toThrow();
  expect(livePrerequisites(options, policy, {})).toEqual([
    'execute-live',
    'paid-live-mode',
    'provider-key',
    'model-match',
  ]);
  const enabled = {
    FAKE_MODE: 'false',
    PAID_DEMO_ENABLED: 'true',
    OPENAI_API_KEY: 'synthetic-key',
  };
  expect(
    livePrerequisites(
      { ...options, executeLive: true },
      { ...policy, model: 'gpt-6-luna' },
      enabled,
    ),
  ).toEqual([]);
  expect(
    livePrerequisites({ ...options, executeLive: true }, policy, {
      ...enabled,
      OPENAI_MODEL: policy.model,
    }),
  ).toEqual(['model-match']);
  const example = JSON.parse(
    await readFile(
      new URL('../docs/evaluation/live-policy.example.json', import.meta.url),
      'utf8',
    ),
  );
  expect(() => parseLivePolicy(example)).toThrow();
  for (const k of Object.keys(policy)) {
    const incomplete = { ...policy };
    delete incomplete[k as keyof LivePolicy];
    expect(() => parseLivePolicy(incomplete)).toThrow();
  }
});
it('reserves failed attempts, caps dispatch/token work, counts refusal usage and never retries', async () => {
  let n = 0;
  const port = createFakeProvider(async () => {
    n++;
    return {
      kind: 'refused',
      usage: { inputTokens: 10, outputTokens: 2, totalTokens: 12 },
    };
  });
  const budget = new EvaluationBudget(port, policy);
  try {
    expect((await budget.call(request)).kind).toBe('refused');
    expect(budget.reservedTokens).toBeGreaterThan(
      POLICY.providerOutputTokens + policy.imageTokenUpperBound,
    );
    expect((await budget.call(request)).kind).toBe('refused');
    expect((await budget.call(request)).kind).toBe('unavailable');
    expect(n).toBe(2);
    expect(budget.usage).toHaveLength(2);
  } finally {
    budget.close();
  }
  const none = new EvaluationBudget(port, { ...policy, maxReservedTokens: 1 });
  try {
    expect((await none.call(request)).kind).toBe('unavailable');
    expect(n).toBe(2);
  } finally {
    none.close();
  }
});
it('independently stops abort-ignoring transport and retains the unknown reservation', async () => {
  vi.useFakeTimers();
  const start = vi.fn<ProviderPort['start']>(() => ({
    result: new Promise(() => undefined),
    settled: new Promise(() => undefined),
  }));
  const budget = new EvaluationBudget(
    { kind: 'live', meteredDispatches: 0, start },
    { ...policy, maxMs: 20 },
  );
  try {
    const pending = budget.call(request);
    await vi.advanceTimersByTimeAsync(21);
    expect((await pending).kind).toBe('timeout');
    expect((await budget.call(request)).kind).toBe('timeout');
    expect(start).toHaveBeenCalledTimes(1);
    expect(budget.reservedTokens).toBeGreaterThan(0);
    expect(budget.missingUsage).toBe(1);
  } finally {
    budget.close();
    vi.useRealTimers();
  }
});
it('runs the actual admitted offline corpus and reports fixture interpretation misses separately from scope safety', async () => {
  const { corpus } = await loadCorpus();
  const report = await runEvaluation(corpus, [
    ...corpus.cases.map((c) => c.id),
    ...assistantCases().map((c) => c.id),
  ]);
  expect(report.cases).toBe(23);
  expect(report.physicalRoomGroups).toBe(6);
  expect(report.meteredDispatches).toBe(0);
  expect(report.safetyFailures).toEqual([]);
  expect(report.providerAdapterCalls).toBeGreaterThan(11);
  expect(JSON.stringify(report)).not.toMatch(
    /data:image|base64|synthetic-bridge|encrypted_content/,
  );
  const furnished = report.results.find((r) => r.id === 'furnished-c')!;
  expect(furnished.score).toMatchObject({
    missing: 12,
    humanRepairActions: null,
  });
  expect(report.qualityEvidence).toBe('not-measured-fake-does-not-read-pixels');
}, 15_000);

it('keeps the optional offline observation seam fake and refuses live adapters', async () => {
  const { corpus } = await loadCorpus();
  const adapter = createFakeProvider(async () => ({
    kind: 'completed',
    calls: [],
    data: recognitionFixture('empty', ['empty-a']),
  }));
  const report = await runEvaluation(corpus, ['empty-a'], undefined, adapter);
  expect(report.meteredDispatches).toBe(0);
  expect(report.results[0]!.outcome).toBe('completed');
  await expect(
    runEvaluation(corpus, ['empty-a'], undefined, { ...adapter, kind: 'live' }),
  ).rejects.toThrow('evaluation-adapter');
});
it('stops after reported usage exceeds the reservation without issuing a second request', async () => {
  let n = 0;
  const port = createFakeProvider(async () => {
    n++;
    return {
      kind: 'incomplete',
      usage: { inputTokens: 100_000, outputTokens: 8192, totalTokens: 108_192 },
    };
  });
  const budget = new EvaluationBudget(port, policy);
  try {
    expect((await budget.call(request)).kind).toBe('incomplete');
    expect(budget.signal.aborted).toBe(true);
    expect((await budget.call(request)).kind).toBe('timeout');
    expect(n).toBe(1);
  } finally {
    budget.close();
  }
});

it('keeps a completed evaluation round pending until actual transport settlement before a serial next call', async () => {
  let release!: () => void,
    n = 0;
  const settled = new Promise<void>((r) => {
    release = r;
  });
  const port: ProviderPort = {
    kind: 'fake',
    meteredDispatches: 0,
    start: () => {
      n++;
      return { result: Promise.resolve({ kind: 'refused' }), settled };
    },
  };
  const budget = new EvaluationBudget(port, policy);
  try {
    let returned = false;
    const first = budget.call(request).then((r) => {
      returned = true;
      return r;
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(returned).toBe(false);
    release();
    expect((await first).kind).toBe('refused');
    expect((await budget.call(request)).kind).toBe('refused');
    expect(n).toBe(2);
  } finally {
    release();
    budget.close();
  }
});
