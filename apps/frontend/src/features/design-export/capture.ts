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
export async function captureRoomPictures(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
  progress: (text: string) => void,
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
    for (const view of views) {
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
      const canvas = document.createElement('canvas');
      canvas.width = POLICY.designExportViewWidth;
      canvas.height = POLICY.designExportViewHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new DesignExportError('graphics');
      context.drawImage(renderer.domElement, 0, 0);
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
