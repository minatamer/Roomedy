import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Furniture } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { medyDimensions } from './medy-language.js';
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
const entrySizes: Record<string, readonly SizePreset[]> = {
  armchair: [
    common('armchair-compact', 'Compact', 700, 700, 800),
    common('armchair-standard', 'Standard', 800, 800, 850),
    common('armchair-roomy', 'Roomy', 900, 900, 950),
  ],
  'bedroom-bench': [
    common('bench-compact', 'Compact', 1000, 400, 450),
    common('bench-standard', 'Standard', 1200, 450, 450),
    common('bench-wide', 'Wide', 1500, 450, 450),
  ],
  'side-table': [
    common('table-small', 'Small', 350, 350, 450),
    common('table-standard', 'Standard', 450, 450, 550),
    common('table-large', 'Large', 600, 600, 600),
  ],
  'floor-lamp': [
    common('lamp-compact', 'Compact', 300, 300, 1400),
    common('lamp-standard', 'Standard', 350, 350, 1550),
    common('lamp-tall', 'Tall', 400, 400, 1800),
  ],
  'drawer-shelf': [
    common('drawer-shelf-compact', 'Compact', 600, 350, 1400),
    common('drawer-shelf-standard', 'Standard', 800, 400, 1600),
    common('drawer-shelf-tall', 'Tall', 800, 400, 1800),
  ],
  'chest-drawers': [
    common('chest-compact', 'Compact', 700, 470, 900),
    common('chest-standard', 'Standard', 800, 470, 900),
    common('chest-wide', 'Wide', 1000, 470, 900),
  ],
  'bedside-drawers': [
    common('bedside-small', 'Small', 400, 350, 500),
    common('bedside-standard', 'Standard', 450, 400, 550),
    common('bedside-wide', 'Wide', 500, 400, 600),
  ],
  'tv-stand': [
    common('media-compact', 'Compact', 1200, 350, 600),
    common('media-standard', 'Standard', 1400, 400, 600),
    common('media-wide', 'Wide', 1600, 400, 600),
    common('media-extra-wide', 'Extra wide', 2000, 400, 600),
  ],
  'full-length-mirror': [
    common('mirror-slim', 'Slim', 500, 60, 1500),
    common('mirror-standard', 'Standard', 650, 60, 1500),
    common('mirror-wide', 'Wide', 700, 60, 1700),
  ],
};
const tvSizes = (entry: CatalogueEntry): SizePreset[] =>
  [43, 50, 55, 65, 75].map((inches) => {
    const diagonal = inches * 25.4;
    return {
      id: `tv-${inches}`,
      group: 'Screen diagonal',
      label: `${inches}-inch`,
      width: Math.round((diagonal * 16) / Math.sqrt(337) + 20),
      depth: entry.size.depth.default,
      height:
        Math.round((diagonal * 9) / Math.sqrt(337) + 20) +
        (entry.placement === 'surface' ? 60 : 0),
    };
  });
export function furnitureSizePresets(
  entry: CatalogueEntry,
): readonly SizePreset[] {
  if (!entry.adjustable) return [];
  return (
    entry.category === 'tv'
      ? tvSizes(entry)
      : (entrySizes[entry.id] ?? sizes[entry.category] ?? [])
  ).filter((p) =>
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
export function matchingFurnitureSizePresets(
  entry: CatalogueEntry,
  words: string,
) {
  if (entry.category === 'tv')
    words = words.replace(/(\d+)\s*(?:inches|inch|in)(?![a-z])/g, '$1-inch');
  const region = /\b(uk|british)\b/.test(words)
    ? 'uk-'
    : /\b(us|american)\b/.test(words)
      ? 'us-'
      : /\bmetric\b/.test(words)
        ? 'metric-'
        : null;
  const matching = furnitureSizePresets(entry).filter(
    (p) =>
      (!region || p.id.startsWith(region)) &&
      words.includes(p.label.split(' · ')[0]!.toLowerCase()),
  );
  const longest = Math.max(
    0,
    ...matching.map((p) => p.label.split(' · ')[0]!.length),
  );
  return matching.filter((p) => p.label.split(' · ')[0]!.length === longest);
}
/** Exact requested catalogue variants reuse offered manual presets and physical bounds. */
export function requestedCatalogueSize(
  entry: CatalogueEntry,
  words: string,
): {
  size: { width: number; depth: number; height: number } | null;
  error?: string;
} {
  const dimensions = medyDimensions(words);
  if (dimensions.invalid)
    return {
      size: null,
      error: 'Give me one value per dimension, with units.',
    };
  let supplied = dimensions.values;
  if (
    !['width', 'depth', 'height'].some(
      (axis) => supplied[axis as keyof typeof supplied] !== undefined,
    )
  ) {
    const presets = matchingFurnitureSizePresets(entry, words);
    if (presets.length > 1)
      return {
        size: null,
        error:
          'That size varies by region. Please name metric, UK or US, or give the overall frame dimensions.',
      };
    if (presets[0]) supplied = presets[0];
    else if (
      /\b(queen|king|twin|double|compact|standard|narrow|size|width|depth|height)\b/.test(
        words,
      )
    )
      return {
        size: null,
        error:
          'That preset is unavailable for this representation. Give me a supported overall width and depth.',
      };
    else return { size: null };
  }
  const size = {
    width: supplied.width ?? entry.size.width.default,
    depth: supplied.depth ?? entry.size.depth.default,
    height: supplied.height ?? entry.size.height.default,
  };
  const axis = (['width', 'depth', 'height'] as const).find(
    (axis) =>
      size[axis] < entry.size[axis].min || size[axis] > entry.size[axis].max,
  );
  return axis
    ? {
        size: null,
        error: `${entry.label} supports ${axis} from ${entry.size[axis].min} to ${entry.size[axis].max} mm. What size would you like?`,
      }
    : { size };
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
