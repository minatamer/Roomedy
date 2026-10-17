import {
  CATALOGUE,
  findCatalogueEntry,
  supportsDimensions,
} from '@roomedy/spatial';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';

export { CATALOGUE, findCatalogueEntry, supportsDimensions };
export function filterCatalogue(category?: CatalogueEntry['category']) {
  return category
    ? CATALOGUE.filter((entry) => entry.category === category)
    : CATALOGUE;
}
export function thumbnailUrl(entry: CatalogueEntry): string {
  return `/catalogue/thumbnails/${entry.assetId}.svg`;
}
