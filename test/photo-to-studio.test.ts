import { expect, it, vi } from 'vitest';
import type { OperationInput } from '@roomedy/contracts/operations';
import type { DraftHypothesis } from '@roomedy/contracts/intake';
import { POLICY } from '@roomedy/contracts/policy';
import {
  bedroomExample,
  recognitionFixture,
} from '../apps/backend/src/recognition/fixtures.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import { ReviewController } from '../apps/frontend/src/features/room-intake/review-controller.js';
import {
  draftFromPhotos,
  FAKE_PROCESSING_PREVIEW_MS,
} from '../apps/frontend/src/features/room-intake/recognition-client.js';

async function setup() {
  let id = 0,
    photo = 0,
    now = 1000;
  const revoked = vi.fn();
  const session = new SessionController(undefined, {
    now: () => now,
    id: () => `session_${++id}`,
  });
  const review = new ReviewController(
    session,
    'furnished',
    () => `item_${++id}`,
    {
      id: () => `photo_${++photo}`,
      createUrl: () => `blob:photo-${photo}`,
      revokeUrl: revoked,
      prepare: async () => ({
        normalized: new Blob(['normalized'], { type: 'image/jpeg' }),
        preview: new Blob(['preview'], { type: 'image/jpeg' }),
        type: 'image/jpeg',
        inputWidth: 10,
        inputHeight: 10,
        width: 10,
        height: 10,
        decodeMs: 0,
        prepareMs: 0,
      }),
    },
  );
  review.addPhotos([new Blob(['one']), new Blob(['two'])], 'auto');
  await vi.waitFor(() =>
    expect(review.photos.getSnapshot().every((p) => p.status === 'ready')).toBe(
      true,
    ),
  );
  return {
    session,
    review,
    revoked,
    expire: () => {
      now += POLICY.guestLifetimeMs;
    },
  };
}
const sources = [
  { id: 'photo_1', purpose: 'auto' },
  { id: 'photo_2', purpose: 'auto' },
];
function transport(
  draft: DraftHypothesis = bedroomExample(sources),
  simulation = true,
) {
  return vi.fn<typeof fetch>(async (url, init) => {
    const { input } = JSON.parse(init!.body as string) as {
      input: OperationInput;
    };
    return Response.json(
      String(url).endsWith('/admission')
        ? {
            kind: 'granted',
            grant: 'opaque',
            expiresAt: Date.now() + 120000,
            simulation,
          }
        : {
            kind: 'completed',
            identity: input.identity,
            simulation,
            message: '',
            draft,
          },
    );
  });
}

it('opens the studio once with unchanged estimates, locks, baseline, fixed expiry and editable room commands', async () => {
  const { session, review, revoked } = await setup();
  const expiry = session.getSnapshot().expiresAt;
  const send = transport();
  await draftFromPhotos(review, send, { openStudio: true });
  const state = session.getSnapshot(),
    original = state.workspace!.current;
  expect(send).toHaveBeenCalledTimes(2);
  expect(state.phase).toBe('editor');
  expect(state.presentation.roomView).toBe('cutaway');
  expect(state.expiresAt).toBe(expiry);
  expect(state.workspace!.baseline).toEqual(original);
  expect(original.furniture).toHaveLength(2);
  expect(original.room.width).toMatchObject({
    value: 4200,
    status: 'estimated',
  });
  expect(original.furniture[0]!.dimensions.width.status).toBe('estimated');
  expect(original.furniture[0]!.locks).toEqual({
    position: false,
    rotation: false,
    dimensions: false,
  });
  expect(revoked).toHaveBeenCalledTimes(2);
  expect(review.photos.getSnapshot()).toHaveLength(0);
  expect(
    review.openStudioFromPhotos(
      { reviewId: 'old', generation: 0, operationId: 'old', inputRevision: 0 },
      bedroomExample(sources),
    ),
  ).toBe(false);
  const result = session.dispatch(
    [
      {
        type: 'confirm-measurement',
        target: { kind: 'room', id: original.roomId, field: 'width' },
        value: 4400,
      },
    ],
    'Confirm room width',
  );
  expect(result.ok).toBe(true);
  expect(session.getSnapshot().workspace!.current.room.width.status).toBe(
    'confirmed',
  );
  expect(session.undo().ok).toBe(true);
  expect(session.getSnapshot().workspace!.current.room.width).toEqual(
    original.room.width,
  );
  expect(session.getSnapshot().workspace!.baseline).toEqual(original);
  session.dispose();
});

it.each(['unknown', 'unsupported'] as const)(
  'opens a %s outline as an unconfirmed planning frame with contextual studio notes',
  async (shape) => {
    const { session, review } = await setup();
    const draft =
      shape === 'unknown'
        ? recognitionFixture(
            'repeated-desk',
            sources.map((s) => s.id),
          )
        : { ...bedroomExample(sources), shape };
    await draftFromPhotos(review, transport(draft), { openStudio: true });
    expect(session.getSnapshot().phase).toBe('editor');
    expect(session.getSnapshot().photoNotes?.outline).toBe(shape);
    expect(session.getSnapshot().presentation.panel).toBe('room');
    expect(session.getSnapshot().workspace!.current.room.width.status).toBe(
      shape === 'unknown' ? 'unknown' : 'estimated',
    );
    session.dispose();
  },
);

it('retains unmapped observations as transient notes and clears them without confirming room semantics', async () => {
  const { session, review } = await setup();
  const draft = bedroomExample(sources);
  for (const item of draft.observations.filter((item) =>
    item.ref.startsWith('bed_'),
  )) {
    item.catalogueId = null;
    item.label = 'Unmapped fixture item';
  }
  await draftFromPhotos(review, transport(draft), { openStudio: true });
  expect(session.getSnapshot().photoNotes?.unplaced).toEqual([
    'Unmapped fixture item',
    'Unmapped fixture item',
  ]);
  expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(1);
  const room = session.getSnapshot().workspace!.current;
  const serialized = exportProject(session.getSnapshot())!;
  const recovery = recoveryOf(session.getSnapshot())!;
  expect(serialized + JSON.stringify(recovery)).not.toMatch(
    /photoNotes|Unmapped fixture item|blob:|normalized/,
  );
  session.dismissPhotoNotes();
  expect(session.getSnapshot().photoNotes).toBeNull();
  expect(session.getSnapshot().workspace!.current).toEqual(room);
  expect(session.restore(recovery)).toBe(true);
  expect(session.getSnapshot().photoNotes).toBeNull();
  session.dispose();
});

it.each(['reset', 'expire', 'dispose', 'restore', 'import'] as const)(
  'clears bounded transient photo notes on %s',
  async (action) => {
    const { session, review, expire } = await setup();
    await draftFromPhotos(review, transport(), { openStudio: true });
    expect(session.getSnapshot().photoNotes?.simulated).toBe(true);
    if (action === 'reset') session.reset();
    if (action === 'dispose') session.dispose();
    if (action === 'restore')
      expect(session.restore(recoveryOf(session.getSnapshot())!)).toBe(true);
    if (action === 'import') {
      const parsed = readProject(exportProject(session.getSnapshot())!);
      if (!parsed.ok) throw new Error('fixture-project');
      expect(session.importProject(parsed.value)).toBe(true);
    }
    if (action === 'expire') {
      expire();
      session.setRoomView('plan');
    }
    expect(session.getSnapshot().photoNotes).toBeNull();
    session.dispose();
  },
);

it.each(['cancel', 'reset', 'expire', 'dispose'] as const)(
  'retires the finite fake preview on %s without accepting early',
  async (action) => {
    const { session, review, revoked, expire } = await setup();
    vi.useFakeTimers();
    try {
      const pending = draftFromPhotos(review, transport(), {
        openStudio: true,
        previewProcessing: true,
      });
      await vi.waitFor(() =>
        expect(review.getSnapshot().recognition).toBe('opening'),
      );
      expect(session.getSnapshot().workspace).toBeNull();
      expect(review.getSnapshot().stage).toBe('photos');
      expect(revoked).not.toHaveBeenCalled();
      if (action === 'cancel') review.cancelDraft();
      if (action === 'reset') session.reset();
      if (action === 'dispose') session.dispose();
      if (action === 'expire') {
        expire();
        review.beginDraftOperation();
      }
      await pending;
      await vi.advanceTimersByTimeAsync(FAKE_PROCESSING_PREVIEW_MS);
      expect(session.getSnapshot().workspace).toBeNull();
      expect(session.getSnapshot().phase).not.toBe('editor');
      expect(review.getSnapshot().photos).toHaveLength(
        action === 'cancel' ? 2 : 0,
      );
      expect(review.getSnapshot().recognition).toBe('idle');
      expect(vi.getTimerCount()).toBe(action === 'reset' ? 1 : 0);
    } finally {
      session.dispose();
      vi.useRealTimers();
    }
  },
);

it('finishes the fake preview through the same direct studio authority', async () => {
  const { session, review } = await setup();
  vi.useFakeTimers();
  try {
    const pending = draftFromPhotos(review, transport(), {
      openStudio: true,
      previewProcessing: true,
    });
    await vi.waitFor(() =>
      expect(review.getSnapshot().recognition).toBe('opening'),
    );
    expect(session.getSnapshot().phase).toBe('intake');
    await vi.advanceTimersByTimeAsync(FAKE_PROCESSING_PREVIEW_MS);
    await pending;
    expect(session.getSnapshot().phase).toBe('editor');
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    session.dispose();
    vi.useRealTimers();
  }
});

it.each([
  [false, true],
  [true, false],
])(
  'adds no preview wait for simulation=%s / preview=%s',
  async (simulation, previewProcessing) => {
    const { session, review } = await setup();
    vi.useFakeTimers();
    try {
      await draftFromPhotos(review, transport(undefined, simulation), {
        openStudio: true,
        previewProcessing,
      });
      expect(session.getSnapshot().phase).toBe('editor');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      session.dispose();
      vi.useRealTimers();
    }
  },
);

it.each(['cancel', 'remove', 'reset', 'expire', 'dispose'] as const)(
  'cannot open a late studio after %s even if transport ignores abort',
  async (action) => {
    const { session, review, expire } = await setup();
    let resolve!: (response: Response) => void;
    let input!: OperationInput;
    const send = vi.fn<typeof fetch>(async (url, init) => {
      input = (JSON.parse(init!.body as string) as { input: OperationInput })
        .input;
      return String(url).endsWith('/admission')
        ? Response.json({
            kind: 'granted',
            grant: 'opaque',
            expiresAt: Date.now() + 120000,
            simulation: true,
          })
        : new Promise<Response>((done) => {
            resolve = done;
          });
    });
    const pending = draftFromPhotos(review, send, {
      openStudio: true,
      previewProcessing: true,
    });
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
    if (action === 'cancel') review.cancelDraft();
    if (action === 'remove') review.photos.remove('photo_1');
    if (action === 'reset') session.reset();
    if (action === 'expire') {
      expire();
      review.beginDraftOperation();
    }
    if (action === 'dispose') session.dispose();
    resolve(
      Response.json({
        kind: 'completed',
        identity: input.identity,
        simulation: true,
        message: '',
        draft: bedroomExample(sources),
      }),
    );
    await pending;
    expect(session.getSnapshot().workspace).toBeNull();
    expect(session.getSnapshot().phase).not.toBe('editor');
    session.dispose();
  },
);

it('returns a failed operation to usable photos and permits one explicit retry into the studio', async () => {
  const { session, review, revoked } = await setup();
  const failed = vi.fn<typeof fetch>(async (url, init) => {
    const { input } = JSON.parse(init!.body as string) as {
      input: OperationInput;
    };
    return Response.json(
      String(url).endsWith('/admission')
        ? {
            kind: 'granted',
            grant: 'opaque',
            expiresAt: Date.now() + 120000,
            simulation: true,
          }
        : {
            kind: 'incomplete',
            identity: input.identity,
            simulation: true,
            message: 'foreign provider prose',
            draft: null,
          },
    );
  });
  await draftFromPhotos(review, failed, {
    openStudio: true,
    previewProcessing: true,
  });
  expect(failed).toHaveBeenCalledTimes(2);
  expect(review.getSnapshot().recognition).toBe('idle');
  expect(review.getSnapshot().stage).toBe('photos');
  expect(review.getSnapshot().photos).toHaveLength(2);
  expect(review.getSnapshot().message).not.toContain('foreign');
  expect(session.getSnapshot().workspace).toBeNull();
  expect(revoked).not.toHaveBeenCalled();
  const retry = transport();
  await draftFromPhotos(review, retry, { openStudio: true });
  expect(retry).toHaveBeenCalledTimes(2);
  expect(session.getSnapshot().phase).toBe('editor');
  session.dispose();
});
