import { it, expect, vi } from 'vitest';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import { draftFromPhotos } from '../apps/frontend/src/features/room-intake/recognition-client.js';
import { recognitionFixture } from '../apps/backend/src/recognition/fixtures.js';
import type { OperationInput } from '@roomedy/contracts/operations';
import { errorMessages } from '@roomedy/contracts/api';
async function setup() {
  let id = 0,
    photo = 0,
    now = 0;
  const revoked = vi.fn(),
    session = new SessionController(undefined, { now: () => now });
  const review = new ReviewController(
    session,
    'partial',
    () => `item_${++id}`,
    {
      id: () => `photo_${++photo}`,
      createUrl: () => `blob:photo-${photo}`,
      revokeUrl: revoked,
      prepare: async () => ({
        normalized: new Blob(['normalized'], { type: 'image/jpeg' }),
        preview: new Blob(['preview'], { type: 'image/jpeg' }),
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
  review.addPhotos(
    [
      new File(['raw'], 'PRIVATE_FILENAME.png'),
      new File(['raw'], 'OTHER_PRIVATE.png'),
    ],
    'room',
  );
  await vi.waitFor(() =>
    expect(review.photos.getSnapshot().every((p) => p.status === 'ready')).toBe(
      true,
    ),
  );
  return {
    review,
    session,
    revoked,
    expire: () => {
      now = 8_000_000;
    },
  };
}
function transport(reply?: (input: OperationInput) => Promise<Response>) {
  return vi.fn<typeof fetch>(async (url, init) => {
    const body = JSON.parse(init!.body as string) as { input: OperationInput };
    if (String(url).endsWith('/admission'))
      return Response.json({
        kind: 'granted',
        grant: 'opaque',
        expiresAt: Date.now() + 120000,
        simulation: true,
      });
    if (reply) return reply(body.input);
    return Response.json({
      kind: 'completed',
      identity: body.input.identity,
      simulation: true,
      message: 'untrusted provider prose',
      draft: recognitionFixture(
        'repeated-desk',
        body.input.kind === 'recognize-room'
          ? body.input.manifest.map((p) => p.id)
          : [],
      ),
    });
  });
}
it('explicitly dispatches one admission/one operation, uses transient IDs and enters simulated rough2D review', async () => {
  const { review, session } = await setup(),
    send = transport();
  expect(send).not.toHaveBeenCalled();
  await draftFromPhotos(review, send);
  expect(send).toHaveBeenCalledTimes(2);
  const body = String(send.mock.calls[0]![1]!.body);
  expect(body).not.toMatch(/PRIVATE_FILENAME|OTHER_PRIVATE|blob:/);
  expect(body).toContain('"condition":"partial"');
  expect(review.getSnapshot().stage).toBe('review');
  expect(review.getSnapshot().simulated).toBe(true);
  expect(review.getSnapshot().recognition).toBe('idle');
  expect(review.getSnapshot().draft.room.furniture).toHaveLength(1);
  expect(session.getSnapshot().phase).toBe('intake');
  expect(session.getSnapshot().workspace).toBeNull();
  session.dispose();
});
it.each([
  'manual',
  'remove',
  'reorder',
  'cancel',
  'expire',
  'dispose',
  'newer',
  'reset',
  'accept',
] as const)(
  'fences late recognition after %s even when fetch ignores abort',
  async (action) => {
    const { review, session, expire } = await setup();
    let resolve!: (r: Response) => void;
    let captured!: OperationInput;
    const send = transport((input) => {
      captured = input;
      return new Promise((r) => {
        resolve = r;
      });
    });
    if (action === 'accept') review.shape('rectangle');
    const pending = draftFromPhotos(review, send);
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
    if (action === 'manual') review.shape('rectangle');
    if (action === 'remove') review.photos.remove('photo_1');
    if (action === 'reorder') review.photos.reorder('photo_2', -1);
    if (action === 'cancel') review.cancelDraft();
    if (action === 'expire') {
      expire();
      review.beginDraftOperation();
    }
    if (action === 'dispose') session.dispose();
    if (action === 'reset') session.reset();
    if (action === 'accept') expect(review.accept()).toBe(true);
    if (action === 'newer') await draftFromPhotos(review, transport());
    const before = review.getSnapshot();
    resolve(
      Response.json({
        kind: 'completed',
        identity: captured.identity,
        simulation: true,
        message: 'late-private-message',
        draft: recognitionFixture('wrong-category', ['photo_1', 'photo_2']),
      }),
    );
    await pending;
    expect(review.getSnapshot()).toEqual(before);
    expect(review.getSnapshot().message).not.toContain('late-private');
    session.dispose();
  },
);
it('normalizes safe errors instead of showing foreign payloads and never retries', async () => {
  const { review, session } = await setup(),
    send = transport(async () =>
      Response.json(
        {
          error: {
            code: 'busy',
            message: 'PRIVATE PAYLOAD',
            reference: 'opaque',
            retryable: true,
          },
        },
        { status: 429 },
      ),
    );
  await draftFromPhotos(review, send);
  expect(send).toHaveBeenCalledTimes(2);
  expect(review.getSnapshot().message).toBe(errorMessages.busy);
  expect(review.getSnapshot().photos).toHaveLength(2);
  expect(review.getSnapshot().recognition).toBe('idle');
  session.dispose();
});
it.each([
  'refused',
  'incomplete',
  'malformed',
  'timeout',
  'cancelled',
  'too-large',
  'unavailable',
  'invalid-image',
  'failed',
] as const)('retains current corrected work after %s', async (kind) => {
  const { review, session } = await setup();
  review.shape('rectangle');
  const before = review.getSnapshot().draft;
  const send = transport(async (input) =>
    Response.json({
      kind,
      identity: input.identity,
      simulation: true,
      message: 'PRIVATE MESSAGE',
      draft: null,
    }),
  );
  await draftFromPhotos(review, send);
  expect(review.getSnapshot().draft).toEqual(before);
  expect(review.getSnapshot().photos).toHaveLength(2);
  expect(review.getSnapshot().message).not.toContain('PRIVATE');
  expect(review.getSnapshot().recognition).toBe('idle');
  session.dispose();
});

it('uses the whole operation deadline and accepts a response beyond the health-probe timeout', async () => {
  const { review, session } = await setup();
  const timeouts: number[] = [];
  const original = AbortSignal.timeout;
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
    timeouts.push(ms);
    return original(ms);
  });
  const send = transport(async (input) => {
    await new Promise((r) => setTimeout(r, 3100));
    return Response.json({
      kind: 'completed',
      identity: input.identity,
      simulation: true,
      message: '',
      draft: recognitionFixture('empty', ['photo_1', 'photo_2']),
    });
  });
  await draftFromPhotos(review, send);
  expect(timeouts).toContain(110000);
  expect(review.getSnapshot().stage).toBe('review');
  expect(review.getSnapshot().recognition).toBe('idle');
  session.dispose();
});

it('independently ends visible progress when transport ignores the whole deadline', async () => {
  const { review, session } = await setup();
  const deadline = new AbortController();
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
  let resolve!: (response: Response) => void;
  const send = transport(
    () =>
      new Promise<Response>((r) => {
        resolve = r;
      }),
  );
  const pending = draftFromPhotos(review, send);
  await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
  deadline.abort();
  expect(review.getSnapshot().recognition).toBe('idle');
  expect(review.getSnapshot().message).toContain('took too long');
  const before = review.getSnapshot();
  resolve(
    Response.json({
      kind: 'completed',
      identity: {},
      simulation: true,
      message: 'late',
      draft: null,
    }),
  );
  await pending;
  expect(review.getSnapshot()).toEqual(before);
  session.dispose();
});
