import { describe, expect, it } from 'vitest';
import { featureSchema, roomDocumentSchema } from '@roomedy/contracts/room';
import {
  WINDOW_SIZE_PRESETS,
  BALCONY_SIZE_PRESETS,
  openingSizePresets,
  applyOpeningSizePreset,
  evaluateBatch,
  resolveMedyRequest,
  featureLabel,
} from '@roomedy/spatial';
import {
  commandRoom,
  door,
  windowFeature,
  known,
  unknown,
} from './fixtures/command-room.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import {
  exportProject,
  readProject,
} from '../apps/frontend/src/features/session/project.js';
import { planOpeningLabel } from '../apps/frontend/src/features/plan-view/adapter.js';
import {
  balconyDoorPanels,
  balconyPanelMotion,
} from '../apps/frontend/src/features/room-view/opening-parts.js';
import { featureOpening } from '../apps/frontend/src/features/room-view/articulation.js';

const balcony = () => ({
  ...door('balcony'),
  purpose: 'balcony' as const,
  mechanism: 'sliding' as const,
  width: known(1800),
  height: known(2100),
});
const actions = (room: ReturnType<typeof commandRoom>, text: string) => {
  const request = resolveMedyRequest(room, text, null);
  expect(request?.kind).toBe('edits');
  if (request?.kind !== 'edits') throw new Error('expected-edits');
  return request.actions;
};

describe('opening planning sizes and paired balcony doors', () => {
  it('accepts old doors and the selected balcony type, while rejecting unknown purpose values', () => {
    expect(featureSchema.safeParse(door()).success).toBe(true);
    expect(featureSchema.safeParse(balcony()).success).toBe(true);
    expect(
      featureSchema.safeParse({ ...balcony(), purpose: 'terrace' }).success,
    ).toBe(false);
    expect(openingSizePresets(door())).toEqual([]);
    expect(openingSizePresets({ ...door(), purpose: 'bathroom' })).toEqual([]);
    expect(featureLabel(balcony())).toBe('Balcony doors');
  });
  for (const initial of [windowFeature(), balcony()])
    it.each(openingSizePresets(initial))(
      `applies ${initial.kind} $id as one size-only planning estimate`,
      (preset) => {
        const before = structuredClone(initial),
          next = applyOpeningSizePreset(initial, preset.id)!;
        expect(next.width.value).toBe(preset.width);
        expect(next.height.value).toBe(preset.height);
        for (const axis of ['width', 'height'] as const)
          expect(next[axis]).toEqual(
            before[axis].value === preset[axis]
              ? before[axis]
              : {
                  value: preset[axis],
                  status: 'estimated',
                  sourceId: 'visitor-size-preset',
                },
          );
        expect({ ...next, width: before.width, height: before.height }).toEqual(
          before,
        );
        expect(initial).toEqual(before);
        expect(featureSchema.safeParse(next).success).toBe(true);
        expect(applyOpeningSizePreset(initial, 'untrusted')).toBeNull();
      },
    );
  it('preserves unchanged-axis evidence and unknown unrelated measurements', () => {
    const feature = windowFeature();
    feature.width = known(1200);
    feature.height = unknown();
    feature.sill = unknown();
    const next = applyOpeningSizePreset(feature, 'medium')!;
    expect(next.width).toEqual(feature.width);
    expect(next.height.status).toBe('estimated');
    expect(next.sill).toEqual(unknown());
  });
  it('changes both dimensions atomically and restores exact facts with one Undo', () => {
    const feature = windowFeature(),
      room = commandRoom([], [feature]),
      controller = new SessionController(room);
    try {
      const next = applyOpeningSizePreset(feature, 'wide')!;
      expect(
        controller.dispatch(
          [{ type: 'update-feature', id: feature.id, feature: next }],
          'Resize window',
        ).ok,
      ).toBe(true);
      expect(
        controller.getSnapshot().workspace!.current.room.features[0],
      ).toEqual(next);
      expect(controller.undo().ok).toBe(true);
      expect(controller.getSnapshot().workspace!.current.room.features).toEqual(
        room.room.features,
      );
    } finally {
      controller.dispose();
    }
  });
  it('keeps balcony doors protected and round-trips their semantic type without an exterior room', () => {
    const room = commandRoom([], [balcony()]),
      controller = new SessionController(room);
    try {
      expect(
        evaluateBatch(
          room,
          [{ type: 'remove-feature', id: 'balcony' }],
          'visitor',
        ),
      ).toMatchObject({ ok: false, code: 'protected-door' });
      const saved = exportProject(controller.getSnapshot())!,
        read = readProject(saved);
      expect(read.ok).toBe(true);
      if (read.ok)
        expect(read.value.current.room.features[0]).toEqual(balcony());
      expect(roomDocumentSchema.safeParse(room).success).toBe(true);
      expect(planOpeningLabel(room, balcony())?.lines.join(' ')).toBe(
        'Balcony Doors',
      );
    } finally {
      controller.dispose();
    }
  });
  it.each([
    'balcony doors',
    'patio doors',
    'double glass doors',
    'window doors',
  ])(
    'compiles an explicit addition of %s through the existing command authority',
    (name) => {
      const room = commandRoom([], []),
        batch = actions(room, `add ${name} on the east wall`),
        first = batch[0]!;
      expect(first.type).toBe('add-feature');
      if (first.type !== 'add-feature') throw new Error('fixture');
      expect(first.feature).toMatchObject({
        kind: 'door',
        purpose: 'balcony',
        wall: 'east',
        mechanism: 'sliding',
        width: { value: 1800, status: 'estimated' },
        height: { value: 2100, status: 'estimated' },
        sill: { value: 0 },
      });
      expect(evaluateBatch(room, batch, 'visitor').ok).toBe(true);
      expect(room.room.features).toEqual([]);
    },
  );
  it.each([
    ['use the wide window size preset', 'window_1', 'wide'],
    ['use standard balcony doors size preset', 'balcony', 'standard'],
    ['make the patio doors tall', 'balcony', 'tall'],
  ])('shares manual and Medy preset semantics: %s', (text, id, preset) => {
    const room = commandRoom([], [windowFeature(), door(), balcony()]),
      before = structuredClone(room),
      batch = actions(room, text);
    expect(batch).toEqual([
      {
        type: 'update-feature',
        id,
        feature: applyOpeningSizePreset(
          room.room.features.find((f) => f.id === id)!,
          preset,
        )!,
      },
    ]);
    expect(evaluateBatch(room, batch, 'visitor').ok).toBe(true);
    expect(room).toEqual(before);
  });
  it('does not turn ambiguous, negated or conflicting preset requests into partial changes', () => {
    const room = commandRoom([], [windowFeature(), door(), balcony()]);
    for (const text of [
      'do not add balcony doors',
      'use wide door size preset',
      'set window size preset wide and width to 600 mm',
      'set bathroom door size to standard',
      'set the window size preset small wide',
    ])
      expect(resolveMedyRequest(room, text, null)?.kind).not.toBe('edits');
  });
  it.each([
    ['make the window 180 cm wide', 'window_1', 'width', 1800],
    ['make the balcony doors 240 cm tall', 'balcony', 'height', 2400],
  ] as const)(
    'keeps numeric adjectives as exact edits: %s',
    (text, id, axis, value) => {
      const room = commandRoom([], [windowFeature(), balcony()]),
        batch = actions(room, text),
        first = batch[0]!;
      expect(first.type).toBe('update-feature');
      if (first.type !== 'update-feature') throw new Error('fixture');
      expect(first.id).toBe(id);
      expect(first.feature[axis]).toMatchObject({ value, status: 'confirmed' });
    },
  );
  it('distinguishes an opening identity from changing its destination', () => {
    const room = commandRoom([], [door(), windowFeature()]);
    expect(actions(room, 'set the door destination to balcony')).toEqual([
      {
        type: 'update-feature',
        id: 'door_1',
        feature: { ...door(), purpose: 'balcony' },
      },
    ]);
    const two = commandRoom([], [door(), balcony()]);
    expect(
      resolveMedyRequest(two, 'set the door destination to balcony', null)
        ?.kind,
    ).not.toBe('edits');
    expect(
      resolveMedyRequest(two, 'delete the balcony doors', null)?.kind,
    ).toBe('reply');
  });
  it.each(BALCONY_SIZE_PRESETS)(
    'keeps two closed framed glass panels and bounded slide travel for $id',
    (preset) => {
      const feature = {
          ...balcony(),
          width: known(preset.width),
          height: known(preset.height),
        },
        w = preset.width / 1000,
        h = preset.height / 1000,
        panels = balconyDoorPanels(w, h, 0.08, true);
      expect(panels).toHaveLength(2);
      expect(
        panels.flatMap((p) => p.parts).filter((p) => p.kind === 'glass'),
      ).toHaveLength(2);
      for (const part of panels.flatMap((p) => p.parts)) {
        expect(part.size.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
        expect(Math.abs(part.center[0]) + part.size[0] / 2).toBeLessThanOrEqual(
          w / 2 + 0.000001,
        );
        expect(Math.abs(part.center[1]) + part.size[1] / 2).toBeLessThanOrEqual(
          h / 2 + 0.000001,
        );
      }
      const left = panels[0]!.parts.find((p) => p.kind === 'glass')!,
        right = panels[1]!.parts.find((p) => p.kind === 'glass')!,
        motion = balconyPanelMotion(feature, w, 0.08, 0)!;
      expect(left.center[0] + motion.travel[0]).toBeCloseTo(right.center[0], 6);
      expect(left.center[2] - right.center[2]).toBeGreaterThan(0.035);
      expect(balconyPanelMotion(feature, w, 0.08, 1)).toBeNull();
      expect(featureOpening(feature)?.openLabel).toBe('Open doors');
    },
  );
  it.each(['inward', 'outward'] as const)(
    'uses opposite panel hinges for %s while retaining readiness checks',
    (mechanism) => {
      const feature = { ...balcony(), mechanism },
        left = balconyPanelMotion(feature, 1.8, 0.08, 0)!,
        right = balconyPanelMotion(feature, 1.8, 0.08, 1)!;
      expect(left.pivot[0]).toBe(-right.pivot[0]);
      expect(left.turn).toBe(-right.turn);
      expect(Math.sign(left.turn)).toBe(mechanism === 'inward' ? -1 : 1);
      expect(
        featureOpening({
          ...feature,
          hinge: 'unknown',
          hingeProvenance: { status: 'unknown', sourceId: null },
        }),
      ).toBeNull();
    },
  );
  it('keeps registry entries bounded and immutable', () => {
    for (const list of [WINDOW_SIZE_PRESETS, BALCONY_SIZE_PRESETS]) {
      expect(list).toHaveLength(4);
      expect(Object.isFrozen(list)).toBe(true);
      expect(
        list.every(
          (p) =>
            Object.isFrozen(p) &&
            p.width > 0 &&
            p.height > 0 &&
            Number.isInteger(p.width) &&
            Number.isInteger(p.height),
        ),
      ).toBe(true);
    }
  });
});
