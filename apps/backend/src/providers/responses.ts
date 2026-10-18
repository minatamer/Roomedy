import { POLICY } from '@roomedy/contracts/policy';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { projectProviderSchema } from './schema.js';
import type {
  ProviderPort,
  ProviderRequest,
  ProviderOutcome,
} from './provider.js';
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
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
  const keys = (value: Record<string, unknown>, allowed: readonly string[]) =>
    Object.keys(value).every((key) => allowed.includes(key));
  for (const item of input) {
    if (item.type === 'function_call') {
      if (
        !keys(item, ['type', 'name', 'call_id', 'arguments']) ||
        typeof item.name !== 'string' ||
        typeof item.call_id !== 'string' ||
        typeof item.arguments !== 'string'
      )
        throw new Error('provider-request');
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
        item.content.length > POLICY.photos + 2
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
    background: false,
    stream: false,
    parallel_tool_calls: false,
    max_output_tokens: POLICY.providerOutputTokens,
    tools,
    tool_choice: tools.length ? 'auto' : 'none',
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
): ProviderOutcome {
  if (!object(raw)) return { kind: 'malformed' };
  if (raw.status === 'incomplete') return { kind: 'incomplete' };
  if (
    raw.status !== 'completed' ||
    !Array.isArray(raw.output) ||
    raw.output.length > POLICY.toolCalls + 4
  )
    return { kind: 'malformed' };
  let text = '';
  const calls: Extract<ProviderOutcome, { kind: 'completed' }>['calls'] = [];
  for (const item of raw.output) {
    if (!object(item)) return { kind: 'malformed' };
    if (item.type === 'reasoning') continue;
    if (item.type === 'function_call') {
      if (
        typeof item.name !== 'string' ||
        !tools.includes(item.name) ||
        typeof item.call_id !== 'string' ||
        item.call_id.length > 80 ||
        typeof item.arguments !== 'string'
      )
        return { kind: 'malformed' };
      try {
        calls.push({
          name: item.name,
          callId: item.call_id,
          arguments: JSON.parse(item.arguments),
        });
      } catch {
        return { kind: 'malformed' };
      }
      if (calls.length > 1) return { kind: 'malformed' };
    } else if (item.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (!object(part)) return { kind: 'malformed' };
        if (part.type === 'refusal') return { kind: 'refused' };
        if (part.type !== 'output_text' || typeof part.text !== 'string')
          return { kind: 'malformed' };
        text += part.text;
      }
    } else return { kind: 'malformed' };
  }
  if ((calls.length && text) || (!calls.length && !text))
    return { kind: 'malformed' };
  try {
    return { kind: 'completed', data: text ? JSON.parse(text) : null, calls };
  } catch {
    return { kind: 'malformed' };
  }
}
/** Fixed endpoint and one native fetch attempt. Construction/import performs no I/O. */
export function createResponsesProvider(
  key: string,
  model: string,
  fetcher: typeof fetch = fetch,
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
      const body = responseBody(input, model);
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
            finish({ kind: 'malformed' });
            return;
          }
          finish(
            decodeResponse(
              value,
              input.tools.map((tool) => tool.name),
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
