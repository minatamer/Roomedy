import { z } from 'zod';
import { idSchema } from './primitives.js';

export const FINISH_COLORS = {
  oak: '#bd9064',
  ivory: '#f3eee2',
  clay: '#c97f60',
  sage: '#8eaa96',
  walnut: '#735243',
  charcoal: '#344846',
} as const;
export const SURFACE_TEXTURES = {
  planks: 'Wood planks',
  tile: 'Tile',
  concrete: 'Concrete',
  carpet: 'Carpet',
  smooth: 'Smooth paint',
  plaster: 'Plaster',
  wood: 'Wood panels',
  linen: 'Linen',
} as const;
export const SURFACE_OPTIONS = {
  floor: ['planks', 'tile', 'concrete', 'carpet'],
  walls: ['smooth', 'plaster', 'wood', 'linen'],
} as const;
export const surfaceTargetSchema = z.enum(['floor', 'walls']);
export const surfaceColorSchema = z
  .string()
  .length(7)
  .regex(/^#[0-9a-fA-F]{6}$/);
export const surfaceTextureSchema = z.enum([
  'planks',
  'tile',
  'concrete',
  'carpet',
  'smooth',
  'plaster',
  'wood',
  'linen',
]);
const fact = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('status', [
    z.strictObject({
      value: z.null(),
      status: z.literal('unknown'),
      sourceId: z.null(),
    }),
    z.strictObject({
      value,
      status: z.enum(['estimated', 'planned']),
      sourceId: idSchema,
    }),
  ]);
export const surfaceAppearanceSchema = z.strictObject({
  color: fact(surfaceColorSchema),
  texture: fact(surfaceTextureSchema),
});
export type SurfaceTarget = z.infer<typeof surfaceTargetSchema>;
export type SurfaceTexture = z.infer<typeof surfaceTextureSchema>;
export type SurfaceAppearance = z.infer<typeof surfaceAppearanceSchema>;
export const isSurfaceTexture = (target: SurfaceTarget, texture: string) =>
  (SURFACE_OPTIONS[target] as readonly string[]).includes(texture);
export const roomSurfacesSchema = z
  .strictObject({
    floor: surfaceAppearanceSchema.optional(),
    walls: surfaceAppearanceSchema.optional(),
  })
  .superRefine((surfaces, ctx) => {
    for (const target of ['floor', 'walls'] as const) {
      const texture = surfaces[target]?.texture.value;
      if (texture && !isSurfaceTexture(target, texture))
        ctx.addIssue({
          code: 'custom',
          path: [target, 'texture'],
          message: 'Unsupported surface texture',
        });
    }
  });
export const emptySurfaceAppearance = (): SurfaceAppearance => ({
  color: { value: null, status: 'unknown', sourceId: null },
  texture: { value: null, status: 'unknown', sourceId: null },
});
type SurfaceRoom = {
  floorFinish: keyof typeof FINISH_COLORS;
  wallFinish: keyof typeof FINISH_COLORS;
  surfaces?: z.infer<typeof roomSurfacesSchema> | undefined;
};
export function roomSurface(room: SurfaceRoom, target: SurfaceTarget) {
  const appearance = room.surfaces?.[target];
  return {
    color: (
      appearance?.color.value ??
      FINISH_COLORS[target === 'floor' ? room.floorFinish : room.wallFinish]
    ).toLowerCase(),
    texture:
      appearance?.texture.value ??
      ((target === 'floor' ? 'planks' : 'plaster') as SurfaceTexture),
  };
}
/** Legacy palette actions still intentionally choose colours, retaining independent texture. */
export function withSurfacePalette<T extends SurfaceRoom>(
  room: T,
  floorFinish: T['floorFinish'],
  wallFinish: T['wallFinish'],
): T {
  const surfaces = room.surfaces && { ...room.surfaces };
  for (const target of ['floor', 'walls'] as const) {
    const previous = surfaces?.[target];
    if (surfaces && previous)
      surfaces[target] = {
        ...previous,
        color: {
          value: FINISH_COLORS[target === 'floor' ? floorFinish : wallFinish],
          status: 'planned',
          sourceId: 'palette-plan',
        },
      };
  }
  return {
    ...room,
    floorFinish,
    wallFinish,
    ...(surfaces ? { surfaces } : {}),
  };
}
