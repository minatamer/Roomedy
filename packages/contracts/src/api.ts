import { z } from 'zod';
import { PUBLIC_LIMITS } from './policy.js';
import { idSchema } from './primitives.js';

export const errorCodeSchema = z.enum([
  'invalid-input',
  'not-available',
  'not-found',
  'upstream-unavailable',
  'internal-error',
  'busy',
  'invalid-grant',
  'body-limit',
  'timeout',
  'cancelled',
  'forbidden',
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
    sourcing: z.boolean().optional(),
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
    'fake-ready',
    'disabled',
    'missing-configuration',
    'pending-admission',
    'pending-integration',
    'missing-verification',
    'live-ready',
  ]),
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type SafeError = z.infer<typeof safeErrorSchema>;

export const errorMessages = {
  'invalid-input': 'Check the information and try again.',
  'not-available':
    'This action is not available yet. You can keep working manually.',
  'not-found': 'This action could not be found.',
  'upstream-unavailable':
    'The service is unavailable. Please try again shortly.',
  'internal-error': 'Something went wrong. Your room has not been changed.',
  busy: 'The service is busy. Please try again shortly.',
  'invalid-grant':
    'This request permission expired or changed. Please try again.',
  'body-limit': 'This request is too large. Try fewer or smaller photos.',
  timeout: 'This request took too long. Your room has not been changed.',
  cancelled: 'The request was cancelled. Your room has not been changed.',
  forbidden: 'This request could not be verified. Please reopen the app.',
} as const;
