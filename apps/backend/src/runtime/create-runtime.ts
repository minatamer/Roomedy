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

export interface Diagnostic {
  code:
    | 'request-failed'
    | 'server-started'
    | 'startup-failed'
    | 'operation-finished'
    | 'operation-uncertain'
    | 'recognition-decision'
    | 'assistant-decision';
  reference: string;
  outcome?: OperationResult['kind'];
  rounds?: number;
  elapsedMs?: number;
  stage?: 'decode' | 'provider' | 'hypotheses' | 'prepare';
  observations?: number;
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
          : !config.livePolicyReviewed ||
              dependencies.challenge?.kind !== 'live'
            ? 'missing-verification'
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
