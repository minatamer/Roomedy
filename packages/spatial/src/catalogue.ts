import { catalogueSchema } from '@roomedy/contracts/catalogue';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import { VERSIONS } from '@roomedy/contracts/policy';

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
    finishes: ['clay'],
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
    finishes: ['oak'],
    size: { width: fixed(540), depth: fixed(440), height: fixed(470) },
    accessMm: 450,
    accessMechanism: 'hinged',
  },
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
