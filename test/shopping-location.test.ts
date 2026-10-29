import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  countryAtPosition,
  loadCountryOutlines,
  requestShoppingLocation,
} from '../apps/frontend/src/features/cost/location.js';
import type {
  CountryOutline,
  PositionSource,
} from '../apps/frontend/src/features/cost/location.js';
import { SessionController } from '../apps/frontend/src/features/session/controller.js';
import { createManualRoom } from '../apps/frontend/src/features/session/entry/manual-room.js';
import { projectOf } from '../apps/frontend/src/features/session/project.js';
import { shoppingCountries } from '@roomedy/contracts/estimates';
import {
  SHOPPING_COUNTRIES,
  shoppingCountry,
} from '../apps/frontend/src/features/cost/shopping-countries.js';

const outlines: CountryOutline[] = JSON.parse(
  readFileSync('apps/frontend/public/data/shopping-countries-v1.json', 'utf-8'),
);
const position = (latitude: number, longitude: number, accuracy = 20) =>
  ({ coords: { latitude, longitude, accuracy } }) as GeolocationPosition;

describe('optional country-only browser location', () => {
  it('offers the complete regular country/region set once each in English alphabetical order', () => {
    expect(SHOPPING_COUNTRIES).toHaveLength(257);
    expect(new Set(SHOPPING_COUNTRIES.map((c) => c.code)).size).toBe(257);
    const collator = new Intl.Collator('en', { sensitivity: 'base' });
    expect(SHOPPING_COUNTRIES.map((c) => c.name)).toEqual(
      SHOPPING_COUNTRIES.map((c) => c.name).sort(collator.compare),
    );
    for (const { code, name } of SHOPPING_COUNTRIES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(name).not.toBe(code);
    }
    expect(shoppingCountry('US')?.name).toBe('United States');
    expect(shoppingCountry('EG')?.name).toBe('Egypt');
    expect(shoppingCountry('JP')?.name).toBe('Japan');
    expect(shoppingCountry('ZW')?.name).toBe('Zimbabwe');
    expect(shoppingCountry('ZZ')).toBeUndefined();
    expect(shoppingCountry('AA')).toBeUndefined();
  });
  it('applies an explicit manual market without location access and rejects invalid or stale changes', () => {
    const c = new SessionController(createManualRoom('partial'));
    try {
      c.setDestination('cost', 'ar-EG');
      const before = c.getSnapshot();
      expect(before.cost!.settings.locality.country).toBe('US');
      expect(
        c.chooseShoppingLocation(
          'AA',
          'manual',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(false);
      expect(c.getSnapshot()).toBe(before);
      expect(
        c.chooseShoppingLocation(
          'JP',
          'manual',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(true);
      expect(c.getSnapshot().shoppingLocation).toEqual({
        country: 'JP',
        method: 'manual',
      });
      expect(c.getSnapshot().cost!.settings.locality).toEqual({
        country: 'JP',
        city: 'Japan',
        currency: 'USD',
      });
      expect(
        c.chooseShoppingLocation(
          'EG',
          'manual',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(false);
      expect(JSON.stringify(projectOf(c.getSnapshot()))).not.toMatch(
        /shoppingLocation|latitude|longitude|accuracy/,
      );
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(before.cost!.settings);
    } finally {
      c.dispose();
    }
  });
  it.each([
    [30.0444, 31.2357, 'EG'],
    [40.7128, -74.006, 'US'],
    [48.8566, 2.3522, 'FR'],
    [51.5074, -0.1278, 'GB'],
    [24.7136, 46.6753, 'SA'],
    [35.6762, 139.6503, 'JP'],
  ])(
    'locates a real country outline at %s,%s',
    (latitude, longitude, country) => {
      expect(
        countryAtPosition(
          position(Number(latitude), Number(longitude)).coords,
          outlines,
        ),
      ).toBe(country);
    },
  );
  it('does not guess an ocean, invalid, uncertain or ambiguous position, and respects holes', () => {
    for (const p of [
      position(0, -30),
      position(91, 0),
      position(NaN, 0),
      position(30, 31, 300_000),
    ])
      expect(countryAtPosition(p.coords, outlines)).toBeNull();
    const a: CountryOutline = {
      country: 'AA',
      polygons: [
        [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          [
            [4, 4],
            [6, 4],
            [6, 6],
            [4, 6],
            [4, 4],
          ],
        ],
      ],
    };
    expect(countryAtPosition(position(5, 5).coords, [a])).toBeNull();
    expect(countryAtPosition(position(2, 2).coords, [a])).toBe('AA');
    expect(
      countryAtPosition(position(2, 2).coords, [a, { ...a, country: 'BB' }]),
    ).toBeNull();
  });
  it('requests once with low accuracy only after the caller chooses it and returns no coordinates', async () => {
    const geo: PositionSource = {
      getCurrentPosition: vi.fn((success) =>
        success(position(30.0444, 31.2357)),
      ),
    };
    const load = vi.fn(async () => outlines);
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    const task = requestShoppingLocation(geo, load);
    expect(await task.result).toEqual({ kind: 'located', country: 'EG' });
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(vi.mocked(geo.getCurrentPosition).mock.calls[0]![2]).toEqual({
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
    expect(load).toHaveBeenCalledTimes(1);
    task.cancel();
  });
  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('handles browser error %s without lookup or retry', async (code, kind) => {
    const load = vi.fn(async () => outlines);
    const geo: PositionSource = {
      getCurrentPosition: vi.fn((_success, failure) =>
        failure!({ code } as GeolocationPositionError),
      ),
    };
    expect(await requestShoppingLocation(geo, load).result).toEqual({ kind });
    expect(load).not.toHaveBeenCalled();
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
  });
  it('cancels late browser/lookup results and degrades unsupported/missing data without guessing', async () => {
    let succeed: PositionCallback | undefined;
    const load = vi.fn(async () => outlines);
    const task = requestShoppingLocation(
      {
        getCurrentPosition: (success) => {
          succeed = success;
        },
      },
      load,
    );
    task.cancel();
    succeed!(position(30, 31));
    expect(await task.result).toEqual({ kind: 'cancelled' });
    expect(load).not.toHaveBeenCalled();
    expect(await requestShoppingLocation(undefined, load).result).toEqual({
      kind: 'unsupported',
    });
    const geo: PositionSource = {
      getCurrentPosition: (success) => success(position(30, 31)),
    };
    expect(
      await requestShoppingLocation(geo, async () => {
        throw new Error('offline');
      }).result,
    ).toEqual({ kind: 'unresolved' });
    let finish!: (value: CountryOutline[]) => void;
    const pending = requestShoppingLocation(
      geo,
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    pending.cancel();
    finish(outlines);
    expect(await pending.result).toEqual({ kind: 'cancelled' });
  });
  it('loads only the versioned first-party outlines and rejects malformed data', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(outlines)),
    );
    vi.stubGlobal('fetch', fetcher);
    try {
      expect(await loadCountryOutlines(new AbortController().signal)).toEqual(
        outlines,
      );
      expect(fetcher.mock.calls[0]![0]).toBe(
        '/data/shopping-countries-v1.json',
      );
      fetcher.mockImplementation(
        async () => new Response('[{"country":"EG","polygons":[[[[999,1]]]]}]'),
      );
      await expect(
        loadCountryOutlines(new AbortController().signal),
      ).rejects.toThrow('country-data');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('keeps the no-location path useful without making a country claim', () => {
    const countries = shoppingCountries('ZZ');
    expect(countries).toContain('US');
    expect(countries).toContain('EG');
    expect(countries).toContain('DE');
    expect(countries).not.toContain('ZZ');
  });
  it('stores only a transient choice and coarse market, preserves Undo, and fences late choices', () => {
    const c = new SessionController(createManualRoom('partial'));
    try {
      c.setDestination('cost', 'en-US');
      const before = c.getSnapshot();
      expect(before.cost!.settings.locality.country).toBe('US');
      expect(
        c.chooseShoppingLocation(
          'US',
          'manual',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(true);
      expect(c.getSnapshot().cost).toBe(before.cost);
      expect(c.getSnapshot().undoLabel).toBeNull();
      expect(
        c.chooseShoppingLocation(
          'EG',
          'browser',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(true);
      const located = c.getSnapshot();
      expect(located.shoppingLocation).toEqual({
        country: 'EG',
        method: 'browser',
      });
      expect(located.cost!.settings.locality).toEqual({
        country: 'EG',
        city: 'Egypt',
        currency: 'USD',
      });
      expect(
        c.chooseShoppingLocation(
          'US',
          'browser',
          before.generation,
          before.cost!.revision,
        ),
      ).toBe(false);
      const exported = JSON.stringify(projectOf(located));
      expect(exported).not.toMatch(
        /shoppingLocation|latitude|longitude|accuracy/,
      );
      expect(c.undo().ok).toBe(true);
      expect(c.getSnapshot().cost!.settings).toEqual(before.cost!.settings);
      const current = c.getSnapshot();
      expect(
        c.chooseShoppingLocation(
          'ZZ',
          'skip',
          current.generation,
          current.cost!.revision,
        ),
      ).toBe(true);
      expect(c.getSnapshot().shoppingLocation?.method).toBe('skip');
      c.setDestination('design');
      expect(
        c.chooseShoppingLocation(
          'EG',
          'browser',
          current.generation,
          current.cost!.revision,
        ),
      ).toBe(false);
      c.setDestination('cost', 'ar-EG');
      expect(c.getSnapshot().shoppingLocation?.method).toBe('skip');
      expect(c.reset(createManualRoom('partial'))).toBe(true);
      expect(c.getSnapshot().shoppingLocation).toBeNull();
      c.setDestination('cost', 'en-US');
      expect(
        c.chooseShoppingLocation(
          'EG',
          'browser',
          current.generation,
          c.getSnapshot().cost!.revision,
        ),
      ).toBe(false);
      c.dispose();
      expect(c.getSnapshot().shoppingLocation).toBeNull();
    } finally {
      c.dispose();
    }
  });
});
