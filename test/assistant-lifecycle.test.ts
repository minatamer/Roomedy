import { it, expect, vi } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createRoomedyFakeProvider } from '../apps/backend/src/providers/fake.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import { assistantFakeResponse } from '../apps/backend/src/assistant/fake.js';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { operationInputSchema } from '@roomedy/contracts/operations';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { sampleAssistantStories } from './fixtures/assistant.js';
import { LayoutSearch, proposedSearchPiece } from '@roomedy/spatial';
import type { ActionScope, ProposalAction } from '@roomedy/contracts/commands';
import { windowCase } from './fixtures/search-corpus.js';
import { commandRoom, piece } from './fixtures/command-room.js';
import { identityIds } from './fixtures/operation.js';
import {
  projectOf,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';

async function setup(
  hold = false,
  provider = createRoomedyFakeProvider(),
  room = windowCase().room,
  maxNodes = 2000,
) {
  let now = 0;
  const session = new SessionController(room, { now: () => now });
  const ids = identityIds(),
    runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge' }),
      {
        now: Date.now,
        nextId: ids,
        log: vi.fn(),
        provider,
        handlers: { assistant: createAssistantHandler(vi.fn(), ids) },
      },
    );
  let late: (() => Promise<void>) | null = null;
  let holdNext = hold;
  const transport = vi.fn<typeof fetch>(async (url, init) => {
    if (String(url).endsWith('/config'))
      return Response.json(runtime.publicConfig);
    const body = JSON.parse(init!.body as string) as {
        input: unknown;
        grant?: string;
      },
      input = operationInputSchema.parse(body.input);
    if (String(url).endsWith('/admission'))
      return Response.json(
        await runtime.operations.grant(
          input,
          null,
          new AbortController().signal,
        ),
      );
    const run = async () =>
      Response.json(
        await runtime.operations.run(
          input,
          body.grant!,
          new AbortController().signal,
        ),
      );
    if (holdNext) {
      holdNext = false;
      return new Promise<Response>((resolve) => {
        late = async () => resolve(await run());
      });
    }
    return run();
  });
  const assistant = new AssistantController(session, {
    transport,
    search: async (token, goal, scope) => {
      const search = new LayoutSearch(
        {
          identity: token,
          room: session.getSnapshot().workspace!.current,
          goal,
          seed: 42,
          maxNodes,
        },
        scope,
      );
      while (!search.step()) {}
      return search.finish();
    },
  });
  await vi.waitFor(() => expect(assistant.getSnapshot().mode).toBe('fake'));
  return {
    session,
    assistant,
    runtime,
    transport,
    late: () => late,
    expire: () => {
      now = 8_000_000;
    },
    close: () => {
      assistant.dispose();
      session.dispose();
      runtime.operations.close();
    },
  };
}
it('previews one coordinated proposal separately, applies twice idempotently and Undo restores the whole instruction', async () => {
  const s = await setup(),
    before = s.session.getSnapshot().workspace!.current;
  await s.assistant.submit('Move the work area near the window');
  const preview = s.session.getSnapshot().candidate;
  expect(preview?.source).toBe('assistant');
  expect(s.session.getSnapshot().workspace!.current).toEqual(before);
  const dispatched = s.runtime.operations.calls();
  s.session.select('desk');
  s.session.setView({ zoom: 1.2 });
  const messagesBeforeApply = s.assistant.getSnapshot().messages.length;
  const a = s.assistant.apply();
  expect(a.ok && a.status).toBe('applied');
  expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(1);
  const applied = s.session.getSnapshot().workspace!.current,
    appliedMessages = s.assistant.getSnapshot().messages,
    b = s.assistant.apply();
  expect(b.ok && b.status).toBe('already-applied');
  expect(s.session.getSnapshot().workspace!.current).toEqual(applied);
  expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(1);
  expect(appliedMessages).toHaveLength(messagesBeforeApply + 1);
  expect(s.assistant.getSnapshot().messages).toBe(appliedMessages);
  expect(s.assistant.undo().ok).toBe(true);
  expect({
    ...s.session.getSnapshot().workspace!.current,
    roomRevision: 0,
  }).toEqual({ ...before, roomRevision: 0 });
  expect(s.session.getSnapshot().workspace!.current.roomRevision).toBe(2);
  expect(s.runtime.operations.calls()).toBe(dispatched);
  s.close();
});
it('keeps a finish correction grounded across view changes and whole-change Undo', async () => {
  const s = await setup(),
    before = s.session.getSnapshot().workspace!.current;
  await s.assistant.submit('Make the desk ivory');
  expect(
    s.session
      .getSnapshot()
      .candidate?.room.furniture.find((p) => p.id === 'desk')!.finish,
  ).toBe('ivory');
  expect(s.assistant.apply().ok).toBe(true);
  s.session.select(null);
  s.session.setRoomView('cutaway');
  await s.assistant.submit('Actually, make it walnut instead');
  const candidate = s.session.getSnapshot().candidate!;
  expect(candidate.room.furniture.find((p) => p.id === 'desk')!.finish).toBe(
    'walnut',
  );
  expect(
    candidate.room.furniture.find((p) => p.id === 'unrelated_shelf'),
  ).toEqual(before.furniture.find((p) => p.id === 'unrelated_shelf'));
  s.session.setRoomView('plan');
  expect(s.session.getSnapshot().candidate?.room).toBe(candidate.room);
  expect(s.assistant.apply().ok).toBe(true);
  expect(s.assistant.undo().ok).toBe(true);
  expect(
    s.session
      .getSnapshot()
      .workspace!.current.furniture.find((p) => p.id === 'desk')!.finish,
  ).toBe('ivory');
  expect(s.assistant.undo().ok).toBe(true);
  expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
    before.furniture,
  );
  expect(s.runtime.meteredDispatches()).toBe(0);
  s.close();
});
it('requires a fresh visitor choice after novel-language interpretation and fences old/changed-room options', async () => {
  const s = await setup();
  await s.assistant.submit('Where should the composition go next?');
  const message = s.assistant.getSnapshot().messages.at(-1)!,
    suggestions = message.reply!.suggestions!;
  expect(suggestions).toHaveLength(3);
  expect(s.session.getSnapshot().candidate).toBeNull();
  expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
  const initialCalls = s.runtime.operations.calls();
  s.assistant.chooseSuggestion(message.id, { ...suggestions[1]! });
  expect(s.runtime.operations.calls()).toBe(initialCalls);
  s.assistant.chooseSuggestion(message.id, suggestions[1]!);
  await vi.waitFor(() =>
    expect(s.session.getSnapshot().candidate).not.toBeNull(),
  );
  expect(s.assistant.apply().ok).toBe(true);
  const calls = s.runtime.operations.calls();
  s.assistant.chooseSuggestion(message.id, suggestions[0]!);
  expect(s.runtime.operations.calls()).toBe(calls);
  await s.assistant.submit('Where should the composition go next?');
  const fresh = s.assistant.getSnapshot().messages.at(-1)!;
  expect(fresh.reply?.suggestions?.length).toBeGreaterThan(0);
  expect(
    s.session.dispatch(
      [{ type: 'finish', id: 'desk', finish: 'clay' }],
      'Finish',
    ).ok,
  ).toBe(true);
  const after = s.runtime.operations.calls();
  s.assistant.chooseSuggestion(fresh.id, fresh.reply!.suggestions![0]!);
  expect(s.runtime.operations.calls()).toBe(after);
  expect(s.session.getSnapshot().candidate).toBeNull();
  expect(s.runtime.meteredDispatches()).toBe(0);
  s.close();
});
it('keeps conversation and composer ownership when a clarification binds a specific piece', async () => {
  const s = await setup(
    false,
    createFakeProvider(async (req, signal) =>
      req.format.name === 'room_design_intent_1'
        ? {
            kind: 'completed',
            calls: [],
            data: {
              goal: 'piece-finish',
              targetIds: ['desk'],
              categories: [],
              finish: 'ivory',
              palette: null,
            },
          }
        : assistantFakeResponse(req, signal),
    ),
  );
  s.session.setPanel('assistant');
  await s.assistant.submit('The furniture needs a quieter visual rhythm');
  const message = s.assistant.getSnapshot().messages.at(-1)!;
  s.assistant.chooseSuggestion(message.id, message.reply!.suggestions![0]!);
  await vi.waitFor(() =>
    expect(s.session.getSnapshot().candidate).not.toBeNull(),
  );
  expect(s.session.getSnapshot().presentation.selectedId).toBe('desk');
  expect(s.session.getSnapshot().presentation.panel).toBe('assistant');
  s.close();
});
it.each(sampleAssistantStories)(
  'completes the actual $kind sample conversation with unchanged production work bounds',
  async (story) => {
    const room = createRoomFixture(story.kind),
      s = await setup(
        false,
        createRoomedyFakeProvider(),
        room,
        POLICY.searchCandidates,
      );
    const original = s.session.getSnapshot().workspace!.current;
    await s.assistant.submit(story.text);
    expect(s.session.getSnapshot().candidate).not.toBeNull();
    expect(s.session.getSnapshot().workspace!.current).toEqual(original);
    const projected = s.session.getSnapshot().candidate!.room;
    s.session.setRoomView('cutaway');
    expect(s.session.getSnapshot().candidate!.room).toBe(projected);
    s.assistant.cancel();
    expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
    await s.assistant.submit(story.text);
    expect(s.assistant.apply().ok).toBe(true);
    const arranged = s.session.getSnapshot().workspace!.current;
    expect(arranged.furniture).toHaveLength(story.count);
    for (const owned of original.furniture.filter(
      (p) => p.ownership === 'owned',
    )) {
      expect(
        arranged.furniture.find((p) => p.id === owned.id)!.dimensions,
      ).toEqual(owned.dimensions);
      expect(arranged.furniture.find((p) => p.id === owned.id)!.locks).toEqual(
        owned.locks,
      );
      expect(arranged.furniture.find((p) => p.id === owned.id)!.finish).toBe(
        owned.finish,
      );
      if (story.kind === 'partial' || owned.id !== 'desk_1')
        expect(arranged.furniture.find((p) => p.id === owned.id)!.pose).toEqual(
          owned.pose,
        );
    }
    if (story.kind === 'partial') expect(arranged.room.height.value).toBeNull();
    await s.assistant.submit('Coordinate the room finishes so it feels serene');
    expect(s.session.getSnapshot().candidate!.room.room.wallFinish).toBe(
      'sage',
    );
    expect(s.assistant.apply().ok).toBe(true);
    expect(s.assistant.undo().ok).toBe(true);
    expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
      arranged.furniture,
    );
    expect(s.assistant.undo().ok).toBe(true);
    expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
      original.furniture,
    );
    expect(s.session.getSnapshot().workspace!.current.room).toEqual(
      original.room,
    );
    expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
    expect(s.runtime.meteredDispatches()).toBe(0);
    s.close();
  },
  30_000,
);
it('uses authored dark-wood interpretation for the real selected piece and keeps chat through follow-up corrections', async () => {
  const room = createRoomFixture('sample'),
    s = await setup(false, createRoomedyFakeProvider(), room);
  s.session.select('desk_1');
  s.session.setPanel('assistant');
  await s.assistant.submit('I prefer dark wood for this desk');
  const message = s.assistant.getSnapshot().messages.at(-1)!;
  expect(message.reply?.actions).toBeNull();
  expect(message.reply?.suggestions).toMatchObject([
    {
      selectedId: 'desk_1',
      request: 'Preview this selected piece finish walnut',
    },
  ]);
  s.assistant.chooseSuggestion(message.id, message.reply!.suggestions![0]!);
  await vi.waitFor(() =>
    expect(
      s.session
        .getSnapshot()
        .candidate?.room.furniture.find((p) => p.id === 'desk_1')!.finish,
    ).toBe('walnut'),
  );
  expect(s.session.getSnapshot().presentation.panel).toBe('assistant');
  expect(s.assistant.apply().ok).toBe(true);
  await s.assistant.submit('Actually, make it ivory instead');
  expect(
    s.session
      .getSnapshot()
      .candidate?.room.furniture.find((p) => p.id === 'desk_1')!.finish,
  ).toBe('ivory');
  s.assistant.cancel();
  expect(s.assistant.undo().ok).toBe(true);
  expect(s.session.getSnapshot().workspace!.current.furniture).toEqual(
    room.furniture,
  );
  expect(s.runtime.meteredDispatches()).toBe(0);
  s.close();
});
it('Cancel changes no accepted room/history; draft text survives selection, camera and panel changes', async () => {
  const s = await setup(),
    before = s.session.getSnapshot().workspace!.current;
  await s.assistant.submit('Preview Calm & focused room palette');
  expect(s.session.getSnapshot().candidate).not.toBeNull();
  s.assistant.draft('Keep this unfinished question');
  s.session.select('desk');
  s.session.setView({ zoom: 1.4 });
  s.session.setPanel('assistant');
  expect(s.assistant.getSnapshot().draft).toBe('Keep this unfinished question');
  s.assistant.cancel();
  expect(s.session.getSnapshot().candidate).toBeNull();
  expect(s.session.getSnapshot().workspace!.current).toEqual(before);
  expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
  s.close();
});
it('recovery reads current runtime capabilities and cannot restore fake/live authorization or replay a request', async () => {
  const previous = await setup();
  await previous.assistant.submit('Move the work area near the window');
  previous.assistant.apply();
  const saved = recoveryOf(previous.session.getSnapshot())!;
  previous.close();
  const session = new SessionController(undefined, { now: () => 0 });
  expect(session.restore(saved)).toBe(true);
  const disabled = createRuntime(
    parseRuntimeConfig({ FAKE_MODE: 'false', PAID_DEMO_ENABLED: 'false' }),
    {
      now: Date.now,
      nextId: identityIds(),
      log: vi.fn(),
    },
  );
  const transport = vi.fn<typeof fetch>(async (url) => {
    expect(String(url)).toContain('/config');
    return Response.json(disabled.publicConfig);
  });
  const assistant = new AssistantController(session, { transport });
  await vi.waitFor(() =>
    expect(assistant.getSnapshot().mode).toBe('unavailable'),
  );
  await assistant.submit('Move the work area near the window');
  expect(transport).toHaveBeenCalledTimes(1);
  expect(assistant.getSnapshot().messages.at(-1)?.text).toContain(
    'unavailable',
  );
  expect(session.getSnapshot().workspace!.history.entries).toHaveLength(0);
  expect(session.getSnapshot().candidate).toBeNull();
  expect(session.getSnapshot().workspace!.current).toEqual(
    saved.project.current,
  );
  expect(disabled.meteredDispatches()).toBe(0);
  assistant.dispose();
  session.dispose();
  disabled.operations.close();
});

it('a new explanation retires the old proposal status instead of leaving a false Preview ready message', async () => {
  const s = await setup();
  await s.assistant.submit('Move the work area near the window');
  expect(s.session.getSnapshot().message).toContain('Proposal ready');
  await s.assistant.submit('Explain the room checks');
  expect(s.session.getSnapshot().candidate).toBeNull();
  expect(s.session.getSnapshot().message).not.toContain('Proposal ready');
  expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
  s.close();
});
it('the visible watchdog stops progress even when the operation transport ignores abort', async () => {
  const s = await setup(true),
    before = s.session.getSnapshot().workspace!.current;
  vi.useFakeTimers();
  try {
    const pending = s.assistant.submit('Move the work area near the window');
    await vi.waitFor(() => expect(s.late()).toBeTypeOf('function'));
    await vi.advanceTimersByTimeAsync(POLICY.operationBridgeMs);
    expect(s.assistant.getSnapshot().busy).toBe(false);
    expect(s.assistant.getSnapshot().messages.at(-1)?.text).toContain(
      'took too long',
    );
    expect(s.session.getSnapshot().candidate).toBeNull();
    await s.late()!();
    await pending;
    expect(s.session.getSnapshot().workspace!.current).toEqual(before);
    expect(s.session.getSnapshot().workspace!.history.entries).toHaveLength(0);
  } finally {
    s.close();
    vi.useRealTimers();
  }
});
it.each([
  'manual',
  'reset',
  'expire',
  'cancel',
  'newer',
  'import',
  'before',
  'update',
] as const)(
  'G: rejects a late abort-ignoring assistant reply after %s',
  async (action) => {
    const s = await setup(true),
      pending = s.assistant.submit('Move the work area near the window');
    await vi.waitFor(() => expect(s.late()).toBeTypeOf('function'));
    if (action === 'manual')
      expect(
        s.session.dispatch(
          [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'sage' }],
          'Manual room finish',
        ).ok,
      ).toBe(true);
    if (action === 'reset') s.session.reset(commandRoom());
    if (action === 'import')
      s.session.importProject(projectOf(s.session.getSnapshot())!);
    if (action === 'before') s.session.setComparison('before');
    if (action === 'update') s.session.clientPartFailed();
    if (action === 'expire') {
      s.expire();
      s.session.beginOperation();
    }
    if (action === 'cancel') s.assistant.cancel();
    if (action === 'newer')
      await s.assistant.submit('Preview Calm & focused room palette');
    const before = s.session.getSnapshot();
    await s.late()!();
    await pending;
    expect(s.session.getSnapshot()).toEqual(before);
    expect(s.session.getSnapshot().workspace?.history.entries.length ?? 0).toBe(
      action === 'manual' ? 1 : 0,
    );
    s.close();
  },
);
it('H: measurement correction preserves the honest value and retires the old candidate', async () => {
  const s = await setup();
  await s.assistant.submit('Move the work area near the window');
  expect(s.session.getSnapshot().candidate).not.toBeNull();
  const result = s.session.dispatch(
    [
      {
        type: 'confirm-measurement',
        target: {
          kind: 'room',
          id: s.session.getSnapshot().workspace!.current.roomId,
          field: 'width',
        },
        value: 2600,
      },
    ],
    'Correct room width',
  );
  expect(result.ok).toBe(true);
  expect(s.session.getSnapshot().candidate).toBeNull();
  expect(s.session.getSnapshot().workspace!.current.room.width.value).toBe(
    2600,
  );
  expect(s.assistant.apply().ok).toBe(false);
  s.close();
});
it('scoped mixed add/move/finish and a coordinated swap create one atomic Undo entry', () => {
  const room = commandRoom([piece('a', 2000, 2000), piece('b', 4000, 2000)]),
    session = new SessionController(room),
    token = session.beginOperation()!;
  const added = proposedSearchPiece({
    id: 'new',
    catalogueId: 'procedural-storage',
    size: null,
    finish: 'oak',
  })!;
  added.pose = {
    centerX: 7000,
    centerZ: 7000,
    quarterTurns: 0,
    provenance: { status: 'planned', sourceId: 'assistant-plan' },
  };
  const scope: ActionScope = {
    roomId: room.roomId,
    roomRevision: 0,
    actionKinds: ['add', 'move', 'room-finish'],
    targetIds: ['a', 'b'],
    additions: [{ id: 'new', catalogueId: added.catalogueId }],
    replacements: [],
    removals: [],
    roomFinishes: true,
  };
  const actions: ProposalAction[] = [
    {
      type: 'move',
      id: 'a',
      pose: { centerX: 4000, centerZ: 2000, quarterTurns: 0 },
    },
    {
      type: 'move',
      id: 'b',
      pose: { centerX: 2000, centerZ: 2000, quarterTurns: 0 },
    },
    { type: 'add', furniture: added },
    { type: 'room-finish', floorFinish: 'walnut', wallFinish: 'sage' },
  ];
  expect(
    session.prepareAssistant(token, actions, scope, 'Coordinated room change')
      .ok,
  ).toBe(true);
  expect(session.getSnapshot().workspace!.current).toEqual(room);
  expect(session.applyAssistantPreview().ok).toBe(true);
  expect(session.getSnapshot().workspace!.history.entries).toHaveLength(1);
  expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(3);
  expect(session.undo().ok).toBe(true);
  expect({
    ...session.getSnapshot().workspace!.current,
    roomRevision: 0,
  }).toEqual(room);
  session.dispose();
});
it('keeps bounded conversation/context and never includes private photos or prior tool payloads', async () => {
  const s = await setup();
  for (let i = 0; i < POLICY.contextTurns + 5; i++)
    await s.assistant.submit('Explain the room checks');
  expect(s.assistant.getSnapshot().messages.length).toBeLessThanOrEqual(
    POLICY.contextTurns * 2,
  );
  for (const [, init] of s.transport.mock.calls) {
    if (!init?.body) continue;
    const text = String(init.body);
    expect(text).not.toMatch(/base64|PRIVATE_FILENAME|blob:/);
    const body = JSON.parse(text) as { input: { context: { text: string }[] } };
    expect(body.input.context.every((turn) => turn.text.length <= 4000)).toBe(
      true,
    );
  }
  expect(s.runtime.meteredDispatches()).toBe(0);
  s.close();
});
