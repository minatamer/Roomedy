import type { PublicConfig } from '@roomedy/contracts/api';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import type { RuntimeConfig } from '../config/runtime-config.js';
import { createFakeProvider } from '../providers/provider.js';
import type { ProviderPort } from '../providers/provider.js';

export interface Diagnostic {
  code: 'request-failed' | 'server-started' | 'startup-failed';
  reference: string;
}
export interface RuntimeDependencies {
  now: () => number;
  nextId: () => string;
  log: (event: Diagnostic) => void;
  provider?: ProviderPort;
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
      : undefined;
  const publicConfig: PublicConfig = {
    mode: config.mode,
    // No operation becomes available before RM-008 admission and its owning integration.
    capabilities: {
      manual: true,
      recognition: false,
      assistant: false,
      simulation: config.mode === 'fake',
    },
    limits: PUBLIC_LIMITS,
  };
  const ai =
    config.mode === 'fake'
      ? 'fake-pending-integration'
      : !config.paidEnabled
        ? 'disabled'
        : !config.providerConfigured
          ? 'missing-configuration'
          : 'pending-admission';
  return {
    publicConfig,
    readiness: { status: 'ok', ai } as const,
    now: dependencies.now,
    nextId: dependencies.nextId,
    log: dependencies.log,
    meteredDispatches: () => provider?.meteredDispatches ?? 0,
  };
}
export type Runtime = ReturnType<typeof createRuntime>;
