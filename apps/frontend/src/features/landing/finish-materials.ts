import { Color, CylinderGeometry, Matrix4, MeshStandardMaterial } from 'three';
import type { InstancedMesh, WebGLRenderer } from 'three';
import { surfaceProperties, setSurfaceRepeat } from '../room-view/surfaces';
import type { Surfaces } from '../room-view/surfaces';
import {
  landingFinishState,
  landingFloorCount,
  landingFloorPanel,
  landingPaintStroke,
} from './finish-motion';
import type { LandingWall } from './finish-motion';
import { boundedProgress } from './scroll-motion';

/** compileAsync may settle despite a rejected program. Retire once and keep a bounded diagnostic. */
export function watchLandingShaders(
  debug: Pick<WebGLRenderer['debug'], 'onShaderError'>,
  failed: () => void,
  report: (code: string) => void,
) {
  const previous = debug.onShaderError;
  let live = true,
    reported = false;
  const error: NonNullable<typeof previous> = (...args) => {
    if (!live || reported) return;
    reported = true;
    failed();
    if (previous) previous(...args);
    else report('roomedy-landing-shader-unavailable');
  };
  debug.onShaderError = error;
  return () => {
    live = false;
    if (debug.onShaderError === error) debug.onShaderError = previous;
  };
}

function paintMaterial(
  surfaces: Surfaces,
  wall: LandingWall,
  plain: string,
  finish: string,
) {
  const material = new MeshStandardMaterial({
      color: plain,
      ...surfaceProperties(surfaces.plaster),
      roughness: 0.9,
    }),
    color = new Color(finish),
    tint = new Color().setRGB(
      color.r / material.color.r,
      color.g / material.color.g,
      color.b / material.color.b,
    ),
    progress = { value: 0 },
    sample = landingPaintStroke(wall, 0);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.roomedyPaint = progress;
    shader.uniforms.roomedyPaintTint = { value: tint };
    shader.vertexShader =
      'varying vec3 roomedyPaintPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      'roomedyPaintPosition = (instanceMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>',
    );
    shader.fragmentShader =
      'varying vec3 roomedyPaintPosition;\nuniform float roomedyPaint;\nuniform vec3 roomedyPaintTint;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float painted = roomedyPaint;
      if (roomedyPaint > 0.0 && roomedyPaint < 1.0) {
      float stripe = clamp(floor((roomedyPaintPosition.${wall === 'north' ? 'x' : 'z'} + ${(sample.width / 2).toFixed(6)}) / ${sample.width.toFixed(6)} * ${sample.columns}.0), 0.0, ${sample.columns - 1}.0);
      float covered = clamp((roomedyPaint * ${sample.columns}.0 - stripe) / 0.8, 0.0, 1.0);
      float height = clamp((roomedyPaintPosition.y + 0.025) / 2.65, 0.0, 1.0);
      float stroke = mix(height, 1.0 - height, mod(stripe, 2.0));
      painted = (1.0 - smoothstep(covered - 0.008, covered + 0.008, stroke)) * step(0.00001, covered);
      }
      diffuseColor.rgb *= mix(vec3(1.0), roomedyPaintTint, painted);
    `,
    );
  };
  material.customProgramCacheKey = () => `roomedy-landing-paint-v2-${wall}`;
  return { material, progress };
}

/** Owns only added landing materials/tool geometry; every map is borrowed. */
export function createLandingFinishMaterials(surfaces: Surfaces) {
  const north = paintMaterial(surfaces, 'north', '#e9e1d2', '#c2c7ad'),
    west = paintMaterial(surfaces, 'west', '#e2d9c7', '#b2ba9f'),
    plainFloor = new MeshStandardMaterial({
      color: '#d5cbb9',
      ...surfaceProperties(surfaces.smooth),
      roughness: 0.94,
    }),
    floor = new MeshStandardMaterial({
      color: '#c8a477',
      ...surfaceProperties(surfaces.floor),
      roughness: 0.78,
    }),
    roller = new MeshStandardMaterial({
      color: '#c2c7ad',
      ...surfaceProperties(surfaces.fabric),
      roughness: 1,
    }),
    cylinder = new CylinderGeometry(0.055, 0.055, 0.58, 12),
    oak = new Color('#c8a477'),
    laminate = new Color('#d4cbb3');
  setSurfaceRepeat(surfaces.floor, 1.1 / 1.2, 0.7 / 1.2);
  const owned = [north.material, west.material, plainFloor, floor, roller];
  for (const material of [north.material, west.material, floor])
    material.emissive.set('#8d652f');
  let live = true;
  return {
    north,
    west,
    plainFloor,
    floor,
    roller,
    cylinder,
    present(progress: number) {
      if (!live) return;
      north.progress.value = landingPaintStroke('north', progress).amount;
      west.progress.value = landingPaintStroke('west', progress).amount;
      const state = landingFinishState(progress);
      floor.color.lerpColors(oak, laminate, state.floorMix);
      floor.roughness = 0.78 + state.floorMix * 0.1;
      floor.emissiveIntensity = state.floorHighlight * 0.38;
      north.material.emissiveIntensity = west.material.emissiveIntensity =
        state.paintHighlight * 0.38;
    },
    dispose() {
      if (!live) return;
      live = false;
      for (const material of owned) material.dispose();
      cylinder.dispose();
    },
  };
}
export type LandingFinishMaterials = ReturnType<
  typeof createLandingFinishMaterials
>;

/** Fixed instance storage. Matrices change only during the finite scroll journey. */
export function createLandingFloorWriter(mesh: InstancedMesh) {
  const matrix = new Matrix4();
  let previous = -1;
  return (progress: number) => {
    const value = Math.min(0.456, Math.max(0.34, boundedProgress(progress)));
    if (value === previous) return;
    previous = value;
    let count = 0;
    for (let i = 0; i < landingFloorCount; i++) {
      const panel = landingFloorPanel(i, value);
      if (panel.amount > 0) count++;
      matrix.makeScale(...panel.scale).setPosition(...panel.position);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  };
}
