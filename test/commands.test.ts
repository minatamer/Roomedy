import { describe, expect, it } from 'vitest';
import { commandEnvelopeSchema } from '@roomedy/contracts/commands';
import { POLICY } from '@roomedy/contracts/policy';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import {
  applyCommand,
  checkRoom,
  createCommandWorkspace,
  evaluateBatch,
  prepareCommand,
  undoCommand,
  validateRoom,
} from '@roomedy/spatial';
import {
  commandRoom,
  door,
  envelope,
  known,
  move,
  piece,
  windowFeature,
} from './fixtures/command-room.js';

describe('atomic final batches and trusted authority', () => {
  it('permits a coordinated swap and rejects the invalid intermediate single move without mutation', () => {
    const room = commandRoom([piece('a'), piece('b', 5000)]);
    const before = structuredClone(room);
    expect(
      evaluateBatch(room, [move('a', 5000, 2000)], 'visitor'),
    ).toMatchObject({
      ok: false,
      code: 'new-conflict',
      issue: { code: 'overlap', objectIds: ['a', 'b'] },
    });
    const result = evaluateBatch(
      room,
      [move('a', 5000, 2000), move('b', 2000, 2000)],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.room.furniture.map((f) => f.pose.centerX)).toEqual([
      5000, 2000,
    ]);
    expect(result.room.furniture[0]!.pose.provenance.status).toBe('planned');
    expect(result.changes.map((c) => c.id)).toEqual(['a', 'b']);
    expect(room).toEqual(before);
    expect(
      evaluateBatch(
        room,
        [move('a', 3500, 2000), move('missing', 7000, 2000)],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'invalid-input' });
    expect(room).toEqual(before);
  });

  it('uses starting locks even if an earlier action unlocks the object', () => {
    const room = commandRoom([piece('a')]);
    room.furniture[0]!.locks.position = true;
    const unlock = {
      type: 'set-locks',
      id: 'a',
      locks: { position: false, dimensions: false, rotation: false },
    } as const;
    expect(
      evaluateBatch(room, [unlock, move('a', 3000, 2000)], 'visitor'),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(room.furniture[0]!.locks.position).toBe(true);
    const explicitUnlock = evaluateBatch(room, [unlock], 'visitor');
    expect(explicitUnlock.ok).toBe(true);
    if (explicitUnlock.ok)
      expect(
        evaluateBatch(explicitUnlock.room, [move('a', 3000, 2000)], 'visitor')
          .ok,
      ).toBe(true);
    expect(evaluateBatch(room, [unlock], 'assistant')).toMatchObject({
      ok: false,
      code: 'invalid-input',
    });
  });

  it('preserves rotation/dimension locks, retained dimensions and owned finishes', () => {
    const room = commandRoom([piece('a')]);
    room.furniture[0]!.locks.rotation = true;
    expect(
      evaluateBatch(
        room,
        [{ type: 'rotate', id: 'a', quarterTurns: 1 }],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(
      evaluateBatch(
        room,
        [{ type: 'resize', id: 'a', width: 1300, depth: 600, height: 740 }],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'owned-dimensions' });
    expect(
      evaluateBatch(
        room,
        [{ type: 'finish', id: 'a', finish: 'sage' }],
        'assistant',
      ),
    ).toMatchObject({ ok: false, code: 'retained' });
    expect(
      evaluateBatch(
        room,
        [{ type: 'finish', id: 'a', finish: 'sage' }],
        'visitor',
      ).ok,
    ).toBe(true);
    expect(
      evaluateBatch(room, [{ type: 'remove', id: 'a' }], 'assistant').ok,
    ).toBe(false);
    const offered = structuredClone(room);
    offered.furniture[0]!.ownership = 'proposed';
    offered.furniture[0]!.locks.dimensions = true;
    expect(
      evaluateBatch(
        offered,
        [{ type: 'resize', id: 'a', width: 1300, depth: 600, height: 740 }],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'locked' });
  });

  it('rejects model confirmation, owned additions, confirmed poses and room feature renovation', () => {
    const room = commandRoom();
    const addition = piece('new');
    expect(
      evaluateBatch(room, [{ type: 'add', furniture: addition }], 'assistant')
        .ok,
    ).toBe(false);
    addition.ownership = 'proposed';
    for (const measurement of Object.values(addition.dimensions))
      measurement.status = 'estimated';
    expect(
      evaluateBatch(room, [{ type: 'add', furniture: addition }], 'assistant')
        .ok,
    ).toBe(false);
    addition.pose.provenance = {
      status: 'estimated',
      sourceId: 'assistant-proposal',
    };
    expect(
      evaluateBatch(room, [{ type: 'add', furniture: addition }], 'assistant')
        .ok,
    ).toBe(true);
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'confirm-measurement',
            target: { kind: 'room', id: room.roomId, field: 'width' },
            value: 5000,
          },
        ],
        'assistant',
      ),
    ).toMatchObject({ ok: false, code: 'invalid-input' });
    expect(
      evaluateBatch(
        room,
        [{ type: 'add-feature', feature: door() }],
        'assistant',
      ).ok,
    ).toBe(false);
    expect(
      evaluateBatch(
        room,
        [{ ...move('new', 2000, 2000), origin: 'visitor' }],
        'assistant',
      ).ok,
    ).toBe(false);
  });

  it('protects a starting keep preference on proposed pieces while flexible proposals remain replaceable', () => {
    const retained = piece('retained');
    retained.ownership = 'proposed';
    retained.preference = 'keep';
    const room = commandRoom([retained]);
    const replacement = piece('retained');
    replacement.ownership = 'proposed';
    replacement.pose.provenance = {
      status: 'estimated',
      sourceId: 'assistant-proposal',
    };
    for (const measurement of Object.values(replacement.dimensions))
      measurement.status = 'estimated';
    const remove = { type: 'remove', id: 'retained' } as const;
    const replace = {
      type: 'replace',
      id: 'retained',
      furniture: replacement,
    } as const;
    expect(evaluateBatch(room, [remove], 'assistant')).toMatchObject({
      ok: false,
      code: 'retained',
    });
    expect(evaluateBatch(room, [replace], 'assistant')).toMatchObject({
      ok: false,
      code: 'retained',
    });
    expect(evaluateBatch(room, [remove], 'visitor').ok).toBe(true);
    retained.preference = 'flexible';
    expect(evaluateBatch(room, [remove], 'assistant').ok).toBe(true);
    expect(evaluateBatch(room, [replace], 'assistant').ok).toBe(true);
  });

  it('retains measured physical sizes outside fixed/procedural representation ranges without permitting unsupported offered variants', () => {
    const fixed = piece('chair', 2000, 2000, {
      catalogueId: 'chair-desk-fixed',
      width: 670,
      depth: 630,
      height: 1216,
    });
    fixed.finish = 'clay';
    const room = commandRoom([fixed, piece('desk', 5000)]);
    const result = evaluateBatch(
      room,
      [
        {
          type: 'correct-dimensions',
          id: 'chair',
          width: 680,
          depth: 630,
          height: 1216,
        },
        {
          type: 'correct-dimensions',
          id: 'desk',
          width: 1900,
          depth: 600,
          height: 740,
        },
      ],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.room.furniture.map((f) => [
        f.id,
        f.ownership,
        f.dimensions.width.value,
      ]),
    ).toEqual([
      ['chair', 'owned', 680],
      ['desk', 'owned', 1900],
    ]);
    expect(validateRoom(JSON.parse(JSON.stringify(result.room)))).toEqual(
      result.room,
    );
    const proposed = piece('offer', 8000);
    proposed.ownership = 'proposed';
    proposed.dimensions.width = known(1900);
    expect(
      evaluateBatch(room, [{ type: 'add', furniture: proposed }], 'visitor'),
    ).toMatchObject({ ok: false, code: 'unsupported-variant' });
    const replacement = { ...proposed, id: 'desk' };
    expect(
      evaluateBatch(
        room,
        [{ type: 'replace', id: 'desk', furniture: replacement }],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'unsupported-variant' });
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'confirm-measurement',
            target: { kind: 'furniture', id: 'chair', field: 'width' },
            value: POLICY.furnitureEdgeMm + 1,
          },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
  });

  it('retains true measurement conflicts but does not let a mixed correction/move batch bypass hard guards', () => {
    const room = commandRoom([piece('a', 1800, 2000)]);
    const corrected = evaluateBatch(
      room,
      [
        {
          type: 'correct-dimensions',
          id: room.roomId,
          width: 2000,
          depth: 10000,
          height: 3000,
        },
      ],
      'visitor',
    );
    expect(corrected.ok).toBe(true);
    if (!corrected.ok) return;
    expect(corrected.policy).toBe('measurement-review');
    expect(corrected.room.room.width).toMatchObject({
      value: 2000,
      status: 'confirmed',
      sourceId: 'visitor-confirmed',
    });
    expect(
      corrected.checks.issues.find((i) => i.rule === 'containment'),
    ).toMatchObject({ severity: 'hard', deficitMm: 400 });
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'confirm-measurement',
            target: { kind: 'room', id: room.roomId, field: 'height' },
            value: 3000,
          },
          move('a', -100, 2000),
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'new-conflict' });
  });

  it('uses one visitor authority for missed/false features and wall/hinge/mechanism corrections', () => {
    const workspace = createCommandWorkspace(
      commandRoom([piece('blocker', 1450, 850, { width: 200, depth: 200 })]),
      { workspaceId: 'features', generation: 0 },
    );
    const added = applyCommand(
      workspace,
      envelope(workspace, [
        { type: 'add-feature', feature: door() },
        { type: 'add-feature', feature: windowFeature() },
      ]),
      'visitor',
    );
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.workspace.current.room.features).toHaveLength(2);
    expect(
      checkRoom(added.workspace.current).issues.some(
        (i) => i.rule === 'door-envelope' && i.severity === 'hard',
      ),
    ).toBe(true);
    const correctedDoor = {
      ...door(),
      wall: 'west' as const,
      hinge: 'right' as const,
      mechanism: 'sliding' as const,
    };
    const update = applyCommand(
      added.workspace,
      envelope(added.workspace, [
        { type: 'update-feature', id: 'door_1', feature: correctedDoor },
        { type: 'remove-feature', id: 'window_1' },
      ]),
      'visitor',
    );
    expect(update.ok).toBe(true);
    if (!update.ok) return;
    expect(update.workspace.current.room.features).toHaveLength(1);
    expect(update.workspace.current.room.features[0]).toMatchObject({
      wall: 'west',
      hinge: 'right',
      mechanism: 'sliding',
    });
    const undoUpdate = undoCommand(update.workspace);
    expect(undoUpdate.ok).toBe(true);
    if (!undoUpdate.ok) return;
    expect(undoUpdate.workspace.current.room.features).toEqual(
      added.workspace.current.room.features,
    );
    const undoAdd = undoCommand(undoUpdate.workspace);
    expect(undoAdd.ok).toBe(true);
    if (undoAdd.ok) expect(undoAdd.workspace.current.room.features).toEqual([]);
    expect(
      evaluateBatch(
        workspace.current,
        [
          { type: 'add-feature', feature: door() },
          { type: 'remove-feature', id: 'missing' },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
    expect(workspace.current.room.features).toEqual([]);
  });

  it('rejects cross-kind IDs and remove/add reuse rather than ambiguously targeting room facts', () => {
    expect(
      roomDocumentSchema.safeParse(commandRoom([piece('room_test')])).success,
    ).toBe(false);
    expect(
      roomDocumentSchema.safeParse(
        commandRoom([], [{ ...door(), id: 'room_test' }]),
      ).success,
    ).toBe(false);
    const room = commandRoom([piece('a')]);
    expect(
      evaluateBatch(
        room,
        [{ type: 'add-feature', feature: { ...door(), id: 'a' } }],
        'visitor',
      ).ok,
    ).toBe(false);
    expect(
      evaluateBatch(
        room,
        [
          { type: 'remove', id: 'a' },
          { type: 'add', furniture: piece('a', 5000) },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
  });
});

describe('baseline repair compares physical issue identity and region', () => {
  const conflict = () =>
    commandRoom([
      piece('a', 2000, 2000, { width: 1000, depth: 1000 }),
      piece('b', 2500, 2000, { width: 1000, depth: 1000 }),
      piece('c', 6000, 2000, { width: 1000, depth: 1000 }),
    ]);

  it('rejects a same-count different blocker, worsening and translated conflict region', () => {
    const room = conflict();
    expect(
      checkRoom(room).issues.find((i) => i.rule === 'solid'),
    ).toMatchObject({ objectIds: ['a', 'b'], areaMm2: 500000 });
    expect(
      evaluateBatch(room, [move('b', 5500, 2000)], 'visitor'),
    ).toMatchObject({ ok: false, code: 'new-conflict' });
    expect(
      evaluateBatch(room, [move('b', 2200, 2000)], 'visitor'),
    ).toMatchObject({ ok: false, code: 'new-conflict' });
    expect(
      evaluateBatch(
        room,
        [move('a', 2000, 2100), move('b', 2500, 2100)],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'new-conflict' });
  });

  it('accepts a smaller contained overlap and appearance-only edits but rejects unrelated movement', () => {
    const room = conflict();
    const improved = evaluateBatch(room, [move('b', 2600, 2000)], 'visitor');
    expect(improved.ok).toBe(true);
    if (improved.ok) {
      expect(improved.policy).toBe('repair');
      expect(
        improved.checks.issues.find((i) => i.rule === 'solid'),
      ).toMatchObject({
        areaMm2: 400000,
        region: { minX: 2100, maxX: 2500, minZ: 1500, maxZ: 2500 },
      });
    }
    expect(
      evaluateBatch(
        room,
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'sage' }],
        'visitor',
      ),
    ).toMatchObject({ ok: true, policy: 'appearance-with-issues' });
    expect(
      evaluateBatch(room, [move('c', 6500, 2000)], 'visitor'),
    ).toMatchObject({ ok: false, code: 'no-improvement' });
  });
});

describe('Apply and bounded replay retirement', () => {
  it('rechecks revision/scope/versions/payload and produces a single whole-instruction receipt', () => {
    const initial = createCommandWorkspace(commandRoom([piece('a')]), {
      workspaceId: 'workspace',
      generation: 2,
    });
    const command = envelope(initial, [
      move('a', 3000.5, 2000.5),
      { type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' },
    ]);
    expect(
      commandEnvelopeSchema.safeParse(JSON.parse(JSON.stringify(command)))
        .success,
    ).toBe(true);
    expect(prepareCommand(initial, command, 'visitor').ok).toBe(true);
    const first = applyCommand(initial, command, 'visitor');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.workspace.current.roomRevision).toBe(1);
    expect(first.workspace.history.entries).toHaveLength(1);
    expect(first.receipt?.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(applyCommand(first.workspace, command, 'visitor')).toMatchObject({
      ok: true,
      status: 'already-applied',
      undoRecorded: false,
    });
    expect(
      applyCommand(
        first.workspace,
        { ...command, actions: [move('a', 3500, 2000)] },
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'replay-mismatch' });
    const next = envelope(first.workspace, [move('a', 4000, 2000)]);
    for (const identity of [
      { ...next.identity, inputRevision: 0 },
      { ...next.identity, generation: 3 },
      { ...next.identity, workspaceId: 'other' },
      { ...next.identity, roomId: 'other' },
    ])
      expect(
        applyCommand(first.workspace, { ...next, identity }, 'visitor'),
      ).toMatchObject({ ok: false, code: 'stale' });
    expect(
      applyCommand(
        first.workspace,
        { ...next, rulesVersion: 'unsupported' },
        'visitor',
      ).ok,
    ).toBe(false);
    expect(initial.current.furniture[0]!.pose.centerX).toBe(2000);
  });

  it('keeps more than 256 no-ops usable with bounded receipts and rejects retired commands', () => {
    let workspace = createCommandWorkspace(commandRoom(), {
      workspaceId: 'long_session',
      generation: 0,
    });
    const first = envelope(workspace, [
      { type: 'room-finish', floorFinish: 'oak', wallFinish: 'ivory' },
    ]);
    let latest = first;
    for (let n = 0; n < 300; n++) {
      latest = envelope(workspace, [
        { type: 'room-finish', floorFinish: 'oak', wallFinish: 'ivory' },
      ]);
      const result = applyCommand(workspace, latest, 'visitor');
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.status).toBe('unchanged');
      workspace = result.workspace;
      expect(workspace.receipts.length).toBeLessThanOrEqual(
        POLICY.receiptEntries,
      );
      expect(
        workspace.receipts.reduce((sum, item) => sum + item.bytes, 0),
      ).toBeLessThanOrEqual(POLICY.receiptBytes);
    }
    expect(workspace.current.roomRevision).toBe(0);
    expect(workspace.history.entries).toEqual([]);
    expect(workspace.lastCommandSequence).toBe(300);
    expect(applyCommand(workspace, first, 'visitor')).toMatchObject({
      ok: false,
      code: 'stale',
    });
    expect(
      applyCommand(
        workspace,
        {
          ...first,
          actions: [
            { type: 'room-finish', floorFinish: 'clay', wallFinish: 'ivory' },
          ],
        },
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'stale' });
    expect(applyCommand(workspace, latest, 'visitor')).toMatchObject({
      ok: true,
      status: 'already-applied',
    });
    expect(
      applyCommand(
        workspace,
        {
          ...latest,
          actions: [
            { type: 'room-finish', floorFinish: 'clay', wallFinish: 'ivory' },
          ],
        },
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(
      applyCommand(
        workspace,
        {
          ...envelope(workspace, [
            { type: 'room-finish', floorFinish: 'oak', wallFinish: 'ivory' },
          ]),
          commandSequence: 302,
        },
        'visitor',
      ).ok,
    ).toBe(false);
  });

  it('Undo restores semantics as a new revision, preserves baseline/retirement and does not replay a duplicate', () => {
    const initial = createCommandWorkspace(commandRoom([piece('a')]), {
      workspaceId: 'undo',
      generation: 0,
    });
    const command = envelope(initial, [
      move('a', 3000, 2000),
      { type: 'finish', id: 'a', finish: 'sage' },
    ]);
    const applied = applyCommand(initial, command, 'visitor');
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const undone = undoCommand(applied.workspace);
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;
    expect(undone.workspace.current).toEqual({
      ...initial.current,
      roomRevision: 2,
    });
    expect(undone.workspace.baseline).toBe(initial.baseline);
    expect(undone.workspace.lastCommandSequence).toBe(1);
    expect(undone.workspace.receipts).toEqual(applied.workspace.receipts);
    expect(undone.workspace.history.entries).toEqual([]);
    expect(undone.checks.roomRevision).toBe(2);
    expect(applyCommand(undone.workspace, command, 'visitor')).toMatchObject({
      ok: true,
      status: 'already-applied',
    });
    expect(undoCommand(undone.workspace)).toMatchObject({
      ok: false,
      code: 'nothing-to-undo',
    });
    expect(
      Object.isFrozen(undone.workspace.current.furniture[0]!.dimensions),
    ).toBe(true);
  });

  it('retires by actual receipt bytes as well as count while accepting new instructions', () => {
    const room = commandRoom();
    room.roomId = 'room_'.padEnd(80, 'x');
    let workspace = createCommandWorkspace(room, {
      workspaceId: 'byte_window',
      generation: 0,
    });
    const actions = Array.from({ length: POLICY.actions }, () => ({
      type: 'confirm-measurement' as const,
      target: {
        kind: 'room' as const,
        id: room.roomId,
        field: 'height' as const,
      },
      value: 3000,
    }));
    const retired = envelope(workspace, actions);
    for (let n = 0; n < 180; n++) {
      const result = applyCommand(
        workspace,
        envelope(workspace, actions),
        'visitor',
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      workspace = result.workspace;
    }
    expect(workspace.lastCommandSequence).toBe(180);
    expect(workspace.receipts.length).toBeLessThan(180);
    expect(workspace.receipts.length).toBeLessThan(POLICY.receiptEntries);
    expect(
      workspace.receipts.reduce((sum, item) => sum + item.bytes, 0),
    ).toBeLessThanOrEqual(POLICY.receiptBytes);
    expect(applyCommand(workspace, retired, 'visitor')).toMatchObject({
      ok: false,
      code: 'stale',
    });
  });
});
