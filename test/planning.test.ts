import { expect, it } from 'vitest';
import {
  planningRoom,
  planningChecks,
  resolveAssistantTask,
  LayoutSearch,
  evaluateScopedBatch,
  validateSearchCandidate,
  createCommandWorkspace,
  prepareCommand,
  applyCommand,
  undoCommand,
} from '@roomedy/spatial';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { assistantToolSchemas } from '@roomedy/contracts/assistant';
import {
  commandRoom,
  piece,
  windowFeature,
  door,
  unknown,
  envelope,
} from './fixtures/command-room.js';
import { goal, request, scopeFor } from './fixtures/search-corpus.js';
const plannedMove = (id: string, x: number, z: number) => ({
  type: 'move' as const,
  id,
  pose: { centerX: x, centerZ: z, quarterTurns: 0 as const },
});

it('uses deterministic bounded planning defaults without changing supplied values, locks or evidence', () => {
  const room = commandRoom(
    [piece('desk', 2200, 2800)],
    [windowFeature(), door()],
  );
  room.room.width = unknown();
  room.room.depth = unknown();
  room.room.height = unknown();
  room.furniture[0]!.dimensions.width = unknown();
  room.furniture[0]!.dimensions.height = unknown();
  for (const f of room.room.features) {
    f.wall = 'unknown';
    f.wallProvenance = { status: 'unknown', sourceId: null };
    f.width = unknown();
    f.height = unknown();
    f.sill = unknown();
    f.offset = unknown();
    if (f.kind !== 'obstacle') {
      f.mechanism = 'unknown';
      f.mechanismProvenance = { status: 'unknown', sourceId: null };
    }
  }
  const before = structuredClone(room),
    planned = planningRoom(room);
  expect(planningRoom(room)).toEqual(planned);
  expect(roomDocumentSchema.safeParse(planned).success).toBe(true);
  expect(planned.room.width).toMatchObject({
    value: 6000,
    status: 'estimated',
  });
  expect(planned.furniture[0]!.dimensions.depth).toEqual(
    before.furniture[0]!.dimensions.depth,
  );
  expect(planned.furniture[0]!.locks).toEqual(before.furniture[0]!.locks);
  expect(
    planningChecks(room).issues.some((i) => i.severity === 'unassessed'),
  ).toBe(false);
  expect(room).toEqual(before);
  expect(planningRoom(planned)).toBe(planned);
  expect('request_measurement' in assistantToolSchemas).toBe(false);
});

it('finds and validates a proposal with missing room, actor and window geometry, then applies and undoes only its actions', () => {
  const room = commandRoom([piece('desk', 3000, 3500)], [windowFeature()]);
  room.room.width = unknown();
  room.room.depth = unknown();
  room.furniture[0]!.dimensions.width = unknown();
  room.furniture[0]!.dimensions.depth = unknown();
  const window = room.room.features[0]!;
  window.wall = 'unknown';
  window.wallProvenance = { status: 'unknown', sourceId: null };
  window.offset = unknown();
  window.width = unknown();
  const selected = goal({ targetIds: ['desk'], windowId: window.id }),
    input = request(room, selected, 500),
    scope = scopeFor(room, selected),
    original = structuredClone(room),
    search = new LayoutSearch(input, scope);
  while (!search.step()) {}
  const found = search.finish();
  expect(found.candidate).not.toBeNull();
  expect(found.question).toBeNull();
  expect(found.alternatives).not.toContain('confirm-measurement');
  const actions = found.candidate!.actions;
  expect(validateSearchCandidate(input, { actions }, scope)).not.toBeNull();
  const evaluated = evaluateScopedBatch(room, actions, scope);
  expect(evaluated.ok).toBe(true);
  if (!evaluated.ok) throw new Error('fixture');
  expect(evaluated.room.room).toEqual(original.room);
  expect(evaluated.room.furniture[0]!.dimensions).toEqual(
    original.furniture[0]!.dimensions,
  );
  const workspace = createCommandWorkspace(room, {
      workspaceId: 'planning_workspace',
      generation: 0,
    }),
    prepared = prepareCommand(
      workspace,
      envelope(workspace, actions),
      'assistant',
      scope,
    );
  expect(prepared.ok).toBe(true);
  if (!prepared.ok) throw new Error('fixture');
  const applied = applyCommand(
    workspace,
    envelope(workspace, actions),
    'assistant',
    scope,
  );
  expect(applied.ok).toBe(true);
  if (!applied.ok) throw new Error('fixture');
  expect(applied.workspace.current.room).toEqual(original.room);
  expect(applied.workspace.current.furniture[0]!.dimensions).toEqual(
    original.furniture[0]!.dimensions,
  );
  const undone = undoCommand(applied.workspace);
  expect(undone.ok).toBe(true);
  if (!undone.ok) throw new Error('fixture');
  expect(undone.workspace.current.furniture).toEqual(original.furniture);
  expect(room).toEqual(original);
});

it('retains actual conflicts, scope and deliberate locks when planning with missing values', () => {
  const room = commandRoom([piece('desk', 2200, 2800)]);
  room.furniture[0]!.dimensions.width = unknown();
  const selected = goal({ kind: 'open-space', targetIds: ['desk'] }),
    scope = scopeFor(room, selected);
  expect(
    evaluateScopedBatch(room, [plannedMove('desk', -5000, 2800)], scope).ok,
  ).toBe(false);
  expect(
    evaluateScopedBatch(room, [plannedMove('desk', 1000, 1000)], {
      ...scope,
      targetIds: [],
    }).ok,
  ).toBe(false);
  room.furniture[0]!.locks.position = true;
  expect(
    evaluateScopedBatch(room, [plannedMove('desk', 1000, 1000)], scope),
  ).toMatchObject({ ok: false, code: 'locked' });
  room.furniture[0]!.locks.position = false;
  room.room.width = unknown();
  const task = resolveAssistantTask(
    room,
    'Move the desk to the left',
    null,
    'plan',
  );
  expect(task.kind).toBe('edits');
  expect(task.question).toBeNull();
  expect(task.control).toBeNull();
  expect(room.room.width).toEqual(unknown());
});
