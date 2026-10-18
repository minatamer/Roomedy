import { z } from 'zod';
import { POLICY } from './policy.js';
import { idSchema, finishSchema } from './primitives.js';
import { roomDocumentSchema, checkFactsSchema } from './room.js';
import {
  operationIdentitySchema,
  proposalBatchSchema,
  actionScopeSchema,
} from './commands.js';

const choiceSchema = z.strictObject({
  id: idSchema,
  catalogueId: idSchema,
  size: z
    .strictObject({
      width: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
      depth: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
      height: z.number().int().min(10).max(POLICY.furnitureEdgeMm),
    })
    .nullable(),
  finish: finishSchema.nullable(),
});
export const searchGoalSchema = z.strictObject({
  kind: z.enum(['furnish', 'add', 'rearrange-owned', 'window', 'appearance']),
  targetIds: z.array(idSchema).max(POLICY.furniture),
  retainedIds: z.array(idSchema).max(POLICY.furniture),
  fixedIds: z.array(idSchema).max(POLICY.furniture),
  windowId: idSchema.nullable(),
  additions: z.array(choiceSchema).max(POLICY.actions),
  replacements: z.array(choiceSchema).max(POLICY.actions),
  removals: z.array(idSchema).max(POLICY.actions),
  roomFinish: z
    .strictObject({ floorFinish: finishSchema, wallFinish: finishSchema })
    .nullable(),
  pieceFinishes: z
    .array(z.strictObject({ id: idSchema, finish: finishSchema }))
    .max(POLICY.actions),
});
export const searchRequestSchema = z.strictObject({
  identity: operationIdentitySchema,
  room: roomDocumentSchema,
  goal: searchGoalSchema,
  seed: z.number().int().min(0).max(0xffffffff),
  maxNodes: z.number().int().min(1).max(POLICY.searchCandidates),
});
const comparison = (maximum: number) =>
  z.strictObject({
    before: z.number().min(0).max(maximum).nullable(),
    after: z.number().min(0).max(maximum).nullable(),
  });
export const searchFactsSchema = z.strictObject({
  windowDistanceMm: comparison(100_000),
  centralFreeMm2: comparison(POLICY.roomEdgeMm ** 2),
  deskChairDistanceMm: comparison(100_000),
  deskChairAlignmentMm: comparison(100_000),
  chairFacesDesk: z.strictObject({
    before: z.boolean().nullable(),
    after: z.boolean().nullable(),
  }),
  balanceDistanceMm: comparison(100_000),
  displacementMm: z.number().min(0).max(10_000_000),
  changedIds: z.array(idSchema).max(POLICY.furniture),
  coordinatedIds: z.array(idSchema).max(POLICY.furniture),
  requiredPiecesPlaced: z.number().int().min(0).max(POLICY.furniture),
  approximate: z.boolean(),
  missingInputs: z.array(z.string().max(160)).max(1024),
});
export const searchCandidateSchema = z.strictObject({
  actions: proposalBatchSchema,
  affectedIds: z.array(idSchema).max(POLICY.furniture + 1),
  checks: checkFactsSchema,
  facts: searchFactsSchema,
});
export const searchResultSchema = z.strictObject({
  identity: operationIdentitySchema,
  seed: z.number().int().min(0).max(0xffffffff),
  visitedNodes: z.number().int().min(0).max(POLICY.searchCandidates),
  evaluated: z.number().int().min(0).max(POLICY.searchCandidates),
  pruned: z.number().int().min(0).max(POLICY.searchCandidates),
  termination: z.enum([
    'exhausted',
    'work-limit',
    'deadline',
    'cancelled',
    'invalid-input',
    'out-of-scope',
    'needs-measurement',
    'unsupported',
  ]),
  candidate: searchCandidateSchema.nullable(),
  question: z
    .strictObject({
      id: idSchema,
      field: z.enum([
        'width',
        'depth',
        'height',
        'wall',
        'offset',
        'mechanism',
        'hinge',
        'sill',
      ]),
    })
    .nullable(),
  alternatives: z
    .array(
      z.enum([
        'confirm-measurement',
        'relax-preference',
        'omit-optional',
        'choose-smaller-replacement',
        'review-lock',
        'include-coordinated-piece',
        'no-improvement-within-search',
      ]),
    )
    .max(4),
});
export const searchJobSchema = z.strictObject({
  request: searchRequestSchema,
  scope: actionScopeSchema,
});
export type SearchGoal = z.infer<typeof searchGoalSchema>;
export type SearchChoice = z.infer<typeof choiceSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchCandidate = z.infer<typeof searchCandidateSchema>;
export type SearchFacts = z.infer<typeof searchFactsSchema>;
