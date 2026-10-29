import { afterEach, describe, expect, it } from 'vitest';
import { POLICY } from '@roomedy/contracts/policy';
import type { ActionScope, VisitorAction } from '@roomedy/contracts/commands';
import {
  applyCommand,
  prepareCommand,
  proposedSearchPiece,
} from '@roomedy/spatial';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { commandRoom, piece } from './fixtures/command-room.js';

const controllers: SessionController[] = [];
function setup() {
  const room = commandRoom([piece('kept', 2000, 2000)]);
  const c = new SessionController(room);
  controllers.push(c);
  c.setDestination('cost', 'en-US');
  c.setDestination('design');
  const added = proposedSearchPiece({
    id: 'added',
    catalogueId: 'procedural-desk',
    size: null,
    finish: 'oak',
  })!;
  added.pose = {
    centerX: 7000,
    centerZ: 7000,
    quarterTurns: 0,
    provenance: { status: 'planned', sourceId: 'assistant-plan' },
  };
  const scope: ActionScope = {
    roomId: room.roomId,
    roomRevision: 0,
    actionKinds: ['add'],
    targetIds: [],
    additions: [{ id: added.id, catalogueId: added.catalogueId }],
    replacements: [],
    removals: [],
    roomFinishes: false,
  };
  const token = c.beginOperation()!;
  expect(
    c.prepareAssistant(
      token,
      [{ type: 'add', furniture: added }],
      scope,
      'Add a desk',
    ).ok,
  ).toBe(true);
  return { c, token, room, scope, added };
}
afterEach(() => {
  controllers.forEach((c) => c.dispose());
  controllers.length = 0;
});
describe('explicit furniture refinement of a pending assistant proposal', () => {
  it('retires a fully reverted preview without recording a false Undo change', () => {
    const room = commandRoom([piece('kept')]);
    const c = new SessionController(room);
    controllers.push(c);
    const token = c.beginOperation()!;
    const scope: ActionScope = {
      roomId: room.roomId,
      roomRevision: 0,
      actionKinds: ['finish'],
      targetIds: ['kept'],
      additions: [],
      replacements: [],
      removals: [],
      roomFinishes: false,
    };
    expect(
      c.prepareAssistant(
        token,
        [{ type: 'finish', id: 'kept', finish: 'sage' }],
        scope,
        'Recolour',
      ).ok,
    ).toBe(true);
    expect(
      c.refineAssistantFurniture(
        'kept',
        [{ type: 'finish', id: 'kept', finish: 'oak' }],
        token.operationId,
      ).ok,
    ).toBe(true);
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'unchanged',
      changed: false,
    });
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.getSnapshot().pending).toBeNull();
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(0);
    expect(c.getSnapshot().workspace!.current).toEqual(room);
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'already-applied',
    });
    expect(
      c.dispatch(
        [{ type: 'finish', id: 'kept', finish: 'ivory' }],
        'Change finish',
      ).ok,
    ).toBe(true);
  });
  it('edits an existing piece through explicit visitor authority without widening the original model scope', () => {
    const { c, token, room, scope, added } = setup();
    const original = c.getSnapshot().workspace!;
    expect(
      c.refineAssistantFurniture(
        'kept',
        [{ type: 'finish', id: 'kept', finish: 'ivory' }],
        token.operationId,
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().workspace).toBe(original);
    expect(
      c.getSnapshot().candidate!.room.furniture.find((p) => p.id === 'kept')!
        .finish,
    ).toBe('ivory');
    const command = {
      schemaVersion: 1 as const,
      commandId: 'bounded',
      commandSequence: 1,
      identity: token,
      catalogueVersion: room.catalogueVersion,
      rulesVersion: room.rulesVersion,
      actions: [{ type: 'add' as const, furniture: added }],
    };
    expect(
      prepareCommand(
        original,
        command,
        'assistant',
        scope,
        Array.from({ length: POLICY.actions + 1 }, () => ({
          id: 'kept',
          actions: [
            { type: 'finish' as const, id: 'kept', finish: 'ivory' as const },
          ],
        })),
      ).ok,
    ).toBe(false);
    expect(c.applyAssistantPreview().ok).toBe(true);
    expect(
      c.getSnapshot().workspace!.current.furniture.find((p) => p.id === 'kept')!
        .finish,
    ).toBe('ivory');
    expect(c.undo().ok).toBe(true);
    expect({ ...c.getSnapshot().workspace!.current, roomRevision: 0 }).toEqual(
      room,
    );
  });
  it('keeps edits in preview, then applies all changes atomically with replay-safe Undo and pricing restoration', () => {
    const { c, token, room } = setup();
    // Existing draft prices remain accepted until the room is explicitly applied.
    const original = c.getSnapshot().workspace!;
    const pricing = pricingState(c.getSnapshot().cost!);
    c.select('added');
    expect(c.getSnapshot().presentation.panel).toBe('inspector');
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ type: 'finish', id: 'added', finish: 'walnut' }],
        token.operationId,
      ),
    ).toEqual({ ok: true, changed: true });
    expect(
      c.refineAssistantFurniture(
        'added',
        [
          {
            type: 'set-furniture-materials',
            id: 'added',
            materials: { bodyColor: '#ab9876', bodyPattern: 'smooth' },
          },
        ],
        token.operationId,
      ).ok,
    ).toBe(true);
    expect(c.getSnapshot().workspace).toBe(original);
    expect(pricingState(c.getSnapshot().cost!)).toEqual(pricing);
    expect(
      c.getSnapshot().candidate!.room.furniture.find((p) => p.id === 'added'),
    ).toMatchObject({ finish: 'walnut', materials: { bodyColor: '#ab9876' } });
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'applied',
    });
    const applied = c.getSnapshot();
    expect(applied.undoLabel).toBe('Edited room design');
    expect(applied.workspace!.history.entries).toHaveLength(1);
    expect(
      applied.workspace!.current.furniture.find((p) => p.id === 'added')!
        .finish,
    ).toBe('walnut');
    expect(c.applyAssistantPreview()).toMatchObject({
      ok: true,
      status: 'already-applied',
    });
    expect(c.getSnapshot().workspace!.history.entries).toHaveLength(1);
    expect(c.undo().ok).toBe(true);
    expect({ ...c.getSnapshot().workspace!.current, roomRevision: 0 }).toEqual(
      room,
    );
    expect(pricingState(c.getSnapshot().cost!)).toEqual(pricing);
    expect(c.applyAssistantPreview().ok).toBe(false);
  });
  it('discards all tweaks on Cancel and fences stale operation, expiry and reset', () => {
    const { c, token, room } = setup();
    c.select('added');
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ type: 'finish', id: 'added', finish: 'ivory' }],
        token.operationId,
      ).ok,
    ).toBe(true);
    c.cancelPreview();
    expect(c.getSnapshot().workspace!.current).toEqual(room);
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.getSnapshot().presentation.selectedId).toBeNull();
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ type: 'finish', id: 'added', finish: 'oak' }],
        token.operationId,
      ),
    ).toMatchObject({ ok: false, code: 'stale' });
    const next = setup();
    next.c.reset(next.room);
    expect(
      next.c.refineAssistantFurniture(
        'added',
        [{ type: 'finish', id: 'added', finish: 'ivory' }],
        next.token.operationId,
      ).ok,
    ).toBe(false);
    let now = 0;
    const expired = new SessionController(room, { now: () => now });
    controllers.push(expired);
    const t = expired.beginOperation()!;
    expired.prepareAssistant(
      t,
      [{ type: 'finish', id: 'kept', finish: 'ivory' }],
      {
        ...next.scope,
        actionKinds: ['finish'],
        targetIds: ['kept'],
        additions: [],
      },
      'Finish',
    );
    now = POLICY.guestLifetimeMs;
    expect(
      expired.refineAssistantFurniture(
        'kept',
        [{ type: 'finish', id: 'kept', finish: 'walnut' }],
        t.operationId,
      ).ok,
    ).toBe(false);
  });
  it('preserves explicit unlock then move as separate visitor clicks and rejects locked/conflicting edits without changing the preview', () => {
    const { c, token } = setup();
    expect(
      c.refineAssistantFurniture(
        'added',
        [
          {
            type: 'set-locks',
            id: 'added',
            locks: { position: true, rotation: false, dimensions: false },
          },
        ],
        token.operationId,
      ).ok,
    ).toBe(true);
    const locked = c.getSnapshot().candidate;
    const move: VisitorAction = {
      type: 'move',
      id: 'added',
      pose: { centerX: 7500, centerZ: 7000, quarterTurns: 0 },
    };
    expect(
      c.refineAssistantFurniture('added', [move], token.operationId),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(c.getSnapshot().candidate).toBe(locked);
    expect(
      c.refineAssistantFurniture(
        'added',
        [
          {
            type: 'set-locks',
            id: 'added',
            locks: { position: false, rotation: false, dimensions: false },
          },
        ],
        token.operationId,
      ).ok,
    ).toBe(true);
    expect(
      c.refineAssistantFurniture('added', [move], token.operationId).ok,
    ).toBe(true);
    const clear = c.getSnapshot().candidate;
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ ...move, pose: { centerX: -1000, centerZ: 7000, quarterTurns: 0 } }],
        token.operationId,
      ).ok,
    ).toBe(false);
    expect(c.getSnapshot().candidate).toBe(clear);
    expect(c.applyAssistantPreview().ok).toBe(true);
    expect(
      c
        .getSnapshot()
        .workspace!.current.furniture.find((p) => p.id === 'added')!.pose
        .centerX,
    ).toBe(7500);
  });
  it('restricts refinements to that furniture and retains model scope and receipt payload identity', () => {
    const { c, token, scope, added } = setup(),
      workspace = c.getSnapshot().workspace!;
    const command = {
      schemaVersion: 1 as const,
      commandId: 'review',
      commandSequence: 1,
      identity: token,
      catalogueVersion: workspace.current.catalogueVersion,
      rulesVersion: workspace.current.rulesVersion,
      actions: [{ type: 'add' as const, furniture: added }],
    };
    const edit = {
      id: 'added',
      actions: [
        { type: 'finish' as const, id: 'added', finish: 'ivory' as const },
      ],
    };
    expect(
      prepareCommand(
        workspace,
        command,
        'assistant',
        { ...scope, additions: [] },
        [edit],
      ).ok,
    ).toBe(false);
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ type: 'finish', id: 'kept', finish: 'ivory' }],
        token.operationId,
      ).ok,
    ).toBe(false);
    expect(
      c.refineAssistantFurniture(
        'added',
        [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'ivory' }],
        token.operationId,
      ).ok,
    ).toBe(false);
    const applied = applyCommand(
      workspace,
      command,
      'assistant',
      scope,
      undefined,
      [edit],
    );
    if (!applied.ok) throw new Error(applied.code);
    expect(
      applyCommand(applied.workspace, command, 'assistant', scope, undefined, [
        edit,
      ]),
    ).toMatchObject({ ok: true, status: 'already-applied' });
    expect(
      applyCommand(applied.workspace, command, 'assistant', scope, undefined, [
        {
          id: 'added',
          actions: [{ type: 'finish', id: 'added', finish: 'walnut' }],
        },
      ]),
    ).toMatchObject({ ok: false, code: 'replay-mismatch' });
    expect(c.getSnapshot().workspace).toBe(workspace);
  });
});
