import { it, expect } from 'vitest';
import {
  LayoutSearch,
  evaluateScopedBatch,
  checkRoom,
  proposedSearchPiece,
  validateSearchCandidate,
} from '@roomedy/spatial';
import { searchRequestSchema } from '@roomedy/contracts/search';
import {
  emptyCase,
  partialCase,
  windowCase,
  rearrangeCase,
  goal,
  scopeFor,
  request,
} from './fixtures/search-corpus.js';
import {
  known,
  unknown,
  commandRoom,
  piece,
  windowFeature,
} from './fixtures/command-room.js';

function run(input: ReturnType<typeof request>) {
  const search = new LayoutSearch(input, scopeFor(input.room, input.goal));
  while (!search.step()) {}
  return search.finish();
}
it('labels clean proposed-size estimates approximate even when no spatial issue is emitted', () => {
  const room = commandRoom(),
    selected = goal({
      kind: 'furnish',
      additions: [
        {
          id: 'desk',
          catalogueId: 'procedural-desk',
          size: null,
          finish: 'oak',
        },
      ],
    });
  const result = run(request(room, selected, 200));
  expect(result.candidate).not.toBeNull();
  expect(
    result.candidate!.checks.issues.every(
      (issue) => issue.limitation === 'not-implemented',
    ),
  ).toBe(true);
  expect(result.candidate!.facts.approximate).toBe(true);
});
it('finds all selected empty-room essentials through the full shared validator without mutating input', () => {
  const { room, selected } = emptyCase(),
    original = JSON.stringify(room),
    result = run(request(room, selected, 4000));
  expect(result.candidate).not.toBeNull();
  const candidate = result.candidate!,
    evaluated = evaluateScopedBatch(
      room,
      candidate.actions,
      scopeFor(room, selected),
    );
  expect(evaluated.ok).toBe(true);
  if (!evaluated.ok) throw new Error('fixture');
  expect(evaluated.room.furniture).toHaveLength(4);
  expect(candidate.facts.requiredPiecesPlaced).toBe(4);
  expect(candidate.facts.approximate).toBe(true);
  expect(evaluated.checks.issues.filter((i) => i.severity === 'hard')).toEqual(
    [],
  );
  for (const p of evaluated.room.furniture) {
    const w =
        p.pose.quarterTurns % 2
          ? p.dimensions.depth.value!
          : p.dimensions.width.value!,
      d =
        p.pose.quarterTurns % 2
          ? p.dimensions.width.value!
          : p.dimensions.depth.value!;
    expect(p.pose.centerX - w / 2).toBeGreaterThanOrEqual(0);
    expect(p.pose.centerX + w / 2).toBeLessThanOrEqual(6000);
    expect(p.pose.centerZ - d / 2).toBeGreaterThanOrEqual(0);
    expect(p.pose.centerZ + d / 2).toBeLessThanOrEqual(5000);
    expect(p.ownership).toBe('proposed');
  }
  expect(JSON.stringify(room)).toBe(original);
});
it('adds around a retained bed/fixed wardrobe and preserves exact identities, dimensions and locks', () => {
  const { room, selected } = partialCase(),
    result = run(request(room, selected));
  expect(result.candidate).not.toBeNull();
  const evaluated = evaluateScopedBatch(
    room,
    result.candidate!.actions,
    scopeFor(room, selected),
  );
  if (!evaluated.ok) throw new Error('fixture');
  for (const original of room.furniture)
    expect(evaluated.room.furniture.find((p) => p.id === original.id)).toEqual(
      original,
    );
  expect(result.candidate!.facts.windowDistanceMm.after).toBeLessThanOrEqual(
    400,
  );
});
it('improves a tight window goal with door-safe coordinated desk/chair work and preserves an unrelated unlocked shelf', () => {
  const { room, selected } = windowCase(),
    result = run(request(room, selected));
  expect(result.candidate).not.toBeNull();
  const candidate = result.candidate!;
  expect(candidate.facts.windowDistanceMm.after).toBeLessThanOrEqual(400);
  expect(candidate.facts.windowDistanceMm.after).toBeLessThan(
    candidate.facts.windowDistanceMm.before!,
  );
  expect(candidate.facts.deskChairAlignmentMm.after).toBeLessThanOrEqual(100);
  expect(candidate.facts.chairFacesDesk.after).toBe(true);
  expect(candidate.facts.coordinatedIds).toEqual(['chair', 'desk']);
  const evaluated = evaluateScopedBatch(
    room,
    candidate.actions,
    scopeFor(room, selected),
  );
  if (!evaluated.ok) throw new Error('fixture');
  expect(
    evaluated.room.furniture.find((p) => p.id === 'unrelated_shelf'),
  ).toEqual(room.furniture.find((p) => p.id === 'unrelated_shelf'));
  expect(evaluated.room.furniture.find((p) => p.id === 'bed')).toEqual(
    room.furniture.find((p) => p.id === 'bed'),
  );
  expect(candidate.checks.issues.filter((i) => i.severity === 'hard')).toEqual(
    [],
  );
  expect(
    candidate.actions.every(
      (a) => 'id' in a && ['desk', 'chair'].includes(a.id),
    ),
  ).toBe(true);
});
it('rearranges only owned pieces with measurable central-area improvement and no new identities or variants', () => {
  const { room, selected } = rearrangeCase(),
    result = run(request(room, selected));
  expect(result.candidate).not.toBeNull();
  const candidate = result.candidate!;
  expect(
    candidate.facts.centralFreeMm2.after! -
      candidate.facts.centralFreeMm2.before!,
  ).toBeGreaterThanOrEqual(500_000);
  expect(
    candidate.actions.every((a) => a.type === 'move' || a.type === 'rotate'),
  ).toBe(true);
  const evaluated = evaluateScopedBatch(
    room,
    candidate.actions,
    scopeFor(room, selected),
  );
  if (!evaluated.ok) throw new Error('fixture');
  for (const p of evaluated.room.furniture) {
    const old = room.furniture.find((f) => f.id === p.id)!;
    expect(p.dimensions).toEqual(old.dimensions);
    expect(p.catalogueId).toBe(old.catalogueId);
  }
});
it('is reproducible for fixed work, reports exact prefixes at deadlines and never claims exhaustion proves impossibility', () => {
  const { room, selected } = emptyCase(),
    input = request(room, selected, 120);
  expect(run(input)).toEqual(run(input));
  const prefix = new LayoutSearch(
    { ...input, maxNodes: 20000 },
    scopeFor(room, selected),
  );
  for (let i = 0; i < 30; i++) prefix.step();
  const deadline = prefix.finish('deadline'),
    fixed = run(input);
  expect(deadline.visitedNodes).toBe(120);
  expect(deadline.termination).toBe('deadline');
  expect(deadline.candidate).toEqual(fixed.candidate);
  expect(fixed.termination).toBe('work-limit');
});
it('continues past unknown room dimensions and preserves exact half-mm centres', () => {
  const { room, selected } = windowCase();
  room.room.width = unknown();
  const result = run(request(room, selected));
  expect(result.termination).not.toBe('needs-measurement');
  expect(result.question).toBeNull();
  expect(result.candidate).not.toBeNull();
  expect(result.visitedNodes).toBeGreaterThan(0);
  expect(room.room.width).toEqual(unknown());
  const exact = commandRoom(
    [piece('desk', 750.5, 1800, { width: 1501 })],
    [windowFeature()],
  );
  exact.room.width = known(1501);
  exact.room.depth = known(2500);
  exact.room.features[0]!.offset = known(0);
  exact.room.features[0]!.width = known(1501);
  const chosen = goal({ targetIds: ['desk'], windowId: 'window_1' }),
    answer = run(request(exact, chosen));
  expect(answer.candidate).not.toBeNull();
  const move = answer.candidate!.actions.find((a) => a.type === 'move');
  expect(move?.pose.centerX).toBe(750.5);
});
it('bounds a tiny impossible protected combination and rejects tampered candidates rather than trusting claimed checks', () => {
  const room = commandRoom();
  room.room.width = known(1000);
  room.room.depth = known(1000);
  const selected = goal({
      kind: 'furnish',
      additions: [
        { id: 'bed', catalogueId: 'procedural-bed', size: null, finish: 'oak' },
      ],
    }),
    result = run(request(room, selected));
  expect(result.candidate).toBeNull();
  expect(result.termination).toBe('exhausted');
  expect(result.visitedNodes).toBeLessThanOrEqual(64);
  expect(result.alternatives).toContain('no-improvement-within-search');
  const feasible = windowCase(),
    input = request(feasible.room, feasible.selected),
    answer = run(input),
    tampered = answer.candidate!;
  tampered.actions = [
    {
      type: 'move',
      id: 'unrelated_shelf',
      pose: { centerX: 1000, centerZ: 1000, quarterTurns: 0 },
    },
  ];
  expect(
    validateSearchCandidate(
      input,
      tampered,
      scopeFor(feasible.room, feasible.selected),
    ),
  ).toBeNull();
  expect(
    searchRequestSchema.safeParse({ ...input, maxNodes: 20001 }).success,
  ).toBe(false);
});
it('changes only explicitly scoped proposed appearance and keeps all poses/owned finishes intact', () => {
  const { room } = windowCase(),
    proposed = proposedSearchPiece({
      id: 'proposed',
      catalogueId: 'procedural-storage',
      size: null,
      finish: 'oak',
    })!;
  proposed.pose.centerX = 3000;
  proposed.pose.centerZ = 4300;
  room.furniture.push(proposed);
  const selected = goal({
      kind: 'appearance',
      targetIds: ['proposed'],
      pieceFinishes: [{ id: 'proposed', finish: 'walnut' }],
    }),
    answer = run(request(room, selected));
  expect(answer.candidate?.actions).toEqual([
    { type: 'finish', id: 'proposed', finish: 'walnut' },
  ]);
  const evaluated = evaluateScopedBatch(
    room,
    answer.candidate!.actions,
    scopeFor(room, selected),
  );
  if (!evaluated.ok) throw new Error('fixture');
  for (const original of room.furniture) {
    expect(
      evaluated.room.furniture.find((p) => p.id === original.id)?.pose,
    ).toEqual(original.pose);
    if (original.ownership === 'owned')
      expect(
        evaluated.room.furniture.find((p) => p.id === original.id)?.finish,
      ).toBe(original.finish);
  }
  expect(
    checkRoom(evaluated.room).issues.filter((i) => i.severity === 'hard'),
  ).toEqual(checkRoom(room).issues.filter((i) => i.severity === 'hard'));
});
it('uses planning estimates for missing heights without measurement prompts or changed evidence', () => {
  const { room, selected } = windowCase();
  room.room.height = unknown();
  room.furniture.find((p) => p.id === 'desk')!.dimensions.height = unknown();
  room.room.features.find((f) => f.kind === 'window')!.sill = unknown();
  const answer = run(request(room, selected, 500));
  expect(answer.candidate).not.toBeNull();
  expect(answer.candidate!.facts.approximate).toBe(true);
  expect(answer.alternatives).not.toContain('confirm-measurement');
  expect(answer.question).toBeNull();
  expect(answer.candidate!.facts.missingInputs).toEqual([]);
  expect(
    room.furniture.find((p) => p.id === 'desk')!.dimensions.height,
  ).toEqual(unknown());
  expect(answer.candidate!.facts.missingInputs).not.toContain('room:width');
  expect(answer.candidate!.facts.missingInputs).not.toContain(
    'bounded-entry-path-algorithm',
  );
});

it('returns a lock-review alternative instead of moving or shrinking a protected requested desk', () => {
  const { room, selected } = windowCase();
  room.furniture.find((p) => p.id === 'desk')!.locks.position = true;
  const original = JSON.stringify(room),
    answer = run(request(room, selected, 500));
  expect(answer.candidate).toBeNull();
  expect(answer.alternatives).toContain('review-lock');
  expect(JSON.stringify(room)).toBe(original);
  const small = commandRoom(
    [piece('wide', 500, 500, { width: 1500, depth: 1500 })],
    [windowFeature()],
  );
  small.room.width = known(1000);
  small.room.depth = known(1000);
  small.room.features[0]!.offset = known(0);
  small.furniture[0]!.locks.dimensions = true;
  const impossible = run(
    request(small, goal({ targetIds: ['wide'], windowId: 'window_1' }), 500),
  );
  expect(impossible.candidate).toBeNull();
  expect(impossible.alternatives).not.toContain('review-lock');
});
