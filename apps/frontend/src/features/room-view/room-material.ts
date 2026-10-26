import { Float32BufferAttribute, Vector4 } from 'three';
import type { BufferGeometry, MeshStandardMaterial, Texture } from 'three';
import type { SurfaceDetail, SurfaceTarget } from '@roomedy/contracts/surfaces';

type MaterialMotion = {
  choose(detail: SurfaceDetail): void;
  advance(delta: number): boolean;
};
const materialOwners = new WeakMap<
  MeshStandardMaterial,
  {
    compile: { value: MeshStandardMaterial['onBeforeCompile'] };
    hook: MeshStandardMaterial['onBeforeCompile'];
    motion: MaterialMotion;
  }
>();

export const surfaceRoughness = (sheen: SurfaceDetail['sheen']) =>
  sheen === 'gloss' ? 0.28 : sheen === 'satin' ? 0.58 : 0.94;

const horizontal = (target: SurfaceTarget) =>
  target === 'north' || target === 'south' || target === 'walls';
export function roomTexturePoint(
  target: SurfaceTarget,
  x: number,
  y: number,
  z: number,
) {
  return target === 'floor' ? [x, z] : horizontal(target) ? [x, y] : [z, y];
}

/** Metre UVs make separate aperture spans continuous and remain standard glTF/OBJ UVs. */
export function roomSurfaceGeometry(
  source: BufferGeometry,
  center: readonly number[],
  size: readonly number[],
  target: SurfaceTarget,
) {
  const geometry = source.clone(),
    position = geometry.getAttribute('position');
  const values = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const point = roomTexturePoint(
      target,
      position.getX(i) * size[0]! + center[0]!,
      position.getY(i) * size[1]! + center[1]!,
      position.getZ(i) * size[2]! + center[2]!,
    );
    values[i * 2] = point[0]!;
    values[i * 2 + 1] = point[1]!;
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(values, 2));
  return geometry;
}

export function configureRoomSampler(map: Texture, detail: SurfaceDetail) {
  map.repeat.set(1000 / detail.repeatWidthMm, 1000 / detail.repeatHeightMm);
  map.rotation = (detail.direction * Math.PI) / 2;
  map.offset.set(0, 0);
  map.center.set(0, 0);
  map.updateMatrix();
}

/** One material-owned uniform, no sampler clones or allocations on active frames. */
export function animateRoomMaterial(
  material: MeshStandardMaterial,
  target: SurfaceTarget,
  detail: SurfaceDetail,
) {
  const existing = materialOwners.get(material);
  if (existing) {
    if (material.onBeforeCompile !== existing.hook)
      existing.compile.value = material.onBeforeCompile;
    material.onBeforeCompile = existing.hook;
    material.customProgramCacheKey = () => `roomedy-world-surface-v1-${target}`;
    existing.motion.choose(detail);
    return existing.motion;
  }
  const angle = (detail.direction * Math.PI) / 2;
  const pattern = {
    value: new Vector4(
      detail.repeatWidthMm / 1000,
      detail.repeatHeightMm / 1000,
      angle,
      0,
    ),
  };
  const wanted = pattern.value.clone();
  let roughness = surfaceRoughness(detail.sheen);
  material.roughness = roughness;
  const compile = { value: material.onBeforeCompile };
  material.onBeforeCompile = (shader, renderer) => {
    compile.value.call(material, shader, renderer);
    shader.uniforms.roomedyPattern = pattern;
    shader.vertexShader =
      'uniform vec4 roomedyPattern;\n' + shader.vertexShader;
    const plane = target === 'floor' ? 'xz' : horizontal(target) ? 'xy' : 'zy';
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      #include <project_vertex>
      vec4 roomedyWorld = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        roomedyWorld = instanceMatrix * roomedyWorld;
      #endif
      roomedyWorld = modelMatrix * roomedyWorld;
      vec2 roomedyPoint = roomedyWorld.${plane};
      float roomedyCos = cos(roomedyPattern.z);
      float roomedySin = sin(roomedyPattern.z);
      vec2 roomedyUv = vec2(
        roomedyCos * roomedyPoint.x + roomedySin * roomedyPoint.y,
        -roomedySin * roomedyPoint.x + roomedyCos * roomedyPoint.y
      ) / roomedyPattern.xy;
      #ifdef USE_MAP
        vMapUv = roomedyUv;
        roomedyBaseUv = roomedyUv;
      #endif
      #ifdef USE_NORMALMAP
        vNormalMapUv = roomedyUv;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = roomedyUv;
      #endif
      #ifdef USE_BUMPMAP
        vBumpMapUv = roomedyUv;
      #endif
    `,
    );
    // This material's blend already uses projected coordinates, not the borrowed sampler transform.
    shader.fragmentShader = shader.fragmentShader.replace(
      '(roomedyPreviousTransform * vec3(roomedyBaseUv, 1.0)).xy',
      'roomedyBaseUv',
    );
  };
  material.customProgramCacheKey = () => `roomedy-world-surface-v1-${target}`;
  material.needsUpdate = true;
  const motion: MaterialMotion = {
    choose(next: SurfaceDetail) {
      const radians = (next.direction * Math.PI) / 2;
      const turn =
        pattern.value.z +
        Math.atan2(
          Math.sin(radians - pattern.value.z),
          Math.cos(radians - pattern.value.z),
        );
      wanted.set(
        next.repeatWidthMm / 1000,
        next.repeatHeightMm / 1000,
        turn,
        0,
      );
      roughness = surfaceRoughness(next.sheen);
    },
    advance(delta: number) {
      const distance =
        (pattern.value.x - wanted.x) ** 2 +
        (pattern.value.y - wanted.y) ** 2 +
        (pattern.value.z - wanted.z) ** 2 +
        (material.roughness - roughness) ** 2;
      if (distance <= 0.000001) {
        pattern.value.copy(wanted);
        material.roughness = roughness;
        return false;
      }
      const step = 1 - Math.exp(-Math.min(delta, 0.05) * 18);
      pattern.value.lerp(wanted, step);
      material.roughness += (roughness - material.roughness) * step;
      return true;
    },
  };
  materialOwners.set(material, {
    compile,
    hook: material.onBeforeCompile,
    motion,
  });
  return motion;
}
