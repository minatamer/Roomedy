import type { PublicConfig } from '@roomedy/contracts/api';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import type { RuntimeConfig } from '../config/runtime-config.js';
import { createFakeProvider } from '../providers/provider.js';
import type { ProviderPort } from '../providers/provider.js';
import { createOperations } from './operations.js';
import type { OperationHandler } from './operations.js';
import type {
  OperationKind,
  OperationResult,
} from '@roomedy/contracts/operations';
import type { ChallengePort } from '../security/admission.js';
import type { ProviderShapeFailure } from '../providers/responses.js';
import type { DraftHypothesisFailure } from '@roomedy/contracts/intake';
import type { AssistantTool } from '@roomedy/contracts/assistant';

export interface Diagnostic {
  code:
    | 'request-failed'
    | 'server-started'
    | 'startup-failed'
    | 'shutdown-forced'
    | 'operation-finished'
    | 'operation-uncertain'
    | 'recognition-decision'
    | 'provider-rejected'
    | 'assistant-decision'
    | 'sourcing-decision';
  reference: string;
  outcome?: OperationResult['kind'];
  rounds?: number;
  elapsedMs?: number;
  stage?: 'decode' | 'provider' | 'hypotheses' | 'prepare';
  observations?: number;
  providerShape?: ProviderShapeFailure;
  hypothesisFailure?: DraftHypothesisFailure;
  assistantFailure?:
    | 'provider'
    | 'response'
    | 'final'
    | 'tool-envelope'
    | 'tool-name'
    | 'tool-input';
  assistantTool?: AssistantTool;
  sourcingIssues?: { code: string; path: string }[];
}
export interface RuntimeDependencies {
  now: () => number;
  nextId: () => string;
  log: (event: Diagnostic) => void;
  provider?: ProviderPort;
  challenge?: ChallengePort;
  handlers?: Partial<Record<OperationKind, OperationHandler>>;
}

export function createRuntime(
  config: RuntimeConfig,
  dependencies: RuntimeDependencies,
) {
  const provider =
    config.mode === 'fake'
      ? dependencies.provider?.kind === 'fake'
        ? dependencies.provider
        : createFakeProvider()
      : dependencies.provider?.kind === 'live'
        ? dependencies.provider
        : undefined;
  const operations = createOperations(config, {
    ...dependencies,
    provider,
    challenge: dependencies.challenge,
    handlers: dependencies.handlers ?? {},
  });
  const publicConfig: PublicConfig = {
    mode: config.mode,
    // No operation becomes available before RM-008 admission and its owning integration.
    capabilities: {
      manual: true,
      recognition: operations.available('recognize-room'),
      assistant: operations.available('assistant'),
      sourcing: operations.available('sourcing'),
      simulation: config.mode === 'fake',
    },
    limits: PUBLIC_LIMITS,
  };
  const ai =
    config.mode === 'fake'
      ? publicConfig.capabilities.recognition
        ? 'fake-ready'
        : 'fake-pending-integration'
      : !config.paidEnabled
        ? 'disabled'
        : !config.providerConfigured
          ? 'missing-configuration'
          : !config.turnstileSiteKey || dependencies.challenge?.kind !== 'live'
            ? 'missing-verification'
            : publicConfig.capabilities.recognition &&
                publicConfig.capabilities.assistant
              ? 'live-ready'
              : 'pending-integration';
  return {
    publicConfig,
    readiness: { status: 'ok', ai } as const,
    now: dependencies.now,
    nextId: dependencies.nextId,
    log: dependencies.log,
    meteredDispatches: () => provider?.meteredDispatches ?? 0,
    operations,
    config,
  };
}
export type Runtime = ReturnType<typeof createRuntime>;
