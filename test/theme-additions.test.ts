import { describe, expect, it } from 'vitest';
import {
  BEDROOM_THEMES,
  bedroomFurnitureMaterials,
  roomBedroomTheme,
} from '@roomedy/contracts/furniture-materials';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { FINISH_COLORS } from '@roomedy/contracts/surfaces';
import {
  CATALOGUE,
  evaluateBatch,
  LayoutSearch,
  resolveAssistantTask,
  resolveMedyRequest,
  validateSearchCandidate,
  visitorCatalogueFurniture,
} from '@roomedy/spatial';
import { withFurnitureTheme } from '../packages/spatial/src/catalogue.js';
import { createAssistantTools } from '../apps/backend/src/assistant/tools.js';
import { assistantInput } from './fixtures/assistant.js';
import { CataloguePlacement } from '../apps/frontend/src/features/room-editor/catalogue-placement.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { guidanceChoices } from '../apps/frontend/src/features/assistant/guidance.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
  readRecovery,
  recoveryOf,
} from '../apps/frontend/src/features/session/project.js';
import {
  commandRoom,
  door,
  piece,
  windowFeature,
} from './fixtures/command-room.js';
import { goal, request, scopeFor } from './fixtures/search-corpus.js';

function themeRoom(theme: (typeof BEDROOM_THEMES)[number]) {
  const result = evaluateBatch(
    commandRoom(),
    [{ type: 'set-bedroom-theme', theme: theme.id }],
    'visitor',
  );
  if (!result.ok) throw new Error(result.code);
  return result.room;
}
function additions(
  room: ReturnType<typeof commandRoom>,
  text = 'I need a desk and chair',
) {
  const task = resolveAssistantTask(room, text, null, 'theme-add');
  expect(task.goal).not.toBeNull();
  const input = {
    identity: {
      workspaceId: 'themes',
      generation: 0,
      operationId: 'theme-add',
      roomId: room.roomId,
      inputRevision: room.roomRevision,
    },
    room,
    goal: task.goal!,
    seed: 42,
    maxNodes: 2000,
  };
  const search = new LayoutSearch(input, task.scope);
  while (!search.step()) {}
  const result = search.finish();
  expect(result.candidate).not.toBeNull();
  return { task, result, input };
}

describe('chosen theme is the default for later furniture', () => {
  it.each(BEDROOM_THEMES)(
    '$name is retained and used by manual placement ghosts and commits',
    (theme) => {
      const current = themeRoom(theme),
        session = new SessionController(current),
        entry = CATALOGUE.find((entry) => entry.id === 'procedural-chair')!;
      const placement = new CataloguePlacement(
        session,
        () => `manual-${theme.id}`,
      );
      try {
        expect(current.room.theme).toBe(theme.id);
        expect(placement.start(entry)).toBe(true);
        const item = placement.getSnapshot()!.item;
        expect(item.finish).toBe(theme.furnitureFinish);
        expect(item.materials).toEqual(bedroomFurnitureMaterials(theme, entry));
        placement.move({ x: 4000, z: 4000 }, true, false);
        expect(placement.commit().ok).toBe(true);
        const saved = session.getSnapshot().workspace!.current.furniture[0]!;
        expect(saved.finish).toBe(item.finish);
        expect(saved.materials).toEqual(item.materials);
        expect(session.undo().ok).toBe(true);
        expect(session.getSnapshot().workspace!.current.furniture).toEqual([]);
        expect(session.getSnapshot().workspace!.current.room.theme).toBe(
          theme.id,
        );
      } finally {
        placement.dispose();
        session.dispose();
      }
    },
  );

  it.each(BEDROOM_THEMES)(
    '$name is used by subsequent AI search additions',
    (theme) => {
      const current = themeRoom(theme),
        before = structuredClone(current);
      const { result } = additions(current);
      const pieces = result.candidate!.actions.flatMap((action) =>
        action.type === 'add' ? [action.furniture] : [],
      );
      expect(pieces).toHaveLength(2);
      for (const item of pieces) {
        const entry = CATALOGUE.find((entry) => entry.id === item.catalogueId)!;
        expect(item.finish).toBe(theme.furnitureFinish);
        expect(item.materials).toEqual(bedroomFurnitureMaterials(theme, entry));
      }
      expect(current).toEqual(before);
    },
  );

  it('keeps the accepted default through Cancel and restores it on theme Undo', () => {
    const session = new SessionController(themeRoom(BEDROOM_THEMES[0]!));
    try {
      const change = [
        { type: 'set-bedroom-theme' as const, theme: 'modern' as const },
      ];
      expect(session.prepareVisitorPreview(change, 'Modern').ok).toBe(true);
      expect(session.getSnapshot().candidate!.room.room.theme).toBe('modern');
      expect(session.getSnapshot().workspace!.current.room.theme).toBe(
        'japandi',
      );
      session.cancelPreview();
      expect(session.getSnapshot().workspace!.current.room.theme).toBe(
        'japandi',
      );
      expect(session.prepareVisitorPreview(change, 'Modern').ok).toBe(true);
      expect(session.applyVisitorPreview().ok).toBe(true);
      expect(session.getSnapshot().workspace!.current.room.theme).toBe(
        'modern',
      );
      expect(session.undo().ok).toBe(true);
      expect(session.getSnapshot().workspace!.current.room.theme).toBe(
        'japandi',
      );
    } finally {
      session.dispose();
    }
  });

  it.each(BEDROOM_THEMES)(
    '$name is inherited by the backend direct edit tool without a provider call',
    async (theme) => {
      const current = themeRoom(theme),
        { task, result, input: searchInput } = additions(current);
      const input = assistantInput(current, 'I need a desk and chair');
      input.identity = searchInput.identity;
      const tools = createAssistantTools(
        input,
        task,
        new AbortController().signal,
      );
      const actions = result.candidate!.actions.map((action) => {
        if (action.type !== 'add') throw new Error('expected-add');
        return {
          type: 'add',
          id: action.furniture.id,
          catalogueId: action.furniture.catalogueId,
          centerX: action.furniture.pose.centerX,
          centerZ: action.furniture.pose.centerZ,
          quarterTurns: action.furniture.pose.quarterTurns,
          finish: null,
          floorFinish: null,
          wallFinish: null,
        };
      });
      expect((await tools.execute('prepare_edits', { actions })).ok).toBe(true);
      expect(tools.reply().actions).toEqual(result.candidate!.actions);
    },
  );

  it('uses the latest applied theme and leaves retained pieces and physical facts untouched when adding', () => {
    const room = commandRoom(
      [piece('retained')],
      [door(), { ...windowFeature(), wall: 'east' }],
    );
    const first = evaluateBatch(
      room,
      [{ type: 'set-bedroom-theme', theme: 'japandi' }],
      'visitor',
    );
    if (!first.ok) throw new Error(first.code);
    const second = evaluateBatch(
      first.room,
      [{ type: 'set-bedroom-theme', theme: 'modern' }],
      'visitor',
    );
    if (!second.ok) throw new Error(second.code);
    second.room.furniture[0]!.materials!.bodyColor = '#123456';
    const session = new SessionController(second.room),
      placement = new CataloguePlacement(session, () => 'new-chair');
    try {
      expect(
        placement.start(CATALOGUE.find((e) => e.id === 'procedural-chair')!),
      ).toBe(true);
      placement.move({ x: 5000, z: 5000 }, true, false);
      expect(placement.commit().ok).toBe(true);
      const saved = session.getSnapshot().workspace!.current;
      expect(saved.furniture[0]).toEqual(second.room.furniture[0]);
      expect(saved.room).toEqual(second.room.room);
      expect(saved.furniture[1]!.finish).toBe('walnut');
      expect(saved.furniture[1]!.materials!.softColor).toBe(
        BEDROOM_THEMES[1]!.softColor,
      );
    } finally {
      placement.dispose();
      session.dispose();
    }
  });

  it('retains the chosen default through custom surfaces, project import and recovery', () => {
    const current = themeRoom(BEDROOM_THEMES[1]!);
    current.room.features = [door()];
    const custom = evaluateBatch(
      current,
      [
        { type: 'set-room-surface', surface: 'walls', color: '#112233' },
        { type: 'set-room-surface', surface: 'floor', color: '#445566' },
      ],
      'visitor',
    );
    if (!custom.ok) throw new Error(custom.code);
    const session = new SessionController(custom.room, { now: () => 1000 }),
      restored = new SessionController();
    try {
      const project = readProject(exportProject(session.getSnapshot())!);
      if (!project.ok) throw new Error(project.code);
      const recovery = readRecovery(
        JSON.stringify(recoveryOf(session.getSnapshot())),
        1001,
      );
      if (!recovery.ok) throw new Error(recovery.code);
      expect(recovery.value.project.current).toEqual(project.value.current);
      expect(restored.importProject(project.value)).toBe(true);
      const room = restored.getSnapshot().workspace!.current;
      expect(roomBedroomTheme(room.room)?.id).toBe('modern');
      expect(
        guidanceChoices('openings', room, false).find(
          (choice) => choice.id === 'opening-wood',
        )?.request,
      ).toContain(FINISH_COLORS.walnut);
      const { result } = additions(room, 'I need a chair');
      expect(
        result.candidate!.actions.find((a) => a.type === 'add'),
      ).toMatchObject({
        furniture: {
          finish: 'walnut',
          materials: { softColor: BEDROOM_THEMES[1]!.softColor },
        },
      });
    } finally {
      session.dispose();
      restored.dispose();
    }
  });

  it.each(BEDROOM_THEMES)(
    'reuses the exact $name surface match for legacy rooms',
    (theme) => {
      const applied = evaluateBatch(
        createManualRoom('empty'),
        [{ type: 'set-bedroom-theme', theme: theme.id }],
        'visitor',
      );
      if (!applied.ok) throw new Error(applied.code);
      const current = applied.room;
      delete current.room.theme;
      expect(roomDocumentSchema.safeParse(current).success).toBe(true);
      expect(roomBedroomTheme(current.room)?.id).toBe(theme.id);
      const session = new SessionController(current),
        placement = new CataloguePlacement(session);
      try {
        expect(
          placement.start(CATALOGUE.find((e) => e.id === 'procedural-chair')!),
        ).toBe(true);
        expect(placement.getSnapshot()!.item.finish).toBe(
          theme.furnitureFinish,
        );
        expect(placement.getSnapshot()!.item.materials).toEqual(
          bedroomFurnitureMaterials(
            theme,
            CATALOGUE.find((e) => e.id === 'procedural-chair')!,
          ),
        );
      } finally {
        placement.dispose();
        session.dispose();
      }
    },
  );

  it('preserves unthemed defaults and does not infer approximate palettes or style hints', () => {
    const current = commandRoom();
    expect(roomBedroomTheme(current.room)).toBeUndefined();
    const { result } = additions(current);
    for (const action of result.candidate!.actions)
      if (action.type === 'add') {
        expect(action.furniture.finish).toBe('oak');
        expect(action.furniture.materials).toBeUndefined();
      }
    const legacy = themeRoom(BEDROOM_THEMES[1]!);
    delete legacy.room.theme;
    legacy.room.surfaces!.walls!.color.value = '#eeeeed';
    expect(roomBedroomTheme(legacy.room)).toBeUndefined();
    expect(
      roomDocumentSchema.safeParse({
        ...current,
        room: { ...current.room, theme: 'unknown-theme' },
      }).success,
    ).toBe(false);
  });

  it('lets an explicit AI finish override the default without a hidden body colour masking it', () => {
    const { result } = additions(
      themeRoom(BEDROOM_THEMES[1]!),
      'I need an oak desk',
    );
    expect(
      result.candidate!.actions.find((a) => a.type === 'add'),
    ).toMatchObject({
      furniture: {
        finish: 'oak',
        materials: { bodyColor: FINISH_COLORS.oak, hardware: 'steel' },
      },
    });
  });

  it.each([
    ['', 'walnut'],
    ['oak ', 'oak'],
  ] as const)(
    'uses theme defaults and explicit %sfinish for exact Medy additions',
    (finish, expected) => {
      const current = themeRoom(BEDROOM_THEMES[1]!);
      const edit = resolveMedyRequest(
        current,
        `add an ${finish}desk width 140 cm depth 60 cm at x 6000 mm z 2000 mm`,
        null,
      );
      if (edit?.kind !== 'edits') throw new Error('missing-exact-add');
      expect(edit.actions[0]).toMatchObject({
        type: 'add',
        furniture: {
          finish: expected,
          materials: { bodyColor: FINISH_COLORS[expected], hardware: 'steel' },
          pose: { provenance: { sourceId: 'visitor-plan' } },
          dimensions: {
            width: {
              value: 1400,
              status: 'estimated',
              sourceId: 'visitor-estimate',
            },
          },
        },
      });
      expect(evaluateBatch(current, edit.actions, 'visitor').ok).toBe(true);
    },
  );

  it('defaults exact Medy replacement appearance without changing its retained pose', () => {
    const current = themeRoom(BEDROOM_THEMES[1]!);
    current.furniture = [piece('old-desk')];
    const edit = resolveMedyRequest(
      current,
      'replace the desk with a desk width 140 cm depth 60 cm',
      'old-desk',
    );
    if (edit?.kind !== 'edits') throw new Error('missing-replacement');
    expect(edit.actions[0]).toMatchObject({
      type: 'replace',
      id: 'old-desk',
      furniture: {
        finish: 'walnut',
        materials: { bodyColor: FINISH_COLORS.walnut },
        pose: { centerX: 2000, centerZ: 2000 },
      },
    });
    expect(evaluateBatch(current, edit.actions, 'visitor').ok).toBe(true);
  });

  it('defaults AI replacement appearance through the search and scoped validator', () => {
    const current = themeRoom(BEDROOM_THEMES[1]!);
    current.furniture = [piece('old-desk')];
    current.furniture[0]!.preference = 'replace';
    const selected = goal({
        kind: 'add',
        targetIds: ['old-desk'],
        replacements: [
          {
            id: 'old-desk',
            catalogueId: 'procedural-desk',
            finish: null,
            size: null,
          },
        ],
      }),
      input = request(current, selected, 100);
    const scope = scopeFor(current, selected),
      search = new LayoutSearch(input, scope);
    while (!search.step()) {}
    const result = search.finish();
    expect(result.candidate).not.toBeNull();
    expect(
      result.candidate!.actions.find((a) => a.type === 'replace'),
    ).toMatchObject({
      furniture: {
        finish: 'walnut',
        materials: { bodyColor: FINISH_COLORS.walnut },
      },
    });
    expect(
      validateSearchCandidate(input, result.candidate!, scope),
    ).not.toBeNull();
  });

  it('accepts material key reordering and rejects changed or missing preset materials in AI candidates', () => {
    const { input, task, result } = additions(themeRoom(BEDROOM_THEMES[1]!));
    const candidate = structuredClone(result.candidate!),
      addition = candidate.actions.find((a) => a.type === 'add')!;
    if (addition.type !== 'add') throw new Error('missing-addition');
    addition.furniture.materials = Object.fromEntries(
      Object.entries(addition.furniture.materials!).reverse(),
    );
    expect(
      validateSearchCandidate(input, candidate, task.scope),
    ).not.toBeNull();
    addition.furniture.materials!.bodyColor = '#123456';
    expect(validateSearchCandidate(input, candidate, task.scope)).toBeNull();
    delete addition.furniture.materials;
    expect(validateSearchCandidate(input, candidate, task.scope)).toBeNull();
  });

  it('uses the existing role-specific bedding and lamp presets and preserves explicit material overrides', () => {
    for (const theme of BEDROOM_THEMES)
      for (const id of ['procedural-bed', 'floor-lamp']) {
        const entry = CATALOGUE.find((e) => e.id === id)!;
        expect(entry).toBeDefined();
        const item = visitorCatalogueFurniture(
          entry,
          { width: entry.size.width.default, depth: entry.size.depth.default },
          { centerX: 5000, centerZ: 5000, quarterTurns: 0 },
          id,
          theme.id,
        );
        expect(item.materials).toEqual(bedroomFurnitureMaterials(theme, entry));
        if (entry.category === 'bed')
          expect(item.materials).toMatchObject({
            pillowColor: theme.softColor,
            sheetColor: theme.softColor,
            coverColor: theme.softColor,
          });
        const explicit = { ...item, materials: { bodyColor: '#123456' } };
        expect(
          withFurnitureTheme(explicit, entry, theme.id, true).materials!
            .bodyColor,
        ).toBe('#123456');
      }
  });
});
