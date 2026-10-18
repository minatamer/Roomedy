import { z } from 'zod';
import { operationIdentitySchema } from './commands.js';
import { photoManifestSchema, draftHypothesisSchema } from './intake.js';
import { roomDocumentSchema } from './room.js';
import { idSchema } from './primitives.js';
import { POLICY, VERSIONS } from './policy.js';

const versions = {
  schemaVersion: z.literal(VERSIONS.schema),
  catalogueVersion: z.literal(VERSIONS.catalogue),
  rulesVersion: z.literal(VERSIONS.rules),
};

export const operationKindSchema = z.enum(['recognize-room', 'assistant']);
export const recognitionInputSchema = z.strictObject({
  ...versions,
  kind: z.literal('recognize-room'),
  identity: operationIdentitySchema,
  manifest: photoManifestSchema,
  images: z
    .array(
      z.strictObject({
        id: idSchema,
        data: z
          .string()
          .min(4)
          .max(Math.ceil(POLICY.normalizedPhotoBytes / 3) * 4),
      }),
    )
    .min(1)
    .max(POLICY.photos),
});
export const assistantInputSchema = z.strictObject({
  ...versions,
  kind: z.literal('assistant'),
  identity: operationIdentitySchema,
  room: roomDocumentSchema,
  text: z.string().trim().min(1).max(POLICY.visitorTextChars),
  context: z
    .array(
      z.strictObject({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(POLICY.visitorTextChars),
      }),
    )
    .max(POLICY.contextTurns),
});
export const operationInputSchema = z.discriminatedUnion('kind', [
  recognitionInputSchema,
  assistantInputSchema,
]);
export const admissionInputSchema = z.strictObject({
  input: operationInputSchema,
  proof: z.string().min(1).max(4096).nullable(),
});
export const operationRequestSchema = z.strictObject({
  input: operationInputSchema,
  grant: idSchema,
});
export const admissionResultSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('granted'),
    grant: idSchema,
    expiresAt: z.number().int().min(0),
    simulation: z.boolean(),
  }),
  z.strictObject({
    kind: z.literal('verification'),
    state: z.enum(['interaction', 'unavailable', 'failed']),
    simulation: z.boolean(),
  }),
]);
export const operationResultSchema = z.strictObject({
  identity: operationIdentitySchema,
  kind: z.enum([
    'completed',
    'refused',
    'incomplete',
    'malformed',
    'cancelled',
    'timeout',
    'too-large',
    'unavailable',
    'failed',
  ]),
  simulation: z.boolean(),
  message: z.string().max(6000),
  draft: draftHypothesisSchema.nullable(),
});
export type OperationInput = z.infer<typeof operationInputSchema>;
export type OperationKind = OperationInput['kind'];
export type OperationResult = z.infer<typeof operationResultSchema>;
export type AdmissionResult = z.infer<typeof admissionResultSchema>;
