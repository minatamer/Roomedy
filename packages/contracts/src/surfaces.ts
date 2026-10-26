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
const WALL_TEXTURES = ['smooth', 'plaster', 'wood', 'linen'] as const;
export const WALLS = ['north', 'east', 'south', 'west'] as const;
export const SURFACE_OPTIONS = {
  floor: ['planks', 'tile', 'concrete', 'carpet'],
  walls: WALL_TEXTURES,
  north: WALL_TEXTURES,
  east: WALL_TEXTURES,
  south: WALL_TEXTURES,
  west: WALL_TEXTURES,
} as const;
export const surfaceTargetSchema = z.enum(['floor', 'walls', ...WALLS]);
/** Planned material specification; never evidence of a measured room dimension. */
export const surfaceDetailSchema = z.strictObject({
  repeatWidthMm: z.number().int().min(100).max(3000),
  repeatHeightMm: z.number().int().min(100).max(3000),
  direction: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  sheen: z.enum(['matte', 'satin', 'gloss']),
});
export type SurfaceDetail = z.infer<typeof surfaceDetailSchema>;
export const DEFAULT_SURFACE_DETAIL: SurfaceDetail = Object.freeze({
  repeatWidthMm: 1200,
  repeatHeightMm: 1200,
  direction: 0,
  sheen: 'matte',
});
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
  detail: surfaceDetailSchema.optional(),
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
    north: surfaceAppearanceSchema.optional(),
    east: surfaceAppearanceSchema.optional(),
    south: surfaceAppearanceSchema.optional(),
    west: surfaceAppearanceSchema.optional(),
  })
  .superRefine((surfaces, ctx) => {
    for (const target of ['floor', 'walls', ...WALLS] as const) {
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
  const inherited = target !== 'floor' ? room.surfaces?.walls : undefined;
  return {
    color: (
      appearance?.color.value ??
      inherited?.color.value ??
      FINISH_COLORS[target === 'floor' ? room.floorFinish : room.wallFinish]
    ).toLowerCase(),
    texture:
      appearance?.texture.value ??
      inherited?.texture.value ??
      ((target === 'floor' ? 'planks' : 'plaster') as SurfaceTexture),
  };
}
export function roomSurfaceDetail(
  room: SurfaceRoom,
  target: SurfaceTarget,
): SurfaceDetail {
  return (
    room.surfaces?.[target]?.detail ??
    (target !== 'floor' ? room.surfaces?.walls?.detail : undefined) ??
    DEFAULT_SURFACE_DETAIL
  );
}
export type SurfacePatch = {
  surface: SurfaceTarget;
  color?: string | undefined;
  texture?: SurfaceTexture | undefined;
  detail?: SurfaceDetail | undefined;
};
/** Form choices patch changed fields; applying an unchanged mixed all-walls choice unifies it explicitly. */
export function changedRoomSurface(
  room: SurfaceRoom,
  surface: SurfaceTarget,
  chosen: { color: string; texture: SurfaceTexture; detail: SurfaceDetail },
): SurfacePatch | null {
  const current = roomSurface(room, surface);
  const patch: SurfacePatch = { surface };
  if (chosen.color.toLowerCase() !== current.color)
    patch.color = chosen.color.toLowerCase();
  if (chosen.texture !== current.texture) patch.texture = chosen.texture;
  if (
    JSON.stringify(chosen.detail) !==
    JSON.stringify(roomSurfaceDetail(room, surface))
  )
    patch.detail = chosen.detail;
  if (
    patch.color !== undefined ||
    patch.texture !== undefined ||
    patch.detail !== undefined
  )
    return patch;
  if (
    surface === 'walls' &&
    WALLS.some((wall) => {
      const visible = roomSurface(room, wall);
      return (
        visible.color !== chosen.color.toLowerCase() ||
        visible.texture !== chosen.texture ||
        JSON.stringify(roomSurfaceDetail(room, wall)) !==
          JSON.stringify(chosen.detail)
      );
    })
  )
    return { surface, ...chosen };
  return null;
}
/** Explicit all-walls changes update only the requested fields on existing overrides. */
export function withRoomSurface<T extends SurfaceRoom>(
  room: T,
  patch: SurfacePatch,
): T {
  let surfaces = room.surfaces;
  const targets: SurfaceTarget[] =
    patch.surface === 'walls'
      ? ['walls', ...WALLS.filter((wall) => surfaces?.[wall] !== undefined)]
      : [patch.surface];
  for (const target of targets) {
    const previous = room.surfaces?.[target] ?? emptySurfaceAppearance();
    const visible = roomSurface(room, target);
    const next = { ...previous };
    if (
      patch.color !== undefined &&
      patch.color.toLowerCase() !== visible.color
    )
      next.color = {
        value: patch.color.toLowerCase(),
        status: 'planned',
        sourceId: 'visitor-plan',
      };
    if (patch.texture !== undefined && patch.texture !== visible.texture)
      next.texture = {
        value: patch.texture,
        status: 'planned',
        sourceId: 'visitor-plan',
      };
    if (
      patch.detail !== undefined &&
      JSON.stringify(patch.detail) !==
        JSON.stringify(roomSurfaceDetail(room, target))
    )
      next.detail = { ...patch.detail };
    if (
      next.color !== previous.color ||
      next.texture !== previous.texture ||
      next.detail !== previous.detail
    )
      surfaces = { ...surfaces, [target]: next };
  }
  return surfaces === room.surfaces ? room : { ...room, surfaces };
}
/** Legacy palette actions still intentionally choose colours, retaining independent texture. */
export function withSurfacePalette<T extends SurfaceRoom>(
  room: T,
  floorFinish: T['floorFinish'],
  wallFinish: T['wallFinish'],
): T {
  const surfaces = room.surfaces && { ...room.surfaces };
  for (const target of ['floor', 'walls', ...WALLS] as const) {
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
