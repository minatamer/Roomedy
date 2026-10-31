import type { EstimateLine, EstimateState } from '@roomedy/contracts/estimates';
import { quantityVisual } from './quantity-visuals';

/** Recognize only app-owned boilerplate; an unfamiliar condition stays verbatim. */
export function sourceNote(text: string) {
  const rules: [RegExp, string, string][] = [
    [
      /^(?:Store|Example) listed price; confirm fit, variant, tax, delivery and availability\.(?: \d+(?:\.\d+)? L can\.)?$/,
      'Checkout',
      'Confirm variant, fit, stock, tax and delivery.',
    ],
    [
      /^Quantity calculated automatically from room measurements; planning measurements and product coverage still need confirmation\.$/,
      'Calculated quantity',
      'Review measurements and product coverage.',
    ],
    [
      /^Visitor-entered quantity; supplier coverage and fit still need confirmation\.$/,
      'Entered quantity',
      'Confirm coverage and fit with the supplier.',
    ],
    [
      /^Product source is recorded with your selected product\.$/,
      'Product link',
      'Use the recorded store page.',
    ],
    [
      /^(?:Product coverage|Visitor coverage|Planning coverage assumption): \d+(?:\.\d+)? m² per pack\. Confirm with the supplier\.$/,
      'Pack coverage',
      'Review the coverage shown in Quantity details.',
    ],
    [
      /^(?:Product yield|Visitor yield|Planning yield assumption): \d+(?:\.\d+)? m²\/L\/coat\. (?:Listed|Visitor|Assumed) can size: \d+(?:\.\d+)? L\. Confirm with the supplier\.$/,
      'Paint coverage',
      'Review the yield and can size in Quantity details.',
    ],
  ];
  const found = rules.find(([pattern]) => pattern.test(text));
  return found
    ? { known: true, title: found[1], detail: found[2] }
    : { known: false, title: 'Recorded note', detail: text };
}

/** A lossless table projection of the listed-paint engine's own saved wall notes. */
export function listedWallNote(text: string) {
  const match =
    /^(north|east|south|west): (\d+(?:\.\d+)?) m² net after openings × (\d+) coat\(s\)\.$/.exec(
      text,
    );
  return match
    ? { wall: match[1]!, area: match[2]!, coats: Number(match[3]) }
    : null;
}
export function listedEvidence(line: EstimateLine, pricing: EstimateState) {
  const visual = quantityVisual(line, pricing),
    walls = line.notes.map(listedWallNote).filter((wall) => wall !== null),
    targets = line.targets.flatMap((t) =>
      t.kind === 'surface' && t.surface !== 'floor' ? [t.surface] : [],
    ),
    validWalls =
      walls.every(
        (wall) =>
          targets.includes(wall.wall as (typeof targets)[number]) &&
          pricing.settings.walls.some(
            (s) => s.wall === wall.wall && s.coats === wall.coats,
          ),
      ) && new Set(walls.map((w) => w.wall)).size === walls.length;
  const summary =
    line.pricing === 'listed' &&
    visual.unitPriceMinor !== null &&
    !visual.manual &&
    (visual.kind === 'other' ||
      visual.tiles.every((t) => t.quantity !== null)) &&
    validWalls &&
    (visual.kind !== 'paint' || walls.length === targets.length) &&
    line.notes.every(
      (note) => sourceNote(note).known || listedWallNote(note) !== null,
    );
  return { summary, walls: summary ? walls : [] };
}

/** Known scope sentences become concise review facts; additions never disappear. */
export function sourceScope(assumptions: readonly string[]) {
  const exclusions: string[] = [],
    checks: { title: string; detail: string }[] = [],
    other: string[] = [];
  let oneRoom = false;
  for (const text of assumptions) {
    if (
      text ===
      'Materials and furniture only. Installation, site preparation, primer, underlay, trims, delivery and logistics are excluded.'
    )
      exclusions.push(
        'Installation & site prep',
        'Primer, underlay & trims',
        'Delivery & logistics',
      );
    else if (
      text ===
      'Selected replacement materials may differ from the rendered finish, which is unchanged.'
    )
      checks.push({
        title: 'Product & design',
        detail: 'Selected finishes may differ from the room rendering.',
      });
    else if (
      text ===
      'Missing geometry uses editable planning estimates, never confirmed measurements.'
    )
      checks.push({
        title: 'Measurements',
        detail: 'Planning dimensions still need confirmation.',
      });
    else if (
      text ===
      'This estimates the selected scope for one existing rectangular room; structural work and hidden defects are excluded.'
    ) {
      oneRoom = true;
      exclusions.push('Structural work & hidden defects');
    } else if (
      text ===
      'Pack coverage, coats, yields, work rates and site conditions need supplier/site review. A priced estimate is not a fit or installation certification.'
    )
      checks.push({
        title: 'Supplier & site',
        detail:
          'Confirm coverage, coats, rates and site conditions; planning only.',
      });
    else if (
      text ===
      'Only enabled service scopes are included. Source age, availability and quantity uncertainty are separate.'
    )
      checks.push({
        title: 'Service scope',
        detail:
          'Only selected services; check source date, stock and quantities separately.',
      });
    else other.push(text);
  }
  return { exclusions, checks, other, oneRoom };
}
