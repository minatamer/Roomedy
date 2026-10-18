import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import { finishSchema, idSchema, revisionSchema } from './primitives.js';
import {
  roomDocumentSchema,
  checkFactsSchema,
  furnitureSchema,
  locksSchema,
  poseTargetSchema,
  featureSchema,
} from './room.js';

const transformActions = [
  z.strictObject({
    type: z.literal('move'),
    id: idSchema,
    pose: poseTargetSchema,
  }),
  z.strictObject({
    type: z.literal('rotate'),
    id: idSchema,
    quarterTurns: poseTargetSchema.shape.quarterTurns,
  }),
  z.strictObject({ type: z.literal('remove'), id: idSchema }),
  z.strictObject({
    type: z.literal('resize'),
    id: idSchema,
    width: z.number().int().min(1).max(POLICY.furnitureEdgeMm),
    depth: z.number().int().min(1).max(POLICY.furnitureEdgeMm),
    height: z.number().int().min(1).max(POLICY.furnitureEdgeMm),
  }),
  z.strictObject({
    type: z.literal('finish'),
    id: idSchema,
    finish: finishSchema,
  }),
  z.strictObject({
    type: z.literal('room-finish'),
    floorFinish: finishSchema,
    wallFinish: finishSchema,
  }),
] as const;
const candidateFurniture = furnitureSchema.refine(
  (f) =>
    f.ownership === 'proposed' &&
    f.preference === 'flexible' &&
    Object.values(f.locks).every((v) => !v) &&
    Object.values(f.dimensions).every((m) => m.status !== 'confirmed') &&
    f.pose.provenance.status !== 'confirmed',
);
/** Model actions cannot unlock, confirm measurements, or assign ownership/preferences. */
export const proposalActionSchema = z.discriminatedUnion('type', [
  ...transformActions,
  z.strictObject({ type: z.literal('add'), furniture: candidateFurniture }),
  z.strictObject({
    type: z.literal('replace'),
    id: idSchema,
    furniture: candidateFurniture,
  }),
]);
export const visitorActionSchema = z.discriminatedUnion('type', [
  ...transformActions,
  z.strictObject({ type: z.literal('add'), furniture: furnitureSchema }),
  z.strictObject({
    type: z.literal('replace'),
    id: idSchema,
    furniture: furnitureSchema,
  }),
  z.strictObject({ type: z.literal('add-feature'), feature: featureSchema }),
  z.strictObject({
    type: z.literal('update-feature'),
    id: idSchema,
    feature: featureSchema,
  }),
  z.strictObject({ type: z.literal('remove-feature'), id: idSchema }),
  z.strictObject({
    type: z.literal('set-locks'),
    id: idSchema,
    locks: locksSchema,
  }),
  z.strictObject({
    type: z.literal('set-preference'),
    id: idSchema,
    preference: furnitureSchema.shape.preference,
  }),
  z.strictObject({
    type: z.literal('set-ownership'),
    id: idSchema,
    ownership: furnitureSchema.shape.ownership,
  }),
  z.strictObject({
    type: z.literal('set-intent'),
    intent: roomDocumentSchema.shape.intent,
  }),
  z.strictObject({
    type: z.literal('correct-dimensions'),
    id: idSchema,
    width: z.number().int().min(1).max(POLICY.roomEdgeMm),
    depth: z.number().int().min(1).max(POLICY.roomEdgeMm),
    height: z.number().int().min(1).max(POLICY.roomEdgeMm),
  }),
  z.strictObject({
    type: z.literal('confirm-measurement'),
    target: z.strictObject({
      kind: z.enum(['room', 'furniture', 'feature']),
      id: idSchema,
      field: z.enum([
        'width',
        'depth',
        'height',
        'offset',
        'sill',
        'projection',
      ]),
    }),
    value: z.number().int().min(0).max(POLICY.roomEdgeMm).nullable(),
  }),
]);
export const operationIdentitySchema = z.strictObject({
  workspaceId: idSchema,
  generation: revisionSchema,
  operationId: idSchema,
  roomId: idSchema,
  inputRevision: revisionSchema,
});
export const visitorBatchSchema = z
  .array(visitorActionSchema)
  .min(1)
  .max(POLICY.actions);
export const proposalBatchSchema = z
  .array(proposalActionSchema)
  .min(1)
  .max(POLICY.actions);
export const commandEnvelopeSchema = z.strictObject({
  commandId: idSchema,
  commandSequence: z
    .number()
    .int()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER - 1),
  identity: operationIdentitySchema,
  schemaVersion: z.literal(VERSIONS.schema),
  catalogueVersion: z.literal(VERSIONS.catalogue),
  rulesVersion: z.literal(VERSIONS.rules),
  actions: z.array(visitorActionSchema).min(1).max(POLICY.actions),
});
export const proposalSchema = z
  .strictObject({
    identity: operationIdentitySchema,
    proposalId: idSchema,
    actions: z.array(proposalActionSchema).min(1).max(POLICY.actions),
    affectedIds: z.array(idSchema).max(POLICY.furniture),
    checks: checkFactsSchema,
  })
  .refine(
    (p) =>
      p.identity.roomId === p.checks.roomId &&
      p.identity.inputRevision === p.checks.roomRevision,
  );
export const receiptSchema = z.strictObject({
  identity: operationIdentitySchema,
  proposalId: idSchema,
  commandSequence: z
    .number()
    .int()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER - 1),
  payloadDigest: z.string().regex(/^[a-f0-9]{64}$/),
  committedRevision: revisionSchema,
});
export type ProposalAction = z.infer<typeof proposalActionSchema>;
export type VisitorAction = z.infer<typeof visitorActionSchema>;
export type OperationIdentity = z.infer<typeof operationIdentitySchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type Receipt = z.infer<typeof receiptSchema>;

export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

/** Trusted application argument. Never accepted from a model command's payload. */
export const actionScopeSchema = z.strictObject({
  roomId: idSchema,
  roomRevision: revisionSchema,
  actionKinds: z
    .array(
      z.enum([
        'move',
        'rotate',
        'add',
        'replace',
        'remove',
        'resize',
        'finish',
        'room-finish',
      ]),
    )
    .max(8),
  targetIds: z.array(idSchema).max(POLICY.furniture),
  additions: z
    .array(z.strictObject({ id: idSchema, catalogueId: idSchema }))
    .max(POLICY.actions),
  replacements: z
    .array(z.strictObject({ id: idSchema, catalogueId: idSchema }))
    .max(POLICY.actions),
  removals: z.array(idSchema).max(POLICY.actions),
  roomFinishes: z.boolean(),
});
export type ActionScope = z.infer<typeof actionScopeSchema>;
