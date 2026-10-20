import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import type { CataloguePlacement } from '../room-editor/catalogue-placement';
import { pointOnFloor } from './manipulation';

const noSubscribe = () => () => {};
const empty = () => null;
/** Local preview subscriber: pointer frames do not rerender the room/editor tree. */
export function CatalogueGhost({
  placement,
}: {
  placement?: CataloguePlacement | undefined;
}) {
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []),
    cursor = useMemo(() => new Vector2(), []);
  const state = useSyncExternalStore(
    placement?.subscribe ?? noSubscribe,
    placement?.getSnapshot ?? empty,
    empty,
  );
  useEffect(() => {
    if (!placement) return;
    return placement.registerTarget({
      element: gl.domElement,
      point: (client) => {
        const rect = gl.domElement.getBoundingClientRect();
        if (!rect.width || !rect.height || gl.getContext().isContextLost())
          return null;
        cursor.set(
          ((client.x - rect.left) / rect.width) * 2 - 1,
          1 - ((client.y - rect.top) / rect.height) * 2,
        );
        camera.updateMatrixWorld();
        ray.setFromCamera(cursor, camera);
        return pointOnFloor(ray.ray);
      },
    });
  }, [placement, gl, camera, ray, cursor]);
  if (!state?.inside) return null;
  const { item, valid } = state;
  const w = item.dimensions.width.value! / 1000,
    h = item.dimensions.height.value! / 1000,
    d = item.dimensions.depth.value! / 1000;
  const color = valid ? '#6d896c' : '#ae573e';
  return (
    <group
      position={[
        item.pose.centerX / 1000,
        h / 2 + 0.01 + (item.pose.bottomY ?? 0) / 1000,
        item.pose.centerZ / 1000,
      ]}
      rotation={[0, (-item.pose.quarterTurns * Math.PI) / 2, 0]}
    >
      <mesh raycast={() => {}}>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      <mesh raycast={() => {}}>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
