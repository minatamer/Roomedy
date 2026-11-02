import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import type { BoxPart } from './representations/definitions';
import type { MirrorReflection } from './mirror-reflections';
import { metres } from './adapter';

/** This marker inherits the same piece/hinged-leaf transform as its glass. */
export function MirrorSurface({
  part,
  pieceId,
  pool,
  pivot,
}: {
  part: BoxPart;
  pieceId: string;
  pool: MirrorReflection;
  pivot: readonly number[];
}) {
  const marker = useRef<Group>(null),
    { invalidate } = useThree();
  useLayoutEffect(() => {
    if (!marker.current) return;
    const remove = pool.register({
      id: `${pieceId}:${part.name}`,
      pieceId,
      object: marker.current,
      width: metres(part.size[0]),
      height: metres(part.size[1]),
    });
    invalidate();
    return () => {
      remove();
      invalidate();
    };
  }, [part.name, part.size, pool, pieceId, invalidate]);
  return (
    <group
      ref={marker}
      position={[
        metres(part.center[0]) - pivot[0]!,
        metres(part.center[1]) - pivot[1]!,
        metres(part.center[2] + part.size[2] / 2) + 0.0008 - pivot[2]!,
      ]}
    />
  );
}
export function RoomMirror({
  pool,
  selectedId,
}: {
  pool: MirrorReflection;
  selectedId: string | null;
}) {
  useFrame(({ camera }) => {
    pool.update(camera, selectedId);
  });
  return <primitive object={pool.reflector} dispose={null} />;
}
