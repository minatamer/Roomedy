import {
  CanvasTexture,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  SRGBColorSpace,
} from 'three';
import type { WebGLRenderer, WebGLRenderTarget } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Shared window appearance: authored daylight and one owned reflection map per scene. */
export function createWindowGlass() {
  const daylight = new MeshBasicMaterial();
  let texture: CanvasTexture | undefined;
  const prepareDaylight = () => {
    if (texture) return;
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
    texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    daylight.map = texture;
    daylight.needsUpdate = true;
  };
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
  const mirror = new MeshStandardMaterial({
    color: '#f1eee7',
    metalness: 1,
    roughness: 0.065,
    envMapIntensity: 1.1,
  });
  let environment: WebGLRenderTarget | undefined;
  let disposed = false;
  return {
    material,
    mirror,
    daylight,
    prepare(renderer?: WebGLRenderer) {
      if (disposed) return;
      prepareDaylight();
      if (!renderer || environment) return;
      renderer.transmissionResolutionScale = Math.min(
        renderer.transmissionResolutionScale,
        0.35,
      );
      const room = new RoomEnvironment(),
        generator = new PMREMGenerator(renderer);
      try {
        environment = generator.fromScene(room, 0.04, 0.1, 100, { size: 128 });
        material.envMap = environment.texture;
        mirror.envMap = environment.texture;
        mirror.needsUpdate = true;
        renderer.initTexture(texture!);
      } finally {
        room.dispose();
        generator.dispose();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      material.dispose();
      mirror.dispose();
      daylight.dispose();
      texture?.dispose();
      environment?.dispose();
    },
  };
}
