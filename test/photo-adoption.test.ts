import { expect, it } from 'vitest';
import { recognitionFixture } from '../apps/backend/src/recognition/fixtures.js';
import {
  adoptHypothesis,
  createDraft,
} from '../apps/frontend/src/features/room-intake/draft.js';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import { CATALOGUE, furnitureBottom } from '@roomedy/spatial';

const unknown = () => ({
  value: null,
  status: 'unknown' as const,
  sourceId: null,
});
function adopt(
  raw: ReturnType<typeof recognitionFixture>,
  purposes?: ('room' | 'furniture')[],
) {
  const draft = createDraft('furnished', 'photo_adoption');
  const sources = [...new Set(raw.observations.map((o) => o.sourceId))];
  draft.sources = sources.map((id, i) => ({
    id,
    purpose: purposes?.[i] ?? 'room',
    available: true,
  }));
  let n = 0;
  const result = adoptHypothesis(draft, raw, () => `item_${++n}`);
  if (!result.ok) throw new Error(result.message);
  return result.draft;
}
it('uses a later room-view pose when the first grouped furniture detail has no pose', () => {
  const raw = recognitionFixture('repeated-desk', ['detail', 'room']);
  raw.observations[0]!.sketch = { x: null, z: null, quarterTurns: null };
  raw.observations[0]!.poseEvidence = { status: 'unknown', sourceId: null };
  raw.observations[1]!.sketch = { x: 0.75, z: 0.2, quarterTurns: 3 };
  const result = adopt(raw, ['furniture', 'room']);
  expect(result.room.furniture).toHaveLength(1);
  expect(result.room.furniture[0]!.pose).toMatchObject({
    centerX: 3150,
    centerZ: 960,
    quarterTurns: 3,
  });
  expect(result.room.furniture[0]!.dimensions.width.value).toBeNull();
});
it('keeps separate provisional placeholders for distinct unlocated categories without invented normalized evidence', () => {
  const raw = recognitionFixture('two-identical', ['room']);
  raw.observations[1]!.catalogueId = 'chair-desk-fixed';
  for (const o of raw.observations) {
    o.sketch = { x: null, z: null, quarterTurns: null };
    o.poseEvidence = { status: 'unknown', sourceId: null };
  }
  const result = adopt(raw);
  expect(result.room.furniture).toHaveLength(2);
  expect(
    new Set(
      result.room.furniture.map((p) => `${p.pose.centerX}:${p.pose.centerZ}`),
    ).size,
  ).toBe(2);
  expect(result.links.every((l) => l.normalized === null)).toBe(true);
});
it.each([
  ['ceiling-pendant', 2100],
  ['ceiling-flush', 2500],
  ['ceiling-track', 2380],
  ['mirror-wall', 900],
] as const)(
  'plans the %s mount without converting nominal dimensions to photo measurements',
  (catalogueId, bottomY) => {
    const raw = recognitionFixture('repeated-desk', ['room']);
    raw.observations[0]!.catalogueId = catalogueId;
    raw.observations[0]!.width =
      raw.observations[0]!.depth =
      raw.observations[0]!.height =
        unknown();
    const result = adopt(raw),
      piece = result.room.furniture[0]!;
    expect(piece.pose.bottomY).toBe(bottomY);
    expect(piece.pose.provenance).toEqual({
      status: 'planned',
      sourceId: 'photo-mount-plan',
    });
    expect(Object.values(piece.dimensions).every((m) => m.value === null)).toBe(
      true,
    );
    expect(result.room.room.height.value).toBeNull();
    if (catalogueId === 'mirror-wall') expect(piece.pose.centerZ).toBe(35);
  },
);
it('retains a supported photographed bathroom purpose and rejects it on a furniture observation', () => {
  const raw = recognitionFixture('unknown-hinge', ['room']);
  const door = raw.observations.find((o) => o.kind === 'door')!;
  Object.assign(door, { doorPurpose: 'bathroom' });
  const result = adopt(raw);
  expect(
    result.room.room.features.find((f) => f.kind === 'door'),
  ).toMatchObject({ purpose: 'bathroom' });
  Object.assign(
    raw.observations.find((o) => o.kind === 'furniture')!,
    { doorPurpose: 'bathroom' },
  );
  expect(parseDraftHypothesis(raw, ['room'])).toBeNull();
});
it.each(CATALOGUE)(
  'adopts the current $id representation without inventing owned dimensions',
  (entry) => {
    const raw = recognitionFixture('repeated-desk', ['room']);
    Object.assign(raw.observations[0]!, {
      catalogueId: entry.id,
      finish: entry.finishes[0],
    });
    const result = adopt(raw),
      piece = result.room.furniture[0]!;
    expect(result.room.furniture).toHaveLength(1);
    expect(piece.catalogueId).toBe(entry.id);
    expect(Object.values(piece.dimensions).every((m) => m.value === null)).toBe(
      true,
    );
    if (entry.placement && entry.placement !== 'floor')
      expect(furnitureBottom(piece)).not.toBeNull();
  },
);
