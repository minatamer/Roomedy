import { it, expect } from 'vitest';
import type { VisitorAction } from '@roomedy/contracts/commands';
import {
  proposalActionSchema,
  visitorActionSchema,
} from '@roomedy/contracts/commands';
import {
  CATALOGUE,
  evaluateBatch,
  findCatalogueEntry,
  supportsDimensions,
  applyCommand,
  createCommandWorkspace,
  undoCommand,
} from '@roomedy/spatial';
import { VERSIONS } from '@roomedy/contracts/policy';
import {
  commandRoom,
  piece,
  envelope,
  unknown,
} from './fixtures/command-room.js';
import {
  furnitureSizePresets,
  parseSizeInput,
  selectSizePreset,
  sizeInputValues,
} from '../apps/frontend/src/features/room-editor/size-presets.js';
import {
  createDraft,
  correctDraft,
  adoptHypothesis,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { bedroomExample } from '../apps/backend/src/recognition/fixtures.js';
const entry = (id: string) => findCatalogueEntry(id, VERSIONS.catalogue)!;
const bed = () =>
  piece('bed', 4000, 4000, {
    catalogueId: 'procedural-bed',
    width: 1600,
    depth: 2100,
    height: 850,
  });
const estimate = (
  width: number,
  depth = 2100,
  height?: number,
): VisitorAction => ({
  type: 'set-size-estimate',
  id: 'bed',
  width,
  depth,
  ...(height === undefined ? {} : { height }),
});
it('defines exact regional mattress conversions and a visible independent planning frame allowance', () => {
  const sizes = furnitureSizePresets(entry('procedural-bed'));
  expect(sizes).toHaveLength(14);
  expect(sizes.find((p) => p.id === 'metric-single')).toMatchObject({
    width: 1000,
    depth: 2100,
    mattress: '90 × 200 cm',
  });
  expect(sizes.find((p) => p.id === 'metric-queen')).toMatchObject({
    width: 1700,
    depth: 2100,
    mattress: '160 × 200 cm',
  });
  expect(sizes.find((p) => p.id === 'uk-king')).toMatchObject({
    width: 1600,
    depth: 2100,
  });
  expect(sizes.find((p) => p.id === 'us-queen')).toMatchObject({
    width: 1624,
    depth: 2132,
    mattress: '60 × 80 in',
  });
  expect(sizes.find((p) => p.id === 'us-king')).toMatchObject({
    width: 2030,
    depth: 2132,
  });
  expect(sizes.find((p) => p.id === 'us-california-king')).toMatchObject({
    width: 1929,
    depth: 2234,
  });
  expect(new Set(sizes.map((p) => p.id)).size).toBe(sizes.length);
});
it('offers only supported adjustable sizes and never stretches fixed variants', () => {
  for (const e of CATALOGUE)
    for (const p of furnitureSizePresets(e))
      expect(
        supportsDimensions(e, {
          width: p.width,
          depth: p.depth,
          height: p.height ?? e.size.height.default,
        }),
      ).toBe(true);
  expect(furnitureSizePresets(entry('chair-desk-fixed'))).toEqual([]);
  expect(furnitureSizePresets(entry('bedside-storage-fixed'))).toEqual([]);
  expect(furnitureSizePresets(entry('procedural-chair'))).toEqual([]);
  expect(
    furnitureSizePresets(entry('wardrobe-sliding')).map((p) => p.id),
  ).toEqual(['wardrobe-double', 'wardrobe-wide']);
});
it('preserves untouched height when selecting bed/desk and fills shelf height only when supplied', () => {
  const initial = { preset: '', width: '800', depth: '350', height: '1200' };
  const b = selectSizePreset(
    initial,
    furnitureSizePresets(entry('procedural-bed'))[0],
  );
  expect(b.height).toBeUndefined();
  const s = selectSizePreset(
    initial,
    furnitureSizePresets(entry('procedural-storage')).find(
      (p) => p.id === 'shelf-low',
    ),
  );
  expect(s.height).toBe('1060');
  expect(selectSizePreset(s, undefined)).toEqual({ ...s, preset: '' });
  expect(sizeInputValues({ ...bed().dimensions, height: unknown() })).toEqual({
    preset: '',
    width: '1600',
    depth: '2100',
  });
});
it.each(['', '1.5', 'NaN', 'Infinity', '10001'])(
  'rejects invalid custom width %s with units and field target',
  (width) => {
    expect(
      parseSizeInput(
        { preset: '', width, depth: '2100' },
        entry('procedural-bed'),
        true,
      ),
    ).toMatchObject({
      ok: false,
      field: 'width',
      message: expect.stringContaining('mm'),
    });
  },
);
it('keeps proposed ranges strict and permits bounded owned estimates outside model eligibility', () => {
  expect(
    parseSizeInput(
      { preset: '', width: '3000', depth: '2100' },
      entry('procedural-bed'),
      false,
    ).ok,
  ).toBe(false);
  expect(
    parseSizeInput(
      { preset: '', width: '3000', depth: '2100' },
      entry('procedural-bed'),
      true,
    ),
  ).toEqual({ ok: true, size: { width: 3000, depth: 2100 } });
});
it('keeps the new estimate action visitor-only and bounded', () => {
  expect(visitorActionSchema.safeParse(estimate(1700)).success).toBe(true);
  expect(proposalActionSchema.safeParse(estimate(1700)).success).toBe(false);
  expect(
    evaluateBatch(commandRoom([bed()]), [estimate(1700)], 'assistant'),
  ).toEqual({ ok: false, code: 'invalid-input' });
  expect(
    visitorActionSchema.safeParse({ ...estimate(1700), width: 10001 }).success,
  ).toBe(false);
});
it('respects starting size locks including same-batch unlock, without changing any semantics', () => {
  const b = bed();
  b.locks.dimensions = true;
  const room = commandRoom([b]);
  const before = structuredClone(room);
  expect(evaluateBatch(room, [estimate(1700)], 'visitor')).toMatchObject({
    ok: false,
    code: 'locked',
  });
  expect(
    evaluateBatch(
      room,
      [
        {
          type: 'set-locks',
          id: b.id,
          locks: { ...b.locks, dimensions: false },
        },
        estimate(1700),
      ],
      'visitor',
    ),
  ).toMatchObject({ ok: false, code: 'locked' });
  expect(room).toEqual(before);
});
it('applies an explicit visitor size choice through protection while retaining locks, untouched evidence and final geometry checks', () => {
  const b = bed();
  b.locks = { position: true, rotation: true, dimensions: true };
  const original = commandRoom([b]);
  const action = {
    type: 'set-size-estimate',
    id: b.id,
    width: 1700,
    depth: 2100,
    overrideSizeLock: true,
  } as const;
  const workspace = createCommandWorkspace(original, {
    workspaceId: 'explicit-size',
    generation: 0,
  });
  const result = applyCommand(
    workspace,
    envelope(workspace, [action]),
    'visitor',
  );
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const changed = result.workspace.current.furniture[0]!;
  expect(changed.locks).toEqual(b.locks);
  expect(changed.pose).toEqual(b.pose);
  expect(changed.dimensions.width).toEqual({
    value: 1700,
    status: 'estimated',
    sourceId: 'visitor-estimate',
  });
  expect(changed.dimensions.depth).toEqual(b.dimensions.depth);
  expect(changed.dimensions.height).toEqual(b.dimensions.height);
  expect(result.workspace.history.entries).toHaveLength(1);
  const undo = undoCommand(result.workspace);
  expect(undo.ok).toBe(true);
  if (undo.ok)
    expect(undo.workspace.current.furniture).toEqual(original.furniture);
  expect(evaluateBatch(original, [action], 'assistant')).toMatchObject({
    ok: false,
    code: 'invalid-input',
  });
  expect(evaluateBatch(original, [action], 'authored-sample')).toMatchObject({
    ok: false,
    code: 'invalid-input',
  });
  expect(
    visitorActionSchema.safeParse({ ...action, overrideSizeLock: false })
      .success,
  ).toBe(false);
  b.pose.centerX = 800;
  expect(
    evaluateBatch(commandRoom([b]), [{ ...action, width: 1900 }], 'visitor'),
  ).toMatchObject({ ok: false, code: 'new-conflict' });
});
it('matches preset identity only when the actual outer dimensions agree, without confusing wardrobe height variants', () => {
  const sizes = furnitureSizePresets(entry('procedural-bed'));
  expect(sizeInputValues(bed().dimensions, sizes).preset).toBe('uk-king');
  const custom = bed();
  custom.dimensions.width.value = 1650;
  expect(sizeInputValues(custom.dimensions, sizes).preset).toBe('');
  const wardrobe = piece('wardrobe', 4000, 4000, {
    width: 1500,
    depth: 600,
    height: 2010,
  });
  const wardrobeSizes = furnitureSizePresets(entry('wardrobe-hinged'));
  expect(sizeInputValues(wardrobe.dimensions, wardrobeSizes).preset).toBe(
    'wardrobe-double',
  );
  wardrobe.dimensions.height.value = 2200;
  expect(sizeInputValues(wardrobe.dimensions, wardrobeSizes).preset).toBe('');
});
it('changes only edited axes to estimated and preserves height, pose, ownership, locks and baseline through one Undo', () => {
  const original = commandRoom([bed()]);
  const w = createCommandWorkspace(original, {
    workspaceId: 'size-test',
    generation: 0,
  });
  const result = applyCommand(w, envelope(w, [estimate(1700)]), 'visitor');
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const b = result.workspace.current.furniture[0]!;
  expect(b.dimensions.width).toEqual({
    value: 1700,
    status: 'estimated',
    sourceId: 'visitor-estimate',
  });
  expect(b.dimensions.depth).toEqual(original.furniture[0]!.dimensions.depth);
  expect(b.dimensions.height).toEqual(original.furniture[0]!.dimensions.height);
  expect({ ...b, dimensions: original.furniture[0]!.dimensions }).toEqual(
    original.furniture[0],
  );
  expect(result.workspace.history.entries).toHaveLength(1);
  expect(result.workspace.baseline).toEqual(w.baseline);
  const undo = undoCommand(result.workspace);
  expect(undo.ok).toBe(true);
  if (undo.ok)
    expect(undo.workspace.current.furniture).toEqual(original.furniture);
});
it('keeps omitted unknown height unknown, supplied height estimated and repeated dimensions a no-op', () => {
  const b = bed();
  b.dimensions.height = unknown();
  const result = evaluateBatch(commandRoom([b]), [estimate(1700)], 'visitor');
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.room.furniture[0]!.dimensions.height).toEqual(unknown());
  const next = evaluateBatch(result.room, [estimate(1700)], 'visitor');
  expect(next).toMatchObject({ ok: true, changed: false });
  const height = evaluateBatch(
    result.room,
    [estimate(1700, 2100, 900)],
    'visitor',
  );
  expect(height.ok).toBe(true);
  if (height.ok)
    expect(height.room.furniture[0]!.dimensions.height).toEqual({
      value: 900,
      status: 'estimated',
      sourceId: 'visitor-estimate',
    });
});
it('enforces containment and solid conflicts for planning estimates rather than treating them as measured corrections', () => {
  const b = bed();
  b.pose.centerX = 800;
  expect(
    evaluateBatch(commandRoom([b]), [estimate(1900)], 'visitor'),
  ).toMatchObject({ ok: false, code: 'new-conflict' });
  const other = piece('other', 5000, 4000, { width: 200, depth: 1000 });
  expect(
    evaluateBatch(commandRoom([bed(), other]), [estimate(2200)], 'visitor'),
  ).toMatchObject({ ok: false, code: 'new-conflict' });
});
it('rejects unsupported proposed fixed and large variants while preserving the old room', () => {
  const b = bed();
  b.ownership = 'proposed';
  expect(
    evaluateBatch(commandRoom([b]), [estimate(3000)], 'visitor'),
  ).toMatchObject({ ok: false, code: 'unsupported-variant' });
  const fixed = piece('bed', 4000, 4000, {
    catalogueId: 'bedside-storage-fixed',
    width: 540,
    depth: 440,
    height: 470,
  });
  fixed.ownership = 'proposed';
  expect(
    evaluateBatch(commandRoom([fixed]), [estimate(600, 440)], 'visitor'),
  ).toMatchObject({ ok: false, code: 'unsupported-variant' });
});
it('retains deliberate review size axes after a fresh photo hypothesis and through undo source authority', () => {
  const d = createDraft('furnished', 'draft');
  d.room = commandRoom([bed()]);
  d.sources = [{ id: 'photo', purpose: 'room', available: true }];
  const corrected = correctDraft(d, [estimate(1700)]);
  expect(corrected.ok).toBe(true);
  if (!corrected.ok) return;
  expect(corrected.draft.reviewed).toContain('bed:width');
  expect(corrected.draft.reviewed).not.toContain('bed:height');
  const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
  let id = 0;
  const next = adoptHypothesis(corrected.draft, raw, () => `new_${++id}`);
  expect(next.ok).toBe(true);
  if (next.ok)
    expect(
      next.draft.room.furniture.find((p) => p.id === 'bed')!.dimensions.width,
    ).toEqual({
      value: 1700,
      status: 'estimated',
      sourceId: 'visitor-estimate',
    });
});
