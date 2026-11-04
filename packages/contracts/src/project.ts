import { z } from 'zod';
import { POLICY, VERSIONS } from './policy.js';
import { roomDocumentSchema } from './room.js';
import { idSchema, labelSchema } from './primitives.js';
import { assistantReplySchema, designSuggestionSchema } from './assistant.js';
import { bedroomThemeIdSchema } from './furniture-materials.js';
import { sourcingBriefSchema, sourcingReplySchema } from './sourcing.js';
import {
  CALCULATION_VERSION,
  estimateStateSchema,
  roomEstimateSchema,
} from './estimates.js';

const legacyProjectSchema = z
  .strictObject({
    format: z.literal('roomedy-project'),
    version: z.literal(1),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    current: roomDocumentSchema,
    baseline: roomDocumentSchema,
  })
  .refine(
    (p) => p.current.roomId === p.baseline.roomId,
    'Baseline must belong to this room',
  );

export const ESTIMATE_VERSION_LIMIT = 4;
export const estimateVersionSchema = z
  .strictObject({
    id: idSchema,
    label: z.string().trim().min(1).max(80),
    savedAt: z.number().int().min(0).max(8_640_000_000_000_000),
    approval: z.literal('consumer-planning'),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    representationVersion: z.literal('roomedy-cpq-1'),
    calculationVersion: z.literal(CALCULATION_VERSION),
    room: roomDocumentSchema,
    pricing: estimateStateSchema,
    estimate: roomEstimateSchema,
  })
  .refine(
    (v) =>
      v.room.roomId === v.pricing.settings.roomId &&
      v.room.roomId === v.estimate.roomId &&
      v.room.roomRevision === v.estimate.roomRevision,
    'Snapshot identity must match',
  );
const currentProjectSchema = z
  .strictObject({
    format: z.literal('roomedy-project'),
    version: z.literal(2),
    catalogueVersion: z.literal(VERSIONS.catalogue),
    rulesVersion: z.literal(VERSIONS.rules),
    current: roomDocumentSchema,
    baseline: roomDocumentSchema,
    cost: estimateStateSchema.nullable(),
    versions: z.array(estimateVersionSchema).max(ESTIMATE_VERSION_LIMIT),
  })
  .refine(
    (p) =>
      p.current.roomId === p.baseline.roomId &&
      (!p.cost || p.cost.settings.roomId === p.current.roomId) &&
      p.versions.every((v) => v.room.roomId === p.current.roomId) &&
      new Set(p.versions.map((v) => v.id)).size === p.versions.length,
    'Project rooms and unique version identities must match',
  );
/** Explicit migration: old closed room files acquire no inferred prices or approvals. */
export const projectSchema = z
  .union([legacyProjectSchema, currentProjectSchema])
  .transform((p) =>
    p.version === 1
      ? { ...p, version: 2 as const, cost: null, versions: [] }
      : p,
  );

const revision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const messageId = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER - 1);
const withinTextBytes = (text: string, maximum: number) => {
  let bytes = 0;
  for (const character of text) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > maximum) return false;
  }
  return true;
};
const withinBytes = (value: unknown, maximum: number) =>
  withinTextBytes(JSON.stringify(value), maximum);
export const recoveryMedySchema = z.strictObject({
  roomRevision: revision,
  draft: z.string().max(POLICY.visitorTextChars),
  tourSeen: z.boolean(),
  themeId: bedroomThemeIdSchema.nullable(),
  messages: z
    .array(
      z.strictObject({
        id: messageId,
        role: z.enum(['user', 'assistant']),
        text: z.string().max(6000),
        reply: assistantReplySchema
          .refine(
            (reply) => reply.actions === null,
            'History has no executable actions',
          )
          .nullable(),
        simulation: z.boolean(),
        quickReplies: z.array(designSuggestionSchema).max(3),
      }),
    )
    .max(POLICY.contextTurns * 2)
    .refine(
      (messages) => withinBytes(messages, POLICY.contextBytes * 4),
      'Conversation byte limit',
    )
    .refine(
      (messages) =>
        new Set(messages.map((message) => message.id)).size === messages.length,
      'Unique message identities',
    ),
});
export const recoveryCostMessageSchema = z.strictObject({
  id: messageId,
  kind: z.enum(['breakdown', 'find-options', 'selection-summary']).optional(),
  lineIds: z.array(idSchema).max(4).optional(),
  roomRevision: revision,
  costRevision: revision,
  role: z.enum(['visitor', 'assistant']),
  text: z.string().trim().min(1).max(4000),
  historical: z.literal(true).optional(),
});
export const recoveryMarketTargetSchema = z.strictObject({
  key: z.string().min(1).max(160),
  group: z.enum(['Furniture', 'Flooring', 'Wall paint', 'Services']),
  label: labelSchema,
  brief: sourcingBriefSchema,
  matchingWalls: z.boolean(),
});
export const recoveryCostUISchema = z.strictObject({
  roomRevision: revision,
  costRevision: revision,
  viewingId: idSchema.nullable(),
  section: z.enum(['welcome', 'furniture', 'floor', 'walls', 'review']),
  selected: z.string().max(160).nullable(),
  input: z.string().max(POLICY.visitorTextChars),
  budget: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
  work: z.boolean(),
  researchAfter: messageId.nullable(),
  entries: z
    .array(
      z.strictObject({
        target: recoveryMarketTargetSchema,
        current: z.boolean(),
        result: z.discriminatedUnion('ok', [
          z.strictObject({
            ok: z.literal(true),
            reply: sourcingReplySchema,
            simulation: z.boolean(),
          }),
          z.strictObject({
            ok: z.literal(false),
            message: z.string().max(6000),
          }),
        ]),
      }),
    )
    .max(POLICY.furniture + 5),
  remaining: z.array(recoveryMarketTargetSchema).max(POLICY.furniture + 5),
  message: z.string().max(4000),
  guide: z.strictObject({
    stage: z.enum(['ready', 'choosing', 'done']),
    key: z.string().max(160).nullable(),
    reviewedKeys: z.array(z.string().max(160)).max(64).optional(),
    passId: messageId.optional(),
  }),
});
export const recoveryEstimateSchema = z.strictObject({
  roomRevision: revision,
  revision,
  messages: z
    .array(recoveryCostMessageSchema)
    .max(40)
    .refine(
      (messages) =>
        withinTextBytes(
          messages.map((message) => message.text).join(''),
          131072,
        ),
      'Conversation byte limit',
    )
    .refine(
      (messages) =>
        new Set(messages.map((message) => message.id)).size === messages.length,
      'Unique message identities',
    ),
  ui: recoveryCostUISchema.optional(),
});
export const recoveryConversationsSchema = z.strictObject({
  medy: recoveryMedySchema.optional(),
  estimate: recoveryEstimateSchema.optional(),
});

export const recoverySchema = z
  .strictObject({
    createdAt: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - POLICY.guestLifetimeMs),
    expiresAt: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    project: projectSchema,
    conversations: recoveryConversationsSchema.optional(),
    ui: z.strictObject({
      view: z.enum(['2d', '3d']),
      destination: z.enum(['design', 'cost']).default('design'),
    }),
  })
  .refine(
    (v) => v.expiresAt === v.createdAt + POLICY.guestLifetimeMs,
    'Lifetime is fixed',
  )
  .refine(
    (v) =>
      !v.conversations?.estimate ||
      (!!v.project.cost &&
        v.conversations.estimate.roomRevision ===
          v.project.current.roomRevision),
    'Estimate conversation belongs to the saved room and pricing',
  );

export type Project = z.infer<typeof projectSchema>;
export type Recovery = z.infer<typeof recoverySchema>;
export type EstimateVersion = z.infer<typeof estimateVersionSchema>;
export type RecoveryConversations = z.infer<typeof recoveryConversationsSchema>;
export type RecoveryMedy = z.infer<typeof recoveryMedySchema>;
export type RecoveryEstimate = z.infer<typeof recoveryEstimateSchema>;
export type RecoveryCostUI = z.infer<typeof recoveryCostUISchema>;
