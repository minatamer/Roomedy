import { describe, expect, it } from 'vitest';
import {
  entryHref,
  entryReducer,
  parseEntryIntent,
} from '../apps/frontend/src/features/session/entry/entry-state.js';
import type { EntryState } from '../apps/frontend/src/features/session/entry/entry-state.js';
describe('distinct manual and photo entry', () => {
  it.each(['empty', 'partial', 'furnished'] as const)(
    'round-trips manual %s and legacy sample without a fresh replacement grant',
    (condition) => {
      const expected = {
        step: 'ready',
        intent: { source: 'manual', condition },
      };
      for (const source of ['manual', 'sample'])
        expect(parseEntryIntent(source, condition)).toEqual(expected);
      const url = new URL(
        entryHref(expected as EntryState),
        'http://127.0.0.1:4320',
      );
      expect(
        parseEntryIntent(
          url.searchParams.get('start')!,
          url.searchParams.get('condition')!,
        ),
      ).toEqual(expected);
    },
  );
  it('photos and legacy own go directly to intake; presets belong only to manual creation', () => {
    for (const source of ['photos', 'own'])
      for (const condition of [
        undefined,
        'empty',
        'partial',
        'furnished',
        '__proto__',
      ]) {
        const state = parseEntryIntent(source, condition);
        expect(state).toEqual({
          step: 'ready',
          intent: { source: 'photos', condition: 'furnished' },
        });
        expect(entryHref(state)).toBe('/demo?start=photos');
      }
    expect(parseEntryIntent('manual', undefined)).toEqual({
      step: 'condition',
      source: 'manual',
    });
  });
  it('fresh photo and manual choices are explicit and their transient freshness never enters the route', () => {
    const source: EntryState = { step: 'source' };
    const photos = entryReducer(source, { type: 'source', source: 'photos' });
    expect(photos).toMatchObject({ step: 'ready', fresh: true });
    expect(entryHref(photos)).toBe('/demo?start=photos');
    expect(entryReducer(photos, { type: 'back' })).toEqual(source);
    const manual = entryReducer(source, { type: 'source', source: 'manual' });
    expect(manual).toEqual({ step: 'condition', source: 'manual' });
    const ready = entryReducer(manual, {
      type: 'condition',
      condition: 'partial',
    });
    expect(ready).toEqual({
      step: 'ready',
      intent: { source: 'manual', condition: 'partial' },
      fresh: true,
    });
    expect(entryReducer(ready, { type: 'back' })).toEqual(manual);
    expect(entryReducer(manual, { type: 'back' })).toEqual(source);
  });
  it('fails closed for invalid sources/presets and ignores stale condition events', () => {
    for (const value of [
      undefined,
      '',
      'Manual',
      '__proto__',
      'constructor',
      ['manual', 'photos'],
      { toString: () => 'manual' },
    ])
      expect(parseEntryIntent(value as string | undefined, 'empty')).toEqual({
        step: 'source',
      });
    for (const condition of [
      undefined,
      '',
      'Empty',
      '__proto__',
      ['empty', 'furnished'],
    ])
      expect(
        parseEntryIntent('manual', condition as string | undefined),
      ).toEqual({ step: 'condition', source: 'manual' });
    const source: EntryState = Object.freeze({ step: 'source' });
    expect(
      entryReducer(source, { type: 'condition', condition: 'empty' }),
    ).toBe(source);
    const ready = parseEntryIntent('photos', undefined);
    expect(entryReducer(ready, { type: 'condition', condition: 'empty' })).toBe(
      ready,
    );
  });
});
