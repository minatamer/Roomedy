import type { EstimateFx, EstimateOffer } from '@roomedy/contracts/estimates';
import {
  estimateFxSchema,
  estimateOfferSchema,
} from '@roomedy/contracts/estimates';
import { estimateMoney } from './estimate-quantities.js';

export function fxRatio(rate: string) {
  if (!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,12})?$/.test(rate))
    throw new Error('invalid-input');
  const [whole, fraction = ''] = rate.split('.');
  const numerator = BigInt(whole! + fraction),
    denominator = 10n ** BigInt(fraction.length);
  if (numerator <= 0n) throw new Error('invalid-input');
  return { numerator, denominator };
}
export function convertNativeMinor(
  minor: number,
  rate: string,
  count = 1n,
  divisor = 1n,
) {
  if (!Number.isSafeInteger(minor) || minor < 0 || minor > 1_000_000_000)
    throw new Error('estimate-range');
  const ratio = fxRatio(rate);
  return estimateMoney(
    BigInt(minor) * ratio.numerator * count,
    ratio.denominator * divisor,
  );
}
function moneyInputs(offer: EstimateOffer): EstimateFx['inputs'] {
  return 'packs' in offer
    ? offer.packs.map((pack) => ({
        key: `pack:${pack.id}`,
        minor: pack.priceMinor,
      }))
    : [
        { key: 'price', minor: offer.priceMinor },
        ...(offer.kind === 'service'
          ? [{ key: 'minimum', minor: offer.minimumMinor }]
          : []),
      ];
}
export function validateOfferFx(offer: EstimateOffer): boolean {
  if (!offer.fx) return true;
  try {
    const fx = estimateFxSchema.parse(offer.fx),
      expected = moneyInputs(offer);
    fxRatio(fx.usdPerUnit);
    const date = Date.parse(`${fx.date}T00:00:00Z`);
    if (
      offer.market.currency !== 'USD' ||
      offer.source.kind !== 'sourced' ||
      !Number.isFinite(date) ||
      new Date(date).toISOString().slice(0, 10) !== fx.date ||
      date > fx.observedAt ||
      fx.url !==
        `https://api.frankfurter.dev/v2/rate/${fx.currency.toLowerCase()}/usd` ||
      fx.inputs.length !== expected.length ||
      new Set(fx.inputs.map((value) => value.key)).size !== expected.length
    )
      return false;
    return expected.every((value) => {
      const original = fx.inputs.find((input) => input.key === value.key);
      return (
        original &&
        convertNativeMinor(original.minor, fx.usdPerUnit) === value.minor
      );
    });
  } catch {
    return false;
  }
}
/** New observations only. Never automatically refresh a saved offer or version. */
export function convertOfferToUsd(
  offer: EstimateOffer,
  rate: Omit<EstimateFx, 'inputs' | 'currency'>,
): EstimateOffer {
  if (
    offer.market.currency === 'USD' ||
    offer.fx ||
    offer.source.kind !== 'sourced'
  )
    throw new Error('invalid-input');
  const fx = estimateFxSchema.parse({
    ...rate,
    currency: offer.market.currency,
    inputs: moneyInputs(offer),
  });
  const base = {
    ...offer,
    market: { ...offer.market, currency: 'USD' as const },
    fx,
  };
  const converted = estimateOfferSchema.parse(
    'packs' in offer
      ? {
          ...base,
          packs: offer.packs.map((pack) => ({
            ...pack,
            priceMinor: convertNativeMinor(pack.priceMinor, fx.usdPerUnit),
          })),
        }
      : {
          ...base,
          priceMinor: convertNativeMinor(offer.priceMinor, fx.usdPerUnit),
          ...(offer.kind === 'service'
            ? {
                minimumMinor: convertNativeMinor(
                  offer.minimumMinor,
                  fx.usdPerUnit,
                ),
              }
            : {}),
        },
  );
  if (!validateOfferFx(converted)) throw new Error('invalid-input');
  return converted;
}
/** Apply quantities before rounding; display-unit rounding never changes a line total. */
export function offerMoney(
  offer: EstimateOffer,
  count = 1n,
  divisor = 1n,
  key = 'price',
) {
  const value = (offer.fx?.inputs ?? moneyInputs(offer)).find(
    (input) => input.key === key,
  );
  if (!value) throw new Error('invalid-input');
  return offer.fx
    ? convertNativeMinor(value.minor, offer.fx.usdPerUnit, count, divisor)
    : estimateMoney(BigInt(value.minor) * count, divisor);
}
export function nativePaintPacks(
  offer: Extract<EstimateOffer, { kind: 'paint' | 'primer' }>,
) {
  return offer.packs.map((pack) => ({
    ...pack,
    priceMinor:
      offer.fx?.inputs.find((input) => input.key === `pack:${pack.id}`)
        ?.minor ?? pack.priceMinor,
  }));
}
export function paintLineMoney(
  offer: Extract<EstimateOffer, { kind: 'paint' | 'primer' }>,
  nativeMinor: number,
) {
  // A whole-can line may exceed the per-unit source bound.
  const ratio = offer.fx
    ? fxRatio(offer.fx.usdPerUnit)
    : { numerator: 1n, denominator: 1n };
  return estimateMoney(
    BigInt(nativeMinor) * ratio.numerator,
    ratio.denominator,
  );
}
