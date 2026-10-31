import type { RoomDocument } from '@roomedy/contracts/room';
import type {
  SourcingBrief,
  SourcingCandidate,
} from '@roomedy/contracts/sourcing';
import type { CostDraft } from './state';
import { findCatalogueEntry, calculateRoomEstimate } from '@roomedy/spatial';
import { roomSurface, roomSurfaceDetail } from '@roomedy/contracts/surfaces';
import type { SessionController } from '../session/controller';
import {
  shoppingCountries,
  productChoiceSchema,
} from '@roomedy/contracts/estimates';
import type { EstimateOffer } from '@roomedy/contracts/estimates';
import { sourcingCandidateSchema } from '@roomedy/contracts/sourcing';
import { productChoiceScope, currentProductChoices } from './product-choices';
import { money } from './state';
import { marketTargets } from './market-research';

export function productChosen(
  room: RoomDocument,
  draft: CostDraft,
  brief: SourcingBrief,
  candidate: SourcingCandidate,
) {
  const key =
    brief.target.kind === 'furniture'
      ? brief.target.id
      : brief.target.kind === 'surface'
        ? `surface:${brief.target.surface}`
        : '';
  return currentProductChoices(room, draft).some(
    (choice) =>
      choice.key === key &&
      choice.url === candidate.url &&
      choice.offerId === (candidate.offer?.id ?? null) &&
      choice.label === candidate.label,
  );
}
/** A preference is not a quote. Apply a price only through the unchanged quote guards. */
export function chooseProduct(
  controller: SessionController,
  brief: SourcingBrief,
  raw: SourcingCandidate,
  costRevision: number,
  roomRevision: number,
  simulation: boolean,
  matchingWalls = false,
  announceCompletion = true,
) {
  if (brief.target.kind === 'service' || brief.kind === 'primer')
    return selectOffer(
      controller,
      brief,
      raw,
      costRevision,
      roomRevision,
      matchingWalls,
    );
  const state = controller.getSnapshot();
  if (
    !state.workspace ||
    !state.cost ||
    state.destination !== 'cost' ||
    state.pending ||
    state.candidate ||
    state.cost.revision !== costRevision ||
    state.workspace.current.roomRevision !== roomRevision
  )
    return {
      ok: false as const,
      reason: 'These options belong to an earlier design or estimate.',
    };
  const prepared = prepareProductChoice(
    state.workspace.current,
    state.cost,
    brief,
    raw,
    simulation,
    matchingWalls,
  );
  if (!prepared.ok) return prepared;
  return controller.chooseCostProduct(
    prepared.settings,
    prepared.offers,
    prepared.choice,
    costRevision,
    roomRevision,
    announceCompletion,
  )
    ? { ok: true as const }
    : {
        ok: false as const,
        reason:
          'Resolve the current preview or refresh these options before choosing.',
      };
}
/** Prepare a preference without changing a session; shared by manual and explicit batch choice. */
export function prepareProductChoice(
  room: RoomDocument,
  draft: CostDraft,
  brief: SourcingBrief,
  raw: SourcingCandidate,
  simulation: boolean,
  matchingWalls = false,
) {
  const fail = (reason: string) => ({ ok: false as const, reason });
  if (brief.target.kind === 'service' || brief.kind === 'primer')
    return fail('Choose this quote individually.');
  const candidate = sourcingCandidateSchema.safeParse(raw);
  if (!candidate.success) return fail('This product needs a valid source.');
  const key =
    brief.target.kind === 'furniture'
      ? brief.target.id
      : `surface:${brief.target.surface}`;
  const target = marketTargets(room).find((target) => target.key === key);
  if (
    !target ||
    JSON.stringify({ ...target.brief, query: '' }) !==
      JSON.stringify({ ...brief, query: '' })
  )
    return fail(
      'This product target has changed. Find options for the current item.',
    );
  const c = candidate.data;
  const attached = attachOffer(room, draft, brief, c);
  const settings = attached.ok
    ? attached.settings
    : structuredClone(draft.settings);
  const selectedTarget = brief.target;
  const wallSurface =
    selectedTarget.kind === 'surface' && selectedTarget.surface !== 'floor'
      ? selectedTarget.surface
      : null;
  const walls = wallSurface
    ? settings.walls.filter(
        (wall) =>
          wall.wall === wallSurface ||
          ((matchingWalls || target.matchingWalls) &&
            roomSurface(room.room, wall.wall).color ===
              roomSurface(room.room, wallSurface).color &&
            roomSurface(room.room, wall.wall).texture ===
              roomSurface(room.room, wallSurface).texture &&
            roomSurfaceDetail(room.room, wall.wall).sheen ===
              roomSurfaceDetail(room.room, wallSurface).sheen),
      )
    : [];
  if (!attached.ok) {
    if (brief.target.kind === 'furniture') {
      const id = brief.target.id;
      const item = settings.furniture.find((item) => item.id === id)!;
      item.mode = 'buy';
      item.offerId = null;
      item.components.forEach((part) => {
        part.mode = 'buy';
        part.offerId = null;
      });
    } else if (brief.target.surface === 'floor') {
      settings.floor.enabled = true;
      settings.floor.offerId = null;
    }
  }
  for (const wall of walls) {
    wall.enabled = true;
    wall.paintOfferId = attached.ok ? c.offer!.id : null;
  }
  const referencePrice = c.listing
    ? `${money(c.listing.priceMinor, c.listing.currency)} / ${c.listing.volumeMl ? `${c.listing.volumeMl / 1000} L` : c.listing.unit}`
    : c.offer && 'packs' in c.offer
      ? c.offer.packs
          .map(
            (pack) =>
              `${pack.volumeMl / 1000} L: ${money(pack.priceMinor, c.offer!.market.currency)}`,
          )
          .join(' · ')
      : c.offer
        ? `${money(c.offer.priceMinor, c.offer.market.currency)} / ${c.offer.kind === 'floor' ? 'pack' : c.offer.kind === 'service' ? c.offer.basis : 'item'}`
        : null;
  const quotedPrice = referencePrice
    ? `${c.conditions === 'from' ? 'From ' : c.conditions === 'conditional' ? 'Conditional ' : ''}${referencePrice}`
    : null;
  const parsedChoice = productChoiceSchema.safeParse({
    key,
    scope: productChoiceScope(room, draft, key),
    label: c.label,
    url: c.url,
    imageUrl: c.imageUrl ?? null,
    simulation,
    offerId: c.offer?.id ?? null,
    quotedPrice,
    ...(c.listing
      ? {
          listingPrice: {
            priceMinor: c.listing.priceMinor,
            currency: c.listing.currency,
            country: c.listing.country,
            unit: c.listing.unit,
            volumeMl: c.listing.volumeMl,
            unavailable: c.offer?.availability === 'unavailable',
            coverageMm2:
              c.listing.coverageMm2 ??
              (c.offer?.kind === 'floor' && c.offer.source.url === c.url
                ? c.offer.coverageMm2
                : null),
            coverageMm2PerLitre:
              c.listing.coverageMm2PerLitre ??
              (c.offer?.kind === 'paint' && c.offer.source.url === c.url
                ? c.offer.coverageMm2PerLitre
                : null),
          },
        }
      : c.offer
        ? {
            listingPrice: {
              priceMinor:
                'packs' in c.offer
                  ? c.offer.packs[0]!.priceMinor
                  : c.offer.priceMinor,
              currency: c.offer.market.currency,
              country: c.offer.market.country,
              unit:
                c.offer.kind === 'floor'
                  ? ('pack' as const)
                  : 'packs' in c.offer
                    ? ('can' as const)
                    : ('item' as const),
              volumeMl: 'packs' in c.offer ? c.offer.packs[0]!.volumeMl : null,
              unavailable: c.offer.availability === 'unavailable',
              coverageMm2:
                c.offer.kind === 'floor' ? c.offer.coverageMm2 : null,
              coverageMm2PerLitre:
                c.offer.kind === 'paint' ? c.offer.coverageMm2PerLitre : null,
            },
          }
        : {}),
  });
  if (!parsedChoice.success)
    return fail('This product needs a current price and source.');
  return {
    ok: true as const,
    settings,
    offers: attached.ok ? attached.offers : draft.offers,
    choice: parsedChoice.data,
  };
}
export function sourceSizeNeedsReview(
  brief: SourcingBrief,
  offer: EstimateOffer | null,
) {
  if (offer?.kind !== 'furniture') return false;
  const size = offer.outerSizeMm;
  return (
    !size ||
    !brief.size ||
    (['width', 'depth', 'height'] as const).some(
      (axis) => brief.size![axis] !== size[axis],
    )
  );
}
export function sourceOfferSelected(
  draft: CostDraft,
  brief: SourcingBrief,
  id: string,
) {
  const target = brief.target,
    s = draft.settings;
  if (target.kind === 'furniture')
    return s.furniture.some(
      (f) => f.id === target.id && f.mode === 'buy' && f.offerId === id,
    );
  if (target.kind === 'service')
    return s.services.some(
      (service) =>
        service.scope === target.scope &&
        service.enabled &&
        service.offerId === id,
    );
  if (target.surface === 'floor')
    return s.floor.enabled && s.floor.offerId === id;
  return s.walls.some(
    (w) =>
      w.wall === target.surface &&
      w.enabled &&
      (brief.kind === 'primer'
        ? w.primer === 'include' && w.primerOfferId === id
        : w.paintOfferId === id),
  );
}
/** Recheck the captured source revision at the actual click, including rapid duplicate input. */
export function selectOffer(
  controller: SessionController,
  brief: SourcingBrief,
  candidate: SourcingCandidate,
  costRevision: number,
  roomRevision: number,
  matchingWalls = false,
) {
  const state = controller.getSnapshot();
  if (
    !state.workspace ||
    !state.cost ||
    state.cost.revision !== costRevision ||
    state.workspace.current.roomRevision !== roomRevision
  )
    return {
      ok: false as const,
      reason: 'This research belongs to an earlier design or cost scope.',
    };
  if (
    candidate.offer &&
    sourceOfferSelected(state.cost, brief, candidate.offer.id)
  )
    return { ok: false as const, reason: 'This price is already selected.' };
  const attached = attachOffer(
    state.workspace.current,
    state.cost,
    brief,
    candidate,
  );
  if (!attached.ok) return attached;
  if (
    matchingWalls &&
    brief.kind === 'paint' &&
    brief.target.kind === 'surface' &&
    brief.target.surface !== 'floor' &&
    candidate.offer?.kind === 'paint'
  ) {
    const room = state.workspace.current,
      surface = brief.target.surface;
    const original = roomSurface(room.room, surface),
      sheen = roomSurfaceDetail(room.room, surface).sheen;
    for (const wall of attached.settings.walls) {
      const finish = roomSurface(room.room, wall.wall);
      if (
        finish.color === original.color &&
        finish.texture === original.texture &&
        roomSurfaceDetail(room.room, wall.wall).sheen === sheen
      ) {
        wall.enabled = true;
        wall.paintOfferId = candidate.offer.id;
      }
    }
  }
  return controller.updateCost(attached.settings, attached.offers)
    ? { ok: true as const }
    : {
        ok: false as const,
        reason:
          'The price could not be selected. Your accepted estimate is unchanged.',
      };
}
/** Explicitly review a real product's outer size through normal visitor spatial validation. */
export function reviewSourceSize(
  controller: SessionController,
  brief: SourcingBrief,
  candidate: SourcingCandidate,
  revision: number,
  roomRevision: number,
) {
  const state = controller.getSnapshot(),
    offer = candidate.offer;
  if (
    !state.cost ||
    !state.workspace ||
    state.candidate ||
    state.cost.revision !== revision ||
    state.workspace.current.roomRevision !== roomRevision ||
    brief.target.kind !== 'furniture' ||
    offer?.kind !== 'furniture' ||
    !offer.outerSizeMm
  )
    return {
      ok: false as const,
      reason:
        'Research the current piece and resolve the current preview first.',
    };
  const actions = [
    {
      type: 'set-size-estimate' as const,
      id: brief.target.id,
      ...offer.outerSizeMm,
    },
  ];
  const preview = controller.previewVisitor(actions);
  if (!preview.ok)
    return {
      ok: false as const,
      reason:
        preview.code === 'locked'
          ? 'Dimensions are protected. Unlock the piece in Design if you want to change its size, then research again. Your room and price are unchanged.'
          : preview.code === 'unsupported-variant'
            ? 'This room model supports one size. Choose an adjustable model in Design to represent a different product size, then research again. Your room and price are unchanged.'
            : 'The product size does not pass the room checks. Review fit and measurements in Design before trying again. Your room and price are unchanged.',
    };
  const attached = attachOffer(preview.room, state.cost, brief, candidate);
  if (!attached.ok) return attached;
  const result = controller.prepareCostProposal(
    {
      settings: attached.settings,
      offers: attached.offers,
      budgetMinor: state.cost.budgetMinor,
    },
    `Use ${offer.label}`.slice(0, 120),
    [
      'Adopt the product’s outer size as a visitor planning estimate. This does not confirm a measured dimension or identify the mesh as this SKU.',
      'Review fit, components, delivery and remaining costs. Apply changes the design and estimate together; Undo restores both.',
    ],
    revision,
    actions,
  );
  return result.ok
    ? { ok: true as const }
    : {
        ok: false as const,
        reason: `The combined preview needs review (${result.code}).`,
      };
}
export function attachOffer(
  room: RoomDocument,
  draft: CostDraft,
  brief: SourcingBrief,
  candidate: SourcingCandidate,
) {
  const offer = candidate.offer;
  const fail = (reason: string) => ({ ok: false as const, reason });
  if (!offer || candidate.conditions !== 'standard')
    return fail(
      'This is a research lead. Review the source or try another product.',
    );
  if (
    !(offer.kind === 'service' || !draft.settings.demoScope
      ? offer.market.country === draft.settings.locality.country
      : shoppingCountries(draft.settings.locality.country).includes(
          offer.market.country,
        )) ||
    offer.market.currency !== draft.settings.locality.currency ||
    offer.availability === 'unavailable'
  )
    return fail(
      'This offer does not apply to the selected market, currency or availability.',
    );
  const settings = structuredClone(draft.settings),
    target = brief.target;
  if (offer.kind === 'furniture' && target.kind === 'furniture') {
    const piece = room.furniture.find((p) => p.id === target.id),
      item = settings.furniture.find((p) => p.id === target.id);
    if (
      !piece ||
      !item ||
      offer.category !==
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)?.category
    )
      return fail(
        'This furniture target or category has changed. Research the current piece.',
      );
    if (
      !offer.outerSizeMm ||
      (['width', 'depth', 'height'] as const).some(
        (axis) => offer.outerSizeMm![axis] !== piece.dimensions[axis].value,
      )
    )
      return fail(
        'The outer size differs or is missing. Review the dimensions in Design before using this price.',
      );
    item.mode = 'buy';
    item.offerId = offer.id;
    item.components = offer.components
      .filter((p) => p.required && !p.included)
      .map(
        (part) =>
          item.components.find((p) => p.key === part.key) ?? {
            key: part.key,
            mode: 'buy',
            offerId: null,
          },
      );
  } else if (
    offer.kind === 'floor' &&
    target.kind === 'surface' &&
    target.surface === 'floor'
  ) {
    if (
      draft.settings.demoScope !== 'materials' &&
      !['planks', 'wood'].includes(roomSurface(room.room, 'floor').texture)
    )
      return fail(
        'This click-floor system differs from the designed surface. Review the material in Design first.',
      );
    settings.floor.enabled = true;
    settings.floor.offerId = offer.id;
  } else if (
    (offer.kind === 'paint' || offer.kind === 'primer') &&
    target.kind === 'surface' &&
    target.surface !== 'floor'
  ) {
    const wall = settings.walls.find((w) => w.wall === target.surface)!;
    if (
      offer.kind === 'paint' &&
      offer.colour !== roomSurface(room.room, target.surface).color &&
      offer.source.kind === 'sourced'
    )
      return fail(
        'This colour or tinted variant needs a confirmed price before selecting it.',
      );
    wall.enabled = true;
    if (offer.kind === 'paint') wall.paintOfferId = offer.id;
    else {
      wall.primer = 'include';
      wall.primerOfferId = offer.id;
    }
  } else if (
    offer.kind === 'service' &&
    target.kind === 'service' &&
    offer.scope === target.scope &&
    target.scope !== 'delivery'
  ) {
    const service = settings.services.find((s) => s.scope === target.scope);
    if (!service) return fail('This service is outside the current estimate.');
    service.enabled = true;
    service.offerId = offer.id;
    if (offer.basis === 'hour') service.quantity = null;
  } else
    return fail(
      'This product or service does not match the selected room target.',
    );
  if (
    offer.kind !== 'service' &&
    !settings.deliveries.some((g) => g.group === offer.deliveryGroup)
  )
    settings.deliveries.push({ group: offer.deliveryGroup, offerId: null });
  // An explicit refresh creates a new immutable offer ID; it never overwrites another selection.
  const existing = draft.offers.find((o) => o.id === offer.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(offer))
    return fail('The offer identity changed. Research again before selecting.');
  const offers = existing ? draft.offers : [...draft.offers, offer];
  const calculated = calculateRoomEstimate(room, settings, offers);
  if (!calculated.ok)
    return fail(
      'The product units, system or work basis need review before selection.',
    );
  return { ok: true as const, settings, offers, estimate: calculated.estimate };
}
