'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from 'three';
import type { BufferGeometry, Group, InstancedMesh, Mesh } from 'three';
import { createSurfaces, surfaceProperties } from '../room-view/surfaces';
import type { Surfaces } from '../room-view/surfaces';
import {
  advanceScroll,
  roomChoreography,
  landingFraming,
  landingPixelRatio,
  landingFurniture,
  landingFurniturePose,
  landingFurnitureAssembly,
} from './scroll-motion';
import {
  landingFurnitureBatches,
  writeFurnitureInstances,
} from './furniture-batches';
import type { BoxPart } from '../room-view/representations/definitions';
import { prepareLandingScene } from './prepare-scene';
import { createWindowGlass } from '../room-view/window-glass';
import type { ScrollTarget } from './scroll-motion';
import { LandingFinishes } from './finish-scene';
import type { LandingFinishHandle } from './finish-scene';
import {
  createLandingFinishMaterials,
  watchLandingShaders,
} from './finish-materials';
import { landingFinishState, landingPaintStroke } from './finish-motion';

type FurnitureMaterials = {
  wood: MeshStandardMaterial;
  fabric: MeshStandardMaterial;
};
function FurnitureBatch({
  geometry,
  material,
  parts,
}: {
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  parts: BoxPart[];
}) {
  const instance = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = instance.current;
    if (!mesh) return;
    writeFurnitureInstances(mesh, parts);
    // Instance buffers are owned here; geometry/materials are borrowed from the scene.
    return () => mesh.dispose();
  }, [geometry, material, parts]);
  return (
    <instancedMesh
      ref={instance}
      args={[geometry, material, parts.length]}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}
function Furniture({
  item,
  index,
  surfaces,
  materials,
  metal: metalMaterial,
  pillow,
}: {
  item: (typeof landingFurniture)[number];
  index: number;
  surfaces: Surfaces;
  materials: FurnitureMaterials;
  metal: MeshStandardMaterial;
  pillow: MeshStandardMaterial;
}) {
  const batches = useMemo(() => landingFurnitureBatches(item), [item]);
  return (
    <group name={`furniture-${index}`}>
      {batches.map(({ role, parts }) => (
        <FurnitureBatch
          key={role}
          parts={parts}
          geometry={
            role === 'fabric' || role === 'pillow'
              ? surfaces.soft
              : surfaces.hard
          }
          material={
            role === 'pillow'
              ? pillow
              : role === 'metal'
                ? metalMaterial
                : materials[role]
          }
        />
      ))}
    </group>
  );
}

function Choreography({
  targetRef,
  onReady,
  onLost,
}: {
  targetRef: MutableRefObject<ScrollTarget>;
  onReady: () => void;
  onLost: () => void;
}) {
  const { camera, size, gl, scene, invalidate, setDpr } = useThree(),
    room = useRef<Group>(null),
    furniture = useRef<Group>(null),
    north = useRef<Group>(null),
    west = useRef<Group>(null),
    finishes = useRef<LandingFinishHandle>(null),
    rug = useRef<Mesh>(null),
    displayed = useRef(0),
    entrance = useRef(0),
    prepared = useRef(false),
    firstFrame = useRef(true),
    aspect = useRef(Math.max(0.1, size.width / Math.max(1, size.height))),
    probe = useRef({
      previous: 0,
      moving: false,
      intervals: [] as number[],
      startup: [] as number[],
      startupPrevious: 0,
      preparationMs: 0,
      texturesMs: 0,
      gpuMs: 0,
      uploadMs: 0,
      environmentMs: 0,
      compileMs: 0,
      warmMs: 0,
      cachedImages: 0,
      imageSamples: 0,
      imageReadMs: 0,
      imageValidationMs: 0,
      imageDecodeMs: 0,
      imageUnpackMs: 0,
    });
  const resources = useMemo(() => {
      const timing =
          process.env.NODE_ENV === 'development'
            ? { readMs: 0, validationMs: 0, decodeMs: 0, unpackMs: 0 }
            : undefined,
        surfaces = createSurfaces({
          concurrency: 4,
          deferFallback: true,
          cache: 'force-cache',
          ...(timing ? { timing } : {}),
        }),
        windowGlass = createWindowGlass(),
        finishes = createLandingFinishMaterials(surfaces);
      const materials = {
          frame: new MeshStandardMaterial({ color: '#fff7e9' }),
          metal: new MeshStandardMaterial({
            color: '#695641',
            metalness: 0.45,
            roughness: 0.65,
          }),
          pillow: new MeshStandardMaterial({
            color: '#efe5d4',
            ...surfaceProperties(surfaces.fabric),
            roughness: 0.95,
          }),
          rug: new MeshStandardMaterial({
            color: '#dfcdb1',
            ...surfaceProperties(surfaces.fabric),
            roughness: 1,
          }),
        },
        pieces = landingFurniture.map(({ color }) => ({
          wood: new MeshStandardMaterial({
            color,
            ...surfaceProperties(surfaces.wood),
            bumpScale: 0.003,
            roughness: 0.65,
          }),
          fabric: new MeshStandardMaterial({
            color,
            ...surfaceProperties(surfaces.fabric),
            bumpScale: 0.008,
            roughness: 0.95,
          }),
        })),
        wall = new BoxGeometry(1, 1, 1),
        rug = new PlaneGeometry(2, 2.65),
        ground = new PlaneGeometry(100, 100),
        shadow = new ShadowMaterial({ transparent: true, opacity: 0.14 });
      return {
        surfaces,
        materials,
        pieces,
        rug,
        wall,
        ground,
        shadow,
        windowGlass,
        finishes,
        timing,
        dispose() {
          windowGlass.dispose();
          finishes.dispose();
          surfaces.dispose();
          for (const material of Object.values(materials)) material.dispose();
          for (const piece of pieces) {
            piece.wood.dispose();
            piece.fabric.dispose();
          }
          rug.dispose();
          wall.dispose();
          ground.dispose();
          shadow.dispose();
        },
      };
    }, []),
    { surfaces, materials } = resources,
    lookAt = useMemo(() => new Vector3(), []);
  const present = useCallback(
    (progress: number, intro: number, ratio: number) => {
      if (!room.current || !furniture.current) return;
      const { opening } = roomChoreography(progress),
        framing = landingFraming(progress, ratio);
      room.current.rotation.y = framing.turn;
      room.current.position.y = -0.15 + intro * 0.15;
      room.current.scale.setScalar(framing.scale * (0.96 + intro * 0.04));
      furniture.current.children.forEach((piece, i) => {
        const key = landingFurniture[i]!.key,
          pose = landingFurniturePose(key, progress),
          assembly = landingFurnitureAssembly(key, progress);
        piece.visible = assembly > 0;
        piece.scale.setScalar(assembly);
        piece.position.set(...pose.position);
        piece.rotation.y = pose.turn;
      });
      if (north.current) north.current.rotation.x = (-opening * Math.PI) / 2.2;
      if (west.current) west.current.rotation.z = (opening * Math.PI) / 2.2;
      finishes.current?.present(progress);
      if (rug.current) {
        const amount = Math.max(0, Math.min(1, (progress - 0.72) / 0.08));
        rug.current.visible = amount > 0;
        rug.current.scale.setScalar(amount);
      }
      camera.position.set(...framing.camera);
      lookAt.set(...framing.lookAt);
      camera.lookAt(lookAt);
      if (camera instanceof PerspectiveCamera)
        camera.setViewOffset(
          ratio,
          1,
          (-framing.shift * ratio) / 2,
          0,
          ratio,
          1,
        );
      targetRef.current.publish?.(progress);
    },
    [camera, lookAt, targetRef],
  );
  useEffect(() => {
    const control = targetRef.current;
    let current = true;
    prepared.current = false;
    firstFrame.current = true;
    const canvas = gl.domElement,
      preparationStarted = performance.now();
    const fail = () => {
      if (!current) return;
      current = false;
      prepared.current = false;
      control.prepared = false;
      onLost();
    };
    const restoreShaders = watchLandingShaders(gl.debug, fail, (code) => {
      if (process.env.NODE_ENV === 'development')
        canvas
          .closest('[data-room-status]')
          ?.setAttribute('data-roomedy-landing-error', code);
    });
    control.wake = invalidate;
    canvas.addEventListener('webglcontextlost', fail);
    let materialsReady = preparationStarted,
      uploadMs = 0,
      environmentMs = 0,
      compileMs = 0,
      warmMs = 0;
    void prepareLandingScene({
      current: () => current,
      load: async () => {
        await resources.surfaces.load();
        materialsReady = performance.now();
      },
      initialize: () => {
        const started = performance.now();
        resources.windowGlass.prepare(gl);
        environmentMs = performance.now() - started;
      },
      upload: () => {
        const started = performance.now();
        for (const map of resources.surfaces.textures) gl.initTexture(map);
        uploadMs = performance.now() - started;
      },
      compile: async () => {
        const started = performance.now();
        await gl.compileAsync(scene, camera);
        compileMs = performance.now() - started;
      },
      warm: () => {
        const started = performance.now();
        displayed.current = targetRef.current.progress;
        present(displayed.current, 0, aspect.current);
        gl.render(scene, camera);
        warmMs = performance.now() - started;
      },
      ready: () => {
        prepared.current = true;
        control.prepared = true;
        entrance.current = 0;
        const now = performance.now();
        const imageEntries = new Map<string, PerformanceResourceTiming>();
        if (process.env.NODE_ENV === 'development')
          for (const entry of performance.getEntriesByType(
            'resource',
          ) as PerformanceResourceTiming[]) {
            if (
              entry.name.startsWith(window.location.origin + '/surfaces/') &&
              /\/(floor|wood|fabric|plaster)-(detail|normal)-v1\.png$/.test(
                entry.name,
              )
            )
              imageEntries.set(entry.name, entry);
          }
        probe.current = {
          previous: now,
          moving: false,
          intervals: [],
          startup: [],
          startupPrevious: now,
          preparationMs: now - preparationStarted,
          texturesMs: materialsReady - preparationStarted,
          gpuMs: environmentMs + uploadMs + compileMs + warmMs,
          uploadMs,
          environmentMs,
          compileMs,
          warmMs,
          cachedImages: Array.from(imageEntries.values()).filter(
            (entry) => entry.transferSize === 0 && entry.encodedBodySize > 0,
          ).length,
          imageSamples: imageEntries.size,
          imageReadMs: resources.timing?.readMs ?? 0,
          imageValidationMs: resources.timing?.validationMs ?? 0,
          imageDecodeMs: resources.timing?.decodeMs ?? 0,
          imageUnpackMs: resources.timing?.unpackMs ?? 0,
        };
        onReady();
        invalidate();
      },
      failed: fail,
    });
    return () => {
      current = false;
      prepared.current = false;
      control.prepared = false;
      if (control.wake === invalidate) delete control.wake;
      canvas.removeEventListener('webglcontextlost', fail);
      restoreShaders();
      resources.dispose();
    };
  }, [
    camera,
    gl,
    invalidate,
    onLost,
    onReady,
    present,
    resources,
    scene,
    targetRef,
  ]);
  useEffect(() => {
    setDpr(landingPixelRatio(size.width, size.height, window.devicePixelRatio));
    invalidate();
  }, [invalidate, setDpr, size.width, size.height]);
  useFrame((_, delta) => {
    if (
      !prepared.current ||
      !room.current ||
      !furniture.current ||
      !targetRef.current.visible
    ) {
      probe.current.moving = false;
      probe.current.startupPrevious = 0;
      firstFrame.current = true;
      return;
    }
    const dt = firstFrame.current ? 0 : delta;
    firstFrame.current = false;
    displayed.current = advanceScroll(
      displayed.current,
      targetRef.current.progress,
      dt,
    );
    entrance.current = Math.min(
      1,
      entrance.current + Math.min(dt, 0.05) / 0.42,
    );
    const targetAspect = Math.max(0.1, size.width / Math.max(1, size.height));
    aspect.current +=
      (targetAspect - aspect.current) *
      (1 - Math.exp(-Math.min(dt, 0.05) * 12));
    if (Math.abs(targetAspect - aspect.current) < 0.0001)
      aspect.current = targetAspect;
    present(displayed.current, 1 - (1 - entrance.current) ** 3, aspect.current);
    const active =
      Math.abs(displayed.current - targetRef.current.progress) > 0.0001 ||
      entrance.current < 1 ||
      Math.abs(aspect.current - targetAspect) > 0.0001;
    if (process.env.NODE_ENV === 'development') {
      const now = performance.now(),
        record = probe.current;
      if (entrance.current < 1 && !record.startupPrevious)
        record.startupPrevious = now;
      if (
        entrance.current <= 1 &&
        record.startup.length < 90 &&
        record.startupPrevious
      ) {
        record.startup.push(now - record.startupPrevious);
        record.startupPrevious = entrance.current < 1 ? now : 0;
      }
      if (active && !record.moving) record.intervals = [];
      if (record.moving) {
        record.intervals.push(now - record.previous);
        if (record.intervals.length > 90) record.intervals.shift();
      }
      record.moving = active;
      record.previous = now;
      const sorted = record.intervals.slice().sort((a, b) => a - b),
        startup = record.startup.slice().sort((a, b) => a - b);
      gl.domElement.setAttribute(
        'data-roomedy-landing',
        JSON.stringify({
          progress: Math.round(displayed.current * 1000) / 1000,
          active,
          prepared: prepared.current,
          entrance: Math.round(entrance.current * 1000) / 1000,
          preparationMs: record.preparationMs,
          texturesMs: record.texturesMs,
          gpuMs: record.gpuMs,
          uploadMs: record.uploadMs,
          environmentMs: record.environmentMs,
          compileMs: record.compileMs,
          warmMs: record.warmMs,
          cachedImages: record.cachedImages,
          imageSamples: record.imageSamples,
          imageReadMs: record.imageReadMs,
          imageValidationMs: record.imageValidationMs,
          imageDecodeMs: record.imageDecodeMs,
          imageUnpackMs: record.imageUnpackMs,
          startupSamples: startup.length,
          startupP95: startup[Math.floor(startup.length * 0.95)] ?? null,
          startupMax: startup.at(-1) ?? null,
          samples: sorted.length,
          p95: sorted[Math.floor(sorted.length * 0.95)] ?? null,
          max: sorted.at(-1) ?? null,
          calls: gl.info.render.calls,
          visibleFurniture: furniture.current.children.filter(
            (piece) => piece.visible,
          ).length,
          paintNorth: landingPaintStroke('north', displayed.current).amount,
          paintWest: landingPaintStroke('west', displayed.current).amount,
          floorPanels: finishes.current?.panels() ?? 0,
          finish: landingFinishState(displayed.current).choice,
          highlight: landingFinishState(displayed.current).focus,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        }),
      );
    }
    if (active) invalidate();
  });
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#fff9ed', '#c8ac85', 0.9]} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      <group ref={room}>
        <LandingFinishes
          sceneRef={finishes}
          northRef={north}
          westRef={west}
          surfaces={surfaces}
          resources={resources.finishes}
          wall={resources.wall}
          frame={materials.frame}
          metal={materials.metal}
          wood={resources.pieces[4]!.wood}
          glass={resources.windowGlass}
        />
        <group ref={furniture}>
          {landingFurniture.map((item, index) => (
            <Furniture
              key={index}
              item={item}
              index={index}
              surfaces={surfaces}
              materials={resources.pieces[index]!}
              metal={materials.metal}
              pillow={materials.pillow}
            />
          ))}
        </group>
        <mesh
          ref={rug}
          geometry={resources.rug}
          material={materials.rug}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, 0.45]}
          receiveShadow
          dispose={null}
        />
      </group>
      <mesh
        geometry={resources.ground}
        material={resources.shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.25, 0]}
        receiveShadow
        dispose={null}
      />
    </>
  );
}

export default function FurnitureScene(props: {
  targetRef: MutableRefObject<ScrollTarget>;
  onReady: () => void;
  onLost: () => void;
}) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={1}
      shadows
      camera={{ position: [7.3, 6, 8.6], fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, size, setDpr }) => {
        gl.shadowMap.type = PCFShadowMap;
        gl.transmissionResolutionScale = 0.35;
        setDpr(
          landingPixelRatio(size.width, size.height, window.devicePixelRatio),
        );
      }}
    >
      <Choreography {...props} />
    </Canvas>
  );
}
