import { errorMessages } from '@roomedy/contracts/api';
import type { SafeError } from '@roomedy/contracts/api';
import { idSchema } from '@roomedy/contracts/primitives';

export function safeError(
  code: SafeError['error']['code'],
  reference: string,
): SafeError {
  return {
    error: {
      code,
      message: errorMessages[code],
      reference: idSchema.safeParse(reference).success
        ? reference
        : 'request-unknown',
      retryable: [
        'upstream-unavailable',
        'busy',
        'timeout',
        'invalid-grant',
      ].includes(code),
    },
  };
}
