import { POLICY } from '@roomedy/contracts/policy';
import { createHash } from 'node:crypto';
import { operationResultSchema } from '@roomedy/contracts/operations';
import type {
  OperationInput,
  OperationKind,
  OperationResult,
} from '@roomedy/contracts/operations';
import type {
  ProviderPort,
  ProviderRequest,
  ProviderOutcome,
} from '../providers/provider.js';
import { Admission, inputDigest } from '../security/admission.js';
import type { ChallengePort } from '../security/admission.js';
import type { RuntimeConfig } from '../config/runtime-config.js';
import type { Diagnostic } from './create-runtime.js';
import { safeError } from '../http/errors.js';

export interface OperationBudget {
  readonly signal: AbortSignal;
  call(request: ProviderRequest): Promise<ProviderOutcome>;
}
export type OperationHandler = (
  input: OperationInput,
  budget: OperationBudget,
) => Promise<OperationResult>;
export interface OperationDependencies {
  now: () => number;
  nextId: () => string;
  log: (event: Diagnostic) => void;
  provider: ProviderPort | undefined;
  challenge: ChallengePort | undefined;
  handlers: Partial<Record<OperationKind, OperationHandler>>;
}
const copy = {
  cancelled: 'The request was cancelled. Your room has not been changed.',
  timeout: 'This request took too long. You can continue manually.',
  failed:
    'This request could not be completed. Your room has not been changed.',
};
export function createOperations(
  config: RuntimeConfig,
  deps: OperationDependencies,
) {
  const admission = new Admission(deps.now, deps.nextId);
  const jobs = new Set<() => void>();
  const verifications = new Set<AbortController>();
  let closed = false,
    calls = 0;
  const available = (kind: OperationKind) =>
    !closed &&
    !!config.bridgeSecret &&
    !!deps.handlers[kind] &&
    !!deps.provider &&
    (config.mode === 'fake'
      ? deps.provider.kind === 'fake'
      : config.paidEnabled &&
        config.providerConfigured &&
        config.livePolicyReviewed &&
        deps.provider.kind === 'live' &&
        deps.challenge?.kind === 'live');
  async function grant(
    input: OperationInput,
    proof: string | null,
    signal: AbortSignal,
  ) {
    if (signal.aborted) return safeError('cancelled', deps.nextId());
    if (!available(input.kind))
      return safeError('not-available', deps.nextId());
    const digest = inputDigest(input);
    if (!digest) return safeError('invalid-input', deps.nextId());
    if (!admission.beginAdmission()) return safeError('busy', deps.nextId());
    if (deps.challenge) {
      if (verifications.size >= POLICY.intakeSlots)
        return safeError('busy', deps.nextId());
      const abort = new AbortController();
      const combined = AbortSignal.any([signal, abort.signal]);
      let timer: ReturnType<typeof setTimeout> | undefined;
      let onAbort = () => undefined as void;
      const deadline = new Promise<'failed'>((resolve) => {
        onAbort = () => resolve('failed');
        combined.addEventListener('abort', onAbort, { once: true });
        if (combined.aborted) onAbort();
        timer = setTimeout(() => abort.abort(), POLICY.intakeMs);
      });
      let state: 'verified' | 'interaction' | 'failed';
      verifications.add(abort);
      const verification = Promise.resolve().then(() =>
        deps.challenge!.verify(proof, digest, combined),
      );
      void verification.then(
        () => {
          verifications.delete(abort);
        },
        () => {
          verifications.delete(abort);
        },
      );
      try {
        state = await Promise.race([verification, deadline]);
      } catch {
        state = 'failed';
      } finally {
        clearTimeout(timer);
        combined.removeEventListener('abort', onAbort);
      }
      if (signal.aborted || closed)
        return safeError('cancelled', deps.nextId());
      if (state !== 'verified')
        return {
          kind: 'verification' as const,
          state,
          simulation: config.mode === 'fake',
        };
    } else if (config.mode !== 'fake')
      return {
        kind: 'verification' as const,
        state: 'unavailable' as const,
        simulation: false,
      };
    if (signal.aborted) return safeError('cancelled', deps.nextId());
    const operationKey = createHash('sha256')
      .update(input.kind)
      .update(JSON.stringify(input.identity))
      .digest('hex');
    const issued = admission.issue(input.kind, digest, operationKey);
    return issued
      ? {
          kind: 'granted' as const,
          ...issued,
          simulation: config.mode === 'fake',
        }
      : safeError('busy', deps.nextId());
  }
  function run(
    input: OperationInput,
    grant: string,
    client: AbortSignal,
  ): Promise<OperationResult | ReturnType<typeof safeError>> {
    if (!available(input.kind))
      return Promise.resolve(safeError('not-available', deps.nextId()));
    const digest = inputDigest(input);
    if (!digest)
      return Promise.resolve(safeError('invalid-input', deps.nextId()));
    if (client.aborted)
      return Promise.resolve(safeError('cancelled', deps.nextId()));
    const release = admission.takeWork();
    if (!release) return Promise.resolve(safeError('busy', deps.nextId()));
    if (!admission.consume(grant, input.kind, digest)) {
      release();
      return Promise.resolve(safeError('invalid-grant', deps.nextId()));
    }
    const controller = new AbortController();
    let handlerSettled = false,
      pending = 0,
      uncertain = false,
      deadlineElapsed = false,
      retired = false,
      resolved = false,
      rounds = 0,
      tools = 0,
      inCall = false;
    let resolve: (result: OperationResult) => void;
    const result = new Promise<OperationResult>((r) => {
      resolve = r;
    });
    const reference = deps.nextId();
    const startedAt = deps.now();
    let outcome: OperationResult['kind'] = 'failed';
    const finish = (value: OperationResult) => {
      if (!resolved) {
        resolved = true;
        outcome = value.kind;
        resolve(value);
      }
    };
    const failure = (kind: keyof typeof copy) => ({
      identity: input.identity,
      simulation: config.mode === 'fake',
      kind,
      message: copy[kind],
      draft: null,
    });
    const retire = () => {
      if (
        retired ||
        !handlerSettled ||
        pending ||
        (uncertain && !deadlineElapsed)
      )
        return;
      retired = true;
      clearTimeout(timer);
      client.removeEventListener('abort', cancel);
      jobs.delete(cancel);
      admission.retire(grant);
      release();
      deps.log({
        code: uncertain ? 'operation-uncertain' : 'operation-finished',
        reference,
        outcome,
        rounds,
        elapsedMs: Math.min(
          Number.MAX_SAFE_INTEGER,
          Math.max(0, Math.round(deps.now() - startedAt)),
        ),
      });
    };
    const cancel = () => {
      uncertain = true;
      controller.abort();
      finish(failure('cancelled'));
      retire();
    };
    const timer = setTimeout(
      () => {
        deadlineElapsed = true;
        uncertain = true;
        controller.abort();
        finish(failure('timeout'));
        retire();
      },
      input.kind === 'assistant' ? POLICY.assistantMs : POLICY.recognitionMs,
    );
    jobs.add(cancel);
    client.addEventListener('abort', cancel, { once: true });
    const budget: OperationBudget = {
      signal: controller.signal,
      async call(request) {
        if (controller.signal.aborted) return { kind: 'cancelled' };
        if (
          inCall ||
          rounds >= POLICY.providerRounds ||
          tools >= POLICY.toolCalls ||
          calls >= Number.MAX_SAFE_INTEGER - 1
        )
          return { kind: 'malformed' };
        inCall = true;
        rounds++;
        calls++;
        let call;
        try {
          call = deps.provider!.start(request, controller.signal);
        } catch {
          inCall = false;
          return { kind: 'malformed' };
        }
        pending++;
        void call.settled.then(
          () => {
            pending--;
            retire();
          },
          () => {
            pending--;
            retire();
          },
        );
        let callTimer: ReturnType<typeof setTimeout> | undefined;
        let onAbort: () => void = () => undefined;
        const stopped = new Promise<ProviderOutcome>((r) => {
          onAbort = () => r({ kind: 'cancelled' });
          controller.signal.addEventListener('abort', onAbort, { once: true });
          callTimer = setTimeout(() => {
            uncertain = true;
            r({ kind: 'timeout' });
            controller.abort();
          }, POLICY.providerCallMs);
        });
        let outcome: ProviderOutcome;
        try {
          outcome = await Promise.race([
            call.result.then(async (value) => {
              await call.settled;
              return value;
            }),
            stopped,
          ]);
        } catch {
          outcome = { kind: 'unavailable' };
        } finally {
          inCall = false;
          clearTimeout(callTimer);
          controller.signal.removeEventListener('abort', onAbort);
        }
        if (['timeout', 'cancelled', 'unavailable'].includes(outcome.kind))
          uncertain = true;
        if (outcome.kind === 'completed') {
          tools += outcome.calls.length;
          if (outcome.calls.length > 1 || tools > POLICY.toolCalls)
            return { kind: 'malformed' };
        }
        return outcome;
      },
    };
    void Promise.resolve()
      .then(() => deps.handlers[input.kind]!(input, budget))
      .then(
        (raw) => {
          const parsed = operationResultSchema.safeParse(raw);
          if (
            !parsed.success ||
            JSON.stringify(parsed.data.identity) !==
              JSON.stringify(input.identity) ||
            Buffer.byteLength(JSON.stringify(parsed.data)) >
              POLICY.providerOutputBytes
          )
            finish(failure('failed'));
          else finish({ ...parsed.data, simulation: config.mode === 'fake' });
        },
        () => {
          deps.log({ code: 'request-failed', reference });
          finish(failure('failed'));
        },
      )
      .finally(() => {
        handlerSettled = true;
        retire();
      });
    return result;
  }
  return {
    admission,
    available,
    grant,
    run,
    calls: () => calls,
    close() {
      if (closed) return;
      closed = true;
      admission.close();
      for (const abort of verifications) abort.abort();
      for (const cancel of jobs) cancel();
    },
  };
}
