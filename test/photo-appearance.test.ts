import { describe, expect, it } from 'vitest';
import { parseDraftHypothesis } from '@roomedy/contracts/intake';
import {
  bedroomExample,
  recognitionFixture,
} from '../apps/backend/src/recognition/fixtures.js';
import {
  adoptHypothesis,
  createDraft,
  correctDraft,
} from '../apps/frontend/src/features/room-intake/draft.js';
import type { ReviewResult } from '../apps/frontend/src/features/room-intake/draft.js';
import {
  photoAppearance,
  photoOpeningMaterials,
} from '../apps/frontend/src/features/room-intake/photo-appearance.js';
import { recognitionRequest } from '../apps/backend/src/recognition/recognize.js';
import { recognitionInput } from './fixtures/operation.js';

const take = (r: ReviewResult) => {
  if (!r.ok) throw new Error(r.message);
  return r.draft;
};
const start = () => {
  const d = createDraft('furnished', 'photo-room');
  d.sources = [{ id: 'photo', purpose: 'room', available: true }];
  return d;
};
describe('photo appearance is independent of geometry and six named finishes', () => {
  it('captures body and bedding RGB/patterns without confirmed dimensions or manual defaults', () => {
    let n = 0;
    const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
    raw.room.width = { value: null, status: 'unknown', sourceId: null };
    const d = take(adoptHypothesis(start(), raw, () => `piece${++n}`));
    expect(d.room.room.width.value).toBeNull();
    expect(d.room.furniture[0]!.materials).toEqual({
      bodyColor: '#b69a78',
      bodyPattern: 'wood',
      softColor: '#d9d5ca',
      softPattern: 'fabric',
    });
    expect(d.observations[0]!.appearance).toMatchObject({
      bodyColor: '#b69a78',
      status: 'estimated',
      sourceId: 'photo',
    });
    expect(d.room.room.surfaces?.floor?.texture.value).toBe('planks');
  });
  it('rejects foreign source appearance, invalid RGB, unknown patterns and wrong part roles', () => {
    const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
    raw.observations[0]!.appearance!.sourceId = 'other';
    expect(parseDraftHypothesis(raw, ['photo', 'other'])).toBeNull();
    raw.observations[0]!.appearance!.sourceId = 'photo';
    const altered = JSON.parse(JSON.stringify(raw));
    altered.observations[0].appearance.bodyColor = '#123';
    expect(parseDraftHypothesis(altered, ['photo'])).toBeNull();
    altered.observations[0].appearance.bodyColor = '#123456';
    altered.observations[0].appearance.bodyPattern =
      'https://example.test/image';
    expect(parseDraftHypothesis(altered, ['photo'])).toBeNull();
    raw.observations[0]!.appearance!.frameColor = '#123456';
    expect(parseDraftHypothesis(raw, ['photo'])).toBeNull();
  });
  it('reconciles small lighting differences per RGB channel and leaves conflicting patterns/colours unset', () => {
    const raw = bedroomExample([
      { id: 'photo', purpose: 'room' },
      { id: 'other', purpose: 'room' },
    ]);
    const beds = raw.observations.filter(
      (o) => o.catalogueId === 'procedural-bed',
    );
    beds[0]!.appearance!.bodyColor = '#404040';
    beds[1]!.appearance!.bodyColor = '#505050';
    beds[1]!.appearance!.softPattern = 'stripes';
    expect(photoAppearance(beds)).toMatchObject({
      bodyColor: '#484848',
      bodyPattern: 'wood',
    });
    expect(photoAppearance(beds)).not.toHaveProperty('softPattern');
    beds[1]!.appearance!.bodyColor = '#ff0000';
    expect(photoAppearance(beds)).not.toHaveProperty('bodyColor');
    beds[0]!.visibility = 'occluded';
    expect(photoAppearance(beds).bodyColor).toBe('#ff0000');
  });
  it('captures a door leaf and frame separately, and only a window frame', () => {
    const raw = recognitionFixture('unknown-hinge', ['photo']);
    const opening = raw.observations.find((o) => o.kind === 'door')!;
    opening.appearance!.bodyColor = '#234567';
    opening.appearance!.bodyPattern = 'smooth';
    opening.appearance!.frameColor = '#eeeeee';
    expect(parseDraftHypothesis(raw, ['photo'])).not.toBeNull();
    expect(photoOpeningMaterials([opening])).toEqual({
      color: '#234567',
      texture: 'smooth',
      frameColor: '#eeeeee',
    });
    opening.kind = 'window';
    expect(parseDraftHypothesis(raw, ['photo'])).toBeNull();
    opening.appearance!.bodyColor = null;
    opening.appearance!.bodyPattern = null;
    expect(parseDraftHypothesis(raw, ['photo'])).not.toBeNull();
    expect(photoOpeningMaterials([opening])).toEqual({ frameColor: '#eeeeee' });
  });
  it('preserves deliberate visitor material choices when recognition repeats', () => {
    let n = 0;
    const raw = bedroomExample([{ id: 'photo', purpose: 'room' }]);
    let d = take(adoptHypothesis(start(), raw, () => `piece${++n}`));
    const id = d.room.furniture[0]!.id;
    d = take(
      correctDraft(d, [
        {
          type: 'set-furniture-materials',
          id,
          materials: { bodyColor: '#123456', softPattern: 'checker' },
        },
      ]),
    );
    raw.observations[0]!.appearance!.bodyColor = '#998877';
    d = take(adoptHypothesis(d, raw, () => `piece${++n}`));
    expect(d.room.furniture).toHaveLength(2);
    expect(d.room.furniture[0]!.materials).toMatchObject({
      bodyColor: '#123456',
      softPattern: 'checker',
    });
  });
  it('exposes strict bounded appearance in the actual one-call provider schema', async () => {
    const input = await recognitionInput();
    const request = recognitionRequest(input, [
      { id: input.manifest[0]!.id, data: 'synthetic' },
    ]);
    expect(JSON.stringify(request.format.schema)).toContain('bodyPattern');
    expect(request.instructions).toContain('window frame colour');
    expect(request.tools).toEqual([]);
    expect(JSON.stringify(request.format.schema).length).toBeLessThan(65536);
  });
});
