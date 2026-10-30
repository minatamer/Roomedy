import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { OrientedFootprint } from '../apps/frontend/src/features/plan-view/plan-view.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { FurnitureMaterialControls } from '../apps/frontend/src/features/room-editor/furniture-material-controls.js';
import { OpeningMaterialControls } from '../apps/frontend/src/features/room-editor/opening-material-controls.js';
// Resolve the app's pinned UI packages without adding a duplicate root dependency.
const uiRequire = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { createElement } = uiRequire('react') as {
  createElement: <T>(component: (props: T) => unknown, props: T) => unknown;
};
const { renderToStaticMarkup } = uiRequire('react-dom/server') as {
  renderToStaticMarkup: (element: unknown) => string;
};
import type { ActionScope, VisitorAction } from '@roomedy/contracts/commands';
import { POLICY } from '@roomedy/contracts/policy';
import {
  applyCommand,
  createCommandWorkspace,
  prepareCommand,
} from '@roomedy/spatial';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { appendInspectorEdits } from '../apps/frontend/src/features/session/inspector-draft.js';
import {
  projectOf,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import { pricingState } from '../apps/frontend/src/features/cost/state.js';
import { commandRoom, door, envelope, piece } from './fixtures/command-room.js';

const controllers: SessionController[] = [];
function setup() {
  const room = commandRoom([piece('kept')], [door()]);
  const c = new SessionController(room);
  controllers.push(c);
  c.setDestination('cost', 'en-US');
  c.setDestination('design');
  c.select('kept');
  return { c, room };
}
const color = (hex: string): VisitorAction => ({
  type: 'set-furniture-materials',
  id: 'kept',
  materials: { bodyColor: hex },
});
const scope = (roomId: string): ActionScope => ({
  roomId,
  roomRevision: 0,
  actionKinds: ['finish'],
  targetIds: ['kept'],
  additions: [],
  replacements: [],
  removals: [],
  roomFinishes: false,
});
afterEach(() => {
  controllers.forEach((c) => c.dispose());
  controllers.length = 0;
});

describe('disposable inspector changes', () => {
  it('does not block Apply for untouched furniture or opening appearance patches', () => {
    const room = createManualRoom('partial');
    const bed = room.furniture.find(
      (item) => item.catalogueId === 'procedural-bed',
    )!;
    const furniture = renderToStaticMarkup(
      createElement(FurnitureMaterialControls, {
        item: bed,
        onCommit: () => null,
      }),
    );
    const opening = renderToStaticMarkup(
      createElement(OpeningMaterialControls, {
        feature: door(),
        onCommit: () => null,
      }),
    );
    expect(furniture).toContain('Duvet / cover');
    expect(opening).toContain('Door colour');
    expect(furniture + opening).not.toContain('data-inspector-invalid="true"');
  });
  it('shows independently previewed bedding colours and patterns in the actual precision-plan artwork', () => {
    const room = createManualRoom('partial');
    const bed = room.furniture.find(
      (item) => item.catalogueId === 'procedural-bed',
    )!;
    expect(bed).toBeDefined();
    const c = new SessionController(room);
    controllers.push(c);
    expect(
      c.previewInspector(
        [
          {
            type: 'set-furniture-materials',
            id: bed.id,
            materials: {
              pillowColor: '#a97d65',
              sheetColor: '#c9d8df',
              coverColor: '#34516b',
              coverPattern: 'checker',
            },
          },
        ],
        'Bedding',
      ).ok,
    ).toBe(true);
    const previewed = c
      .getSnapshot()
      .candidate!.room.furniture.find((item) => item.id === bed.id)!;
    const markup = renderToStaticMarkup(
      createElement(OrientedFootprint, { item: previewed, selected: true }),
    );
    expect(markup).toContain('data-plan-part="sheets"');
    expect(markup).toContain('data-plan-part="pillow"');
    expect(markup).toContain('data-plan-part="duvet" data-pattern="checker"');
    for (const color of ['#a97d65', '#c9d8df', '#34516b'])
      expect(markup).toContain(`fill="${color}"`);
    expect(c.getSnapshot().workspace?.current).toEqual(room);
  });
  it('projects furniture, room and opening edits without saving, pricing or history changes', () => {
    const { c, room } = setup();
    const accepted = c.getSnapshot().workspace;
    const cost = c.getSnapshot().cost;
    expect(c.previewInspector([color('#ac7654')], 'Colour').ok).toBe(true);
    expect(
      c.previewInspector(
        [{ type: 'set-room-surface', surface: 'floor', color: '#778899' }],
        'Floor',
      ).ok,
    ).toBe(true);
    expect(
      c.previewInspector(
        [
          {
            type: 'set-opening-materials',
            id: 'door_1',
            materials: { color: '#785034' },
          },
        ],
        'Door',
      ).ok,
    ).toBe(true);
    const state = c.getSnapshot();
    expect(state.candidate?.source).toBe('inspector');
    expect(state.candidate?.room.furniture[0]?.materials?.bodyColor).toBe(
      '#ac7654',
    );
    expect(state.candidate?.room.room.surfaces?.floor?.color.value).toBe(
      '#778899',
    );
    const opening = state.candidate?.room.room.features[0];
    expect(opening?.kind === 'door' ? opening.materials?.color : null).toBe(
      '#785034',
    );
    expect(state.workspace).toBe(accepted);
    expect(state.workspace?.current).toEqual(room);
    expect(state.cost).toBe(cost);
    expect(state.workspace?.history.entries).toHaveLength(0);
    expect(projectOf(state)?.current).toEqual(room);
    expect(recoveryOf(state)?.project.current).toEqual(room);
  });
  it('commits one atomic batch and one Undo, including matching pricing restoration', () => {
    const { c, room } = setup();
    const prices = pricingState(c.getSnapshot().cost!);
    c.previewInspector([color('#aabbcc')], 'Colour');
    c.previewInspector(
      [
        {
          type: 'set-size-estimate',
          id: 'kept',
          width: 1400,
          depth: 650,
          overrideSizeLock: true,
        },
      ],
      'Size',
    );
    c.previewInspector(
      [{ type: 'set-room-surface', surface: 'walls', color: '#e1dbce' }],
      'Walls',
    );
    expect(c.applyInspectorChanges()).toEqual({ ok: true, changed: true });
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(1);
    expect(
      c.getSnapshot().workspace?.current.furniture[0]?.dimensions.width.value,
    ).toBe(1400);
    expect(c.undo().ok).toBe(true);
    expect({ ...c.getSnapshot().workspace!.current, roomRevision: 0 }).toEqual(
      room,
    );
    expect(pricingState(c.getSnapshot().cost!)).toEqual(prices);
  });
  it('resets only edits since the last Apply, with no accepted Undo or stale follow-up Apply', () => {
    const { c } = setup();
    c.previewInspector([color('#abcd12')], 'Colour');
    c.applyInspectorChanges();
    const accepted = c.getSnapshot().workspace;
    c.previewInspector([color('#998877')], 'Colour');
    c.resetInspectorChanges();
    expect(c.getSnapshot().workspace).toBe(accepted);
    expect(
      c.getSnapshot().workspace?.current.furniture[0]?.materials?.bodyColor,
    ).toBe('#abcd12');
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(1);
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.applyInspectorChanges().ok).toBe(false);
    const epoch = c.getSnapshot().inspectorReset!;
    c.resetInspectorChanges();
    expect(c.getSnapshot().inspectorReset).toBe(epoch + 1);
  });
  it('keeps preview and accepted state separate through view, item and panel switches', () => {
    const { c } = setup();
    c.previewInspector([color('#667788')], 'Colour');
    const preview = c.getSnapshot().candidate;
    c.select('kept');
    c.setPanel('room');
    c.setRoomView('plan');
    expect(c.getSnapshot().candidate).toBe(preview);
    c.select('door_1');
    c.setRoomView('cutaway');
    expect(c.getSnapshot().candidate).toBe(preview);
    expect(c.getSnapshot().presentation.selectedId).toBe('door_1');
    expect(c.getSnapshot().presentation.roomView).toBe('cutaway');
  });
  it('rejects invalid or locked edits without replacing the last valid preview', () => {
    const { c } = setup();
    c.previewInspector([color('#aabbcc')], 'Colour');
    const preview = c.getSnapshot().candidate;
    expect(c.previewInspector([color('#')], 'Invalid').ok).toBe(false);
    expect(c.getSnapshot().candidate).toBe(preview);
    c.previewInspector(
      [
        {
          type: 'set-locks',
          id: 'kept',
          locks: { dimensions: false, position: true, rotation: false },
        },
      ],
      'Lock',
    );
    const locked = c.getSnapshot().candidate;
    expect(
      c.previewInspector(
        [
          {
            type: 'move',
            id: 'kept',
            pose: { centerX: 3000, centerZ: 3000, quarterTurns: 0 },
          },
        ],
        'Move',
      ).ok,
    ).toBe(false);
    expect(c.getSnapshot().candidate).toBe(locked);
  });
  it('does not let AI, history, phase changes or legacy commands silently replace a manual draft', () => {
    const { c } = setup();
    c.previewInspector([color('#aabbcc')], 'Colour');
    const preview = c.getSnapshot().candidate;
    const current = c.getSnapshot().workspace;
    expect(c.beginOperation()).toBeNull();
    expect(
      c.dispatch([{ type: 'finish', id: 'kept', finish: 'walnut' }], 'Other')
        .ok,
    ).toBe(false);
    expect(
      c.prepareVisitorPreview(
        [{ type: 'finish', id: 'kept', finish: 'walnut' }],
        'Other',
      ).ok,
    ).toBe(false);
    expect(c.setDestination('cost')).toBe(false);
    expect(c.setComparison('before')).toBe(false);
    c.setPanel('assistant');
    expect(c.getSnapshot().presentation.panel).not.toBe('assistant');
    expect(c.getSnapshot().candidate).toBe(preview);
    expect(c.undo().ok).toBe(true);
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.getSnapshot().workspace).toBe(current);
  });
  it('supports hundreds of immediate RGB updates and more than32 distinct ordered edits', () => {
    const { c } = setup();
    for (let i = 0; i < 150; i++)
      expect(
        c.previewInspector(
          [color(`#${i.toString(16).padStart(6, '0')}`)],
          'Colour',
        ).ok,
      ).toBe(true);
    for (let i = 0; i < 20; i++) {
      expect(
        c.previewInspector(
          [
            {
              type: 'move',
              id: 'kept',
              pose: { centerX: 2000 + i * 10, centerZ: 2000, quarterTurns: 0 },
            },
          ],
          'Move',
        ).ok,
      ).toBe(true);
      expect(
        c.previewInspector(
          [
            {
              type: 'set-room-surface',
              surface: 'floor',
              color: `#${(0x556600 + i).toString(16)}`,
            },
          ],
          'Floor',
        ).ok,
      ).toBe(true);
    }
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(0);
    expect(c.applyInspectorChanges().ok).toBe(true);
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(1);
    expect(c.getSnapshot().workspace?.current.furniture[0]?.pose.centerX).toBe(
      2190,
    );
    expect(
      c.getSnapshot().workspace?.current.furniture[0]?.materials?.bodyColor,
    ).toBe('#000095');
  });
  it('preserves ordered unlock/move/relock semantics and a fully reverted no-op', () => {
    const { c } = setup();
    const locks = { dimensions: false, position: true, rotation: false };
    c.dispatch([{ type: 'set-locks', id: 'kept', locks }], 'Lock');
    c.previewInspector(
      [{ type: 'set-locks', id: 'kept', locks: { ...locks, position: false } }],
      'Unlock',
    );
    c.previewInspector(
      [
        {
          type: 'move',
          id: 'kept',
          pose: { centerX: 2500, centerZ: 2000, quarterTurns: 0 },
        },
      ],
      'Move',
    );
    c.previewInspector([{ type: 'set-locks', id: 'kept', locks }], 'Relock');
    expect(c.applyInspectorChanges().ok).toBe(true);
    expect(
      c.getSnapshot().workspace?.current.furniture[0]?.locks.position,
    ).toBe(true);
    expect(c.getSnapshot().workspace?.current.furniture[0]?.pose.centerX).toBe(
      2500,
    );
    c.previewInspector(
      [{ type: 'finish', id: 'kept', finish: 'walnut' }],
      'Finish',
    );
    c.previewInspector(
      [{ type: 'finish', id: 'kept', finish: 'oak' }],
      'Restore',
    );
    expect(c.getSnapshot().candidate).toBeNull();
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(2);
  });
  it('retires drafts on reset, disposal and expiry without saving them', () => {
    const { c, room } = setup();
    c.previewInspector([color('#aabbcc')], 'Colour');
    c.reset(room);
    expect(c.applyInspectorChanges().ok).toBe(false);
    c.previewInspector([color('#aabbcc')], 'Colour');
    c.dispose();
    expect(c.applyInspectorChanges().ok).toBe(false);
    let now = 0;
    const expired = new SessionController(room, { now: () => now });
    controllers.push(expired);
    expired.previewInspector([color('#aabbcc')], 'Colour');
    now = POLICY.guestLifetimeMs;
    expect(expired.applyInspectorChanges().ok).toBe(false);
    expect(expired.getSnapshot().candidate).toBeNull();
  });
  it('keeps assistant scope intact while live furniture tweaks can be reset to the original proposal', () => {
    const { c, room } = setup();
    const token = c.beginOperation()!;
    expect(
      c.prepareAssistant(
        token,
        [{ type: 'finish', id: 'kept', finish: 'walnut' }],
        scope(room.roomId),
        'Finish',
      ).ok,
    ).toBe(true);
    for (let i = 0; i < 100; i++)
      expect(
        c.refineAssistantFurniture(
          'kept',
          [color(`#${i.toString(16).padStart(6, '0')}`)],
          token.operationId,
        ).ok,
      ).toBe(true);
    expect(c.resetAssistantRefinements().ok).toBe(true);
    expect(c.getSnapshot().candidate?.room.furniture[0]?.finish).toBe('walnut');
    expect(
      c.getSnapshot().candidate?.room.furniture[0]?.materials?.bodyColor,
    ).toBeUndefined();
    expect(c.getSnapshot().workspace?.current).toEqual(room);
    expect(
      c.refineAssistantFurniture(
        'kept',
        [{ type: 'set-room-surface', surface: 'walls', color: '#aabbcc' }],
        token.operationId,
      ).ok,
    ).toBe(false);
    expect(c.applyAssistantPreview().ok).toBe(true);
    expect(c.getSnapshot().workspace?.history.entries).toHaveLength(1);
    expect(c.undo().ok).toBe(true);
    expect({ ...c.getSnapshot().workspace!.current, roomRevision: 0 }).toEqual(
      room,
    );
  });
});

describe('visitor-only bounded batches', () => {
  it('includes later batches in replay identity and commits a single history entry', () => {
    const workspace = createCommandWorkspace(commandRoom([piece('kept')]), {
      workspaceId: 'workspace_test',
      generation: 0,
    });
    const command = envelope(workspace, [
      { type: 'finish', id: 'kept', finish: 'walnut' },
    ]);
    const edits: VisitorAction[][] = [
      [color('#aabbcc')],
      [{ type: 'set-room-surface', surface: 'walls', color: '#ddeeff' }],
    ];
    const result = applyCommand(
      workspace,
      command,
      'visitor',
      undefined,
      undefined,
      [],
      edits,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.history.entries).toHaveLength(1);
    expect(
      applyCommand(
        result.workspace,
        command,
        'visitor',
        undefined,
        undefined,
        [],
        edits,
      ),
    ).toMatchObject({ ok: true, status: 'already-applied' });
    expect(
      applyCommand(
        result.workspace,
        command,
        'visitor',
        undefined,
        undefined,
        [],
        [[color('#ccbbaa')]],
      ),
    ).toMatchObject({ ok: false, code: 'replay-mismatch' });
  });
  it('rejects model authority, scope mixing, oversized and invalid batches', () => {
    const room = commandRoom([piece('kept')]);
    const workspace = createCommandWorkspace(room, {
      workspaceId: 'workspace_test',
      generation: 0,
    });
    const command = envelope(workspace, [
      { type: 'finish', id: 'kept', finish: 'walnut' },
    ]);
    expect(
      prepareCommand(
        workspace,
        command,
        'assistant',
        scope(room.roomId),
        [],
        [[color('#abcdef')]],
      ),
    ).toMatchObject({ ok: false, code: 'out-of-scope' });
    expect(
      prepareCommand(
        workspace,
        command,
        'visitor',
        scope(room.roomId),
        [],
        [[color('#abcdef')]],
      ),
    ).toMatchObject({ ok: false, code: 'out-of-scope' });
    expect(
      prepareCommand(
        workspace,
        command,
        'visitor',
        undefined,
        [],
        Array.from({ length: POLICY.actions * POLICY.actions + 1 }, () => [
          color('#abcdef'),
        ]),
      ),
    ).toMatchObject({ ok: false, code: 'invalid-input' });
    expect(
      prepareCommand(
        workspace,
        command,
        'visitor',
        undefined,
        [],
        [[color('#')]],
      ),
    ).toMatchObject({ ok: false, code: 'invalid-input' });
    expect(workspace.current).toEqual(room);
  });
  it('coalesces adjacent properties without moving them across semantic barriers', () => {
    const batches = appendInspectorEdits(
      [[color('#abcdef')]],
      [
        {
          type: 'set-furniture-materials',
          id: 'kept',
          materials: { bodyPattern: 'wood' },
        },
      ],
    );
    expect(batches).toEqual([
      [
        {
          type: 'set-furniture-materials',
          id: 'kept',
          materials: { bodyColor: '#abcdef', bodyPattern: 'wood' },
        },
      ],
    ]);
    const separated = appendInspectorEdits(batches, [
      { type: 'finish', id: 'kept', finish: 'ivory' },
      color('#123456'),
    ]);
    expect(separated.flat()).toHaveLength(3);
  });
});
