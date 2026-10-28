import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { landingFurniture } from '../apps/frontend/src/features/landing/scroll-motion.js';
import {
  landingFurnitureBatches,
  writeFurnitureInstances,
} from '../apps/frontend/src/features/landing/furniture-batches.js';
import { proceduralParts } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { detailedParts } from '../apps/frontend/src/features/room-view/surfaces.js';

const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { BoxGeometry, InstancedMesh, Matrix4, MeshStandardMaterial } =
  await import(
    pathToFileURL(requireFrontend.resolve('three/src/Three.js')).href
  );

describe('landing furniture instancing', () => {
  it('retains every authored part in exactly its original material and geometry group', () => {
    for (const item of landingFurniture) {
      const expected = detailedParts(
        proceduralParts(item.category, item.size, 'none'),
        item.size,
      );
      const batches = landingFurnitureBatches(item);
      expect(
        batches
          .flatMap(({ parts }) => parts)
          .sort((a, b) => a.name.localeCompare(b.name)),
      ).toEqual(expected.sort((a, b) => a.name.localeCompare(b.name)));
      expect(batches.length).toBeLessThan(expected.length);
      expect(batches.length).toBeLessThanOrEqual(4);
      for (const { role, parts } of batches)
        for (const part of parts) {
          if (part.role === 'soft')
            expect(role).toBe(
              part.name.startsWith('pillow') || part.name === 'mattress'
                ? 'pillow'
                : 'fabric',
            );
          else expect(role).toBe(part.role === 'metal' ? 'metal' : 'wood');
        }
    }
  });

  it('writes exact metre-scale transforms and usable bounds without changing borrowed resources', () => {
    const geometry = new BoxGeometry(),
      material = new MeshStandardMaterial(),
      matrix = new Matrix4();
    try {
      for (const item of landingFurniture)
        for (const { parts } of landingFurnitureBatches(item)) {
          const mesh = new InstancedMesh(geometry, material, parts.length);
          try {
            writeFurnitureInstances(mesh, parts);
            parts.forEach((part, index) => {
              mesh.getMatrixAt(index, matrix);
              for (const [axis, element] of [0, 5, 10].entries())
                expect(matrix.elements[element]!).toBeCloseTo(
                  part.size[axis]! / 1000,
                  6,
                );
              part.center.forEach((value, axis) =>
                expect(matrix.elements[12 + axis]).toBeCloseTo(value / 1000, 6),
              );
            });
            expect(mesh.boundingSphere?.radius).toBeGreaterThan(0);
            expect(mesh.geometry).toBe(geometry);
            expect(mesh.material).toBe(material);
          } finally {
            mesh.dispose();
          }
        }
    } finally {
      geometry.dispose();
      material.dispose();
    }
  });
});
