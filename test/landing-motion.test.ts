import { describe, expect, it } from 'vitest';
import {
  advanceScroll,
  landingFraming,
  landingPixelRatio,
  landingFurniture,
  landingFurniturePose,
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
      rotation: 0,
      opening: 0,
    });
    expect(roomChoreography(1)).toEqual({
      rotation: 1,
      opening: 1,
    });
  });
  it('retraces continuous assembly, turn and opening on backward scroll', () => {
    const samples = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(i / 1000),
    );
    for (let i = 1; i < samples.length; i++) {
      for (const key of ['rotation', 'opening'] as const) {
        expect(samples[i]![key]).toBeGreaterThanOrEqual(samples[i - 1]![key]);
        expect(samples[i]![key] - samples[i - 1]![key]).toBeLessThan(0.007);
      }
    }
    const backwards = Array.from({ length: 1001 }, (_, i) =>
      roomChoreography(1 - i / 1000),
    );
    backwards.reverse().forEach((pose, i) => {
      for (const key of ['rotation', 'opening'] as const)
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

describe('full-viewport landing framing', () => {
  it('keeps framing finite and continuous across scroll, reversal and viewport ratios', () => {
    for (const aspect of [0, NaN, Infinity, 0.35, 0.8, 1.3, 1.8, 4]) {
      let prior = landingFraming(0, aspect);
      for (let i = 0; i <= 1000; i++) {
        const current = landingFraming(i / 1000, aspect);
        for (const n of [
          ...current.camera,
          ...current.lookAt,
          current.scale,
          current.turn,
        ])
          expect(Number.isFinite(n)).toBe(true);
        current.camera.forEach((n, k) =>
          expect(Math.abs(n - prior.camera[k]!)).toBeLessThan(0.08),
        );
        prior = current;
      }
    }
  });
  it('bounds the backing buffer without shrinking the full CSS stage or disabling motion', () => {
    for (const [w, h] of [
      [320, 568],
      [1920, 1080],
      [3840, 2160],
      [7680, 4320],
      [800, 10000],
    ]) {
      for (const device of [0, NaN, 1, 1.5, 2, 3]) {
        const ratio = landingPixelRatio(w!, h!, device);
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThanOrEqual(1.5);
        expect(w! * h! * ratio * ratio).toBeLessThanOrEqual(2_000_000.001);
      }
    }
    expect(Number.isFinite(landingPixelRatio(NaN, 0, Infinity))).toBe(true);
  });
});

describe('purposeful authored furniture travel', () => {
  function footprint(
    piece: (typeof landingFurniture)[number],
    progress: number,
  ) {
    const pose = landingFurniturePose(piece.key, progress),
      c = Math.abs(Math.cos(pose.turn)),
      s = Math.abs(Math.sin(pose.turn)),
      x = pose.position[0],
      z = pose.position[2],
      hx = (piece.size.width * c + piece.size.depth * s) / 2000,
      hz = (piece.size.width * s + piece.size.depth * c) / 2000;
    return { left: x - hx, right: x + hx, top: z - hz, bottom: z + hz };
  }
  it('stays grounded, inside the room and clear of other pieces throughout the staged moves', () => {
    const previous = landingFurniture.map((piece) =>
      landingFurniturePose(piece.key, 0),
    );
    for (let i = 0; i <= 1000; i++) {
      const progress = i / 1000;
      const boxes = landingFurniture.map((piece, index) => {
        const pose = landingFurniturePose(piece.key, progress),
          prior = previous[index]!;
        expect(pose.position[1]).toBe(0);
        pose.position.forEach((n, k) => {
          expect(Number.isFinite(n)).toBe(true);
          expect(Math.abs(n - prior.position[k]!)).toBeLessThan(0.08);
        });
        expect(Math.abs(pose.turn - prior.turn)).toBeLessThan(0.08);
        previous[index] = pose;
        const b = footprint(piece, progress);
        expect(b.left, `${piece.key} at ${progress}`).toBeGreaterThanOrEqual(
          -2.2,
        );
        expect(b.right, `${piece.key} at ${progress}`).toBeLessThanOrEqual(2.2);
        expect(b.top, `${piece.key} at ${progress}`).toBeGreaterThanOrEqual(
          -2.45,
        );
        expect(b.bottom, `${piece.key} at ${progress}`).toBeLessThanOrEqual(
          2.45,
        );
        return b;
      });
      for (let a = 0; a < boxes.length; a++)
        for (let b = a + 1; b < boxes.length; b++) {
          const x = boxes[a]!,
            y = boxes[b]!;
          expect(
            x.right <= y.left ||
              y.right <= x.left ||
              x.bottom <= y.top ||
              y.bottom <= x.top,
            `${landingFurniture[a]!.key}/${landingFurniture[b]!.key} at ${progress}`,
          ).toBe(true);
        }
    }
  });
  it('moves the desk toward the window, opens the center and visibly rotates the resting pieces', () => {
    const before = landingFurniturePose('desk', 0),
      after = landingFurniturePose('desk', 1);
    const windowDistance = (p: typeof before) =>
      Math.hypot(p.position[0] - 0.95, p.position[2] + 2.45);
    expect(windowDistance(before) - windowDistance(after)).toBeGreaterThan(3);
    const bed = landingFurniture.find((p) => p.key === 'bed')!;
    const start = footprint(bed, 0),
      end = footprint(bed, 1);
    expect(
      start.left < 0 && start.right > 0 && start.top < 0 && start.bottom > 0,
    ).toBe(true);
    expect(end.right).toBeLessThan(0);
    for (const key of ['bed', 'desk', 'chair', 'shelf'] as const)
      expect(
        Math.abs(
          landingFurniturePose(key, 1).turn - landingFurniturePose(key, 0).turn,
        ),
      ).toBeGreaterThan(1);
    expect(landingFurniturePose('bed', NaN)).toEqual(
      landingFurniturePose('bed', 0),
    );
  });
});
