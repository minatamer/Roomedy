import { afterEach, describe, expect, it, vi } from 'vitest';
import { obtainAdmission } from '../apps/frontend/src/features/session/admission-client.js';
import { mountVerification } from '../apps/frontend/src/features/verification/turnstile.js';
import type { Turnstile } from '../apps/frontend/src/features/verification/turnstile.js';
import {
  requestVerification,
  verificationSnapshot,
} from '../apps/frontend/src/features/verification/state.js';
import { askAssistant } from '../apps/frontend/src/features/assistant/client.js';
import { operationInput, recognitionInput } from './fixtures/operation.js';
import { emptyAssistantReply } from '@roomedy/spatial';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import { draftFromPhotos } from '../apps/frontend/src/features/room-intake/recognition-client.js';
import { recognitionFixture } from '../apps/backend/src/recognition/fixtures.js';
import type { OperationInput } from '@roomedy/contracts/operations';
import { verificationFailureMessage } from '../apps/frontend/src/features/verification/failure.js';

const challenge = {
  siteKey: 'synthetic-site',
  action: 'roomedy-ai' as const,
  inputHash: 'a'.repeat(64),
};
const interaction = {
  kind: 'verification',
  state: 'interaction',
  simulation: false,
  challenge,
};
const granted = {
  kind: 'granted',
  grant: 'synthetic-grant',
  expiresAt: 120000,
  simulation: false,
};
afterEach(() => {
  verificationSnapshot()?.finish();
  vi.useRealTimers();
});

describe('shared browser verification ownership', () => {
  it.each(['success', 'script-load', 'browser', 'configuration'] as const)(
    'preserves the prepared photo client through %s verification',
    async (outcome) => {
      const session = new SessionController();
      let id = 0;
      const review = new ReviewController(
        session,
        'partial',
        () => `item_${++id}`,
        {
          id: () => `photo_${++id}`,
          createUrl: () => `blob:synthetic_${id}`,
          revokeUrl: vi.fn(),
          prepare: async () => ({
            normalized: new Blob(['normalized'], { type: 'image/jpeg' }),
            preview: new Blob(['preview']),
            type: 'image/png',
            inputWidth: 10,
            inputHeight: 10,
            width: 10,
            height: 10,
            decodeMs: 1,
            prepareMs: 1,
          }),
        },
      );
      try {
        review.addPhotos([new File(['raw'], 'private.png')], 'auto');
        await vi.waitFor(() =>
          expect(review.photos.getSnapshot()[0]?.status).toBe('ready'),
        );
        const send = vi.fn<typeof fetch>(async (url, init) => {
          const body = JSON.parse(init!.body as string) as {
            input: OperationInput;
            proof?: string;
          };
          if (String(url).endsWith('/admission'))
            return Response.json(body.proof ? granted : interaction);
          return Response.json({
            identity: body.input.identity,
            kind: 'completed',
            simulation: false,
            message: '',
            draft: recognitionFixture(
              'repeated-desk',
              body.input.kind === 'recognize-room'
                ? body.input.manifest.map((p) => p.id)
                : [],
            ),
          });
        });
        const pending = draftFromPhotos(review, send);
        await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
        expect(review.getSnapshot().photos).toHaveLength(1);
        if (outcome === 'success') verificationSnapshot()!.finish('proof');
        else verificationSnapshot()!.finish(undefined, outcome);
        await pending;
        if (outcome !== 'success') {
          expect(send).toHaveBeenCalledTimes(1);
          expect(review.getSnapshot()).toMatchObject({
            stage: 'photos',
            recognition: 'idle',
          });
          expect(review.getSnapshot().photos).toHaveLength(1);
          expect(review.getSnapshot().message).toContain(
            'Your photos are still here.',
          );
          expect(review.getSnapshot().message).not.toContain(
            'Continue manually',
          );
          return;
        }
        expect(send).toHaveBeenCalledTimes(3);
        expect(review.getSnapshot()).toMatchObject({
          stage: 'review',
          simulated: false,
          recognition: 'idle',
        });
        expect(review.getSnapshot().draft.room.furniture).toHaveLength(1);
      } finally {
        session.dispose();
      }
    },
  );
  it.each(['assistant', 'recognition'])(
    'obtains one proof for the exact %s input and preserves granted fake paths',
    async (kind) => {
      const input =
        kind === 'assistant' ? operationInput() : await recognitionInput();
      const post = vi.fn(async ({ proof }: { proof: string | null }) =>
        proof ? granted : interaction,
      );
      const verify = vi.fn(async () => 'proof');
      expect(
        await obtainAdmission(
          input,
          new AbortController().signal,
          post,
          verify,
        ),
      ).toEqual(granted);
      expect(verify).toHaveBeenCalledWith(challenge, expect.any(AbortSignal));
      expect(post).toHaveBeenCalledTimes(2);
      expect(post.mock.calls[0]![0]).toEqual({ input, proof: null });
      expect(post.mock.calls[1]![0]).toEqual({ input, proof: 'proof' });
      const fake = vi.fn(async () => ({ ...granted, simulation: true }));
      await obtainAdmission(input, new AbortController().signal, fake, verify);
      expect(fake).toHaveBeenCalledTimes(1);
      expect(verify).toHaveBeenCalledTimes(1);
    },
  );
  it('does not retry cancellation, vendor failure or a second challenge', async () => {
    const post = vi.fn(async () => interaction);
    expect(
      await obtainAdmission(
        operationInput(),
        new AbortController().signal,
        post,
        async () => null,
      ),
    ).toMatchObject({ state: 'failed' });
    expect(post).toHaveBeenCalledTimes(1);
    await obtainAdmission(
      operationInput(),
      new AbortController().signal,
      post,
      async () => 'proof',
    );
    expect(post).toHaveBeenCalledTimes(3);
    const abort = new AbortController();
    await expect(
      obtainAdmission(operationInput(), abort.signal, post, async () => {
        abort.abort();
        return 'late';
      }),
    ).rejects.toThrow();
    expect(post).toHaveBeenCalledTimes(4);
  });
  it('owns a single finite prompt and ignores late success after cancellation/timeout', async () => {
    vi.useFakeTimers();
    const abort = new AbortController();
    const first = requestVerification(challenge, abort.signal);
    const owned = verificationSnapshot()!;
    expect(
      await requestVerification(challenge, new AbortController().signal),
    ).toBeNull();
    abort.abort();
    expect(await first).toBeNull();
    owned.finish('late');
    expect(verificationSnapshot()).toBeNull();
    const second = requestVerification(challenge, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await second).toBeNull();
    expect(verificationSnapshot()).toBeNull();
  });
  it('uses compact/light/quiet presentation with manual-only retries and fences all widget callbacks', () => {
    let options!: Parameters<Turnstile['render']>[1];
    const api = {
      render: vi.fn((_container: HTMLElement, supplied: typeof options) => {
        options = supplied;
        return 'owned-widget';
      }),
      remove: vi.fn(),
    };
    const finish = vi.fn(),
      interact = vi.fn();
    const cleanup = mountVerification(
      api,
      {} as HTMLElement,
      challenge,
      finish,
      interact,
    );
    expect(options).toMatchObject({
      sitekey: challenge.siteKey,
      cData: challenge.inputHash,
      size: 'compact',
      theme: 'light',
      appearance: 'interaction-only',
      retry: 'never',
      'refresh-timeout': 'never',
      'refresh-expired': 'never',
      'response-field': false,
    });
    expect(interact).not.toHaveBeenCalled();
    options['before-interactive-callback']();
    expect(interact).toHaveBeenCalledTimes(1);
    options.callback('proof');
    options['error-callback']();
    cleanup();
    cleanup();
    options.callback('late');
    options['before-interactive-callback']();
    expect(finish).toHaveBeenCalledExactlyOnceWith('proof');
    expect(interact).toHaveBeenCalledTimes(1);
    expect(api.remove).toHaveBeenCalledExactlyOnceWith('owned-widget');
  });
  it.each([
    ['error-callback', 'challenge'],
    ['expired-callback', 'timeout'],
    ['timeout-callback', 'timeout'],
    ['unsupported-callback', 'browser'],
  ] as const)('settles %s safely once', (callback, reason) => {
    let options!: Parameters<Turnstile['render']>[1];
    const finish = vi.fn();
    const cleanup = mountVerification(
      {
        render: (_container, supplied) => {
          options = supplied;
          return 'owned';
        },
        remove: () => undefined,
      },
      {} as HTMLElement,
      challenge,
      finish,
      vi.fn(),
    );
    options[callback]();
    options.callback('late');
    cleanup();
    expect(finish).toHaveBeenCalledExactlyOnceWith(undefined, reason);
  });
  it.each([
    ['200500', 'script-load'],
    ['110500', 'browser'],
    ['110200', 'configuration'],
    ['400020', 'configuration'],
    ['PRIVATE error or token', 'challenge'],
  ] as const)('classifies %s without exposing vendor data', (code, reason) => {
    let options!: Parameters<Turnstile['render']>[1];
    const finish = vi.fn();
    const cleanup = mountVerification(
      {
        render: (_element, supplied) => {
          options = supplied;
          return 'owned';
        },
        remove: vi.fn(),
      },
      {} as HTMLElement,
      challenge,
      finish,
      vi.fn(),
    );
    options['error-callback'](code);
    expect(finish).toHaveBeenCalledExactlyOnceWith(undefined, reason);
    cleanup();
  });
  it('returns bounded actionable failure copy without another admission or trusting arbitrary messages', async () => {
    const post = vi.fn(async () => interaction);
    const pending = obtainAdmission(
      operationInput(),
      new AbortController().signal,
      post,
    );
    await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
    verificationSnapshot()!.finish(undefined, 'script-load');
    const result = await pending;
    expect(post).toHaveBeenCalledTimes(1);
    expect(verificationFailureMessage(result)).toContain(
      'Allow challenges.cloudflare.com',
    );
    expect(
      verificationFailureMessage({
        kind: 'verification',
        state: 'failed',
        reason: 'PRIVATE',
        message: 'PRIVATE',
      }),
    ).toBeNull();
    expect(
      verificationFailureMessage({
        kind: 'verification',
        state: 'failed',
        reason: 'constructor',
      }),
    ).toBeNull();
  });
  it('runs actual Medy client through verification and preserves source-controlled failures', async () => {
    const input = operationInput();
    const send = vi.fn<typeof fetch>(async (url, init) => {
      const body = JSON.parse(init!.body as string) as { proof?: string };
      if (String(url).endsWith('/admission'))
        return Response.json(body.proof ? granted : interaction);
      return Response.json({
        identity: input.identity,
        kind: 'completed',
        simulation: false,
        draft: null,
        message: '',
        assistant: emptyAssistantReply(input.room, 'Synthetic reply'),
      });
    });
    const result = askAssistant(input, new AbortController().signal, send);
    await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
    verificationSnapshot()!.finish('proof');
    expect(await result).toMatchObject({ ok: true, simulation: false });
    expect(send).toHaveBeenCalledTimes(3);
    const failure = await askAssistant(
      input,
      new AbortController().signal,
      async () =>
        Response.json({
          error: {
            code: 'busy',
            message: 'PRIVATE',
            reference: 'ref',
            retryable: true,
          },
        }),
    );
    expect(failure).toEqual({
      ok: false,
      message: 'The service is busy. Please try again shortly.',
    });
  });
});
