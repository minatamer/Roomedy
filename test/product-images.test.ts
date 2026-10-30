import { EventEmitter } from 'node:events';
import { request } from 'node:https';
import type { RequestOptions } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createProductImageLookup,
  productImageFromHtml,
  publicProductAddress,
} from '../apps/backend/src/sourcing/product-images.js';

vi.mock('node:https', () => ({ request: vi.fn() }));
const page = new URL('https://merchant.example/product');
const html =
  '<meta content="https://cdn.example/product.jpg?a=1&amp;b=2" property="og:image">';
const publicDns = async () => [{ address: '8.8.8.8', family: 4 }];
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('bounded public product-image metadata', () => {
  it('reads actual metadata with either attribute order, relative URLs and entities', () => {
    expect(productImageFromHtml(html, page)).toBe(
      'https://cdn.example/product.jpg?a=1&b=2',
    );
    expect(
      productImageFromHtml(
        "<meta name='twitter:image' content='/photo.webp'>",
        page,
      ),
    ).toBe('https://merchant.example/photo.webp');
    expect(
      productImageFromHtml(
        '<meta property="og:image:secure_url" content="https://cdn.example/&#112;.jpg">',
        page,
      ),
    ).toBe('https://cdn.example/p.jpg');
  });
  it('does not guess assets or accept unsafe metadata or the product page as its own image', () => {
    for (const value of [
      'javascript:alert(1)',
      'http://cdn.example/a.jpg',
      'https://127.0.0.1/a.jpg',
      'https://u:p@cdn.example/a.jpg',
      page.href,
    ])
      expect(
        productImageFromHtml(
          `<meta property="og:image" content="${value}">`,
          page,
        ),
      ).toBeNull();
    expect(productImageFromHtml('<img src="/unrelated.jpg">', page)).toBeNull();
    expect(
      productImageFromHtml('x'.repeat(512 * 1024 + 1) + html, page),
    ).toBeNull();
  });
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '127.0.0.1',
    '100.64.0.1',
    '100.127.255.255',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.1',
    '192.0.0.1',
    '192.0.2.1',
    '198.18.0.1',
    '198.19.1.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::ffff:127.0.0.1',
  ])('rejects non-public transport address %s', (address) =>
    expect(publicProductAddress(address)).toBe(false),
  );
  it('performs no I/O during construction and rejects unsafe/mixed DNS before reading', async () => {
    const dns = vi.fn(publicDns),
      read = vi.fn(async () => html),
      lookup = createProductImageLookup(dns, read);
    expect(dns).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
    expect(
      await lookup('https://127.0.0.1/private', new AbortController().signal),
    ).toBeNull();
    expect(dns).not.toHaveBeenCalled();
    const mixed = createProductImageLookup(
      async () => [...(await publicDns()), { address: '10.0.0.1', family: 4 }],
      read,
    );
    expect(await mixed(page.href, new AbortController().signal)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(await lookup(page.href, new AbortController().signal)).toBe(
      'https://cdn.example/product.jpg?a=1&b=2',
    );
    expect(dns).toHaveBeenCalledExactlyOnceWith(page.hostname);
    expect(read.mock.calls[0]?.slice(0, 2)).toEqual([page, '8.8.8.8']);
  });
  it('bounds DNS/read time and prevents late DNS completion from starting a request', async () => {
    vi.useFakeTimers();
    let finish: (value: { address: string; family: number }[]) => void;
    const read = vi.fn(async () => html),
      lookup = createProductImageLookup(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
        read,
      );
    const work = lookup(page.href, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(6000);
    expect(await work).toBeNull();
    finish!(await publicDns());
    await Promise.resolve();
    expect(read).not.toHaveBeenCalled();
  });
  it('cancels metadata work without accepting a late image', async () => {
    const abort = new AbortController();
    let finish: (value: string) => void;
    const lookup = createProductImageLookup(
      publicDns,
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const work = lookup(page.href, abort.signal);
    await Promise.resolve();
    await Promise.resolve();
    abort.abort();
    expect(await work).toBeNull();
    finish!(html);
  });
});

function wire(status = 200, type = 'text/html', chunks = [html]) {
  let options: RequestOptions | undefined;
  vi.mocked(request).mockImplementation(((
    url: URL,
    opts: RequestOptions,
    callback: (response: IncomingMessage) => void,
  ) => {
    expect(url.href).toBe(page.href);
    options = opts;
    const response = Object.assign(new EventEmitter(), {
      statusCode: status,
      headers: { 'content-type': type },
      destroy: vi.fn(),
    });
    const req = Object.assign(new EventEmitter(), {
      destroy: vi.fn(),
      end: () =>
        queueMicrotask(() => {
          callback(response as unknown as IncomingMessage);
          for (const chunk of chunks) response.emit('data', Buffer.from(chunk));
          response.emit('end');
        }),
    });
    return req as unknown as ClientRequest;
  }) as typeof request);
  return () => options;
}
describe('pinned HTTPS transport', () => {
  it('pins DNS with normal TLS, no redirects/authentication/proxy/reused connection and bounded headers', async () => {
    const options = wire();
    expect(
      await createProductImageLookup(publicDns)(
        page.href,
        new AbortController().signal,
      ),
    ).toContain('/product.jpg');
    expect(options()).toMatchObject({
      agent: false,
      family: 4,
      autoSelectFamily: false,
      rejectUnauthorized: true,
      servername: page.hostname,
      maxHeaderSize: 16384,
    });
    const callback = vi.fn();
    options()!.lookup!(page.hostname, {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
    expect(options()).not.toHaveProperty('auth');
    expect(request).toHaveBeenCalledOnce();
  });
  it.each([301, 302, 403, 500])(
    'does not follow or accept status %s',
    async (status) => {
      wire(status);
      expect(
        await createProductImageLookup(publicDns)(
          page.href,
          new AbortController().signal,
        ),
      ).toBeNull();
      expect(request).toHaveBeenCalledOnce();
    },
  );
  it('rejects non-HTML, oversized and fragmented bodies', async () => {
    for (const [type, chunks] of [
      ['image/jpeg', [html]],
      ['text/html', ['x'.repeat(512 * 1024 + 1)]],
      ['text/html', Array.from({ length: 129 }, () => ' ')],
    ] as const) {
      wire(200, type, [...chunks]);
      expect(
        await createProductImageLookup(publicDns)(
          page.href,
          new AbortController().signal,
        ),
      ).toBeNull();
    }
  });
});
