import { describe, expect, it, vi } from 'vitest';
import {
  BED_BEDDING_PARTS,
  bedroomFurnitureMaterials,
  BEDROOM_THEMES,
  furnitureAppearanceSwatches,
  furnitureMaterialTargets,
  furnitureMaterialsLabel,
} from '@roomedy/contracts/furniture-materials';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import {
  evaluateBatch,
  findCatalogueEntry,
  resolveMedyRequest,
} from '@roomedy/spatial';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { createSurfaces } from '../apps/frontend/src/features/room-view/surfaces.js';
import {
  createFurnitureMaterials,
  furniturePartRole,
} from '../apps/frontend/src/features/room-view/furniture-material.js';
import { buildDesignScene } from '../apps/frontend/src/features/design-export/scene.js';
import {
  bedroomExample,
  recognitionFixture,
} from '../apps/backend/src/recognition/fixtures.js';
import {
  createDraft,
  adoptHypothesis,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { photoFurnitureMaterials } from '../apps/frontend/src/features/room-intake/photo-appearance.js';
import { recognitionRequest } from '../apps/backend/src/recognition/recognize.js';
import { recognitionInput, identityIds } from './fixtures/operation.js';
import { assistantInput } from './fixtures/assistant.js';
import { createAssistantHandler } from '../apps/backend/src/assistant/assistant.js';
import { assistantFakeResponse } from '../apps/backend/src/assistant/fake.js';
import { createFakeProvider } from '../apps/backend/src/providers/provider.js';
import type { ProviderRequest } from '../apps/backend/src/providers/provider.js';
import { createRuntime } from '../apps/backend/src/runtime/create-runtime.js';
import { parseRuntimeConfig } from '../apps/backend/src/config/runtime-config.js';

const colours = {
  pillowColor: '#eddecf',
  sheetColor: '#789abc',
  coverColor: '#435e78',
};
const bedOf = (room: ReturnType<typeof createManualRoom>) =>
  room.furniture.find((p) => p.catalogueId === 'procedural-bed')!;

describe('independent bed bedding', () => {
  it('starts new manual bedding warmly and plainly, with three independently resolved parts', () => {
    const bed = bedOf(createManualRoom('partial'));
    const t = furnitureMaterialTargets(bed, 'bed');
    expect([t.pillow.color, t.sheet.color, t.blanket.color]).toEqual([
      '#f4f0e8',
      '#e8ddca',
      '#c4ac92',
    ]);
    for (const part of BED_BEDDING_PARTS)
      expect(t[part.target]).toMatchObject({
        surface: 'smooth',
        bumpScale: 0,
        metalness: 0,
      });
  });
  it('preserves legacy soft/cover appearance and nullable inheritance without rewriting a document', () => {
    const materials = {
      softColor: '#789abc',
      softPattern: 'stripes' as const,
      coverColor: '#435e78',
    };
    const original = JSON.stringify(materials);
    for (const overrides of [
      {},
      {
        pillowColor: null,
        sheetColor: null,
        pillowPattern: null,
        sheetPattern: null,
      },
    ]) {
      const t = furnitureMaterialTargets(
        { finish: 'oak', materials: { ...materials, ...overrides } },
        'bed',
      );
      expect(t.pillow.color).toBe('#789abc');
      expect(t.sheet.color).toBe('#789abc');
      expect(t.pillow.surface).toBe('stripes');
      expect(t.sheet.surface).toBe('stripes');
      expect(t.blanket.color).toBe('#435e78');
    }
    expect(JSON.stringify(materials)).toBe(original);
  });
  it.each([
    ['Make the pillows navy', 'pillowColor', '#283e56'],
    ['Make the bed sheets white', 'sheetColor', '#ffffff'],
    ['Paint the bed duvet #435e78', 'coverColor', '#435e78'],
    ['Make the pillow covers #eddecf', 'pillowColor', '#eddecf'],
  ])('compiles %s to just the requested part', (text, key, colour) => {
    const room = createManualRoom('partial'),
      bed = bedOf(room);
    const before = structuredClone(bed.materials);
    const request = resolveMedyRequest(room, text, null);
    if (request?.kind !== 'edits') throw new Error(JSON.stringify(request));
    expect(request.actions).toEqual([
      {
        type: 'set-furniture-materials',
        id: bed.id,
        materials: { [key]: colour },
      },
    ]);
    const result = evaluateBatch(room, request.actions, 'visitor');
    if (!result.ok) throw new Error(result.code);
    expect(bedOf(result.room).materials).toEqual({ ...before, [key]: colour });
    expect(bedOf(result.room).pose).toEqual(bed.pose);
    expect(bed.materials).toEqual(before);
  });
  it('reviews three part changes atomically, preserves Cancel, round-trips and undoes one Apply', () => {
    const room = createManualRoom('partial'),
      c = new SessionController(room);
    try {
      const request = resolveMedyRequest(
        room,
        'Make the bed pillows #eddecf; make the bed sheets #789abc; make the bed cover #435e78',
        null,
      );
      if (request?.kind !== 'edits') throw new Error(JSON.stringify(request));
      expect(request.actions).toHaveLength(3);
      expect(c.prepareVisitorPreview(request.actions, request.label).ok).toBe(
        true,
      );
      expect(c.getSnapshot().workspace!.current).toEqual(room);
      expect(bedOf(c.getSnapshot().candidate!.room).materials).toMatchObject(
        colours,
      );
      c.cancelPreview();
      expect(c.getSnapshot().workspace!.current).toEqual(room);
      expect(c.prepareVisitorPreview(request.actions, request.label).ok).toBe(
        true,
      );
      expect(c.applyVisitorPreview().ok).toBe(true);
      const loaded = readProject(exportProject(c.getSnapshot())!);
      if (!loaded.ok) throw new Error(loaded.code);
      expect(bedOf(loaded.value.current).materials).toMatchObject(colours);
      expect(
        furnitureMaterialsLabel(bedOf(loaded.value.current).materials!),
      ).toMatch(
        /pillows colour #eddecf.*sheets colour #789abc.*cover colour #435e78/,
      );
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().workspace!.current.furniture).toEqual(
        room.furniture,
      );
    } finally {
      c.dispose();
    }
  });
  it('coordinates broad bedding and explicit themes, but refuses ambiguous part lists and non-bed roles', () => {
    const room = createManualRoom('partial'),
      bed = bedOf(room);
    const request = resolveMedyRequest(
      room,
      'Change the bed bedding colour to navy',
      null,
    );
    if (request?.kind !== 'edits') throw new Error(JSON.stringify(request));
    const result = evaluateBatch(room, request.actions, 'visitor');
    if (!result.ok) throw new Error(result.code);
    expect(bedOf(result.room).materials).toMatchObject({
      pillowColor: '#283e56',
      sheetColor: '#283e56',
      coverColor: '#283e56',
    });
    const theme = BEDROOM_THEMES[0]!;
    expect(
      bedroomFurnitureMaterials(
        theme,
        findCatalogueEntry(bed.catalogueId, bed.catalogueVersion)!,
      ),
    ).toMatchObject({
      pillowColor: theme.softColor,
      sheetColor: theme.softColor,
      coverColor: theme.softColor,
    });
    expect(
      resolveMedyRequest(room, 'Make the pillows and sheets navy', null)?.kind,
    ).toBe('reply');
    const textured = structuredClone(room);
    bedOf(textured).materials = {
      ...bed.materials,
      pillowPattern: 'checker',
      sheetPattern: 'stripes',
      coverPattern: 'fabric',
    };
    const plain = resolveMedyRequest(
      textured,
      'Make the bed bedding material plain',
      null,
    );
    if (plain?.kind !== 'edits') throw new Error(JSON.stringify(plain));
    const flattened = evaluateBatch(textured, plain.actions, 'visitor');
    if (!flattened.ok) throw new Error(flattened.code);
    const flatTargets = furnitureMaterialTargets(bedOf(flattened.room), 'bed');
    expect(
      BED_BEDDING_PARTS.map((part) => flatTargets[part.target].surface),
    ).toEqual(['smooth', 'smooth', 'smooth']);
    for (const part of BED_BEDDING_PARTS) {
      expect(
        evaluateBatch(
          room,
          [
            {
              type: 'set-furniture-materials',
              id: room.furniture.find((p) => p.id !== bed.id)!.id,
              materials: { [part.color]: '#eddecf' },
            },
          ],
          'visitor',
        ).ok,
      ).toBe(false);
    }
    const after = {
      ...bed,
      materials: { ...bed.materials, pillowColor: '#112233' },
    };
    expect(furnitureAppearanceSwatches(bed, after, 'bed')).toMatchObject({
      role: 'pillow',
      before: '#f4f0e8',
      after: '#112233',
    });
  });
  it('captures three arbitrary photo colours per source and leaves conflicts/hidden parts unassigned', () => {
    const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
    const observed = raw.observations.find(
      (o) => o.catalogueId === 'procedural-bed',
    )!;
    observed.appearance = {
      ...observed.appearance!,
      ...colours,
      pillowPattern: 'smooth',
      sheetPattern: 'stripes',
      coverPattern: 'fabric',
    };
    const parsed = parseDraftHypothesis(raw, ['photo'], []);
    expect(parsed).not.toBeNull();
    const draft = createDraft('partial', 'photo-room');
    draft.sources = [{ id: 'photo', purpose: 'room', available: true }];
    const adopted = adoptHypothesis(draft, parsed!, identityIds('entity'));
    if (!adopted.ok) throw new Error(adopted.message);
    expect(bedOf(adopted.draft.room).materials).toMatchObject({
      ...colours,
      pillowPattern: 'smooth',
      sheetPattern: 'stripes',
      coverPattern: 'fabric',
    });
    const conflicting = structuredClone(observed);
    conflicting.appearance!.pillowColor = '#123456';
    const merged = photoFurnitureMaterials(
      [observed, conflicting],
      'procedural-bed',
    )!;
    expect(merged.pillowColor).toBeUndefined();
    expect(merged.sheetColor).toBe(colours.sheetColor);
    expect(merged.coverColor).toBe(colours.coverColor);
    conflicting.visibility = 'occluded';
    expect(
      photoFurnitureMaterials([observed, conflicting], 'procedural-bed')!
        .pillowColor,
    ).toBe(colours.pillowColor);
    const hidden = structuredClone(observed);
    hidden.appearance!.sheetColor = null;
    expect(
      photoFurnitureMaterials([hidden], 'procedural-bed')!.sheetColor,
    ).toBeUndefined();
    const wrongRole = recognitionFixture('unknown-hinge', ['photo']);
    const badDoor = wrongRole.observations.find((o) => o.kind === 'door')!;
    badDoor.appearance = { ...badDoor.appearance!, pillowColor: '#eddecf' };
    expect(parseDraftHypothesis(wrongRole, ['photo'], [])).toBeNull();
    const captured = structuredClone(adopted.draft);
    bedOf(captured.room).materials!.pillowColor = '#997755';
    const repeat = adoptHypothesis(captured, raw, identityIds('repeat'));
    if (!repeat.ok) throw new Error(repeat.message);
    expect(bedOf(repeat.draft.room).materials!.pillowColor).toBe('#997755');
  });
  it('uses the same distinct material slots for live transitions and exported geometry', () => {
    const room = createManualRoom('partial'),
      bed = bedOf(room);
    bed.materials = { ...bed.materials, ...colours };
    const surfaces = createSurfaces(),
      t = furnitureMaterialTargets(bed, 'bed'),
      owner = createFurnitureMaterials(t, surfaces);
    const scene = buildDesignScene(room);
    try {
      const seen: Record<string, string[]> = {
        pillow: [],
        sheet: [],
        blanket: [],
      };
      scene.root.traverse((node) => {
        const mesh = node as typeof node & {
          isMesh?: boolean;
          material?: { color: { getHexString(): string } };
        };
        if (!mesh.isMesh || !mesh.material) return;
        const part = furniturePartRole({ name: node.name, role: 'soft' });
        if (part in seen && !node.name.includes('seam'))
          seen[part]!.push(`#${mesh.material.color.getHexString()}`);
      });
      expect(seen).toEqual({
        pillow: [colours.pillowColor, colours.pillowColor],
        sheet: [colours.sheetColor],
        blanket: [colours.coverColor],
      });
      expect(new Set(Object.values(owner.materials)).size).toBe(7);
      owner.choose(
        furnitureMaterialTargets(
          { ...bed, materials: { ...bed.materials, sheetColor: '#bbccdd' } },
          'bed',
        ),
      );
      for (let i = 0; i < 140; i++) owner.advance(0.02);
      expect(owner.materials.sheet.color.getHexString()).toBe('bbccdd');
      expect(owner.materials.pillow.color.getHexString()).toBe(
        colours.pillowColor.slice(1),
      );
      expect(owner.materials.blanket.color.getHexString()).toBe(
        colours.coverColor.slice(1),
      );
      const other = createFurnitureMaterials(
        furnitureMaterialTargets(bed, 'chair'),
        surfaces,
      );
      expect(new Set(Object.values(other.materials)).size).toBe(5);
      other.dispose();
    } finally {
      owner.dispose();
      scene.dispose();
      surfaces.dispose();
    }
  });
  it('exposes separate parts in actual photo schema/context and Medy advice without a live provider', async () => {
    const recognition = recognitionRequest(await recognitionInput(), []);
    for (const key of [
      'pillowColor',
      'pillowPattern',
      'sheetColor',
      'sheetPattern',
      'coverColor',
    ])
      expect(JSON.stringify(recognition.format.schema)).toContain(`"${key}"`);
    const requests: ProviderRequest[] = [],
      ids = identityIds();
    const runtime = createRuntime(
      parseRuntimeConfig({ ROOMEDY_BRIDGE_SECRET: 'synthetic-bridge' }),
      {
        now: Date.now,
        nextId: ids,
        log: vi.fn(),
        provider: createFakeProvider(async (request, signal) => {
          requests.push(request);
          return assistantFakeResponse(request, signal);
        }),
        handlers: { assistant: createAssistantHandler(vi.fn(), ids) },
      },
    );
    try {
      const input = assistantInput(
        createManualRoom('partial'),
        'Can we talk about colours before changing anything?',
      );
      const grant = await runtime.operations.grant(
        input,
        null,
        new AbortController().signal,
      );
      if (!('kind' in grant) || grant.kind !== 'granted')
        throw new Error(JSON.stringify(grant));
      const result = await runtime.operations.run(
        input,
        grant.grant,
        new AbortController().signal,
      );
      expect('kind' in result ? result.kind : 'error').toBe('completed');
      expect(requests).toHaveLength(1);
      expect(JSON.stringify(requests[0]!.input)).toContain('bedBeddingParts');
      expect(JSON.stringify(requests[0]!.input)).toContain('pillowColor');
      expect(JSON.stringify(requests[0]!.input)).toContain('sheetColor');
    } finally {
      runtime.operations.close();
    }
  });
});
