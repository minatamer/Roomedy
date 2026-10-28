'use client';
import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { BufferGeometry, Group, InstancedMesh, Material } from 'three';
import type { Surfaces } from '../room-view/surfaces';
import type { createWindowGlass } from '../room-view/window-glass';
import { writeFurnitureInstances } from './furniture-batches';
import {
  landingFloorCount,
  landingPaintStroke,
  landingWallParts,
} from './finish-motion';
import { createLandingFloorWriter } from './finish-materials';
import type { LandingFinishMaterials } from './finish-materials';

export interface LandingFinishHandle {
  present: (progress: number) => void;
  panels: () => number;
}

function PaintRoller({
  group,
  head,
  handle,
  resources,
  wall,
  metal,
  wood,
}: {
  group: RefObject<Group | null>;
  head: RefObject<Group | null>;
  handle: RefObject<Group | null>;
  resources: LandingFinishMaterials;
  wall: BufferGeometry;
  metal: Material;
  wood: Material;
}) {
  return (
    <group ref={group} visible={false}>
      <group ref={head}>
        <mesh
          geometry={resources.cylinder}
          material={resources.roller}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          dispose={null}
        />
      </group>
      <group ref={handle}>
        {[
          { size: [0.64, 0.018, 0.018], at: [0, 0, 0.02] },
          { size: [0.018, 0.14, 0.018], at: [0.31, -0.06, 0.02] },
          { size: [0.3, 0.018, 0.018], at: [0.16, -0.125, 0.02] },
          { size: [0.018, 0.25, 0.018], at: [0.02, -0.25, 0.02] },
        ].map((part, i) => (
          <mesh
            key={i}
            geometry={wall}
            material={metal}
            scale={part.size as [number, number, number]}
            position={part.at as [number, number, number]}
            dispose={null}
          />
        ))}
        <mesh
          geometry={wall}
          material={wood}
          scale={[0.065, 0.2, 0.065]}
          position={[0.02, -0.44, 0.02]}
          dispose={null}
        />
      </group>
    </group>
  );
}

/** Surface/tool representation only. The parent owns every frame and shared resource. */
export function LandingFinishes({
  sceneRef,
  northRef,
  westRef,
  surfaces,
  resources,
  wall,
  frame,
  metal,
  wood,
  glass,
}: {
  sceneRef: RefObject<LandingFinishHandle | null>;
  northRef: RefObject<Group | null>;
  westRef: RefObject<Group | null>;
  surfaces: Surfaces;
  resources: LandingFinishMaterials;
  wall: BufferGeometry;
  frame: Material;
  metal: Material;
  wood: Material;
  glass: ReturnType<typeof createWindowGlass>;
}) {
  const floor = useRef<InstancedMesh>(null),
    north = useRef<InstancedMesh>(null),
    west = useRef<InstancedMesh>(null),
    northRoller = useRef<Group>(null),
    westRoller = useRef<Group>(null),
    northHead = useRef<Group>(null),
    westHead = useRef<Group>(null),
    northHandle = useRef<Group>(null),
    westHandle = useRef<Group>(null),
    writeFloor = useRef<ReturnType<typeof createLandingFloorWriter> | null>(
      null,
    );
  useLayoutEffect(() => {
    const instances = [north.current, west.current, floor.current];
    if (north.current)
      writeFurnitureInstances(north.current, landingWallParts.north);
    if (west.current)
      writeFurnitureInstances(west.current, landingWallParts.west);
    if (floor.current) {
      writeFloor.current = createLandingFloorWriter(floor.current);
      writeFloor.current(0);
    }
    return () => {
      writeFloor.current = null;
      for (const mesh of instances) mesh?.dispose();
    };
  }, [resources, wall]);
  useImperativeHandle(
    sceneRef,
    () => ({
      present(progress) {
        resources.present(progress);
        writeFloor.current?.(progress);
        if (floor.current) floor.current.visible = floor.current.count > 0;
        for (const [side, group, head, handle] of [
          [
            'north',
            northRoller.current,
            northHead.current,
            northHandle.current,
          ],
          ['west', westRoller.current, westHead.current, westHandle.current],
        ] as const) {
          const stroke = landingPaintStroke(side, progress);
          if (!group) continue;
          group.visible = stroke.opacity > 0;
          group.scale.setScalar(stroke.opacity);
          group.position.set(
            side === 'north' ? stroke.along : 0.13 + stroke.lift * 0.35,
            stroke.rollerY,
            side === 'north' ? 0.13 + stroke.lift * 0.35 : stroke.along,
          );
          group.rotation.y = side === 'north' ? 0 : Math.PI / 2;
          if (head) head.rotation.x = stroke.spin;
          if (handle) handle.rotation.x = stroke.handlePitch;
        }
      },
      panels: () => floor.current?.count ?? 0,
    }),
    [resources],
  );
  return (
    <>
      <mesh
        geometry={surfaces.hard}
        material={resources.plainFloor}
        scale={[4.45, 0.16, 5.05]}
        position={[0, -0.1, 0]}
        receiveShadow
        dispose={null}
      />
      <instancedMesh
        ref={floor}
        args={[wall, resources.floor, landingFloorCount]}
        receiveShadow
        frustumCulled={false}
        visible={false}
        dispose={null}
      />
      <group ref={northRef} position={[0, 0, -2.45]}>
        <instancedMesh
          ref={north}
          args={[wall, resources.north.material, landingWallParts.north.length]}
          castShadow
          receiveShadow
          dispose={null}
        />
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
            material={frame}
            scale={part.size as [number, number, number]}
            position={part.at as [number, number, number]}
            dispose={null}
          />
        ))}
        <mesh
          geometry={surfaces.hard}
          material={glass.daylight}
          scale={[1.08, 1.08, 0.008]}
          position={[0.95, 1.65, -0.065]}
          dispose={null}
        />
        <mesh
          geometry={surfaces.hard}
          material={glass.material}
          scale={[1.08, 1.08, 0.012]}
          position={[0.95, 1.65, 0.06]}
          dispose={null}
        />
        <PaintRoller
          group={northRoller}
          head={northHead}
          handle={northHandle}
          resources={resources}
          wall={wall}
          metal={metal}
          wood={wood}
        />
      </group>
      <group ref={westRef} position={[-2.2, 0, 0]}>
        <instancedMesh
          ref={west}
          args={[wall, resources.west.material, 1]}
          castShadow
          receiveShadow
          dispose={null}
        />
        <PaintRoller
          group={westRoller}
          head={westHead}
          handle={westHandle}
          resources={resources}
          wall={wall}
          metal={metal}
          wood={wood}
        />
      </group>
    </>
  );
}
