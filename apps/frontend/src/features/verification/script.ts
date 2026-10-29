import type { VerificationFailure } from './failure';

const scriptUrl =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** One load per deliberate attempt. Failed loads never poison the next attempt. */
export function loadVerificationScript(
  document: Document,
  apiReady: () => boolean,
  ready: () => void,
  failed: (reason: VerificationFailure) => void,
) {
  let active = true;
  let settled = false;
  let script: HTMLScriptElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const detach = () => {
    clearTimeout(timer);
    script?.removeEventListener('load', loaded);
    script?.removeEventListener('error', error);
  };
  const finish = (reason?: VerificationFailure) => {
    if (!active || settled) return;
    settled = true;
    detach();
    if (reason) {
      script?.remove();
      failed(reason);
    } else ready();
  };
  const loaded = () => finish(apiReady() ? undefined : 'script-load');
  const error = () => finish('script-load');
  // Effect replay can retire the first owner before it starts any network work.
  queueMicrotask(() => {
    if (!active) return;
    if (apiReady()) {
      finish();
      return;
    }
    try {
      script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.addEventListener('load', loaded);
      script.addEventListener('error', error);
      timer = setTimeout(() => finish('script-timeout'), 12_000);
      document.head.appendChild(script);
    } catch {
      finish('script-load');
    }
  });
  return () => {
    active = false;
    detach();
    if (!settled) script?.remove();
  };
}
