import { expect, it } from 'vitest';
import {
  paintCoverage,
  readableEstimateNote,
  humanQuantity,
  estimateGroups,
} from '../apps/frontend/src/features/cost/estimate-presentation.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { createCostDraft } from '../apps/frontend/src/features/cost/state.js';
import { calculateRoomEstimate } from '@roomedy/spatial';
it('formats real paint coverage into readable wall/area/coat facts without changing original evidence', () => {
  const note = 'north: 2 paint coat(s); 10020000/1000000 m² net.';
  expect(paintCoverage(note)).toEqual({
    wall: 'North',
    coats: 2,
    area: '10.02',
  });
  expect(readableEstimateNote(note)).toBe(
    'North wall: 10.02 m² net · 2 coats.',
  );
  expect(note).toContain('10020000/1000000');
  expect(readableEstimateNote('Stock needs confirmation.')).toBe(
    'Stock needs confirmation.',
  );
  expect(
    paintCoverage('north: 2 paint coat(s); 10020000/0 m² net.'),
  ).toBeNull();
});
it('keeps useful quantities and honest known subtotals while grouping every financial line', () => {
  expect(humanQuantity({ numerator: 2, denominator: 1, unit: 'can' })).toBe(
    '2 cans',
  );
  expect(humanQuantity({ numerator: 1, denominator: 1, unit: 'pack' })).toBe(
    '1 pack',
  );
  const room = createRoomFixture('sample'),
    draft = createCostDraft(room),
    result = calculateRoomEstimate(room, draft.settings, draft.offers);
  if (!result.ok) throw new Error(result.code);
  const before = JSON.stringify(result.estimate),
    groups = estimateGroups(result.estimate);
  expect(groups.flatMap((g) => g.lines).length).toBe(
    result.estimate.lines.length,
  );
  expect(groups.reduce((sum, g) => sum + g.known, 0)).toBe(
    result.estimate.knownTotalMinor,
  );
  expect(groups.reduce((sum, g) => sum + g.unpriced, 0)).toBe(
    result.estimate.unpricedCount,
  );
  expect(JSON.stringify(result.estimate)).toBe(before);
});
