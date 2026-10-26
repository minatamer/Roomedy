import type { EstimateState, RoomEstimate } from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
export interface WorkStep {
  title: string;
  detail: string;
  targets: string[];
  sources: { label: string; url: string }[];
}
/** Planning sequence, not site-specific installation instructions or a promised schedule. */
export function roomWorkPlan(
  room: RoomDocument,
  pricing: EstimateState,
  estimate: RoomEstimate,
) {
  const source = (kinds: string[]) =>
    pricing.offers
      .filter(
        (o) =>
          estimate.lines.some((l) => l.offerIds.includes(o.id)) &&
          kinds.includes(o.kind) &&
          o.source.kind === 'sourced' &&
          o.source.url,
      )
      .slice(0, 4)
      .map((o) => ({ label: o.label, url: o.source.url! }));
  const steps: WorkStep[] = [
    {
      title: 'Confirm the room and scope',
      detail: `Check measurements, openings, access, retained pieces and site condition before ordering. ${estimate.unpricedCount} unresolved estimate lines still need review. Unknown measurements are not confirmed by this plan.`,
      targets: [],
      sources: [],
    },
    {
      title: 'Check products and book the right work',
      detail:
        'Confirm variants, stock, taxes, delivery grouping and service inclusions with each supplier. Check official product installation and safety instructions. Supplier availability, crew time and lead times need confirmation.',
      targets: [],
      sources: [],
    },
    {
      title: 'Clear and protect',
      detail:
        'Arrange the selected within-home moving scope, protection and disposal. Between-address relocation, stairs, parking, lifting and access need a separate local assessment when relevant.',
      targets: room.furniture
        .filter((p) => p.ownership === 'owned')
        .map((p) => p.id)
        .slice(0, 8),
      sources: source(['service']),
    },
  ];
  const walls = pricing.settings.walls.filter((w) => w.enabled);
  if (walls.length)
    steps.push({
      title: 'Prepare and paint the selected walls',
      detail:
        'Review substrate repairs and primer decisions before topcoats. Keep the selected coats and purchased cans. Follow the exact manufacturer’s preparation, drying, recoat and curing instructions; these times are not known from room geometry. Coordinate finish order with the installer and protect completed surfaces.',
      targets: walls.map((w) => `surface:${w.wall}`),
      sources: source(['paint', 'primer']),
    });
  if (pricing.settings.floor.enabled)
    steps.push({
      title: 'Prepare and fit the floor system',
      detail:
        'Confirm subfloor condition, moisture, levels and product suitability with the installer. Check the selected system’s underlay, trim, expansion, acclimatisation and installation requirements in its actual instructions. Unsupported systems remain an assessment, with no inferred click-floor method.',
      targets: ['surface:floor'],
      sources: source(['floor', 'underlay', 'trim']),
    });
  const buys = pricing.settings.furniture.filter((f) => f.mode === 'buy');
  if (buys.length)
    steps.push({
      title: 'Receive, assemble and position',
      detail:
        'Check outer dimensions, included bases/components and delivery access before ordering. Confirm assembly and any wall mounting or fixing assessment. Move furniture in after finishes are ready according to product instructions; there is no assumed cure date.',
      targets: buys.map((f) => f.id).slice(0, 8),
      sources: source(['furniture', 'component']),
    });
  steps.push({
    title: 'Review the finished room',
    detail:
      'Check the work, retain product instructions and receipts, resolve remaining costs and confirm cleanup/disposal. The estimate is a planning record; ordering, booking and supplier acceptance happen separately.',
    targets: [],
    sources: [],
  });
  const shopping = estimate.lines
    .filter(
      (l) =>
        l.purchased &&
        l.offerIds.length &&
        l.category !== 'tax' &&
        l.amountMinor !== 0,
    )
    .map((l) => ({
      label: l.label,
      quantity: l.quantity ?? l.purchased!,
      purchased: l.purchased!,
      packs: l.packs,
      targets: l.targets,
      offerIds: l.offerIds,
    }));
  return { steps, shopping };
}
