import { describe, expect, it } from 'vitest';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import type { Furniture } from '@roomedy/contracts/room';
import {
  placementTarget,
  CATALOGUE,
  checkRoom,
  evaluateBatch,
  furnitureSizePresets,
  visitorCatalogueFurniture,
  wallMountedPose,
  resolveMedyRequest,
  featureLabel,
  createCommandWorkspace,
  applyCommand,
  undoCommand,
  scopeAllows,
  furnitureByElevation,
  projectedLabelVisible,
} from '@roomedy/spatial';
import {
  commandRoom,
  door,
  envelope,
  unknown,
} from './fixtures/command-room.js';
import {
  piecePose,
  pieceRepresentation,
} from '../apps/frontend/src/features/room-view/adapter.js';
import {
  furnitureOpening,
  furniturePartMotion,
} from '../apps/frontend/src/features/room-view/articulation.js';
import { snapPosition } from '../apps/frontend/src/features/plan-view/adapter.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';

const item = (id: string, x = 2000, z = 2000) => {
  const entry = CATALOGUE.find((e) => e.id === id)!;
  return visitorCatalogueFurniture(
    entry,
    { width: entry.size.width.default, depth: entry.size.depth.default },
    { centerX: x, centerZ: z, quarterTurns: 0 },
    `test-${id}`,
  );
};
const hard = (furniture: Furniture[]) =>
  checkRoom(commandRoom(furniture)).issues.filter((i) => i.severity === 'hard');
describe('bedroom catalogue and real elevated placement', () => {
  it('adds coherent bounded adjustable representations and useful TV diagonal presets', () => {
    expect(CATALOGUE).toHaveLength(19);
    for (const entry of CATALOGUE.slice(8)) {
      const piece = item(entry.id);
      if (entry.placement === 'wall')
        piece.pose = wallMountedPose(commandRoom(), piece);
      expect(roomDocumentSchema.safeParse(commandRoom([piece])).success).toBe(
        true,
      );
      expect(pieceRepresentation(piece).kind).toBe('procedural');
      expect(hard([piece])).toEqual([]);
      expect(
        furnitureSizePresets(entry).some(
          (p) =>
            p.width === entry.size.width.default &&
            p.depth === entry.size.depth.default &&
            p.height === entry.size.height.default,
        ),
      ).toBe(true);
    }
    for (const id of ['tv-wall', 'tv-tabletop']) {
      const presets = furnitureSizePresets(CATALOGUE.find((e) => e.id === id)!);
      expect(presets.map((p) => p.label)).toEqual([
        '43-inch',
        '50-inch',
        '55-inch',
        '65-inch',
        '75-inch',
      ]);
      expect(presets[2]!.width).toBe(1238);
    }
  });
  it.each(['drawer-shelf', 'chest-drawers', 'bedside-drawers', 'tv-stand'])(
    'articulates complete drawers on %s while leaving the case and upper shelves fixed',
    (id) => {
      const piece = item(id),
        representation = pieceRepresentation(piece);
      expect(furnitureOpening(piece)?.kind).toBe('drawer');
      if (representation.kind !== 'procedural') throw Error('missing parts');
      const drawers = representation.parts.filter(
        (p) => p.name.startsWith('drawer-') && p.name !== 'drawer-divider',
      );
      expect(drawers.length).toBeGreaterThan(10);
      for (const part of drawers)
        expect(
          furniturePartMotion(
            part,
            representation.parts,
            'drawer',
            representation.footprint.depth,
          )?.travel[2],
        ).toBeGreaterThan(0);
      expect(
        furniturePartMotion(
          representation.parts.find((p) => p.name === 'back')!,
          representation.parts,
          'drawer',
          representation.footprint.depth,
        ),
      ).toBeNull();
    },
  );
  it('allows a TV above its stand, rejects real vertical overlap and preserves legacy floor rules with unknown heights', () => {
    const stand = item('tv-stand'),
      tv = item('tv-tabletop');
    expect(hard([stand, tv])).toEqual([]);
    tv.pose.bottomY = 599;
    expect(hard([stand, tv]).some((i) => i.rule === 'solid')).toBe(true);
    tv.pose.bottomY = 600;
    tv.dimensions.height = unknown();
    const facts = checkRoom(commandRoom([stand, tv]));
    expect(
      facts.issues.some(
        (i) => i.rule === 'solid' && i.severity === 'unassessed',
      ),
    ).toBe(true);
    const floor = item('side-table');
    floor.pose.centerX = stand.pose.centerX;
    floor.dimensions.height = unknown();
    expect(hard([stand, floor]).some((i) => i.rule === 'solid')).toBe(true);
  });
  it('shares mounting position with renderer, clamped drag, commands, height limits and position locks', () => {
    const tv = item('tv-wall');
    const room = commandRoom([tv]);
    tv.pose = wallMountedPose(room, tv);
    expect(piecePose(tv).position).toEqual([2, 1.2, 0.03]);
    expect(snapPosition(room, tv, { x: 8000, z: 4000 }, false)).toEqual({
      x: 8000,
      z: 30,
    });
    const moved = evaluateBatch(
      room,
      [
        {
          type: 'move',
          id: tv.id,
          pose: { centerX: 3000, centerZ: 30, quarterTurns: 0 },
        },
      ],
      'visitor',
    );
    expect(moved.ok).toBe(true);
    if (moved.ok) expect(moved.room.furniture[0]!.pose.bottomY).toBe(1200);
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'move',
            id: tv.id,
            pose: { ...placementTarget(tv.pose), centerZ: 1000 },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({
      ok: false,
      code: 'new-conflict',
      issue: { code: 'wall-mount' },
    });
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'move',
            id: tv.id,
            pose: { ...placementTarget(tv.pose), bottomY: 2500 },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({
      ok: false,
      code: 'new-conflict',
      issue: { rule: 'height' },
    });
    tv.locks.position = true;
    expect(
      evaluateBatch(
        room,
        [
          {
            type: 'move',
            id: tv.id,
            pose: { ...placementTarget(tv.pose), bottomY: 1000 },
          },
        ],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'locked' });
    expect(
      evaluateBatch(
        room,
        [{ type: 'rotate', id: tv.id, quarterTurns: 1 }],
        'visitor',
      ),
    ).toMatchObject({ ok: false, code: 'locked' });
    tv.locks.position = false;
    const result = evaluateBatch(
      room,
      [{ type: 'rotate', id: tv.id, quarterTurns: 1 }],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.room.furniture[0]!.pose).toMatchObject({
        centerX: 9970,
        bottomY: 1200,
        quarterTurns: 1,
      });
  });
  it('keeps omitted elevated height unknown and never invents a floor pose', () => {
    const tv = item('tv-wall');
    delete tv.pose.bottomY;
    expect(pieceRepresentation(tv).kind).toBe('unavailable');
    expect(
      checkRoom(commandRoom([tv])).issues.some(
        (i) => i.rule === 'height' && i.severity === 'unassessed',
      ),
    ).toBe(true);
    expect(
      roomDocumentSchema.safeParse(commandRoom([item('procedural-bed')]))
        .success,
    ).toBe(true);
  });
  it('retains one-room bathroom-door purpose through commands and whole-change Undo', () => {
    const room = commandRoom(),
      feature = { ...door(), purpose: 'bathroom' as const };
    expect(featureLabel(feature)).toBe('Bathroom door');
    const workspace = createCommandWorkspace(room, {
      workspaceId: 'bathroom-test',
      generation: 0,
    });
    const result = applyCommand(
      workspace,
      envelope(workspace, [{ type: 'add-feature', feature }]),
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.workspace.current.room.features).toEqual([feature]);
    expect(result.workspace.current.room.shape).toBe('rectangle');
    const undo = undoCommand(result.workspace);
    expect(undo.ok).toBe(true);
    if (undo.ok) expect(undo.workspace.current.room.features).toEqual([]);
    const old = door();
    expect(roomDocumentSchema.safeParse(commandRoom([], [old])).success).toBe(
      true,
    );
  });
  it('exposes the same exact TV elevation, wall and bathroom-door edits through MEDY', () => {
    const tv = item('tv-wall');
    tv.pose = wallMountedPose(commandRoom(), tv);
    const room = commandRoom([tv]);
    const height = resolveMedyRequest(
      room,
      'set this TV bottom edge to 100 cm above the floor',
      tv.id,
    );
    expect(height?.kind).toBe('edits');
    if (height?.kind === 'edits') {
      const result = evaluateBatch(room, height.actions, 'visitor');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.room.furniture[0]!.pose.bottomY).toBe(1000);
    }
    const resize = resolveMedyRequest(room, 'make this TV 65 inch', tv.id);
    expect(resize?.kind).toBe('edits');
    const wall = resolveMedyRequest(
      room,
      'mount this TV on the east wall',
      tv.id,
    );
    expect(wall?.kind).toBe('edits');
    if (wall?.kind === 'edits')
      expect(wall.actions[0]).toMatchObject({
        type: 'move',
        pose: { quarterTurns: 1, centerX: 9970 },
      });
    const bath = resolveMedyRequest(
      room,
      'add a bathroom door on the south wall',
      null,
    );
    expect(bath?.kind).toBe('edits');
    if (bath?.kind === 'edits')
      expect(bath.actions[0]).toMatchObject({
        type: 'add-feature',
        feature: { kind: 'door', purpose: 'bathroom', wall: 'south' },
      });
    for (const [words, id] of [
      ['add a mirror at x 2000 mm z 2000 mm', 'full-length-mirror'],
      ['add a shelf with drawers at x 2000 mm z 2000 mm', 'drawer-shelf'],
      ['add a 43-inch wall-mounted TV at x 2000 mm z 2000 mm', 'tv-wall'],
    ] as const) {
      const result = resolveMedyRequest(commandRoom(), words, null);
      expect(result?.kind).toBe('edits');
      if (result?.kind === 'edits')
        expect(result.actions[0]).toMatchObject({
          type: 'add',
          furniture: { catalogueId: id },
        });
    }
  });
  it('shows a reflective mirror face ahead of its back plate, with a real open frame', () => {
    const mirror = item('full-length-mirror');
    const model = pieceRepresentation(mirror);
    if (model.kind !== 'procedural') throw Error('missing mirror');
    const y = mirror.dimensions.height.value! / 2;
    const visible = model.parts
      .filter(
        (p) =>
          Math.abs(p.center[0]) < p.size[0] / 2 &&
          Math.abs(p.center[1] - y) < p.size[1] / 2,
      )
      .sort(
        (a, b) => b.center[2] + b.size[2] / 2 - (a.center[2] + a.size[2] / 2),
      );
    expect(visible[0]!.name).toBe('mirror-glass');
  });
  it('keeps mounting and bathroom-door semantics in project round trips and exported scene geometry', () => {
    const tv = item('tv-wall'),
      mirror = item('full-length-mirror', 5000, 5000);
    tv.pose = wallMountedPose(commandRoom(), tv);
    const room = commandRoom(
      [tv, mirror],
      [{ ...door(), purpose: 'bathroom' }],
    );
    const controller = new SessionController(room);
    const saved = exportProject(controller.getSnapshot());
    expect(typeof saved).toBe('string');
    if (saved) {
      const opened = readProject(saved);
      expect(opened.ok).toBe(true);
      if (opened.ok) expect(opened.value.current).toEqual(room);
    }
    const scene = buildDesignScene(room);
    try {
      expect(scene.root.getObjectByName(tv.label)!.position.y).toBe(1.2);
      expect(scene.root.getObjectByName('Bathroom door')).toBeDefined();
      expect(scene.root.getObjectByName('mirror-glass')).toBeDefined();
    } finally {
      scene.dispose();
      controller.dispose();
    }
  });
  it('requires both move and rotation scope when a wall TV switches walls', () => {
    const tv = item('tv-wall');
    tv.pose = wallMountedPose(commandRoom(), tv);
    const room = commandRoom([tv]);
    const scope = {
      roomId: room.roomId,
      roomRevision: 0,
      actionKinds: ['rotate'],
      targetIds: [tv.id],
      additions: [],
      replacements: [],
      removals: [],
      roomFinishes: false,
    };
    const actions = [{ type: 'rotate', id: tv.id, quarterTurns: 1 }];
    expect(scopeAllows(room, actions, scope)).toBe(false);
    expect(
      scopeAllows(room, actions, { ...scope, actionKinds: ['rotate', 'move'] }),
    ).toBe(true);
  });
  it('projects stacked furniture in height order without painting two centre labels over each other', () => {
    const stand = item('tv-stand'),
      tv = item('tv-tabletop');
    const room = commandRoom([tv, stand]);
    expect(furnitureByElevation(room).map((p) => p.id)).toEqual([
      stand.id,
      tv.id,
    ]);
    expect(projectedLabelVisible(room, stand)).toBe(false);
    expect(projectedLabelVisible(room, tv)).toBe(true);
    tv.pose.centerX = 5000;
    expect(projectedLabelVisible(room, stand)).toBe(true);
  });
  it('uses the replacement entry mounting defaults rather than carrying a TV height into floor furniture', () => {
    const tv = item('tv-tabletop');
    tv.locks.dimensions = false;
    const room = commandRoom([tv]);
    const request = resolveMedyRequest(
      room,
      'replace this TV with a full-length mirror at x 5000 mm z 2000 mm',
      tv.id,
    );
    expect(request?.kind).toBe('edits');
    if (request?.kind !== 'edits') throw Error('missing replacement');
    const result = evaluateBatch(room, request.actions, 'visitor');
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.room.furniture[0]!.pose).not.toHaveProperty('bottomY');
  });
});
