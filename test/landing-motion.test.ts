import { describe, expect, it } from 'vitest';
import {
  advanceScroll,
  boundedProgress,
  roomChoreography,
} from '../apps/frontend/src/features/landing/scroll-motion.js';

describe('scroll-driven room presentation', () => {
  it('bounds malformed/out-of-range targets without inventing a motion command', () => {
    for (const n of [NaN, Infinity, -Infinity, -100, 0, 0.5, 1, 100]) {
      const pose = roomChoreography(n);
      for (const value of Object.values(pose)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
    expect(boundedProgress(2)).toBe(1);
    expect(roomChoreography(0)).toEqual({
      assembly: 0,
      rotation: 0,
      opening: 0,
    });
    expect(roomChoreography(1)).toEqual({
      assembly: 1,
      rotation: 1,
      opening: 1,
    });
  });
  it('retraces continuous assembly, turn and opening on backward scroll', () => {
    const samples = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(i / 1000),
    );
    for (let i = 1; i < samples.length; i++) {
      for (const key of ['assembly', 'rotation', 'opening'] as const) {
        expect(samples[i]![key]).toBeGreaterThanOrEqual(samples[i - 1]![key]);
        expect(samples[i]![key] - samples[i - 1]![key]).toBeLessThan(0.006);
      }
    }
    const backwards = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(1 - i / 1000),
    );
    backwards.reverse().forEach((pose, i) => {
      for (const key of ['assembly', 'rotation', 'opening'] as const)
        expect(pose[key]).toBeCloseTo(samples[i]![key], 10);
    });
  });
  it('interrupts from the displayed state and settles both directions without overshoot', () => {
    let displayed = 0;
    for (let i = 0; i < 5; i++) displayed = advanceScroll(displayed, 1, 1 / 60);
    const interrupted = displayed;
    displayed = advanceScroll(displayed, 0, 1 / 60);
    expect(displayed).toBeGreaterThan(0);
    expect(displayed).toBeLessThan(interrupted);
    expect(advanceScroll(0, 1, 50)).toBe(advanceScroll(0, 1, 0.05));
    expect(advanceScroll(0.4, 0.8, NaN)).toBe(0.4);
    for (const target of [1, 0.3, 0.75, 0]) {
      for (let i = 0; i < 100; i++)
        displayed = advanceScroll(displayed, target, 1 / 60);
      expect(displayed).toBe(target);
    }
  });
});
