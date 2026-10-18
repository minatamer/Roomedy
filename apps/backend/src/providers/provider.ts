import type { JsonSchema } from './schema.js';
export interface ProviderRequest {
  instructions: string;
  input: readonly Record<string, unknown>[];
  format: { name: string; schema: JsonSchema };
  tools: readonly {
    name: string;
    description: string;
    parameters: JsonSchema;
  }[];
}
export type ProviderOutcome =
  | {
      kind: 'completed';
      data: unknown;
      calls: { name: string; callId: string; arguments: unknown }[];
      /** Bounded replay items for this operation only; never returned to the browser. */
      continuation?: Record<string, unknown>[];
    }
  | {
      kind:
        | 'refused'
        | 'incomplete'
        | 'malformed'
        | 'too-large'
        | 'cancelled'
        | 'timeout'
        | 'unavailable';
    };
export interface ProviderCall {
  readonly result: Promise<ProviderOutcome>;
  /** Actual underlying transport settlement, independent of its visible deadline result. */
  readonly settled: Promise<void>;
}
export interface ProviderPort {
  readonly kind: 'fake' | 'live';
  readonly meteredDispatches: number;
  start(input: ProviderRequest, signal: AbortSignal): ProviderCall;
}

export function createFakeProvider(
  respond: (
    input: ProviderRequest,
    signal: AbortSignal,
  ) => Promise<ProviderOutcome> = async () => ({ kind: 'unavailable' }),
): ProviderPort {
  return {
    kind: 'fake',
    meteredDispatches: 0,
    start(input, signal) {
      const result = Promise.resolve().then(() => respond(input, signal));
      return {
        result,
        settled: result.then(
          () => undefined,
          () => undefined,
        ),
      };
    },
  };
}
