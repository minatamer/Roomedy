import { describe, expect, it } from 'vitest';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { candidateMeasurementSchema } from '@roomedy/contracts/primitives';
import {
  proposalActionSchema,
  operationIdentitySchema,
} from '@roomedy/contracts/commands';
import { projectSchema, recoverySchema } from '@roomedy/contracts/project';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { roomFixture } from './fixtures/room.js';

describe('canonical structural boundaries', () => {
  it('accepts integer dimensions, half-mm center poses and unknown measurements', () => {
    const room = roomFixture();
    expect(roomDocumentSchema.parse(room)).toEqual(room);
    room.room.width = { status: 'unknown', value: null, sourceId: null };
    expect(roomDocumentSchema.safeParse(room).success).toBe(true);
  });
  it.each([
    -1,
    0,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER,
    POLICY.roomEdgeMm + 1,
  ])('rejects invalid dimension %s', (value) => {
    const room = roomFixture();
    room.room.width.value = value;
    expect(roomDocumentSchema.safeParse(room).success).toBe(false);
  });
  it('rejects duplicate IDs, excessive counts, unsupported versions, unknown keys and rotation', () => {
    const base = roomFixture();
    for (const change of [
      { furniture: [base.furniture[0], base.furniture[0]] },
      {
        furniture: Array.from({ length: POLICY.furniture + 1 }, (_, i) => ({
          ...base.furniture[0],
          id: `item_${i}`,
        })),
      },
      { catalogueVersion: 'not-supported' },
      { rulesVersion: 'next' },
      { secret: 'forbidden' },
      {
        furniture: [
          {
            ...base.furniture[0],
            pose: { centerX: 1, centerZ: 1, quarterTurns: 4 },
          },
        ],
      },
    ])
      expect(roomDocumentSchema.safeParse({ ...base, ...change }).success).toBe(
        false,
      );
  });
  it('preserves physical feature conflicts as structurally valid facts for the spatial engine', () => {
    const room = roomFixture();
    room.furniture[0]!.pose.centerX = -100;
    expect(roomDocumentSchema.safeParse(room).success).toBe(true);
    const m = (value: number) => ({
      value,
      status: 'estimated' as const,
      sourceId: 'photo-1',
    });
    room.room.features.push({
      id: 'door-1',
      kind: 'door',
      wall: 'north',
      wallProvenance: { status: 'estimated', sourceId: 'photo-1' },
      offset: m(3500),
      width: m(900),
      height: m(2100),
      sill: m(0),
      mechanism: 'inward',
      mechanismProvenance: { status: 'estimated', sourceId: 'photo-1' },
      hinge: 'left',
      hingeProvenance: { status: 'estimated', sourceId: 'photo-1' },
    });
    expect(roomDocumentSchema.safeParse(room).success).toBe(true);
  });
  it('prevents untrusted confirmation, unlock commands and supplied origin/admission fields', () => {
    expect(
      candidateMeasurementSchema(20000).safeParse({
        value: 3000,
        status: 'confirmed',
        sourceId: 'model',
      }).success,
    ).toBe(false);
    expect(
      proposalActionSchema.safeParse({
        type: 'set-locks',
        id: 'desk_1',
        locks: { position: false, dimensions: false, rotation: false },
      }).success,
    ).toBe(false);
    expect(
      operationIdentitySchema.safeParse({
        workspaceId: 'w',
        generation: 0,
        operationId: 'op',
        roomId: 'r',
        inputRevision: 0,
        origin: 'visitor',
        admission: true,
      }).success,
    ).toBe(false);
  });
  it('requires evidence for pose and categorical physical facts without accepting mismatched unknown labels', () => {
    const room = roomFixture();
    const missingPose = structuredClone(room) as unknown as {
      furniture: { pose: Record<string, unknown> }[];
    };
    delete missingPose.furniture[0]!.pose.provenance;
    expect(roomDocumentSchema.safeParse(missingPose).success).toBe(false);
    const feature = {
      id: 'door_evidence',
      kind: 'door',
      wall: 'unknown',
      wallProvenance: { status: 'confirmed', sourceId: 'photo_1' },
      offset: { status: 'unknown', value: null, sourceId: null },
      width: { status: 'unknown', value: null, sourceId: null },
      height: { status: 'unknown', value: null, sourceId: null },
      sill: { status: 'unknown', value: null, sourceId: null },
      mechanism: 'unknown',
      mechanismProvenance: { status: 'unknown', sourceId: null },
      hinge: 'unknown',
      hingeProvenance: { status: 'unknown', sourceId: null },
    };
    expect(
      roomDocumentSchema.safeParse({
        ...room,
        room: { ...room.room, features: [feature] },
      }).success,
    ).toBe(false);
    const uncertainFeature = {
      ...feature,
      wallProvenance: { status: 'unknown', sourceId: null },
    };
    expect(
      roomDocumentSchema.safeParse({
        ...room,
        room: { ...room.room, features: [uncertainFeature] },
      }).success,
    ).toBe(true);
    expect(
      roomDocumentSchema.safeParse({
        ...room,
        room: {
          ...room.room,
          features: [{ ...uncertainFeature, mechanism: 'inward' }],
        },
      }).success,
    ).toBe(false);
  });
  it('accepts only semantic current/baseline export and fixed-lifetime recovery', () => {
    const project = {
      format: 'roomedy-project',
      version: 1,
      catalogueVersion: VERSIONS.catalogue,
      rulesVersion: VERSIONS.rules,
      current: roomFixture(),
      baseline: roomFixture(),
    };
    expect(projectSchema.safeParse(project).success).toBe(true);
    for (const key of [
      'photos',
      'chat',
      'tokens',
      'operations',
      'runtimeMode',
      'undo',
    ])
      expect(projectSchema.safeParse({ ...project, [key]: [] }).success).toBe(
        false,
      );
    expect(
      recoverySchema.safeParse({
        createdAt: 100,
        expiresAt: 100 + POLICY.guestLifetimeMs,
        project,
        ui: { view: '2d' },
      }).success,
    ).toBe(true);
    expect(
      recoverySchema.safeParse({
        createdAt: 100,
        expiresAt: 101 + POLICY.guestLifetimeMs,
        project,
        ui: { view: '2d' },
      }).success,
    ).toBe(false);
  });
});
