import type {
  EstimateState,
  RoomEstimate,
  EstimateLine,
} from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
export interface CostProposal {
  label: string;
  tradeoffs: string[];
  before: RoomEstimate;
  after: RoomEstimate;
  pricing: EstimateState;
}
export type CostIntent =
  | { kind: 'budget'; amountMinor: number }
  | { kind: 'research'; key: string; query: string }
  | { kind: 'work' }
  | { kind: 'explain' }
  | { kind: 'clarify'; message: string };
/** A deliberately small, typed local tool router; money is always calculated by the engine. */
export function costIntent(
  text: string,
  room: RoomDocument,
  currency: string,
  selected: string | null,
): CostIntent {
  const lower = text.toLowerCase();
  if (
    /\b(?:budget|under|below|afford)\b|save money/.test(lower) ||
    (/\bcheaper\b/.test(lower) &&
      !/\b(?:find|research|similar|look for|shop for)\b/.test(lower))
  ) {
    const currencies = text.match(/\b(?:EGP|USD|EUR|GBP|AED|SAR)\b/gi) ?? [];
    if (
      currencies.some((c) => c.toUpperCase() !== currency) ||
      /[€£]/.test(text) ||
      (text.includes('$') && currency !== 'USD')
    )
      return {
        kind: 'clarify',
        message: `Use a budget in ${currency}. Change the estimate currency explicitly to plan in another currency; prices are never converted automatically.`,
      };
    const amount = text.match(
      /(?:\b(?:under|below|budget(?: of| is|:)?|afford)\s*(?:EGP|USD|EUR|GBP|AED|SAR)?\s*\$?\s*)([0-9][0-9.,a-z]*)/i,
    )?.[1];
    if (
      !amount ||
      !/^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.[0-9]{1,2})?$/.test(amount)
    )
      return {
        kind: 'clarify',
        message: `What is your room budget in ${currency}? For example, “keep this under 3,000 ${currency}”.`,
      };
    const value = Number(amount.replaceAll(',', ''));
    const minor = Math.round(value * 100);
    return Number.isSafeInteger(minor) && minor > 0 && minor <= 1e15
      ? { kind: 'budget', amountMinor: minor }
      : {
          kind: 'clarify',
          message: 'Enter a positive budget with at most two decimal places.',
        };
  }
  if (
    /work plan|work sequence|shopping|steps|how (?:do|to)|what.*first/.test(
      lower,
    )
  )
    return { kind: 'work' };
  if (/find|research|buy online|similar|shop for|look for/.test(lower)) {
    const piece = room.furniture.find((p) =>
      lower.includes(p.label.toLowerCase()),
    );
    const key =
      piece?.id ??
      (/floor/.test(lower)
        ? 'surface:floor'
        : /moving/.test(lower)
          ? 'service:moving'
          : /paint|wall|primer/.test(lower)
            ? selected?.startsWith('surface:') && selected !== 'surface:floor'
              ? selected
              : 'surface:north'
            : selected);
    return key
      ? { kind: 'research', key, query: text.slice(0, 240) }
      : {
          kind: 'clarify',
          message:
            'Choose a part in 3D, or name flooring, wall paint, moving or a furniture piece to research.',
        };
  }
  return { kind: 'explain' };
}
/** Sequential engine IDs are presentation identities, not comparison keys. Preserve multiplicity. */
export function costLineChanges(before: RoomEstimate, after: RoomEstimate) {
  const signature = (line: EstimateLine) =>
    JSON.stringify({ ...line, id: null });
  const counts = new Map<string, number>();
  for (const line of after.lines) {
    const key = signature(line);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const removed: EstimateLine[] = [];
  for (const line of before.lines) {
    const key = signature(line),
      count = counts.get(key) ?? 0;
    if (!count) removed.push(line);
    else counts.set(key, count - 1);
  }
  const added = after.lines.filter((line) => {
    const key = signature(line),
      count = counts.get(key) ?? 0;
    if (!count) return false;
    counts.set(key, count - 1);
    return true;
  });
  return { removed, added };
}
