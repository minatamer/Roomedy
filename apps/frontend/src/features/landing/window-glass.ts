import {
  CanvasTexture,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PMREMGenerator,
  SRGBColorSpace,
} from 'three';
import type { WebGLRenderer, WebGLRenderTarget } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Landing-only glass: finite authored daylight and a single prepared reflection map. */
export function createWindowGlass() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('window-surface-unavailable');
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#bed1d6');
  sky.addColorStop(0.55, '#e8eee7');
  sky.addColorStop(1, '#c8c5a7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 256);
  const glow = ctx.createRadialGradient(175, 55, 0, 175, 55, 130);
  glow.addColorStop(0, '#fff9eec7');
  glow.addColorStop(1, '#fff9ee00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const daylight = new MeshBasicMaterial({ map: texture });
  const material = new MeshPhysicalMaterial({
    color: '#f1f7f4',
    metalness: 0,
    roughness: 0.065,
    transmission: 0.96,
    thickness: 0.012,
    ior: 1.5,
    attenuationColor: '#c4dacf',
    attenuationDistance: 3.5,
    envMapIntensity: 1.15,
  });
  let environment: WebGLRenderTarget | undefined;
  return {
    material,
    daylight,
    prepare(renderer: WebGLRenderer) {
      if (environment) return;
      const room = new RoomEnvironment(),
        generator = new PMREMGenerator(renderer);
      try {
        environment = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
        material.envMap = environment.texture;
        renderer.initTexture(texture);
      } finally {
        room.dispose();
        generator.dispose();
      }
    },
    dispose() {
      material.dispose();
      daylight.dispose();
      texture.dispose();
      environment?.dispose();
    },
  };
}
