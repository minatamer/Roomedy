import { POLICY } from '@roomedy/contracts/policy';
import { searchJobSchema } from '@roomedy/contracts/search';
import { LayoutSearch, emptySearchResult, jsonBytes } from '@roomedy/spatial';
interface WorkerHost {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(value: unknown): void;
  close(): void;
}
const host = self as unknown as WorkerHost;
let used = false;
host.onmessage = (event) => {
  if (used) return;
  used = true;
  try {
    if (jsonBytes(event.data) > POLICY.searchMessageBytes)
      throw new Error('input-limit');
    const job = searchJobSchema.safeParse(event.data);
    if (!job.success) throw new Error('invalid-input');
    const started = performance.now(),
      search = new LayoutSearch(job.data.request, job.data.scope);
    while (!search.finished && performance.now() - started < POLICY.searchMs)
      search.step();
    const result = search.finished
      ? search.finish()
      : search.finish('deadline');
    if (jsonBytes(result) > POLICY.searchMessageBytes)
      throw new Error('output-limit');
    host.postMessage(result);
  } catch {
    host.postMessage(emptySearchResult(null));
  } finally {
    host.onmessage = null;
    host.close();
  }
};
