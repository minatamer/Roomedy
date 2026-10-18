import { readFile } from 'node:fs/promises';
import {
  parseOptions,
  parseLivePolicy,
  selectCases,
  livePrerequisites,
} from './evaluation/options.ts';

// No dotenv, startup listener or provider construction before complete opt-in validation.
try {
  const options = parseOptions(process.argv.slice(2));
  if (options.mode === 'offline') {
    const { isolateOffline } = await import('./isolated-mode.ts');
    isolateOffline();
  }
  const { loadCorpus } = await import('./evaluation/corpus.ts');
  const { corpus, hash } = await loadCorpus();
  const { assistantCases, runEvaluation } =
    await import('./evaluation/runner.ts');
  const available = [
    ...corpus.cases.map((c) => c.id),
    ...assistantCases().map((c) => c.id),
  ];
  let policy;
  if (options.mode === 'live') {
    if (!options.policy) throw new Error('evaluation-policy-required');
    const bytes = await readFile(options.policy);
    if (bytes.length > 16 * 1024) throw new Error('evaluation-policy');
    policy = parseLivePolicy(JSON.parse(bytes.toString('utf8')));
  }
  const selected = selectCases(options, available, policy);
  const missing = policy ? livePrerequisites(options, policy, process.env) : [];
  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: options.mode,
          dryRun: true,
          cases: selected,
          maxCases: options.maxCases,
          corpusHash: hash,
          model: policy?.model ?? null,
          maxDispatches: policy?.maxDispatches ?? 0,
          fundedAllowanceUsd: policy?.fundedAllowanceUsd ?? null,
          maxReservedTokens: policy?.maxReservedTokens ?? 0,
          maxMs: policy?.maxMs ?? 0,
          missing,
          meteredDispatches: 0,
        },
        null,
        2,
      ),
    );
  } else {
    if (missing.length) throw new Error('evaluation-live-prerequisites');
    let live;
    if (policy) {
      const { createResponsesProvider } =
        await import('../apps/backend/src/providers/responses.ts');
      live = {
        policy,
        provider: createResponsesProvider(
          process.env.OPENAI_API_KEY,
          policy.model,
        ),
      };
    }
    const report = await runEvaluation(corpus, selected, live);
    const { hash: sourceHash } = await import('./evaluation/corpus.ts');
    const sourcePaths = [
      'scripts/evaluate-roomedy.mjs',
      'scripts/prepare-evaluation-corpus.mjs',
      'scripts/isolated-mode.ts',
      'scripts/evaluation/corpus.ts',
      'scripts/evaluation/options.ts',
      'scripts/evaluation/scoring.ts',
      'scripts/evaluation/runner.ts',
      'scripts/evaluation/live-budget.ts',
      'apps/backend/src/recognition/recognize.ts',
      'apps/backend/src/providers/responses.ts',
      'apps/backend/src/providers/provider.ts',
      'apps/backend/src/assistant/assistant.ts',
      'packages/contracts/src/intake.ts',
      'packages/contracts/src/assistant.ts',
    ];
    const sourceHashes = [];
    for (const path of sourcePaths)
      sourceHashes.push({
        path,
        sha256: sourceHash(
          (
            await readFile(new URL('../' + path, import.meta.url), 'utf8')
          ).replaceAll('\r\n', '\n'),
        ),
      });
    console.log(
      JSON.stringify(
        {
          ...report,
          sourceHashes,
          corpusHash: hash,
          imageHashes: corpus.images
            .filter((i) =>
              selected.some((id) =>
                corpus.cases.find((c) => c.id === id)?.images.includes(i.id),
              ),
            )
            .map((i) => ({ id: i.id, sha256: i.sha256 })),
        },
        null,
        2,
      ),
    );
    if (report.safetyFailures.length) process.exitCode = 1;
  }
} catch (error) {
  const code =
    error instanceof Error && /^evaluation-[a-z-]+$/.test(error.message)
      ? error.message
      : 'evaluation-failed';
  console.error(JSON.stringify({ error: code, report: 'not-produced' }));
  process.exitCode = 1;
}
