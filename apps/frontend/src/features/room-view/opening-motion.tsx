import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { advanceOpening } from './articulation';
import type { PartMotion } from './articulation';

export function useOpeningMotion(
  open: boolean,
  apply: (amount: number) => void,
) {
  const amount = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [open, invalidate]);
  useFrame((_, delta) => {
    if (amount.current === (open ? 1 : 0)) return;
    amount.current = advanceOpening(amount.current, open, delta);
    apply(amount.current);
    invalidate();
  });
}
export function OpeningMotion({
  open,
  motion,
  children,
}: {
  open: boolean;
  motion: PartMotion;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useOpeningMotion(open, (amount) => {
    if (!group.current) return;
    group.current.position.set(
      ...(motion.pivot.map((v, i) => v + motion.travel[i]! * amount) as [
        number,
        number,
        number,
      ]),
    );
    group.current.rotation.y = motion.turn * amount;
  });
  return (
    <group ref={group} position={motion.pivot}>
      {children}
    </group>
  );
}
