import { it, expect } from 'vitest';
import {
  createCommandWorkspace,
  prepareCommand,
  applyCommand,
  evaluateScopedBatch,
  proposedSearchPiece,
  LayoutSearch,
  validateSearchCandidate,
} from '@roomedy/spatial';
import { commandRoom, piece, envelope, move } from './fixtures/command-room.js';
import {
  scopeFor,
  goal,
  request,
  windowCase,
} from './fixtures/search-corpus.js';
it('enforces trusted targets at assistant Prepare and Apply, including after successful preparation', () => {
  const room = commandRoom([piece('a', 2000, 2000), piece('b', 6000, 2000)]),
    selected = goal({ targetIds: ['a', 'b'] }),
    scope = scopeFor(room, selected);
  const workspace = createCommandWorkspace(room, {
    workspaceId: 'workspace',
    generation: 0,
  });
  const command = envelope(workspace, [
    move('a', 6000, 2000),
    move('b', 2000, 2000),
  ]);
  expect(prepareCommand(workspace, command, 'assistant')).toMatchObject({
    ok: false,
    code: 'out-of-scope',
  });
  expect(prepareCommand(workspace, command, 'assistant', scope).ok).toBe(true);
  expect(
    applyCommand(workspace, command, 'assistant', {
      ...scope,
      targetIds: ['a'],
    }),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  expect(workspace.current).toEqual(room);
  const applied = applyCommand(workspace, command, 'assistant', scope);
  expect(applied.ok).toBe(true);
  if (!applied.ok) throw new Error('fixture');
  expect(applied.workspace.history.entries).toHaveLength(1);
  expect(
    applyCommand(applied.workspace, command, 'assistant', scope),
  ).toMatchObject({ ok: true, status: 'already-applied' });
});
it('does not infer permission from an unrelated unlocked piece, room finishes or rotation embedded in a move', () => {
  const room = commandRoom([
      piece('desk', 2000, 2000),
      piece('other', 6000, 2000),
    ]),
    scope = scopeFor(room, goal({ targetIds: ['desk'] }));
  expect(
    evaluateScopedBatch(
      room,
      [
        {
          type: 'move',
          id: 'other',
          pose: { centerX: 6500, centerZ: 2000, quarterTurns: 0 },
        },
      ],
      scope,
    ),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  expect(
    evaluateScopedBatch(
      room,
      [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'clay' }],
      scope,
    ),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  const movementOnly = { ...scope, actionKinds: ['move' as const] };
  expect(
    evaluateScopedBatch(
      room,
      [
        {
          type: 'move',
          id: 'desk',
          pose: { centerX: 2000, centerZ: 2000, quarterTurns: 1 },
        },
      ],
      movementOnly,
    ),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  expect(
    evaluateScopedBatch(
      room,
      [
        {
          type: 'move',
          id: 'desk',
          pose: { centerX: 2200, centerZ: 2000, quarterTurns: 0 },
        },
      ],
      movementOnly,
    ).ok,
  ).toBe(true);
  room.furniture[0]!.locks.position = true;
  expect(
    evaluateScopedBatch(
      room,
      [
        {
          type: 'move',
          id: 'desk',
          pose: { centerX: 2200, centerZ: 2000, quarterTurns: 0 },
        },
      ],
      scope,
    ),
  ).toMatchObject({ ok: false, code: 'locked' });
});
it('requires exact application-owned add/replace/remove scope and preserves rearrange-owned semantics', () => {
  const room = commandRoom(),
    choice = {
      id: 'new_desk',
      catalogueId: 'procedural-desk',
      size: null,
      finish: null,
    },
    selected = goal({ kind: 'furnish', additions: [choice] }),
    scope = scopeFor(room, selected),
    added = proposedSearchPiece(choice)!;
  added.pose.centerX = 2000;
  added.pose.centerZ = 2000;
  expect(
    evaluateScopedBatch(room, [{ type: 'add', furniture: added }], scope).ok,
  ).toBe(true);
  expect(
    evaluateScopedBatch(
      room,
      [{ type: 'add', furniture: { ...added, id: 'model_chosen' } }],
      scope,
    ),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  expect(
    evaluateScopedBatch(
      room,
      [
        { type: 'add', furniture: added },
        { type: 'room-finish', floorFinish: 'clay', wallFinish: 'clay' },
      ],
      scope,
    ),
  ).toMatchObject({ ok: false, code: 'out-of-scope' });
  const invalidGoal = { ...selected, kind: 'rearrange-owned' as const };
  const search = new LayoutSearch(request(room, invalidGoal), scope);
  expect(search.finish().termination).toBe('out-of-scope');
});
it('revalidates goal satisfaction as well as scope when a candidate is substituted', () => {
  const { room, selected } = windowCase(),
    input = request(room, selected),
    scope = scopeFor(room, selected),
    search = new LayoutSearch(input, scope);
  while (!search.step()) {}
  const candidate = search.finish().candidate!;
  expect(candidate).not.toBeNull();
  const wrong = {
    ...candidate,
    actions: [
      {
        type: 'move' as const,
        id: 'desk',
        pose: { centerX: 3000, centerZ: 3100, quarterTurns: 0 as const },
      },
    ],
  };
  expect(validateSearchCandidate(input, wrong, scope)).toBeNull();
  const claimed = {
    ...candidate,
    facts: { ...candidate.facts, requiredPiecesPlaced: 40 },
    affectedIds: ['unrelated_shelf'],
  };
  const checked = validateSearchCandidate(input, claimed, scope)!;
  expect(checked.facts.requiredPiecesPlaced).toBe(0);
  expect(checked.affectedIds).not.toContain('unrelated_shelf');
});

it('permits default size protection on a scoped new piece without granting placement locks or lock-edit authority', () => {
  const room = commandRoom(),
    choice = {
      id: 'new_desk',
      catalogueId: 'procedural-desk',
      size: null,
      finish: null,
    };
  const scope = scopeFor(room, goal({ kind: 'furnish', additions: [choice] }));
  const added = proposedSearchPiece(choice)!;
  added.pose.centerX = 2000;
  added.pose.centerZ = 2000;
  expect(added.locks).toEqual({
    position: false,
    rotation: false,
    dimensions: true,
  });
  expect(
    evaluateScopedBatch(room, [{ type: 'add', furniture: added }], scope).ok,
  ).toBe(true);
  for (const lock of ['position', 'rotation'] as const)
    expect(
      evaluateScopedBatch(
        room,
        [
          {
            type: 'add',
            furniture: { ...added, locks: { ...added.locks, [lock]: true } },
          },
        ],
        scope,
      ).ok,
    ).toBe(false);
  expect(
    evaluateScopedBatch(
      room,
      [
        {
          type: 'add',
          furniture: { ...added, locks: { ...added.locks, dimensions: false } },
        },
      ],
      scope,
    ).ok,
  ).toBe(true);
  expect(
    evaluateScopedBatch(
      room,
      [{ type: 'set-locks', id: added.id, locks: added.locks } as never],
      scope,
    ).ok,
  ).toBe(false);
});
