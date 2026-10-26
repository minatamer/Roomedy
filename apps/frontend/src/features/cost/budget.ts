import type { EstimateState, RoomEstimate } from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { money } from './state';
export interface BudgetOption {
  label: string;
  pricing: EstimateState;
  estimate: RoomEstimate;
  tradeoffs: string[];
}
export function budgetSummary(estimate: RoomEstimate, budgetMinor: number) {
  const amount = money(budgetMinor, estimate.locality.currency);
  if (!estimate.complete)
    return `Known costs ${money(estimate.knownTotalMinor, estimate.locality.currency)} against ${amount}. ${estimate.unpricedCount} unresolved lines mean the full budget is not verified. Allowances remain estimates.`;
  return `${estimate.knownTotalMinor <= budgetMinor ? 'Estimated selected scope is within' : 'Estimated selected scope exceeds'} ${amount}. Allowances ${money(estimate.allowanceMinor, estimate.locality.currency)} and sample prices still need confirmation before ordering.`;
}
/** Compare a small recorded catalogue without dropping scope, dependencies or observations. */
export function budgetOptions(
  room: RoomDocument,
  accepted: EstimateState,
  budgetMinor: number,
): BudgetOption[] {
  const base = calculateRoomEstimate(room, accepted.settings, accepted.offers);
  if (!base.ok) return [];
  const options: BudgetOption[] = [];
  const add = (
    settings: EstimateState['settings'],
    label: string,
    tradeoffs: string[],
  ) => {
    const result = calculateRoomEstimate(room, settings, accepted.offers);
    if (
      !result.ok ||
      result.estimate.knownTotalMinor >= base.estimate.knownTotalMinor ||
      result.estimate.unpricedCount > base.estimate.unpricedCount
    )
      return;
    options.push({
      label,
      tradeoffs,
      pricing: { settings, offers: accepted.offers, budgetMinor },
      estimate: result.estimate,
    });
  };
  const current = accepted.offers.find(
    (o) => o.id === accepted.settings.floor.offerId,
  );
  if (accepted.settings.floor.enabled && current?.kind === 'floor') {
    for (const offer of accepted.offers
      .filter(
        (o) =>
          o.kind === 'floor' &&
          o.id !== current.id &&
          o.market.country === current.market.country &&
          o.market.currency === current.market.currency &&
          o.availability !== 'unavailable' &&
          (current.source.kind === 'sample' || o.source.kind !== 'sample'),
      )
      .slice(0, 8)) {
      const settings = structuredClone(accepted.settings);
      settings.floor.offerId = offer.id;
      if (!settings.deliveries.some((d) => d.group === offer.deliveryGroup))
        settings.deliveries.push({ group: offer.deliveryGroup, offerId: null });
      add(settings, `Choose ${offer.label}`, [
        'Use a different recorded flooring product; review its finish and installation instructions. The drawn surface remains a similar representation.',
        'Waste, preparation, labour, trim and tax scope are retained. Review any changed underlay and delivery lines.',
      ]);
    }
  }
  const reuse = structuredClone(accepted.settings);
  const reusable = reuse.furniture.filter(
    (f) =>
      f.mode === 'buy' &&
      room.furniture.some((p) => p.id === f.id && p.ownership === 'owned'),
  );
  for (const f of reusable) {
    f.mode = 'reuse';
    f.components = f.components.map((c) => ({ ...c, mode: 'reuse' as const }));
  }
  if (reusable.length) {
    add(reuse, 'Keep your existing furniture', [
      'Reuse the owned furniture you had selected to buy again, including its existing components. Confirm that those components are available and usable.',
      'The pieces stay in the room. Moving and other selected work remain included.',
    ]);
    const floor = options.find(
      (o) =>
        o.pricing.settings.floor.offerId !== accepted.settings.floor.offerId,
    );
    if (floor) {
      const settings = structuredClone(floor.pricing.settings);
      settings.furniture = reuse.furniture;
      add(settings, 'Combine flooring savings and reuse', [
        ...floor.tradeoffs,
        'Reuse the owned pieces and their components; confirm their condition before choosing this option.',
      ]);
    }
  }
  return options
    .sort((a, b) => a.estimate.knownTotalMinor - b.estimate.knownTotalMinor)
    .slice(0, 3);
}
