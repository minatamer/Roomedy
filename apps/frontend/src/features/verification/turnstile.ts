import type { VerificationChallenge } from '@roomedy/contracts/operations';
import type { VerificationFailure } from './failure';

interface WidgetOptions {
  sitekey: string;
  action: 'roomedy-ai';
  cData: string;
  size: 'compact';
  theme: 'light';
  language: 'en';
  appearance: 'interaction-only';
  retry: 'never';
  'refresh-expired': 'never';
  'refresh-timeout': 'never';
  'response-field': false;
  callback(proof: string): void;
  'before-interactive-callback'(): void;
  'error-callback'(code?: string): boolean;
  'expired-callback'(): void;
  'timeout-callback'(): void;
  'unsupported-callback'(): void;
}
export interface Turnstile {
  render(container: HTMLElement, options: WidgetOptions): string;
  remove(id: string): void;
}

/** Keep late third-party callbacks fenced, including synchronous render failure/success. */
export function mountVerification(
  api: Turnstile,
  container: HTMLElement,
  challenge: VerificationChallenge,
  finish: (proof?: string, failure?: VerificationFailure) => void,
  interact: () => void,
) {
  let active = true;
  let widget: string | null = null;
  const complete = (proof?: string, failure?: VerificationFailure) => {
    if (!active) return;
    active = false;
    if (failure) finish(undefined, failure);
    else finish(proof);
  };
  try {
    widget = api.render(container, {
      sitekey: challenge.siteKey,
      action: challenge.action,
      cData: challenge.inputHash,
      size: 'compact',
      theme: 'light',
      language: 'en',
      appearance: 'interaction-only',
      retry: 'never',
      'refresh-expired': 'never',
      'refresh-timeout': 'never',
      'response-field': false,
      callback: complete,
      'before-interactive-callback': () => {
        if (active) interact();
      },
      'error-callback': (code) => {
        complete(
          undefined,
          code === '200500'
            ? 'script-load'
            : code === '110500'
              ? 'browser'
              : ['110100', '110110', '110200', '400020', '400070'].includes(
                    code ?? '',
                  )
                ? 'configuration'
                : 'challenge',
        );
        return true;
      },
      'expired-callback': () => complete(undefined, 'timeout'),
      'timeout-callback': () => complete(undefined, 'timeout'),
      'unsupported-callback': () => complete(undefined, 'browser'),
    });
  } catch {
    complete(undefined, 'challenge');
  }
  return () => {
    active = false;
    if (widget === null) return;
    const owned = widget;
    widget = null;
    try {
      api.remove(owned);
    } catch {
      /* Provider cleanup cannot prevent local retirement. */
    }
  };
}
