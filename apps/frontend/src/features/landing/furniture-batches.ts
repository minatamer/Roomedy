import { Matrix4 } from 'three';
import type { InstancedMesh } from 'three';
import { proceduralParts } from '../room-view/representations/definitions';
import type { BoxPart } from '../room-view/representations/definitions';
import { detailedParts } from '../room-view/surfaces';
import type { landingFurniture } from './scroll-motion';

type MaterialRole = 'wood' | 'fabric' | 'pillow' | 'metal';

/** Identical authored parts, grouped only by their existing geometry/material pair. */
export function landingFurnitureBatches(
  item: (typeof landingFurniture)[number],
) {
  const batches = new Map<MaterialRole, BoxPart[]>();
  for (const part of detailedParts(
    proceduralParts(item.category, item.size, 'none'),
    item.size,
  )) {
    const role: MaterialRole =
      part.role === 'soft'
        ? part.name.startsWith('pillow') || part.name === 'mattress'
          ? 'pillow'
          : 'fabric'
        : part.role === 'metal'
          ? 'metal'
          : 'wood';
    const bucket = batches.get(role) ?? [];
    bucket.push(part);
    batches.set(role, bucket);
  }
  return Array.from(batches, ([role, parts]) => ({ role, parts }));
}

/** One initial matrix upload; the enclosing furniture group owns all scroll motion. */
export function writeFurnitureInstances(mesh: InstancedMesh, parts: BoxPart[]) {
  const matrix = new Matrix4();
  parts.forEach((part, index) => {
    matrix.makeScale(
      ...(part.size.map((v) => v / 1000) as [number, number, number]),
    );
    matrix.setPosition(
      ...(part.center.map((v) => v / 1000) as [number, number, number]),
    );
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
