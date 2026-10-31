import type {
  EstimateState,
  ProductChoice,
  SelectedPrice,
} from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import {
  shoppingCountries,
  LISTED_PLANNING_COVERAGE,
} from '@roomedy/contracts/estimates';
import {
  roomSurface,
  roomSurfaceDetail,
  WALLS,
} from '@roomedy/contracts/surfaces';
import { currentProductChoices } from './product-choices';

/** Read only the lossless USD reference format written by the explicit Choose action.
 * Never extract arbitrary numbers, infer FX, coverage or product specifications. */
export function listedPrice(
  room: RoomDocument,
  choice: ProductChoice,
  country = 'US',
): SelectedPrice | null {
  const text = choice.quotedPrice ?? '';
  if (!text && !choice.listingPrice) return null;
  const match =
    /^(From |Conditional )?\$([\d,]+\.\d{2}) \/ (item|each|pack|can|m2|\d+(?:\.\d+)? L)$/.exec(
      text,
    );
  // Legacy full-paint references name each pack explicitly. Use the first named pack,
  // retaining its size; quantity stays visibly unconfirmed.
  const pack = !match
    ? /^(From |Conditional )?(\d+(?:\.\d+)?) L: \$([\d,]+\.\d{2})(?: · \d+(?:\.\d+)? L: \$[\d,]+\.\d{2})*$/.exec(
        text,
      )
    : null;
  const listing = choice.listingPrice;
  if (
    listing &&
    (listing.currency !== 'USD' ||
      listing.unavailable ||
      !shoppingCountries(country).includes(listing.country) ||
      !['item', 'each', 'pack', 'can', 'm2'].includes(listing.unit))
  )
    return null;
  if (!listing && !match && !pack) return null;
  const amount = (match?.[2] ?? pack?.[3] ?? '').replaceAll(',', '');
  const minor = listing?.priceMinor ?? Number(amount.replace('.', ''));
  if (!Number.isSafeInteger(minor) || minor < 0) return null;
  const rawUnit = listing
    ? listing.volumeMl
      ? `${listing.volumeMl / 1000} L`
      : listing.unit
    : (match?.[3] ?? `${pack![2]} L`);
  const unit =
    rawUnit === 'item'
      ? 'each'
      : rawUnit.endsWith(' L')
        ? 'can'
        : (rawUnit as SelectedPrice['unit']);
  let targets: SelectedPrice['targets'];
  if (!choice.key.startsWith('surface:')) {
    if (!room.furniture.some((item) => item.id === choice.key)) return null;
    targets = [{ kind: 'furniture', id: choice.key }];
  } else if (choice.key === 'surface:floor')
    targets = [{ kind: 'surface', surface: 'floor' }];
  else {
    const wall = WALLS.find((wall) => choice.key === `surface:${wall}`);
    if (!wall) return null;
    const signature = (w: typeof wall) =>
      JSON.stringify([
        roomSurface(room.room, w),
        roomSurfaceDetail(room.room, w).sheen,
      ]);
    targets = WALLS.filter((w) => signature(w) === signature(wall)).map(
      (surface) => ({ kind: 'surface', surface }),
    );
  }
  return {
    key: choice.key,
    scope: choice.scope,
    label: choice.label,
    url: choice.url,
    simulation: choice.simulation,
    unitPriceMinor: minor,
    unit,
    quantity: 1,
    quantityConfirmed: !choice.key.startsWith('surface:'),
    qualifier: [
      match?.[1] ?? pack?.[1] ?? '',
      rawUnit.endsWith(' L') ? `${rawUnit} can.` : '',
    ]
      .join(' ')
      .trim(),
    targets,
    ...(unit === 'pack' && choice.key === 'surface:floor'
      ? {
          takeoff: {
            kind: 'floor' as const,
            mode: 'automatic' as const,
            coverageMm2:
              listing?.coverageMm2 ?? LISTED_PLANNING_COVERAGE.floorMm2,
            coverageSource: listing?.coverageMm2
              ? ('product' as const)
              : ('planning' as const),
          },
        }
      : unit === 'can' &&
          choice.key.startsWith('surface:') &&
          choice.key !== 'surface:floor'
        ? {
            takeoff: {
              kind: 'paint' as const,
              mode: 'automatic' as const,
              coverageMm2PerLitre:
                listing?.coverageMm2PerLitre ??
                LISTED_PLANNING_COVERAGE.paintMm2PerLitre,
              coverageSource: listing?.coverageMm2PerLitre
                ? ('product' as const)
                : ('planning' as const),
              volumeMl:
                listing?.volumeMl ??
                (rawUnit.endsWith(' L')
                  ? Math.round(Number(rawUnit.slice(0, -2)) * 1000)
                  : LISTED_PLANNING_COVERAGE.canMl),
              volumeSource:
                listing?.volumeMl || rawUnit.endsWith(' L')
                  ? ('product' as const)
                  : ('planning' as const),
            },
          }
        : {}),
  };
}

function priceIdentity(price: SelectedPrice) {
  const { quantity, quantityConfirmed, takeoff, ...identity } = price;
  void quantity;
  void quantityConfirmed;
  void takeoff;
  return JSON.stringify(identity);
}

/** Preserve edited quantities only for the exact current choice and market. */
export function selectedPriceInputs(
  room: RoomDocument,
  pricing: EstimateState,
) {
  if (pricing.settings.locality.currency !== 'USD') return [];
  return currentProductChoices(room, pricing).flatMap((choice) => {
    const fresh = listedPrice(room, choice, pricing.settings.locality.country);
    if (!fresh) return [];
    const existing = pricing.settings.selectedPrices?.find(
      (price) => priceIdentity(price) === priceIdentity(fresh),
    );
    if (!existing) return [fresh];
    if (!fresh.takeoff) return [existing];
    const prior = existing.takeoff;
    const takeoff = {
      ...fresh.takeoff,
      mode:
        prior?.mode ??
        (existing.quantityConfirmed
          ? ('manual' as const)
          : ('automatic' as const)),
    };
    if (prior?.kind === takeoff.kind && prior.coverageSource === 'visitor') {
      takeoff.coverageSource = 'visitor';
      if (prior.kind === 'floor' && takeoff.kind === 'floor')
        takeoff.coverageMm2 = prior.coverageMm2;
      if (prior.kind === 'paint' && takeoff.kind === 'paint')
        takeoff.coverageMm2PerLitre = prior.coverageMm2PerLitre;
    }
    if (
      prior?.kind === 'paint' &&
      takeoff.kind === 'paint' &&
      prior.volumeSource === 'visitor'
    ) {
      takeoff.volumeMl = prior.volumeMl;
      takeoff.volumeSource = 'visitor';
    }
    return [{ ...existing, takeoff }];
  });
}
export function selectedPricesValid(
  room: RoomDocument,
  pricing: EstimateState,
) {
  const normalized = selectedPriceInputs(room, pricing);
  return (pricing.settings.selectedPrices ?? []).every((price) =>
    normalized.some((item) =>
      price.takeoff
        ? JSON.stringify(item) === JSON.stringify(price)
        : priceIdentity(item) === priceIdentity(price),
    ),
  );
}
