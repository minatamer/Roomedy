import { sourceUrlSchema } from '@roomedy/contracts/estimates';
export interface SearchEvidence {
  calls: number;
  opened: string[];
  sources: string[];
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const only = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));
export function evidenceUrl(raw: string) {
  const parsed = sourceUrlSchema.safeParse(raw);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  url.hash = '';
  return url.href;
}
/** Provider action metadata is operation-local evidence, never a browser-chosen fetch. */
export function readSearchAction(
  raw: unknown,
  evidence: SearchEvidence,
): boolean {
  if (
    !object(raw) ||
    !only(raw, ['type', 'id', 'status', 'action']) ||
    raw.type !== 'web_search_call' ||
    raw.status !== 'completed' ||
    typeof raw.id !== 'string' ||
    raw.id.length < 1 ||
    raw.id.length > 120 ||
    !object(raw.action) ||
    ++evidence.calls > 4
  )
    return false;
  const action = raw.action;
  if (action.type === 'search') {
    if (
      !only(action, ['type', 'queries', 'query', 'sources']) ||
      (action.queries !== undefined &&
        (!Array.isArray(action.queries) ||
          action.queries.length > 8 ||
          action.queries.some(
            (q) => typeof q !== 'string' || q.length > 2000,
          ))) ||
      (action.query !== undefined &&
        (typeof action.query !== 'string' || action.query.length > 2000))
    )
      return false;
    if (action.sources !== undefined) {
      if (!Array.isArray(action.sources) || action.sources.length > 40)
        return false;
      for (const source of action.sources) {
        if (
          !object(source) ||
          !only(source, ['type', 'url']) ||
          source.type !== 'url' ||
          typeof source.url !== 'string'
        )
          return false;
        const url = evidenceUrl(source.url);
        if (url) evidence.sources.push(url);
      }
    }
    return true;
  }
  if (action.type !== 'open_page' && action.type !== 'find_in_page')
    return false;
  if (
    !only(
      action,
      action.type === 'open_page'
        ? ['type', 'url']
        : ['type', 'url', 'pattern'],
    ) ||
    (action.type === 'find_in_page' &&
      (typeof action.pattern !== 'string' || action.pattern.length > 2000))
  )
    return false;
  if (action.url !== undefined && action.url !== null) {
    if (typeof action.url !== 'string') return false;
    const url = evidenceUrl(action.url);
    if (url) {
      evidence.sources.push(url);
      if (action.type === 'open_page') evidence.opened.push(url);
    }
  }
  return true;
}
