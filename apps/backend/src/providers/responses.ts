import { readSearchAction } from './web-search.js';
import type { SearchEvidence } from './web-search.js';
import { POLICY } from '@roomedy/contracts/policy';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { projectProviderSchema } from './schema.js';
import { ROOMEDY_MODEL } from './model.js';
import type {
  ProviderPort,
  ProviderRequest,
  ProviderOutcome,
} from './provider.js';
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const keys = (value: Record<string, unknown>, allowed: readonly string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
export type ProviderShapeFailure =
  | 'request'
  | 'envelope'
  | 'reasoning'
  | 'function-call'
  | 'content'
  | 'json'
  | 'usage';
type ShapeReporter = (stage: ProviderShapeFailure) => void;
function functionItem(
  item: Record<string, unknown>,
  tools?: readonly string[],
) {
  return (
    keys(item, [
      'type',
      'id',
      'status',
      'name',
      'call_id',
      'arguments',
      'async',
      'caller',
      'namespace',
    ]) &&
    item.type === 'function_call' &&
    (item.id === undefined ||
      (typeof item.id === 'string' && item.id.length <= 120)) &&
    [undefined, 'completed'].includes(item.status as string | undefined) &&
    [undefined, false].includes(item.async as false | undefined) &&
    (item.caller === undefined ||
      item.caller === null ||
      (object(item.caller) &&
        keys(item.caller, ['type']) &&
        item.caller.type === 'direct')) &&
    (item.namespace === undefined ||
      item.namespace === null ||
      (typeof item.namespace === 'string' &&
        /^[A-Za-z0-9_-]{0,64}$/.test(item.namespace))) &&
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    item.name.length <= 64 &&
    (!tools || tools.includes(item.name)) &&
    typeof item.call_id === 'string' &&
    item.call_id.length > 0 &&
    item.call_id.length <= 80 &&
    typeof item.arguments === 'string' &&
    item.arguments.length <= POLICY.providerOutputBytes
  );
}
function reasoningItem(item: Record<string, unknown>) {
  return (
    keys(item, [
      'type',
      'id',
      'summary',
      'encrypted_content',
      'status',
      'content',
    ]) &&
    item.type === 'reasoning' &&
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    item.id.length <= 120 &&
    typeof item.encrypted_content === 'string' &&
    item.encrypted_content.length > 0 &&
    item.encrypted_content.length <= POLICY.providerOutputBytes &&
    [undefined, 'completed'].includes(item.status as string | undefined) &&
    (item.content === undefined ||
      (Array.isArray(item.content) &&
        item.content.length <= 8 &&
        item.content.every(
          (part: unknown) =>
            object(part) &&
            keys(part, ['type', 'text']) &&
            part.type === 'reasoning_text' &&
            typeof part.text === 'string' &&
            part.text.length <= POLICY.contextBytes,
        ))) &&
    Array.isArray(item.summary) &&
    item.summary.length <= 8 &&
    item.summary.every(
      (part: unknown) =>
        object(part) &&
        keys(part, ['type', 'text']) &&
        part.type === 'summary_text' &&
        typeof part.text === 'string' &&
        part.text.length <= POLICY.contextBytes,
    )
  );
}
/** Bound plain context before JSON serialization can create a large escaped copy. */
function checkRequestValue(raw: unknown) {
  let nodes = 0,
    bytes = 0;
  const parents = new Set<object>();
  const text = (value: string) => {
    if (value.length > POLICY.preparedProviderRequestBytes)
      throw new Error('provider-request');
    bytes += Buffer.byteLength(value) + 2;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 32) bytes += 5;
      else if (code === 34 || code === 92) bytes++;
      if (bytes > POLICY.preparedProviderRequestBytes)
        throw new Error('provider-request');
    }
  };
  const visit = (value: unknown, depth: number) => {
    if (++nodes > 100_000 || depth > 24) throw new Error('provider-request');
    if (typeof value === 'string') text(value);
    else if (
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    )
      bytes += 24;
    else if (typeof value === 'object' && value !== null) {
      if (
        parents.has(value) ||
        (!Array.isArray(value) &&
          Object.getPrototypeOf(value) !== Object.prototype &&
          Object.getPrototypeOf(value) !== null)
      )
        throw new Error('provider-request');
      parents.add(value);
      bytes += 2;
      for (const [key, descriptor] of Object.entries(
        Object.getOwnPropertyDescriptors(value),
      )) {
        if (Array.isArray(value) && key === 'length') continue;
        if (!Object.hasOwn(descriptor, 'value'))
          throw new Error('provider-request');
        if (!Array.isArray(value)) text(key);
        bytes += 2;
        visit(descriptor.value, depth + 1);
      }
      parents.delete(value);
    } else throw new Error('provider-request');
    if (bytes > POLICY.preparedProviderRequestBytes)
      throw new Error('provider-request');
  };
  visit(raw, 0);
}
function checkInputItems(input: ProviderRequest['input']) {
  if (input.length > POLICY.contextTurns + 2 * POLICY.toolCalls + 2)
    throw new Error('provider-request');
  let images = 0;
  for (const item of input) {
    if (item.type === 'reasoning') {
      if (!reasoningItem(item)) throw new Error('provider-request');
    } else if (item.type === 'function_call') {
      if (!functionItem(item)) throw new Error('provider-request');
    } else if (item.type === 'function_call_output') {
      if (
        !keys(item, ['type', 'call_id', 'output']) ||
        typeof item.call_id !== 'string' ||
        typeof item.output !== 'string'
      )
        throw new Error('provider-request');
    } else {
      if (
        !keys(item, ['role', 'content']) ||
        !['user', 'assistant'].includes(String(item.role)) ||
        !Array.isArray(item.content) ||
        item.content.length > POLICY.photos * 2 + 1
      )
        throw new Error('provider-request');
      for (const part of item.content) {
        if (!object(part)) throw new Error('provider-request');
        if (part.type === 'input_image') {
          if (
            ++images > POLICY.photos ||
            !keys(part, ['type', 'image_url', 'detail']) ||
            typeof part.image_url !== 'string' ||
            !part.image_url.startsWith('data:image/jpeg;base64,') ||
            !['auto', 'low', 'high', undefined].includes(
              part.detail as string | undefined,
            )
          )
            throw new Error('provider-request');
        } else if (
          !['input_text', 'output_text'].includes(String(part.type)) ||
          !keys(part, ['type', 'text']) ||
          typeof part.text !== 'string'
        )
          throw new Error('provider-request');
      }
    }
  }
}
export function responseBody(input: ProviderRequest, model: string) {
  if (
    !/^[A-Za-z0-9._:-]{1,120}$/.test(model) ||
    input.instructions.length > POLICY.contextBytes ||
    input.tools.length > POLICY.toolCalls ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(input.format.name)
  )
    throw new Error('provider-request');
  if (
    input.search &&
    (input.format.name !== 'room_sourcing_1' ||
      input.tools.length ||
      !/^[A-Z]{2}$/.test(input.search.country) ||
      !input.search.city.trim() ||
      input.search.city.length > 80)
  )
    throw new Error('provider-request');
  const tools = input.tools.map((tool) => {
    if (
      !/^[A-Za-z0-9_-]{1,64}$/.test(tool.name) ||
      tool.description.length > 2000
    )
      throw new Error('provider-request');
    return {
      type: 'function',
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: projectProviderSchema(tool.parameters),
    };
  });
  const request = {
    model,
    instructions: input.instructions,
    input: input.input,
    store: false,
    include: input.search
      ? ['reasoning.encrypted_content', 'web_search_call.action.sources']
      : ['reasoning.encrypted_content'],
    background: false,
    stream: false,
    parallel_tool_calls: false,
    max_output_tokens: POLICY.providerOutputTokens,
    tools: input.search
      ? [
          {
            type: 'web_search',
            search_context_size: 'low',
            user_location: {
              type: 'approximate',
              country: input.search.country,
              city: input.search.city,
            },
          },
        ]
      : tools,
    ...(input.search ? { max_tool_calls: 4 } : {}),
    tool_choice: input.search ? 'required' : tools.length ? 'auto' : 'none',
    text: {
      format: {
        type: 'json_schema',
        name: input.format.name,
        strict: true,
        schema: projectProviderSchema(input.format.schema),
      },
    },
  };
  checkRequestValue(request);
  checkInputItems(input.input);
  const body = JSON.stringify(request);
  if (Buffer.byteLength(body) > POLICY.preparedProviderRequestBytes)
    throw new Error('provider-request');
  return body;
}
export function decodeResponse(
  raw: unknown,
  tools: readonly string[],
  report?: ShapeReporter,
  search = false,
): ProviderOutcome {
  const result = decodePayload(raw, tools, report, search);
  if (!object(raw) || raw.usage === undefined || raw.usage === null)
    return result;
  const u = raw.usage;
  if (
    !object(u) ||
    ![u.input_tokens, u.output_tokens, u.total_tokens].every(
      (n) =>
        Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 1_000_000_000,
    ) ||
    Number(u.input_tokens) + Number(u.output_tokens) !== u.total_tokens
  ) {
    report?.('usage');
    return { kind: 'malformed' };
  }
  return {
    ...result,
    usage: {
      inputTokens: Number(u.input_tokens),
      outputTokens: Number(u.output_tokens),
      totalTokens: Number(u.total_tokens),
    },
  };
}
function decodePayload(
  raw: unknown,
  tools: readonly string[],
  report: ShapeReporter | undefined,
  search: boolean,
): ProviderOutcome {
  const invalid = (stage: ProviderShapeFailure): ProviderOutcome => {
    report?.(stage);
    return { kind: 'malformed' };
  };
  if (!object(raw)) return invalid('envelope');
  if (raw.status === 'incomplete') return { kind: 'incomplete' };
  if (
    raw.status !== 'completed' ||
    !Array.isArray(raw.output) ||
    raw.output.length > POLICY.toolCalls + 4
  )
    return invalid('envelope');
  let text = '';
  const searchEvidence: SearchEvidence = { calls: 0, opened: [], sources: [] };
  const calls: Extract<ProviderOutcome, { kind: 'completed' }>['calls'] = [];
  const continuation: Record<string, unknown>[] = [];
  for (const item of raw.output) {
    if (!object(item)) return invalid('envelope');
    if (item.type === 'web_search_call') {
      if (!search || !readSearchAction(item, searchEvidence))
        return invalid('envelope');
      continue;
    }
    if (item.type === 'reasoning') {
      if (!reasoningItem(item)) return invalid('reasoning');
      continuation.push(item);
      continue;
    }
    if (item.type === 'function_call') {
      if (!functionItem(item, tools)) return invalid('function-call');
      try {
        calls.push({
          name: item.name as string,
          callId: item.call_id as string,
          arguments: JSON.parse(item.arguments as string),
        });
        continuation.push(item);
      } catch {
        return invalid('json');
      }
      if (calls.length > 1) return invalid('function-call');
    } else if (item.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (!object(part)) return invalid('content');
        if (part.type === 'refusal') return { kind: 'refused' };
        if (part.type !== 'output_text' || typeof part.text !== 'string')
          return invalid('content');
        text += part.text;
      }
    } else return invalid('envelope');
  }
  if ((calls.length && text) || (!calls.length && !text))
    return invalid('content');
  try {
    return {
      kind: 'completed',
      data: text ? JSON.parse(text) : null,
      calls,
      ...(calls.length ? { continuation } : {}),
      ...(search ? { search: searchEvidence } : {}),
    };
  } catch {
    return invalid('json');
  }
}
/** Fixed endpoint and one native fetch attempt. Construction/import performs no I/O. */
export function createResponsesProvider(
  key: string,
  model: string = ROOMEDY_MODEL,
  fetcher: typeof fetch = fetch,
  report?: ShapeReporter,
): ProviderPort {
  if (!key || key.length > 4096 || /[\r\n]/.test(key))
    throw new Error('provider-configuration');
  let dispatched = 0;
  return {
    kind: 'live',
    get meteredDispatches() {
      return dispatched;
    },
    start(input, parent) {
      let body: string;
      try {
        body = responseBody(input, model);
      } catch (error) {
        report?.('request');
        throw error;
      }
      const controller = new AbortController();
      let resolveResult: (result: ProviderOutcome) => void;
      let done = false;
      const result = new Promise<ProviderOutcome>((resolve) => {
        resolveResult = resolve;
      });
      const finish = (value: ProviderOutcome) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        parent.removeEventListener('abort', cancel);
        resolveResult(value);
      };
      const cancel = () => {
        controller.abort();
        finish({ kind: 'cancelled' });
      };
      const timer = setTimeout(() => {
        controller.abort();
        finish({ kind: 'timeout' });
      }, POLICY.providerCallMs);
      if (parent.aborted) {
        cancel();
        return { result, settled: Promise.resolve() };
      }
      parent.addEventListener('abort', cancel, { once: true });
      dispatched++;
      const settled = (async () => {
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        const packed = new BoundedBytes(
          POLICY.providerOutputBytes,
          POLICY.providerOutputFragments,
        );
        try {
          const response = await fetcher(
            'https://api.openai.com/v1/responses',
            {
              method: 'POST',
              redirect: 'error',
              signal: controller.signal,
              headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body,
            },
          );
          reader = response.body?.getReader();
          if (
            !response.ok ||
            !reader ||
            !/^application\/json(?:\s*;|$)/i.test(
              response.headers.get('content-type') ?? '',
            )
          ) {
            finish({ kind: 'unavailable' });
            return;
          }
          while (true) {
            const part = await reader.read();
            if (controller.signal.aborted) return;
            if (part.done) break;
            try {
              packed.append(part.value);
            } catch {
              finish({ kind: 'too-large' });
              controller.abort();
              return;
            }
          }
          let value: unknown;
          try {
            value = JSON.parse(
              new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
            );
          } catch {
            report?.('json');
            finish({ kind: 'malformed' });
            return;
          }
          finish(
            decodeResponse(
              value,
              input.tools.map((tool) => tool.name),
              report,
              !!input.search,
            ),
          );
        } catch {
          finish({
            kind: controller.signal.aborted ? 'cancelled' : 'unavailable',
          });
        } finally {
          packed.clear();
          if (reader) {
            await reader.cancel().catch(() => undefined);
            reader.releaseLock();
          }
        }
      })();
      return { result, settled: settled.catch(() => undefined) };
    },
  };
}
