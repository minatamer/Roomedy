import { performance } from 'node:perf_hooks';
import { createRuntime } from '../../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../../apps/backend/src/config/runtime-config.js';
import { createRoomedyFakeProvider } from '../../apps/backend/src/providers/fake.js';
import {
  createRecognitionHandler,
  RECOGNITION_PROMPT_VERSION,
} from '../../apps/backend/src/recognition/recognize.js';
import {
  createAssistantHandler,
  ASSISTANT_PROMPT_VERSION,
} from '../../apps/backend/src/assistant/assistant.js';
import type { ProviderPort } from '../../apps/backend/src/providers/provider.js';
import type {
  OperationInput,
  OperationResult,
} from '@roomedy/contracts/operations';
import { operationResultSchema } from '@roomedy/contracts/operations';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import { resolveAssistantTask, evaluateScopedBatch } from '@roomedy/spatial';
import {
  windowCase,
  emptyCase,
  partialCase,
} from '../../test/fixtures/search-corpus.js';
import { commandRoom, piece } from '../../test/fixtures/command-room.js';
import {
  assistantInput,
  localAssistantCandidate,
} from '../../test/fixtures/assistant.js';
import { caseInput } from './corpus.js';
import type { Corpus } from './corpus.js';
import { scoreRecognition } from './scoring.js';
import { EvaluationBudget } from './live-budget.js';
import type { LivePolicy } from './options.js';

/** Fixed, authored requests; no generated test prompts or provider-wording grading. */
export function assistantCases() {
  const locked = commandRoom([
    piece('wardrobe', 2000, 2000, { catalogueId: 'wardrobe-hinged' }),
  ]);
  locked.furniture[0]!.locks.position = true;
  const removable = commandRoom([piece('desk')]);
  removable.furniture[0]!.preference = 'replace';
  return [
    {
      id: 'assistant-a',
      input: assistantInput(
        windowCase().room,
        'Move my desk by the window, keep my bed and wardrobe, and make sure I can pull my chair out',
      ),
      expected: 'proposal',
    },
    {
      id: 'assistant-b',
      input: assistantInput(
        emptyCase().room,
        'I need a bed, desk, chair and wardrobe',
      ),
      expected: 'proposal',
    },
    {
      id: 'assistant-c',
      input: assistantInput(
        partialCase().room,
        'Keep this bed. Add a desk and storage in a warm style.',
      ),
      expected: 'proposal',
    },
    {
      id: 'assistant-d',
      input: assistantInput(
        windowCase().room,
        'Keep the layout but make it feel warmer',
      ),
      expected: 'proposal',
    },
    {
      id: 'assistant-e',
      input: assistantInput(locked, 'Put the wardrobe on the left'),
      expected: 'visitor-action',
    },
    {
      id: 'assistant-explain',
      input: assistantInput(
        windowCase().room,
        'Explain the desk checks',
        'desk',
      ),
      expected: 'explanation',
    },
    {
      id: 'assistant-ambiguous',
      input: assistantInput(
        commandRoom([piece('a'), piece('b', 4000, 2000)]),
        'Move that desk by the window',
      ),
      expected: 'clarification',
    },
    {
      id: 'assistant-owned',
      input: assistantInput(windowCase().room, 'Rearrange what I own'),
      expected: 'proposal',
    },
    {
      id: 'assistant-remove',
      input: assistantInput(removable, 'Remove this desk', 'desk'),
      expected: 'proposal',
    },
    {
      id: 'assistant-replace',
      input: assistantInput(
        removable,
        'Replace this desk with a smaller desk',
        'desk',
      ),
      expected: 'proposal',
    },
    {
      id: 'assistant-undo',
      input: assistantInput(windowCase().room, 'Undo'),
      expected: 'visitor-action',
    },
    {
      id: 'assistant-budget',
      input: assistantInput(windowCase().room, 'Find a desk under $500'),
      expected: 'unsupported',
    },
  ];
}
export async function runEvaluation(
  corpus: Corpus,
  selected: readonly string[],
  live?: { provider: ProviderPort; policy: LivePolicy },
  observationAdapter?: ProviderPort,
) {
  if (
    observationAdapter &&
    (live ||
      observationAdapter.kind !== 'fake' ||
      observationAdapter.meteredDispatches !== 0)
  )
    throw new Error('evaluation-adapter');
  const provider =
    live?.provider ?? observationAdapter ?? createRoomedyFakeProvider();
  let next = 0;
  const nextId = () => `evaluation_${++next}`;
  const handlers = {
    'recognize-room': createRecognitionHandler(() => undefined, nextId),
    assistant: createAssistantHandler(() => undefined, nextId),
  };
  let adapterCalls = 0;
  const budget = live ? new EvaluationBudget(provider, live.policy) : null;
  const controller = new AbortController();
  const results: Record<string, unknown>[] = [],
    safetyFailures: string[] = [];
  const invoke = async (input: OperationInput): Promise<OperationResult> => {
    if (input.kind === 'sourcing') throw new Error('evaluation-operation');
    if (budget) return handlers[input.kind](input, budget);
    // Each corpus trial is an independent synthetic guest, retaining normal admission limits.
    const runtime = createRuntime(
      parseRuntimeConfig({
        ROOMEDY_BRIDGE_SECRET: 'evaluation-only-synthetic-bridge',
      }),
      { now: Date.now, nextId, log: () => undefined, provider, handlers },
    );
    try {
      const grant = await runtime.operations.grant(
        input,
        null,
        controller.signal,
      );
      if (!('grant' in grant)) throw new Error('evaluation-admission');
      return operationResultSchema.parse(
        await runtime.operations.run(input, grant.grant, controller.signal),
      );
    } finally {
      adapterCalls += runtime.operations.calls();
      await new Promise<void>((resolve) => setImmediate(resolve));
      runtime.operations.close();
    }
  };
  const started = performance.now();
  try {
    for (const id of selected) {
      if (budget?.signal.aborted) {
        results.push({ id, outcome: 'not-run-deadline' });
        continue;
      }
      const c = corpus.cases.find((c) => c.id === id),
        a = assistantCases().find((c) => c.id === id);
      const start = performance.now();
      if (c) {
        const input = await caseInput(corpus, c),
          result = await invoke(input);
        const draft = parseDraftHypothesis(result.draft, c.images);
        results.push({
          id,
          split: c.split,
          group: c.group,
          outcome: result.kind,
          latencyMs: Math.round(performance.now() - start),
          score: draft ? scoreRecognition(corpus, c, draft) : null,
        });
        if (result.kind === 'completed' && !draft)
          safetyFailures.push(`${id}:invalid-draft`);
      } else if (a) {
        a.input.identity.operationId = a.id;
        a.input.localCandidate = localAssistantCandidate(a.input);
        const before = JSON.stringify(a.input.room),
          result = await invoke(a.input);
        const reply = result.assistant;
        const task = resolveAssistantTask(
          a.input.room,
          a.input.text,
          a.input.selectedId,
          a.input.identity.operationId,
        );
        const scoped =
          reply?.kind !== 'proposal' ||
          evaluateScopedBatch(a.input.room, reply.actions!, task.scope).ok;
        if (JSON.stringify(a.input.room) !== before)
          safetyFailures.push(`${id}:unauthorized-mutation`);
        if (!scoped) safetyFailures.push(`${id}:scope`);
        results.push({
          id,
          outcome: result.kind,
          reply: reply?.kind ?? null,
          expected: a.expected,
          expectationMet: reply?.kind === a.expected,
          actions: reply?.actions?.length ?? 0,
          scopeValid: scoped,
          latencyMs: Math.round(performance.now() - start),
        });
      } else throw new Error('evaluation-case-scope');
    }
    return {
      version: 1,
      mode: live ? 'live' : 'offline',
      date: new Date().toISOString(),
      recognitionPrompt: RECOGNITION_PROMPT_VERSION,
      assistantPrompt: ASSISTANT_PROMPT_VERSION,
      providerSchema: 'strict-serial-stateless-1',
      automaticSafetyChecks: [
        'strict-draft-schema',
        'assistant-input-unchanged',
        'proposal-action-scope',
      ],
      clientLifecycleEvidence: 'separate-integrated-test-receipt',
      model: live?.policy.model ?? null,
      qualityEvidence: live
        ? 'bounded-synthetic-interpretation-only'
        : 'not-measured-fake-does-not-read-pixels',
      cases: results.length,
      physicalRoomGroups: new Set(
        corpus.cases.filter((c) => selected.includes(c.id)).map((c) => c.group),
      ).size,
      results,
      safetyFailures,
      elapsedMs: Math.round(performance.now() - started),
      providerAdapterCalls: budget?.dispatches ?? adapterCalls,
      meteredDispatches: provider.meteredDispatches,
      reservedTokens: budget?.reservedTokens ?? 0,
      usage: budget?.usage ?? [],
      missingUsage: budget?.missingUsage ?? 0,
      livePolicy: live
        ? {
            approval: live.policy.approval,
            funding: live.policy.funding,
            fundedAllowanceUsd: live.policy.fundedAllowanceUsd,
            privacy: live.policy.privacy,
            dataRights: live.policy.dataRights,
            compatibility: live.policy.compatibility,
          }
        : null,
    };
  } finally {
    budget?.close();
  }
}
