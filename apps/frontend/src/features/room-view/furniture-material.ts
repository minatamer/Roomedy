import { Color, MeshStandardMaterial } from 'three';
import type { FurnitureMaterialTarget } from '@roomedy/contracts/furniture-materials';
import type { furnitureMaterialTargets } from '@roomedy/contracts/furniture-materials';
import {
  advanceSurfaceColor,
  createSurfaceBlend,
  surfaceProperties,
} from './surfaces';
import type { Surfaces } from './surfaces';

type Targets = ReturnType<typeof furnitureMaterialTargets>;
const roles = ['frame', 'soft', 'blanket', 'metal'] as const;

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

/** One piece owns four small materials; samplers belong to the existing scene. */
export function createFurnitureMaterials(initial: Targets, surfaces: Surfaces) {
  const materials = {
    frame: furnitureMaterial(initial.frame, surfaces),
    soft: furnitureMaterial(initial.soft, surfaces),
    blanket: furnitureMaterial(initial.blanket, surfaces),
    metal: furnitureMaterial(initial.metal, surfaces),
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
        for (const material of Object.values(materials))
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
      for (const material of Object.values(materials)) material.dispose();
    },
  };
}
