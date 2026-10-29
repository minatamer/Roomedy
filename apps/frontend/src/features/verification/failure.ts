const messages = {
  'script-load':
    'Verification could not load. Allow challenges.cloudflare.com in your browser or content blocker, then try again.',
  'script-timeout':
    'Verification took too long to load. Check your connection and allow challenges.cloudflare.com, then try again.',
  browser:
    'This browser could not complete verification. Update it or try another browser.',
  configuration:
    'Verification is not available for this address. Open the original app link and try again.',
  challenge: 'Verification did not complete. Please try again.',
  timeout: 'Verification expired. Please try again.',
} as const;

export type VerificationFailure = keyof typeof messages;

export class VerificationFailureError extends Error {
  constructor(readonly reason: VerificationFailure) {
    super(messages[reason]);
  }
}

/** Only fixed local categories may become visitor copy; never vendor text or tokens. */
export function verificationFailureMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const failed = value as Record<string, unknown>;
  if (
    failed.kind !== 'verification' ||
    failed.state !== 'failed' ||
    typeof failed.reason !== 'string' ||
    !Object.hasOwn(messages, failed.reason)
  )
    return null;
  return messages[failed.reason as VerificationFailure];
}
