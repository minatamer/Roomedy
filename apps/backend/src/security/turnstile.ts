import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import type { ChallengePort } from './admission.js';

/** One attempt; token single-use/expiry is enforced by Cloudflare, input binding here. */
export function createTurnstileChallenge(
  secret: string,
  frontendOrigin: string,
  transport: typeof fetch = fetch,
): ChallengePort {
  const hostname = new URL(frontendOrigin).hostname;
  return {
    kind: 'live',
    async verify(proof, digest, signal) {
      if (signal.aborted || !secret) return 'failed';
      if (!proof) return 'interaction';
      if (proof.length > 2048 || !/^[a-f0-9]{64}$/.test(digest))
        return 'failed';
      const deadline = new AbortController();
      const timer = setTimeout(() => deadline.abort(), 6000);
      const combined = AbortSignal.any([signal, deadline.signal]);
      try {
        const response = await transport(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            redirect: 'error',
            signal: combined,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, response: proof }),
          },
        );
        if (!response.ok || !response.body) {
          await response.body?.cancel();
          return 'failed';
        }
        const reader = response.body.getReader();
        const packed = new BoundedBytes(8192, 128);
        let raw: unknown;
        try {
          while (true) {
            combined.throwIfAborted();
            const next = await reader.read();
            combined.throwIfAborted();
            if (next.done) break;
            packed.append(next.value);
          }
          raw = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
          );
        } finally {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
          return 'failed';
        const result = raw as Record<string, unknown>;
        return result.success === true &&
          result.hostname === hostname &&
          result.action === 'roomedy-ai' &&
          result.cdata === digest
          ? 'verified'
          : 'failed';
      } catch {
        return 'failed';
      } finally {
        clearTimeout(timer);
        deadline.abort();
      }
    },
  };
}
