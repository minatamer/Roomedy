import { describe, it, expect, vi } from 'vitest';
import { createTurnstileChallenge } from '../apps/backend/src/security/turnstile.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import { inputDigest } from '../apps/backend/src/security/admission.js';
import {
  operationInput,
  operationResult,
  identityIds,
} from './fixtures/operation.js';

const digest = 'a'.repeat(64);
const valid = {
  success: true,
  hostname: '127.0.0.1',
  action: 'roomedy-ai',
  cdata: digest,
};
const signal = () => new AbortController().signal;

describe('bounded live Turnstile validation with injected transport only', () => {
  it('requests interaction without network and verifies one exact-host/action/input proof', async () => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(valid));
    const verifier = createTurnstileChallenge(
      'private-synthetic',
      'http://127.0.0.1:4320',
      transport,
    );
    expect(await verifier.verify(null, digest, signal())).toBe('interaction');
    expect(transport).not.toHaveBeenCalled();
    expect(await verifier.verify('opaque-proof', digest, signal())).toBe(
      'verified',
    );
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, init] = transport.mock.calls[0]!;
    expect(url).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    );
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' });
    expect(JSON.parse(init!.body as string)).toEqual({
      secret: 'private-synthetic',
      response: 'opaque-proof',
    });
  });
  it.each([
    { ...valid, success: false, 'error-codes': ['timeout-or-duplicate'] },
    { ...valid, hostname: 'other.example' },
    { ...valid, action: 'other-action' },
    { ...valid, cdata: 'b'.repeat(64) },
    { success: true },
    { success: 'true' },
  ])(
    'rejects wrong context, expiry/replay and malformed vendor output',
    async (body) => {
      const send = vi.fn<typeof fetch>(async () => Response.json(body));
      const verifier = createTurnstileChallenge(
        'synthetic',
        'http://127.0.0.1:4320',
        send,
      );
      expect(await verifier.verify('proof', digest, signal())).toBe('failed');
      expect(send).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects oversized responses/tokens, bad status, invalid JSON and pre-cancellation without retries', async () => {
    for (const response of [
      new Response('x'.repeat(8193)),
      new Response('invalid'),
      new Response('private', { status: 503 }),
    ]) {
      const send = vi.fn<typeof fetch>(async () => response);
      expect(
        await createTurnstileChallenge(
          'synthetic',
          'http://127.0.0.1:4320',
          send,
        ).verify('proof', digest, signal()),
      ).toBe('failed');
      expect(send).toHaveBeenCalledTimes(1);
      expect(response.body?.locked).toBe(false);
    }
    const send = vi.fn<typeof fetch>();
    const verifier = createTurnstileChallenge(
      'synthetic',
      'http://127.0.0.1:4320',
      send,
    );
    expect(await verifier.verify('x'.repeat(2049), digest, signal())).toBe(
      'failed',
    );
    expect(await verifier.verify('proof', digest, AbortSignal.abort())).toBe(
      'failed',
    );
    expect(send).not.toHaveBeenCalled();
  });
  it('aborts its single vendor attempt after six seconds', async () => {
    vi.useFakeTimers();
    try {
      const send = vi.fn<typeof fetch>(
        async (_url, init) =>
          new Promise((_resolve, reject) => {
            init!.signal!.addEventListener(
              'abort',
              () => reject(new Error('synthetic-abort')),
              { once: true },
            );
          }),
      );
      const pending = createTurnstileChallenge(
        'synthetic',
        'http://127.0.0.1:4320',
        send,
      ).verify('proof', digest, signal());
      await vi.advanceTimersByTimeAsync(6000);
      expect(await pending).toBe('failed');
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
  it('connects real admission to exact input validation, then one replay-protected grant', async () => {
    const input = operationInput();
    const send = vi.fn<typeof fetch>(async () =>
      Response.json({ ...valid, cdata: inputDigest(input) }),
    );
    const runtime = createRuntime(
      parseRuntimeConfig({
        FAKE_MODE: 'false',
        PAID_DEMO_ENABLED: 'true',
        OPENAI_API_KEY: 'synthetic',
        TURNSTILE_SITE_KEY: 'synthetic-site',
        ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge',
      }),
      {
        now: Date.now,
        nextId: identityIds(),
        log: vi.fn(),
        provider: { ...createFakeProvider(), kind: 'live' },
        challenge: createTurnstileChallenge(
          'synthetic-private',
          'http://127.0.0.1:4320',
          send,
        ),
        handlers: {
          assistant: async (request) => ({
            ...operationResult(request),
            simulation: false,
          }),
          'recognize-room': async (request) => ({
            ...operationResult(request),
            simulation: false,
          }),
        },
      },
    );
    try {
      expect(runtime.readiness.ai).toBe('live-ready');
      const first = await runtime.operations.grant(input, null, signal());
      expect(first).toMatchObject({
        kind: 'verification',
        simulation: false,
        challenge: { siteKey: 'synthetic-site', inputHash: inputDigest(input) },
      });
      expect(JSON.stringify(first)).not.toContain('synthetic-private');
      expect(send).not.toHaveBeenCalled();
      const changed = { ...input, text: 'different semantics' };
      expect(
        await runtime.operations.grant(changed, 'proof', signal()),
      ).toMatchObject({ state: 'failed' });
      const issued = await runtime.operations.grant(input, 'proof', signal());
      if (!('grant' in issued)) throw new Error('synthetic-grant');
      expect(
        await runtime.operations.run(changed, issued.grant, signal()),
      ).toMatchObject({ error: { code: 'invalid-grant' } });
      expect(
        await runtime.operations.run(input, issued.grant, signal()),
      ).toMatchObject({ kind: 'completed', simulation: false });
      expect(
        await runtime.operations.run(input, issued.grant, signal()),
      ).toMatchObject({ error: { code: 'invalid-grant' } });
    } finally {
      runtime.operations.close();
    }
  });
});
