import { z } from 'zod';
import { PUBLIC_LIMITS } from './policy.js';
import { idSchema } from './primitives.js';

export const errorCodeSchema = z.enum([
  'invalid-input',
  'not-available',
  'not-found',
  'upstream-unavailable',
  'internal-error',
]);
export const safeErrorSchema = z.strictObject({
  error: z.strictObject({
    code: errorCodeSchema,
    message: z.string().max(180),
    reference: idSchema,
    retryable: z.boolean(),
  }),
});
export const healthSchema = z.strictObject({ status: z.literal('ok') });
export const publicConfigSchema = z.strictObject({
  mode: z.enum(['fake', 'live']),
  capabilities: z.strictObject({
    manual: z.literal(true),
    recognition: z.boolean(),
    assistant: z.boolean(),
    simulation: z.boolean(),
  }),
  limits: z.strictObject({
    photos: z.literal(PUBLIC_LIMITS.photos),
    rawPhotoBytes: z.literal(PUBLIC_LIMITS.rawPhotoBytes),
    rawTotalBytes: z.literal(PUBLIC_LIMITS.rawTotalBytes),
    furniture: z.literal(PUBLIC_LIMITS.furniture),
    features: z.literal(PUBLIC_LIMITS.features),
    actions: z.literal(PUBLIC_LIMITS.actions),
    visitorTextChars: z.literal(PUBLIC_LIMITS.visitorTextChars),
    projectBytes: z.literal(PUBLIC_LIMITS.projectBytes),
    guestLifetimeMs: z.literal(PUBLIC_LIMITS.guestLifetimeMs),
  }),
});
export const readySchema = z.strictObject({
  status: z.literal('ok'),
  ai: z.enum([
    'fake-pending-integration',
    'disabled',
    'missing-configuration',
    'pending-admission',
  ]),
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type SafeError = z.infer<typeof safeErrorSchema>;
