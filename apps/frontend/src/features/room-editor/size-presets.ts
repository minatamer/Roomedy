import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Furniture } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
export interface SizePreset {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly width: number;
  readonly depth: number;
  readonly height?: number;
  readonly mattress?: string;
}
export const BED_FRAME_ALLOWANCE_MM = 100;
const bed = (
  id: string,
  group: string,
  name: string,
  width: number,
  depth: number,
  mattress: string,
): SizePreset => ({
  id,
  group,
  label: `${name} · ${mattress}`,
  mattress,
  width: width + BED_FRAME_ALLOWANCE_MM,
  depth: depth + BED_FRAME_ALLOWANCE_MM,
});
const metricBed = (name: string, w: number, d: number) =>
  bed(
    `metric-${name.toLowerCase()}`,
    'Metric mattress sizes',
    name,
    w * 10,
    d * 10,
    `${w} × ${d} cm`,
  );
const ukBed = (name: string, w: number, d: number) =>
  bed(
    `uk-${name.toLowerCase().replaceAll(' ', '-')}`,
    'UK mattress sizes',
    name,
    w * 10,
    d * 10,
    `${w} × ${d} cm`,
  );
const usBed = (name: string, w: number, d: number) =>
  bed(
    `us-${name.toLowerCase().replaceAll(' ', '-')}`,
    'US mattress sizes',
    name,
    Math.round(w * 25.4),
    Math.round(d * 25.4),
    `${w} × ${d} in`,
  );
const beds: readonly SizePreset[] = [
  metricBed('Single', 90, 200),
  metricBed('Double', 140, 200),
  metricBed('Queen', 160, 200),
  metricBed('King', 180, 200),
  ukBed('Single', 90, 190),
  ukBed('Double', 135, 190),
  ukBed('King', 150, 200),
  ukBed('Super king', 180, 200),
  usBed('Twin', 38, 75),
  usBed('Twin XL', 38, 80),
  usBed('Full', 54, 75),
  usBed('Queen', 60, 80),
  usBed('King', 76, 80),
  usBed('California king', 72, 84),
];
const common = (
  id: string,
  name: string,
  width: number,
  depth: number,
  height?: number,
): SizePreset => ({
  id,
  group: 'Common sizes',
  label: `${name} · ${width / 10} × ${depth / 10}${height === undefined ? '' : ` × ${height / 10}`} cm`,
  width,
  depth,
  ...(height === undefined ? {} : { height }),
});
const sizes: Partial<
  Record<CatalogueEntry['category'], readonly SizePreset[]>
> = {
  bed: beds,
  desk: [
    common('desk-compact', 'Compact', 1200, 600),
    common('desk-standard', 'Standard', 1400, 600),
    common('desk-wide', 'Wide', 1600, 800),
  ],
  wardrobe: [
    common('wardrobe-compact', 'Compact', 1000, 600, 2010),
    common('wardrobe-double', 'Double', 1500, 600, 2010),
    common('wardrobe-wide', 'Wide', 2000, 600, 2360),
  ],
  storage: [
    common('shelf-narrow', 'Narrow', 400, 280, 2020),
    common('shelf-low', 'Low', 800, 280, 1060),
    common('shelf-tall', 'Tall', 800, 280, 2020),
  ],
};
export function furnitureSizePresets(
  entry: CatalogueEntry,
): readonly SizePreset[] {
  if (!entry.adjustable) return [];
  return (sizes[entry.category] ?? []).filter((p) =>
    (['width', 'depth', 'height'] as const).every(
      (axis) =>
        p[axis] === undefined ||
        (p[axis]! >= entry.size[axis].min && p[axis]! <= entry.size[axis].max),
    ),
  );
}
export interface SizeInputValues {
  preset: string;
  width: string;
  depth: string;
  height?: string;
}
export const sizeInputValues = (
  dimensions: Furniture['dimensions'],
  presets: readonly SizePreset[] = [],
): SizeInputValues => ({
  preset:
    presets.find(
      (preset) =>
        preset.width === dimensions.width.value &&
        preset.depth === dimensions.depth.value &&
        (preset.height === undefined ||
          preset.height === dimensions.height.value),
    )?.id ?? '',
  width: String(dimensions.width.value ?? ''),
  depth: String(dimensions.depth.value ?? ''),
});
export function selectSizePreset(
  values: SizeInputValues,
  preset: SizePreset | undefined,
): SizeInputValues {
  return preset
    ? {
        preset: preset.id,
        width: String(preset.width),
        depth: String(preset.depth),
        ...(preset.height === undefined
          ? {}
          : { height: String(preset.height) }),
      }
    : { ...values, preset: '' };
}
export function parseSizeInput(
  values: SizeInputValues,
  entry: CatalogueEntry,
  owned: boolean,
):
  | { ok: true; size: { width: number; depth: number; height?: number } }
  | { ok: false; field: 'width' | 'depth' | 'height'; message: string } {
  const size: { width: number; depth: number; height?: number } = {
    width: 0,
    depth: 0,
  };
  for (const axis of ['width', 'depth', 'height'] as const) {
    const text = values[axis];
    if (axis === 'height' && text === undefined) continue;
    const n = Number(text),
      min = owned ? 1 : entry.size[axis].min,
      max = owned ? POLICY.furnitureEdgeMm : entry.size[axis].max;
    if (!text?.trim() || !Number.isInteger(n) || n < min || n > max)
      return {
        ok: false,
        field: axis,
        message: `${axis[0]!.toUpperCase() + axis.slice(1)}: enter a whole number from ${min} to ${max} mm.`,
      };
    size[axis] = n;
  }
  return { ok: true, size };
}
