import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';
import {
  LIGHT_PRESETS,
  lightSettings,
  lightSettingsSchema,
} from '@roomedy/contracts/furniture-materials';
import {
  visitorBatchSchema,
  proposalBatchSchema,
} from '@roomedy/contracts/commands';
import {
  CATALOGUE,
  evaluateBatch,
  validateRoom,
  resolveMedyRequest,
  resolveAssistantTask,
  LayoutSearch,
  validateSearchCandidate,
  visitorCatalogueFurniture,
  wallMountedPose,
  projectedLabelVisible,
} from '@roomedy/spatial';
import { commandRoom, piece } from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { CataloguePlacement } from '../apps/frontend/src/features/room-editor/catalogue-placement.js';
import {
  exportProject,
  readProject,
  recoveryOf,
  readRecovery,
} from '../apps/frontend/src/features/session/project.js';
import { appendInspectorEdits } from '../apps/frontend/src/features/session/inspector-draft.js';
import {
  fixtureSource,
  illuminatedFixtures,
  isCeiling,
  layerFurniture,
} from '../apps/frontend/src/features/room-view/lighting-model.js';
import { createFixtureLight } from '../apps/frontend/src/features/room-view/lighting.js';
import { proceduralParts } from '../apps/frontend/src/features/room-view/representations/definitions.js';
import { PlanView } from '../apps/frontend/src/features/plan-view/plan-view.js';
import { createWindowGlass } from '../apps/frontend/src/features/room-view/window-glass.js';
import { offerNightLighting } from '../apps/frontend/src/features/room-editor/lighting-preference.js';
import { createAssistantTools } from '../apps/backend/src/assistant/tools.js';
import { assistantInput } from './fixtures/assistant.js';

const frontend = createRequire(
  new URL('../apps/frontend/package.json', import.meta.url),
);
const { createElement } = frontend('react') as {
  createElement: <T>(component: (props: T) => unknown, props: T) => unknown;
};
const { renderToStaticMarkup } = frontend('react-dom/server') as {
  renderToStaticMarkup: (element: unknown) => string;
};

const ceilingEntries = CATALOGUE.filter(
  (entry) => entry.placement === 'ceiling',
);
function fixture(id = 'floor-lamp', key = id, x = 4000, z = 4000) {
  const entry = CATALOGUE.find((entry) => entry.id === id)!;
  if (!entry) throw new Error('missing-fixture');
  return visitorCatalogueFurniture(
    entry,
    { width: entry.size.width.default, depth: entry.size.depth.default },
    { centerX: x, centerZ: z, quarterTurns: 0 },
    key,
  );
}
function lightingRoom() {
  const room = commandRoom([piece('desk'), fixture()]);
  const result = evaluateBatch(
    room,
    [
      { type: 'add', furniture: fixture('ceiling-pendant') },
      { type: 'set-light', id: 'floor-lamp', light: { brightness: 75 } },
    ],
    'visitor',
  );
  if (!result.ok) throw new Error(result.code);
  return result.room;
}
function search(room: ReturnType<typeof commandRoom>, text: string) {
  const input = assistantInput(room, text),
    task = resolveAssistantTask(room, text, null, input.identity.operationId);
  if (!task.goal) throw new Error(`no-goal:${task.label}`);
  const request = {
    room,
    goal: task.goal,
    identity: input.identity,
    seed: 42,
    maxNodes: 2000,
  };
  const engine = new LayoutSearch(request, task.scope);
  while (!engine.step()) {}
  const result = engine.finish();
  expect(result.candidate).not.toBeNull();
  return { input, task, request, result };
}

describe('canonical fixture lighting', () => {
  it('retains legacy warm defaults without rewriting old fixtures and rejects unsafe fields', () => {
    const lamp = fixture();
    expect(lamp.light).toBeUndefined();
    expect(lightSettings(lamp)).toEqual({
      color: '#ffd6a3',
      brightness: 75,
      on: true,
    });
    for (const light of [
      { color: 'red', brightness: 50, on: true },
      { color: '#ff0000', brightness: 101, on: true },
      { color: '#ff0000', brightness: 10.5, on: true },
      {
        color: '#ff0000',
        brightness: 50,
        on: true,
        url: 'https://invalid.example',
      },
    ])
      expect(lightSettingsSchema.safeParse(light).success).toBe(false);
    expect(
      visitorBatchSchema.safeParse([
        { type: 'set-light', id: lamp.id, light: {} },
      ]).success,
    ).toBe(false);
    expect(
      proposalBatchSchema.safeParse([
        { type: 'set-light', id: lamp.id, light: { on: false } },
      ]).success,
    ).toBe(false);
    const room = commandRoom([piece('desk')]);
    room.furniture[0]!.light = { color: '#ffffff', brightness: 100, on: true };
    expect(validateRoom(room)).toBeUndefined();
    expect(
      evaluateBatch(
        commandRoom([piece('desk')]),
        [{ type: 'set-light', id: 'desk', light: { on: false } }],
        'visitor',
      ).ok,
    ).toBe(false);
  });
  it('previews light edits and saves/recovers them with one Apply/Undo while themes preserve emission', () => {
    const room = lightingRoom(),
      session = new SessionController(room, { now: () => 1000 });
    try {
      expect(
        session.previewInspector(
          [
            {
              type: 'set-light',
              id: 'floor-lamp',
              light: { color: '#ff6640', brightness: 40, on: false },
            },
          ],
          'Light',
        ).ok,
      ).toBe(true);
      expect(session.getSnapshot().workspace!.current).toEqual(room);
      expect(
        session
          .getSnapshot()
          .candidate!.room.furniture.find((p) => p.id === 'floor-lamp')!.light,
      ).toEqual({ color: '#ff6640', brightness: 40, on: false });
      session.resetInspectorChanges();
      expect(session.getSnapshot().candidate).toBeNull();
      expect(
        session.previewInspector(
          [
            {
              type: 'set-light',
              id: 'floor-lamp',
              light: { color: '#ff6640', brightness: 40 },
            },
          ],
          'Light',
        ).ok,
      ).toBe(true);
      expect(session.applyInspectorChanges().ok).toBe(true);
      const project = readProject(exportProject(session.getSnapshot())!);
      if (!project.ok) throw new Error(project.code);
      const recovery = readRecovery(
        JSON.stringify(recoveryOf(session.getSnapshot())),
        1001,
      );
      if (!recovery.ok) throw new Error(recovery.code);
      expect(recovery.value.project.current).toEqual(project.value.current);
      const themed = evaluateBatch(
        project.value.current,
        [{ type: 'set-bedroom-theme', theme: 'modern' }],
        'visitor',
      );
      if (!themed.ok) throw new Error(themed.code);
      expect(
        themed.room.furniture.find((p) => p.id === 'floor-lamp')!.light,
      ).toEqual({ color: '#ff6640', brightness: 40, on: true });
      expect(session.undo().ok).toBe(true);
      expect(session.getSnapshot().workspace!.current).toEqual({
        ...room,
        roomRevision: session.getSnapshot().workspace!.current.roomRevision,
      });
    } finally {
      session.dispose();
    }
  });
  it('coalesces continuous brightness changes without losing previous colour/on fields', () => {
    let batches: ReturnType<typeof appendInspectorEdits> = [];
    for (let brightness = 0; brightness < 500; brightness++)
      batches = appendInspectorEdits(batches, [
        {
          type: 'set-light',
          id: 'lamp',
          light: brightness
            ? { brightness: brightness % 101 }
            : { color: '#ff6640', on: false },
        },
      ]);
    expect(batches).toHaveLength(1);
    expect(batches[0]![0]).toEqual({
      type: 'set-light',
      id: 'lamp',
      light: { color: '#ff6640', on: false, brightness: 499 % 101 },
    });
  });
});

describe('ceiling catalogue and shared physical owner', () => {
  it('provides three distinct bounded original representations', () => {
    expect(ceilingEntries).toHaveLength(3);
    const representations = ceilingEntries.map((entry) =>
      proceduralParts(
        entry.category,
        {
          width: entry.size.width.default,
          depth: entry.size.depth.default,
          height: entry.size.height.default,
        },
        entry.accessMechanism,
        entry.assetId,
      ),
    );
    expect(
      new Set(representations.map((value) => JSON.stringify(value))).size,
    ).toBe(3);
    for (const parts of representations) {
      expect(parts.length).toBeLessThanOrEqual(16);
      for (const part of parts)
        expect(
          part.size.every((value) => Number.isFinite(value) && value > 0),
        ).toBe(true);
    }
  });
  it.each(ceilingEntries)(
    '$label manual ghost/commit follows the ceiling and can overlap floor furniture below',
    (entry) => {
      const room = commandRoom([piece('desk', 5000, 5000)]),
        session = new SessionController(room),
        placement = new CataloguePlacement(session, () => entry.id);
      try {
        expect(placement.start(entry)).toBe(true);
        placement.move({ x: 5000, z: 5000 }, true, false);
        expect(placement.getSnapshot()!.item.pose.bottomY).toBe(
          3000 - entry.size.height.default,
        );
        expect(placement.commit().ok).toBe(true);
        const current = session.getSnapshot().workspace!.current;
        expect(current.furniture[0]).toEqual(room.furniture[0]);
        expect(current.furniture[1]!.pose.bottomY).toBe(
          3000 - entry.size.height.default,
        );
        expect(
          session.dispatch(
            [
              {
                type: 'correct-dimensions',
                id: room.roomId,
                width: 10000,
                depth: 10000,
                height: 3200,
              },
            ],
            'Height',
          ).ok,
        ).toBe(true);
        expect(
          session.getSnapshot().workspace!.current.furniture[1]!.pose.bottomY,
        ).toBe(3200 - entry.size.height.default);
        expect(session.undo().ok).toBe(true);
        expect(
          session.getSnapshot().workspace!.current.furniture[1]!.pose.bottomY,
        ).toBe(3000 - entry.size.height.default);
      } finally {
        placement.dispose();
        session.dispose();
      }
    },
  );
  it.each(ceilingEntries)(
    '$label is understood by search and backend direct tools without a provider',
    async (entry) => {
      const { input, task, request, result } = search(
        commandRoom(),
        `Add a ${entry.label.toLowerCase()}`,
      );
      expect(task.goal!.additions[0]!.catalogueId).toBe(entry.id);
      expect(
        validateSearchCandidate(request, result.candidate!, task.scope),
      ).not.toBeNull();
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
      expect(
        tools.reply().actions!.find((action) => action.type === 'add'),
      ).toMatchObject({
        furniture: { pose: { bottomY: 3000 - entry.size.height.default } },
      });
    },
  );
  it('keeps ceiling X/Z/rotation and mounting through moves while locked placement remains protected', () => {
    const room = lightingRoom(),
      lamp = room.furniture.find((p) => p.id === 'ceiling-pendant')!;
    const pose = wallMountedPose(room, lamp, {
      ...lamp.pose,
      centerX: 5500,
      centerZ: 6000,
      quarterTurns: 1,
      bottomY: 1,
    });
    expect(pose).toMatchObject({
      centerX: 5500,
      centerZ: 6000,
      quarterTurns: 1,
      bottomY: 2500,
    });
    lamp.locks.position = true;
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'move',
            id: lamp.id,
            pose: { centerX: 5500, centerZ: 6000, quarterTurns: 0 },
          },
        ],
        'visitor',
      ).ok,
    ).toBe(false);
    room.room.height = { value: null, status: 'unknown', sourceId: null };
    const fallback = wallMountedPose(room, lamp);
    expect(fallback.bottomY).toBe(2100);
  });
});

describe('Medy light controls', () => {
  it.each(LIGHT_PRESETS)(
    'sets $label as emission while retaining finish/materials/geometry',
    (preset) => {
      const room = lightingRoom(),
        before = structuredClone(room),
        edit = resolveMedyRequest(
          room,
          `Set the Floor lamp light to ${preset.id.replaceAll('-', ' ')}`,
          null,
        );
      if (edit?.kind !== 'edits')
        throw new Error(`missing-light-edit:${JSON.stringify(edit)}`);
      expect(edit.actions).toEqual([
        { type: 'set-light', id: 'floor-lamp', light: { color: preset.color } },
      ]);
      const changed = evaluateBatch(room, edit.actions, 'visitor');
      if (!changed.ok) throw new Error(changed.code);
      expect(
        changed.room.furniture.find((p) => p.id === 'floor-lamp')!.materials,
      ).toEqual(before.furniture.find((p) => p.id === 'floor-lamp')!.materials);
      expect(changed.room.room).toEqual(before.room);
      expect(room).toEqual(before);
    },
  );
  it.each([
    'Set the lights brightness to 50%',
    'Turn the lights off',
    'Set both lights colour to warm red',
  ])('supports one atomic light group: %s', (text) => {
    const edit = resolveMedyRequest(lightingRoom(), text, null);
    if (edit?.kind !== 'edits')
      throw new Error(`missing-group:${JSON.stringify(edit)}`);
    expect(edit.actions).toHaveLength(2);
    expect(edit.actions.every((action) => action.type === 'set-light')).toBe(
      true,
    );
  });
  it('retains a named lamp through bounded human context and keeps unsupported/negated/mixed edits inert', () => {
    const room = lightingRoom(),
      context = [
        {
          role: 'user' as const,
          text: 'Set the Floor lamp light to warm white',
        },
        {
          role: 'assistant' as const,
          text: 'That lamp can have a warmer glow.',
        },
      ];
    expect(
      resolveMedyRequest(room, 'make it warm red', null, context),
    ).toMatchObject({
      kind: 'edits',
      actions: [
        { type: 'set-light', id: 'floor-lamp', light: { color: '#ff6640' } },
      ],
    });
    for (const text of [
      "don't turn the lights off",
      'Set the lights brightness to 150%',
      'Set the lights red or blue',
      'Turn the lights off and move the desk',
      'Set the desk light colour to warm red',
      'Set the light to warm red',
      'Set the lights brightness to -10%',
      'Set the lights brightness to 50.5%',
      'Set the lights brightness to 20% and 80%',
      'Set the lights red and blue',
      'Set the Floor lamp light red and finish walnut',
      'Turn the lights off and paint the walls red',
    ])
      expect(resolveMedyRequest(room, text, null)?.kind).not.toBe('edits');
  });
  it.each(['day', 'night', 'floor', 'ceiling'])(
    'exposes the local %s view control without a provider',
    (mode) => {
      expect(
        resolveMedyRequest(lightingRoom(), `show ${mode}`, null),
      ).toMatchObject({
        kind: 'control',
        control: { type: 'environment', mode },
      });
      expect(
        resolveMedyRequest(lightingRoom(), `do not show ${mode}`, null)?.kind,
      ).not.toBe('control');
    },
  );
});

describe('bounded real lighting and floor/ceiling projections', () => {
  it('builds real finite-range spotlights, configured shadows and disposable targets', () => {
    const lamp = lightingRoom().furniture.find((p) => p.id === 'floor-lamp')!,
      light = createFixtureLight(lamp, true);
    expect(light.isSpotLight).toBe(true);
    expect(light.position.toArray()).toEqual(fixtureSource(lamp));
    expect(light.target.position.y).toBeLessThan(light.position.y);
    expect(light.distance).toBe(14);
    expect(light.decay).toBe(2);
    expect(light.shadow.mapSize.toArray()).toEqual([512, 512]);
    const dispose = vi.spyOn(light.shadow, 'dispose');
    light.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('caps active illumination, includes selection, excludes off/zero lights and preserves the room', () => {
    const room = commandRoom(
        Array.from({ length: 12 }, (_, i) =>
          fixture('floor-lamp', `lamp-${i}`, 1000 + i * 500, 5000),
        ),
      ),
      before = structuredClone(room);
    expect(illuminatedFixtures(room, 'lamp-9')).toHaveLength(8);
    expect(illuminatedFixtures(room, 'lamp-9')[0]!.id).toBe('lamp-9');
    expect(room).toEqual(before);
    room.furniture[0]!.light = { color: '#ff6640', brightness: 100, on: false };
    room.furniture[1]!.light = { color: '#ffffff', brightness: 0, on: true };
    expect(illuminatedFixtures(room, null).map((p) => p.id)).not.toContain(
      'lamp-0',
    );
    expect(illuminatedFixtures(room, null).map((p) => p.id)).not.toContain(
      'lamp-1',
    );
  });
  it('keeps floor labels visible below ceiling lights and exposes the right plan objects', () => {
    const room = lightingRoom();
    room.furniture.find((p) => p.id === 'ceiling-pendant')!.pose.centerX = 2000;
    room.furniture.find((p) => p.id === 'ceiling-pendant')!.pose.centerZ = 2000;
    expect(projectedLabelVisible(room, room.furniture[0]!)).toBe(true);
    expect(layerFurniture(room, 'ceiling').every(isCeiling)).toBe(true);
    const session = new SessionController(room);
    try {
      const floor = renderToStaticMarkup(
        createElement(PlanView, {
          controller: session,
          state: session.getSnapshot(),
          layer: 'floor',
        }),
      );
      const ceiling = renderToStaticMarkup(
        createElement(PlanView, {
          controller: session,
          state: session.getSnapshot(),
          layer: 'ceiling',
        }),
      );
      expect(floor).toContain('Floor lamp');
      expect(floor).not.toContain('Pendant light');
      expect(ceiling).toContain('Pendant light');
      expect(ceiling).not.toContain('Floor lamp');
    } finally {
      session.dispose();
    }
  });
  it('darkens the outside and glass without changing geometry or replacing the reflection owner', () => {
    const glass = createWindowGlass(),
      mirror = glass.mirror;
    glass.setNight(true);
    expect(glass.daylight.color.getHexString()).toBe('02040a');
    expect(glass.material.envMapIntensity).toBeLessThan(0.1);
    glass.setNight(false);
    expect(glass.material.transmission).toBe(0.96);
    expect(glass.mirror).toBe(mirror);
    glass.dispose();
    glass.dispose();
  });
});

describe('first-night guidance preference', () => {
  it('offers only the first empty entry and stores no room data', () => {
    const values = new Map<string, string>(),
      storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
      },
      owner = {};
    expect(offerNightLighting(owner, false, storage)).toBe(true);
    expect(offerNightLighting(owner, false, storage)).toBe(false);
    expect(offerNightLighting({}, false, storage)).toBe(false);
    expect([...values.values()]).toEqual(['1']);
  });
  it('does not nag after a first entry with fixtures or when storage is blocked', () => {
    const blocked = {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
      owner = {};
    expect(offerNightLighting(owner, true, blocked)).toBe(false);
    expect(offerNightLighting(owner, false, blocked)).toBe(false);
    const empty = {};
    expect(offerNightLighting(empty, false, blocked)).toBe(true);
    expect(offerNightLighting(empty, false, blocked)).toBe(false);
  });
});
