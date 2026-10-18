import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';

/** Server-only directory: one configured audience, fixed metadata host, no credential file. */
export function serviceFetch(
  origin: string,
  mode: string,
  transport: typeof fetch = fetch,
): typeof fetch {
  const audience = new URL(origin);
  if (
    audience.origin !== origin ||
    audience.username ||
    audience.password ||
    !['http:', 'https:'].includes(audience.protocol) ||
    !['none', 'gcp-metadata'].includes(mode) ||
    (mode === 'gcp-metadata' && audience.protocol !== 'https:')
  )
    throw new Error('service-identity');
  let token: string | null = null,
    expires = 0;
  let pending: Promise<string> | null = null;
  const acquire = async () => {
    if (token && Date.now() < expires) return token;
    if (pending) return pending;
    const controller = new AbortController();
    let onAbort = () => undefined as void;
    const stopped = new Promise<never>((_, reject) => {
      onAbort = () => reject(new Error('service-identity'));
      controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    const timer = setTimeout(() => controller.abort(), 2000);
    const actual = (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      const bytes = new BoundedBytes(16_384, 64);
      try {
        const url = new URL(
          'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity',
        );
        url.searchParams.set('audience', origin);
        url.searchParams.set('format', 'full');
        const response = await transport(url, {
          headers: { 'Metadata-Flavor': 'Google' },
          redirect: 'error',
          cache: 'no-store',
          signal: controller.signal,
        });
        reader = response.body?.getReader();
        if (
          controller.signal.aborted ||
          !response.ok ||
          !reader ||
          response.headers.get('metadata-flavor') !== 'Google'
        )
          throw new Error('service-identity');
        while (true) {
          const part = await reader.read();
          controller.signal.throwIfAborted();
          if (part.done) break;
          bytes.append(part.value);
        }
        const value = new TextDecoder('utf-8', { fatal: true }).decode(
          bytes.take(),
        );
        if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value))
          throw new Error('service-identity');
        const claims = JSON.parse(
          Buffer.from(value.split('.')[1]!, 'base64url').toString('utf8'),
        ) as { aud?: unknown; exp?: unknown };
        if (
          claims.aud !== origin ||
          typeof claims.exp !== 'number' ||
          !Number.isSafeInteger(claims.exp) ||
          claims.exp * 1000 < Date.now() + 30_000
        )
          throw new Error('service-identity');
        token = value;
        expires = Math.min(claims.exp * 1000 - 30_000, Date.now() + 30_000);
        return value;
      } finally {
        bytes.clear();
        if (reader) {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
      }
    })();
    // An abort-ignoring metadata operation retains the sole refresh slot until actual settlement.
    pending = Promise.race([actual, stopped]);
    void actual.then(
      () => {
        clearTimeout(timer);
        controller.signal.removeEventListener('abort', onAbort);
        pending = null;
      },
      () => {
        clearTimeout(timer);
        controller.signal.removeEventListener('abort', onAbort);
        pending = null;
      },
    );
    return pending;
  };
  return async (input, init) => {
    const target = new URL(
      input instanceof Request ? input.url : String(input),
    );
    if (target.origin !== origin || target.username || target.password)
      throw new Error('service-identity');
    const headers = new Headers(init?.headers);
    // Never accept a browser/upstream-provided service credential.
    headers.delete('X-Serverless-Authorization');
    if (mode === 'gcp-metadata')
      headers.set('X-Serverless-Authorization', `Bearer ${await acquire()}`);
    return transport(input, { ...init, headers, redirect: 'error' });
  };
}
