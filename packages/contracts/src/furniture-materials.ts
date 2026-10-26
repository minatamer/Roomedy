import { z } from 'zod';
import type { CatalogueEntry } from './catalogue.js';
import type { Furniture } from './room.js';
import { FINISH_COLORS, surfaceColorSchema } from './surfaces.js';

/** Planned visual specification; independent of measurements and retail identity. */
export const furnitureMaterialsSchema = z
  .strictObject({
    body: z.enum(['auto', 'wood', 'painted', 'metal']).optional(),
    upholstery: z.enum(['linen', 'velvet', 'leather']).optional(),
    softColor: surfaceColorSchema.nullable().optional(),
    hardware: z.enum(['original', 'dark', 'brass', 'steel']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export type FurnitureMaterials = z.infer<typeof furnitureMaterialsSchema>;

export function furnitureUpholsteryChoices(entry: CatalogueEntry) {
  if (entry.category === 'lighting') return ['linen'] as const;
  if (entry.category === 'bed') return ['linen', 'velvet'] as const;
  return ['linen', 'velvet', 'leather'] as const;
}

export function furnitureMaterialRoles(entry: CatalogueEntry, detailed = true) {
  if (!detailed) return { body: true, soft: false, hardware: false };
  const category = entry.category;
  return {
    body: !['chair', 'seating', 'lighting'].includes(category),
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
  surface: 'wood' | 'plaster' | 'fabric' | 'smooth';
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
    color = FINISH_COLORS[piece.finish],
    body = choices.body ?? 'auto',
    cloth = choices.upholstery ?? 'linen',
    metallic = body === 'metal',
    wood =
      body === 'wood' ||
      (body === 'auto' && ['oak', 'walnut'].includes(piece.finish)),
    softColor =
      choices.softColor ??
      (['chair', 'seating', 'lighting'].includes(category) ? color : '#eee5d5');
  const soft: FurnitureMaterialTarget = {
    color: softColor,
    surface: cloth === 'leather' ? 'smooth' : 'fabric',
    roughness: cloth === 'leather' ? 0.42 : cloth === 'velvet' ? 0.9 : 0.97,
    metalness: 0,
    bumpScale: cloth === 'linen' ? 0.0012 : 0.0003,
  };
  return {
    frame: {
      color,
      surface: metallic ? 'smooth' : wood ? 'wood' : 'plaster',
      roughness: metallic ? 0.28 : 0.67,
      metalness: metallic ? 0.72 : 0,
      bumpScale: metallic ? 0 : 0.0004,
    } satisfies FurnitureMaterialTarget,
    soft,
    blanket: { ...soft, color: choices.softColor ?? '#bc9475' },
    metal: {
      color: (
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
