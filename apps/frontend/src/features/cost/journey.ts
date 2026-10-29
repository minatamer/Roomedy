import type { RoomDocument } from '@roomedy/contracts/room';
import type { EstimateSettings } from '@roomedy/contracts/estimates';
import { shoppingCountries } from '@roomedy/contracts/estimates';
import {
  defaultEstimateSettings,
  sampleEstimateOffers,
} from '@roomedy/spatial';
import type { CostDraft } from './state';
import { shoppingCountry } from './shopping-countries';

export type CostSection =
  'welcome' | 'furniture' | 'floor' | 'walls' | 'review';
/** US is the shopping default; browser language is never location evidence. */
export function shoppingLocality(country = 'US') {
  if (!/^[A-Z]{2}$/.test(country)) country = 'ZZ';
  return {
    country,
    city:
      country === 'ZZ'
        ? 'No location shared'
        : (shoppingCountry(country)?.name ??
          new Intl.DisplayNames(['en'], { type: 'region' }).of(country) ??
          country),
    currency: 'USD' as const,
  };
}
/** Default unknown USD product research, retaining unknown service/job locations. */
export function researchLocality(
  locality: EstimateSettings['locality'],
  product = true,
) {
  return product && locality.country === 'ZZ' && locality.currency === 'USD'
    ? shoppingLocality()
    : { ...locality };
}
export function simpleEstimateInputs(
  room: RoomDocument,
  locality: EstimateSettings['locality'] = shoppingLocality(),
) {
  const settings = defaultEstimateSettings(room);
  settings.locality = { ...locality };
  settings.demoScope = 'materials';
  settings.floor.preparation = 'exclude';
  settings.floor.enabled = false;
  settings.floor.offerId = null;
  settings.floor.retainTrim = true;
  settings.walls.forEach((wall) => {
    wall.primer = 'exclude';
  });
  settings.services.forEach((service) => {
    service.enabled = false;
  });
  settings.fulfilment = 'collection';
  settings.furniture.forEach((item) => {
    if (item.mode === 'reuse')
      item.components.forEach((part) => {
        part.mode = 'reuse';
      });
  });
  const offers = sampleEstimateOffers().map((offer) => ({
    ...offer,
    market:
      settings.locality.country === 'ZZ'
        ? { ...offer.market }
        : { ...settings.locality },
  }));
  return { settings, offers };
}
export function costSectionRequest(text: string): CostSection | null {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[?.!]+$/, '');
  if (
    /^(?:show |review |see |open |choose |plan |start with |let[’']s start with |what about )?(?:(?:the|your) )?(?:furniture|floor(?:ing)?|walls|wall paint)(?: costs| options)?$/.test(
      t,
    )
  )
    return t.includes('furniture')
      ? 'furniture'
      : t.includes('floor')
        ? 'floor'
        : 'walls';
  if (
    /^(?:show |review |see |open )?(?:my |the |full )?(?:estimate|breakdown|summary|all costs)$/.test(
      t,
    )
  )
    return 'review';
  return null;
}
export function localityCorrection(text: string) {
  const match =
    /^(?:i(?:[’']m| am| live| am based) in|shop in|i(?:[’']m| am) from|use)\s+(the\s+)?(us|usa|united states|america|europe|uk|united kingdom|egypt|middle east|mena|france|germany|spain|italy|saudi arabia|uae)(?:\s+(?:market|for shopping))?[.!]?$/i.exec(
      text.trim(),
    );
  if (!match) return null;
  const name = match[2]!.toLowerCase();
  const country =
    (
      {
        europe: 'DE',
        uk: 'GB',
        'united kingdom': 'GB',
        egypt: 'EG',
        'middle east': 'EG',
        mena: 'EG',
        france: 'FR',
        germany: 'DE',
        spain: 'ES',
        italy: 'IT',
        'saudi arabia': 'SA',
        uae: 'AE',
      } as Record<string, string>
    )[name] ?? 'US';
  return {
    ...shoppingLocality(country),
    ...(name === 'europe'
      ? { city: 'Europe' }
      : name === 'middle east' || name === 'mena'
        ? { city: 'Middle East & North Africa' }
        : {}),
  };
}
/** Explicit visitor correction; preserve source records and clear incompatible selected prices. */
export function changeShoppingLocality(
  draft: CostDraft,
  locality: EstimateSettings['locality'],
) {
  const settings = structuredClone(draft.settings);
  settings.locality = locality;
  const offers = draft.offers.map((offer) =>
    locality.country !== 'ZZ' &&
    offer.source.kind === 'sample' &&
    offer.market.currency === 'USD'
      ? { ...offer, market: { ...locality } }
      : offer,
  );
  const compatible = (id: string | null) => {
    const offer = offers.find((o) => o.id === id);
    return offer &&
      offer.market.currency === 'USD' &&
      (offer.kind === 'service' || !settings.demoScope
        ? offer.market.country === locality.country
        : shoppingCountries(locality.country).includes(offer.market.country)) &&
      (offer.kind !== 'service' ||
        offer.market.city.toLowerCase() === locality.city.toLowerCase())
      ? id
      : null;
  };
  settings.floor.offerId = compatible(settings.floor.offerId);
  settings.floor.underlayOfferId = compatible(settings.floor.underlayOfferId);
  settings.floor.trimOfferId = compatible(settings.floor.trimOfferId);
  settings.walls.forEach((wall) => {
    wall.paintOfferId = compatible(wall.paintOfferId);
    wall.primerOfferId = compatible(wall.primerOfferId);
  });
  settings.furniture.forEach((item) => {
    item.offerId = compatible(item.offerId);
    item.components.forEach((part) => {
      part.offerId = compatible(part.offerId);
    });
  });
  settings.services.forEach((service) => {
    service.offerId = compatible(service.offerId);
  });
  settings.deliveries.forEach((delivery) => {
    delivery.offerId = compatible(delivery.offerId);
  });
  return { settings, offers };
}
export function furniturePurchase(
  settings: EstimateSettings,
  id: string,
  buy: boolean,
) {
  const next = structuredClone(settings),
    item = next.furniture.find((part) => part.id === id);
  if (!item) return null;
  item.mode = buy ? 'buy' : 'reuse';
  item.components.forEach((part) => {
    part.mode = buy ? 'buy' : 'reuse';
  });
  return next;
}

/** Explicitly simplify an earlier active draft; source amounts and saved versions stay intact. */
export function simplifyCostScope(draft: CostDraft) {
  const next = structuredClone(draft.settings);
  next.demoScope = 'materials';
  next.floor.enabled = false;
  next.floor.offerId = null;
  next.floor.preparation = 'exclude';
  next.floor.retainTrim = true;
  next.walls.forEach((wall) => {
    wall.primer = 'exclude';
  });
  next.services.forEach((service) => {
    service.enabled = false;
  });
  next.fulfilment = 'collection';
  return next;
}
