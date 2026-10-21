import { catalogueSchema } from '@roomedy/contracts/catalogue';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import { VERSIONS } from '@roomedy/contracts/policy';
import type { Furniture } from '@roomedy/contracts/room';
import { DEFAULT_FURNITURE_LOCKS } from '@roomedy/contracts/room';

/** Shared manual/MEDY catalogue estimates. A proposed size is never a measured fact. */
export function visitorCatalogueFurniture(
  entry: CatalogueEntry,
  size: { width: number; depth: number; height?: number },
  pose: Pick<
    Furniture['pose'],
    'centerX' | 'centerZ' | 'quarterTurns' | 'bottomY'
  >,
  id: string,
): Furniture {
  const estimate = (value: number) => ({
    value,
    status: 'estimated' as const,
    sourceId: 'visitor-estimate',
  });
  return {
    id,
    label: entry.label,
    catalogueId: entry.id,
    catalogueVersion: entry.version,
    dimensions: {
      width: estimate(size.width),
      depth: estimate(size.depth),
      height: estimate(size.height ?? entry.size.height.default),
    },
    pose: {
      ...(entry.placement && entry.placement !== 'floor'
        ? { bottomY: entry.defaultElevationMm ?? 0 }
        : {}),
      ...pose,
      provenance: { status: 'planned', sourceId: 'visitor-plan' },
    },
    ownership: 'proposed',
    preference: 'flexible',
    locks: { ...DEFAULT_FURNITURE_LOCKS },
    finish: entry.finishes[0]!,
  };
}

const range = (min: number, value: number, max: number) => ({
  min,
  default: value,
  max,
});
const fixed = (value: number) => range(value, value, value);
const finishes = [
  'oak',
  'ivory',
  'clay',
  'sage',
  'walnut',
  'charcoal',
] as const;
const common = {
  version: VERSIONS.catalogue,
  localFront: 'positive-z',
  representation: 'procedural',
  adjustable: true,
  finishes: [...finishes],
} as const;

const records = catalogueSchema.parse([
  {
    ...common,
    id: 'procedural-bed',
    label: 'Simple bed',
    category: 'bed',
    assetId: 'bed',
    size: {
      width: range(1000, 1600, 2200),
      depth: range(1900, 2100, 2400),
      height: range(450, 850, 1100),
    },
    accessMm: 600,
    accessMechanism: 'none',
  },
  {
    ...common,
    id: 'procedural-desk',
    label: 'Everyday desk',
    category: 'desk',
    assetId: 'desk',
    size: {
      width: range(900, 1200, 1800),
      depth: range(500, 600, 900),
      height: range(680, 740, 820),
    },
    accessMm: 800,
    accessMechanism: 'none',
  },
  {
    ...common,
    id: 'procedural-chair',
    label: 'Simple work chair',
    category: 'chair',
    assetId: 'chair',
    size: {
      width: range(450, 550, 750),
      depth: range(450, 550, 800),
      height: range(750, 900, 1300),
    },
    accessMm: 800,
    accessMechanism: 'chair-pullout',
  },
  {
    ...common,
    id: 'wardrobe-hinged',
    label: 'Hinged wardrobe',
    category: 'wardrobe',
    assetId: 'wardrobe-hinged',
    size: {
      width: range(800, 1200, 2400),
      depth: range(450, 600, 700),
      height: range(1600, 2100, 2600),
    },
    accessMm: 800,
    accessMechanism: 'hinged',
  },
  {
    ...common,
    id: 'wardrobe-sliding',
    label: 'Sliding wardrobe',
    category: 'wardrobe',
    assetId: 'wardrobe-sliding',
    size: {
      width: range(1200, 1600, 2600),
      depth: range(600, 650, 750),
      height: range(1800, 2100, 2600),
    },
    accessMm: 600,
    accessMechanism: 'sliding',
  },
  {
    ...common,
    id: 'procedural-storage',
    label: 'Open shelf',
    category: 'storage',
    assetId: 'storage',
    size: {
      width: range(400, 800, 1400),
      depth: range(250, 350, 500),
      height: range(600, 1200, 2200),
    },
    accessMm: 600,
    accessMechanism: 'none',
  },
  {
    ...common,
    id: 'chair-desk-fixed',
    label: 'Cushioned work chair',
    category: 'chair',
    assetId: 'chair-desk',
    representation: 'prepared-mesh',
    adjustable: false,
    finishes: ['clay', ...finishes.filter((finish) => finish !== 'clay')],
    size: { width: fixed(670), depth: fixed(630), height: fixed(1216) },
    accessMm: 800,
    accessMechanism: 'chair-pullout',
  },
  {
    ...common,
    id: 'bedside-storage-fixed',
    label: 'Bedside cabinet',
    category: 'storage',
    assetId: 'bedside-storage',
    representation: 'prepared-mesh',
    adjustable: false,
    finishes: [...finishes],
    size: { width: fixed(540), depth: fixed(440), height: fixed(470) },
    accessMm: 450,
    accessMechanism: 'hinged',
  },
  ...[
    [
      'full-length-mirror',
      'Full-length mirror',
      'mirror',
      'mirror',
      [450, 650, 900],
      [40, 60, 100],
      [1200, 1500, 1900],
      400,
      'none',
    ],
    [
      'drawer-shelf',
      'Shelf with drawers',
      'storage',
      'drawer-shelf',
      [600, 800, 1200],
      [300, 400, 500],
      [1200, 1600, 2100],
      500,
      'drawer',
    ],
    [
      'chest-drawers',
      'Chest of drawers',
      'storage',
      'chest-drawers',
      [600, 800, 1200],
      [400, 470, 550],
      [650, 900, 1200],
      550,
      'drawer',
    ],
    [
      'bedside-drawers',
      'Bedside drawers',
      'storage',
      'bedside-drawers',
      [350, 450, 600],
      [300, 400, 500],
      [400, 550, 700],
      450,
      'drawer',
    ],
    [
      'tv-stand',
      'TV stand',
      'storage',
      'tv-stand',
      [1000, 1400, 2000],
      [300, 400, 500],
      [350, 600, 750],
      500,
      'drawer',
    ],
    [
      'tv-tabletop',
      'Tabletop TV',
      'tv',
      'tv-tabletop',
      [970, 1238, 1690],
      [250, 300, 400],
      [610, 765, 1030],
      0,
      'none',
    ],
    [
      'tv-wall',
      'Wall-mounted TV',
      'tv',
      'tv-wall',
      [970, 1238, 1690],
      [60, 60, 60],
      [550, 705, 970],
      0,
      'none',
    ],
    [
      'armchair',
      'Lounge armchair',
      'seating',
      'armchair',
      [650, 800, 1000],
      [650, 800, 1000],
      [700, 850, 1050],
      600,
      'none',
    ],
    [
      'bedroom-bench',
      'Bedroom bench',
      'seating',
      'bench',
      [800, 1200, 1600],
      [350, 450, 600],
      [400, 450, 550],
      400,
      'none',
    ],
    [
      'side-table',
      'Side table',
      'table',
      'side-table',
      [300, 450, 650],
      [300, 450, 650],
      [350, 550, 700],
      0,
      'none',
    ],
    [
      'floor-lamp',
      'Floor lamp',
      'lighting',
      'floor-lamp',
      [250, 350, 500],
      [250, 350, 500],
      [1200, 1550, 1900],
      0,
      'none',
    ],
  ].map(
    ([
      id,
      label,
      category,
      assetId,
      width,
      depth,
      height,
      accessMm,
      accessMechanism,
    ]) => ({
      ...common,
      id,
      label,
      category,
      assetId,
      size: {
        width: range(...(width as [number, number, number])),
        depth: range(...(depth as [number, number, number])),
        height: range(...(height as [number, number, number])),
      },
      accessMm,
      accessMechanism,
      ...(id === 'tv-wall'
        ? {
            placement: 'wall',
            defaultElevationMm: 1200,
            finishes: [
              'charcoal',
              ...finishes.filter((finish) => finish !== 'charcoal'),
            ],
          }
        : {}),
      ...(id === 'tv-tabletop'
        ? {
            placement: 'surface',
            defaultElevationMm: 600,
            finishes: [
              'charcoal',
              ...finishes.filter((finish) => finish !== 'charcoal'),
            ],
          }
        : {}),
    }),
  ),
]);
for (const entry of records) {
  for (const axis of Object.values(entry.size)) Object.freeze(axis);
  Object.freeze(entry.size);
  Object.freeze(entry.finishes);
  Object.freeze(entry);
}
export const CATALOGUE: readonly CatalogueEntry[] = Object.freeze(records);

export function findCatalogueEntry(
  id: string,
  version: string,
): CatalogueEntry | undefined {
  return version === VERSIONS.catalogue
    ? CATALOGUE.find((entry) => entry.id === id)
    : undefined;
}
export function supportsDimensions(
  entry: CatalogueEntry,
  size: { width: number; depth: number; height: number },
): boolean {
  return (['width', 'depth', 'height'] as const).every(
    (axis) =>
      Number.isInteger(size[axis]) &&
      size[axis] >= entry.size[axis].min &&
      size[axis] <= entry.size[axis].max,
  );
}
