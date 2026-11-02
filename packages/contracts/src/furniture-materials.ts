import { z } from 'zod';
import type { CatalogueEntry } from './catalogue.js';
import type { Furniture, RoomDocument } from './room.js';
import { FINISH_COLORS, surfaceColorSchema, roomSurface } from './surfaces.js';
import type { BedroomTheme } from './bedroom-themes.js';
import { BEDROOM_THEMES, bedroomTheme } from './bedroom-themes.js';
export {
  BEDROOM_THEMES,
  bedroomTheme,
  bedroomThemeIdSchema,
} from './bedroom-themes.js';
export type { BedroomThemeId, BedroomTheme } from './bedroom-themes.js';

/** Authored visual swatches; Kelvin labels are approximate, not photometric facts. */
export const LIGHT_PRESETS = [
  { id: 'candlelight', label: 'Candlelight · 2200 K', color: '#ffb969' },
  { id: 'warm-white', label: 'Warm white · 2700 K', color: '#ffd6a3' },
  { id: 'neutral', label: 'Neutral · 4000 K', color: '#fff1dc' },
  { id: 'daylight', label: 'Daylight · 6500 K', color: '#e4edff' },
  { id: 'warm-red', label: 'Warm red', color: '#ff6640' },
] as const;
export const lightSettingsSchema = z.strictObject({
  color: surfaceColorSchema,
  brightness: z.number().int().min(0).max(100),
  on: z.boolean(),
});
export type LightSettings = z.infer<typeof lightSettingsSchema>;
export const DEFAULT_LIGHT: Readonly<LightSettings> = Object.freeze({
  color: '#ffd6a3',
  brightness: 75,
  on: true,
});
export const lightSettings = (piece: {
  light?: LightSettings | undefined;
}): Readonly<LightSettings> => piece.light ?? DEFAULT_LIGHT;

/** Retain the applied choice; legacy rooms reuse the exact preset match already shown by the editor. */
export function roomBedroomTheme(
  room: RoomDocument['room'],
): BedroomTheme | undefined {
  if (room.theme) return bedroomTheme(room.theme);
  const floor = roomSurface(room, 'floor'),
    walls = roomSurface(room, 'walls');
  return BEDROOM_THEMES.find(
    (theme) =>
      floor.color === theme.floorColor &&
      floor.texture === theme.floorTexture &&
      walls.color === theme.wallColor &&
      walls.texture === theme.wallTexture,
  );
}

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

export const BED_BEDDING_PARTS = [
  {
    label: 'Pillows',
    color: 'pillowColor',
    pattern: 'pillowPattern',
    target: 'pillow',
  },
  {
    label: 'Sheets',
    color: 'sheetColor',
    pattern: 'sheetPattern',
    target: 'sheet',
  },
  {
    label: 'Duvet / cover',
    color: 'coverColor',
    pattern: 'coverPattern',
    target: 'blanket',
  },
] as const;

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
    pillowColor: surfaceColorSchema.nullable().optional(),
    pillowPattern: materialPatternSchema.nullable().optional(),
    sheetColor: surfaceColorSchema.nullable().optional(),
    sheetPattern: materialPatternSchema.nullable().optional(),
    coverColor: surfaceColorSchema.nullable().optional(),
    coverPattern: materialPatternSchema.nullable().optional(),
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

/** Presets use the same supported part roles as individual material controls. */
export function bedroomFurnitureMaterials(
  theme: BedroomTheme,
  entry: CatalogueEntry,
  detailed = true,
): FurnitureMaterials {
  const roles = furnitureMaterialRoles(entry, detailed);
  const upholstery = entry.category === 'lighting' ? 'linen' : theme.upholstery;
  return {
    ...(roles.body
      ? {
          body: 'wood' as const,
          bodyColor: FINISH_COLORS[theme.furnitureFinish],
          bodyPattern: 'wood' as const,
        }
      : {}),
    ...(roles.soft
      ? {
          upholstery,
          softColor: theme.softColor,
          softPattern:
            upholstery === 'plain' ? ('smooth' as const) : ('fabric' as const),
          ...(entry.category === 'bed'
            ? {
                pillowColor: theme.softColor,
                sheetColor: theme.softColor,
                pillowPattern:
                  upholstery === 'plain'
                    ? ('smooth' as const)
                    : ('fabric' as const),
                sheetPattern:
                  upholstery === 'plain'
                    ? ('smooth' as const)
                    : ('fabric' as const),
                coverColor: theme.softColor,
                coverPattern:
                  upholstery === 'plain'
                    ? ('smooth' as const)
                    : ('fabric' as const),
              }
            : {}),
        }
      : {}),
    ...(roles.hardware
      ? { hardware: theme.hardware, hardwareColor: null }
      : {}),
  };
}

export interface FurnitureMaterialTarget {
  color: string;
  surface: MaterialPattern | 'plaster' | 'paint';
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
  const cover: FurnitureMaterialTarget = {
    ...soft,
    color: choices.coverColor ?? choices.softColor ?? '#bc9475',
    surface: choices.coverPattern ?? soft.surface,
  };
  const pillow =
    category === 'bed'
      ? {
          ...soft,
          color: choices.pillowColor ?? soft.color,
          surface: choices.pillowPattern ?? soft.surface,
        }
      : soft;
  const sheet =
    category === 'bed'
      ? {
          ...soft,
          color: choices.sheetColor ?? soft.color,
          surface: choices.sheetPattern ?? soft.surface,
        }
      : soft;
  const darker = (hex: string) =>
    `#${[1, 3, 5]
      .map((at) =>
        Math.round(parseInt(hex.slice(at, at + 2), 16) * 0.66)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  return {
    frame: {
      color,
      surface:
        (choices.bodyPattern === 'smooth' && body !== 'plain'
          ? 'paint'
          : choices.bodyPattern) ??
        (metallic || body === 'plain' ? 'smooth' : wood ? 'wood' : 'plaster'),
      roughness: body === 'plain' ? 0.94 : metallic ? 0.28 : 0.67,
      metalness: metallic ? 0.72 : 0,
      bumpScale: metallic || body === 'plain' ? 0 : 0.0004,
    } satisfies FurnitureMaterialTarget,
    soft,
    pillow,
    sheet,
    blanket: cover,
    detail: {
      color:
        category === 'bed' || category === 'seating' || category === 'chair'
          ? darker(cover.color)
          : '#36312c',
      surface: 'smooth',
      roughness: 1,
      metalness: 0,
      bumpScale: 0,
    } satisfies FurnitureMaterialTarget,
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
    ...BED_BEDDING_PARTS.filter((part) => part.target !== 'blanket').flatMap(
      (part) => [
        materials[part.color] !== undefined &&
          `${part.label.toLowerCase()} colour ${materials[part.color] ?? 'follow bedding'}`,
        materials[part.pattern] !== undefined &&
          `${part.label.toLowerCase()} pattern ${materials[part.pattern] ?? 'follow bedding'}`,
      ],
    ),
    materials.coverColor !== undefined &&
      `cover colour ${materials.coverColor ?? 'follow bedding'}`,
    materials.coverPattern !== undefined &&
      `cover pattern ${materials.coverPattern ?? 'follow bedding'}`,
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
      : category === 'bed' && changed(['coverColor', 'coverPattern'])
        ? 'blanket'
        : category === 'bed' && changed(['pillowColor', 'pillowPattern'])
          ? 'pillow'
          : category === 'bed' && changed(['sheetColor', 'sheetPattern'])
            ? 'sheet'
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
