import { setImmediate as yieldToHost } from 'node:timers/promises';
import { POLICY } from '@roomedy/contracts/policy';
import { searchRequestSchema } from '@roomedy/contracts/search';
import type { SearchResult } from '@roomedy/contracts/search';
import { actionScopeSchema } from '@roomedy/contracts/commands';
import type { ActionScope } from '@roomedy/contracts/commands';
import {
  LayoutSearch,
  emptySearchResult,
  validateSearchCandidate,
  jsonBytes,
} from '@roomedy/spatial';
/** Same pure search, with an independent server budget and an actual event-loop yield per slice. */
export async function runBackendLayoutSearch(
  raw: unknown,
  trustedScope: ActionScope,
  signal: AbortSignal,
  now: () => number = () => performance.now(),
): Promise<SearchResult> {
  const parsed = searchRequestSchema.safeParse(raw);
  const capturedScope = actionScopeSchema.safeParse(trustedScope);
  if (!parsed.success || !capturedScope.success) return emptySearchResult(null);
  const input = parsed.data,
    scope = capturedScope.data,
    started = now();
  if (signal.aborted)
    return emptySearchResult(input.identity, input.seed, 'cancelled');
  try {
    const search = new LayoutSearch(input, scope);
    while (!search.finished) {
      if (signal.aborted) return search.finish('cancelled');
      if (now() - started >= POLICY.searchMs)
        return finalize(search.finish('deadline'));
      search.step();
      if (!search.finished) await yieldToHost();
    }
    return finalize(search.finish());
  } catch {
    return emptySearchResult(input.identity, input.seed);
  }
  function finalize(result: SearchResult): SearchResult {
    if (signal.aborted)
      return emptySearchResult(result.identity, result.seed, 'cancelled');
    if (result.candidate) {
      const candidate = validateSearchCandidate(input, result.candidate, scope);
      if (!candidate) return emptySearchResult(result.identity, result.seed);
      result.candidate = candidate;
    }
    return jsonBytes(result) <= POLICY.searchMessageBytes
      ? result
      : emptySearchResult(result.identity, result.seed);
  }
}
