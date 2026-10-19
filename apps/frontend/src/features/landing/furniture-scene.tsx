'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  MeshStandardMaterial,
  PCFShadowMap,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from 'three';
import type { Group } from 'three';
import { proceduralParts } from '../room-view/representations/definitions';
import { createSurfaces, detailedParts } from '../room-view/surfaces';
import type { Surfaces } from '../room-view/surfaces';
import {
  advanceScroll,
  roomChoreography,
  landingFraming,
  landingPixelRatio,
  landingFurniture,
  landingFurniturePose,
} from './scroll-motion';
import { prepareLandingScene } from './prepare-scene';
import { createWindowGlass } from '../room-view/window-glass';
import type { ScrollTarget } from './scroll-motion';

type FurnitureMaterials = {
  wood: MeshStandardMaterial;
  fabric: MeshStandardMaterial;
};
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
  const { category, size } = item;
  const parts = useMemo(
    () => detailedParts(proceduralParts(category, size, 'none'), size),
    [category, size],
  );
  return (
    <group name={`furniture-${index}`}>
      {parts.map((part) => {
        const fabric = part.role === 'soft',
          metal = part.role === 'metal';
        return (
          <mesh
            key={part.name}
            geometry={fabric ? surfaces.soft : surfaces.hard}
            position={
              part.center.map((v) => v / 1000) as [number, number, number]
            }
            scale={part.size.map((v) => v / 1000) as [number, number, number]}
            castShadow
            receiveShadow
            dispose={null}
            material={
              fabric
                ? part.name.startsWith('pillow') || part.name === 'mattress'
                  ? pillow
                  : materials.fabric
                : metal
                  ? metalMaterial
                  : materials.wood
            }
          />
        );
      })}
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
    });
  const resources = useMemo(() => {
      const surfaces = createSurfaces(),
        windowGlass = createWindowGlass();
      const materials = {
          floor: new MeshStandardMaterial({
            color: '#d0af80',
            map: surfaces.floor,
            bumpMap: surfaces.floor,
            bumpScale: 0.009,
            roughness: 0.82,
          }),
          north: new MeshStandardMaterial({
            color: '#e4d8c3',
            map: surfaces.plaster,
            roughness: 0.9,
          }),
          west: new MeshStandardMaterial({
            color: '#ded0b9',
            map: surfaces.plaster,
            roughness: 0.9,
          }),
          frame: new MeshStandardMaterial({ color: '#fff7e9' }),
          metal: new MeshStandardMaterial({
            color: '#695641',
            metalness: 0.45,
            roughness: 0.65,
          }),
          pillow: new MeshStandardMaterial({
            color: '#efe5d4',
            map: surfaces.fabric,
            roughness: 0.95,
          }),
          rug: new MeshStandardMaterial({
            color: '#dfcdb1',
            map: surfaces.fabric,
            roughness: 1,
          }),
        },
        pieces = landingFurniture.map(({ color }) => ({
          wood: new MeshStandardMaterial({
            color,
            map: surfaces.wood,
            bumpMap: surfaces.wood,
            bumpScale: 0.003,
            roughness: 0.65,
          }),
          fabric: new MeshStandardMaterial({
            color,
            map: surfaces.fabric,
            bumpMap: surfaces.fabric,
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
        dispose() {
          windowGlass.dispose();
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
        const pose = landingFurniturePose(landingFurniture[i]!.key, progress);
        piece.position.set(...pose.position);
        piece.rotation.y = pose.turn;
      });
      if (north.current) north.current.rotation.x = (-opening * Math.PI) / 2.2;
      if (west.current) west.current.rotation.z = (opening * Math.PI) / 2.2;
      camera.position.set(...framing.camera);
      lookAt.set(...framing.lookAt);
      camera.lookAt(lookAt);
    },
    [camera, lookAt],
  );
  useEffect(() => {
    const control = targetRef.current;
    let current = true;
    prepared.current = false;
    firstFrame.current = true;
    const canvas = gl.domElement,
      preparationStarted = performance.now();
    control.wake = invalidate;
    canvas.addEventListener('webglcontextlost', onLost);
    void prepareLandingScene({
      current: () => current,
      upload: () => {
        resources.windowGlass.prepare(gl);
        for (const map of [
          resources.surfaces.floor,
          resources.surfaces.wood,
          resources.surfaces.fabric,
          resources.surfaces.plaster,
        ])
          gl.initTexture(map);
      },
      compile: () => gl.compileAsync(scene, camera),
      warm: () => {
        displayed.current = targetRef.current.progress;
        present(displayed.current, 0, aspect.current);
        gl.render(scene, camera);
      },
      ready: () => {
        prepared.current = true;
        entrance.current = 0;
        const now = performance.now();
        probe.current = {
          previous: now,
          moving: false,
          intervals: [],
          startup: [],
          startupPrevious: now,
          preparationMs: now - preparationStarted,
        };
        onReady();
        invalidate();
      },
      failed: onLost,
    });
    return () => {
      current = false;
      prepared.current = false;
      if (control.wake === invalidate) delete control.wake;
      canvas.removeEventListener('webglcontextlost', onLost);
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
    entrance.current = Math.min(1, entrance.current + Math.min(dt, 0.05) / 1.1);
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
          startupSamples: startup.length,
          startupP95: startup[Math.floor(startup.length * 0.95)] ?? null,
          startupMax: startup.at(-1) ?? null,
          samples: sorted.length,
          p95: sorted[Math.floor(sorted.length * 0.95)] ?? null,
          max: sorted.at(-1) ?? null,
          calls: gl.info.render.calls,
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
        <mesh
          geometry={surfaces.hard}
          material={materials.floor}
          scale={[4.45, 0.16, 5.05]}
          position={[0, -0.1, 0]}
          receiveShadow
          dispose={null}
        />
        <group ref={north} position={[0, 0, -2.45]}>
          {[
            { size: [4.45, 1.05, 0.12], at: [0, 0.5, 0] },
            { size: [4.45, 0.35, 0.12], at: [0, 2.45, 0] },
            { size: [2.55, 1.25, 0.12], at: [-0.95, 1.65, 0] },
            { size: [0.65, 1.25, 0.12], at: [1.9, 1.65, 0] },
          ].map((part, i) => (
            <mesh
              key={i}
              geometry={resources.wall}
              material={materials.north}
              scale={part.size as [number, number, number]}
              position={part.at as [number, number, number]}
              castShadow
              receiveShadow
              dispose={null}
            />
          ))}
          {[
            { size: [1.25, 0.085, 0.15], at: [0.95, 1.0675, 0.065] },
            { size: [1.25, 0.085, 0.15], at: [0.95, 2.2325, 0.065] },
            { size: [0.085, 1.08, 0.15], at: [0.3675, 1.65, 0.065] },
            { size: [0.085, 1.08, 0.15], at: [1.5325, 1.65, 0.065] },
            { size: [0.035, 1.08, 0.11], at: [0.95, 1.65, 0.08] },
            { size: [1.35, 0.055, 0.23], at: [0.95, 1.025, 0.095] },
          ].map((part, i) => (
            <mesh
              key={i}
              geometry={surfaces.hard}
              material={materials.frame}
              scale={part.size as [number, number, number]}
              position={part.at as [number, number, number]}
              dispose={null}
            />
          ))}
          <mesh
            geometry={surfaces.hard}
            material={resources.windowGlass.daylight}
            scale={[1.08, 1.08, 0.008]}
            position={[0.95, 1.65, -0.065]}
            dispose={null}
          />
          <mesh
            geometry={surfaces.hard}
            material={resources.windowGlass.material}
            scale={[1.08, 1.08, 0.012]}
            position={[0.95, 1.65, 0.06]}
            dispose={null}
          />
        </group>
        <group ref={west} position={[-2.2, 0, 0]}>
          <mesh
            geometry={surfaces.hard}
            material={materials.west}
            scale={[0.12, 2.65, 5]}
            position={[0, 1.3, 0]}
            castShadow
            receiveShadow
            dispose={null}
          />
        </group>
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
