import { z } from 'zod';

export const bedroomThemeIdSchema = z.enum([
  'japandi',
  'modern',
  'scandinavian',
  'earthy',
  'industrial',
]);
export type BedroomThemeId = z.infer<typeof bedroomThemeIdSchema>;

/** Authored, editable mappings of researched styles to supported local materials. */
export const BEDROOM_THEMES = [
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Warm oak, sand plaster and sage linen',
    wallColor: '#e7dfcf',
    wallTexture: 'plaster',
    floorColor: '#c3a17a',
    floorTexture: 'planks',
    furnitureFinish: 'oak',
    softColor: '#96a38e',
    upholstery: 'linen',
    hardware: 'dark',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Soft grey, walnut and charcoal contrast',
    wallColor: '#e5e5e1',
    wallTexture: 'smooth',
    floorColor: '#a9adae',
    floorTexture: 'concrete',
    furnitureFinish: 'walnut',
    softColor: '#59615f',
    upholstery: 'plain',
    hardware: 'steel',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'White walls, light oak and blue-grey linen',
    wallColor: '#f5f3eb',
    wallTexture: 'smooth',
    floorColor: '#d0b58b',
    floorTexture: 'planks',
    furnitureFinish: 'oak',
    softColor: '#a9b9bc',
    upholstery: 'linen',
    hardware: 'steel',
  },
  {
    id: 'earthy',
    name: 'Earthy',
    description: 'Clay plaster, warm oak and oatmeal linen',
    wallColor: '#cfab92',
    wallTexture: 'plaster',
    floorColor: '#bd976f',
    floorTexture: 'planks',
    furnitureFinish: 'oak',
    softColor: '#d2bc99',
    upholstery: 'linen',
    hardware: 'brass',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Concrete grey, dark wood and woven neutrals',
    wallColor: '#b8b6ae',
    wallTexture: 'plaster',
    floorColor: '#8f9290',
    floorTexture: 'concrete',
    furnitureFinish: 'walnut',
    softColor: '#a99d8c',
    upholstery: 'linen',
    hardware: 'dark',
  },
] as const;
export type BedroomTheme = (typeof BEDROOM_THEMES)[number];
export const bedroomTheme = (id: BedroomThemeId): BedroomTheme =>
  BEDROOM_THEMES.find((theme) => theme.id === id)!;
