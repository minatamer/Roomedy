import { useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Object3D, SpotLight } from 'three';
import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { lightSettings } from '@roomedy/contracts/furniture-materials';
import type { FloorEditing } from './use-floor-edit';
import {
  fixtureSource,
  illuminatedFixtures,
  isCeiling,
  SHADOW_LIMIT,
} from './lighting-model';

/** One owned real light/target pair; no independent timer or render loop. */
export function updateFixtureLight(light: SpotLight, piece: Furniture) {
  const value = lightSettings(piece),
    source = fixtureSource(piece);
  light.color.set(value.color);
  light.intensity = value.on
    ? value.brightness * (isCeiling(piece) ? 0.65 : 0.24)
    : 0;
  light.position.set(...source);
  light.target.position.set(source[0], Math.max(0, source[1] - 4), source[2]);
}
export function createFixtureLight(piece: Furniture, shadow: boolean) {
  const light = new SpotLight('#ffffff', 0, 14, 1.22, 0.9, 2);
  light.target = new Object3D();
  updateFixtureLight(light, piece);
  light.castShadow = shadow;
  light.shadow.mapSize.set(512, 512);
  light.shadow.normalBias = 0.025;
  light.shadow.bias = -0.0001;
  light.shadow.camera.near = 0.08;
  return light;
}
function FixtureLight({
  piece,
  shadow,
  editing,
}: {
  piece: Furniture;
  shadow: boolean;
  editing: FloorEditing;
}) {
  const { invalidate } = useThree();
  const [initial] = useState(piece);
  const light = useMemo(
    () => createFixtureLight(initial, shadow),
    [initial, shadow],
  );
  useEffect(() => {
    updateFixtureLight(light, piece);
    invalidate();
  }, [piece, light, invalidate]);
  useFrame(() => {
    const drag = editing.pose.current;
    light.position.set(
      (drag?.id === piece.id ? drag.x : piece.pose.centerX) / 1000,
      light.position.y,
      (drag?.id === piece.id ? drag.z : piece.pose.centerZ) / 1000,
    );
    light.target.position.set(
      light.position.x,
      light.target.position.y,
      light.position.z,
    );
  });
  useEffect(() => () => light.dispose(), [light]);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
}
export function RoomLights({
  room,
  selectedId,
  night,
  editing,
}: {
  room: RoomDocument;
  selectedId: string | null;
  night: boolean;
  editing: FloorEditing;
}) {
  const lights = illuminatedFixtures(room, selectedId);
  return (
    <>
      {lights.map((piece, index) => (
        <FixtureLight
          key={piece.id}
          piece={piece}
          shadow={night && index < SHADOW_LIMIT}
          editing={editing}
        />
      ))}
    </>
  );
}
export function Bulb({ piece }: { piece: Furniture }) {
  const value = lightSettings(piece),
    h = (piece.dimensions.height.value ?? 1550) / 1000;
  const y = isCeiling(piece) ? -0.035 : h - 0.285;
  const xs =
    piece.catalogueId === 'ceiling-track'
      ? [-0.35, 0, 0.35].map(
          (x) => (x * (piece.dimensions.width.value ?? 900)) / 1000,
        )
      : [0];
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, y, 0]} raycast={() => {}}>
          {piece.catalogueId === 'ceiling-flush' ? (
            <boxGeometry
              args={[
                ((piece.dimensions.width.value ?? 500) * 0.9) / 1000,
                0.016,
                ((piece.dimensions.depth.value ?? 500) * 0.9) / 1000,
              ]}
            />
          ) : (
            <sphereGeometry args={[0.045, 12, 8]} />
          )}
          <meshStandardMaterial
            color={value.color}
            emissive={value.color}
            emissiveIntensity={value.on ? value.brightness / 35 : 0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}
