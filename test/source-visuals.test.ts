import { describe, expect, it } from 'vitest';
import {
  listedEvidence,
  listedWallNote,
  sourceNote,
  sourceScope,
} from '../apps/frontend/src/features/cost/source-visuals.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { chooseProduct } from '../apps/frontend/src/features/cost/attach-offer.js';
import { marketTargets } from '../apps/frontend/src/features/cost/market-research.js';
function fixture() {
  const c = new SessionController(createManualRoom('partial'));
  try {
    c.setDestination('cost', 'en-US');
    for (const target of marketTargets(
      c.getSnapshot().workspace!.current,
    ).filter((t) => t.brief.kind === 'floor' || t.brief.kind === 'paint')) {
      const s = c.getSnapshot(),
        paint = target.brief.kind === 'paint';
      const r = chooseProduct(
        c,
        target.brief,
        {
          label: target.label,
          url: 'https://merchant.example/' + target.key,
          imageUrl: null,
          evidence: 'Offline page fixture',
          offer: null,
          conditions: 'standard',
          match: 'similar',
          differences: [],
          listing: {
            priceMinor: paint ? 6099 : 4756,
            currency: 'USD',
            country: 'US',
            unit: paint ? 'can' : 'pack',
            volumeMl: paint ? 3785 : null,
            observedAt: 123,
            ...(paint
              ? { coverageMm2PerLitre: 10_000_000 }
              : { coverageMm2: 2_200_000 }),
          },
        },
        s.cost!.revision,
        s.workspace!.current.roomRevision,
        false,
        target.matchingWalls,
      );
      if (!r.ok) throw new Error(r.reason);
    }
    if (!c.saveEstimate('Source fixture').ok) throw new Error('fixture');
    return structuredClone(c.getSnapshot().estimateVersions[0]!);
  } finally {
    c.dispose();
  }
}
describe('visual source summaries retain unknown evidence', () => {
  it('shortens only recognized app boilerplate and retains an added condition verbatim', () => {
    const common =
      'Store listed price; confirm fit, variant, tax, delivery and availability.';
    expect(sourceNote(common).known).toBe(true);
    const custom = common + ' Delivery includes the building lobby only.';
    expect(sourceNote(custom)).toEqual({
      known: false,
      title: 'Recorded note',
      detail: custom,
    });
    const long = 'W'.repeat(400);
    expect(sourceNote(long).detail).toBe(long);
  });
  it('replaces fully represented listed math with its exact saved wall table without changing inputs', () => {
    const v = fixture(),
      before = JSON.stringify(v),
      paint = v.estimate.lines.find(
        (l) => l.category === 'walls' && l.productKey,
      )!;
    const result = listedEvidence(paint, v.pricing);
    expect(result.summary).toBe(true);
    expect(result.walls).toHaveLength(4);
    expect(result.walls[0]).toEqual({ wall: 'north', area: '10.02', coats: 2 });
    expect(JSON.stringify(v)).toBe(before);
  });
  it.each(['manual', 'price mismatch', 'unknown note', 'missing geometry'])(
    'keeps the calculation and its conditions when visual coverage is incomplete: %s',
    (change) => {
      const v = fixture(),
        line = v.estimate.lines.find((l) => l.productKey === 'surface:floor')!,
        selected = v.pricing.settings.selectedPrices!.find(
          (p) => p.key === line.productKey,
        )!;
      if (change === 'manual') {
        if (!selected.takeoff) throw new Error('fixture');
        selected.takeoff.mode = 'manual';
      }
      if (change === 'price mismatch') line.amountMinor! += 1;
      if (change === 'unknown note')
        line.notes.push('Installer must inspect unusual substrate.');
      if (change === 'missing geometry') line.required = null;
      expect(listedEvidence(line, v.pricing).summary).toBe(false);
    },
  );
  it('does not summarize full quotes or discard an inconsistent/duplicate wall record', () => {
    const v = fixture(),
      line = v.estimate.lines.find(
        (l) => l.category === 'walls' && l.productKey,
      )!;
    line.notes.push(line.notes.find((n) => n.startsWith('north:'))!);
    expect(listedEvidence(line, v.pricing).summary).toBe(false);
    line.notes.pop();
    v.pricing.settings.walls[0]!.coats = 3;
    expect(listedEvidence(line, v.pricing).summary).toBe(false);
    line.pricing = 'sourced';
    expect(listedEvidence(line, v.pricing).summary).toBe(false);
    expect(
      listedWallNote('north: approximate area, ask the supplier'),
    ).toBeNull();
  });
  it('condenses known scope facts but preserves new and extended assumptions', () => {
    const v = fixture(),
      scoped = sourceScope(v.estimate.assumptions);
    expect(scoped.oneRoom).toBe(true);
    expect(scoped.exclusions).toContain('Structural work & hidden defects');
    expect(scoped.exclusions).toContain('Delivery & logistics');
    expect(scoped.other).toEqual([]);
    const added =
      v.estimate.assumptions[0]! + ' Unusual access needs a survey.';
    expect(sourceScope([added, 'Custom supplier condition']).other).toEqual([
      added,
      'Custom supplier condition',
    ]);
  });
});
