import { sourcingBriefSchema } from '@roomedy/contracts/sourcing';
import { localitySchema } from '@roomedy/contracts/estimates';
import { sampleEstimateOffers } from '@roomedy/spatial';
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
    locality = l.data;
  const url =
    brief.kind === 'furniture'
      ? `https://www.ikea.com/eg/en/search/?q=${encodeURIComponent(brief.category ?? brief.label)}`
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
  if (
    offer &&
    (locality.country !== offer.market.country ||
      locality.city.toLowerCase() !== offer.market.city.toLowerCase() ||
      locality.currency !== offer.market.currency)
  )
    offer = null;
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
    label: `Authored ${brief.label} option`,
    match: offer ? 'similar' : 'lead',
    url,
    evidence:
      'Authored example; use this link to research actual products and prices.',
    conditions: offer ? 'standard' : 'unknown',
    differences: [
      'A generic room representation is not an exact merchant product.',
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
