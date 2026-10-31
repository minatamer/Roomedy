import type {
  EstimateState,
  ProductChoice,
  RoomEstimate,
} from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { marketTargets } from './market-research';
import type { MarketTarget } from './market-research';

const scopeFor = (target: MarketTarget, pricing: EstimateState) =>
  JSON.stringify([
    { ...target.brief, query: '' },
    target.label,
    pricing.settings.locality,
  ]);

/** Bind a preference to its actual brief, wall grouping and shopping market. */
export function productChoiceScope(
  room: RoomDocument,
  pricing: EstimateState,
  key: string,
) {
  const target = marketTargets(room).find((target) => target.key === key);
  return target ? scopeFor(target, pricing) : null;
}
export function currentProductChoices(
  room: RoomDocument,
  pricing: EstimateState,
): ProductChoice[] {
  const choices = new Map(
    pricing.productChoices?.map((choice) => [choice.key, choice]),
  );
  return marketTargets(room).flatMap((target) => {
    const choice = choices.get(target.key);
    return choice && choice.scope === scopeFor(target, pricing) ? [choice] : [];
  });
}
export function allProductsChosen(room: RoomDocument, pricing: EstimateState) {
  const count = marketTargets(room).length;
  return count > 0 && currentProductChoices(room, pricing).length === count;
}
export function choicePriceIncluded(
  choice: ProductChoice,
  pricing: EstimateState,
  estimate: RoomEstimate,
) {
  return (
    estimate.lines.some(
      (line) =>
        line.productKey === choice.key &&
        line.pricing === 'listed' &&
        line.amountMinor !== null &&
        pricing.settings.selectedPrices?.some(
          (price) =>
            price.key === choice.key &&
            price.scope === choice.scope &&
            price.url === choice.url,
        ),
    ) ||
    (!!choice.offerId &&
      choiceOfferActive(choice, pricing) &&
      pricing.offers.some(
        (offer) =>
          offer.id === choice.offerId && offer.source.url === choice.url,
      ) &&
      estimate.lines.some(
        (line) =>
          line.offerIds.includes(choice.offerId!) &&
          line.amountMinor !== null &&
          line.pricing !== 'included',
      ))
  );
}

export function choiceOfferActive(
  choice: ProductChoice,
  pricing: EstimateState,
) {
  if (!choice.offerId) return false;
  if (choice.key === 'surface:floor')
    return (
      pricing.settings.floor.enabled &&
      pricing.settings.floor.offerId === choice.offerId
    );
  if (choice.key.startsWith('surface:'))
    return pricing.settings.walls.some(
      (wall) =>
        `surface:${wall.wall}` === choice.key &&
        wall.enabled &&
        wall.paintOfferId === choice.offerId,
    );
  return pricing.settings.furniture.some(
    (item) =>
      item.id === choice.key &&
      item.mode === 'buy' &&
      item.offerId === choice.offerId,
  );
}
