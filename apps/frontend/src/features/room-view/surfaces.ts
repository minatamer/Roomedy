import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';
import type { Material, Object3D } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { BoxPart, PhysicalSize } from './representations/definitions';

type Surface = 'floor' | 'wood' | 'fabric' | 'plaster';
const noise = (x: number, y: number) => {
  const hash = Math.imul(x + 71, 374761393) ^ Math.imul(y + 19, 668265263);
  return ((Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0) % 1024) / 1023;
};
function texture(kind: Surface) {
  const edge = kind === 'floor' ? 512 : kind === 'wood' ? 256 : 128;
  const data = new Uint8Array(edge * edge * 4);
  for (let y = 0; y < edge; y++)
    for (let x = 0; x < edge; x++) {
      const u = (x / edge) * Math.PI * 2,
        v = (y / edge) * Math.PI * 2;
      const grain =
        Math.sin(u * 41 + Math.sin(v * 2) * 2) +
        0.4 * Math.sin(u * 97 + Math.sin(v * 3) * 3);
      const n = noise(x, y);
      let value =
        kind === 'fabric'
          ? 239 + (x % 4 < 2 !== y % 4 < 2 ? 6 : -6) + n * 4
          : kind === 'plaster'
            ? 247 + n * 6
            : 248 + grain * 1.5 + n * 2;
      if (kind === 'floor') {
        const board = Math.floor(x / 128),
          joint = (y + board * 137) % edge;
        value += (noise(board, 0) - 0.5) * 9;
        if (x % 128 === 0 || joint === 0) value -= 28;
      }
      const at = (y * edge + x) * 4;
      data[at] =
        data[at + 1] =
        data[at + 2] =
          Math.round(Math.max(0, Math.min(255, value)));
      data[at + 3] = 255;
    }
  const map = new DataTexture(data, edge, edge, RGBAFormat);
  map.name = `roomedy-${kind}`;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.magFilter = LinearFilter;
  map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = 4;
  map.colorSpace = SRGBColorSpace;
  if (kind === 'fabric') map.repeat.set(8, 8);
  if (kind === 'plaster') map.repeat.set(4, 4);
  map.needsUpdate = true;
  return map;
}

/** Finite canvas-owned detail; no network, DOM canvas, randomness or global GPU cache. */
export function createSurfaces() {
  const maps = {
    floor: texture('floor'),
    wood: texture('wood'),
    fabric: texture('fabric'),
    plaster: texture('plaster'),
  };
  const hard = new RoundedBoxGeometry(1, 1, 1, 1, 0.012);
  const soft = new RoundedBoxGeometry(1, 1, 1, 1, 0.1);
  return {
    ...maps,
    hard,
    soft,
    dispose() {
      for (const map of Object.values(maps)) map.dispose();
      hard.dispose();
      soft.dispose();
    },
  };
}
export type Surfaces = ReturnType<typeof createSurfaces>;

export function setSurfaceMap(
  material: MeshStandardMaterial,
  map: DataTexture,
) {
  material.map = material.bumpMap = map;
  material.needsUpdate = true;
}

/** Styling stays inside the authored outer size; original catalogue parts are untouched. */
export function detailedParts(parts: BoxPart[], size: PhysicalSize): BoxPart[] {
  return parts.flatMap((part) => {
    if (part.name === 'pillow')
      return [-1, 1].map((side) => ({
        ...part,
        name: `pillow-${side}`,
        center: [
          part.center[0] + side * part.size[0] * 0.26,
          part.center[1],
          part.center[2],
        ] as const,
        size: [part.size[0] * 0.46, part.size[1], part.size[2]] as const,
      }));
    if (part.name.startsWith('door-'))
      return [
        {
          ...part,
          center: [
            part.center[0],
            part.center[1],
            part.center[2] - 14,
          ] as const,
        },
        {
          name: `handle-${part.name}`,
          center: [
            Math.sign(part.center[0]) * 34,
            size.height * 0.5,
            size.depth / 2 - 10,
          ] as const,
          size: [12, 110, 12] as const,
          role: 'metal' as const,
        },
      ];
    return [part];
  });
}

/** Instance-owned material copies borrow immutable cache geometry and canvas textures. */
export function surfaceModel(source: Object3D, surfaces: Surfaces) {
  const object = source.clone(true),
    materials = new Map<Material, Material>();
  const copy = (sourceMaterial: Material, uv: boolean) => {
    const cached = materials.get(sourceMaterial);
    if (cached) return cached;
    const material = sourceMaterial.clone();
    materials.set(sourceMaterial, material);
    if (material instanceof MeshStandardMaterial) {
      const name = material.name.toLowerCase();
      if (name.includes('metal')) {
        material.metalness = 0.55;
        material.roughness = 0.38;
      } else if (uv && (name.includes('wood') || name.includes('carpet'))) {
        const cloth = name.includes('carpet');
        material.map = cloth ? surfaces.fabric : surfaces.wood;
        material.bumpMap = material.map;
        material.bumpScale = cloth ? 0.0012 : 0.0004;
        material.roughness = cloth ? 0.95 : 0.65;
      }
    }
    return material;
  };
  object.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const uv = !!o.geometry.getAttribute('uv');
    o.material = Array.isArray(o.material)
      ? o.material.map((m) => copy(m, uv))
      : copy(o.material, uv);
    o.castShadow = o.receiveShadow = true;
  });
  return {
    object,
    dispose() {
      for (const material of materials.values()) material.dispose();
    },
  };
}
