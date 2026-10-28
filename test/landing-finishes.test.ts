import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createSurfaces } from '../apps/frontend/src/features/room-view/surfaces.js';
import {
  createLandingFinishMaterials,
  createLandingFloorWriter,
  watchLandingShaders,
} from '../apps/frontend/src/features/landing/finish-materials.js';
import {
  landingFinishState,
  landingFloorCount,
  landingFloorPanel,
  landingPaintStroke,
  landingSurfaces,
  landingWallParts,
} from '../apps/frontend/src/features/landing/finish-motion.js';

const requireFrontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { BoxGeometry, InstancedMesh, Matrix4 } = await import(
  pathToFileURL(requireFrontend.resolve('three/src/Three.js')).href
);
type ShaderFailureArgs = Parameters<
  NonNullable<Parameters<typeof watchLandingShaders>[0]['onShaderError']>
>;
const shaderFailureArgs = [{}, {}, {}, {}] as ShaderFailureArgs;

describe('finite room finishing choreography', () => {
  it('fences shader failure once even when the renderer preparation promise can settle', () => {
    const failed = vi.fn(),
      report = vi.fn(),
      previous = vi.fn(),
      debug: Parameters<typeof watchLandingShaders>[0] = {
        onShaderError: previous,
      },
      restore = watchLandingShaders(debug, failed, report),
      error = debug.onShaderError!;
    const args = shaderFailureArgs;
    error(...args);
    error(...args);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(previous).toHaveBeenCalledExactlyOnceWith(...args);
    expect(report).not.toHaveBeenCalled();
    restore();
    expect(debug.onShaderError).toBe(previous);
    error(...args);
    expect(failed).toHaveBeenCalledTimes(1);
  });
  it('keeps one safe shader diagnostic and never overwrites a subsequent local callback on cleanup', () => {
    const failed = vi.fn(),
      report = vi.fn(),
      debug: Parameters<typeof watchLandingShaders>[0] = {
        onShaderError: null,
      },
      restore = watchLandingShaders(debug, failed, report);
    debug.onShaderError!(...shaderFailureArgs);
    expect(report).toHaveBeenCalledExactlyOnceWith(
      'roomedy-landing-shader-unavailable',
    );
    const later = vi.fn();
    debug.onShaderError = later;
    restore();
    expect(debug.onShaderError).toBe(later);
  });
  it.each(['north', 'west'] as const)(
    'retraces every %s roller stroke without a jump at its sideways connector',
    (wall) => {
      let prior = landingPaintStroke(wall, 0);
      expect(prior.amount).toBe(0);
      expect(prior.opacity).toBe(0);
      const samples: number[][] = [];
      let finite = true,
        monotone = true,
        bounded = true,
        largestStep = 0;
      for (let i = 0; i <= 10000; i++) {
        const p = i / 10000,
          current = landingPaintStroke(wall, p);
        finite &&= Object.values(current).every(Number.isFinite);
        monotone &&= current.amount >= prior.amount && current.amount <= 1;
        bounded &&=
          current.y >= landingSurfaces.wallBottom &&
          current.y <=
            landingSurfaces.wallBottom + landingSurfaces.wallHeight &&
          Math.abs(current.along) <= current.width / 2;
        bounded &&=
          current.rollerY -
            0.54 * Math.cos(current.handlePitch) -
            0.013 * Math.abs(Math.sin(current.handlePitch)) >=
          0;
        largestStep = Math.max(
          largestStep,
          Math.abs(current.y - prior.y),
          Math.abs(current.along - prior.along),
        );
        samples.push(Object.values(current));
        prior = current;
      }
      let reversible = true;
      for (let i = 10000; i >= 0; i--)
        reversible &&= Object.values(landingPaintStroke(wall, i / 10000)).every(
          (n, k) => n === samples[i]![k],
        );
      expect({ finite, monotone, bounded, reversible }).toEqual({
        finite: true,
        monotone: true,
        bounded: true,
        reversible: true,
      });
      expect(largestStep).toBeLessThan(0.07);
      expect(prior.amount).toBe(1);
      expect(prior.opacity).toBe(0);
      expect(landingPaintStroke(wall, NaN)).toEqual(
        landingPaintStroke(wall, 0),
      );
    },
  );
  it('preserves the actual window aperture in the north wall and lifts the roller in front of it', () => {
    for (const part of landingWallParts.north) {
      const left = part.center[0] - part.size[0] / 2,
        right = part.center[0] + part.size[0] / 2,
        bottom = part.center[1] - part.size[1] / 2,
        top = part.center[1] + part.size[1] / 2;
      expect(
        right <= 325 || left >= 1575 || top <= 1025 || bottom >= 2275,
      ).toBe(true);
    }
    let raised = false;
    for (let i = 1900; i <= 3000; i++) {
      const stroke = landingPaintStroke('north', i / 10000);
      if (
        stroke.along > 0.35 &&
        stroke.along < 1.55 &&
        stroke.y > 1.05 &&
        stroke.y < 2.25
      ) {
        expect(stroke.lift).toBeCloseTo(1);
        raised = true;
      }
    }
    expect(raised).toBe(true);
  });
  it('lays every panel once into a flush, bounded floor and retraces intermediate assembly', () => {
    const complete = Array.from({ length: landingFloorCount }, (_, i) =>
      landingFloorPanel(i, 1),
    );
    expect(complete).toHaveLength(28);
    for (const panel of complete) {
      expect(panel.amount).toBe(1);
      expect(panel.position[1] + panel.scale[1] / 2).toBeCloseTo(0);
      expect(
        Math.abs(panel.position[0]) + panel.scale[0] / 2,
      ).toBeLessThanOrEqual(landingSurfaces.width / 2);
      expect(
        Math.abs(panel.position[2]) + panel.scale[2] / 2,
      ).toBeLessThanOrEqual(landingSurfaces.depth / 2);
    }
    let monotone = true,
      finite = true,
      nonnegative = true,
      reversible = true,
      largestStep = 0;
    for (let i = 0; i < landingFloorCount; i++) {
      expect(landingFloorPanel(i, 0).amount).toBe(0);
      let prior = landingFloorPanel(i, 0);
      const samples: number[][] = [];
      for (let step = 0; step <= 1000; step++) {
        const panel = landingFloorPanel(i, step / 1000);
        monotone &&= panel.amount >= prior.amount;
        finite &&= [panel.amount, ...panel.position, ...panel.scale].every(
          Number.isFinite,
        );
        nonnegative &&= panel.scale.every((n) => n >= 0);
        largestStep = Math.max(
          largestStep,
          ...panel.position.map((n, k) => Math.abs(n - prior.position[k]!)),
        );
        samples.push([panel.amount, ...panel.position, ...panel.scale]);
        prior = panel;
      }
      for (let step = 1000; step >= 0; step--) {
        const panel = landingFloorPanel(i, step / 1000);
        reversible &&= [panel.amount, ...panel.position, ...panel.scale].every(
          (n, k) => n === samples[step]![k],
        );
      }
    }
    expect({ monotone, finite, nonnegative, reversible }).toEqual({
      monotone: true,
      finite: true,
      nonnegative: true,
      reversible: true,
    });
    expect(largestStep).toBeLessThan(0.02);
    expect(landingFloorPanel(-Infinity, NaN)).toEqual(landingFloorPanel(0, 0));
  });
  it('reuses fixed instance storage, sleeps after settlement and returns to no panels', () => {
    const geometry = new BoxGeometry(),
      maps = createSurfaces({ deferFallback: true }),
      resources = createLandingFinishMaterials(maps),
      mesh = new InstancedMesh(geometry, resources.floor, landingFloorCount),
      matrix = new Matrix4(),
      write = createLandingFloorWriter(mesh);
    try {
      write(0);
      expect(mesh.count).toBe(0);
      write(0.39);
      expect(mesh.count).toBeGreaterThan(0);
      expect(mesh.count).toBeLessThan(landingFloorCount);
      write(0.5);
      expect(mesh.count).toBe(landingFloorCount);
      const version = mesh.instanceMatrix.version;
      write(1);
      expect(mesh.instanceMatrix.version).toBe(version);
      for (let i = 0; i < landingFloorCount; i++) {
        mesh.getMatrixAt(i, matrix);
        const panel = landingFloorPanel(i, 1);
        panel.position.forEach((n, k) =>
          expect(matrix.elements[12 + k]).toBeCloseTo(n, 6),
        );
      }
      write(0);
      expect(mesh.count).toBe(0);
    } finally {
      mesh.dispose();
      geometry.dispose();
      resources.dispose();
      maps.dispose();
    }
  });
  it('keeps shader identities/maps fixed while paint, highlights and alternative colours change', () => {
    const maps = createSurfaces({ deferFallback: true }),
      resources = createLandingFinishMaterials(maps);
    try {
      for (const wall of ['north', 'west'] as const) {
        const material = resources[wall].material,
          shader = {
            uniforms: {},
            vertexShader: '#include <project_vertex>',
            fragmentShader: '#include <color_fragment>',
          } as Parameters<typeof material.onBeforeCompile>[0];
        material.onBeforeCompile(
          shader,
          {} as Parameters<typeof material.onBeforeCompile>[1],
        );
        expect(shader.vertexShader).toContain(
          'instanceMatrix * vec4(transformed',
        );
        // GLSL rejects float / int. This covers the actual west-width=5 regression.
        expect(shader.fragmentShader).not.toMatch(/\) \/ \d+ \*/);
        expect(shader.fragmentShader).toContain(
          wall === 'west' ? '/ 5.000000 *' : '/ 4.450000 *',
        );
        expect(shader.uniforms.roomedyPaint).toBe(resources[wall].progress);
      }
      resources.present(0);
      const first = resources.floor.color.clone(),
        version = resources.floor.version;
      expect(resources.north.progress.value).toBe(0);
      resources.present(0.53);
      expect(resources.north.material.emissiveIntensity).toBeGreaterThan(0);
      resources.present(1);
      expect(resources.north.progress.value).toBe(1);
      expect(resources.west.progress.value).toBe(1);
      expect(resources.floor.color.equals(first)).toBe(false);
      expect(resources.floor.map).toBe(maps.floor);
      expect(resources.floor.version).toBe(version);
      resources.present(0);
      expect(resources.floor.color.equals(first)).toBe(true);
    } finally {
      resources.dispose();
      maps.dispose();
    }
  });
  it('retires owned resources once, fences late presentation and never disposes borrowed samplers', () => {
    const maps = createSurfaces({ deferFallback: true }),
      resources = createLandingFinishMaterials(maps);
    let materials = 0,
      geometry = 0,
      textures = 0;
    for (const mat of [
      resources.floor,
      resources.plainFloor,
      resources.north.material,
      resources.west.material,
      resources.roller,
    ])
      mat.addEventListener('dispose', () => materials++);
    resources.cylinder.addEventListener('dispose', () => geometry++);
    for (const map of maps.textures)
      map.addEventListener('dispose', () => textures++);
    resources.present(0);
    resources.dispose();
    resources.dispose();
    resources.present(1);
    expect(resources.north.progress.value).toBe(0);
    expect({ materials, geometry, textures }).toEqual({
      materials: 5,
      geometry: 1,
      textures: 0,
    });
    maps.dispose();
    expect(textures).toBe(15);
  });
  it('keeps alternative/highlight/plan values finite and reversible for malformed and ordinary progress', () => {
    for (const p of [NaN, Infinity, -1, 0, 0.49, 0.54, 0.57, 0.65, 1, 2]) {
      const state = landingFinishState(p);
      for (const n of [
        state.floorMix,
        state.floorHighlight,
        state.paintHighlight,
        state.planOpen,
      ]) {
        expect(Number.isFinite(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });
});
