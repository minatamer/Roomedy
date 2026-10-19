'use client';
import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  MeshStandardMaterial,
  PCFShadowMap,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from 'three';
import type { Group } from 'three';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import { proceduralParts } from '../room-view/representations/definitions';
import { createSurfaces, detailedParts } from '../room-view/surfaces';
import type { Surfaces } from '../room-view/surfaces';
import { advanceScroll, roomChoreography } from './scroll-motion';
import type { ScrollTarget } from './scroll-motion';

const furnishings: {
  category: CatalogueEntry['category'];
  size: { width: number; depth: number; height: number };
  position: [number, number];
  turn: number;
  color: string;
}[] = [
  {
    category: 'bed',
    size: { width: 1600, depth: 2100, height: 850 },
    position: [-1.05, -0.7],
    turn: 0,
    color: '#b8875c',
  },
  {
    category: 'desk',
    size: { width: 1200, depth: 600, height: 750 },
    position: [1, -1.55],
    turn: 0,
    color: '#c09a6f',
  },
  {
    category: 'chair',
    size: { width: 670, depth: 630, height: 1150 },
    position: [1, -0.65],
    turn: Math.PI,
    color: '#b67d66',
  },
  {
    category: 'storage',
    size: { width: 800, depth: 350, height: 1200 },
    position: [-1.6, 1.65],
    turn: Math.PI / 2,
    color: '#b0875d',
  },
  {
    category: 'storage',
    size: { width: 450, depth: 450, height: 550 },
    position: [0.15, 1.55],
    turn: 0,
    color: '#a57551',
  },
];

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
  item: (typeof furnishings)[number];
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
  const { camera, size, gl, invalidate } = useThree(),
    room = useRef<Group>(null),
    furniture = useRef<Group>(null),
    north = useRef<Group>(null),
    west = useRef<Group>(null),
    displayed = useRef(0),
    entrance = useRef(0),
    prepared = useRef(false),
    probe = useRef({ previous: 0, moving: false, intervals: [] as number[] });
  const resources = useMemo(() => {
      const surfaces = createSurfaces();
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
          glass: new MeshStandardMaterial({
            color: '#b9cbc7',
            roughness: 0.35,
          }),
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
        pieces = furnishings.map(({ color }) => ({
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
        rug = new PlaneGeometry(2, 2.65),
        ground = new PlaneGeometry(100, 100),
        shadow = new ShadowMaterial({ transparent: true, opacity: 0.14 });
      return {
        surfaces,
        materials,
        pieces,
        rug,
        ground,
        shadow,
        dispose() {
          surfaces.dispose();
          for (const material of Object.values(materials)) material.dispose();
          for (const piece of pieces) {
            piece.wood.dispose();
            piece.fabric.dispose();
          }
          rug.dispose();
          ground.dispose();
          shadow.dispose();
        },
      };
    }, []),
    { surfaces, materials } = resources,
    lookAt = useMemo(() => new Vector3(), []);
  useEffect(() => {
    const control = targetRef.current;
    control.wake = invalidate;
    invalidate();
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onLost);
    return () => {
      if (control.wake === invalidate) delete control.wake;
      canvas.removeEventListener('webglcontextlost', onLost);
      resources.dispose();
    };
  }, [gl, invalidate, onLost, resources, targetRef]);
  useEffect(() => {
    invalidate();
  }, [invalidate, size.width, size.height]);
  useFrame((_, delta) => {
    if (!room.current || !furniture.current || !targetRef.current.visible) {
      probe.current.moving = false;
      return;
    }
    displayed.current = advanceScroll(
      displayed.current,
      targetRef.current.progress,
      delta,
    );
    entrance.current = Math.min(
      1,
      entrance.current + Math.min(delta, 0.05) / 1.1,
    );
    const { assembly, rotation, opening } = roomChoreography(displayed.current),
      intro = 1 - (1 - entrance.current) ** 3,
      spread = 1 - assembly;
    room.current.rotation.y = rotation * -0.85 + opening * 0.35;
    room.current.position.y = -0.15 + intro * 0.15;
    room.current.scale.setScalar(0.9 + intro * 0.1);
    furniture.current.children.forEach((piece, i) => {
      const item = furnishings[i]!;
      piece.position.set(
        item.position[0] * (1 + spread * 0.48),
        spread * (0.35 + (i % 3) * 0.28) + (1 - intro) * 1.1,
        item.position[1] * (1 + spread * 0.3),
      );
      piece.rotation.y = item.turn + spread * (i % 2 ? 0.3 : -0.3);
    });
    if (north.current) north.current.rotation.x = (-opening * Math.PI) / 2.2;
    if (west.current) west.current.rotation.z = (opening * Math.PI) / 2.2;
    const ratio = Math.max(0.25, size.width / Math.max(1, size.height)),
      distance = Math.max(1, 0.9 / ratio);
    camera.position.set(
      (7.3 - opening * 2.8) * distance,
      (6 + rotation * 2.8 - opening * 5.4) * distance,
      (8.6 - opening * 1.4) * distance,
    );
    lookAt.set(0, 0.5 + opening * 0.2, 0);
    camera.lookAt(lookAt);
    const active =
      Math.abs(displayed.current - targetRef.current.progress) > 0.0001 ||
      entrance.current < 1;
    if (!prepared.current && entrance.current > 0.02) {
      prepared.current = true;
      onReady();
    }
    if (process.env.NODE_ENV === 'development') {
      const now = performance.now(),
        record = probe.current;
      if (active && !record.moving) record.intervals = [];
      if (record.moving) {
        record.intervals.push(now - record.previous);
        if (record.intervals.length > 90) record.intervals.shift();
      }
      record.moving = active;
      record.previous = now;
      const sorted = record.intervals.slice().sort((a, b) => a - b);
      gl.domElement.setAttribute(
        'data-roomedy-landing',
        JSON.stringify({
          progress: Math.round(displayed.current * 1000) / 1000,
          active,
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
          <mesh
            geometry={surfaces.hard}
            material={materials.north}
            scale={[4.45, 2.65, 0.12]}
            position={[0, 1.3, 0]}
            castShadow
            receiveShadow
            dispose={null}
          />
          <mesh
            geometry={surfaces.hard}
            material={materials.frame}
            scale={[1.25, 1.25, 0.05]}
            position={[0.95, 1.65, 0.085]}
            dispose={null}
          />
          <mesh
            geometry={surfaces.hard}
            material={materials.glass}
            scale={[1.08, 1.08, 0.05]}
            position={[0.95, 1.65, 0.12]}
            dispose={null}
          />
          <mesh
            geometry={surfaces.hard}
            material={materials.frame}
            scale={[0.035, 1.08, 0.06]}
            position={[0.95, 1.65, 0.16]}
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
          {furnishings.map((item, index) => (
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
      dpr={[1, 1.5]}
      shadows
      camera={{ position: [7.3, 6, 8.6], fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFShadowMap;
      }}
    >
      <Choreography {...props} />
    </Canvas>
  );
}
