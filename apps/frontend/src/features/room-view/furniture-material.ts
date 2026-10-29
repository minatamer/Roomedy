import { Color, MeshStandardMaterial } from 'three';
import type { FurnitureMaterialTarget } from '@roomedy/contracts/furniture-materials';
import type { furnitureMaterialTargets } from '@roomedy/contracts/furniture-materials';
import {
  advanceSurfaceColor,
  createSurfaceBlend,
  surfaceProperties,
} from './surfaces';
import type { Surfaces } from './surfaces';
import type { BoxPart } from './representations/definitions';

type Targets = ReturnType<typeof furnitureMaterialTargets>;
/** Geometry stays soft/bevelled while its bedding material is independently editable. */
export function furniturePartRole(part: Pick<BoxPart, 'name' | 'role'>) {
  if (part.role === 'detail') return 'detail';
  if (part.name.startsWith('blanket')) return 'blanket';
  if (part.name.startsWith('pillow')) return 'pillow';
  if (part.name === 'mattress') return 'sheet';
  return part.role;
}

export function furnitureMaterial(
  target: FurnitureMaterialTarget,
  surfaces: Surfaces,
) {
  return new MeshStandardMaterial({
    color: target.color,
    ...surfaceProperties(surfaces[target.surface]),
    roughness: target.roughness,
    metalness: target.metalness,
    bumpScale: target.bumpScale,
  });
}

/** Only beds add two part materials; samplers belong to the existing scene. */
export function createFurnitureMaterials(initial: Targets, surfaces: Surfaces) {
  const bedding = initial.pillow !== initial.soft;
  const roles = bedding
    ? ([
        'frame',
        'soft',
        'blanket',
        'pillow',
        'sheet',
        'metal',
        'detail',
      ] as const)
    : (['frame', 'soft', 'blanket', 'metal', 'detail'] as const);
  const soft = furnitureMaterial(initial.soft, surfaces);
  const materials = {
    frame: furnitureMaterial(initial.frame, surfaces),
    soft,
    pillow: bedding ? furnitureMaterial(initial.pillow, surfaces) : soft,
    sheet: bedding ? furnitureMaterial(initial.sheet, surfaces) : soft,
    blanket: furnitureMaterial(initial.blanket, surfaces),
    metal: furnitureMaterial(initial.metal, surfaces),
    detail: furnitureMaterial(initial.detail, surfaces),
  };
  const blends = Object.fromEntries(
    roles.map((role) => [role, createSurfaceBlend(materials[role])]),
  ) as Record<(typeof roles)[number], ReturnType<typeof createSurfaceBlend>>;
  const colors = Object.fromEntries(
    roles.map((role) => [role, new Color(initial[role].color)]),
  ) as Record<(typeof roles)[number], Color>;
  let targets = initial,
    retired = false;
  return {
    materials,
    choose(next: Targets) {
      // React may re-enter the same layout owner after its Strict Mode cleanup.
      if (retired)
        for (const material of new Set(Object.values(materials)))
          material.needsUpdate = true;
      retired = false;
      targets = next;
      for (const role of roles) {
        colors[role].set(next[role].color);
        blends[role].choose(surfaces[next[role].surface]);
      }
    },
    advance(delta: number) {
      if (retired) return false;
      let moving = false;
      const amount = 1 - Math.exp(-Math.max(0, Math.min(delta, 0.05)) * 16);
      for (const role of roles) {
        const material = materials[role],
          target = targets[role];
        if (advanceSurfaceColor(material.color, colors[role], delta))
          moving = true;
        if (blends[role].advance(delta)) moving = true;
        for (const key of ['roughness', 'metalness', 'bumpScale'] as const) {
          if (Math.abs(material[key] - target[key]) <= 0.00001)
            material[key] = target[key];
          else {
            material[key] += (target[key] - material[key]) * amount;
            moving = true;
          }
        }
      }
      return moving;
    },
    dispose() {
      if (retired) return;
      retired = true;
      for (const material of new Set(Object.values(materials)))
        material.dispose();
    },
  };
}
