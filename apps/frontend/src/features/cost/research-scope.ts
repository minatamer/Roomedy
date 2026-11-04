import type { OperationIdentity } from '@roomedy/contracts/commands';
import { requestVerification } from '../verification/state';

export interface ResearchScope {
  owner: OperationIdentity;
  verify: typeof requestVerification;
}

/** One batch owner; only proof prompts queue, never the independent searches. */
export function createResearchScope(
  owner: OperationIdentity,
  verify: typeof requestVerification = requestVerification,
): ResearchScope {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    owner,
    verify(challenge, signal) {
      if (signal.aborted) return Promise.resolve(null);
      const run = tail.then(() =>
        signal.aborted ? null : verify(challenge, signal),
      );
      // A cancelled queued caller settles immediately, but cannot let a later
      // prompt overtake the still-active predecessor.
      tail = run.catch(() => {});
      return new Promise((resolve, reject) => {
        const abort = () => {
          signal.removeEventListener('abort', abort);
          resolve(null);
        };
        signal.addEventListener('abort', abort, { once: true });
        void run
          .then(resolve, reject)
          .finally(() => signal.removeEventListener('abort', abort));
        if (signal.aborted) abort();
      });
    },
  };
}
