import type {
  EstimateLine,
  EstimateQuantity,
  EstimateSettings,
  SelectedPrice,
} from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { ceilQuantity, estimateWallAreas } from './estimate-quantities.js';

const q = (
  numerator: number,
  unit: EstimateQuantity['unit'],
  denominator = 1,
): EstimateQuantity => ({ numerator, denominator, unit });
const areaText = (area: number) =>
  `${Number((area / 1_000_000).toFixed(4))} m²`;
/** A whole-room provisional takeoff. Product facts and editable assumptions remain distinct. */
export function selectedTakeoff(
  room: RoomDocument,
  settings: EstimateSettings,
  price: SelectedPrice,
):
  | (Pick<
      EstimateLine,
      'installed' | 'required' | 'purchased' | 'rule' | 'notes'
    > & { count: number })
  | null {
  const t = price.takeoff;
  if (!t) return null;
  let auto: number,
    installed: EstimateQuantity,
    required: EstimateQuantity,
    purchased: EstimateQuantity,
    rule: string;
  const notes: string[] = [];
  const missingArea = () =>
    t.mode === 'manual'
      ? {
          count: price.quantity,
          installed: null,
          required: null,
          purchased: null,
          rule: `Manual quantity ${price.quantity}; whole-room takeoff needs complete room measurements.`,
          notes: [
            'Visitor-entered units; room coverage cannot be calculated until measurements are complete.',
          ],
        }
      : null;
  if (t.kind === 'floor') {
    const { width, depth } = room.room;
    if (width.value === null || depth.value === null) return missingArea();
    const area = width.value * depth.value - settings.floor.excludedMm2;
    if (area < 0) throw Error('invalid-input');
    const needed = area * (10_000 + settings.floor.wasteBps);
    auto = ceilQuantity(BigInt(needed), BigInt(t.coverageMm2) * 10_000n);
    installed = q(area, 'mm2');
    required = q(needed, 'mm2', 10_000);
    rule = `${areaText(area)} net floor + ${settings.floor.wasteBps / 100}% waste ÷ ${areaText(t.coverageMm2)} per pack; round up to ${auto} whole packs.`;
    notes.push(
      `${t.coverageSource === 'product' ? 'Product coverage' : t.coverageSource === 'visitor' ? 'Visitor coverage' : 'Planning coverage assumption'}: ${areaText(t.coverageMm2)} per pack. Confirm with the supplier.`,
    );
    purchased = q(
      (t.mode === 'manual' ? price.quantity : auto) * t.coverageMm2,
      'mm2',
    );
  } else {
    const areas = estimateWallAreas(room);
    let area = 0,
      needed = 0n;
    for (const target of price.targets) {
      if (target.kind !== 'surface' || target.surface === 'floor') return null;
      const wall = areas.find((wall) => wall.wall === target.surface)!,
        s = settings.walls.find((wall) => wall.wall === target.surface)!;
      if (wall.netMm2 === null) return missingArea();
      area += wall.netMm2;
      needed += BigInt(wall.netMm2) * BigInt(s.coats) * 1000n;
      notes.push(
        `${target.surface}: ${areaText(wall.netMm2)} net after openings × ${s.coats} coat(s).`,
      );
    }
    const divisor = BigInt(t.coverageMm2PerLitre);
    auto = ceilQuantity(needed, divisor * BigInt(t.volumeMl));
    installed = q(area, 'mm2');
    required = q(ceilQuantity(needed, divisor), 'ml');
    purchased = q(
      (t.mode === 'manual' ? price.quantity : auto) * t.volumeMl,
      'ml',
    );
    rule = `${areaText(area)} net walls after openings; sum each wall's coats ÷ ${areaText(t.coverageMm2PerLitre)}/L/coat ÷ ${t.volumeMl / 1000} L per can; round up once to ${auto} whole cans.`;
    notes.push(
      `${t.coverageSource === 'product' ? 'Product yield' : t.coverageSource === 'visitor' ? 'Visitor yield' : 'Planning yield assumption'}: ${areaText(t.coverageMm2PerLitre)}/L/coat. ${t.volumeSource === 'product' ? 'Listed' : t.volumeSource === 'visitor' ? 'Visitor' : 'Assumed'} can size: ${t.volumeMl / 1000} L. Confirm with the supplier.`,
    );
  }
  if (auto > 100_000) throw Error('estimate-range');
  if (t.mode === 'manual')
    notes.push(
      `Manual quantity ${price.quantity} overrides the calculated ${auto}; reset to automatic to use room measurements.`,
    );
  else
    notes.push(
      'Quantity calculated automatically from room measurements; planning measurements and product coverage still need confirmation.',
    );
  return {
    count: t.mode === 'manual' ? price.quantity : auto,
    installed,
    required,
    purchased,
    rule,
    notes,
  };
}
