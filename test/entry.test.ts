import { describe, expect, it } from 'vitest';
import {
  entryHref,
  entryReducer,
  parseEntryIntent,
} from '../apps/frontend/src/features/session/entry/entry-state.js';
import type {
  EntryState,
  EntrySource,
} from '../apps/frontend/src/features/session/entry/entry-state.js';

describe('guest entry intent and route handoff', () => {
  it.each(['sample', 'own'] as const)(
    'round-trips every supported %s condition without changing the intent',
    (source) => {
      for (const condition of ['empty', 'partial', 'furnished'] as const) {
        const expected = { step: 'ready', intent: { source, condition } };
        const state = parseEntryIntent(source, condition);
        expect(state).toEqual(expected);
        const href = new URL(entryHref(state), 'http://127.0.0.1:4320');
        expect(href.pathname).toBe('/demo');
        expect([...href.searchParams.keys()]).toEqual(['start', 'condition']);
        expect(
          parseEntryIntent(
            href.searchParams.get('start') ?? undefined,
            href.searchParams.get('condition') ?? undefined,
          ),
        ).toEqual(expected);
      }
    },
  );

  it('fails closed for invalid, conflicting and prototype-like query inputs', () => {
    for (const source of [
      undefined,
      '',
      'Sample',
      'sample,own',
      '__proto__',
      'constructor',
      'https://example.com',
      ['sample', 'own'],
      { toString: () => 'sample' },
    ]) {
      // Query arrays/objects are untrusted boundary values, outside the typed API.
      expect(parseEntryIntent(source as string | undefined, 'empty')).toEqual({
        step: 'source',
      });
    }
    for (const source of ['sample', 'own'] as const)
      for (const condition of [
        undefined,
        '',
        'Empty',
        'empty,furnished',
        'own',
        '__proto__',
        ['empty', 'furnished'],
      ])
        expect(
          parseEntryIntent(source, condition as string | undefined),
        ).toEqual({ step: 'condition', source });
  });

  it('does not carry a previous condition into a different source selection', () => {
    const initial: EntryState = Object.freeze({
      step: 'ready',
      intent: Object.freeze({ source: 'sample', condition: 'furnished' }),
    });
    const next = entryReducer(initial, { type: 'source', source: 'own' });
    expect(next).toEqual({ step: 'condition', source: 'own' });
    expect(entryHref(next)).toBe('/demo?start=own');
    expect(
      entryReducer(next, { type: 'condition', condition: 'partial' }),
    ).toEqual({
      step: 'ready',
      intent: { source: 'own', condition: 'partial' },
    });
    expect(initial).toEqual({
      step: 'ready',
      intent: { source: 'sample', condition: 'furnished' },
    });
  });

  it.each(['sample', 'own'] as const)(
    'Back keeps the intentional %s source until the visitor goes back again',
    (source: EntrySource) => {
      const ready = parseEntryIntent(source, 'empty');
      const condition = entryReducer(ready, { type: 'back' });
      expect(condition).toEqual({ step: 'condition', source });
      expect(entryHref(condition)).toBe(`/demo?start=${source}`);
      const reselection = entryReducer(condition, {
        type: 'condition',
        condition: 'furnished',
      });
      expect(reselection).toEqual({
        step: 'ready',
        intent: { source, condition: 'furnished' },
      });
      expect(entryReducer(condition, { type: 'back' })).toEqual({
        step: 'source',
      });
      expect(ready).toEqual({
        step: 'ready',
        intent: { source, condition: 'empty' },
      });
    },
  );

  it('ignores stale condition events outside the condition step and keeps the fresh route clean', () => {
    const source: EntryState = Object.freeze({ step: 'source' });
    const ready = parseEntryIntent('own', 'partial');
    expect(
      entryReducer(source, { type: 'condition', condition: 'empty' }),
    ).toBe(source);
    expect(
      entryReducer(ready, { type: 'condition', condition: 'furnished' }),
    ).toBe(ready);
    expect(entryReducer(source, { type: 'back' })).toEqual(source);
    expect(entryHref(source)).toBe('/demo');
  });
});
