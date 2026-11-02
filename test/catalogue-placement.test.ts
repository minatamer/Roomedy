import { afterEach, describe, expect, it } from 'vitest';
import { CATALOGUE } from '@roomedy/spatial';
import { DEFAULT_FURNITURE_LOCKS } from '@roomedy/contracts/room';
import {
  CataloguePlacement,
  catalogueFurniture,
} from '../apps/frontend/src/features/room-editor/catalogue-placement.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { cameraViewPose } from '../apps/frontend/src/features/room-view/camera.js';
import { projectOf } from '../apps/frontend/src/features/session/project.js';
import { releaseCataloguePlacement } from '../apps/frontend/src/features/room-editor/catalogue-placement-input.js';
import { BEDROOM_THEMES } from '@roomedy/contracts/furniture-materials';

const desk = CATALOGUE.find((entry) => entry.category === 'desk')!;
const sessions: SessionController[] = [];
let sequence = 0;
function setup(view: 'plan' | 'cutaway' = 'plan', occupied = false) {
  const room = structuredClone(createRoomFixture('empty'));
  if (occupied)
    room.furniture.push(
      catalogueFurniture(
        desk,
        { width: desk.size.width.default, depth: desk.size.depth.default },
        { centerX: 2100, centerZ: 2400, quarterTurns: 0 },
        'existing',
      ),
    );
  const session = new SessionController(room);
  sessions.push(session);
  session.setRoomView(view);
  const placement = new CataloguePlacement(
    session,
    () => `placed_${++sequence}`,
  );
  return { session, placement };
}
afterEach(() => {
  sessions.splice(0).forEach((s) => s.dispose());
});

describe('catalogue additions use the shared command authority', () => {
  it.each(CATALOGUE)(
    'previews and commits the canonical default for $id',
    (entry) => {
      const { session, placement } = setup('cutaway');
      expect(placement.start(entry)).toBe(true);
      expect(placement.getSnapshot()?.error).toBe('');
      expect(placement.commit()).toMatchObject({ ok: true, changed: true });
      expect(
        session.getSnapshot().workspace!.current.furniture[0]!.catalogueId,
      ).toBe(entry.id);
    },
  );
  it.each(BEDROOM_THEMES)(
    'adds every mirror under the $id theme through the real placement controller',
    (theme) => {
      for (const id of [
        'mirror-wall',
        'mirror-standing',
        'wardrobe-mirrored',
        'full-length-mirror',
      ]) {
        const { session, placement } = setup('cutaway');
        expect(
          session.dispatch(
            [{ type: 'set-bedroom-theme', theme: theme.id }],
            'Theme',
          ).ok,
        ).toBe(true);
        placement.start(CATALOGUE.find((e) => e.id === id)!);
        expect(placement.getSnapshot()?.error).toBe('');
        expect(placement.commit()).toMatchObject({ ok: true, changed: true });
        expect(session.undo().ok).toBe(true);
        expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(
          0,
        );
      }
    },
  );
  it('commits the presented green preview once even when the camera projection changes before release', () => {
    const { session, placement } = setup('cutaway');
    let projected = { x: 900, z: 1000 };
    placement.registerTarget({
      element: {
        isConnected: true,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }),
      } as HTMLCanvasElement,
      point: () => projected,
    });
    placement.start(desk);
    const client = { x: 50, y: 50 };
    placement.move(placement.locate(client), true);
    const displayed = placement.getSnapshot()!.item.pose;
    projected = { x: 3000, z: 3500 };
    expect(releaseCataloguePlacement(placement, client, client)).toMatchObject({
      ok: true,
      changed: true,
    });
    expect(session.getSnapshot().workspace!.current.furniture[0]!.pose).toEqual(
      displayed,
    );
    expect(releaseCataloguePlacement(placement, client, client).ok).toBe(false);
    expect(session.getSnapshot().workspace!.history.entries).toHaveLength(1);
  });
  it('projects an unpresented release position and cancels an outside release', () => {
    const { session, placement } = setup();
    placement.registerTarget({
      element: {
        isConnected: true,
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }),
      } as HTMLCanvasElement,
      point: () => ({ x: 1000, z: 1000 }),
    });
    placement.start(desk);
    expect(
      releaseCataloguePlacement(placement, { x: 70, y: 50 }, { x: 50, y: 50 })
        .ok,
    ).toBe(true);
    expect(
      session.getSnapshot().workspace!.current.furniture[0]!.pose.centerX,
    ).toBe(1000);
    placement.start(desk);
    expect(
      releaseCataloguePlacement(placement, { x: 101, y: 50 }, null).ok,
    ).toBe(false);
    expect(placement.getSnapshot()).toBeNull();
    expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(1);
  });
  it('retains an invalid wall ghost on a missed in-canvas ray, then recovers at the next valid wall hit', () => {
    const { placement } = setup('cutaway');
    placement.start(CATALOGUE.find((e) => e.id === 'mirror-wall')!);
    placement.move({ x: 1000, z: 0, bottomY: 1200, quarterTurns: 0 });
    const visible = placement.getSnapshot()!.item;
    placement.move(null, true);
    expect(placement.getSnapshot()).toMatchObject({
      inside: true,
      valid: false,
      item: visible,
    });
    expect(placement.commit().ok).toBe(false);
    placement.move({ x: 1500, z: 0, bottomY: 1200, quarterTurns: 0 });
    expect(placement.getSnapshot()?.valid).toBe(true);
    expect(placement.commit().ok).toBe(true);
  });
  it.each(['plan', 'cutaway'] as const)(
    'keeps session snapping enabled for placement in %s',
    (view) => {
      const { session, placement } = setup(view);
      const accepted = session.getSnapshot().workspace;
      expect(session.getSnapshot().presentation.snap).toBe(true);
      session.setView({ snap: false, zoom: 1.8 });
      expect(session.getSnapshot().presentation.snap).toBe(true);
      expect(session.getSnapshot().presentation.zoom).toBe(1.8);
      expect(session.getSnapshot().workspace).toBe(accepted);
      placement.start(desk);
      placement.move({ x: 1987, z: 2233 });
      expect(placement.getSnapshot()!.item.pose).toMatchObject({
        centerX: 2000,
        centerZ: 2250,
      });
      expect(session.getSnapshot().workspace).toBe(accepted);
    },
  );

  it.each(['plan', 'cutaway'] as const)(
    'suggests inward wardrobe facing in %s until explicit rotation, then preserves the visitor choice',
    (view) => {
      const { session, placement } = setup(view);
      const wardrobe = CATALOGUE.find((p) => p.id === 'wardrobe-hinged')!;
      const original = session.getSnapshot().workspace;
      placement.start(wardrobe);
      placement.move({ x: 3900, z: 3200 }, true, false);
      expect(placement.getSnapshot()!.item.pose.quarterTurns).toBe(1);
      expect(placement.getSnapshot()!.valid).toBe(true);
      placement.rotate();
      expect(placement.getSnapshot()!.item.pose.quarterTurns).toBe(2);
      placement.move({ x: 3850, z: 3200 }, true, false);
      expect(placement.getSnapshot()!.item.pose.quarterTurns).toBe(2);
      expect(session.getSnapshot().workspace).toBe(original);
      placement.cancel();
      placement.start(wardrobe);
      placement.move({ x: 350, z: 3200 }, true, false);
      expect(placement.getSnapshot()!.item.pose.quarterTurns).toBe(3);
      expect(placement.commit()).toMatchObject({ ok: true, changed: true });
      expect(
        session.getSnapshot().workspace!.current.furniture[0]!.pose
          .quarterTurns,
      ).toBe(3);
      expect(session.undo().ok).toBe(true);
    },
  );
  it.each(['plan', 'cutaway'] as const)(
    'previews without room/history changes, adds once in %s and enables the desk view',
    (view) => {
      const { session, placement } = setup(view);
      const before = session.getSnapshot().workspace;
      expect(cameraViewPose(before!.current, 'work-area')).toBeNull();
      expect(placement.start(desk)).toBe(true);
      expect(placement.getSnapshot()?.valid).toBe(true);
      expect(session.getSnapshot().workspace).toBe(before);
      expect(session.getSnapshot().candidate).toBeNull();
      const item = placement.getSnapshot()!.item;
      expect(item.locks).toEqual(DEFAULT_FURNITURE_LOCKS);
      expect(item.ownership).toBe('proposed');
      expect(item.dimensions.width).toMatchObject({
        value: desk.size.width.default,
        status: 'estimated',
        sourceId: 'visitor-estimate',
      });
      expect(item.pose.provenance).toEqual({
        status: 'planned',
        sourceId: 'visitor-plan',
      });
      expect(placement.commit()).toMatchObject({ ok: true, changed: true });
      expect(placement.commit()).toMatchObject({ ok: false, code: 'stale' });
      const after = session.getSnapshot();
      expect(after.workspace!.current.furniture).toHaveLength(1);
      expect(after.workspace!.history.entries).toHaveLength(1);
      expect(after.presentation).toMatchObject({
        selectedId: item.id,
        panel: 'inspector',
      });
      expect(
        cameraViewPose(after.workspace!.current, 'work-area'),
      ).not.toBeNull();
      expect(session.undo().ok).toBe(true);
      expect(session.getSnapshot().workspace!.current.furniture).toHaveLength(
        0,
      );
      expect(
        cameraViewPose(session.getSnapshot().workspace!.current, 'work-area'),
      ).toBeNull();
    },
  );

  it('keeps an overlapping drop uncommitted and lets the same piece be repositioned', () => {
    const { session, placement } = setup('plan', true);
    const before = session.getSnapshot().workspace;
    placement.start(desk);
    placement.move({ x: 2100, z: 2400 });
    expect(placement.getSnapshot()?.valid).toBe(false);
    expect(placement.getSnapshot()?.error).toContain('overlap');
    expect(placement.commit().ok).toBe(false);
    expect(session.getSnapshot().workspace).toBe(before);
    const id = placement.getSnapshot()!.item.id;
    placement.move({ x: 800, z: 800 });
    expect(placement.getSnapshot()?.valid).toBe(true);
    expect(placement.getSnapshot()?.item.id).toBe(id);
    expect(placement.commit().ok).toBe(true);
  });

  it('clamps rotated footprints, preserves real dimensions and allows half-mm keyboard placement', () => {
    const { session, placement } = setup();
    session.setView({ snap: false });
    placement.start(desk);
    const dimensions = placement.getSnapshot()!.item.dimensions;
    placement.move({ x: -500, z: -500 });
    expect(placement.getSnapshot()!.item.pose).toMatchObject({
      centerX: desk.size.width.default / 2,
      centerZ: desk.size.depth.default / 2,
    });
    placement.rotate();
    placement.move({ x: -500, z: -500 });
    expect(placement.getSnapshot()!.item.pose).toMatchObject({
      centerX: desk.size.depth.default / 2,
      centerZ: desk.size.width.default / 2,
      quarterTurns: 1,
    });
    expect(placement.getSnapshot()!.item.dimensions).toBe(dimensions);
    placement.move({ x: 1900.5, z: 2200.5 }, true, false);
    expect(placement.getSnapshot()!.item.pose).toMatchObject({
      centerX: 1900.5,
      centerZ: 2200.5,
    });
    expect(placement.commit().ok).toBe(true);
  });

  it('cancels outside/non-finite drops and explicit cancellation without creating a piece', () => {
    const { session, placement } = setup();
    const before = session.getSnapshot().workspace;
    placement.start(desk);
    placement.move(null);
    expect(placement.commit().ok).toBe(false);
    placement.start(desk);
    placement.move({ x: Infinity, z: 1000 });
    expect(placement.getSnapshot()?.inside).toBe(false);
    expect(placement.commit().ok).toBe(false);
    placement.start(desk);
    placement.cancel();
    expect(placement.getSnapshot()).toBeNull();
    expect(session.getSnapshot().workspace).toBe(before);
  });

  it.each([
    'selection',
    'view',
    'command',
    'preview',
    'reset',
    'import',
    'expiry',
    'dispose',
  ] as const)(
    '%s retires a placement before an old release can add',
    (action) => {
      const { session, placement } = setup();
      const project = projectOf(session.getSnapshot())!;
      placement.start(desk);
      if (action === 'selection')
        session.select(project.current.room.features[0]!.id);
      if (action === 'view') session.setRoomView('cutaway');
      if (action === 'command')
        session.dispatch(
          [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'sage' }],
          'Manual finish',
        );
      if (action === 'preview')
        session.prepareVisitorPreview(
          [{ type: 'room-finish', floorFinish: 'walnut', wallFinish: 'sage' }],
          'Room palette',
        );
      if (action === 'reset') session.reset(createRoomFixture('empty'));
      if (action === 'import') session.importProject(project);
      if (action === 'expiry') session.expiredRecovery();
      if (action === 'dispose') session.dispose();
      const retired = session.getSnapshot();
      expect(placement.getSnapshot()).toBeNull();
      expect(placement.commit()).toMatchObject({ ok: false, code: 'stale' });
      expect(session.getSnapshot()).toBe(retired);
      expect(retired.workspace?.current.furniture.length ?? 0).toBe(0);
    },
  );
});
