import type { CatalogueEntry } from '@roomedy/contracts/catalogue';

export { findCatalogueEntry } from '@roomedy/spatial';
export function thumbnailUrl(entry: CatalogueEntry): string {
  return `/catalogue/thumbnails/${entry.assetId}.svg`;
}
