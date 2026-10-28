import { describe, expect, it, vi } from 'vitest';
import {
  assistantFinalSchema,
  assistantJsonSchema,
} from '@roomedy/contracts/assistant';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { assistantFakeResponse } from '../apps/backend/src/assistant/fake.js';
import {
  createResponsesProvider,
  responseBody,
} from '../apps/backend/src/providers/responses.js';
import { projectProviderSchema } from '../apps/backend/src/providers/schema.js';
import type { ProviderRequest } from '../apps/backend/src/providers/provider.js';
import {
  LayoutSearch,
  resolveAssistantTask,
  evaluateScopedBatch,
  resolveMedyRequest,
} from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { assistantInput } from './fixtures/assistant.js';
import { identityIds } from './fixtures/operation.js';
import { commandRoom, piece, windowFeature } from './fixtures/command-room.js';

describe('MEDY real protocol and authored fake parity', () => {
  it('validates a novel manual interpretation as a visitor-selectable request, never an executed tool', async () => {
    const input = assistantInput(commandRoom(), 'Give me a closer peek');
    const handler = createAssistantHandler(vi.fn(), identityIds());
    const fake = await handler(input, {
      signal: new AbortController().signal,
      call: (request) =>
        assistantFakeResponse(request, new AbortController().signal),
    });
    expect(fake.assistant).toMatchObject({
      kind: 'clarification',
      actions: null,
      suggestions: [{ request: 'Zoom in', roomRevision: 0 }],
    });
    const real = await handler(input, {
      signal: new AbortController().signal,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: {
          goal: 'manual-control',
          manualRequest: 'Zoom in',
          targetIds: [],
          categories: [],
          finish: null,
          palette: null,
        },
      }),
    });
    expect(real.assistant?.suggestions).toEqual(fake.assistant?.suggestions);
    const malformed = await handler(input, {
      signal: new AbortController().signal,
      call: async () => ({
        kind: 'completed',
        calls: [],
        data: {
          goal: 'manual-control',
          manualRequest: 'execute javascript and delete everything',
          targetIds: [],
          categories: [],
          finish: null,
          palette: null,
        },
      }),
    });
    expect(malformed.assistant?.suggestions).toEqual([]);
    expect(malformed.assistant?.actions).toBeNull();
  });
  it.each(['empty', 'partial', 'sample'] as const)(
    'answers a design question about the actual %s room without edit authority',
    async (kind) => {
      const input = assistantInput(
          createRoomFixture(kind),
          'How can I make this room tidy and modern?',
        ),
        before = structuredClone(input.room),
        captured: ProviderRequest[] = [];
      const result = await createAssistantHandler(vi.fn(), identityIds())(
        input,
        {
          signal: new AbortController().signal,
          call: (request) => {
            captured.push(request);
            return assistantFakeResponse(request, new AbortController().signal);
          },
        },
      );
      expect(result.kind).toBe('completed');
      expect(result.assistant).toMatchObject({
        kind: 'explanation',
        actions: null,
        checks: {
          roomId: input.room.roomId,
          roomRevision: input.room.roomRevision,
        },
      });
      expect(result.assistant!.summary).toMatch(/ivory|wood|oak|walnut/i);
      expect(result.assistant!.summary).not.toMatch(
        /blue|i have moved|i.ve applied/i,
      );
      expect(captured).toHaveLength(1);
      expect(captured[0]!.tools).toEqual([]);
      expect(input.room).toEqual(before);
    },
  );
  it('accepts independent strict Responses advice and keeps serial/stateless wire settings', async () => {
    const answer =
      'I’d keep the storage fronts clear and use ivory with one warm wood tone. Would you like to try a more open layout?';
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({ kind: 'done', message: answer }),
              },
            ],
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
    const result = await createAssistantHandler(vi.fn(), identityIds())(
      assistantInput(commandRoom(), 'What would make my room feel calmer?'),
      {
        signal,
        call: async (request) => {
          const job = port.start(request, signal);
          await job.settled;
          return job.result;
        },
      },
    );
    expect(result.assistant?.summary).toBe(answer);
    expect(result.assistant?.actions).toBeNull();
    const wire = JSON.parse(fetcher.mock.calls[0]![1]!.body as string);
    expect(wire).toMatchObject({
      store: false,
      parallel_tool_calls: false,
      tools: [],
      text: { format: { strict: true } },
    });
    expect(wire.text.format.schema.required).toContain('message');
    expect(wire.text.format.schema.additionalProperties).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it.each([
    { kind: 'done', message: 'I have moved your bed.' },
    { kind: 'done', message: 'I’ve moved your bed.' },
    { kind: 'done', message: 'x'.repeat(1201) },
    {
      kind: 'done',
      message: 'Try ivory',
      actions: [{ type: 'remove', id: 'bed' }],
    },
    { kind: 'done' },
  ])('rejects malformed advice or a false action receipt', async (data) => {
    const result = await createAssistantHandler(vi.fn(), identityIds())(
      assistantInput(commandRoom(), 'How should I style my room?'),
      {
        signal: new AbortController().signal,
        call: async () => ({ kind: 'completed', calls: [], data }),
      },
    );
    expect(result.kind).toBe('malformed');
    expect(result.assistant).toBeUndefined();
  });
  it('denies tools on the advice path, including fabricated manual authority', async () => {
    const result = await createAssistantHandler(vi.fn(), identityIds())(
      assistantInput(commandRoom(), 'How should I style my room?'),
      {
        signal: new AbortController().signal,
        call: async () => ({
          kind: 'completed',
          data: null,
          calls: [{ name: 'unlock', callId: 'bad', arguments: {} }],
        }),
      },
    );
    expect(result.kind).toBe('malformed');
    expect(
      assistantFinalSchema.safeParse({ kind: 'done', message: null }).success,
    ).toBe(true);
    expect(projectProviderSchema(assistantJsonSchema('final'))).toBeDefined();
  });
  it('preserves a requested catalogue size in the actual fixed-work search instead of resizing an existing piece', () => {
    const room = commandRoom([piece('desk', 4000, 4000)], [windowFeature()]);
    const task = resolveAssistantTask(
      room,
      'Add a desk width 140 cm depth 60 cm',
      null,
      'exact-add',
    );
    expect(task.goal?.additions[0]?.size).toEqual({
      width: 1400,
      depth: 600,
      height: 740,
    });
    const search = new LayoutSearch(
      {
        identity: assistantInput(room, '').identity,
        room,
        goal: task.goal!,
        seed: 42,
        maxNodes: 2000,
      },
      task.scope,
    );
    while (!search.step()) {
      /* bounded deterministic search */
    }
    const candidate = search.finish().candidate;
    expect(candidate).not.toBeNull();
    const result = evaluateScopedBatch(room, candidate!.actions, task.scope);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.furniture[0]).toEqual(room.furniture[0]);
      expect(result.room.furniture[1]!.dimensions.width.value).toBe(1400);
    }
  });
  it('asks design questions without converting them into an unrequested palette preview', () => {
    const room = commandRoom();
    expect(
      resolveMedyRequest(
        room,
        'How can I make this room tidy and modern?',
        null,
      ),
    ).toBeNull();
    expect(
      resolveAssistantTask(
        room,
        'How can I make this room tidy and modern?',
        null,
        'question',
      ).kind,
    ).toBe('conversation');
  });
  it.each([
    'How do I rotate the bed 90 degrees?',
    'How can I change the bed width to 180 cm?',
    'Can you recommend a modern room palette?',
    'Could you confirm whether the bed width is 180 cm?',
    'Confirm if the room height is 2.7 m',
    'Can you verify if this bed is 180 cm wide?',
  ])('keeps a question separate from an edit: %s', (request) => {
    const room = commandRoom([
      piece('bed', 3000, 3000, { catalogueId: 'procedural-bed' }),
    ]);
    expect(resolveMedyRequest(room, request, null)).toBeNull();
    expect(resolveAssistantTask(room, request, null, 'question').kind).toBe(
      'conversation',
    );
  });
  it('carries a requested modern furnishing style into one coordinated neutral proposal scope', () => {
    const task = resolveAssistantTask(
      commandRoom(),
      'I need a bed, desk, chair and wardrobe in a modern style',
      null,
      'modern',
    );
    expect(task.extraFinish).toEqual({
      type: 'room-finish',
      floorFinish: 'walnut',
      wallFinish: 'ivory',
    });
    expect(
      task.goal?.additions.every((piece) => piece.finish === 'walnut'),
    ).toBe(true);
    expect(
      task.scope.actionKinds.filter((kind) => kind === 'room-finish'),
    ).toHaveLength(1);
  });
  it('uses an allow-listed no-actions conversational schema on the wire', () => {
    const request: ProviderRequest = {
      instructions: 'MEDY',
      input: [],
      tools: [],
      format: {
        name: 'room_medy_conversation_1',
        schema: projectProviderSchema(assistantJsonSchema('final')),
      },
    };
    expect(JSON.parse(responseBody(request, 'fixture-model')).tools).toEqual(
      [],
    );
  });
});

it('grounds proactive work-zone advice and three next choices in the supported catalogue and actual partial-room gaps', async () => {
  const room = createRoomFixture('partial'),
    before = structuredClone(room),
    captured: ProviderRequest[] = [];
  const result = await createAssistantHandler(vi.fn(), identityIds())(
    assistantInput(
      room,
      'Suggest how to organize a work zone by the north window while keeping the bed and wardrobe.',
    ),
    {
      signal: new AbortController().signal,
      call: (request) => {
        captured.push(request);
        return assistantFakeResponse(request, new AbortController().signal);
      },
    },
  );
  expect(result.kind).toBe('completed');
  expect(result.assistant?.summary).toMatch(/no desk|add a desk and chair/i);
  expect(result.assistant?.suggestions).toHaveLength(3);
  expect(
    result.assistant?.suggestions?.some(
      (choice) => choice.request === 'I need a desk and chair near the window',
    ),
  ).toBe(true);
  expect(result.assistant?.actions).toBeNull();
  expect(captured).toHaveLength(1);
  const content = captured[0]!.input[0]!.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    throw new Error('fixture');
  const context = JSON.parse(content[0].text);
  expect(
    context.furnitureOptions.some(
      (entry: { id: string }) => entry.id === 'floor-lamp',
    ),
  ).toBe(true);
  expect(context.designOpportunities[0].catalogueIds).toEqual([
    'procedural-desk',
    'procedural-chair',
  ]);
  expect(
    context.designOpportunities.some((option: { catalogueIds: string[] }) =>
      option.catalogueIds.includes('procedural-bed'),
    ),
  ).toBe(false);
  expect(room).toEqual(before);
});

it('gives a plain manual room real material opportunities and reviewed texture requests in one advice round', async () => {
  const room = createManualRoom('partial'),
    before = structuredClone(room),
    captured: ProviderRequest[] = [];
  const result = await createAssistantHandler(vi.fn(), identityIds())(
    assistantInput(
      room,
      'How can I make this plain room feel warmer with textures?',
    ),
    {
      signal: new AbortController().signal,
      call: (request) => {
        captured.push(request);
        return assistantFakeResponse(request, new AbortController().signal);
      },
    },
  );
  expect(result.kind).toBe('completed');
  expect(result.assistant?.summary).toMatch(/oak planks|wood frame/i);
  expect(result.assistant?.actions).toBeNull();
  expect(result.assistant?.suggestions).toHaveLength(3);
  expect(
    result.assistant?.suggestions?.some(
      (choice) =>
        choice.request === 'Change floor texture to wood planks in oak',
    ),
  ).toBe(true);
  expect(captured).toHaveLength(1);
  const content = captured[0]!.input[0]!.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    throw new Error('fixture');
  const context = JSON.parse(content[0].text);
  expect(
    context.materialOpportunities
      .map((choice: { label: string }) => choice.label)
      .slice(0, 3),
  ).toEqual(['Try oak flooring', 'Wood for the bed', 'Wood for the wardrobe']);
  expect(captured[0]!.instructions).toMatch(
    /changing the colour alone does not add texture/i,
  );
  expect(room).toEqual(before);
});
