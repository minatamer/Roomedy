import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import { imageHeader } from '@roomedy/contracts/intake';
import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';

const MAX_BYTES = 4 * 1024 * 1024;
type Address = { address: string; family: number };
type Resolve = (host: string) => Promise<Address[]>;
type Read = (
  url: URL,
  address: string,
  signal: AbortSignal,
) => Promise<Uint8Array | null>;
/** Separate frontend server boundary: public IPv4 only, including every DNS answer. */
export function publicPhotoAddress(address: string) {
  if (isIP(address) !== 4) return false;
  const [a = 0, b = 0, c = 0] = address.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
/** TLS uses the original hostname and a pinned public address. No redirects or ambient credentials. */
const readPinned: Read = (url, address, signal) =>
  new Promise((resolve) => {
    const packed = new BoundedBytes(MAX_BYTES, 512);
    let done = false;
    const finish = (value: Uint8Array | null) => {
      if (done) return;
      done = true;
      packed.clear();
      req.destroy();
      resolve(value);
    };
    const req = request(
      url,
      {
        method: 'GET',
        agent: false,
        family: 4,
        signal,
        servername: url.hostname,
        rejectUnauthorized: true,
        maxHeaderSize: 16384,
        lookup: (_host, _options, callback) => callback(null, address, 4),
        headers: {
          Accept: 'image/jpeg,image/png,image/webp',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Roomedy/0.1 selected product photo',
        },
      },
      (res) => {
        if (
          res.statusCode !== 200 ||
          !/^image\/(?:jpeg|png|webp)(?:;|$)/i.test(
            res.headers['content-type'] ?? '',
          ) ||
          (res.headers['content-encoding'] &&
            res.headers['content-encoding'] !== 'identity') ||
          (res.headers['content-length'] &&
            (!/^\d+$/.test(res.headers['content-length']) ||
              Number(res.headers['content-length']) > MAX_BYTES))
        ) {
          res.destroy();
          finish(null);
          return;
        }
        res.on('data', (part: Buffer) => {
          try {
            if (!done) packed.append(part);
          } catch {
            res.destroy();
            finish(null);
          }
        });
        res.once('end', () => {
          if (!done) finish(packed.take());
        });
        res.once('error', () => finish(null));
      },
    );
    req.once('error', () => finish(null));
    req.end();
  });

/** Inert construction; optional exact-image reads never research products or invoke a provider. */
export function createProductPhotoHandler(
  resolve: Resolve = (host) => lookup(host, { all: true, family: 4 }),
  read: Read = readPinned,
) {
  let active = 0;
  return async (request: Request, publicOrigin: string): Promise<Response> => {
    const headers = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    };
    const fail = (status: number) => new Response(null, { status, headers });
    const url = new URL(request.url);
    if (
      request.method !== 'POST' ||
      url.pathname !== '/api/roomedy/v1/product-photo' ||
      url.search
    )
      return fail(400);
    if (
      request.headers.get('origin') !== publicOrigin ||
      ![null, 'same-origin'].includes(request.headers.get('sec-fetch-site'))
    )
      return fail(403);
    if (
      !/^application\/json(?:;|$)/i.test(
        request.headers.get('content-type') ?? '',
      ) ||
      ![null, 'identity'].includes(request.headers.get('content-encoding'))
    )
      return fail(400);
    if (active >= 2) return fail(429);
    active++;
    const controller = new AbortController(),
      signal = AbortSignal.any([request.signal, controller.signal]);
    let onAbort = () => {};
    const stopped = new Promise<Response>((resolve) => {
      onAbort = () => resolve(fail(408));
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
    const timer = setTimeout(() => controller.abort(), 4500);
    const work = (async () => {
      const body = new BoundedBytes(4096, 32),
        reader = request.body?.getReader();
      const cancel = () => {
        void reader?.cancel().catch(() => undefined);
      };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        if (!reader || signal.aborted) return fail(400);
        while (true) {
          const part = await reader.read();
          if (signal.aborted) return fail(408);
          if (part.done) break;
          body.append(part.value);
        }
        const raw: unknown = JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(body.take()),
        );
        if (
          !raw ||
          typeof raw !== 'object' ||
          Object.keys(raw).join() !== 'imageUrl'
        )
          return fail(400);
        const safe = safeProductImage((raw as { imageUrl: unknown }).imageUrl);
        if (!safe) return fail(400);
        const photo = new URL(safe);
        if (photo.port || isIP(photo.hostname)) return fail(400);
        const addresses = await resolve(photo.hostname);
        if (
          signal.aborted ||
          !addresses.length ||
          addresses.length > 16 ||
          addresses.some(
            (a) => a.family !== 4 || !publicPhotoAddress(a.address),
          )
        )
          return fail(404);
        const bytes = await read(photo, addresses[0]!.address, signal);
        if (signal.aborted || !bytes || bytes.byteLength > MAX_BYTES)
          return fail(404);
        const image = imageHeader(bytes);
        return new Response(new Uint8Array(bytes), {
          headers: { ...headers, 'Content-Type': image.type },
        });
      } catch {
        return fail(signal.aborted ? 408 : 404);
      } finally {
        body.clear();
        signal.removeEventListener('abort', cancel);
        cancel();
        reader?.releaseLock();
        active--;
      }
    })();
    try {
      return await Promise.race([work, stopped]);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      controller.abort();
    }
  };
}
