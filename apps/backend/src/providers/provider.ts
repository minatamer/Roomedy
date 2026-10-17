/** Future bounded adapter port; no SDK, client construction or credential access on import. */
export interface ProviderPort {
  readonly kind: 'fake' | 'live';
  readonly meteredDispatches: number;
  dispatch(input: unknown, signal: AbortSignal): Promise<unknown>;
}

export function createFakeProvider(): ProviderPort {
  return {
    kind: 'fake',
    meteredDispatches: 0,
    async dispatch() {
      return { kind: 'unavailable', simulation: true };
    },
  };
}
