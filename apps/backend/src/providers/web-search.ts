import { sourceUrlSchema } from '@roomedy/contracts/estimates';
import { POLICY } from '@roomedy/contracts/policy';
export interface SearchEvidence {
  calls: number;
  opened: string[];
  sources: string[];
  images?: { imageUrl: string; sourceUrl: string; caption: string }[];
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export function evidenceUrl(raw: string) {
  const parsed = sourceUrlSchema.safeParse(raw);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  url.hash = '';
  return url.href;
}
/** Attribution can vary between API citations and product links; variant identity cannot. */
export function discoveryUrl(raw: string) {
  const value = evidenceUrl(raw);
  if (!value) return null;
  const url = new URL(value);
  url.hostname = url.hostname.replace(/^www\./i, '');
  url.pathname = url.pathname.replace(/\/$/, '') || '/';
  for (const key of [...url.searchParams.keys()])
    if (
      /^(?:utm_.+|gclid|dclid|fbclid|msclkid|merch|cm_mmc|irclickid|irgwc|afid|ref_|cjdata)$/i.test(
        key,
      )
    )
      url.searchParams.delete(key);
  url.searchParams.sort();
  return url.href;
}
/** Provider action metadata is operation-local evidence, never a browser-chosen fetch. */
export function readSearchAction(
  raw: unknown,
  evidence: SearchEvidence,
): boolean {
  if (
    !object(raw) ||
    raw.type !== 'web_search_call' ||
    !['completed', 'failed', 'incomplete'].includes(String(raw.status)) ||
    typeof raw.id !== 'string' ||
    raw.id.length < 1 ||
    raw.id.length > 120 ||
    ++evidence.calls > POLICY.sourcingActionItems
  )
    return false;
  // Failed store lookups are valid tool outcomes, but authorize no evidence.
  if (raw.status !== 'completed') return true;
  if (raw.results !== undefined && raw.results !== null) {
    if (!Array.isArray(raw.results) || raw.results.length > 40) return false;
    for (const result of raw.results) {
      if (!object(result)) return false;
      if (result.type !== 'image_result') continue;
      const image = sourceUrlSchema.safeParse(result.image_url);
      const source =
        typeof result.source_website_url === 'string'
          ? evidenceUrl(result.source_website_url)
          : null;
      if (!image.success || !source) continue;
      const images = (evidence.images ??= []);
      if (images.length >= POLICY.sourcingSearchCalls * 3) continue;
      images.push({
        imageUrl: image.data,
        sourceUrl: source,
        caption:
          typeof result.caption === 'string'
            ? result.caption.slice(0, 240)
            : '',
      });
    }
  }
  // The API permits image-result calls without action metadata.
  if (raw.action === undefined || raw.action === null) return true;
  if (!object(raw.action)) return false;
  const action = raw.action;
  if (action.type === 'search') {
    if (action.sources !== undefined && action.sources !== null) {
      if (!Array.isArray(action.sources) || action.sources.length > 40)
        return false;
      for (const source of action.sources) {
        if (
          !object(source) ||
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
