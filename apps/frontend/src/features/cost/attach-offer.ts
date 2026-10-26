import type { RoomDocument } from '@roomedy/contracts/room';
import type {
  SourcingBrief,
  SourcingCandidate,
} from '@roomedy/contracts/sourcing';
import type { CostDraft } from './state';
import { findCatalogueEntry, calculateRoomEstimate } from '@roomedy/spatial';
import { roomSurface } from '@roomedy/contracts/surfaces';
import type { SessionController } from '../session/controller';
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
  return controller.updateCost(attached.settings, attached.offers)
    ? { ok: true as const }
    : {
        ok: false as const,
        reason:
          'The price could not be selected. Your accepted estimate is unchanged.',
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
      'This is a research lead. Review the missing specification or enter a manual allowance.',
    );
  if (
    offer.market.country !== draft.settings.locality.country ||
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
    if (!['planks', 'wood'].includes(roomSurface(room.room, 'floor').texture))
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
    if (!service) return fail('Add this scope as a reviewed manual allowance.');
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
