import {
  healthSchema,
  publicConfigSchema,
  readySchema,
  safeErrorSchema,
} from '@roomedy/contracts/api';
import { POLICY } from '@roomedy/contracts/policy';

export type PublicOperation = 'health' | 'ready' | 'config';
const schemas = {
  health: healthSchema,
  ready: readySchema,
  config: publicConfigSchema,
};
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

/** Fixed GET operations only. Response bytes and fragment count are both bounded. */
export async function bridgeGet(
  operation: PublicOperation,
  origin: string,
  requestSignal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const timeout = AbortSignal.timeout(POLICY.bridgeMs);
  const signal = AbortSignal.any([requestSignal, timeout]);
  try {
    if (!Object.hasOwn(schemas, operation))
      throw new Error('invalid-operation');
    const url = new URL(origin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.origin !== origin ||
      url.username ||
      url.password
    )
      throw new Error('invalid-origin');
    const result = await fetcher(new URL(`/v1/${operation}`, url), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'error',
      signal,
      headers: { Accept: 'application/json' },
    });
    reader = result.body?.getReader();
    if (
      !result.ok ||
      !reader ||
      !/^application\/json(?:\s*;|$)/i.test(
        result.headers.get('content-type') ?? '',
      )
    )
      throw new Error('invalid-response');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let fragments = 0;
    let text = '';
    while (true) {
      const chunk = await reader.read();
      if (signal.aborted) throw new Error('aborted');
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      fragments++;
      if (
        bytes > POLICY.publicResponseBytes ||
        fragments > POLICY.publicResponseFragments
      )
        throw new Error('response-limit');
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const data = schemas[operation].parse(JSON.parse(text));
    return Response.json(data, { headers });
  } catch {
    const error = safeErrorSchema.parse({
      error: {
        code: 'upstream-unavailable',
        message: 'The service is unavailable. Please try again shortly.',
        reference: 'bridge-request',
        retryable: true,
      },
    });
    return Response.json(error, { status: 503, headers });
  } finally {
    if (reader) {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
}
