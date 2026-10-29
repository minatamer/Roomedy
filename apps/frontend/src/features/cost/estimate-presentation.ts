import type {
  EstimateLine,
  EstimateQuantity,
  RoomEstimate,
} from '@roomedy/contracts/estimates';
import { quantity } from './state';

export function paintCoverage(note: string) {
  const match =
    /^(north|east|south|west): (\d+) paint coat\(s\); (\d+)\/(\d+) m² net\.$/.exec(
      note,
    );
  if (!match) return null;
  const numerator = Number(match[3]),
    denominator = Number(match[4]);
  if (
    !Number.isSafeInteger(numerator) ||
    !Number.isSafeInteger(denominator) ||
    denominator <= 0
  )
    return null;
  return {
    wall: match[1]![0]!.toUpperCase() + match[1]!.slice(1),
    coats: Number(match[2]),
    area: new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(
      numerator / denominator,
    ),
  };
}
/** Display formatting only. Canonical calculation/source notes remain byte-for-byte intact. */
export function readableEstimateNote(note: string) {
  const coverage = paintCoverage(note);
  return coverage
    ? `${coverage.wall} wall: ${coverage.area} m² net · ${coverage.coats} ${coverage.coats === 1 ? 'coat' : 'coats'}.`
    : note;
}
export function humanQuantity(q: EstimateQuantity | null) {
  const text = quantity(q);
  return q &&
    q.numerator !== q.denominator &&
    ['can', 'pack', 'item', 'job', 'hour', 'minute'].includes(q.unit)
    ? text + 's'
    : text;
}
export function estimateGroups(estimate: RoomEstimate) {
  const names: Record<EstimateLine['category'], string> = {
    furniture: 'Furniture',
    floor: 'Flooring',
    walls: 'Walls',
    services: 'Services',
    delivery: 'Delivery',
    tax: 'Tax',
    allowance: 'Allowances',
  };
  return (
    [
      'furniture',
      'floor',
      'walls',
      'services',
      'delivery',
      'tax',
      'allowance',
    ] as const
  ).flatMap((category) => {
    const lines = estimate.lines.filter((line) => line.category === category);
    return lines.length
      ? [
          {
            category,
            label: names[category],
            lines,
            known: lines.reduce(
              (sum, line) => sum + (line.amountMinor ?? 0),
              0,
            ),
            unpriced: lines.filter((line) => line.amountMinor === null).length,
          },
        ]
      : [];
  });
}
export function lineSummary(line: EstimateLine) {
  return {
    floor: 'Whole packs for the floor in your plan.',
    walls: 'Paint for your walls, rounded to whole cans.',
    furniture: 'Selected pieces and their required parts.',
    services: 'Work priced from your selected scope.',
    delivery: 'Delivery as listed by the supplier.',
    tax: 'Tax recorded with these products.',
    allowance: 'A planning allowance to confirm before ordering.',
  }[line.category];
}
