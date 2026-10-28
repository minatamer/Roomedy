import { describe, expect, it } from 'vitest';
import {
  convertNativeMinor,
  convertOfferToUsd,
  offerMoney,
  validateOfferFx,
  calculateRoomEstimate,
  defaultEstimateSettings,
  sampleEstimateOffers,
} from '@roomedy/spatial';
import { createRoomFixture } from '../apps/frontend/src/features/session/fixtures/rooms.js';
import { roomSurface } from '@roomedy/contracts/surfaces';
const rate = {
  usdPerUnit: '0.017831',
  date: '2026-10-28',
  observedAt: Date.UTC(2026, 9, 28, 12),
  url: 'https://api.frankfurter.dev/v2/rate/egp/usd',
};
function native(kind: string) {
  const offer = sampleEstimateOffers().find((value) => value.kind === kind)!;
  return {
    ...offer,
    market: { ...offer.market, currency: 'EGP' as const },
    source: {
      kind: 'sourced' as const,
      label: 'Merchant',
      evidence: 'Actual variant',
      url: 'https://example.com/item',
      observedAt: rate.observedAt,
    },
  };
}
describe('frozen USD equivalents', () => {
  it('converts exact decimal reference rates and rounds half up once', () => {
    expect(convertNativeMinor(1_199_500, '0.017831')).toBe(21_388);
    expect(convertNativeMinor(1, '0.5')).toBe(1);
    expect(convertNativeMinor(19, '0.017831', 11n)).toBe(4);
    expect(convertNativeMinor(30, '1.234567890123', 13n, 10n)).toBe(48);
    for (const bad of [
      '0',
      '-1',
      '1e-5',
      'Infinity',
      '0.0000000000001',
      '10000',
    ])
      expect(() => convertNativeMinor(100, bad)).toThrow();
    expect(() => convertNativeMinor(1e9, '9999', 1000n)).toThrow(
      'estimate-range',
    );
  });
  it('applies whole flooring quantities before display-unit rounding and preserves the native input', () => {
    const room = createRoomFixture('sample'),
      settings = defaultEstimateSettings(room);
    const source = native('floor');
    if (source.kind !== 'floor') throw new Error('fixture');
    source.priceMinor = 19;
    const converted = convertOfferToUsd(source, rate),
      offers = sampleEstimateOffers().map((value) =>
        value.id === source.id ? converted : value,
      );
    expect('priceMinor' in converted && converted.priceMinor).toBe(0);
    const result = calculateRoomEstimate(room, settings, offers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const floor = result.estimate.lines.find((line) =>
        line.offerIds.includes(source.id),
      )!;
      expect(floor.quantity?.numerator).toBe(11);
      expect(floor.amountMinor).toBe(4);
    }
    expect(converted.fx?.inputs).toEqual([{ key: 'price', minor: 19 }]);
    expect(source.market.currency).toBe('EGP');
  });
  it('retains exact whole-can optimization, minimum charges and native paint prices', () => {
    const room = createRoomFixture('sample'),
      settings = defaultEstimateSettings(room),
      source = native('paint');
    if (!('packs' in source)) throw new Error('fixture');
    source.colour = roomSurface(room.room, 'north').color;
    source.packs = [
      { id: 'small', volumeMl: 2500, priceMinor: 19 },
      { id: 'large', volumeMl: 5000, priceMinor: 37 },
    ];
    const converted = convertOfferToUsd(source, rate),
      offers = sampleEstimateOffers().map((value) =>
        value.id === source.id ? converted : value,
      );
    const result = calculateRoomEstimate(room, settings, offers);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const paint = result.estimate.lines.find((line) =>
        line.offerIds.includes(source.id),
      )!;
      expect(paint.packs).toEqual([{ id: 'large', count: 2 }]);
      expect(paint.amountMinor).toBe(1); // 74 native cents × exact rate, rounded once.
    }
    const service = native('service');
    if (service.kind !== 'service') throw new Error('fixture');
    service.priceMinor = 12345;
    service.minimumMinor = 30000;
    const usd = convertOfferToUsd(service, rate);
    expect(offerMoney(usd, 43_590_000n, 1_000_000n)).toBe(9595);
    expect(offerMoney(usd, 1n, 1n, 'minimum')).toBe(535);
  });
  it('rejects inconsistent, duplicated, misdated or foreign FX records, without rejecting old offers', () => {
    const converted = convertOfferToUsd(native('floor'), rate);
    expect(validateOfferFx(converted)).toBe(true);
    expect(validateOfferFx(sampleEstimateOffers()[0]!)).toBe(true);
    const variants = [
      { market: { ...converted.market, currency: 'EGP' } },
      { fx: { ...converted.fx, inputs: [{ key: 'price', minor: 7 }] } },
      {
        fx: {
          ...converted.fx,
          inputs: [
            { key: 'price', minor: 7 },
            { key: 'price', minor: 7 },
          ],
        },
      },
      { fx: { ...converted.fx, date: '2026-02-30' } },
      { fx: { ...converted.fx, url: 'https://example.com/rate' } },
    ];
    for (const variant of variants)
      expect(
        validateOfferFx({ ...converted, ...variant } as typeof converted),
      ).toBe(false);
    expect(() => convertOfferToUsd(converted, rate)).toThrow();
  });
});
