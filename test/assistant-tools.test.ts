import { it, expect, vi } from 'vitest';
import request from 'supertest';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';
import { createApp } from '../apps/backend/src/http/create-app.js';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { createAssistantTools } from '../apps/backend/src/assistant/tools.js';
import { createRoomedyFakeProvider } from '../apps/backend/src/providers/fake.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import {
  responseBody,
  createResponsesProvider,
} from '../apps/backend/src/providers/responses.js';
import type {
  ProviderOutcome,
  ProviderRequest,
} from '../apps/backend/src/providers/provider.js';
import { resolveAssistantTask } from '@roomedy/spatial';
import { windowCase } from './fixtures/search-corpus.js';
import {
  commandRoom,
  piece,
  door,
  known,
  unknown,
} from './fixtures/command-room.js';
import {
  assistantInput,
  localAssistantCandidate,
} from './fixtures/assistant.js';
import { identityIds } from './fixtures/operation.js';
function runtime(provider = createRoomedyFakeProvider()) {
  const log = vi.fn(),
    ids = identityIds();
  return createRuntime(
    parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge' }),
    {
      now: Date.now,
      nextId: ids,
      log,
      provider,
      handlers: { assistant: createAssistantHandler(log, ids) },
    },
  );
}
const flat = {
  id: null,
  catalogueId: null,
  centerX: null,
  centerZ: null,
  quarterTurns: null,
  finish: null,
  floorFinish: null,
  wallFinish: null,
};
it('requests only a missing field used by a computed check for the selected piece', async () => {
  const room = windowCase().room;
  room.furniture.find((p) => p.id === 'desk')!.dimensions.width = unknown();
  room.furniture.find((p) => p.id === 'unrelated_shelf')!.dimensions.height =
    unknown();
  const input = assistantInput(room, 'Explain the desk checks');
  input.selectedId = 'desk';
  const task = resolveAssistantTask(
      room,
      input.text,
      'desk',
      input.identity.operationId,
    ),
    tools = createAssistantTools(input, task, new AbortController().signal);
  expect(
    (await tools.execute('request_measurement', { id: 'desk', field: 'width' }))
      .ok,
  ).toBe(true);
  expect(tools.reply().question).toEqual({ id: 'desk', field: 'width' });
  expect(
    (
      await tools.execute('request_measurement', {
        id: 'unrelated_shelf',
        field: 'height',
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await tools.execute('request_measurement', {
        id: 'desk',
        field: 'height',
      })
    ).ok,
  ).toBe(false);
  expect(room.furniture[0]!.dimensions.width.status).toBe('unknown');
});
it('runs one admitted fake HTTP operation with two strict serial tool rounds and no state mutation', async () => {
  const r = runtime(),
    app = createApp(r),
    input = assistantInput(
      windowCase().room,
      'Move the work area near the window',
    );
  input.localCandidate = localAssistantCandidate(input);
  expect(input.localCandidate).not.toBeNull();
  const before = structuredClone(input.room);
  const post = (path: string, body: object) =>
    request(app)
      .post('/v1/' + path)
      .set('Authorization', 'Bearer synthetic-bridge')
      .set('Origin', 'http://127.0.0.1:4320')
      .send(body);
  const grant = await post('admission', { input, proof: null });
  expect(grant.status).toBe(200);
  expect(r.operations.calls()).toBe(0);
  const result = await post('assistant', { input, grant: grant.body.grant });
  expect(result.status).toBe(200);
  expect(result.body.kind).toBe('completed');
  expect(result.body.assistant.kind).toBe('proposal');
  expect(result.body.simulation).toBe(true);
  expect(r.operations.calls()).toBe(2);
  expect(r.meteredDispatches()).toBe(0);
  expect(input.room).toEqual(before);
  r.operations.close();
});
it('recomputes untrusted worker facts and rejects an out-of-scope worker batch', async () => {
  const input = assistantInput(
    windowCase().room,
    'Move the desk by the window',
  );
  input.localCandidate = localAssistantCandidate(input);
  expect(input.localCandidate).not.toBeNull();
  input.localCandidate!.facts.displacementMm = 999999;
  const task = resolveAssistantTask(
      input.room,
      input.text,
      null,
      input.identity.operationId,
    ),
    tools = createAssistantTools(input, task, new AbortController().signal);
  expect((await tools.execute('find_arrangements', {})).ok).toBe(true);
  expect(tools.reply().facts?.displacementMm).not.toBe(999999);
  input.localCandidate!.actions.push({
    type: 'finish',
    id: 'unrelated_shelf',
    finish: 'ivory',
  });
  const bad = createAssistantTools(input, task, new AbortController().signal);
  expect((await bad.execute('find_arrangements', {})).ok).toBe(false);
});
it('rejects tool extras, fabricated IDs, unsupported variants, lock/confirmation attempts and unrelated finishes', async () => {
  const input = assistantInput(
      windowCase().room,
      'Move the desk by the window',
    ),
    task = resolveAssistantTask(
      input.room,
      input.text,
      null,
      input.identity.operationId,
    ),
    tools = createAssistantTools(input, task, new AbortController().signal);
  expect((await tools.execute('find_arrangements', { unlock: true })).ok).toBe(
    false,
  );
  expect((await tools.execute('focus_item', { id: 'invented' })).ok).toBe(
    false,
  );
  expect(
    (
      await tools.execute('prepare_edits', {
        actions: [
          { ...flat, type: 'finish', id: 'unrelated_shelf', finish: 'ivory' },
        ],
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await tools.execute('prepare_edits', {
        actions: [{ type: 'confirm-measurement', id: 'desk', value: 1200 }],
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await tools.execute('prepare_edits', {
        actions: [
          {
            ...flat,
            type: 'add',
            id: 'new',
            catalogueId: 'remote-url',
            centerX: 1000,
            centerZ: 1000,
            quarterTurns: 0,
          },
        ],
      })
    ).ok,
  ).toBe(false);
  expect(tools.reply().actions).toBeNull();
});
it('F: a validly scoped but door-blocking candidate returns a specific computed rejection', () => {
  const room = commandRoom([piece('desk', 3000, 3000)], [door()]);
  room.room.width = known(5000);
  room.room.depth = known(5000);
  const input = assistantInput(room, 'Move the desk to the left'),
    task = resolveAssistantTask(
      room,
      input.text,
      null,
      input.identity.operationId,
    );
  task.actions = null;
  const tools = createAssistantTools(input, task, new AbortController().signal),
    result = tools.prepare([
      {
        type: 'move',
        id: 'desk',
        pose: { centerX: 1400, centerZ: 300, quarterTurns: 0 },
      },
    ]);
  expect(result.ok).toBe(true);
  expect(tools.reply().actions).toBeNull();
  expect(tools.reply().blockedIssue).not.toBeNull();
  expect(room.furniture[0]!.pose.centerZ).toBe(3000);
});
it.each(['unknown', 'parallel', 'malformed', 'refused'] as const)(
  'fails closed on %s provider output with no hidden retry',
  async (kind) => {
    const provider = createFakeProvider(async (): Promise<ProviderOutcome> =>
      kind === 'refused'
        ? { kind: 'refused' }
        : kind === 'malformed'
          ? {
              kind: 'completed',
              data: { kind: 'done', text: 'fits perfectly' },
              calls: [],
            }
          : {
              kind: 'completed',
              data: null,
              calls:
                kind === 'unknown'
                  ? [{ name: 'execute_shell', callId: 'one', arguments: {} }]
                  : [
                      { name: 'read_room', callId: 'one', arguments: {} },
                      { name: 'read_room', callId: 'two', arguments: {} },
                    ],
            },
    );
    const r = runtime(provider),
      input = assistantInput(windowCase().room, 'Explain the room checks'),
      grant = await r.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
    if (!('grant' in grant)) throw new Error('grant');
    const result = await r.operations.run(
      input,
      grant.grant,
      new AbortController().signal,
    );
    expect('kind' in result && result.kind).toBe(
      kind === 'refused' ? 'refused' : 'malformed',
    );
    expect(r.operations.calls()).toBe(1);
    r.operations.close();
  },
);
it('captures actual projected strict/stateless serial requests without image/private payload attachments', async () => {
  const captured: ProviderRequest[] = [],
    fake = createRoomedyFakeProvider();
  const provider = createFakeProvider(async (r, s) => {
    captured.push(r);
    return fake.start(r, s).result;
  });
  const r = runtime(provider),
    input = assistantInput(windowCase().room, 'Explain the room checks');
  const grant = await r.operations.grant(
    input,
    null,
    new AbortController().signal,
  );
  if (!('grant' in grant)) throw new Error('grant');
  await r.operations.run(input, grant.grant, new AbortController().signal);
  expect(captured).toHaveLength(2);
  for (const value of captured) {
    const body = JSON.parse(responseBody(value, 'unverified-model')) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      store: false,
      background: false,
      stream: false,
      parallel_tool_calls: false,
    });
    expect(JSON.stringify(value)).not.toMatch(
      /input_image|base64|OPENAI_API_KEY|https:/,
    );
    expect(value.format.schema.additionalProperties).toBe(false);
  }
  r.operations.close();
});

it('a selected finish cannot be replaced by a different model-chosen palette', async () => {
  const input = assistantInput(
      windowCase().room,
      'Preview Calm & focused room palette',
    ),
    task = resolveAssistantTask(
      input.room,
      input.text,
      null,
      input.identity.operationId,
    ),
    tools = createAssistantTools(input, task, new AbortController().signal);
  expect(
    (
      await tools.execute('prepare_edits', {
        actions: [
          {
            ...flat,
            type: 'room-finish',
            floorFinish: 'clay',
            wallFinish: 'charcoal',
          },
        ],
      })
    ).ok,
  ).toBe(false);
  expect(tools.reply().actions).toBeNull();
  const good = createAssistantTools(input, task, new AbortController().signal);
  expect(
    (
      await good.execute('prepare_edits', {
        actions: [
          {
            ...flat,
            type: 'room-finish',
            floorFinish: 'walnut',
            wallFinish: 'sage',
          },
        ],
      })
    ).ok,
  ).toBe(true);
});

it('a final response with no computed answer is incomplete rather than a successful proposal', async () => {
  const r = runtime(
      createFakeProvider(async () => ({
        kind: 'completed',
        data: { kind: 'done' },
        calls: [],
      })),
    ),
    input = assistantInput(windowCase().room, 'Explain the room checks'),
    grant = await r.operations.grant(input, null, new AbortController().signal);
  if (!('grant' in grant)) throw new Error('grant');
  const result = await r.operations.run(
    input,
    grant.grant,
    new AbortController().signal,
  );
  expect('kind' in result && result.kind).toBe('incomplete');
  expect('assistant' in result).toBe(false);
  r.operations.close();
});

it.each(['round-limit', 'duplicate-call'] as const)(
  'bounds %s without a room mutation or retry',
  async (mode) => {
    let count = 0;
    const r = runtime(
        createFakeProvider(async () => ({
          kind: 'completed',
          data: null,
          calls: [
            {
              name: 'explain_checks',
              callId: mode === 'duplicate-call' ? 'same' : `call_${++count}`,
              arguments: { issueId: null },
            },
          ],
        })),
      ),
      input = assistantInput(windowCase().room, 'Explain the room checks'),
      before = structuredClone(input.room),
      grant = await r.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
    if (!('grant' in grant)) throw new Error('grant');
    const result = await r.operations.run(
      input,
      grant.grant,
      new AbortController().signal,
    );
    expect('kind' in result && result.kind).toBe(
      mode === 'duplicate-call' ? 'malformed' : 'incomplete',
    );
    expect(r.operations.calls()).toBe(mode === 'duplicate-call' ? 2 : 4);
    expect(input.room).toEqual(before);
    r.operations.close();
  },
);

it('keeps stateless reasoning replay only inside the current serial operation', async () => {
  const captured: ProviderRequest[] = [],
    reasoning = {
      type: 'reasoning',
      id: 'rs_fixture',
      summary: [],
      encrypted_content: 'synthetic-opaque',
    },
    call = {
      type: 'function_call',
      id: 'fc_fixture',
      name: 'explain_checks',
      call_id: 'call_fixture',
      arguments: '{"issueId":null}',
    };
  const r = runtime(
      createFakeProvider(async (request) => {
        captured.push(request);
        return captured.length === 1
          ? {
              kind: 'completed',
              data: null,
              calls: [
                {
                  name: 'explain_checks',
                  callId: 'call_fixture',
                  arguments: { issueId: null },
                },
              ],
              continuation: [reasoning, call],
            }
          : { kind: 'completed', data: { kind: 'done' }, calls: [] };
      }),
    ),
    input = assistantInput(windowCase().room, 'Explain the room checks'),
    grant = await r.operations.grant(input, null, new AbortController().signal);
  if (!('grant' in grant)) throw new Error('grant');
  const result = await r.operations.run(
    input,
    grant.grant,
    new AbortController().signal,
  );
  expect('kind' in result && result.kind).toBe('completed');
  expect(captured[1]!.input.slice(1, 3)).toEqual([reasoning, call]);
  expect(JSON.parse(responseBody(captured[1]!, 'fixture')).input[1]).toEqual(
    reasoning,
  );
  expect(JSON.stringify(result)).not.toContain('synthetic-opaque');
  r.operations.close();
});

it('interprets novel wording through the injected Responses adapter without preparing edits or granting scope', async () => {
  const intent = {
    goal: 'piece-finish',
    targetIds: ['desk'],
    categories: [],
    finish: 'walnut',
    palette: null,
  };
  const fetcher = vi.fn<typeof fetch>(async () =>
    Response.json({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(intent) }],
        },
      ],
    }),
  );
  const port = createResponsesProvider(
      'synthetic-key',
      'fixture-model',
      fetcher,
    ),
    signal = new AbortController().signal;
  const input = assistantInput(
      windowCase().room,
      'The furniture needs a quieter visual rhythm',
    ),
    before = structuredClone(input.room);
  const handler = createAssistantHandler(vi.fn(), identityIds());
  const output = await handler(input, {
    signal,
    call: async (req) => {
      const job = port.start(req, signal);
      await job.settled;
      return job.result;
    },
  });
  expect(output.kind).toBe('completed');
  expect(output.assistant?.kind).toBe('clarification');
  expect(output.assistant?.actions).toBeNull();
  expect(output.assistant?.suggestions).toMatchObject([
    {
      selectedId: 'desk',
      roomRevision: 0,
      request: 'Preview this selected piece finish walnut',
    },
  ]);
  expect(input.room).toEqual(before);
  const body = JSON.parse(fetcher.mock.calls[0]![1]!.body as string);
  expect(body.store).toBe(false);
  expect(body.parallel_tool_calls).toBe(false);
  expect(body.tools).toEqual([]);
  expect(body.text.format.strict).toBe(true);
  expect(fetcher).toHaveBeenCalledOnce();
});
it.each([
  {
    goal: 'piece-finish',
    targetIds: ['missing'],
    categories: [],
    finish: 'walnut',
    palette: null,
  },
  {
    goal: 'palette',
    targetIds: ['desk'],
    categories: [],
    finish: null,
    palette: 'calm',
  },
  {
    goal: 'open-space',
    targetIds: [],
    categories: [],
    finish: null,
    palette: null,
    actions: [{ type: 'remove', id: 'bed' }],
  },
])(
  'cannot turn invalid interpretation output into edit authority: %j',
  async (data) => {
    const input = assistantInput(
      windowCase().room,
      'The furniture needs a quieter visual rhythm',
    );
    const result = await createAssistantHandler(vi.fn(), identityIds())(input, {
      signal: new AbortController().signal,
      call: async () => ({ kind: 'completed', data, calls: [] }),
    });
    expect(result.assistant?.actions ?? null).toBeNull();
    expect(result.assistant?.suggestions ?? []).toEqual([]);
  },
);
it('prepares a coordinated spatial/style batch with actual facts and rejects an unrelated finish', async () => {
  const input = assistantInput(
    windowCase().room,
    'Improve my workspace with a calm room palette',
  );
  input.localCandidate = localAssistantCandidate(input);
  expect(input.localCandidate).not.toBeNull();
  const task = resolveAssistantTask(
      input.room,
      input.text,
      null,
      input.identity.operationId,
      input.context,
    ),
    tools = createAssistantTools(input, task, new AbortController().signal);
  expect((await tools.execute('find_arrangements', {})).ok).toBe(true);
  const reply = tools.reply();
  expect(reply.actions).toContainEqual({
    type: 'room-finish',
    floorFinish: 'walnut',
    wallFinish: 'sage',
  });
  expect(reply.facts!.windowDistanceMm.after!).toBeLessThan(
    reply.facts!.windowDistanceMm.before!,
  );
  expect(reply.summary).toContain('closer to daylight');
  expect(reply.summary).toContain('Walnut and sage');
  expect(reply.facts!.changedIds).toContain(input.room.roomId);
  expect(
    tools.prepare([
      ...reply.actions!,
      { type: 'finish', id: 'unrelated_shelf', finish: 'ivory' },
    ]).ok,
  ).toBe(false);
});
