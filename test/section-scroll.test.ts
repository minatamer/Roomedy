import { expect, it } from 'vitest';
import { startScrollJourney } from '../apps/frontend/src/features/navigation/scroll-journey.js';

function harness(from: number, to: number) {
  let callback: (time: number) => void = () => {},
    position = from,
    frames = 0,
    done = 0;
  const stop = startScrollJourney(from, to, {
    now: () => 0,
    request: (next) => {
      callback = next;
      return ++frames;
    },
    cancel: () => {},
    write: (next) => {
      position = next;
    },
    done: () => {
      done++;
    },
  });
  return {
    stop,
    tick: (time: number) => callback(time),
    read: () => ({ position, frames, done }),
  };
}
it('travels through intermediate positions, reaches the exact target and finishes within a finite bound', () => {
  for (const [from, to] of [
    [0, 690],
    [4000, 0],
    [0, 100000],
  ] as const) {
    const h = harness(from, to);
    h.tick(100);
    const p = h.read().position;
    expect(p).toBeGreaterThan(Math.min(from, to));
    expect(p).toBeLessThan(Math.max(from, to));
    h.tick(1050);
    expect(h.read().position).toBe(to);
    expect(h.read().done).toBe(1);
    const count = h.read().frames;
    h.tick(5000);
    expect(h.read().frames).toBe(count);
  }
});
it('cancels stale callbacks and retargets from the actually displayed position', () => {
  const first = harness(0, 1000);
  first.tick(220);
  const visible = first.read().position;
  first.stop();
  first.stop();
  first.tick(1000);
  expect(first.read().position).toBe(visible);
  expect(first.read().done).toBe(1);
  const second = harness(visible, 0);
  second.tick(100);
  expect(second.read().position).toBeGreaterThan(0);
  expect(second.read().position).toBeLessThan(visible);
  second.tick(1050);
  expect(second.read().position).toBe(0);
});
