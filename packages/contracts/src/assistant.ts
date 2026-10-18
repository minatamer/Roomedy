import { z } from 'zod';
import { idSchema, finishSchema } from './primitives.js';
import { POLICY } from './policy.js';
import { issueSchema } from './issues.js';
import { proposalBatchSchema } from './commands.js';
import { checkFactsSchema } from './room.js';
import { searchFactsSchema } from './search.js';

const fieldSchema = z.enum([
  'width',
  'depth',
  'height',
  'wall',
  'offset',
  'mechanism',
  'hinge',
  'sill',
]);
export const assistantReplySchema = z.strictObject({
  kind: z.enum([
    'explanation',
    'clarification',
    'unsupported',
    'proposal',
    'visitor-action',
  ]),
  summary: z.string().min(1).max(1200),
  actions: proposalBatchSchema.nullable(),
  objectIds: z.array(idSchema).max(POLICY.furniture + POLICY.features),
  catalogueIds: z.array(idSchema).max(8),
  checks: checkFactsSchema,
  facts: searchFactsSchema.nullable(),
  question: z.strictObject({ id: idSchema, field: fieldSchema }).nullable(),
  blockedIssue: issueSchema.nullable(),
  control: z
    .enum([
      'measurement',
      'position-lock',
      'rotation-lock',
      'dimensions-lock',
      'preference',
      'undo',
    ])
    .nullable(),
});
export type AssistantReply = z.infer<typeof assistantReplySchema>;
const categorySchema = z.enum(['bed', 'desk', 'chair', 'wardrobe', 'storage']);
/** Flat tool actions avoid deep provider dialect nesting. Application builds full semantic additions. */
export const assistantEditSchema = z.strictObject({
  type: z.enum([
    'move',
    'rotate',
    'add',
    'replace',
    'remove',
    'finish',
    'room-finish',
  ]),
  id: idSchema.nullable(),
  catalogueId: idSchema.nullable(),
  centerX: z
    .number()
    .multipleOf(0.5)
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm)
    .nullable(),
  centerZ: z
    .number()
    .multipleOf(0.5)
    .min(-POLICY.coordinateAbsMm)
    .max(POLICY.coordinateAbsMm)
    .nullable(),
  quarterTurns: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .nullable(),
  finish: finishSchema.nullable(),
  floorFinish: finishSchema.nullable(),
  wallFinish: finishSchema.nullable(),
});
export const assistantToolSchemas = {
  read_room: z.strictObject({}),
  find_furniture: z.strictObject({
    category: categorySchema.nullable(),
    maxWidth: z.number().int().min(1).max(POLICY.furnitureEdgeMm).nullable(),
    maxDepth: z.number().int().min(1).max(POLICY.furnitureEdgeMm).nullable(),
  }),
  find_arrangements: z.strictObject({}),
  prepare_edits: z.strictObject({
    actions: z.array(assistantEditSchema).min(1).max(POLICY.actions),
  }),
  explain_checks: z.strictObject({ issueId: issueSchema.shape.id.nullable() }),
  focus_item: z.strictObject({ id: idSchema }),
  request_measurement: z.strictObject({ id: idSchema, field: fieldSchema }),
  request_lock_change: z.strictObject({
    id: idSchema,
    lock: z.enum(['position', 'rotation']),
  }),
  request_undo: z.strictObject({}),
} as const;
export type AssistantTool = keyof typeof assistantToolSchemas;
export const assistantFinalSchema = z.strictObject({ kind: z.literal('done') });
export const assistantJsonSchema = (name: AssistantTool | 'final') =>
  z.toJSONSchema(
    name === 'final' ? assistantFinalSchema : assistantToolSchemas[name],
  );
