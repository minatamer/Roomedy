import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { POLICY } from '@roomedy/contracts/policy';
import type { RoomDocument } from '@roomedy/contracts/room';
import { cameraViewPose } from '../room-view/camera';
import type { Triple } from '../room-view/adapter';
import { buildDesignScene, loadDesignAssets } from './scene';
import { DesignExportError, withExportSignal } from './facts';
export interface RoomPicture {
  image: HTMLCanvasElement;
  label: string;
}
/** Tight, padded overview bounds in the existing render, without reading pixels. */
export function coverCrop(bounds: Box3, camera: PerspectiveCamera) {
  const width = POLICY.designExportViewWidth,
    height = POLICY.designExportViewHeight;
  let left: number = width,
    top: number = height,
    right = 0,
    bottom = 0;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const p = new Vector3(x, y, z).project(camera),
          px = ((p.x + 1) * width) / 2,
          py = ((1 - p.y) * height) / 2;
        left = Math.min(left, px);
        top = Math.min(top, py);
        right = Math.max(right, px);
        bottom = Math.max(bottom, py);
      }
  const padding = Math.max(right - left, bottom - top) * 0.025,
    x = Math.max(0, Math.min(width - 1, Math.floor(left - padding))),
    y = Math.max(0, Math.min(height - 1, Math.floor(top - padding)));
  return {
    x,
    y,
    width: Math.max(1, Math.min(width, Math.ceil(right + padding)) - x),
    height: Math.max(1, Math.min(height, Math.ceil(bottom + padding)) - y),
  };
}
export async function captureRoomPictures(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
  progress: (text: string) => void,
  mode: 'all' | 'overview' = 'all',
) {
  const assets = await loadDesignAssets(room, signal);
  let renderer: WebGLRenderer | undefined,
    projection: ReturnType<typeof buildDesignScene> | undefined,
    light: DirectionalLight | undefined;
  const images: HTMLCanvasElement[] = [];
  const renderAbort = new AbortController();
  let graphicsLost = false,
    released = false;
  const dispose = () => {
    if (released) return;
    released = true;
    light?.shadow.dispose();
    projection?.dispose();
    assets.dispose();
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.width = renderer.domElement.height = 1;
      renderer = undefined;
    }
  };
  const contextLost = () => {
    graphicsLost = true;
    renderAbort.abort();
    dispose();
  };
  const lost = () => {
    renderAbort.abort();
    dispose();
  };
  signal.addEventListener('abort', lost, { once: true });
  try {
    check();
    projection = buildDesignScene(room, assets.ready);
    await projection.prepareSurfaces(signal);
    check();
    const scene = new Scene();
    scene.background = new Color('#f4efe5');
    scene.add(
      projection.root,
      new AmbientLight('#ffffff', 0.35),
      new HemisphereLight('#fff8ee', '#a89175', 1.6),
    );
    const b = projection.bounds;
    light = new DirectionalLight('#fff8ef', 2.5);
    light.position.set(b.width * 0.2, b.height * 2.5, b.depth * 0.25);
    light.target.position.set(b.width / 2, 0, b.depth / 2);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    const span = Math.max(b.width, b.depth) * 0.8 + 0.5;
    Object.assign(light.shadow.camera, {
      left: -span,
      right: span,
      top: span,
      bottom: -span,
      near: 0.1,
      far: Math.max(50, b.height * 4 + span * 2),
    });
    light.shadow.normalBias = 0.005;
    light.shadow.camera.updateProjectionMatrix();
    scene.add(light, light.target);
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'default',
      });
    } catch {
      throw new DesignExportError('graphics');
    }
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.setSize(
      POLICY.designExportViewWidth,
      POLICY.designExportViewHeight,
      false,
    );
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    projection.prepareGlass(renderer);
    const overview = (side: number) => {
      const box = new Box3().setFromObject(projection!.root),
        center = box.getCenter(new Vector3()),
        radius = box.getSize(new Vector3()).length() / 2;
      const direction = new Vector3(
        side === 0 ? 0.55 : -0.7,
        0.75,
        side === 0 ? 0.8 : -0.6,
      )
        .normalize()
        .multiplyScalar((radius / Math.sin((25 * Math.PI) / 180)) * 1.15);
      return {
        position: center.clone().add(direction).toArray() as Triple,
        target: center.toArray() as Triple,
      };
    };
    const doorway = cameraViewPose(room, 'doorway'),
      corner = cameraViewPose(room, 'corner');
    const views = [
      { ...overview(0), inside: false, label: 'The room, reimagined' },
      {
        ...(doorway ?? overview(1)),
        inside: !!doorway,
        label: doorway ? 'From the doorway' : 'A different perspective',
      },
      {
        ...(corner ?? overview(0)),
        inside: !!corner,
        label: corner ? 'From the opposite corner' : 'Space and proportion',
      },
    ];
    const pictures: RoomPicture[] = [];
    for (const [index, view] of (mode === 'overview'
      ? views.slice(0, 1)
      : views
    ).entries()) {
      check();
      progress('Creating room views…');
      projection.setCutaway(view.position, view.inside);
      scene.updateMatrixWorld(true);
      const camera = new PerspectiveCamera(
        view.inside ? 66 : 50,
        POLICY.designExportViewWidth / POLICY.designExportViewHeight,
        0.04,
        200,
      );
      camera.position.fromArray(view.position);
      camera.lookAt(new Vector3(...view.target));
      camera.updateMatrixWorld();
      await withExportSignal(
        renderer.compileAsync(scene, camera),
        renderAbort.signal,
      );
      check();
      if (!renderer) throw new DesignExportError('cancelled');
      renderer.render(scene, camera);
      const crop =
        index === 0
          ? coverCrop(new Box3().setFromObject(projection.root), camera)
          : {
              x: 0,
              y: 0,
              width: POLICY.designExportViewWidth,
              height: POLICY.designExportViewHeight,
            };
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const context = canvas.getContext('2d');
      if (!context) throw new DesignExportError('graphics');
      context.drawImage(
        renderer.domElement,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
      images.push(canvas);
      pictures.push({ image: canvas, label: view.label });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    check();
    return {
      pictures,
      simplified: assets.simplified,
      dispose: () =>
        images.forEach((image) => {
          image.width = image.height = 1;
        }),
    };
  } catch (error) {
    images.forEach((image) => {
      image.width = image.height = 1;
    });
    throw graphicsLost
      ? new DesignExportError('graphics')
      : error instanceof DesignExportError
        ? error
        : new DesignExportError('graphics');
  } finally {
    signal.removeEventListener('abort', lost);
    dispose();
  }
}
