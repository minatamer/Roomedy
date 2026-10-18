import type {
  DraftHypothesis,
  DraftObservation,
} from '@roomedy/contracts/intake';
import { createFakeProvider } from '../providers/provider.js';
export type RecognitionCase =
  | 'empty'
  | 'repeated-desk'
  | 'missed-opening'
  | 'wrong-category'
  | 'unknown-hinge'
  | 'occluded'
  | 'hostile-text'
  | 'two-identical';
const unknown = () => ({
  status: 'unknown' as const,
  value: null,
  sourceId: null,
});
const evidence = () => ({ status: 'unknown' as const, sourceId: null });
/** Authored semantics only: intentionally does not infer anything from pixels or image text. */
export function recognitionFixture(
  kind: RecognitionCase,
  sources: readonly string[],
): DraftHypothesis {
  const room = { width: unknown(), depth: unknown(), height: unknown() };
  const observations: DraftObservation[] = [];
  const add = (
    sourceId: string,
    ref: string,
    category = 'procedural-desk',
    itemKind: DraftObservation['kind'] = 'furniture',
  ) => {
    observations.push({
      ref,
      sourceId,
      kind: itemKind,
      catalogueId: itemKind === 'furniture' ? category : null,
      label: itemKind === 'furniture' ? 'Desk' : itemKind,
      wall: 'unknown',
      wallEvidence: evidence(),
      mechanism: 'unknown',
      mechanismEvidence: evidence(),
      hinge: 'unknown',
      hingeEvidence: evidence(),
      poseEvidence: { status: 'estimated', sourceId },
      visibility: kind === 'occluded' ? 'occluded' : 'visible',
      finish: 'oak',
      width: unknown(),
      depth: unknown(),
      height: unknown(),
      offset: unknown(),
      sill: unknown(),
      projection: unknown(),
      sketch: { x: 0.7, z: 0.3, quarterTurns: 0 },
    });
  };
  if (kind !== 'empty')
    for (const [i, source] of sources.entries()) {
      add(
        source,
        `desk_${i}`,
        kind === 'wrong-category' ? 'procedural-chair' : 'procedural-desk',
      );
      if (kind === 'two-identical') {
        add(source, `other_${i}`);
        observations.at(-1)!.sketch.x = 0.25;
      }
    }
  if (kind === 'unknown-hinge' && sources[0])
    add(sources[0], 'door', '', 'door');
  const groups =
    kind === 'two-identical'
      ? observations.map((o) => [o.ref])
      : [
          observations.filter((o) => o.kind === 'furniture').map((o) => o.ref),
        ].filter((g) => g.length);
  for (const o of observations.filter((o) => o.kind !== 'furniture'))
    groups.push([o.ref]);
  return {
    version: 1,
    shape: 'unknown',
    frameEvidence: evidence(),
    room,
    observations,
    groups,
  };
}
/** Default demo varies only by declared starting condition; no image recognition claim. */
export function createRecognitionFakeProvider() {
  return createFakeProvider(async (request, signal) => {
    if (signal.aborted) return { kind: 'cancelled' };
    const first = request.input[0]?.content;
    if (!Array.isArray(first) || typeof first[0]?.text !== 'string')
      return { kind: 'malformed' };
    let context;
    try {
      context = JSON.parse(first[0].text) as {
        condition: string;
        sources: { id: string }[];
      };
    } catch {
      return { kind: 'malformed' };
    }
    if (!Array.isArray(context.sources) || context.sources.length > 6)
      return { kind: 'malformed' };
    return {
      kind: 'completed',
      calls: [],
      data: recognitionFixture(
        context.condition === 'empty' ? 'empty' : 'repeated-desk',
        context.sources.map((s) => s.id),
      ),
    };
  });
}
