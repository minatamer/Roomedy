import { sourcingBriefSchema } from '@roomedy/contracts/sourcing';
import { localitySchema } from '@roomedy/contracts/estimates';
import { sampleEstimateOffers } from '@roomedy/spatial';
import { shoppingCountries } from '@roomedy/contracts/estimates';
import type {
  ProviderRequest,
  ProviderOutcome,
} from '../providers/provider.js';
/** Authored wire fixture, with public discovery links and zero merchant-price assertions. */
export async function sourcingFakeResponse(
  request: ProviderRequest,
  signal: AbortSignal,
): Promise<ProviderOutcome> {
  if (signal.aborted) return { kind: 'cancelled' };
  const content = request.input[0]?.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    return { kind: 'malformed' };
  let raw: unknown;
  try {
    raw = JSON.parse(content[0].text);
  } catch {
    return { kind: 'malformed' };
  }
  if (!raw || typeof raw !== 'object') return { kind: 'malformed' };
  const b = sourcingBriefSchema.safeParse(
      (raw as Record<string, unknown>).brief,
    ),
    l = localitySchema.safeParse((raw as Record<string, unknown>).locality);
  if (!b.success || !l.success) return { kind: 'malformed' };
  const brief = b.data,
    locality =
      l.data.country === 'ZZ'
        ? { ...l.data, country: 'US', city: 'Example shopping market' }
        : l.data;
  const ikeaRegion =
    locality.country === 'US'
      ? 'us/en'
      : shoppingCountries(locality.country).includes('DE')
        ? 'gb/en'
        : 'eg/en';
  const photos: Record<string, string> = {
    bed: 'https://www.ikea.com/us/en/images/products/kleppstad-bed-frame-white-vissle-beige__1035340_pe840527_s5.jpg',
    wardrobe:
      'https://www.ikea.com/us/en/images/products/kleppstad-wardrobe-with-3-doors-white__0753594_pe748782_s5.jpg',
    desk: 'https://www.ikea.com/us/en/images/products/micke-desk-white__0736018_pe740345_s5.jpg',
  };
  // Real destinations for playful US examples, never merchant quotes or fit evidence.
  const ikeaProducts: Record<string, string> = {
    bed: 'kleppstad-bed-frame-white-vissle-beige-00492682',
    desk: 'micke-desk-white-80213074',
    chair: 'flintan-office-chair-black-90489029',
    wardrobe: 'kleppstad-wardrobe-with-3-doors-white-20441757',
    storage: 'billy-bookcase-white-50522040',
    mirror: 'nissedal-mirror-white-90503775',
    seating: 'glostad-loveseat-knisa-dark-gray-70489011',
    table: 'lack-side-table-white-30449908',
    lighting: 'tertial-work-lamp-dark-gray-20355434',
  };
  const product = brief.category && ikeaProducts[brief.category];
  const url =
    brief.kind === 'furniture'
      ? ikeaRegion === 'us/en' && product
        ? `https://www.ikea.com/us/en/p/${product}/`
        : `https://www.ikea.com/${ikeaRegion}/search/?q=${encodeURIComponent(brief.category ?? brief.label)}`
      : brief.kind === 'paint' || brief.kind === 'primer'
        ? 'https://www.jotun.com/eg-en/decorative/interior'
        : `https://www.google.com/search?q=${encodeURIComponent(`${brief.label} ${locality.city} ${locality.country}`)}`;
  let offer =
    sampleEstimateOffers().find(
      (o) =>
        o.kind === brief.kind &&
        (o.kind !== 'furniture' || o.category === brief.category) &&
        (o.kind !== 'service' ||
          (brief.target.kind === 'service' && o.scope === brief.target.scope)),
    ) ?? null;
  if (offer && locality.currency === 'USD')
    offer = { ...offer, market: { ...locality } };
  else offer = null;
  if (
    offer?.kind === 'furniture' &&
    brief.size &&
    Object.values(brief.size).every((v) => v !== null)
  )
    offer = {
      ...offer,
      outerSizeMm: brief.size as {
        width: number;
        depth: number;
        height: number;
      },
    };
  if ((offer?.kind === 'paint' || offer?.kind === 'primer') && brief.colour)
    offer = { ...offer, colour: brief.colour };
  const first = {
    label: `Example ${brief.label} option`.slice(0, 96),
    match: offer ? 'similar' : 'lead',
    url,
    imageUrl:
      brief.kind === 'furniture'
        ? (photos[brief.category ?? ''] ?? null)
        : null,
    evidence:
      'Authored example; use this link to research actual products and prices.',
    conditions: offer ? 'standard' : 'unknown',
    differences: [
      brief.kind === 'furniture'
        ? 'IKEA reference only. The example price and dimensions do not describe the linked product.'
        : 'A generic room representation is not an exact merchant product.',
    ],
    offer,
  };
  const candidates: unknown[] = [first];
  if (
    offer?.kind === 'furniture' &&
    offer.outerSizeMm &&
    offer.outerSizeMm.width <= 9900
  )
    candidates.push({
      ...first,
      label: 'Wider alternative · size review',
      differences: [
        '100 mm wider than your design; review dimensions before selecting.',
      ],
      offer: {
        ...offer,
        outerSizeMm: {
          ...offer.outerSizeMm,
          width: offer.outerSizeMm.width + 100,
        },
        priceMinor: offer.priceMinor + 10000,
      },
    });
  candidates.push({
    label: `Explore more ${brief.label.toLowerCase()} options`.slice(0, 96),
    match: 'lead',
    url: shoppingCountries(locality.country).includes('EG')
      ? `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(brief.label)}`
      : `https://www.amazon.${shoppingCountries(locality.country).includes('DE') ? 'co.uk' : 'com'}/s?k=${encodeURIComponent(brief.label)}`,
    imageUrl: null,
    evidence: 'Discovery link only. No price, stock or delivery was checked.',
    conditions: 'unknown',
    differences: ['Review the current store listing.'],
    offer: null,
  });
  return {
    kind: 'completed',
    data: {
      candidates,
      notes: [
        'Example prices and specifications are authored. No merchant page or local availability was checked.',
      ],
    },
    calls: [],
  };
}
