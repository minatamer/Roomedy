import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  Vector3,
} from 'three';
import type {
  Furniture,
  RoomDocument,
  CheckFacts,
} from '@roomedy/contracts/room';
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
import type { CameraPose, SceneBox } from './adapter';
import { ViewAssets } from './assets';
import type { AssetState } from './assets';

export type CameraAction = {
  kind: 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset';
  sequence: number;
};
export interface SceneProps {
  room: RoomDocument;
  candidate: RoomDocument | undefined;
  checks: CheckFacts;
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraStateRef: MutableRefObject<CameraPose | null>;
  cameraAction: CameraAction | null;
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
function OwnedStandard(props: ThreeElements['meshStandardMaterial']) {
  const ref = useRef<MeshStandardMaterial>(null);
  useEffect(() => {
    const owned = ref.current;
    return () => owned?.dispose();
  }, []);
  return <meshStandardMaterial {...props} ref={ref} />;
}
function OwnedBasic(props: ThreeElements['meshBasicMaterial']) {
  const ref = useRef<MeshBasicMaterial>(null);
  useEffect(() => {
    const owned = ref.current;
    return () => owned?.dispose();
  }, []);
  return <meshBasicMaterial {...props} ref={ref} />;
}

function CameraRig({
  room,
  cameraStateRef,
  cameraAction,
}: Pick<SceneProps, 'room' | 'cameraStateRef' | 'cameraAction'>) {
  const { camera, size, invalidate } = useThree(),
    controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const cameraRef = useRef(camera);
  const bounds = displayRoom(room),
    span = Math.hypot(bounds.width, bounds.depth, bounds.height);
  const target = useMemo(
    () => new Vector3(bounds.width / 2, bounds.height * 0.28, bounds.depth / 2),
    [bounds.width, bounds.depth, bounds.height],
  );
  const fit = Math.min(size.width, size.height) / (span * 1.1);
  const desired = useRef<{
    position: Vector3;
    target: Vector3;
    zoom: number;
  } | null>(null);
  useLayoutEffect(() => {
    const saved = cameraStateRef.current;
    camera.position.copy(
      saved
        ? new Vector3(...saved.position)
        : target.clone().add(new Vector3(span * 0.7, span * 1.15, span * 0.9)),
    );
    cameraRef.current.zoom = (saved?.zoom ?? 1) * fit;
    camera.lookAt(saved ? new Vector3(...saved.target) : target);
    camera.updateProjectionMatrix();
    if (controls.current)
      controls.current.target.copy(
        saved ? new Vector3(...saved.target) : target,
      );
    invalidate();
    // A different semantic room can resize the shell; it does not reset the visitor's camera.
  }, [camera, cameraStateRef, target, span, fit, invalidate]);
  const lastAction = useRef(0);
  useEffect(() => {
    if (
      !cameraAction ||
      !controls.current ||
      lastAction.current === cameraAction.sequence
    )
      return;
    lastAction.current = cameraAction.sequence;
    const aim = controls.current.target.clone(),
      position = camera.position.clone(),
      offset = position.clone().sub(aim);
    let zoom = camera.zoom;
    if (cameraAction.kind === 'reset') {
      aim.copy(target);
      position
        .copy(target)
        .add(new Vector3(span * 0.7, span * 1.15, span * 0.9));
      zoom = fit;
    } else if (cameraAction.kind === 'in' || cameraAction.kind === 'out')
      zoom = Math.max(
        fit * 0.65,
        Math.min(
          fit * 2.6,
          zoom * (cameraAction.kind === 'in' ? 1.2 : 1 / 1.2),
        ),
      );
    else {
      if (cameraAction.kind === 'left' || cameraAction.kind === 'right')
        offset.applyAxisAngle(
          new Vector3(0, 1, 0),
          cameraAction.kind === 'left' ? 0.2 : -0.2,
        );
      else {
        const horizontal = Math.hypot(offset.x, offset.z),
          angle = Math.max(
            0.25,
            Math.min(
              1.3,
              Math.atan2(horizontal, offset.y) +
                (cameraAction.kind === 'up' ? -0.15 : 0.15),
            ),
          );
        const r = offset.length();
        offset.y = Math.cos(angle) * r;
        const factor = (Math.sin(angle) * r) / horizontal;
        offset.x *= factor;
        offset.z *= factor;
      }
      position.copy(aim).add(offset);
    }
    desired.current = { position, target: aim, zoom };
    invalidate();
  }, [cameraAction, camera, fit, invalidate, span, target]);
  useFrame((_, delta) => {
    const next = desired.current,
      c = controls.current;
    if (!next || !c) return;
    const t = 1 - Math.exp(-Math.min(delta, 0.05) * 18);
    camera.position.lerp(next.position, t);
    c.target.lerp(next.target, t);
    cameraRef.current.zoom += (next.zoom - camera.zoom) * t;
    camera.updateProjectionMatrix();
    c.update();
    invalidate();
    if (
      camera.position.distanceToSquared(next.position) < 0.000001 &&
      Math.abs(camera.zoom - next.zoom) < 0.001
    )
      desired.current = null;
  });
  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.12}
      enablePan={false}
      minPolarAngle={0.25}
      maxPolarAngle={1.3}
      minZoom={fit * 0.65}
      maxZoom={fit * 2.6}
      onStart={() => {
        desired.current = null;
      }}
      onChange={() => {
        const c = controls.current;
        if (c)
          cameraStateRef.current = {
            position: camera.position.toArray(),
            target: c.target.toArray(),
            zoom: camera.zoom / fit,
          };
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
}: {
  boxes: SceneBox[];
  geometry: BoxGeometry;
  color: string;
  wall: string;
  room: RoomDocument;
}) {
  const ref = useRef<InstancedMesh>(null),
    { camera, invalidate } = useThree(),
    bounds = displayRoom(room);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({ color, roughness: 0.94, transparent: true }),
    [color],
  );
  const materialRef = useRef(material);
  useEffect(() => {
    materialRef.current = material;
    return () => material.dispose();
  }, [material]);
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
    const goal = front ? 0.06 : 1,
      difference = goal - material.opacity;
    if (Math.abs(difference) > 0.002) {
      materialRef.current.opacity +=
        difference * (1 - Math.exp(-Math.min(delta, 0.05) * 16));
      invalidate();
    }
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

function BorrowedModel({ asset }: { asset: GLTF }) {
  const object = useMemo(() => {
    const clone = asset.scene.clone(true);
    clone.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return clone;
  }, [asset]);
  return <primitive object={object} dispose={null} />;
}

function Piece({
  piece,
  selected,
  proposed,
  geometry,
  asset,
  onSelect,
}: {
  piece: Furniture;
  selected: boolean;
  proposed: boolean;
  geometry: BoxGeometry;
  asset: AssetState | undefined;
  onSelect: SceneProps['onSelect'];
}) {
  const group = useRef<Group>(null),
    { invalidate } = useThree(),
    pose = piecePose(piece),
    [initial] = useState(pose);
  const representation = pieceRepresentation(piece, asset?.kind === 'ready');
  const materials = useMemo(
    () => ({
      frame: new MeshStandardMaterial({ roughness: 0.72 }),
      soft: new MeshStandardMaterial({ color: '#eee5d5', roughness: 0.97 }),
      metal: new MeshStandardMaterial({ color: '#514a40', roughness: 0.65 }),
    }),
    [],
  );
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  const color = useMemo(
    () => new Color(FINISH_PALETTE[piece.finish]),
    [piece.finish],
  );
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const amount = 1 - Math.exp(-Math.min(delta, 0.05) * 20),
      target = new Vector3(...pose.position);
    const rotation = Math.atan2(
      Math.sin(pose.rotationY - g.rotation.y),
      Math.cos(pose.rotationY - g.rotation.y),
    );
    const moving =
      g.position.distanceToSquared(target) > 0.00000001 ||
      Math.abs(rotation) > 0.0001 ||
      Math.abs(materials.frame.color.r - color.r) +
        Math.abs(materials.frame.color.g - color.g) +
        Math.abs(materials.frame.color.b - color.b) >
        0.001;
    if (moving) {
      g.position.lerp(target, amount);
      g.rotation.y += rotation * amount;
      materials.frame.color.lerp(color, amount);
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
    >
      {representation.kind === 'mesh' && asset?.kind === 'ready' ? (
        <BorrowedModel asset={asset.asset} />
      ) : representation.kind === 'procedural' ? (
        representation.parts.map((part) => (
          <mesh
            key={part.name}
            geometry={geometry}
            material={materials[part.role]}
            position={part.center.map(metres) as [number, number, number]}
            scale={part.size.map(metres) as [number, number, number]}
            dispose={null}
            castShadow
            receiveShadow
          />
        ))
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
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#fff7e8', '#a89175', 1.4]} />
      <directionalLight
        position={[3, 8, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-normalBias={0.025}
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
          roughness={0.78}
        />
      </mesh>
      {Array.from(
        { length: Math.min(64, Math.ceil(bounds.width / 0.28) - 1) },
        (_, i) => (
          <mesh
            key={i}
            geometry={geometry}
            position={[(i + 1) * 0.28, 0.001, bounds.depth / 2]}
            scale={[0.004, 0.002, bounds.depth]}
            dispose={null}
          >
            <OwnedStandard color="#6f5033" transparent opacity={0.16} />
          </mesh>
        ),
      )}
      {(['north', 'south', 'east', 'west'] as const).map((w) => (
        <Walls
          key={w}
          boxes={walls[w]!}
          geometry={geometry}
          color={FINISH_PALETTE[rendered.room.wallFinish]}
          wall={w}
          room={rendered}
        />
      ))}
      {rendered.room.features.map((f) => {
        const b = featureBox(rendered, f);
        if (!b) return null;
        return (
          <mesh
            key={f.id}
            geometry={geometry}
            position={b.center}
            scale={b.size}
            dispose={null}
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta <= 4) onSelect(f.id);
            }}
          >
            <OwnedStandard
              color={
                selectedId === f.id
                  ? '#a77342'
                  : f.kind === 'window'
                    ? '#b6ced0'
                    : f.kind === 'door'
                      ? '#765238'
                      : '#9a8870'
              }
              transparent={f.kind === 'window'}
              opacity={f.kind === 'window' ? 0.45 : 1}
              roughness={0.6}
            />
          </mesh>
        );
      })}
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
        cameraStateRef={props.cameraStateRef}
        cameraAction={props.cameraAction}
      />
    </>
  );
}
