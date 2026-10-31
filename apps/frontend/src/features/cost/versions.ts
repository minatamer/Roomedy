import { estimateVersionSchema } from '@roomedy/contracts/project';
import type { EstimateVersion } from '@roomedy/contracts/project';
import { CALCULATION_VERSION } from '@roomedy/contracts/estimates';
import type { EstimateState, RoomEstimate } from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { estimateStateSchema } from '@roomedy/contracts/estimates';
import { calculateRoomEstimate } from '@roomedy/spatial';
import { VERSIONS } from '@roomedy/contracts/policy';
import { costLineChanges } from './planning';
import type { SessionController } from '../session/controller';
import { pricingState } from './state';

/** Explicit PDF action freezes the current estimate without a user-facing naming/save step. */
export function ensureEstimateSnapshot(
  controller: SessionController,
): { ok: true; id: string } | { ok: false; reason: string } {
  const state = controller.getSnapshot();
  if (
    !controller.checkExpiry() ||
    !controller.canEdit() ||
    !state.workspace ||
    !state.cost ||
    state.candidate ||
    state.pending ||
    state.cost.settings.locality.currency !== 'USD'
  )
    return {
      ok: false,
      reason: 'Resolve the current preview and review a USD estimate first.',
    };
  // Saved versions are schema-normalized. Compare current inputs in that same
  // order so a semantically identical manual room does not consume another slot.
  const room = JSON.stringify(
      roomDocumentSchema.parse(state.workspace.current),
    ),
    pricing = JSON.stringify(
      estimateStateSchema.parse(pricingState(state.cost)),
    );
  const existing = state.estimateVersions.findLast(
    (version) =>
      JSON.stringify(version.room) === room &&
      JSON.stringify(version.pricing) === pricing,
  );
  return existing
    ? { ok: true, id: existing.id }
    : controller.saveEstimate(`Estimate ${state.estimateVersions.length + 1}`);
}
export function freezeVersion(version: EstimateVersion): EstimateVersion {
  const copy = estimateVersionSchema.parse(version);
  const freeze = (v: unknown): void => {
    if (v && typeof v === 'object') {
      Object.values(v).forEach(freeze);
      Object.freeze(v);
    }
  };
  freeze(copy);
  return copy;
}
export function captureVersion(
  room: RoomDocument,
  pricing: EstimateState,
  id: string,
  label: string,
  savedAt: number,
): EstimateVersion | null {
  const calculated = calculateRoomEstimate(
    room,
    pricing.settings,
    pricing.offers,
  );
  if (!calculated.ok) return null;
  const parsed = estimateVersionSchema.safeParse({
    id,
    label,
    savedAt,
    approval: 'consumer-planning',
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    calculationVersion: CALCULATION_VERSION,
    representationVersion: 'roomedy-cpq-1',
    room,
    pricing,
    estimate: calculated.estimate,
  });
  return parsed.success ? freezeVersion(parsed.data) : null;
}
/** Explain why the recorded inputs/results differ; no comparison rewrites either version. */
export function versionChanges(
  before: EstimateVersion,
  after: { room: RoomDocument; pricing: EstimateState; estimate: RoomEstimate },
) {
  const reasons: string[] = [],
    a = before.pricing,
    b = after.pricing;
  if (
    JSON.stringify({ ...before.room, roomRevision: 0 }) !==
    JSON.stringify({ ...after.room, roomRevision: 0 })
  )
    reasons.push('Design, measurements or their evidence changed.');
  if (
    JSON.stringify(a.settings.locality) !== JSON.stringify(b.settings.locality)
  )
    reasons.push(
      'Location or currency changed; totals in different currencies are not subtracted.',
    );
  if (JSON.stringify(a.settings) !== JSON.stringify(b.settings))
    reasons.push(
      'Selected scope, products, preparation, components, tax assumptions or logistics inputs changed.',
    );
  if (JSON.stringify(a.offers) !== JSON.stringify(b.offers))
    reasons.push(
      'Recorded products, rates, tax treatment, delivery or source evidence changed.',
    );
  if (JSON.stringify(a.productChoices) !== JSON.stringify(b.productChoices))
    reasons.push('Selected products changed.');
  const changes = costLineChanges(before.estimate, after.estimate);
  if (changes.removed.length || changes.added.length)
    reasons.push(
      'Calculated quantities, product lines, charges or unresolved costs changed; compare the removed and added lines below.',
    );
  if (a.budgetMinor !== b.budgetMinor)
    reasons.push('The planning budget changed.');
  return {
    reasons,
    ...changes,
    differenceMinor:
      before.estimate.locality.currency === after.estimate.locality.currency
        ? after.estimate.knownTotalMinor - before.estimate.knownTotalMinor
        : null,
  };
}
