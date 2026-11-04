import { describe, expect, it, vi } from 'vitest';
import { createChatReading } from '../apps/frontend/src/features/assistant/chat-reading.js';

function harness() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let serial = 0,
    resized = () => {};
  const disconnect = vi.fn(),
    writes: ScrollToOptions[] = [];
  const log = Object.assign(new EventTarget(), {
    scrollTop: 0,
    scrollHeight: 2400,
    clientHeight: 400,
    clientTop: 0,
    getBoundingClientRect: () => ({ top: 80 }),
    contains: (target: unknown) => targets.has(target),
    scrollTo: (value: ScrollToOptions) => {
      writes.push(value);
      log.scrollTop = value.top!;
    },
  });
  const targets = new Set<unknown>();
  const target = (y: number) => {
    const position = {
      y,
      getBoundingClientRect: () => ({ top: 80 + position.y - log.scrollTop }),
    };
    targets.add(position);
    return position;
  };
  const owner = createChatReading(log as unknown as HTMLElement, {
    request: (callback) => {
      callbacks.set(++serial, callback);
      return serial;
    },
    cancel: (frame) => {
      callbacks.delete(frame);
    },
    observe: (_, callback) => {
      resized = callback;
      return disconnect;
    },
  });
  return {
    log,
    owner,
    writes,
    disconnect,
    targets,
    target,
    show: (value: ReturnType<typeof target>, explicit = false) =>
      owner.show(value as unknown as HTMLElement, explicit),
    tick: () => {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(0));
    },
    resize: () => resized(),
    callbacks,
  };
}
describe('chat reading ownership', () => {
  it('recognizes a new request even when its reply is rendered in the same batch, and preserves manual reading for that request’s later results', () => {
    const h = harness(),
      first = h.target(700),
      reply = h.target(1300);
    h.owner.show(
      first as unknown as HTMLElement,
      false,
      'workspace:1:request-1',
    );
    h.tick();
    h.log.dispatchEvent(new Event('wheel'));
    h.owner.show(
      reply as unknown as HTMLElement,
      false,
      'workspace:1:request-2',
    );
    h.tick();
    expect(h.writes.at(-1)?.top).toBe(1292);
    h.log.dispatchEvent(new Event('wheel'));
    const count = h.writes.length;
    expect(
      h.owner.show(
        first as unknown as HTMLElement,
        false,
        'workspace:1:request-2',
      ),
    ).toBe(false);
    h.tick();
    expect(h.writes).toHaveLength(count);
    h.owner.dispose();
  });
  it('shows the start of the explanation, follows late layout shifts and never follows growing cards to the bottom', () => {
    const h = harness(),
      text = h.target(900);
    h.show(text);
    h.tick();
    expect(h.writes).toEqual([{ top: 892, behavior: 'smooth' }]);
    h.log.scrollHeight += 700;
    h.resize();
    h.tick();
    expect(h.writes).toHaveLength(1);
    text.y += 120;
    h.resize();
    h.tick();
    expect(h.writes.at(-1)?.top).toBe(1012);
    h.owner.dispose();
  });
  it('coalesces layout updates, clamps short replies, and aligns text once space becomes available', () => {
    const h = harness(),
      text = h.target(900);
    h.log.scrollHeight = 1000;
    h.show(text);
    h.resize();
    h.resize();
    expect(h.callbacks.size).toBe(1);
    h.tick();
    expect(h.writes.at(-1)?.top).toBe(600);
    h.log.scrollHeight = 1800;
    h.resize();
    h.tick();
    expect(h.writes.at(-1)?.top).toBe(892);
    h.owner.dispose();
  });
  it.each(['wheel', 'touchmove', 'pointerdown', 'keydown'])(
    'respects manual %s reading until a new deliberate request',
    (type) => {
      const h = harness(),
        text = h.target(900),
        next = h.target(1400);
      h.show(text);
      const event = Object.assign(new Event(type), { key: 'PageUp' });
      h.log.dispatchEvent(event);
      h.tick();
      h.show(next);
      h.resize();
      h.tick();
      expect(h.writes).toHaveLength(0);
      h.show(next, true);
      h.tick();
      expect(h.writes.at(-1)?.top).toBe(1392);
      h.owner.dispose();
    },
  );
  it('resumes future reply following after the user scrolls back to the end', () => {
    const h = harness();
    h.log.dispatchEvent(new Event('wheel'));
    h.log.scrollTop = h.log.scrollHeight - h.log.clientHeight;
    h.log.dispatchEvent(new Event('scroll'));
    h.show(h.target(1800));
    h.tick();
    expect(h.writes.at(-1)?.top).toBe(1792);
    h.owner.dispose();
  });
  it('retires frames, observers and listeners and ignores detached or late targets', () => {
    const h = harness(),
      text = h.target(900);
    h.show(text);
    const late = [...h.callbacks.values()][0]!;
    h.owner.dispose();
    h.tick();
    late(0);
    h.resize();
    h.tick();
    h.show(text, true);
    h.tick();
    expect(h.writes).toHaveLength(0);
    expect(h.disconnect).toHaveBeenCalled();
    expect(h.callbacks.size).toBe(0);
    const other = harness(),
      removed = other.target(600);
    other.show(removed);
    other.targets.delete(removed);
    other.tick();
    expect(other.writes).toHaveLength(0);
    other.owner.dispose();
  });
});
