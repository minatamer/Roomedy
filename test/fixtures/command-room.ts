import type {
  CommandEnvelope,
  VisitorAction,
} from '@roomedy/contracts/commands';
import { VERSIONS } from '@roomedy/contracts/policy';
import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { CommandWorkspace } from '@roomedy/spatial';

export const known = (value: number) => ({
  value,
  status: 'confirmed' as const,
  sourceId: 'authored-sample',
});
export const unknown = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
export const observed = () => ({
  status: 'confirmed' as const,
  sourceId: 'authored-sample',
});

/** Synthetic physical objects: owned dimensions need not match an offered model. */
export function piece(
  id: string,
  x = 2000,
  z = 2000,
  options: {
    width?: number;
    depth?: number;
    height?: number;
    catalogueId?: string;
    quarterTurns?: 0 | 1 | 2 | 3;
  } = {},
): Furniture {
  return {
    id,
    label: id,
    catalogueId: options.catalogueId ?? 'procedural-desk',
    catalogueVersion: VERSIONS.catalogue,
    dimensions: {
      width: known(options.width ?? 1200),
      depth: known(options.depth ?? 600),
      height: known(options.height ?? 740),
    },
    pose: {
      centerX: x,
      centerZ: z,
      quarterTurns: options.quarterTurns ?? 0,
      provenance: observed(),
    },
    ownership: 'owned',
    preference: 'flexible',
    locks: { dimensions: false, position: false, rotation: false },
    finish: 'oak',
  };
}

export function commandRoom(
  furniture: Furniture[] = [],
  features: Feature[] = [],
): RoomDocument {
  return {
    schemaVersion: VERSIONS.schema,
    roomId: 'room_test',
    roomRevision: 0,
    unit: 'mm',
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    room: {
      shape: 'rectangle',
      width: known(10000),
      depth: known(10000),
      height: known(3000),
      floorFinish: 'oak',
      wallFinish: 'ivory',
      features,
    },
    furniture,
    intent: { condition: 'furnished', goals: ['work'], style: 'warm-simple' },
  };
}

export function door(id = 'door_1'): Extract<Feature, { kind: 'door' }> {
  return {
    id,
    kind: 'door',
    wall: 'north',
    wallProvenance: observed(),
    offset: known(1000),
    width: known(900),
    height: known(2100),
    sill: known(0),
    mechanism: 'inward',
    mechanismProvenance: observed(),
    hinge: 'left',
    hingeProvenance: observed(),
  };
}

export function windowFeature(): Extract<Feature, { kind: 'window' }> {
  return {
    id: 'window_1',
    kind: 'window',
    wall: 'north',
    wallProvenance: observed(),
    offset: known(1000),
    width: known(1000),
    height: known(1000),
    sill: known(900),
    mechanism: 'fixed',
    mechanismProvenance: observed(),
  };
}

export function move(
  id: string,
  centerX: number,
  centerZ: number,
  quarterTurns: 0 | 1 | 2 | 3 = 0,
): VisitorAction {
  return { type: 'move', id, pose: { centerX, centerZ, quarterTurns } };
}

export function envelope(
  workspace: CommandWorkspace,
  actions: VisitorAction[],
  commandId = `command_${workspace.lastCommandSequence + 1}`,
): CommandEnvelope {
  return {
    commandId,
    commandSequence: workspace.lastCommandSequence + 1,
    identity: {
      workspaceId: workspace.workspaceId,
      generation: workspace.generation,
      operationId: `operation_${workspace.lastCommandSequence + 1}`,
      roomId: workspace.current.roomId,
      inputRevision: workspace.current.roomRevision,
    },
    schemaVersion: VERSIONS.schema,
    catalogueVersion: VERSIONS.catalogue,
    rulesVersion: VERSIONS.rules,
    actions,
  };
}
