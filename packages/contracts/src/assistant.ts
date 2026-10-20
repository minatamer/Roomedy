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
const categorySchema = z.enum([
  'bed',
  'desk',
  'chair',
  'wardrobe',
  'storage',
  'mirror',
  'tv',
  'seating',
  'table',
  'lighting',
]);
/** Interpretation has no edit coordinates or permissions. The application authors a clarification. */
export const designIntentSchema = z.strictObject({
  goal: z.enum([
    'open-space',
    'work-by-window',
    'palette',
    'piece-finish',
    'left',
    'right',
    'furnish',
    'explain',
    'clarify',
    'unsupported',
    'manual-control',
  ]),
  targetIds: z.array(idSchema).max(5),
  categories: z.array(categorySchema).max(5),
  finish: finishSchema.nullable(),
  palette: z.enum(['warm', 'light', 'calm']).nullable(),
  // A suggested request must be selected by the visitor and compiled again. It grants no execution authority.
  manualRequest: z
    .string()
    .trim()
    .min(1)
    .max(POLICY.visitorTextChars)
    .nullable()
    .optional(),
});
export type DesignIntent = z.infer<typeof designIntentSchema>;
export const designSuggestionSchema = z.strictObject({
  label: z.string().min(1).max(240),
  request: z.string().min(1).max(POLICY.visitorTextChars),
  selectedId: idSchema.nullable(),
  roomRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});
export type DesignSuggestion = z.infer<typeof designSuggestionSchema>;
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
  suggestions: z.array(designSuggestionSchema).max(3).optional(),
});
export type AssistantReply = z.infer<typeof assistantReplySchema>;
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
export const assistantFinalSchema = z.strictObject({
  kind: z.literal('done'),
  // Advice is displayed only on the no-tools, no-actions conversation path.
  message: z.string().trim().min(1).max(1200).nullable().optional(),
});
export const assistantJsonSchema = (
  name: AssistantTool | 'final' | 'interpretation',
) =>
  z.toJSONSchema(
    name === 'final'
      ? assistantFinalSchema
      : name === 'interpretation'
        ? designIntentSchema
        : assistantToolSchemas[name],
  );
