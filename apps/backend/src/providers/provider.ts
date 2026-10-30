import type { JsonSchema } from './schema.js';
import { POLICY } from '@roomedy/contracts/policy';
/** Chosen by the admitted operation owner, never by visitor/model payloads. */
export type ProviderCallProfile =
  'interactive' | 'photo' | 'sourcing' | 'sourcing-media';
export const providerDeadlineMs = (profile: ProviderCallProfile) =>
  profile === 'photo'
    ? POLICY.recognitionProviderMs
    : profile === 'sourcing-media'
      ? POLICY.sourcingMediaMs
      : profile === 'sourcing'
        ? POLICY.sourcingProviderMs
        : POLICY.providerCallMs;
export interface ProviderRequest {
  /** true searches without supplying a visitor location. */
  search?: { country: string; city: string } | true;
  /** Internal product-media enrichment only; never accepted from visitors. */
  imageSearch?: true;
  instructions: string;
  input: readonly Record<string, unknown>[];
  format: { name: string; schema: JsonSchema };
  tools: readonly {
    name: string;
    description: string;
    parameters: JsonSchema;
  }[];
}
export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
export type ProviderOutcome = (
  | {
      kind: 'completed';
      data: unknown;
      calls: { name: string; callId: string; arguments: unknown }[];
      /** Bounded replay items for this operation only; never returned to the browser. */
      continuation?: Record<string, unknown>[];
      search?: {
        calls: number;
        opened: string[];
        sources: string[];
        images?: { imageUrl: string; sourceUrl: string; caption: string }[];
      };
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
    }
) & { usage?: ProviderUsage };
export interface ProviderCall {
  readonly result: Promise<ProviderOutcome>;
  /** Actual underlying transport settlement, independent of its visible deadline result. */
  readonly settled: Promise<void>;
}
export interface ProviderPort {
  readonly kind: 'fake' | 'live';
  readonly meteredDispatches: number;
  start(
    input: ProviderRequest,
    signal: AbortSignal,
    profile?: ProviderCallProfile,
  ): ProviderCall;
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
