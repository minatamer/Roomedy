import { Frustum, Matrix4, PlaneGeometry, Sphere, Vector3 } from 'three';
import type { Camera, Object3D } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const MIRROR_RESOLUTION = 512;
type Surface = {
  id: string;
  pieceId: string;
  object: Object3D;
  width: number;
  height: number;
};
/** One scene-owned pass/target, independent of the number of furniture mirrors. */
export function createMirrorReflection() {
  const geometry = new PlaneGeometry(1, 1);
  const reflector = new Reflector(geometry, {
    textureWidth: MIRROR_RESOLUTION,
    textureHeight: MIRROR_RESOLUTION,
    multisample: 0,
    clipBias: 0.003,
    color: '#b8b8b8',
  });
  reflector.name = 'Room reflection';
  reflector.visible = false;
  reflector.raycast = () => {};
  const surfaces = new Map<string, Surface>();
  const frustum = new Frustum(),
    matrix = new Matrix4(),
    position = new Vector3(),
    normal = new Vector3(),
    viewer = new Vector3();
  let activeSurface: string | null = null;
  let attempts = 0;
  let disposed = false,
    failed = false;
  const render = reflector.onBeforeRender.bind(reflector);
  reflector.onBeforeRender = (
    ...args: Parameters<typeof reflector.onBeforeRender>
  ) => {
    const [renderer, scene] = args;
    if (disposed || failed) return;
    const hidden: Object3D[] = [];
    scene.traverse((object) => {
      if (
        object.visible &&
        (object.userData.roomedyEditorOverlay ||
          (activeSurface !== null &&
            object.userData.roomedyMirrorSurface === activeSurface))
      ) {
        hidden.push(object);
        object.visible = false;
      }
    });
    const target = renderer.getRenderTarget(),
      xr = renderer.xr.enabled,
      shadow = renderer.shadowMap.autoUpdate;
    try {
      attempts++;
      render(...args);
    } catch {
      failed = true;
    } finally {
      hidden.forEach((object) => {
        object.visible = true;
      });
      renderer.xr.enabled = xr;
      renderer.shadowMap.autoUpdate = shadow;
      renderer.setRenderTarget(target);
      reflector.visible = !failed && !disposed;
    }
  };
  return {
    reflector,
    get stats() {
      return { disposed, failed, attempts, surfaces: surfaces.size };
    },
    register(surface: Surface) {
      if (disposed) return () => {};
      surfaces.set(surface.id, surface);
      return () => {
        if (surfaces.get(surface.id) === surface) surfaces.delete(surface.id);
      };
    },
    update(camera: Camera, selectedId: string | null) {
      reflector.visible = false;
      activeSurface = null;
      if (disposed || failed) return null;
      camera.updateWorldMatrix(true, false);
      frustum.setFromProjectionMatrix(
        matrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        ),
      );
      const candidates = [...surfaces.values()]
        .filter((surface) => {
          for (
            let parent: Object3D | null = surface.object;
            parent;
            parent = parent.parent
          )
            if (!parent.visible) return false;
          surface.object.updateWorldMatrix(true, false);
          position.setFromMatrixPosition(surface.object.matrixWorld);
          normal.set(0, 0, 1).transformDirection(surface.object.matrixWorld);
          viewer.setFromMatrixPosition(camera.matrixWorld).sub(position);
          return (
            viewer.dot(normal) > 0.005 &&
            frustum.intersectsSphere(
              new Sphere(
                position,
                Math.hypot(surface.width, surface.height) / 2,
              ),
            )
          );
        })
        .map((surface) => ({
          surface,
          distance: position
            .setFromMatrixPosition(surface.object.matrixWorld)
            .distanceToSquared(camera.position),
        }));
      candidates.sort(
        (a, b) =>
          Number(b.surface.pieceId === selectedId) -
            Number(a.surface.pieceId === selectedId) ||
          a.distance - b.distance ||
          a.surface.id.localeCompare(b.surface.id),
      );
      const chosen = candidates[0]?.surface;
      if (!chosen) return null;
      activeSurface = chosen.id;
      chosen.object.matrixWorld.decompose(
        reflector.position,
        reflector.quaternion,
        reflector.scale,
      );
      reflector.scale.x *= chosen.width;
      reflector.scale.y *= chosen.height;
      reflector.updateMatrixWorld(true);
      reflector.visible = true;
      return chosen.id;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      surfaces.clear();
      reflector.visible = false;
      reflector.dispose();
      geometry.dispose();
    },
  };
}
export type MirrorReflection = ReturnType<typeof createMirrorReflection>;
