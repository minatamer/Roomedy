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
import { POLICY, PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import { beginResearch } from '../apps/frontend/src/features/cost/client.js';
import { buildSourcingBrief } from '../apps/frontend/src/features/cost/brief.js';

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
  it('keeps a single prompt beyond the old cutoff and ignores late success after cancellation', async () => {
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
    const waiting = verificationSnapshot()!;
    await vi.advanceTimersByTimeAsync(180_000);
    expect(verificationSnapshot()).toBe(waiting);
    waiting.finish('proof-after-wait');
    expect(await second).toBe('proof-after-wait');
    expect(verificationSnapshot()).toBeNull();
  });
  it.each(['research', 'recognition', 'assistant'] as const)(
    'gives %s its full request budget after a long verification wait, with one dispatch',
    async (kind) => {
      vi.useFakeTimers();
      const room = createRoomFixture('sample');
      const session = new SessionController(
        kind === 'recognition' ? undefined : room,
      );
      let settle: (() => void) | undefined;
      const send = vi.fn<typeof fetch>(async (url, init) => {
        if (String(url).endsWith('/config'))
          return Response.json({
            mode: 'live',
            capabilities: {
              manual: true,
              assistant: true,
              recognition: true,
              sourcing: true,
              simulation: false,
            },
            limits: PUBLIC_LIMITS,
          });
        const body = JSON.parse(String(init!.body)) as {
          input: OperationInput;
          proof?: string;
        };
        if (String(url).endsWith('/admission'))
          return Response.json(
            body.proof
              ? { ...granted, expiresAt: Date.now() + 120000 }
              : interaction,
          );
        return new Promise<Response>((resolve) => {
          settle = () =>
            resolve(
              Response.json({
                identity: body.input.identity,
                kind: 'completed',
                simulation: false,
                message: '',
                draft:
                  kind === 'recognition'
                    ? recognitionFixture(
                        'repeated-desk',
                        body.input.kind === 'recognize-room'
                          ? body.input.manifest.map((p) => p.id)
                          : [],
                      )
                    : null,
                ...(kind === 'assistant'
                  ? {
                      assistant: emptyAssistantReply(
                        room,
                        'Verified after waiting.',
                      ),
                    }
                  : {}),
                ...(kind === 'research'
                  ? { sourcing: { candidates: [], notes: [] } }
                  : {}),
              }),
            );
        });
      });
      let assistant: AssistantController | undefined;
      let review: ReviewController | undefined;
      let pending: Promise<unknown>;
      if (kind === 'research') {
        session.setDestination('cost', 'en-US');
        pending = beginResearch(
          session,
          buildSourcingBrief(room, 'desk_1')!,
          send,
        )!.result;
      } else if (kind === 'assistant') {
        assistant = new AssistantController(session, { transport: send });
        await vi.waitFor(() =>
          expect(assistant!.getSnapshot().mode).toBe('live'),
        );
        pending = assistant.submit('Where should the composition go next?');
      } else {
        let id = 0;
        review = new ReviewController(
          session,
          'partial',
          () => `item_${++id}`,
          {
            id: () => `photo_${++id}`,
            createUrl: () => 'blob:offline',
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
        review.addPhotos([new File(['raw'], 'synthetic.png')], 'auto');
        await vi.waitFor(() =>
          expect(review!.photos.getSnapshot()[0]?.status).toBe('ready'),
        );
        pending = draftFromPhotos(review, send);
      }
      await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
      const prompt = verificationSnapshot()!;
      await vi.advanceTimersByTimeAsync(180_000);
      expect(verificationSnapshot()).toBe(prompt);
      expect(settle).toBeUndefined();
      prompt.finish('proof');
      await vi.waitFor(() => expect(settle).toBeTypeOf('function'));
      await vi.advanceTimersByTimeAsync(90_000);
      if (kind === 'assistant')
        expect(assistant!.getSnapshot().busy).toBe(true);
      if (kind === 'research')
        expect(session.getSnapshot().pending).not.toBeNull();
      if (kind === 'recognition')
        expect(review!.getSnapshot().recognition).not.toBe('idle');
      settle!();
      const result = await pending;
      expect(verificationSnapshot()).toBeNull();
      expect(
        send.mock.calls.filter(([url]) => !String(url).endsWith('/config')),
      ).toHaveLength(3);
      if (kind === 'research') expect(result).toMatchObject({ ok: true });
      if (kind === 'assistant')
        expect(assistant!.getSnapshot().messages.at(-1)?.text).toBe(
          'Verified after waiting.',
        );
      if (kind === 'recognition')
        expect(review!.getSnapshot().stage).toBe('review');
      assistant?.dispose();
      session.dispose();
    },
  );
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
      'refresh-timeout': 'manual',
      'refresh-expired': 'manual',
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
  it.each(['cancel', 'phase', 'expiry'] as const)(
    'retires a long paused research verification after %s with no late dispatch',
    async (event) => {
      vi.useFakeTimers();
      let now = 0;
      const room = createRoomFixture('sample');
      const session = new SessionController(room, { now: () => now });
      session.setDestination('cost', 'en-US');
      const send = vi.fn<typeof fetch>(async (url) => {
        if (String(url).endsWith('/config'))
          return Response.json({
            mode: 'live',
            capabilities: {
              manual: true,
              recognition: true,
              assistant: true,
              sourcing: true,
              simulation: false,
            },
            limits: PUBLIC_LIMITS,
          });
        return Response.json(interaction);
      });
      const run = beginResearch(
        session,
        buildSourcingBrief(room, 'desk_1')!,
        send,
      )!;
      await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
      const prompt = verificationSnapshot()!;
      await vi.advanceTimersByTimeAsync(180_000);
      expect(verificationSnapshot()).toBe(prompt);
      if (event === 'cancel') run.cancel();
      else if (event === 'phase') session.setDestination('design');
      else {
        now = POLICY.guestLifetimeMs;
        session.checkExpiry();
      }
      expect(await run.result).toMatchObject({ ok: false, retired: true });
      expect(verificationSnapshot()).toBeNull();
      expect(session.getSnapshot().pending).toBeNull();
      prompt.finish('late-proof');
      expect(
        send.mock.calls.filter(([url]) => !String(url).endsWith('/config')),
      ).toHaveLength(1);
      session.dispose();
    },
  );
  it('still bounds an abort-ignoring research request after a long verification wait', async () => {
    vi.useFakeTimers();
    const room = createRoomFixture('sample'),
      session = new SessionController(room);
    session.setDestination('cost', 'en-US');
    const before = session.getSnapshot().cost!;
    let settle: (() => void) | undefined;
    const send = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url).endsWith('/config'))
        return Response.json({
          mode: 'live',
          capabilities: {
            manual: true,
            recognition: true,
            assistant: true,
            sourcing: true,
            simulation: false,
          },
          limits: PUBLIC_LIMITS,
        });
      const body = JSON.parse(String(init!.body)) as {
        proof?: string;
        input: OperationInput;
      };
      if (String(url).endsWith('/admission'))
        return Response.json(body.proof ? granted : interaction);
      return new Promise<Response>((resolve) => {
        settle = () =>
          resolve(
            Response.json({
              identity: body.input.identity,
              kind: 'completed',
              simulation: false,
              draft: null,
              message: 'late',
              sourcing: { candidates: [], notes: [] },
            }),
          );
      });
    });
    const run = beginResearch(
      session,
      buildSourcingBrief(room, 'desk_1')!,
      send,
    )!;
    await vi.waitFor(() => expect(verificationSnapshot()).not.toBeNull());
    await vi.advanceTimersByTimeAsync(180_000);
    verificationSnapshot()!.finish('proof');
    await vi.waitFor(() => expect(settle).toBeTypeOf('function'));
    await vi.advanceTimersByTimeAsync(POLICY.operationBridgeMs);
    expect(await run.result).toMatchObject({
      ok: false,
      message: 'Research took too long. Your current estimate is unchanged.',
    });
    expect(session.getSnapshot().pending).toBeNull();
    settle!();
    await Promise.resolve();
    expect(session.getSnapshot().cost!.settings).toBe(before.settings);
    expect(
      send.mock.calls.filter(([url]) => String(url).endsWith('/sourcing')),
    ).toHaveLength(1);
    session.dispose();
  });
  it.each([
    ['error-callback', 'challenge'],
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
  it.each(['expired-callback', 'timeout-callback'] as const)(
    'keeps the same pending request refreshable after %s',
    (callback) => {
      let options!: Parameters<Turnstile['render']>[1];
      const finish = vi.fn(),
        interact = vi.fn();
      const cleanup = mountVerification(
        {
          render: (_container, supplied) => {
            options = supplied;
            return 'owned';
          },
          remove: vi.fn(),
        },
        {} as HTMLElement,
        challenge,
        finish,
        interact,
      );
      options[callback]();
      expect(finish).not.toHaveBeenCalled();
      expect(interact).toHaveBeenCalledOnce();
      options.callback('fresh-proof');
      expect(finish).toHaveBeenCalledExactlyOnceWith('fresh-proof');
      cleanup();
      options.callback('late');
      expect(finish).toHaveBeenCalledTimes(1);
    },
  );
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
