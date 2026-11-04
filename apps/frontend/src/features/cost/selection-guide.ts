import type { RoomDocument } from '@roomedy/contracts/room';
import type { SourcingCandidate } from '@roomedy/contracts/sourcing';
import { shoppingCountries } from '@roomedy/contracts/estimates';
import { roomSurfaceDetail } from '@roomedy/contracts/surfaces';
import type { ProductChoice } from '@roomedy/contracts/estimates';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import type { MarketEntry } from './conversation';
import { INITIAL_PRODUCT_GUIDE } from './conversation';
export { INITIAL_PRODUCT_GUIDE } from './conversation';
import type { CostDraft } from './state';
import { validatedCost } from './state';
import { marketTargets } from './market-research';
import { currentProductChoices, allProductsChosen } from './product-choices';
import {
  attachOffer,
  chooseProduct,
  productChosen,
  prepareProductChoice,
} from './attach-offer';
import { selectedPriceInputs } from './listed-prices';
import { productChoices } from './source-card';

export interface ProductGuide {
  stage: 'ready' | 'choosing' | 'done';
  key: string | null;
  reviewedKeys?: string[];
  passId?: number;
  mode?: 'manual' | 'automatic';
}
export type GuideAction = 'start' | 'next' | 'auto' | 'review';
export function guideIntent(text: string): GuideAction | null {
  const value = text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, '')
    .replace(/^(?:(?:can|could|will) you )?(?:please )?/, '')
    .replace(/,?\s+please$/, '');
  if (/^(?:next|next item|continue choosing|skip for now)$/.test(value))
    return 'next';
  if (
    /^(?:start choosing|let[’']s start choosing|show the first item)$/.test(
      value,
    )
  )
    return 'start';
  if (
    /^(?:choose (?:the rest|everything|products|options|available options) for me|choose for me|pick (?:the rest )?for me)$/.test(
      value,
    )
  )
    return 'auto';
  if (/^(?:review (?:my )?choices|change (?:my )?choices)$/.test(value))
    return 'review';
  return null;
}
export function guideView(
  room: RoomDocument,
  draft: CostDraft,
  entries: MarketEntry[],
  guide = INITIAL_PRODUCT_GUIDE,
) {
  const targets = marketTargets(room),
    queue = [
      ...targets.map(
        (target) =>
          entries.find(
            (entry) =>
              entry.target.key === target.key &&
              entry.target.brief.kind === 'primer',
          )?.target ?? target,
      ),
      ...entries
        .filter(
          (entry) =>
            entry.target.group === 'Services' &&
            !targets.some((target) => target.key === entry.target.key),
        )
        .map((entry) => entry.target),
    ],
    available = queue.filter((target) =>
      entries.some((entry) => entry.target.key === target.key),
    ),
    chosen = new Set(
      currentProductChoices(room, draft).map((choice) => choice.key),
    ),
    financialComplete = allProductsChosen(room, draft),
    reviewed = new Set(
      (
        guide.reviewedKeys ?? (guide.stage === 'done' ? [...chosen] : [])
      ).filter(
        (key) =>
          !targets.some((target) => target.key === key) || chosen.has(key),
      ),
    ),
    complete =
      financialComplete && targets.every((target) => reviewed.has(target.key)),
    active =
      queue.find((target) => target.key === guide.key) ??
      queue.find((target) => !reviewed.has(target.key)) ??
      queue[0],
    index = queue.findIndex((target) => target.key === active?.key),
    next = [...queue.slice(index + 1), ...queue.slice(0, index)].find(
      (target) => !reviewed.has(target.key),
    );
  return {
    targets,
    queue,
    available,
    active,
    next,
    chosen,
    complete,
    financialComplete,
    reviewed,
    stage:
      guide.stage === 'done' && !complete ? ('ready' as const) : guide.stage,
  };
}
/** Completing one card advances the current pass, independent of saved prices. */
export function advanceGuide(
  room: RoomDocument,
  draft: CostDraft,
  entries: MarketEntry[],
  guide: ProductGuide,
  key: string,
) {
  const reviewedKeys = [...new Set([...(guide.reviewedKeys ?? []), key])].slice(
    -64,
  );
  const updated = { ...guide, reviewedKeys, key };
  const view = guideView(room, draft, entries, updated);
  const next = view.next;
  return {
    complete: view.complete,
    next,
    guide: {
      ...updated,
      stage: view.complete ? ('done' as const) : ('choosing' as const),
      key: view.complete ? null : (next?.key ?? key),
    },
  };
}
export function chooseGuidedProduct(
  controller: SessionController,
  entries: MarketEntry[],
  entry: MarketEntry,
  candidate: SourcingCandidate,
  guide: ProductGuide,
) {
  const before = controller.getSnapshot();
  const fail = (reason: string) => ({ ok: false as const, reason });
  if (
    !before.workspace ||
    !before.cost ||
    before.destination !== 'cost' ||
    before.pending ||
    before.candidate ||
    !entryIsCurrent(entry, before) ||
    entry.update.kind !== 'answer' ||
    !entry.update.answer.ok
  )
    return fail('These options belong to an earlier design or estimate.');
  const alreadySelected = productChosen(
    before.workspace.current,
    before.cost,
    entry.target.brief,
    candidate,
  );
  const wasComplete = allProductsChosen(before.workspace.current, before.cost);
  const passId =
    (wasComplete ? before.cost.messages.at(-1)?.id : guide.passId) ??
    before.cost.messages.at(-1)?.id ??
    1;
  if (alreadySelected)
    return {
      ok: true as const,
      revision: before.cost.revision,
      passId,
      guide,
      complete: wasComplete,
      next: guideView(before.workspace.current, before.cost, entries, guide)
        .next,
    };
  const result = chooseProduct(
    controller,
    entry.target.brief,
    candidate,
    before.cost.revision,
    before.workspace.current.roomRevision,
    entry.update.answer.simulation,
    entry.target.matchingWalls,
    false,
  );
  if (!result.ok) return result;
  const current = controller.getSnapshot();
  const progress = advanceGuide(
    current.workspace!.current,
    current.cost!,
    entries,
    { ...guide, passId },
    entry.target.key,
  );
  const complete = allProductsChosen(current.workspace!.current, current.cost!);
  if (complete) controller.completeProductChoices(passId);
  return {
    ok: true as const,
    revision: current.cost!.revision,
    passId,
    ...progress,
    complete,
    guide: complete
      ? { ...progress.guide, stage: 'done' as const, key: null }
      : progress.guide,
  };
}
export function entryIsCurrent(entry: MarketEntry, state: SessionSnapshot) {
  return (
    entry.generation === state.generation &&
    entry.workspaceId === state.workspace?.workspaceId &&
    entry.roomRevision === state.workspace?.current.roomRevision &&
    entry.costRevision === state.cost?.revision
  );
}
/** Delegation changes presentation only; restored mode never grants an operation. */
export function visibleMarketEntries(
  room: RoomDocument,
  draft: CostDraft,
  entries: MarketEntry[],
  guide: ProductGuide,
) {
  const automatic =
    guide.mode === 'automatic' ||
    (!guide.mode &&
      guideIntent(
        draft.messages.find((message) => message.id === guide.passId)?.text ??
          '',
      ) === 'auto');
  if (!automatic) return entries;
  const chosen = new Set(
    currentProductChoices(room, draft).map((choice) => choice.key),
  );
  return entries.filter((entry) => !chosen.has(entry.target.key));
}
function recommendations(
  entry: MarketEntry,
  room: RoomDocument,
  draft: CostDraft,
) {
  const answer = entry.update.kind === 'answer' ? entry.update.answer : null;
  if (
    !answer?.ok ||
    entry.target.brief.kind === 'primer' ||
    entry.target.brief.kind === 'service'
  )
    return [];
  const candidates = productChoices(answer.reply.candidates).filter(
    (candidate) => {
      const offer = candidate.offer,
        target = entry.target.brief.target;
      if (offer && offer.kind !== entry.target.brief.kind) return false;
      if (
        offer?.kind === 'furniture' &&
        offer.category !== entry.target.brief.category
      )
        return false;
      if (offer?.availability === 'unavailable') return false;
      if (
        offer?.kind === 'paint' &&
        target.kind === 'surface' &&
        ((offer.colour !== 'tint-allowance' &&
          offer.colour !== entry.target.brief.colour) ||
          offer.sheen !== roomSurfaceDetail(room.room, target.surface).sheen)
      )
        return false;
      return true;
    },
  );
  const rank = (candidate: SourcingCandidate) => {
    const offer = candidate.offer,
      listing = candidate.listing;
    const attached = attachOffer(room, draft, entry.target.brief, candidate).ok;
    const units =
      entry.target.brief.kind === 'furniture'
        ? ['item', 'each']
        : entry.target.brief.kind === 'floor'
          ? ['pack', 'm2']
          : ['can'];
    const listed =
      !!listing &&
      listing.currency === 'USD' &&
      shoppingCountries(draft.settings.locality.country).includes(
        listing.country,
      ) &&
      units.includes(listing.unit);
    const amount =
      listing?.priceMinor ??
      (offer && 'packs' in offer
        ? offer.packs[0]!.priceMinor
        : (offer?.priceMinor ?? Number.MAX_SAFE_INTEGER));
    const coverage =
      listing?.coverageMm2 ?? (offer?.kind === 'floor' ? offer.coverageMm2 : 0);
    const volume =
      listing?.volumeMl ??
      (offer && 'packs' in offer ? offer.packs[0]!.volumeMl : 0);
    return [
      candidate.conditions === 'standard' && (attached || listed) ? 0 : 1,
      candidate.conditions === 'standard' ? 0 : 1,
      candidate.match === 'custom' ? 0 : candidate.match === 'similar' ? 1 : 2,
      attached ? 0 : 1,
      coverage ? amount / coverage : volume ? amount / volume : amount,
    ];
  };
  return candidates
    .map((candidate, index) => ({ candidate, index, rank: rank(candidate) }))
    .sort((a, b) => {
      for (let i = 0; i < a.rank.length; i++) {
        const difference = a.rank[i]! - b.rank[i]!;
        if (difference) return difference;
      }
      return a.index - b.index;
    })
    .map((item) => item.candidate);
}
/** Explicit visitor automation only: stage supported choices, then one guarded commit. */
export function chooseRemainingProducts(
  controller: SessionController,
  entries: MarketEntry[],
  announceCompletion = true,
) {
  const state = controller.getSnapshot();
  const fail = (reason: string) => ({
    ok: false as const,
    reason,
    selected: [] as string[],
  });
  if (
    !state.workspace ||
    !state.cost ||
    state.destination !== 'cost' ||
    state.pending ||
    state.candidate ||
    !controller.checkExpiry()
  )
    return fail('Finish the current preview before choosing products.');
  const room = state.workspace.current,
    initial = state.cost;
  let staged = structuredClone(initial);
  const selected: string[] = [],
    inputs: ProductChoice[] = [];
  const existing = new Set(
    currentProductChoices(room, initial).map((choice) => choice.key),
  );
  for (const target of marketTargets(room)) {
    if (existing.has(target.key)) continue;
    const entry = entries.find(
      (entry) =>
        entry.target.key === target.key && entryIsCurrent(entry, state),
    );
    if (!entry) continue;
    if (entry.target.brief.kind !== target.brief.kind) continue;
    if (entry.update.kind !== 'answer' || !entry.update.answer.ok) continue;
    for (const candidate of recommendations(
      { ...entry, target },
      room,
      staged,
    )) {
      const prepared = prepareProductChoice(
        room,
        staged,
        target.brief,
        candidate,
        entry.update.answer.simulation,
        target.matchingWalls,
      );
      if (!prepared.ok) continue;
      const choices = [
        ...(staged.productChoices ?? []).filter(
          (choice) => choice.key !== target.key,
        ),
        prepared.choice,
      ];
      const settings = prepared.settings;
      settings.selectedPrices = selectedPriceInputs(room, {
        ...staged,
        settings,
        offers: prepared.offers,
        productChoices: choices,
      });
      const cost = validatedCost(room, settings, prepared.offers);
      if (!cost) continue;
      staged = {
        ...staged,
        settings: cost.settings,
        offers: cost.offers,
        productChoices: choices,
      };
      selected.push(target.key);
      inputs.push(prepared.choice);
      break;
    }
  }
  if (!selected.length)
    return fail(
      'No usable product options are available for the remaining items yet.',
    );
  if (
    !controller.chooseCostProducts(
      staged.settings,
      staged.offers,
      inputs,
      initial.revision,
      room.roomRevision,
      announceCompletion,
    )
  )
    return fail(
      'These options changed. Review the current room before choosing.',
    );
  return {
    ok: true as const,
    selected,
    revision: controller.getSnapshot().cost!.revision,
  };
}
