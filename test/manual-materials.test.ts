import { describe, expect, it, vi } from 'vitest';
import type { createFurnitureMaterials } from '../apps/frontend/src/features/room-view/furniture-material.js';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { PUBLIC_LIMITS } from '@roomedy/contracts/policy';
import { roomSurface, FINISH_COLORS } from '@roomedy/contracts/surfaces';
import {
  furnitureMaterialRoles,
  furnitureMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import {
  findCatalogueEntry,
  roomMaterialOpportunities,
  completeQuickReplies,
  validateQuickReplies,
  resolveMedyRequest,
  evaluateBatch,
} from '@roomedy/spatial';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { AssistantController } from '../apps/frontend/src/features/assistant/controller.js';
import {
  guidanceChoices,
  guidanceMessage,
} from '../apps/frontend/src/features/assistant/guidance.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';

const without = (value: object, keys: readonly string[]) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );

describe('plain fresh manual rooms', () => {
  it.each(['empty', 'partial', 'furnished'] as const)(
    'starts %s plainly while preserving every physical fact and the authored fixtures',
    (condition) => {
      const authored = createRoomFixture(
          condition === 'furnished' ? 'sample' : condition,
        ),
        before = structuredClone(authored),
        room = createManualRoom(condition);
      expect(roomDocumentSchema.parse(room)).toEqual(room);
      expect(roomSurface(room.room, 'floor')).toEqual({
        color: FINISH_COLORS.ivory,
        texture: 'concrete',
      });
      expect(roomSurface(room.room, 'walls')).toEqual({
        color: FINISH_COLORS.ivory,
        texture: 'smooth',
      });
      expect(
        without(room.room, ['floorFinish', 'wallFinish', 'surfaces']),
      ).toEqual(
        without(authored.room, ['floorFinish', 'wallFinish', 'surfaces']),
      );
      for (const [index, item] of room.furniture.entries()) {
        expect(without(item, ['finish', 'materials'])).toEqual(
          without(authored.furniture[index]!, ['finish', 'materials']),
        );
        expect(item.finish).toBe('ivory');
        const entry = findCatalogueEntry(
            item.catalogueId,
            item.catalogueVersion,
          )!,
          roles = furnitureMaterialRoles(entry),
          targets = furnitureMaterialTargets(item, entry.category);
        if (roles.body)
          expect(targets.frame).toMatchObject({
            surface: 'smooth',
            bumpScale: 0,
            roughness: 0.94,
            metalness: 0,
          });
        if (roles.soft)
          expect(targets.soft).toMatchObject({
            surface: 'smooth',
            color: FINISH_COLORS.ivory,
            bumpScale: 0,
          });
      }
      expect(authored).toEqual(before);
      expect(
        createRoomFixture(condition === 'furnished' ? 'sample' : condition),
      ).toEqual(before);
    },
  );
  it('round-trips a plain room and never rewrites a loaded textured room', () => {
    for (const room of [
      createManualRoom('partial'),
      createRoomFixture('partial'),
    ]) {
      const session = new SessionController(room);
      try {
        const read = readProject(exportProject(session.getSnapshot())!);
        expect(read.ok).toBe(true);
        if (read.ok) expect(read.value.current).toEqual(room);
        expect(session.getSnapshot().workspace!.current).toEqual(room);
      } finally {
        session.dispose();
      }
    }
  });
  it('exports the plain frame and bedding through the same smooth material targets', () => {
    const room = createManualRoom('partial'),
      scene = buildDesignScene(room);
    try {
      const colors: string[] = [];
      scene.root.traverse((node) => {
        type Material = ReturnType<
          typeof createFurnitureMaterials
        >['materials']['frame'];
        const mesh = node as typeof node & {
          isMesh?: boolean;
          material: Material | Material[];
        };
        if (!mesh.isMesh) return;
        const values = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const material of values)
          if (
            material.map?.name === 'roomedy-smooth' &&
            material.metalness === 0
          )
            colors.push(material.color.getHexString());
      });
      expect(colors.length).toBeGreaterThan(5);
      expect(colors.every((color) => color === 'f3eee2')).toBe(true);
    } finally {
      scene.dispose();
    }
  });
});

describe('Medy recommends actual texture previews', () => {
  it('can explicitly return a textured bed to plain without changing its physical facts', () => {
    const room = createRoomFixture('partial'),
      request = resolveMedyRequest(
        room,
        'Make the bed frame material plain and upholstery plain',
        null,
      );
    expect(request?.kind).toBe('edits');
    if (request?.kind !== 'edits') throw new Error('expected-plain-edit');
    const result = evaluateBatch(room, request.actions, 'visitor');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    expect(result.room.furniture[0]!.materials).toEqual({
      body: 'plain',
      upholstery: 'plain',
    });
    expect(result.room.furniture[0]!.pose).toEqual(room.furniture[0]!.pose);
    expect(result.room.furniture[0]!.dimensions).toEqual(
      room.furniture[0]!.dimensions,
    );
  });
  it('offers three useful supported material upgrades and reserves one alongside other ideas', () => {
    const room = createManualRoom('partial'),
      options = roomMaterialOpportunities(room);
    expect(options.slice(0, 3).map((choice) => choice.label)).toEqual([
      'Try oak flooring',
      'Wood for the bed',
      'Wood for the wardrobe',
    ]);
    expect(
      guidanceChoices('finishes', room, false).map((choice) => choice.colors),
    ).toEqual([
      [FINISH_COLORS.ivory, FINISH_COLORS.oak],
      [FINISH_COLORS.ivory, FINISH_COLORS.oak],
      [FINISH_COLORS.ivory, FINISH_COLORS.oak],
    ]);
    for (const option of options) {
      const reply = resolveMedyRequest(room, option.request, null);
      expect(reply?.kind).toBe('edits');
      if (reply?.kind !== 'edits') throw new Error('expected-material-preview');
      expect(
        reply.actions.every((action) =>
          ['set-room-surface', 'set-furniture-materials', 'finish'].includes(
            action.type,
          ),
        ),
      ).toBe(true);
      expect(evaluateBatch(room, reply.actions, 'visitor').ok).toBe(true);
    }
    const replies = completeQuickReplies(room, {
      message: 'Try a calm colour scheme.',
      selectedId: null,
      choices: [
        {
          label: 'Calm colours',
          request: 'Preview Calm & focused room palette',
        },
      ],
    });
    expect(replies).toHaveLength(3);
    expect(replies[0]!.label).toBe('Calm colours');
    expect(replies.some((reply) => /need a desk/.test(reply.request))).toBe(
      true,
    );
    expect(replies.some((reply) => reply.request === options[0]!.request)).toBe(
      true,
    );
  });
  it('does not guess a piece when a category or current label is ambiguous', () => {
    const room = createManualRoom('partial');
    room.furniture.push({
      ...structuredClone(room.furniture[0]!),
      id: 'other-bed',
      label: 'Second bed',
    });
    expect(
      roomMaterialOpportunities(room).some((choice) =>
        /Wood for the bed/.test(choice.label),
      ),
    ).toBe(false);
  });
  it('permits appearance-only replies while rejecting combined movement and deletion', () => {
    const room = createManualRoom('partial'),
      options = roomMaterialOpportunities(room);
    expect(
      validateQuickReplies(
        room,
        options.slice(0, 3).map(({ label, request }) => ({ label, request })),
        null,
      ),
    ).toHaveLength(3);
    for (const request of [
      'Make the bed frame material wood; move the bed x 1000 mm',
      'Change floor texture to wood planks; delete the bed',
    ])
      expect(
        validateQuickReplies(
          room,
          [{ label: 'Unsafe combination', request }],
          null,
        ),
      ).toEqual([]);
  });
  it('keeps a plain-room welcome proactive without a provider request, then reviews/Apply/Undo the real material choices', async () => {
    const room = createManualRoom('partial'),
      session = new SessionController(room),
      transport = vi.fn<typeof fetch>(async (url) => {
        if (!String(url).endsWith('/config'))
          throw new Error('unexpected-provider-call');
        return Response.json({
          mode: 'live',
          capabilities: {
            manual: true,
            recognition: true,
            assistant: true,
            simulation: false,
          },
          limits: PUBLIC_LIMITS,
        });
      }),
      assistant = new AssistantController(session, { transport });
    try {
      await vi.waitFor(() => expect(assistant.getSnapshot().mode).toBe('live'));
      expect(guidanceMessage('welcome', room)).toMatch(/materials/);
      expect(guidanceChoices('welcome', room, false)).toHaveLength(3);
      assistant.chooseGuidance(0, 'materials');
      const message = assistant.getSnapshot().messages.at(-1)!;
      expect(message.text).toBe('Start with a finish you’d like to see.');
      assistant.chooseGuidance(message.id, 'material-0');
      await vi.waitFor(() =>
        expect(session.getSnapshot().candidate).not.toBeNull(),
      );
      expect(session.getSnapshot().workspace!.current).toEqual(room);
      expect(
        roomSurface(session.getSnapshot().candidate!.room.room, 'floor')
          .texture,
      ).toBe('planks');
      expect(assistant.apply().ok).toBe(true);
      expect(
        roomSurface(session.getSnapshot().workspace!.current.room, 'floor')
          .texture,
      ).toBe('planks');
      expect(assistant.undo().ok).toBe(true);
      expect(session.getSnapshot().workspace!.current.furniture).toEqual(
        room.furniture,
      );
      expect(
        roomSurface(session.getSnapshot().workspace!.current.room, 'floor')
          .texture,
      ).toBe('concrete');
      for (const label of ['Wood for the bed', 'Wood for the wardrobe']) {
        const current = session.getSnapshot().workspace!.current,
          option = roomMaterialOpportunities(current).find(
            (choice) => choice.label === label,
          )!;
        await assistant.submit(option.request);
        expect(session.getSnapshot().workspace!.current).toBe(current);
        expect(session.getSnapshot().candidate).not.toBeNull();
        expect(assistant.apply().ok).toBe(true);
        const target = label.includes('bed') ? 'bed_1' : 'wardrobe_1',
          changed = session
            .getSnapshot()
            .workspace!.current.furniture.find((piece) => piece.id === target)!;
        expect(changed.finish).toBe('oak');
        expect(changed.materials?.body).toBe('wood');
        expect(changed.pose).toEqual(
          current.furniture.find((piece) => piece.id === target)!.pose,
        );
        expect(assistant.undo().ok).toBe(true);
        expect(session.getSnapshot().workspace!.current.furniture).toEqual(
          room.furniture,
        );
      }
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      session.dispose();
    }
  });
});
