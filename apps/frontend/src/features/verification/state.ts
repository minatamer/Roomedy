import type { VerificationChallenge } from '@roomedy/contracts/operations';
import { VerificationFailureError } from './failure';
import type { VerificationFailure } from './failure';

export interface PendingVerification {
  readonly challenge: VerificationChallenge;
  finish(proof?: string, failure?: VerificationFailure): void;
}
let pending: PendingVerification | null = null;
const listeners = new Set<() => void>();
export const verificationSnapshot = () => pending;
export const serverVerificationSnapshot = () => null;
export function subscribeVerification(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const publish = () => {
  for (const listener of listeners) listener();
};

/** One transient website prompt, owned by the caller's cancellation/expiry signal. */
export function requestVerification(
  challenge: VerificationChallenge,
  signal: AbortSignal,
): Promise<string | null> {
  if (signal.aborted || pending) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (proof?: string, failure?: VerificationFailure) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      if (pending === owned) {
        pending = null;
        publish();
      }
      if (failure) reject(new VerificationFailureError(failure));
      else resolve(proof && proof.length <= 2048 ? proof : null);
    };
    const abort = () => finish();
    const timer = setTimeout(abort, 60_000);
    const owned = { challenge, finish };
    signal.addEventListener('abort', abort, { once: true });
    pending = owned;
    publish();
    if (signal.aborted) finish();
  });
}
