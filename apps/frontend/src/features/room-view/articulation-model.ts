import type { Object3D } from 'three';

/** The prepared cabinet door is already authored at its left hinge. Instance only. */
export function cabinetDoorRig(instance: Object3D) {
  const door = instance.getObjectByName('door');
  if (!door) return null;
  const closed = door.rotation.y;
  return {
    apply(amount: number) {
      door.rotation.y =
        closed - (Math.max(0, Math.min(1, amount)) * Math.PI) / 2;
    },
  };
}
