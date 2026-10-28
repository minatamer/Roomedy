import { z } from 'zod';
import type { CatalogueEntry } from './catalogue.js';
import type { Furniture } from './room.js';
import { FINISH_COLORS, surfaceColorSchema } from './surfaces.js';

export const MATERIAL_PATTERNS = {
  smooth: 'Plain',
  wood: 'Wood grain',
  fabric: 'Woven',
  stripes: 'Stripes',
  checker: 'Checker',
  herringbone: 'Herringbone',
} as const;
export const materialPatternSchema = z.enum([
  'smooth',
  'wood',
  'fabric',
  'stripes',
  'checker',
  'herringbone',
]);
export type MaterialPattern = z.infer<typeof materialPatternSchema>;

export const openingMaterialsSchema = z
  .strictObject({
    color: surfaceColorSchema.optional(),
    texture: materialPatternSchema.optional(),
    frameColor: surfaceColorSchema.optional(),
    frameTexture: materialPatternSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export type OpeningMaterials = z.infer<typeof openingMaterialsSchema>;
export function openingMaterialTargets(materials?: OpeningMaterials) {
  return {
    color: materials?.color ?? '#765238',
    texture: materials?.texture ?? 'wood',
    frameColor: materials?.frameColor ?? '#e8e0d3',
    frameTexture: materials?.frameTexture ?? 'wood',
  };
}
export const openingMaterialsLabel = (m: OpeningMaterials) =>
  Object.entries(m)
    .map(([k, v]) => `${k} ${v}`)
    .join(' - ');

/** Planned visual specification; independent of measurements and retail identity. */
export const furnitureMaterialsSchema = z
  .strictObject({
    bodyColor: surfaceColorSchema.nullable().optional(),
    bodyPattern: materialPatternSchema.nullable().optional(),
    softPattern: materialPatternSchema.nullable().optional(),
    hardwareColor: surfaceColorSchema.nullable().optional(),
    body: z.enum(['auto', 'plain', 'wood', 'painted', 'metal']).optional(),
    upholstery: z.enum(['plain', 'linen', 'velvet', 'leather']).optional(),
    softColor: surfaceColorSchema.nullable().optional(),
    hardware: z.enum(['original', 'dark', 'brass', 'steel']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export type FurnitureMaterials = z.infer<typeof furnitureMaterialsSchema>;

export function furnitureUpholsteryChoices(entry: CatalogueEntry) {
  if (entry.category === 'lighting') return ['plain', 'linen'] as const;
  if (entry.category === 'bed') return ['plain', 'linen', 'velvet'] as const;
  return ['plain', 'linen', 'velvet', 'leather'] as const;
}

export function furnitureMaterialRoles(entry: CatalogueEntry, detailed = true) {
  if (!detailed) return { body: true, soft: false, hardware: false };
  const category = entry.category;
  return {
    body: category !== 'lighting',
    soft: ['bed', 'chair', 'seating', 'lighting'].includes(category),
    hardware:
      ['desk', 'chair', 'table', 'seating', 'lighting', 'wardrobe'].includes(
        category,
      ) ||
      (category === 'storage' && entry.accessMechanism !== 'none') ||
      entry.id === 'tv-tabletop',
  };
}

export interface FurnitureMaterialTarget {
  color: string;
  surface: MaterialPattern | 'plaster';
  roughness: number;
  metalness: number;
  bumpScale: number;
}

/** One editor/export policy; omitted fields deliberately retain the earlier appearance. */
export function furnitureMaterialTargets(
  piece: Pick<Furniture, 'finish' | 'materials'>,
  category: CatalogueEntry['category'],
) {
  const choices = piece.materials ?? {},
    baseColor = FINISH_COLORS[piece.finish],
    color = choices.bodyColor ?? baseColor,
    body = choices.body ?? 'auto',
    cloth = choices.upholstery ?? 'linen',
    metallic = body === 'metal',
    wood =
      body === 'wood' ||
      (body === 'auto' && ['oak', 'walnut'].includes(piece.finish)),
    softColor =
      choices.softColor ??
      (['chair', 'seating', 'lighting'].includes(category)
        ? baseColor
        : '#eee5d5');
  const soft: FurnitureMaterialTarget = {
    color: softColor,
    surface:
      choices.softPattern ??
      (cloth === 'plain' || cloth === 'leather' ? 'smooth' : 'fabric'),
    roughness:
      cloth === 'plain'
        ? 0.94
        : cloth === 'leather'
          ? 0.42
          : cloth === 'velvet'
            ? 0.9
            : 0.97,
    metalness: 0,
    bumpScale: cloth === 'plain' ? 0 : cloth === 'linen' ? 0.0012 : 0.0003,
  };
  return {
    frame: {
      color,
      surface:
        choices.bodyPattern ??
        (metallic || body === 'plain' ? 'smooth' : wood ? 'wood' : 'plaster'),
      roughness: body === 'plain' ? 0.94 : metallic ? 0.28 : 0.67,
      metalness: metallic ? 0.72 : 0,
      bumpScale: metallic || body === 'plain' ? 0 : 0.0004,
    } satisfies FurnitureMaterialTarget,
    soft,
    blanket: { ...soft, color: choices.softColor ?? '#bc9475' },
    metal: {
      color:
        choices.hardwareColor ??
        (
          {
            original: '#514a40',
            dark: '#303333',
            brass: '#c7a15e',
            steel: '#b4babd',
          } as const
        )[choices.hardware ?? 'original'],
      surface: 'smooth',
      roughness: choices.hardware === 'steel' ? 0.24 : 0.38,
      metalness: 0.55,
      bumpScale: 0,
    } satisfies FurnitureMaterialTarget,
  };
}

export function furnitureMaterialsLabel(materials: FurnitureMaterials) {
  return [
    materials.bodyColor && `frame colour ${materials.bodyColor}`,
    materials.bodyPattern && `frame pattern ${materials.bodyPattern}`,
    materials.softPattern && `soft pattern ${materials.softPattern}`,
    materials.hardwareColor && `hardware colour ${materials.hardwareColor}`,
    materials.body &&
      `frame ${materials.body === 'auto' ? 'from finish' : materials.body}`,
    materials.upholstery && `soft parts ${materials.upholstery}`,
    materials.softColor !== undefined &&
      `soft colour ${materials.softColor ?? 'default'}`,
    materials.hardware && `hardware ${materials.hardware}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Preview the part that changed, including a soft-colour edit on an already coloured frame. */
export function furnitureAppearanceSwatches(
  before: Pick<Furniture, 'finish' | 'materials'>,
  after: Pick<Furniture, 'finish' | 'materials'>,
  category: CatalogueEntry['category'],
) {
  const changed = (keys: (keyof FurnitureMaterials)[]) =>
    keys.some((key) => before.materials?.[key] !== after.materials?.[key]);
  const role =
    before.finish !== after.finish ||
    changed(['body', 'bodyColor', 'bodyPattern'])
      ? 'frame'
      : changed(['upholstery', 'softColor', 'softPattern'])
        ? 'soft'
        : changed(['hardware', 'hardwareColor'])
          ? 'metal'
          : 'frame';
  return {
    role,
    before: furnitureMaterialTargets(before, category)[role].color,
    after: furnitureMaterialTargets(after, category)[role].color,
  };
}
