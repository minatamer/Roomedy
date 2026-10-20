import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  Matrix3,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';
import type { Color, Material, Object3D } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { BoxPart, PhysicalSize } from './representations/definitions';
import type { SurfaceTexture } from '@roomedy/contracts/surfaces';
import { SurfaceAssets, SURFACE_ASSETS } from './surface-assets';
import type { SurfaceIO } from './surface-assets';

type DetailedMap = DataTexture & {
  detail?: { normal: DataTexture; roughness: DataTexture };
};

export function surfaceProperties(map: DataTexture) {
  const detail = (map as DetailedMap).detail;
  return {
    map,
    bumpMap: detail ? null : map,
    normalMap: detail?.normal ?? null,
    roughnessMap: detail?.roughness ?? null,
  };
}

/** Borrowed colour/data samplers share the same physical tile coordinates. */
export function setSurfaceRepeat(map: DataTexture, x: number, y: number) {
  const detail = (map as DetailedMap).detail;
  for (const sampler of detail ? [map, detail.normal, detail.roughness] : [map])
    sampler.repeat.set(x, y);
}

type Surface =
  'floor' | 'wood' | 'fabric' | 'plaster' | 'smooth' | 'tile' | 'concrete';

/** Mutates only a canvas-owned display color; true keeps demand frames awake. */
export function advanceSurfaceColor(
  current: Color,
  target: Color,
  delta: number,
) {
  const distance =
    Math.abs(current.r - target.r) +
    Math.abs(current.g - target.g) +
    Math.abs(current.b - target.b);
  if (distance <= 0.001) {
    current.copy(target);
    return false;
  }
  current.lerp(target, 1 - Math.exp(-Math.min(delta, 0.05) * 16));
  return true;
}

const noise = (x: number, y: number) => {
  const hash = Math.imul(x + 71, 374761393) ^ Math.imul(y + 19, 668265263);
  return ((Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0) % 1024) / 1023;
};
function texture(kind: Surface) {
  const edge =
    kind === 'floor' ? 512 : kind === 'wood' || kind === 'tile' ? 256 : 128;
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
      if (kind === 'smooth') value = 255;
      if (kind === 'concrete')
        value = 235 + n * 12 + Math.sin(u * 3) * Math.sin(v * 2) * 5;
      if (kind === 'tile') value = x % 64 < 2 || y % 64 < 2 ? 193 : 249 + n * 5;
      const at = (y * edge + x) * 4;
      data[at] =
        data[at + 1] =
        data[at + 2] =
          Math.round(Math.max(0, Math.min(255, value)));
      data[at + 3] = 255;
    }
  // WebGL storage dimensions are immutable after the first upload. Reserve the
  // final local-asset size even while showing a procedural fallback.
  const targetEdge =
    SURFACE_ASSETS.find((asset) => asset.kind === kind)?.edge ?? edge;
  let pixels = data;
  if (targetEdge !== edge) {
    pixels = new Uint8Array(targetEdge * targetEdge * 4);
    for (let y = 0; y < targetEdge; y++)
      for (let x = 0; x < targetEdge; x++) {
        const source =
          (Math.floor((y * edge) / targetEdge) * edge +
            Math.floor((x * edge) / targetEdge)) *
          4;
        pixels.set(data.subarray(source, source + 4), (y * targetEdge + x) * 4);
      }
  }
  const map = new DataTexture(pixels, targetEdge, targetEdge, RGBAFormat);
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

/** Synchronous fallbacks, optional bounded local preparation, one scene-owned lifetime. */
export function createSurfaces(io: SurfaceIO = {}) {
  const maps = {
    floor: texture('floor'),
    wood: texture('wood'),
    fabric: texture('fabric'),
    plaster: texture('plaster'),
    smooth: texture('smooth'),
    tile: texture('tile'),
    concrete: texture('concrete'),
  };
  maps.fabric.repeat.set(3, 3);
  const companions: DataTexture[] = [];
  for (const { kind, edge } of SURFACE_ASSETS) {
    const neutral = (pixels: number[]) => {
      const data = new Uint8Array(edge * edge * 4);
      for (let at = 0; at < data.length; at += 4) data.set(pixels, at);
      const map = new DataTexture(data, edge, edge, RGBAFormat);
      map.wrapS = map.wrapT = RepeatWrapping;
      map.magFilter = LinearFilter;
      map.minFilter = LinearMipmapLinearFilter;
      map.generateMipmaps = true;
      map.anisotropy = 4;
      map.colorSpace = NoColorSpace;
      map.repeat.copy(maps[kind].repeat);
      map.needsUpdate = true;
      companions.push(map);
      return map;
    };
    (maps[kind] as DetailedMap).detail = {
      normal: neutral([128, 128, 255, 255]),
      roughness: neutral([255, 255, 255, 255]),
    };
  }
  let live = true;
  const assets = new SurfaceAssets((kind, pixels) => {
    if (!live) return;
    const map = maps[kind],
      detail = (map as DetailedMap).detail!;
    for (const [target, data] of [
      [map, pixels.color],
      [detail.normal, pixels.normal],
      [detail.roughness, pixels.roughness],
    ] as const) {
      target.image = { data, width: pixels.edge, height: pixels.edge };
      target.needsUpdate = true;
    }
  }, io);
  const hard = new RoundedBoxGeometry(1, 1, 1, 1, 0.012);
  const soft = new RoundedBoxGeometry(1, 1, 1, 1, 0.1);
  return {
    ...maps,
    hard,
    soft,
    textures: [...Object.values(maps), ...companions],
    load: (signal?: AbortSignal) => assets.load(signal),
    dispose() {
      if (!live) return;
      live = false;
      assets.dispose();
      for (const map of [...Object.values(maps), ...companions]) map.dispose();
      hard.dispose();
      soft.dispose();
    },
  };
}
export type Surfaces = ReturnType<typeof createSurfaces>;
export function roomSurfaceMap(surfaces: Surfaces, texture: SurfaceTexture) {
  return texture === 'planks'
    ? surfaces.floor
    : texture === 'carpet' || texture === 'linen'
      ? surfaces.fabric
      : surfaces[texture];
}

/** Two borrowed samplers, one latest pending target; no textures or room state are created per frame. */
export function createSurfaceBlend(material: MeshStandardMaterial) {
  const previous = { value: material.map },
    progress = { value: 1 },
    previousTransform = { value: new Matrix3() };
  let pending: DataTexture | null = null;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roomedyPreviousMap = previous;
    shader.uniforms.roomedySurfaceMix = progress;
    shader.uniforms.roomedyPreviousTransform = previousTransform;
    shader.vertexShader = 'varying vec2 roomedyBaseUv;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      '#include <uv_vertex>\n#ifdef USE_MAP\nroomedyBaseUv = MAP_UV;\n#endif',
    );
    shader.fragmentShader =
      'uniform sampler2D roomedyPreviousMap;\nuniform float roomedySurfaceMix;\nuniform mat3 roomedyPreviousTransform;\nvarying vec2 roomedyBaseUv;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec4 surfaceColor = mix(texture2D(roomedyPreviousMap, (roomedyPreviousTransform * vec3(roomedyBaseUv, 1.0)).xy), texture2D(map, vMapUv), roomedySurfaceMix);
        diffuseColor *= surfaceColor;
      #endif
    `,
    );
  };
  material.customProgramCacheKey = () => 'roomedy-surface-blend-v2';
  material.needsUpdate = true;
  return {
    choose(map: DataTexture) {
      pending = map === material.map ? null : map;
    },
    advance(delta: number) {
      if (progress.value >= 1 && pending) {
        previous.value = material.map;
        if (material.map) {
          material.map.updateMatrix();
          previousTransform.value.copy(material.map.matrix);
        }
        setSurfaceMap(material, pending);
        pending = null;
        material.needsUpdate = true;
        progress.value = 0;
      }
      progress.value = Math.min(
        1,
        progress.value + Math.max(0, Math.min(delta, 0.05)) / 0.24,
      );
      return progress.value < 1 || pending !== null;
    },
  };
}

export function setSurfaceMap(
  material: MeshStandardMaterial,
  map: DataTexture,
) {
  Object.assign(material, surfaceProperties(map));
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
            part.center[0] === 0
              ? size.width / 2 - 40
              : Math.sign(part.center[0]) * 34,
            size.height * 0.5,
            part.center[2] + 2,
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
        setSurfaceMap(material, cloth ? surfaces.fabric : surfaces.wood);
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
