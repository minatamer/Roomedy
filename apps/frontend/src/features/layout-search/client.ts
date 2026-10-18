import { POLICY } from '@roomedy/contracts/policy';
import { searchJobSchema, searchResultSchema } from '@roomedy/contracts/search';
import type { SearchGoal, SearchResult } from '@roomedy/contracts/search';
import type {
  OperationIdentity,
  ActionScope,
} from '@roomedy/contracts/commands';
import {
  emptySearchResult,
  validateSearchCandidate,
  jsonBytes,
} from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { createSearchWorker } from './browser-worker';
export interface SearchWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => unknown) | null;
  postMessage(value: unknown): void;
  terminate(): void;
}
/** Owns one worker in the existing operation; no room, candidate or Apply authority lives here. */
export class BrowserLayoutSearch {
  private cancel: (() => void) | null = null;
  constructor(
    private session: SessionController,
    private factory: () => SearchWorker = createSearchWorker,
  ) {}
  run(
    token: OperationIdentity,
    goal: SearchGoal,
    scope: ActionScope,
    seed = 42,
    maxNodes: number = POLICY.searchCandidates,
  ): Promise<SearchResult> {
    this.cancel?.();
    const room = this.session.getSnapshot().workspace?.current;
    const invalid = (
      termination: SearchResult['termination'] = 'invalid-input',
    ) => emptySearchResult(token, seed, termination);
    if (!room || !this.session.isCurrent(token))
      return Promise.resolve(invalid('cancelled'));
    const job = searchJobSchema.safeParse({
      request: { identity: token, room, goal, seed, maxNodes },
      scope,
    });
    if (!job.success || jsonBytes(job.data) > POLICY.searchMessageBytes)
      return Promise.resolve(invalid());
    return new Promise((resolve) => {
      let worker: SearchWorker | undefined,
        release: (() => void) | null = null,
        done = false,
        timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (result: SearchResult) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (worker) {
          worker.onmessage = null;
          worker.onerror = null;
          worker.terminate();
        }
        const retire = release;
        release = null;
        if (this.cancel === cancel) this.cancel = null;
        retire?.();
        resolve(result);
      };
      const cancel = () => finish(invalid('cancelled'));
      this.cancel = cancel;
      try {
        worker = this.factory();
        release = this.session.ownResource(cancel, token);
        if (done || !release) {
          cancel();
          return;
        }
        worker.onmessage = (event) => {
          if (!this.session.isCurrent(token)) {
            cancel();
            return;
          }
          try {
            if (jsonBytes(event.data) > POLICY.searchMessageBytes) {
              finish(invalid());
              return;
            }
            const parsed = searchResultSchema.safeParse(event.data);
            if (
              !parsed.success ||
              JSON.stringify(parsed.data.identity) !== JSON.stringify(token) ||
              parsed.data.seed !== seed
            ) {
              finish(invalid());
              return;
            }
            const result = parsed.data;
            if (result.candidate) {
              const checked = validateSearchCandidate(
                job.data.request,
                result.candidate,
                job.data.scope,
              );
              if (!checked) {
                finish(invalid());
                return;
              }
              result.candidate = checked;
            }
            finish(result);
          } catch {
            finish(invalid());
          }
        };
        worker.onerror = () => {
          if (this.session.isCurrent(token)) this.session.clientPartFailed();
          finish(invalid());
        };
        // Watchdog includes chunk/worker startup margin; search itself remains250ms in the worker.
        timer = setTimeout(
          () => finish(invalid('deadline')),
          POLICY.searchMs + 2000,
        );
        worker.postMessage(job.data);
      } catch {
        if (this.session.isCurrent(token)) this.session.clientPartFailed();
        finish(invalid());
      }
    });
  }
  dispose() {
    this.cancel?.();
  }
}
