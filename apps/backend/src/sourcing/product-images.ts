import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import type { RequestOptions } from 'node:https';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import { evidenceUrl } from '../providers/web-search.js';

const MAX_HTML = 512 * 1024;
export type ProductImageLookup = (
  url: string,
  signal: AbortSignal,
) => Promise<string | null>;
type Address = { address: string; family: number };
type Resolve = (host: string) => Promise<Address[]>;
type Read = (
  url: URL,
  address: string,
  signal: AbortSignal,
) => Promise<string | null>;

/** IPv4-only transport: reject local, reserved and mixed public/private DNS answers. */
export function publicProductAddress(address: string) {
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
function entities(value: string) {
  return value.replace(
    /&(?:amp|quot|apos|lt|gt|#\d{1,7}|#x[0-9a-f]{1,6});/gi,
    (token) => {
      const key = token.slice(1, -1).toLowerCase();
      const named: Record<string, string> = {
        amp: '&',
        quot: '"',
        apos: "'",
        lt: '<',
        gt: '>',
      };
      if (named[key]) return named[key];
      const code = key.startsWith('#x')
        ? parseInt(key.slice(2), 16)
        : parseInt(key.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    },
  );
}
/** Read actual published metadata; never infer a product asset path. */
export function productImageFromHtml(html: string, page: URL) {
  if (html.length > MAX_HTML) return null;
  let count = 0;
  for (const match of html.matchAll(/<meta\b[^>]{0,4096}>/gi)) {
    if (++count > 256) break;
    const attrs = new Map<string, string>();
    for (const attr of match[0].matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
    ))
      attrs.set(attr[1]!.toLowerCase(), entities(attr[2] ?? attr[3] ?? ''));
    const kind = (
      attrs.get('property') ??
      attrs.get('name') ??
      ''
    ).toLowerCase();
    if (
      ![
        'og:image',
        'og:image:secure_url',
        'twitter:image',
        'twitter:image:src',
      ].includes(kind)
    )
      continue;
    try {
      const image = safeProductImage(
        new URL(attrs.get('content') ?? '', page).href,
      );
      if (image && evidenceUrl(image) !== evidenceUrl(page.href)) return image;
    } catch {
      /* Invalid optional metadata contributes no image. */
    }
  }
  return null;
}
/** No redirects, cookies, authentication, proxy or connection reuse; TLS keeps the merchant hostname. */
const readPinned: Read = (url, address, signal) =>
  new Promise((resolve) => {
    let done = false,
      html = '',
      bytes = 0,
      fragments = 0;
    const decoder = new TextDecoder();
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      resolve(value);
      req.destroy();
    };
    const connection: RequestOptions & { autoSelectFamily: boolean } = {
      method: 'GET',
      agent: false,
      family: 4,
      autoSelectFamily: false,
      signal,
      servername: url.hostname,
      rejectUnauthorized: true,
      maxHeaderSize: 16384,
      lookup: (_host, _options, callback) => callback(null, address, 4),
      headers: {
        Accept: 'text/html',
        'Accept-Encoding': 'identity',
        'User-Agent': 'Roomedy/0.1 product preview',
      },
    };
    const req = request(url, connection, (response) => {
      const type = response.headers['content-type'];
      const encoding = response.headers['content-encoding'];
      if (
        response.statusCode !== 200 ||
        typeof type !== 'string' ||
        !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(type) ||
        (encoding && encoding !== 'identity')
      ) {
        response.destroy();
        finish(null);
        return;
      }
      response.on('data', (chunk: Buffer) => {
        if (done) return;
        bytes += chunk.length;
        if (++fragments > 128 || bytes > MAX_HTML) {
          response.destroy();
          finish(null);
          return;
        }
        html += decoder.decode(chunk, { stream: true });
        const image = productImageFromHtml(html, url);
        if (image || /<\/head\s*>/i.test(html)) {
          response.destroy();
          finish(html);
        }
      });
      response.once('end', () => finish(html));
      response.once('error', () => finish(null));
    });
    req.once('error', () => finish(null));
    req.end();
  });

/** Called only for operation-cited priced product pages. Construction performs no I/O. */
export function createProductImageLookup(
  resolve: Resolve = (host) => lookup(host, { all: true, family: 4 }),
  read: Read = readPinned,
): ProductImageLookup {
  return async (raw, parent) => {
    const safe = safeProductImage(raw);
    if (!safe || parent.aborted) return null;
    const url = new URL(safe);
    const deadline = new AbortController();
    const signal = AbortSignal.any([parent, deadline.signal]);
    const timer = setTimeout(() => deadline.abort(), 6000);
    let onAbort = () => {};
    const aborted = new Promise<null>((resolve) => {
      onAbort = () => resolve(null);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
    try {
      const work = (async () => {
        const addresses = await resolve(url.hostname);
        if (
          signal.aborted ||
          !addresses.length ||
          addresses.length > 16 ||
          addresses.some(
            (item) => item.family !== 4 || !publicProductAddress(item.address),
          )
        )
          return null;
        const html = await read(url, addresses[0]!.address, signal);
        return !signal.aborted && html ? productImageFromHtml(html, url) : null;
      })().catch(() => null);
      return await Promise.race([work, aborted]);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      deadline.abort();
    }
  };
}
