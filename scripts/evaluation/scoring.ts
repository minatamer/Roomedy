import type {
  DraftHypothesis,
  DraftObservation,
} from '@roomedy/contracts/intake';
import type { Corpus, CorpusCase, Counts } from './corpus.js';
const category = (o: DraftObservation) =>
  o.kind === 'furniture' ? (o.catalogueId ?? 'unsupported') : o.kind;
const increment = (map: Counts, key: string) => {
  map[key] = (map[key] ?? 0) + 1;
};
export function scoreRecognition(
  corpus: Corpus,
  c: CorpusCase,
  draft: DraftHypothesis,
) {
  const expected: Counts = {},
    observed: Counts = {};
  let missing = 0,
    unexpected = 0,
    merges = 0,
    splits = 0,
    groupingUnscored = 0,
    metricClaims = 0,
    unknownMechanismClaims = 0;
  for (const ref of c.images) {
    const truth = corpus.images.find((i) => i.id === ref)!.visible;
    const actual: Counts = {};
    for (const o of draft.observations.filter((o) => o.sourceId === ref))
      increment(actual, category(o));
    for (const key of new Set([
      ...Object.keys(truth),
      ...Object.keys(actual),
    ])) {
      const want = truth[key] ?? 0,
        got = actual[key] ?? 0;
      expected[key] = (expected[key] ?? 0) + want;
      observed[key] = (observed[key] ?? 0) + got;
      missing += Math.max(0, want - got);
      unexpected += Math.max(0, got - want);
    }
  }
  const categories = new Set([
    ...Object.keys(c.physical),
    ...Object.keys(observed),
  ]);
  for (const key of categories) {
    const expectedObservations = expected[key] ?? 0,
      got = observed[key] ?? 0;
    if (got !== expectedObservations) {
      groupingUnscored++;
      continue;
    }
    const groups = draft.groups.filter((g) =>
      g.some((ref) =>
        draft.observations.some((o) => o.ref === ref && category(o) === key),
      ),
    ).length;
    // Counts identify grouping only when observations have complete category coverage.
    // Two same-category objects across views require independent identity annotations.
    if ((c.physical[key] ?? 0) > 1 && c.images.length > 1) {
      groupingUnscored++;
      continue;
    }
    merges += Math.max(0, (c.physical[key] ?? 0) - groups);
    splits += Math.max(0, groups - (c.physical[key] ?? 0));
  }
  let entityRepairs = 0;
  for (const key of categories) {
    const actualGroups = draft.groups.filter((g) =>
      g.some((ref) =>
        draft.observations.some((o) => o.ref === ref && category(o) === key),
      ),
    ).length;
    entityRepairs += Math.abs((c.physical[key] ?? 0) - actualGroups);
  }
  for (const m of Object.values(draft.room))
    if (m.status !== 'unknown') metricClaims++;
  for (const o of draft.observations) {
    for (const field of [
      'width',
      'depth',
      'height',
      'offset',
      'sill',
      'projection',
    ] as const) {
      const m = o[field];
      const labelled =
        category(o) === 'procedural-desk' &&
        field === 'width' &&
        m.status === 'extracted' &&
        (((m.sourceId === 'partial-b-front' ||
          m.sourceId === 'partial-b-exif') &&
          m.value === 1501) ||
          (m.sourceId === 'contradictory-b' && m.value === 1600));
      if (m.status !== 'unknown' && !labelled) metricClaims++;
    }
    if (
      ['door', 'furniture'].includes(o.kind) &&
      (o.mechanism !== 'unknown' || o.hinge !== 'unknown')
    )
      unknownMechanismClaims++;
  }
  return {
    expected,
    observed,
    missing,
    unexpected,
    falseMerges: merges,
    falseSplits: splits,
    groupingUnscored,
    unsupportedMetricClaims: metricClaims,
    unknownMechanismClaims,
    shapeMismatch: draft.shape !== 'unknown' && draft.shape !== c.shape,
    shapeUnresolved: draft.shape === 'unknown',
    // This is an inventory/shape repair lower bound, not a measured human-action count.
    repairLowerBound: entityRepairs + (draft.shape === c.shape ? 0 : 1),
    humanRepairActions: null,
  };
}
