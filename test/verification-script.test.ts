import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadVerificationScript } from '../apps/frontend/src/features/verification/script.js';

function scriptDocument() {
  const scripts: ScriptElement[] = [];
  class ScriptElement extends EventTarget {
    src = '';
    async = false;
    removed = false;
    remove() {
      this.removed = true;
    }
  }
  const append = vi.fn((script: ScriptElement) => scripts.push(script));
  return {
    document: {
      createElement: () => new ScriptElement(),
      head: { appendChild: append },
    } as unknown as Document,
    scripts,
    append,
  };
}

afterEach(() => vi.useRealTimers());

describe('owned verification script attempts', () => {
  it('retires a failed script and allows a new deliberate load without caching failure or retrying', async () => {
    vi.useFakeTimers();
    const dom = scriptDocument();
    let available = false;
    const ready = vi.fn();
    const failed = vi.fn();
    const first = loadVerificationScript(
      dom.document,
      () => available,
      ready,
      failed,
    );
    await Promise.resolve();
    const old = dom.scripts[0]!;
    expect(old.src).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    );
    old.dispatchEvent(new Event('error'));
    expect(failed).toHaveBeenCalledExactlyOnceWith('script-load');
    expect(old.removed).toBe(true);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(dom.append).toHaveBeenCalledTimes(1);
    first();
    const second = loadVerificationScript(
      dom.document,
      () => available,
      ready,
      failed,
    );
    await Promise.resolve();
    expect(dom.append).toHaveBeenCalledTimes(2);
    available = true;
    old.dispatchEvent(new Event('load'));
    expect(ready).not.toHaveBeenCalled();
    dom.scripts[1]!.dispatchEvent(new Event('load'));
    expect(ready).toHaveBeenCalledTimes(1);
    second();
    expect(dom.scripts[1]!.removed).toBe(false);
  });

  it('bounds a stalled load, fences late events and can try again only when requested', async () => {
    vi.useFakeTimers();
    const dom = scriptDocument();
    const ready = vi.fn();
    const failed = vi.fn();
    const stop = loadVerificationScript(
      dom.document,
      () => false,
      ready,
      failed,
    );
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(12_000);
    expect(failed).toHaveBeenCalledExactlyOnceWith('script-timeout');
    expect(dom.scripts[0]!.removed).toBe(true);
    dom.scripts[0]!.dispatchEvent(new Event('load'));
    dom.scripts[0]!.dispatchEvent(new Event('error'));
    expect(ready).not.toHaveBeenCalled();
    expect(failed).toHaveBeenCalledTimes(1);
    stop();
  });

  it('does not start a retired effect and starts only the replacement owner', async () => {
    const dom = scriptDocument();
    const ready = vi.fn();
    const failed = vi.fn();
    const retired = loadVerificationScript(
      dom.document,
      () => false,
      ready,
      failed,
    );
    retired();
    const current = loadVerificationScript(
      dom.document,
      () => false,
      ready,
      failed,
    );
    await Promise.resolve();
    expect(dom.append).toHaveBeenCalledTimes(1);
    current();
    expect(dom.scripts[0]!.removed).toBe(true);
    dom.scripts[0]!.dispatchEvent(new Event('load'));
    expect(ready).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
  });

  it('reuses the loaded API without another request and rejects load without an API', async () => {
    const dom = scriptDocument();
    const ready = vi.fn();
    const failed = vi.fn();
    const reuse = loadVerificationScript(
      dom.document,
      () => true,
      ready,
      failed,
    );
    await Promise.resolve();
    expect(ready).toHaveBeenCalledTimes(1);
    expect(dom.append).not.toHaveBeenCalled();
    reuse();
    const broken = loadVerificationScript(
      dom.document,
      () => false,
      ready,
      failed,
    );
    await Promise.resolve();
    dom.scripts[0]!.dispatchEvent(new Event('load'));
    expect(failed).toHaveBeenCalledExactlyOnceWith('script-load');
    broken();
  });
});
