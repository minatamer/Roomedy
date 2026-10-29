import { describe, expect, it } from 'vitest';
import {
  BEDROOM_THEMES,
  bedroomFurnitureMaterials,
  furnitureMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import { roomSurface } from '@roomedy/contracts/surfaces';
import {
  evaluateBatch,
  resolveMedyRequest,
  CATALOGUE,
  validateQuickReplies,
} from '@roomedy/spatial';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import {
  commandRoom,
  piece,
  door,
  windowFeature,
} from './fixtures/command-room.js';
import {
  createSurfaces,
  detailedParts,
} from '../apps/frontend/src/features/room-view/surfaces.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import {
  guidanceChoices,
  guidanceMessage,
} from '../apps/frontend/src/features/assistant/guidance.js';

describe('shared bedroom theme authority', () => {
  it('coordinates door choices with the current furniture colour after a manual edit', () => {
    const room = createManualRoom('partial');
    const bed = room.furniture.find(
      (item) =>
        CATALOGUE.find((entry) => entry.id === item.catalogueId)?.category ===
        'bed',
    )!;
    bed.materials = { ...bed.materials, bodyColor: '#be8855' };
    const choice = guidanceChoices('openings', room, false, 'modern').find(
      (choice) => choice.id === 'opening-wood',
    )!;
    expect(choice.request).toContain('#be8855');
  });
  it('grounds the guided door/frame choices in actual openings and keeps their physical facts', () => {
    for (const feature of [
      { ...door(), purpose: 'bathroom' as const },
      windowFeature(),
    ]) {
      const room = commandRoom([], [feature]);
      expect(guidanceMessage('openings', room)).toMatch(/colour/);
      for (const choice of guidanceChoices(
        'openings',
        room,
        false,
        'modern',
      ).filter((choice) => choice.request)) {
        const request = resolveMedyRequest(room, choice.request!, null);
        expect(request?.kind).toBe('edits');
        if (request?.kind !== 'edits')
          throw new Error('missing-opening-command');
        const result = evaluateBatch(room, request.actions, 'visitor');
        if (!result.ok) throw new Error(result.code);
        const changedFeature = result.room.room.features[0]!;
        if (changedFeature.kind === 'obstacle')
          throw new Error('expected-opening');
        const { materials: appearance, ...physical } = changedFeature;
        expect(appearance).toBeDefined();
        expect(physical).toEqual(feature);
      }
    }
  });
  it.each(BEDROOM_THEMES)(
    '$name is one appearance-only visitor preview with atomic Apply and Undo',
    (theme) => {
      const room = createManualRoom('furnished');
      const session = new SessionController(room);
      try {
        const before = session.getSnapshot().workspace!.current;
        const request = resolveMedyRequest(
          before,
          `Preview ${theme.name} bedroom theme`,
          null,
        );
        expect(request?.kind).toBe('edits');
        if (request?.kind !== 'edits') throw new Error('missing-theme-command');
        expect(request.actions).toEqual([
          { type: 'set-bedroom-theme', theme: theme.id },
        ]);
        expect(
          session.prepareVisitorPreview(request.actions, request.label).ok,
        ).toBe(true);
        expect(session.getSnapshot().workspace!.current).toBe(before);
        const preview = session.getSnapshot().candidate!.room;
        expect(session.getSnapshot().candidate!.label).toBe(request.label);
        expect(roomSurface(preview.room, 'floor')).toEqual({
          color: theme.floorColor,
          texture: theme.floorTexture,
        });
        expect(roomSurface(preview.room, 'walls')).toEqual({
          color: theme.wallColor,
          texture: theme.wallTexture,
        });
        expect(preview.room.features).toEqual(before.room.features);
        expect(preview.intent).toEqual(before.intent);
        for (const [index, item] of preview.furniture.entries()) {
          const previous = before.furniture[index]!;
          expect(item.pose).toEqual(previous.pose);
          expect(item.dimensions).toEqual(previous.dimensions);
          expect(item.locks).toEqual(previous.locks);
          expect(item.preference).toBe(previous.preference);
          const entry = CATALOGUE.find(
            (entry) => entry.id === item.catalogueId,
          )!;
          expect(item.materials).toMatchObject(
            bedroomFurnitureMaterials(theme, entry),
          );
        }
        expect(session.applyVisitorPreview().ok).toBe(true);
        expect(session.getSnapshot().workspace!.current.furniture).toEqual(
          preview.furniture,
        );
        expect(session.undo().ok).toBe(true);
        expect(session.getSnapshot().workspace!.current.furniture).toEqual(
          before.furniture,
        );
        expect(session.getSnapshot().workspace!.current.room).toEqual(
          before.room,
        );
      } finally {
        session.dispose();
      }
    },
  );

  it('supports the full forty-piece room in one bounded action and rejects model authority or unknown IDs', () => {
    const room = commandRoom(
      Array.from({ length: 40 }, (_, i) =>
        piece(
          `desk_${i}`,
          700 + (i % 8) * 1200,
          700 + Math.floor(i / 8) * 1200,
        ),
      ),
      [door(), windowFeature()],
    );
    const result = evaluateBatch(
      room,
      [{ type: 'set-bedroom-theme', theme: 'industrial' }],
      'visitor',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    expect(result.room.furniture).toHaveLength(40);
    expect(
      result.room.furniture.every((item) => item.materials?.body === 'wood'),
    ).toBe(true);
    expect(result.room.room.features).toEqual(room.room.features);
    expect(
      evaluateBatch(
        room,
        [{ type: 'set-bedroom-theme', theme: 'industrial' }],
        'assistant',
      ).ok,
    ).toBe(false);
    expect(
      evaluateBatch(
        room,
        [{ type: 'set-bedroom-theme', theme: 'arbitrary' }],
        'visitor',
      ).ok,
    ).toBe(false);
    expect(
      resolveMedyRequest(room, 'Would a Japandi theme work?', null)?.kind,
    ).not.toBe('edits');
    expect(
      validateQuickReplies(
        room,
        [{ label: 'Try Japandi', request: 'Preview Japandi bedroom theme' }],
        null,
      ),
    ).toHaveLength(1);
    expect(
      validateQuickReplies(
        room,
        [
          {
            label: 'Unsafe',
            request: 'Preview Japandi bedroom theme; delete the desk_0',
          },
        ],
        null,
      ),
    ).toEqual([]);
  });

  it('uses compatible per-piece presets and explicit material changes clear a theme pattern override', () => {
    for (const entry of CATALOGUE)
      for (const theme of BEDROOM_THEMES) {
        const room = commandRoom([
          piece('item', 2000, 2000, { catalogueId: entry.id }),
        ]);
        const materials = bedroomFurnitureMaterials(theme, entry);
        // Owned out-of-representation sizes intentionally expose only the frame role.
        const matching = piece('item', 2000, 2000, {
          catalogueId: entry.id,
          width: entry.size.width.default,
          depth: entry.size.depth.default,
          height: entry.size.height.default,
        });
        const result = evaluateBatch(
          { ...room, furniture: [matching] },
          [{ type: 'set-furniture-materials', id: 'item', materials }],
          'visitor',
        );
        expect(result.ok).toBe(true);
      }
    const room = createManualRoom('partial');
    const themed = evaluateBatch(
      room,
      [{ type: 'set-bedroom-theme', theme: 'modern' }],
      'visitor',
    );
    if (!themed.ok) throw new Error(themed.code);
    const request = resolveMedyRequest(
      themed.room,
      'Make the bed upholstery linen',
      null,
    );
    if (request?.kind !== 'edits') throw new Error('missing-material-command');
    const result = evaluateBatch(themed.room, request.actions, 'visitor');
    if (!result.ok) throw new Error(result.code);
    const bed = result.room.furniture.find(
      (item) =>
        CATALOGUE.find((entry) => entry.id === item.catalogueId)?.category ===
        'bed',
    )!;
    expect(furnitureMaterialTargets(bed, 'bed').soft.surface).toBe('fabric');
  });
});

describe('solid manual rendering', () => {
  it('uses uniform plain pixels and omits decorative seams in both the live/export part owner', () => {
    const surfaces = createSurfaces();
    try {
      expect(
        [...(surfaces.smooth.image.data as Uint8Array)].every(
          (channel) => channel === 255,
        ),
      ).toBe(true);
      const part = {
        name: 'blanket',
        center: [0, 100, 0] as const,
        size: [1800, 40, 1800] as const,
        role: 'soft' as const,
      };
      expect(
        detailedParts(
          [part],
          { width: 2000, depth: 2000, height: 1000 },
          false,
        ).some((part) => part.name.includes('seam')),
      ).toBe(false);
      expect(
        detailedParts([part], { width: 2000, depth: 2000, height: 1000 }).some(
          (part) => part.name.includes('seam'),
        ),
      ).toBe(true);
      const scene = buildDesignScene(createManualRoom('partial'));
      try {
        const names: string[] = [];
        scene.root.traverse((node) => names.push(node.name));
        expect(names.some((name) => name.includes('-seam-'))).toBe(false);
      } finally {
        scene.dispose();
      }
    } finally {
      surfaces.dispose();
    }
  });
});
