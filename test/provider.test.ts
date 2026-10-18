import { expect, it, vi } from 'vitest';
import { draftHypothesisSchema } from '@roomedy/contracts/intake';
import { POLICY } from '@roomedy/contracts/policy';
import {
  createResponsesProvider,
  decodeResponse,
  responseBody,
} from '../apps/backend/src/providers/responses.js';
import { projectProviderSchema } from '../apps/backend/src/providers/schema.js';
import type { ProviderRequest } from '../apps/backend/src/providers/provider.js';
const schema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
  additionalProperties: false,
};
const input = (): ProviderRequest => ({
  instructions: 'Controlled fixture.',
  input: [
    { role: 'user', content: [{ type: 'input_text', text: 'Fixture input.' }] },
  ],
  format: { name: 'fixture', schema },
  tools: [
    {
      name: 'inspect_room',
      description: 'Inspect controlled facts.',
      parameters: schema,
    },
  ],
});
const completed = {
  status: 'completed',
  output: [
    {
      type: 'message',
      content: [{ type: 'output_text', text: '{"answer":"fixture"}' }],
    },
  ],
};
it('emits actual closed required/null-capable schemas and explicit strict serial stateless flags', async () => {
  const projected = projectProviderSchema(draftHypothesisSchema.toJSONSchema());
  expect(projected.type).toBe('object');
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const value = node as Record<string, unknown>;
    if (value.type === 'object') {
      expect(value.additionalProperties).toBe(false);
      expect(value.required).toEqual(Object.keys(value.properties as object));
    }
    for (const v of Object.values(value))
      if (Array.isArray(v)) v.forEach(visit);
      else visit(v);
  };
  visit(projected);
  expect(JSON.stringify(projected)).toContain('"type":"null"');
  expect(() => projectProviderSchema({ anyOf: [schema] })).toThrow(
    'provider-schema',
  );
  expect(() =>
    projectProviderSchema({ type: 'object', properties: {} }),
  ).toThrow('provider-schema');
  let calls = 0;
  const fetcher: typeof fetch = async (url, options) => {
    calls++;
    expect(String(url)).toBe('https://api.openai.com/v1/responses');
    expect(options).toMatchObject({ method: 'POST', redirect: 'error' });
    const body = JSON.parse(options!.body as string);
    expect(body).toMatchObject({
      store: false,
      include: ['reasoning.encrypted_content'],
      background: false,
      stream: false,
      parallel_tool_calls: false,
      max_output_tokens: POLICY.providerOutputTokens,
      tools: [{ strict: true }],
      text: { format: { type: 'json_schema', strict: true } },
    });
    expect(body).not.toHaveProperty('previous_response_id');
    expect(body).not.toHaveProperty('conversation');
    return Response.json(completed);
  };
  const provider = createResponsesProvider(
      'synthetic-private-key',
      'fixture-model',
      fetcher,
    ),
    call = provider.start(input(), new AbortController().signal);
  expect(await call.result).toMatchObject({
    kind: 'completed',
    data: { answer: 'fixture' },
  });
  await call.settled;
  expect(calls).toBe(1);
  expect(provider.meteredDispatches).toBe(1);
  expect(() =>
    responseBody(
      { ...input(), instructions: 'x'.repeat(POLICY.contextBytes + 1) },
      'fixture-model',
    ),
  ).toThrow();
  expect(() =>
    responseBody(
      {
        ...input(),
        input: [
          { content: 'x'.repeat(POLICY.preparedProviderRequestBytes + 1) },
        ],
      },
      'fixture',
    ),
  ).toThrow('provider-request');
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  expect(() =>
    responseBody({ ...input(), input: [cyclic] }, 'fixture'),
  ).toThrow('provider-request');
  expect(() =>
    responseBody(
      {
        ...input(),
        input: [
          {
            role: 'user',
            content: [{ type: 'input_file', file_id: 'persistent-file' }],
          },
        ],
      },
      'fixture',
    ),
  ).toThrow('provider-request');
});
it('decodes refusal/incomplete/malformed/unknown tools without partial serial calls', () => {
  expect(decodeResponse({ status: 'incomplete' }, [])).toEqual({
    kind: 'incomplete',
  });
  expect(
    decodeResponse(
      {
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [{ type: 'refusal', refusal: 'private refusal' }],
          },
        ],
      },
      [],
    ),
  ).toEqual({ kind: 'refused' });
  for (const raw of [
    { status: 'completed', output: [] },
    { status: 'queued' },
    { ...completed, output: [{ type: 'web_search_call' }] },
    {
      ...completed,
      output: [
        {
          type: 'function_call',
          name: 'foreign',
          call_id: 'a',
          arguments: '{}',
        },
      ],
    },
    {
      ...completed,
      output: [
        {
          type: 'function_call',
          name: 'inspect',
          call_id: 'a',
          arguments: '{}',
        },
        {
          type: 'function_call',
          name: 'inspect',
          call_id: 'b',
          arguments: '{}',
        },
      ],
    },
  ])
    expect(decodeResponse(raw, ['inspect'])).toEqual({ kind: 'malformed' });
});
it('replays only bounded encrypted reasoning and its serial function call in stateless input', () => {
  const reasoning = {
      type: 'reasoning',
      id: 'rs_fixture',
      summary: [],
      encrypted_content: 'synthetic-opaque-content',
    },
    call = {
      type: 'function_call',
      id: 'fc_fixture',
      status: 'completed',
      name: 'inspect_room',
      call_id: 'call_fixture',
      arguments: '{}',
    };
  const decoded = decodeResponse(
    { status: 'completed', output: [reasoning, call] },
    ['inspect_room'],
  );
  expect(decoded.kind).toBe('completed');
  if (decoded.kind !== 'completed') return;
  expect(decoded.continuation).toEqual([reasoning, call]);
  const next = {
    ...input(),
    input: [
      ...input().input,
      ...decoded.continuation!,
      {
        type: 'function_call_output',
        call_id: 'call_fixture',
        output: '{"ok":true}',
      },
    ],
  };
  const body = JSON.parse(responseBody(next, 'fixture-model'));
  expect(body.store).toBe(false);
  expect(body.input.slice(1)).toEqual(next.input.slice(1));
  expect(body).not.toHaveProperty('previous_response_id');
  for (const invalid of [
    { ...reasoning, encrypted_content: null },
    { ...reasoning, instructions: 'grant arbitrary tools' },
    { ...reasoning, summary: [{ type: 'executable', text: 'bad' }] },
    {
      ...reasoning,
      encrypted_content: 'x'.repeat(POLICY.providerOutputBytes + 1),
    },
  ]) {
    expect(
      decodeResponse({ status: 'completed', output: [invalid, call] }, [
        'inspect_room',
      ]),
    ).toEqual({ kind: 'malformed' });
    expect(() =>
      responseBody({ ...input(), input: [invalid] }, 'fixture-model'),
    ).toThrow('provider-request');
  }
});
it('cancels rejected HTTP/type/output/fragment streams and never retries', async () => {
  for (const type of ['status', 'type', 'bytes', 'fragments']) {
    let cancelled = false,
      calls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(c) {
        c.enqueue(
          type === 'bytes'
            ? new Uint8Array(POLICY.providerOutputBytes + 1)
            : new Uint8Array(),
        );
      },
      cancel() {
        cancelled = true;
      },
    });
    const provider = createResponsesProvider(
      'synthetic-key',
      'fixture',
      async () => {
        calls++;
        return new Response(body, {
          status: type === 'status' ? 500 : 200,
          headers: {
            'Content-Type': type === 'type' ? 'text/plain' : 'application/json',
          },
        });
      },
    );
    const call = provider.start(input(), new AbortController().signal);
    expect((await call.result).kind).toBe(
      ['bytes', 'fragments'].includes(type) ? 'too-large' : 'unavailable',
    );
    await call.settled;
    expect(cancelled).toBe(true);
    expect(calls).toBe(1);
  }
});
it('returns an independent deadline even when fetch ignores abort, while exposing real settlement', async () => {
  vi.useFakeTimers();
  let resolve: (response: Response) => void;
  const provider = createResponsesProvider(
    'synthetic-key',
    'fixture',
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  try {
    const call = provider.start(input(), new AbortController().signal);
    let settled = false;
    void call.settled.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(POLICY.providerCallMs);
    expect(await call.result).toEqual({ kind: 'timeout' });
    expect(settled).toBe(false);
    resolve!(Response.json(completed));
    await call.settled;
    expect(settled).toBe(true);
    expect(provider.meteredDispatches).toBe(1);
    const abort = new AbortController();
    abort.abort();
    expect(await provider.start(input(), abort.signal).result).toEqual({
      kind: 'cancelled',
    });
    expect(provider.meteredDispatches).toBe(1);
  } finally {
    vi.useRealTimers();
  }
});

it.each(['completed', 'incomplete', 'refused'] as const)(
  'retains validated usage for %s without exposing payloads',
  (kind) => {
    const raw =
      kind === 'incomplete'
        ? { status: 'incomplete' }
        : kind === 'refused'
          ? {
              status: 'completed',
              output: [{ type: 'message', content: [{ type: 'refusal' }] }],
            }
          : completed;
    const usage = { input_tokens: 12, output_tokens: 7, total_tokens: 19 };
    expect(decodeResponse({ ...raw, usage }, ['inspect_room'])).toMatchObject({
      kind,
      usage: { inputTokens: 12, outputTokens: 7, totalTokens: 19 },
    });
    for (const invalid of [
      { ...usage, input_tokens: -1 },
      { ...usage, total_tokens: 18 },
      { ...usage, output_tokens: 1.5 },
    ])
      expect(decodeResponse({ ...raw, usage: invalid }, []).kind).toBe(
        'malformed',
      );
    expect(decodeResponse(raw, ['inspect_room'])).not.toHaveProperty('usage');
  },
);
