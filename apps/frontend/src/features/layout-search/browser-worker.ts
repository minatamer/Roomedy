import type { SearchWorker } from './client';
export function createSearchWorker(): SearchWorker {
  return new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
    name: 'roomedy-layout-search',
  });
}
