import type { SafeError } from '@roomedy/contracts/api';
import { idSchema } from '@roomedy/contracts/primitives';

const messages = {
  'invalid-input': 'Check the information and try again.',
  'not-available':
    'This action is not available yet. You can keep working manually.',
  'not-found': 'This action could not be found.',
  'upstream-unavailable':
    'The service is unavailable. Please try again shortly.',
  'internal-error': 'Something went wrong. Your room has not been changed.',
} as const;

export function safeError(
  code: SafeError['error']['code'],
  reference: string,
): SafeError {
  return {
    error: {
      code,
      message: messages[code],
      reference: idSchema.safeParse(reference).success
        ? reference
        : 'request-unknown',
      retryable: code === 'upstream-unavailable',
    },
  };
}
