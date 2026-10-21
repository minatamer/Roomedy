import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import { POLICY } from '@roomedy/contracts/policy';
import { errorMessages, safeErrorSchema } from '@roomedy/contracts/api';
import type { SafeError } from '@roomedy/contracts/api';
import {
  admissionInputSchema,
  admissionResultSchema,
  operationRequestSchema,
  operationResultSchema,
} from '@roomedy/contracts/operations';

export type MutationOperation = 'admission' | 'recognize-room' | 'assistant';
const operations = ['admission', 'recognize-room', 'assistant'];
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const failure = (code: SafeError['error']['code'], status: number) =>
  Response.json(
    {
      error: {
        code,
        message: errorMessages[code],
        reference: 'bridge-request',
        retryable: ['busy', 'timeout', 'upstream-unavailable'].includes(code),
      },
    },
    { status, headers },
  );
let active = 0;
async function read(
  stream: ReadableStream<Uint8Array> | null,
  signal: AbortSignal,
  maximum: number,
  fragments: number,
) {
  if (!stream) throw new Error('invalid-input');
  const reader = stream.getReader(),
    packed = new BoundedBytes(maximum, fragments);
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read();
      if (signal.aborted) throw new Error('cancelled');
      if (part.done) break;
      packed.append(part.value);
    }
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
    ) as unknown;
  } finally {
    packed.clear();
    signal.removeEventListener('abort', cancel);
    cancel();
    reader.releaseLock();
  }
}
/** Fixed JSON mutations, with independent visible deadlines and bounded unresolved upstream ownership. */
export async function bridgePost(
  operation: MutationOperation,
  request: Request,
  config: { backendOrigin: string; publicOrigin: string; secret: string },
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  if (
    !operations.includes(operation) ||
    request.method !== 'POST' ||
    url.pathname !== `/api/roomedy/v1/${operation}` ||
    url.search
  )
    return failure('invalid-input', 400);
  if (
    request.headers.get('origin') !== config.publicOrigin ||
    !['same-origin', null].includes(request.headers.get('sec-fetch-site'))
  )
    return failure('forbidden', 403);
  if (!config.secret) return failure('not-available', 503);
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get('content-type') ?? '',
    ) ||
    ![null, 'identity'].includes(request.headers.get('content-encoding'))
  )
    return failure('invalid-input', 400);
  const length = request.headers.get('content-length');
  if (
    length !== null &&
    (!/^\d{1,10}$/.test(length) ||
      Number(length) > POLICY.preparedProviderRequestBytes)
  )
    return failure('body-limit', 413);
  if (active >= POLICY.intakeSlots) return failure('busy', 429);
  let upstream: URL;
  try {
    upstream = new URL(config.backendOrigin);
  } catch {
    return failure('not-available', 503);
  }
  if (
    !['http:', 'https:'].includes(upstream.protocol) ||
    upstream.origin !== config.backendOrigin ||
    upstream.username ||
    upstream.password
  )
    return failure('not-available', 503);
  active++;
  const controller = new AbortController();
  const signal = AbortSignal.any([request.signal, controller.signal]);
  let timer: ReturnType<typeof setTimeout> | undefined,
    bodyTimer: ReturnType<typeof setTimeout> | undefined,
    onAbort: () => void = () => undefined;
  const stop = new Promise<Response>((resolve) => {
    onAbort = () => resolve(failure('cancelled', 408));
    request.signal.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
      resolve(failure('timeout', 504));
      controller.abort();
    }, POLICY.operationBridgeMs);
    bodyTimer = setTimeout(() => {
      resolve(failure('timeout', 408));
      controller.abort();
    }, POLICY.intakeMs);
  });
  const raw = (async () => {
    let readingInput = true;
    try {
      if (signal.aborted) return failure('cancelled', 408);
      const body = await read(
        request.body,
        signal,
        POLICY.preparedProviderRequestBytes,
        POLICY.requestFragments,
      );
      clearTimeout(bodyTimer);
      readingInput = false;
      const parsed =
        operation === 'admission'
          ? admissionInputSchema.safeParse(body)
          : operationRequestSchema.safeParse(body);
      if (
        !parsed.success ||
        (operation !== 'admission' && parsed.data.input.kind !== operation)
      )
        return failure('invalid-input', 400);
      const response = await fetcher(new URL(`/v1/${operation}`, upstream), {
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.secret}`,
          Origin: config.publicOrigin,
        },
        body: JSON.stringify(parsed.data),
      });
      if (
        !/^application\/json(?:\s*;|$)/i.test(
          response.headers.get('content-type') ?? '',
        )
      ) {
        await response.body?.cancel();
        return failure('upstream-unavailable', 503);
      }
      const value = await read(
        response.body,
        signal,
        operation === 'admission'
          ? POLICY.publicResponseBytes
          : POLICY.providerOutputBytes,
        POLICY.providerOutputFragments,
      );
      const error = safeErrorSchema.safeParse(value);
      if (error.success)
        return failure(
          error.data.error.code,
          [400, 403, 408, 409, 413, 429, 500, 503].includes(response.status)
            ? response.status
            : 503,
        );
      const result =
        operation === 'admission'
          ? admissionResultSchema.safeParse(value)
          : operationResultSchema.safeParse(value);
      return response.ok && result.success
        ? Response.json(result.data, { headers })
        : failure('upstream-unavailable', 503);
    } catch (error) {
      if (signal.aborted) return failure('cancelled', 408);
      if (readingInput)
        return failure(
          error instanceof Error && error.message === 'body-limit'
            ? 'body-limit'
            : 'invalid-input',
          error instanceof Error && error.message === 'body-limit' ? 413 : 400,
        );
      return failure('upstream-unavailable', 503);
    } finally {
      active--;
    }
  })();
  try {
    return await Promise.race([raw, stop]);
  } finally {
    clearTimeout(timer);
    clearTimeout(bodyTimer);
    request.signal.removeEventListener('abort', onAbort);
  }
}
