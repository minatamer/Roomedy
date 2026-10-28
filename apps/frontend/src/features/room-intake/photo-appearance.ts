import { VERSIONS } from '@roomedy/contracts/policy';
import type { DraftObservation } from '@roomedy/contracts/intake';
import type {
  FurnitureMaterials,
  OpeningMaterials,
} from '@roomedy/contracts/furniture-materials';
import { furnitureMaterialRoles } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry } from '@roomedy/spatial';

/** Only agreement among visible facts becomes a material; conflicting views remain unassigned. */
export function photoAppearance(members: readonly DraftObservation[]) {
  const result: Record<string, string> = {};
  for (const key of [
    'bodyColor',
    'bodyPattern',
    'softColor',
    'softPattern',
    'frameColor',
    'framePattern',
  ] as const) {
    const values = members
      .filter((o) => o.visibility === 'visible' || o.visibility === 'partial')
      .flatMap((o) =>
        o.appearance?.[key] ? [o.appearance[key]!.toLowerCase()] : [],
      );
    if (!values.length) continue;
    if (key.endsWith('Color')) {
      const rgb = values.map((hex) =>
        [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)),
      );
      // Small lighting differences can be reconciled; opposing colours cannot.
      if (
        [0, 1, 2].every(
          (channel) =>
            Math.max(...rgb.map((c) => c[channel]!)) -
              Math.min(...rgb.map((c) => c[channel]!)) <=
            32,
        )
      )
        result[key] = `#${[0, 1, 2]
          .map((channel) =>
            Math.round(
              rgb.reduce((sum, c) => sum + c[channel]!, 0) / rgb.length,
            )
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')}`;
    } else if (new Set(values).size === 1) result[key] = values[0]!;
  }
  return result;
}

export function photoFurnitureMaterials(
  members: readonly DraftObservation[],
  catalogueId: string,
): FurnitureMaterials | undefined {
  const entry = findCatalogueEntry(catalogueId, VERSIONS.catalogue);
  if (!entry) return undefined;
  const roles = furnitureMaterialRoles(entry),
    appearance = photoAppearance(members);
  const materials: FurnitureMaterials = {};
  if (roles.body) {
    if (appearance.bodyColor) materials.bodyColor = appearance.bodyColor;
    if (appearance.bodyPattern)
      materials.bodyPattern = appearance.bodyPattern as NonNullable<
        FurnitureMaterials['bodyPattern']
      >;
  }
  if (!roles.body && roles.hardware && appearance.bodyColor)
    materials.hardwareColor = appearance.bodyColor;
  if (roles.soft) {
    if (appearance.softColor) materials.softColor = appearance.softColor;
    if (appearance.softPattern)
      materials.softPattern = appearance.softPattern as NonNullable<
        FurnitureMaterials['softPattern']
      >;
  }
  return Object.keys(materials).length ? materials : undefined;
}

export function photoOpeningMaterials(
  members: readonly DraftObservation[],
): OpeningMaterials | undefined {
  const appearance = photoAppearance(members),
    materials: OpeningMaterials = {};
  if (members[0]?.kind === 'door') {
    if (appearance.bodyColor) materials.color = appearance.bodyColor;
    if (appearance.bodyPattern)
      materials.texture = appearance.bodyPattern as OpeningMaterials['texture'];
  }
  if (appearance.frameColor) materials.frameColor = appearance.frameColor;
  if (appearance.framePattern)
    materials.frameTexture =
      appearance.framePattern as OpeningMaterials['frameTexture'];
  return Object.keys(materials).length ? materials : undefined;
}
