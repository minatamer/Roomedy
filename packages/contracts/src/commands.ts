import { z } from 'zod';
import { POLICY } from './policy.js';
import { finishSchema, idSchema, revisionSchema } from './primitives.js';
import {
  checkFactsSchema,
  furnitureSchema,
  locksSchema,
  poseSchema,
} from './room.js';

/** Model output has no unlock or confirmation operation. Starting-state rules still apply. */
export const proposalActionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('move'), id: idSchema, pose: poseSchema }),
  z.strictObject({ type: z.literal('remove'), id: idSchema }),
  z.strictObject({
    type: z.literal('add'),
    furniture: furnitureSchema.refine(
      (f) =>
        f.ownership === 'proposed' &&
        Object.values(f.dimensions).every((m) => m.status !== 'confirmed'),
    ),
  }),
  z.strictObject({
    type: z.literal('finish'),
    id: idSchema,
    finish: finishSchema,
  }),
]);
export const visitorActionSchema = z.union([
  proposalActionSchema,
  z.strictObject({
    type: z.literal('set-locks'),
    id: idSchema,
    locks: locksSchema,
  }),
  z.strictObject({
    type: z.literal('correct-dimensions'),
    id: idSchema,
    width: z.number().int().min(1).max(POLICY.roomEdgeMm),
    depth: z.number().int().min(1).max(POLICY.roomEdgeMm),
    height: z.number().int().min(1).max(POLICY.roomEdgeMm),
  }),
]);
export const operationIdentitySchema = z.strictObject({
  workspaceId: idSchema,
  generation: revisionSchema,
  operationId: idSchema,
  roomId: idSchema,
  inputRevision: revisionSchema,
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
  payloadDigest: z.string().regex(/^[a-f0-9]{64}$/),
  committedRevision: revisionSchema,
});
export type ProposalAction = z.infer<typeof proposalActionSchema>;
export type VisitorAction = z.infer<typeof visitorActionSchema>;
export type OperationIdentity = z.infer<typeof operationIdentitySchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
