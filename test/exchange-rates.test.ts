import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExchangeRates } from '../apps/backend/src/sourcing/exchange-rates.js';
const time = Date.UTC(2026, 9, 28, 12),
  signal = () => new AbortController().signal;
const row = { base: 'EGP', quote: 'USD', date: '2026-10-28', rate: 0.017831 };
const reply = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  });
afterEach(() => vi.useRealTimers());
describe('bounded public reference rates', () => {
  it('sends only a fixed currency pair, caches successful observations briefly and never retries failures', async () => {
    let now = time;
    const transport = vi.fn<typeof fetch>().mockResolvedValue(reply(row));
    const lookup = createExchangeRates(transport, () => now);
    const result = await lookup('EGP', signal());
    expect(result?.usdPerUnit).toBe('0.017831');
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, options] = transport.mock.calls[0]!;
    expect(url).toBe('https://api.frankfurter.dev/v2/rate/egp/usd');
    expect(options).toMatchObject({
      method: 'GET',
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
    expect(options?.body).toBeUndefined();
    if (result) result.usdPerUnit = '9';
    expect((await lookup('EGP', signal()))?.usdPerUnit).toBe('0.017831');
    now += 16 * 60_000;
    transport.mockResolvedValueOnce(new Response('', { status: 503 }));
    expect(await lookup('EGP', signal())).toBeNull();
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([
    { ...row, base: 'EUR' },
    { ...row, quote: 'EUR' },
    { ...row, rate: 0 },
    { ...row, rate: -1 },
    { ...row, rate: 1e-20 },
    { ...row, rate: 10000 },
    { ...row, date: '2026-10-29' },
    { ...row, date: '2026-10-20' },
    { ...row, date: '2026-02-30' },
    { ...row, rate: '0.01' },
    null,
  ])(
    'rejects malformed, wrong-pair, stale or future rates %#',
    async (value) => {
      const transport = vi.fn<typeof fetch>().mockResolvedValue(reply(value));
      expect(
        await createExchangeRates(transport, () => time)('EGP', signal()),
      ).toBeNull();
      expect(transport).toHaveBeenCalledTimes(1);
    },
  );
  it('accepts weekend reference age and rejects excessive bytes/fragments', async () => {
    expect(
      await createExchangeRates(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(reply({ ...row, date: '2026-10-21' })),
        () => time,
      )('EGP', signal()),
    ).not.toBeNull();
    for (const chunks of [
      [new Uint8Array(8193)],
      Array.from({ length: 129 }, () => new Uint8Array()),
    ]) {
      let cancelled = 0;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          chunks.forEach((chunk) => controller.enqueue(chunk));
        },
        cancel() {
          cancelled++;
        },
      });
      const transport = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(body));
      expect(
        await createExchangeRates(transport, () => time)('EGP', signal()),
      ).toBeNull();
      expect(cancelled).toBe(1);
    }
  });
  it('honours cancellation, finite deadlines and actual late transport settlement without caching it', async () => {
    vi.useFakeTimers();
    const aborted = new AbortController();
    aborted.abort();
    const unused = vi.fn<typeof fetch>();
    expect(
      await createExchangeRates(unused, () => time)('EGP', aborted.signal),
    ).toBeNull();
    expect(unused).not.toHaveBeenCalled();
    let settle!: (value: Response) => void;
    const transport = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((resolve) => {
          settle = resolve;
        }),
    );
    const lookup = createExchangeRates(transport, () => time);
    let finished = false;
    const pending = lookup('EGP', signal()).then((result) => {
      finished = true;
      return result;
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(transport.mock.calls[0]![1]?.signal?.aborted).toBe(true);
    expect(finished).toBe(false);
    let cancelled = 0;
    settle(
      new Response(
        new ReadableStream({
          cancel() {
            cancelled++;
          },
        }),
      ),
    );
    expect(await pending).toBeNull();
    expect(cancelled).toBe(1);
    transport.mockResolvedValueOnce(reply(row));
    expect(await lookup('EGP', signal())).not.toBeNull();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
