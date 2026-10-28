import { describe, expect, it } from 'vitest';
import { landingChapterProgress } from '../apps/frontend/src/features/landing/scroll-motion.js';
import {
  landingEstimate,
  landingEstimateAt,
  landingFloorPacks,
  landingPaintCans,
} from '../apps/frontend/src/features/landing/story-estimate.js';
import { landingFinishState } from '../apps/frontend/src/features/landing/finish-motion.js';

describe('landing CPQ illustration', () => {
  it('uses whole purchased packs/cans and ties each example total to its selected finish', () => {
    expect(landingFloorPacks).toBe(13);
    expect(landingFloorPacks * landingEstimate.packArea).toBeGreaterThanOrEqual(
      landingEstimate.floorArea * (1 + landingEstimate.waste),
    );
    expect(landingPaintCans).toBe(2);
    expect(
      landingPaintCans *
        landingEstimate.paintCanLitres *
        landingEstimate.paintYield,
    ).toBeGreaterThanOrEqual(landingEstimate.paintArea * landingEstimate.coats);
    const oak = landingEstimateAt(0.49),
      value = landingEstimateAt(0.65);
    expect(landingEstimate.currency).toBe('USD');
    expect(oak.total).toBe(2261);
    expect(value.total).toBe(2079);
    expect(oak.total - value.total).toBe(value.saving);
    expect(value.saving).toBe(182);
    expect(value.paint).toBe(oak.paint);
    expect(value.furniture).toBe(oak.furniture);
    expect(value.work).toBe(oak.work);
    expect(value.total).toBe(
      value.floor + value.paint + value.furniture + value.work,
    );
  });
  it('keeps the quote and real surface alternative on the same presentation identity', () => {
    for (let i = 1000; i >= 0; i--) {
      const p = i / 1000,
        example = landingEstimateAt(p),
        surface = landingFinishState(p);
      expect(example.choice).toBe(surface.choice);
      expect(example.finish).toBe(
        surface.choice === 'oak' ? 'Oak planks' : 'Light oak laminate',
      );
    }
    expect(landingEstimateAt(NaN)).toEqual(landingEstimateAt(0));
  });
  it.each([
    [0, 768, 1536, 2304, 3072, 3840, 4608],
    [0, 568, 1380, 2210, 3210, 4320, 5210],
  ])(
    'meets real chapter anchors without assuming equal screen-height sections',
    (...offsets) => {
      const beats = [0, 0.15, 0.31, 0.49, 0.65, 0.82, 1];
      offsets.forEach((offset, i) =>
        expect(
          landingChapterProgress(i === 0 ? 0 : offset - 30, offsets),
        ).toBeCloseTo(beats[i]!, 10),
      );
      let previous = 0;
      for (let scroll = 0; scroll <= offsets.at(-1)!; scroll += 10) {
        const p = landingChapterProgress(scroll, offsets);
        expect(p).toBeGreaterThanOrEqual(previous);
        expect(p).toBeLessThanOrEqual(1);
        previous = p;
      }
      expect(landingChapterProgress(-100, offsets)).toBe(0);
    },
  );
  it('rejects malformed or non-increasing anchor geometry without publishing a nonfinite pose', () => {
    expect(landingChapterProgress(NaN, [0, 1, 2, 3, 4, 5, 6])).toBe(0);
    expect(landingChapterProgress(100, [])).toBe(0);
    expect(landingChapterProgress(100, [0, 100, NaN, 300, 400, 500, 600])).toBe(
      0,
    );
    expect(landingChapterProgress(100, [0, 100, 100, 300, 400, 500, 600])).toBe(
      0,
    );
  });
});
