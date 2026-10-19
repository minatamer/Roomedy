import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentRef, MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeElements, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import {
  BoxGeometry,
  Color,
  Group,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import type {
  Furniture,
  RoomDocument,
  CheckFacts,
} from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { InstancedMesh, MeshBasicMaterial } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { FINISH_PALETTE } from '../catalogue/finishes';
import {
  changedPieces,
  displayRoom,
  featureBox,
  metres,
  piecePose,
  pieceRepresentation,
  wallBoxes,
} from './adapter';
import type { CameraPose, CameraView, SceneBox, Triple } from './adapter';
import { cameraJourney, cameraViewPose, moveCamera } from './camera';
import type { RoomFrame } from '../session/state';
import { ViewAssets } from './assets';
import type { AssetState } from './assets';
import {
  advanceSurfaceColor,
  createSurfaces,
  detailedParts,
  setSurfaceMap,
  surfaceModel,
} from './surfaces';
import type { Surfaces } from './surfaces';
import type { FloorEditing } from './use-floor-edit';

export type CameraAction = {
  kind:
    | CameraView
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | 'in'
    | 'out'
    | 'reset'
    | 'forward'
    | 'backward'
    | 'strafe-left'
    | 'strafe-right';
  sequence: number;
};
export interface SceneProps {
  room: RoomDocument;
  candidate: RoomDocument | undefined;
  checks: CheckFacts;
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraStateRef: MutableRefObject<CameraPose | null>;
  cameraFrame: RoomFrame | undefined;
  cameraAction: CameraAction | null;
  cameraView: CameraView;
  editing: FloorEditing;
  onReady: () => void;
  onNotice: (loading: number, failed: number) => void;
  onLost: () => void;
  openedAt: number;
}

function GraphicsLifecycle({
  onLost,
  onReady,
  openedAt,
}: Pick<SceneProps, 'onLost' | 'onReady' | 'openedAt'>) {
  const { gl, invalidate } = useThree();
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 1) return;
    frames.current++;
    if (frames.current === 1) invalidate();
    else {
      if (process.env.NODE_ENV === 'development')
        gl.domElement.setAttribute(
          'data-roomedy-ready-ms',
          String(Math.round(performance.now() - openedAt)),
        );
      onReady();
    }
  });
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onLost);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  }, [gl, onLost]);
  return null;
}

/** Local development observations only; no payloads, telemetry, React frame updates or production probe. */
function DevelopmentProbe({
  projection,
  selectedId,
  action,
}: {
  projection: RoomDocument;
  selectedId: string | null;
  action: CameraAction | null;
}) {
  const { gl, size } = useThree();
  const sample = useRef({ previous: 0, frames: 0, intervals: [] as number[] });
  useEffect(() => {
    const reset = () => {
      sample.current = { previous: 0, frames: 0, intervals: [] };
    };
    reset();
    gl.domElement.addEventListener('pointerdown', reset);
    gl.domElement.addEventListener('wheel', reset, { passive: true });
    return () => {
      gl.domElement.removeEventListener('pointerdown', reset);
      gl.domElement.removeEventListener('wheel', reset);
    };
  }, [gl, projection, selectedId, action, size.width, size.height]);
  useFrame(({ gl }) => {
    const s = sample.current,
      now = performance.now(),
      interval = now - s.previous;
    s.previous = now;
    s.frames++;
    if (s.frames > 1 && interval > 0) {
      s.intervals.push(interval);
      if (s.intervals.length > 120) s.intervals.shift();
    }
    if (s.frames === 1 || s.frames % 15 === 0) {
      const sorted = [...s.intervals].sort((a, b) => a - b);
      gl.domElement.dataset.roomedyFrameSample = JSON.stringify({
        frames: s.frames,
        intervals: sorted.length,
        p50Ms:
          Math.round((sorted[Math.floor(sorted.length * 0.5)] ?? 0) * 10) / 10,
        p95Ms:
          Math.round((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 10) / 10,
        maxMs: Math.round((sorted.at(-1) ?? 0) * 10) / 10,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
      });
    }
  });
  return null;
}

// Shared unit geometry is disposed by RoomScene. Declarative materials have explicit
// ownership because their parent meshes intentionally opt out of recursive disposal.
function OwnedStandard({
  color,
  ...props
}: Omit<ThreeElements['meshStandardMaterial'], 'color'> & { color: string }) {
  const ref = useRef<MeshStandardMaterial>(null);
  const [initialColor] = useState(color);
  const target = useMemo(() => new Color(color), [color]);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [target, invalidate]);
  useFrame((_, delta) => {
    if (ref.current && advanceSurfaceColor(ref.current.color, target, delta))
      invalidate();
  });
  useEffect(() => {
    const owned = ref.current;
    return () => owned?.dispose();
  }, []);
  return <meshStandardMaterial {...props} color={initialColor} ref={ref} />;
}
function OwnedBasic(props: ThreeElements['meshBasicMaterial']) {
  const ref = useRef<MeshBasicMaterial>(null);
  useEffect(() => {
    const owned = ref.current;
    return () => owned?.dispose();
  }, []);
  return <meshBasicMaterial {...props} ref={ref} />;
}

// Three's projection is imperative; this does not update React-owned state.
function setCameraZoom(
  camera: { zoom: number; updateProjectionMatrix: () => void },
  zoom: number,
) {
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

function CameraRig({
  room,
  cameraStateRef,
  cameraAction,
  cameraFrame,
  cameraView,
  editing,
}: Pick<
  SceneProps,
  | 'room'
  | 'cameraStateRef'
  | 'cameraAction'
  | 'cameraFrame'
  | 'cameraView'
  | 'editing'
>) {
  const { camera, size, invalidate, gl } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const initialized = useRef(false),
    previousFit = useRef(1),
    lastAction = useRef(0);
  const aspect = size.width / Math.max(1, size.height),
    fit = Math.min(1, aspect);
  type Flight = {
    path: Vector3[];
    lengths: number[];
    distance: number;
    elapsed: number;
    duration: number;
    fromTarget: Vector3;
    target: Vector3;
    fromZoom: number;
    zoom: number;
  };
  const desired = useRef<Flight | null>(null);
  const begin = useCallback(
    (points: Triple[], target: Triple, zoom: number, duration?: number) => {
      if (!points.length || !controls.current) return;
      const path = [
          camera.position.clone(),
          ...points.map((p) => new Vector3(...p)),
        ],
        lengths = [0];
      for (let i = 1; i < path.length; i++)
        lengths.push(lengths[i - 1]! + path[i]!.distanceTo(path[i - 1]!));
      const distance = lengths.at(-1)!;
      desired.current = {
        path,
        lengths,
        distance,
        elapsed: 0,
        duration: duration ?? Math.min(1.8, Math.max(0.7, distance * 0.14)),
        fromTarget: controls.current.target.clone(),
        target: new Vector3(...target),
        fromZoom: camera.zoom,
        zoom,
      };
      invalidate();
    },
    [camera, invalidate],
  );
  useLayoutEffect(() => {
    const c = controls.current;
    if (!initialized.current) {
      const pose =
        cameraStateRef.current ??
        cameraViewPose(room, 'overview', cameraFrame)!;
      camera.position.set(...pose.position);
      setCameraZoom(
        camera,
        pose.zoom * (pose.view === 'overview' || !pose.view ? fit : 1),
      );
      c?.target.set(...pose.target);
      camera.lookAt(new Vector3(...pose.target));
      initialized.current = true;
    } else if (cameraView === 'overview') {
      const ratio = fit / previousFit.current;
      setCameraZoom(camera, camera.zoom * ratio);
      if (desired.current) {
        desired.current.fromZoom *= ratio;
        desired.current.zoom *= ratio;
      }
    }
    previousFit.current = fit;
    camera.updateProjectionMatrix();
    invalidate();
  }, [
    camera,
    cameraFrame,
    cameraStateRef,
    cameraView,
    room,
    aspect,
    fit,
    invalidate,
  ]);
  const act = useCallback(
    (kind: CameraAction['kind']) => {
      const c = controls.current;
      if (!c) return;
      const from: Triple = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ];
      if (
        ['overview', 'doorway', 'work-area', 'corner', 'reset'].includes(kind)
      ) {
        const view = kind === 'reset' ? 'overview' : (kind as CameraView);
        const pose = cameraViewPose(room, view, cameraFrame);
        if (!pose) return;
        begin(
          cameraJourney(room, from, pose.position, view !== 'overview'),
          pose.target,
          pose.zoom * (view === 'overview' ? fit : 1),
        );
        return;
      }
      if (kind === 'in' || kind === 'out') {
        const factor = cameraView === 'overview' ? fit : 1;
        begin(
          [from],
          [c.target.x, c.target.y, c.target.z],
          Math.max(
            factor * 0.65,
            Math.min(
              factor * 2.6,
              (desired.current?.zoom ?? camera.zoom) *
                (kind === 'in' ? 1.2 : 1 / 1.2),
            ),
          ),
          0.28,
        );
        return;
      }
      const position = camera.position.clone(),
        target = c.target.clone(),
        offset = position.clone().sub(target);
      if (cameraView !== 'overview') {
        const direction = target.clone().sub(position).normalize();
        if (
          ['forward', 'backward', 'strafe-left', 'strafe-right'].includes(kind)
        ) {
          const dx = direction.x,
            dz = direction.z,
            length = Math.hypot(dx, dz) || 1;
          const forward = kind === 'forward' || kind === 'backward';
          const sign = kind === 'forward' || kind === 'strafe-right' ? 1 : -1;
          const wanted: Triple = [
            from[0] + ((forward ? dx : -dz) / length) * 0.35 * sign,
            from[1],
            from[2] + ((forward ? dz : dx) / length) * 0.35 * sign,
          ];
          const next = moveCamera(room, from, wanted),
            shift = new Vector3(...next).sub(position);
          target.add(shift);
          begin([next], [target.x, target.y, target.z], camera.zoom, 0.3);
          return;
        }
        const yaw =
          Math.atan2(direction.x, direction.z) +
          (kind === 'left' ? 0.18 : kind === 'right' ? -0.18 : 0);
        const pitch = Math.max(
          -1.1,
          Math.min(
            1.1,
            Math.asin(Math.max(-1, Math.min(1, direction.y))) +
              (kind === 'up' ? 0.12 : kind === 'down' ? -0.12 : 0),
          ),
        );
        target
          .copy(position)
          .add(
            new Vector3(
              Math.sin(yaw) * Math.cos(pitch),
              Math.sin(pitch),
              Math.cos(yaw) * Math.cos(pitch),
            ),
          );
        begin([from], [target.x, target.y, target.z], camera.zoom, 0.22);
        return;
      }
      if (kind === 'left' || kind === 'right')
        offset.applyAxisAngle(
          new Vector3(0, 1, 0),
          kind === 'left' ? 0.2 : -0.2,
        );
      else {
        const horizontal = Math.hypot(offset.x, offset.z),
          angle = Math.max(
            0.25,
            Math.min(
              1.3,
              Math.atan2(horizontal, offset.y) + (kind === 'up' ? -0.15 : 0.15),
            ),
          ),
          r = offset.length();
        offset.y = Math.cos(angle) * r;
        const scale = (Math.sin(angle) * r) / Math.max(0.0001, horizontal);
        offset.x *= scale;
        offset.z *= scale;
      }
      position.copy(target).add(offset);
      begin(
        [[position.x, position.y, position.z]],
        [target.x, target.y, target.z],
        camera.zoom,
        0.35,
      );
    },
    [camera, room, cameraView, cameraFrame, fit, begin],
  );
  useEffect(() => {
    if (!cameraAction || lastAction.current === cameraAction.sequence) return;
    lastAction.current = cameraAction.sequence;
    act(cameraAction.kind);
  }, [cameraAction, act]);
  useEffect(() => {
    const canvas = gl.domElement;
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const kinds: Record<string, CameraAction['kind']> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
        w: 'forward',
        s: 'backward',
        a: 'strafe-left',
        d: 'strafe-right',
        '+': 'in',
        '-': 'out',
      };
      const kind = kinds[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (kind && editing.pose.current) {
        e.preventDefault();
        return;
      }
      if (editing.enabled && kind && !['in', 'out'].includes(kind)) return;
      if (
        !kind ||
        (cameraView === 'overview' &&
          ['forward', 'backward', 'strafe-left', 'strafe-right'].includes(kind))
      )
        return;
      e.preventDefault();
      act(kind);
    };
    const pointers = new Map<number, { x: number; y: number }>();
    let yaw = 0,
      pitch = 0,
      pinch = 0,
      pinchZoom = 1;
    const down = (e: PointerEvent) => {
      if (editing.enabled) {
        desired.current = null;
        return;
      }
      if (cameraView === 'overview' || e.defaultPrevented || pointers.size >= 2)
        return;
      desired.current = null;
      canvas.focus({ preventScroll: true });
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      const direction = camera.getWorldDirection(new Vector3());
      yaw = Math.atan2(direction.x, direction.z);
      pitch = Math.asin(Math.max(-1, Math.min(1, direction.y)));
      pinch = 0;
    };
    const move = (e: PointerEvent) => {
      const old = pointers.get(e.pointerId);
      if (!old) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        if (!pinch) {
          pinch = distance;
          pinchZoom = camera.zoom;
        }
        if (pinch) {
          const p = camera.position,
            target = controls.current?.target;
          if (target)
            begin(
              [[p.x, p.y, p.z]],
              [target.x, target.y, target.z],
              Math.max(0.65, Math.min(2.6, (pinchZoom * distance) / pinch)),
              0.16,
            );
        }
        return;
      }
      yaw -= (e.clientX - old.x) * 0.004;
      pitch = Math.max(
        -1.1,
        Math.min(1.1, pitch + (e.clientY - old.y) * 0.004),
      );
      const pos = camera.position,
        target = pos
          .clone()
          .add(
            new Vector3(
              Math.sin(yaw) * Math.cos(pitch),
              Math.sin(pitch),
              Math.cos(yaw) * Math.cos(pitch),
            ),
          );
      begin(
        [[pos.x, pos.y, pos.z]],
        [target.x, target.y, target.z],
        camera.zoom,
        0.16,
      );
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
    };
    const wheel = (e: WheelEvent) => {
      if (editing.pose.current) {
        e.preventDefault();
        return;
      }
      if (cameraView === 'overview' && !editing.enabled) return;
      e.preventDefault();
      act(e.deltaY < 0 ? 'in' : 'out');
    };
    canvas.addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => {
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      for (const id of pointers.keys())
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      pointers.clear();
    };
  }, [gl, camera, cameraView, act, begin, editing]);
  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const next = desired.current;
    if (next) {
      next.elapsed += Math.min(delta, 0.05);
      const progress = Math.min(1, next.elapsed / next.duration),
        ease =
          progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const distance = next.distance * ease;
      let segment = 1;
      while (
        segment < next.lengths.length - 1 &&
        next.lengths[segment]! < distance
      )
        segment++;
      const low = next.lengths[segment - 1]!,
        high = next.lengths[segment]!;
      camera.position
        .copy(next.path[segment - 1]!)
        .lerp(
          next.path[segment]!,
          high === low ? 1 : (distance - low) / (high - low),
        );
      c.target.copy(next.fromTarget).lerp(next.target, ease);
      setCameraZoom(camera, next.fromZoom + (next.zoom - next.fromZoom) * ease);
      camera.lookAt(c.target);
      camera.updateProjectionMatrix();
      invalidate();
      if (progress === 1) desired.current = null;
    }
    cameraStateRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [c.target.x, c.target.y, c.target.z],
      zoom: camera.zoom / (cameraView === 'overview' ? fit : 1),
      view: cameraView,
    };
    if (process.env.NODE_ENV === 'development')
      gl.domElement.setAttribute(
        'data-roomedy-camera',
        JSON.stringify({
          x: Math.round(camera.position.x * 1000),
          y: Math.round(camera.position.y * 1000),
          z: Math.round(camera.position.z * 1000),
          target: [c.target.x, c.target.y, c.target.z].map((v) =>
            Math.round(v * 1000),
          ),
          zoom: Math.round(camera.zoom * 1000) / 1000,
          travelling: !!desired.current,
          view: cameraView,
        }),
      );
  });
  return (
    <OrbitControls
      ref={controls}
      enabled={cameraView === 'overview' && !editing.enabled}
      enableDamping
      dampingFactor={0.12}
      enablePan={false}
      minPolarAngle={0.25}
      maxPolarAngle={1.3}
      minDistance={0.8}
      maxDistance={80}
      onStart={() => {
        desired.current = null;
      }}
    />
  );
}

function Walls({
  boxes,
  geometry,
  color,
  wall,
  room,
  surfaces,
}: {
  boxes: SceneBox[];
  geometry: BoxGeometry;
  color: string;
  wall: string;
  room: RoomDocument;
  surfaces: Surfaces;
}) {
  const ref = useRef<InstancedMesh>(null),
    { camera, invalidate } = useThree(),
    bounds = displayRoom(room);
  const [initialColor] = useState(color);
  const targetColor = useMemo(() => new Color(color), [color]);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: initialColor,
        map: surfaces.plaster,
        bumpMap: surfaces.plaster,
        bumpScale: 0.0015,
        roughness: 0.94,
        transparent: true,
      }),
    [initialColor, surfaces],
  );
  const materialRef = useRef(material);
  useEffect(() => {
    materialRef.current = material;
    return () => material.dispose();
  }, [material]);
  useEffect(() => invalidate(), [targetColor, invalidate]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    boxes.forEach((b, i) =>
      m.setMatrixAt(
        i,
        new Matrix4().compose(
          new Vector3(...b.center),
          new Group().quaternion,
          new Vector3(...b.size),
        ),
      ),
    );
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    invalidate();
    // Instance attributes belong to this mesh; shared geometry/materials have separate owners.
    return () => m.dispose();
  }, [boxes, geometry, material, invalidate]);
  useFrame((_, delta) => {
    const front =
      wall === 'north'
        ? camera.position.z < bounds.depth / 2
        : wall === 'south'
          ? camera.position.z > bounds.depth / 2
          : wall === 'west'
            ? camera.position.x < bounds.width / 2
            : camera.position.x > bounds.width / 2;
    const inside =
      camera.position.x > 0 &&
      camera.position.x < bounds.width &&
      camera.position.z > 0 &&
      camera.position.z < bounds.depth &&
      camera.position.y > 0 &&
      camera.position.y < bounds.height;
    const display = materialRef.current,
      goal = inside ? 1 : front ? 0.06 : 1,
      difference = goal - display.opacity;
    if (Math.abs(difference) > 0.002) {
      display.opacity +=
        difference * (1 - Math.exp(-Math.min(delta, 0.05) * 16));
      invalidate();
    }
    if (advanceSurfaceColor(display.color, targetColor, delta)) invalidate();
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, boxes.length]}
      dispose={null}
      receiveShadow
      castShadow={false}
    />
  );
}

function BorrowedModel({
  asset,
  surfaces,
}: {
  asset: GLTF;
  surfaces: Surfaces;
}) {
  const instance = useMemo(
    () => surfaceModel(asset.scene, surfaces),
    [asset, surfaces],
  );
  useEffect(() => () => instance.dispose(), [instance]);
  return <primitive object={instance.object} dispose={null} />;
}

function Opening({
  room,
  feature,
  geometry,
  surfaces,
  selected,
  onSelect,
}: {
  room: RoomDocument;
  feature: RoomDocument['room']['features'][number];
  geometry: BoxGeometry;
  surfaces: Surfaces;
  selected: boolean;
  onSelect: SceneProps['onSelect'];
}) {
  const box = featureBox(room, feature);
  if (!box) return null;
  const alongX = feature.wall === 'north' || feature.wall === 'south';
  const w = alongX ? box.size[0] : box.size[2],
    h = box.size[1],
    depth = alongX ? box.size[2] : box.size[0];
  const angle =
    feature.wall === 'south'
      ? Math.PI
      : feature.wall === 'west'
        ? Math.PI / 2
        : feature.wall === 'east'
          ? -Math.PI / 2
          : 0;
  const t = Math.min(0.035, w / 6, h / 6),
    window = feature.kind === 'window',
    door = feature.kind === 'door';
  const trim = [
    [-w / 2 + t / 2, 0, t, h],
    [w / 2 - t / 2, 0, t, h],
    [0, h / 2 - t / 2, w - t * 2, t],
    ...(window
      ? [
          [0, -h / 2 + t / 2, w - t * 2, t],
          [0, 0, t * 0.65, h - t * 2],
        ]
      : []),
  ];
  return (
    <group
      position={box.center}
      rotation={[0, angle, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 4) onSelect(feature.id);
      }}
    >
      <mesh
        geometry={geometry}
        scale={[w, h, window ? 0.004 : door ? depth * 0.6 : depth]}
        dispose={null}
        receiveShadow
      >
        <OwnedStandard
          color={
            selected
              ? '#a77342'
              : window
                ? '#b8ced2'
                : door
                  ? '#765238'
                  : '#9a8870'
          }
          map={door ? surfaces.wood : window ? null : surfaces.plaster}
          roughness={window ? 0.28 : 0.7}
          metalness={window ? 0.15 : 0}
          emissive={window ? '#adc9d1' : '#000000'}
          emissiveIntensity={window ? 0.15 : 0}
        />
      </mesh>
      {(window || door) &&
        trim.map(([x, y, width, height], i) => (
          <mesh
            key={i}
            geometry={surfaces.hard}
            position={[x!, y!, 0]}
            scale={[width!, height!, depth]}
            dispose={null}
            receiveShadow
          >
            <OwnedStandard
              color="#e8e0d3"
              map={surfaces.wood}
              roughness={0.7}
            />
          </mesh>
        ))}
      {door && (
        <>
          <mesh
            geometry={surfaces.hard}
            position={[0, 0, depth * 0.32]}
            scale={[w - t * 4, h - t * 4, depth * 0.2]}
            dispose={null}
            receiveShadow
          >
            <OwnedStandard
              color={selected ? '#a77342' : '#806046'}
              map={surfaces.wood}
              roughness={0.7}
            />
          </mesh>
          <mesh
            geometry={surfaces.hard}
            position={[
              (feature.hinge === 'right' ? -1 : 1) * w * 0.32,
              -h * 0.06,
              depth * 0.43,
            ]}
            scale={[Math.min(0.1, w * 0.2), t * 0.5, depth * 0.12]}
            dispose={null}
          >
            <OwnedStandard color="#574b3e" roughness={0.35} metalness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Piece({
  piece,
  selected,
  proposed,
  geometry,
  asset,
  onSelect,
  surfaces,
  editing,
}: {
  piece: Furniture;
  selected: boolean;
  proposed: boolean;
  geometry: BoxGeometry;
  asset: AssetState | undefined;
  onSelect: SceneProps['onSelect'];
  surfaces: Surfaces;
  editing: FloorEditing;
}) {
  const group = useRef<Group>(null),
    { invalidate } = useThree(),
    pose = piecePose(piece),
    [initial] = useState(pose);
  const representation = pieceRepresentation(piece, asset?.kind === 'ready');
  const materials = useMemo(
    () => ({
      frame: new MeshStandardMaterial({
        roughness: 0.67,
        map: surfaces.wood,
        bumpMap: surfaces.wood,
        bumpScale: 0.0004,
      }),
      soft: new MeshStandardMaterial({
        color: '#eee5d5',
        roughness: 0.97,
        map: surfaces.fabric,
        bumpMap: surfaces.fabric,
        bumpScale: 0.0012,
      }),
      blanket: new MeshStandardMaterial({
        color: '#bc9475',
        roughness: 0.98,
        map: surfaces.fabric,
        bumpMap: surfaces.fabric,
        bumpScale: 0.0012,
      }),
      metal: new MeshStandardMaterial({
        color: '#514a40',
        roughness: 0.38,
        metalness: 0.55,
      }),
    }),
    [surfaces],
  );
  useLayoutEffect(() => {
    setSurfaceMap(
      materials.frame,
      piece.finish === 'oak' || piece.finish === 'walnut'
        ? surfaces.wood
        : surfaces.plaster,
    );
    invalidate();
  }, [piece.finish, surfaces, materials, invalidate]);
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  const color = useMemo(
    () => new Color(FINISH_PALETTE[piece.finish]),
    [piece.finish],
  );
  const upholsteryColor = useMemo(
    () =>
      new Color(
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category === 'chair'
          ? FINISH_PALETTE[piece.finish]
          : '#eee5d5',
      ),
    [piece.catalogueId, piece.catalogueVersion, piece.finish],
  );
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const amount = 1 - Math.exp(-Math.min(delta, 0.05) * 20),
      projected =
        editing.pose.current?.id === piece.id ? editing.pose.current : null,
      target = projected
        ? new Vector3(metres(projected.x), 0, metres(projected.z))
        : new Vector3(...pose.position);
    const rotation = Math.atan2(
      Math.sin(pose.rotationY - g.rotation.y),
      Math.cos(pose.rotationY - g.rotation.y),
    );
    const moving =
      g.position.distanceToSquared(target) > 0.00000001 ||
      Math.abs(rotation) > 0.0001 ||
      Math.abs(materials.frame.color.r - color.r) +
        Math.abs(materials.frame.color.g - color.g) +
        Math.abs(materials.frame.color.b - color.b) +
        Math.abs(materials.soft.color.r - upholsteryColor.r) +
        Math.abs(materials.soft.color.g - upholsteryColor.g) +
        Math.abs(materials.soft.color.b - upholsteryColor.b) >
        0.001;
    if (moving) {
      if (projected) g.position.copy(target);
      else g.position.lerp(target, amount);
      g.rotation.y += rotation * amount;
      materials.frame.color.lerp(color, amount);
      materials.soft.color.lerp(upholsteryColor, amount);
      invalidate();
    }
  });
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta <= 4) onSelect(piece.id);
  };
  const w = metres(piece.dimensions.width.value ?? 250),
    d = metres(piece.dimensions.depth.value ?? 250),
    h = metres(piece.dimensions.height.value ?? 250);
  return (
    <group
      ref={group}
      position={initial.position}
      rotation={[0, initial.rotationY, 0]}
      onClick={pick}
      {...(editing.enabled
        ? {
            onPointerDown: (e: ThreeEvent<PointerEvent>) => {
              const position = group.current?.position;
              editing.down(
                e,
                piece,
                position
                  ? { x: position.x * 1000, z: position.z * 1000 }
                  : undefined,
              );
            },
            onPointerMove: (e: ThreeEvent<PointerEvent>) =>
              editing.move(e, piece),
            onPointerUp: (e: ThreeEvent<PointerEvent>) => editing.up(e, piece),
            onPointerCancel: () => editing.cancel(true),
            onLostPointerCapture: () => editing.cancel(true),
          }
        : {})}
    >
      {representation.kind === 'mesh' && asset?.kind === 'ready' ? (
        <BorrowedModel asset={asset.asset} surfaces={surfaces} />
      ) : representation.kind === 'procedural' ? (
        detailedParts(representation.parts, representation.footprint).map(
          (part) => (
            <mesh
              key={part.name}
              geometry={
                part.name === 'physical-bounds'
                  ? geometry
                  : part.role === 'soft'
                    ? surfaces.soft
                    : surfaces.hard
              }
              material={
                materials[part.name === 'blanket' ? 'blanket' : part.role]
              }
              position={part.center.map(metres) as [number, number, number]}
              scale={part.size.map(metres) as [number, number, number]}
              dispose={null}
              castShadow
              receiveShadow
            />
          ),
        )
      ) : (
        <mesh position={[0, 0.15, 0]}>
          <octahedronGeometry args={[0.12]} />
          <OwnedStandard color="#9a7857" wireframe />
        </mesh>
      )}
      {(selected || proposed) && (
        <mesh
          geometry={geometry}
          position={[0, 0.015, 0]}
          scale={[w + 0.045, 0.018, d + 0.045]}
          dispose={null}
        >
          <OwnedStandard
            color={selected ? '#54351f' : '#b26f32'}
            transparent
            opacity={selected ? 0.9 : 0.5}
          />
        </mesh>
      )}
      {selected && (
        <mesh
          geometry={geometry}
          position={[0, h / 2, 0]}
          scale={[w + 0.01, h + 0.01, d + 0.01]}
          dispose={null}
        >
          <OwnedBasic color="#765036" wireframe transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

export function RoomScene(props: SceneProps) {
  const { room, candidate, selectedId, onSelect, checks, onNotice, onReady } =
      props,
    rendered = candidate ?? room;
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const surfaces = useMemo(() => createSurfaces(), []);
  useEffect(() => () => surfaces.dispose(), [surfaces]);
  const [assets, setAssets] = useState<ReadonlyMap<string, AssetState>>(
    new Map(),
  );
  const urls = [
    ...new Set(
      rendered.furniture
        .map((p) => pieceRepresentation(p))
        .flatMap((r) => (r.kind === 'mesh' ? [r.url] : [])),
    ),
  ]
    .sort()
    .join('|');
  useEffect(() => {
    const cache = new ViewAssets(setAssets);
    for (const url of urls.split('|').filter(Boolean)) cache.load(url);
    return () => cache.dispose();
  }, [urls]);
  useEffect(() => {
    const wanted = urls.split('|').filter(Boolean);
    onNotice(
      wanted.filter((u) => !assets.get(u) || assets.get(u)?.kind === 'loading')
        .length,
      wanted.filter((u) => assets.get(u)?.kind === 'failed').length,
    );
  }, [assets, urls, onNotice]);
  const bounds = displayRoom(rendered),
    ghosts = changedPieces(room, candidate);
  const sunTarget = useMemo(() => {
    const target = new Object3D();
    target.position.set(bounds.width / 2, 0, bounds.depth / 2);
    return target;
  }, [bounds.width, bounds.depth]);
  useLayoutEffect(() => {
    surfaces.floor.repeat.set(bounds.width / 1.12, bounds.depth / 2.8);
  }, [surfaces, bounds.width, bounds.depth]);
  const shadowSpan = Math.max(bounds.width, bounds.depth) * 0.8 + 0.5;
  const walls = useMemo(
    () =>
      Object.fromEntries(
        (['north', 'south', 'east', 'west'] as const).map((w) => [
          w,
          wallBoxes(rendered, w),
        ]),
      ),
    [rendered],
  );
  return (
    <>
      <GraphicsLifecycle
        onLost={props.onLost}
        onReady={onReady}
        openedAt={props.openedAt}
      />
      {process.env.NODE_ENV === 'development' && (
        <DevelopmentProbe
          projection={rendered}
          selectedId={selectedId}
          action={props.cameraAction}
        />
      )}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#fff8ee', '#a89175', 1.6]} />
      <primitive object={sunTarget} />
      <directionalLight
        position={[
          bounds.width * 0.2,
          bounds.height * 2.5,
          bounds.depth * 0.25,
        ]}
        target={sunTarget}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-shadowSpan}
        shadow-camera-right={shadowSpan}
        shadow-camera-top={shadowSpan}
        shadow-camera-bottom={-shadowSpan}
        shadow-camera-far={Math.max(50, bounds.height * 4 + shadowSpan * 2)}
        shadow-normalBias={0.005}
        onUpdate={(light) => light.shadow.camera.updateProjectionMatrix()}
      />
      <mesh
        geometry={geometry}
        position={[bounds.width / 2, -0.07, bounds.depth / 2]}
        scale={[bounds.width + 0.24, 0.14, bounds.depth + 0.24]}
        receiveShadow
        dispose={null}
      >
        <OwnedStandard
          color={FINISH_PALETTE[rendered.room.floorFinish]}
          roughness={0.76}
          map={surfaces.floor}
          bumpMap={surfaces.floor}
          bumpScale={0.001}
        />
      </mesh>
      {(['north', 'south', 'east', 'west'] as const).map((w) => (
        <Walls
          key={w}
          boxes={walls[w]!}
          geometry={geometry}
          color={FINISH_PALETTE[rendered.room.wallFinish]}
          wall={w}
          room={rendered}
          surfaces={surfaces}
        />
      ))}
      {rendered.room.features.map((feature) => (
        <Opening
          key={feature.id}
          room={rendered}
          feature={feature}
          geometry={geometry}
          surfaces={surfaces}
          selected={selectedId === feature.id}
          onSelect={onSelect}
        />
      ))}
      {rendered.furniture.map((p) => {
        const r = pieceRepresentation(p);
        return (
          <Piece
            key={p.id}
            piece={p}
            selected={selectedId === p.id}
            proposed={
              !!candidate &&
              JSON.stringify(p) !==
                JSON.stringify(room.furniture.find((c) => c.id === p.id))
            }
            geometry={geometry}
            asset={r.kind === 'mesh' ? assets.get(r.url) : undefined}
            surfaces={surfaces}
            editing={props.editing}
            onSelect={onSelect}
          />
        );
      })}
      {ghosts.map((p) => {
        const pose = piecePose(p);
        return (
          <group
            key={`ghost-${p.id}`}
            position={pose.position}
            rotation={[0, pose.rotationY, 0]}
          >
            <mesh
              geometry={geometry}
              position={[0, metres(p.dimensions.height.value ?? 250) / 2, 0]}
              scale={[
                metres(p.dimensions.width.value ?? 250),
                metres(p.dimensions.height.value ?? 250),
                metres(p.dimensions.depth.value ?? 250),
              ]}
              dispose={null}
            >
              <OwnedBasic
                color="#ac7846"
                wireframe
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
      {checks.issues
        .filter((i) => i.region && i.objectIds.includes(selectedId ?? ''))
        .slice(0, 32)
        .map((i) => {
          const r = i.region!;
          return (
            <mesh
              key={i.id}
              geometry={geometry}
              position={[
                metres((r.minX + r.maxX) / 2),
                0.025,
                metres((r.minZ + r.maxZ) / 2),
              ]}
              scale={[
                Math.max(0.01, metres(r.maxX - r.minX)),
                0.005,
                Math.max(0.01, metres(r.maxZ - r.minZ)),
              ]}
              dispose={null}
            >
              <OwnedBasic
                color="#ad482d"
                transparent
                opacity={0.28}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      <CameraRig
        room={rendered}
        cameraFrame={props.cameraFrame}
        cameraStateRef={props.cameraStateRef}
        cameraAction={props.cameraAction}
        cameraView={props.cameraView}
        editing={props.editing}
      />
    </>
  );
}
