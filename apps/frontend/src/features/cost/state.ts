import type { RoomDocument } from '@roomedy/contracts/room';
import type {
  EstimateOffer,
  EstimateSettings,
  EstimateTarget,
  RoomEstimate,
  EstimateState,
} from '@roomedy/contracts/estimates';
import {
  estimateSettingsSchema,
  estimateOffersSchema,
} from '@roomedy/contracts/estimates';
import {
  defaultEstimateSettings,
  sampleEstimateOffers,
  calculateRoomEstimate,
} from '@roomedy/spatial';

export interface CostMessage {
  roomRevision: number;
  costRevision: number;
  role: 'visitor' | 'assistant';
  text: string;
}
export interface CostDraft extends EstimateState {
  revision: number;
  roomRevision: number;
  settings: EstimateSettings;
  offers: EstimateOffer[];
  messages: CostMessage[];
}
export function createCostDraft(room: RoomDocument): CostDraft {
  return {
    revision: 0,
    roomRevision: room.roomRevision,
    settings: defaultEstimateSettings(room),
    offers: sampleEstimateOffers(),
    budgetMinor: null,
    messages: [],
  };
}
/** Reconcile only membership. A changed design never silently selects a different product. */
export function reconcileCost(room: RoomDocument, draft: CostDraft): CostDraft {
  if (draft.roomRevision === room.roomRevision) return draft;
  const defaults = defaultEstimateSettings(room);
  return {
    ...draft,
    revision: draft.revision + 1,
    roomRevision: room.roomRevision,
    settings: {
      ...draft.settings,
      roomId: room.roomId,
      furniture: room.furniture.map(
        (piece) =>
          draft.settings.furniture.find((item) => item.id === piece.id) ??
          defaults.furniture.find((item) => item.id === piece.id)!,
      ),
    },
  };
}
export function validatedCost(
  room: RoomDocument,
  settings: unknown,
  offers: unknown,
): CostDraft | null {
  const s = estimateSettingsSchema.safeParse(settings),
    o = estimateOffersSchema.safeParse(offers);
  if (
    !s.success ||
    !o.success ||
    !calculateRoomEstimate(room, s.data, o.data).ok
  )
    return null;
  return {
    revision: 0,
    roomRevision: room.roomRevision,
    settings: s.data,
    offers: o.data,
    budgetMinor: null,
    messages: [],
  };
}
export function pricingState(draft: CostDraft): EstimateState {
  return {
    settings: draft.settings,
    offers: draft.offers,
    budgetMinor: draft.budgetMinor,
  };
}
export function targetKey(target: EstimateTarget) {
  return target.kind === 'surface'
    ? `surface:${target.surface}`
    : target.kind === 'furniture'
      ? target.id
      : null;
}
export function targetExists(room: RoomDocument, key: string | null) {
  return (
    key === null ||
    [
      'surface:floor',
      'surface:north',
      'surface:east',
      'surface:south',
      'surface:west',
    ].includes(key) ||
    room.furniture.some((piece) => piece.id === key)
  );
}
export function money(amount: number, currency: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
export function explainCost(
  estimate: RoomEstimate,
  text: string,
  selected: string | null,
) {
  const lower = text.toLowerCase();
  const lines = estimate.lines.filter((line) =>
    /floor/.test(lower)
      ? line.category === 'floor'
      : /paint|wall|primer/.test(lower)
        ? line.category === 'walls'
        : /deliver|moving|labour|labor/.test(lower)
          ? ['services', 'delivery'].includes(line.category)
          : selected
            ? line.targets.some((target) => targetKey(target) === selected)
            : true,
  );
  return (
    [...lines]
      .sort(
        (a, b) =>
          Number(b.amountMinor !== null && b.amountMinor > 0) -
          Number(a.amountMinor !== null && a.amountMinor > 0),
      )
      .slice(0, 4)
      .map(
        (line) =>
          `${line.label}: ${line.amountMinor === null ? 'needs a price or measurement' : money(line.amountMinor, estimate.locality.currency)}. ${line.rule}`,
      )
      .join('\n\n') +
      (lines.length
        ? `\n\n${lines.filter((l) => l.amountMinor === null).length} unresolved lines in this scope. Review the breakdown for every included item, source and allowance.`
        : '') ||
    'Choose a cost line to explore its quantities and assumptions. You can edit scope below, or return to Design for measurements and finishes.'
  );
}
