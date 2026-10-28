import { BoundedBytes } from '@roomedy/contracts/bounded-bytes';
import type { EstimateFx } from '@roomedy/contracts/estimates';
import { fxRatio } from '@roomedy/spatial';

export type ReferenceRate = Omit<EstimateFx, 'currency' | 'inputs'>;
export type ExchangeRates = (
  currency: EstimateFx['currency'],
  signal: AbortSignal,
) => Promise<ReferenceRate | null>;
const DAY = 86_400_000;
/** Public currency pair only; no room, location, user text, credentials, redirects or retries. */
export function createExchangeRates(
  transport: typeof fetch = fetch,
  now = Date.now,
): ExchangeRates {
  const cache = new Map<string, ReferenceRate>();
  return async (currency, signal) => {
    if (
      signal.aborted ||
      !['EGP', 'EUR', 'GBP', 'AED', 'SAR'].includes(currency)
    )
      return null;
    const time = now(),
      previous = cache.get(currency);
    if (
      previous &&
      time >= previous.observedAt &&
      time - previous.observedAt < 15 * 60_000
    )
      return { ...previous };
    const url = `https://api.frankfurter.dev/v2/rate/${currency.toLowerCase()}/usd`;
    const deadline = new AbortController(),
      combined = AbortSignal.any([signal, deadline.signal]);
    const timer = setTimeout(() => deadline.abort(), 5000);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let response: Response | undefined;
    const packed = new BoundedBytes(8192, 128);
    try {
      response = await transport(url, {
        method: 'GET',
        redirect: 'error',
        signal: combined,
        headers: { Accept: 'application/json' },
      });
      combined.throwIfAborted();
      if (!response.ok || !response.body) return null;
      reader = response.body.getReader();
      while (true) {
        combined.throwIfAborted();
        const next = await reader.read();
        combined.throwIfAborted();
        if (next.done) break;
        packed.append(next.value);
      }
      const value: unknown = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(packed.take()),
      );
      if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
      const row = value as Record<string, unknown>;
      if (
        row.base !== currency ||
        row.quote !== 'USD' ||
        typeof row.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
        typeof row.rate !== 'number'
      )
        return null;
      const date = Date.parse(`${row.date}T00:00:00Z`),
        today = Math.floor(time / DAY) * DAY;
      if (
        !Number.isFinite(date) ||
        new Date(date).toISOString().slice(0, 10) !== row.date ||
        date > today ||
        today - date > 7 * DAY
      )
        return null;
      const usdPerUnit = String(row.rate);
      fxRatio(usdPerUnit);
      const rate: ReferenceRate = {
        date: row.date,
        usdPerUnit,
        observedAt: time,
        url,
      };
      combined.throwIfAborted();
      cache.set(currency, rate); // Five currencies, successful observations only; no shared pending work.
      return { ...rate };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      deadline.abort();
      // Await actual transport settlement; never retire an unresolved owned reader early.
      if (reader) {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      } else await response?.body?.cancel().catch(() => undefined);
      packed.clear();
    }
  };
}
