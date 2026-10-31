import type { EstimateLine, EstimateState } from '@roomedy/contracts/estimates';

const number = (value: number) =>
  value.toLocaleString('en-US', { maximumFractionDigits: 6 });
/** Display only saved quantities. A price equation is allowed only when it exactly matches the saved total. */
export function quantityVisual(line: EstimateLine, pricing: EstimateState) {
  const selected =
      line.pricing === 'listed'
        ? pricing.settings.selectedPrices?.find(
            (p) => p.key === line.productKey,
          )
        : undefined,
    takeoff = selected?.takeoff,
    offers = pricing.offers.filter((o) => line.offerIds.includes(o.id)),
    floor = offers.find((o) => o.kind === 'floor'),
    paint = offers.find((o) => o.kind === 'paint' || o.kind === 'primer'),
    kind =
      takeoff?.kind === 'floor' || floor
        ? 'floor'
        : takeoff?.kind === 'paint' || paint
          ? 'paint'
          : 'other',
    manual = takeoff?.mode === 'manual',
    source = (value: 'product' | 'planning' | 'visitor') =>
      value === 'product'
        ? selected?.simulation
          ? 'Example'
          : 'Product'
        : value === 'planning'
          ? 'Planning'
          : 'Entered';
  const facts: string[] = [];
  if (takeoff?.kind === 'floor')
    facts.push(
      `${number(takeoff.coverageMm2 / 1e6)} m2 / pack`,
      `${source(takeoff.coverageSource)} coverage`,
    );
  else if (floor?.kind === 'floor')
    facts.push(
      `${number(floor.coverageMm2 / 1e6)} m2 / pack`,
      floor.source.kind === 'sample'
        ? 'Example coverage'
        : floor.source.kind === 'manual'
          ? 'Entered coverage'
          : 'Product coverage',
    );
  if (takeoff?.kind === 'paint')
    facts.push(
      `${number(takeoff.coverageMm2PerLitre / 1e6)} m2 / L / coat`,
      `${number(takeoff.volumeMl / 1000)} L / can`,
      `${source(takeoff.coverageSource)} coverage`,
      `${source(takeoff.volumeSource)} can size`,
    );
  else if (paint && 'packs' in paint) {
    facts.push(`${number(paint.coverageMm2PerLitre / 1e6)} m2 / L / coat`);
    const mix = line.packs
      .map((p) => {
        const pack = paint.packs.find((can) => can.id === p.id);
        return pack ? `${p.count} x ${number(pack.volumeMl / 1000)} L` : null;
      })
      .filter(Boolean);
    if (mix.length) facts.push(mix.join(' + '));
    facts.push(
      paint.source.kind === 'sample'
        ? 'Example coverage'
        : paint.source.kind === 'manual'
          ? 'Entered coverage'
          : 'Product coverage',
    );
  }
  const walls = line.targets.flatMap((target) =>
      target.kind === 'surface' && target.surface !== 'floor'
        ? [target.surface]
        : [],
    ),
    coats = [
      ...new Set(
        walls
          .map(
            (wall) =>
              pricing.settings.walls.find((w) => w.wall === wall)?.coats,
          )
          .filter((v): v is number => v !== undefined),
      ),
    ];
  if (kind === 'paint' && coats.length)
    facts.unshift(coats.length === 1 ? `${coats[0]} coats` : 'Mixed coats');
  if (kind === 'floor' && !manual)
    facts.push(
      `${number(pricing.settings.floor.wasteBps / 100)}% cutting waste`,
    );
  if (manual) facts.push('Manual quantity');
  let unitPriceMinor = selected?.unitPriceMinor ?? null,
    basis: string | null = selected?.unit ?? null;
  if (
    !selected &&
    offers.length === 1 &&
    offers[0]!.market.currency === 'USD' &&
    line.pricing !== 'included' &&
    line.pricing !== 'unpriced'
  ) {
    const offer = offers[0]!;
    if (offer.kind === 'floor') {
      unitPriceMinor = offer.priceMinor;
      basis = 'pack';
    } else if (offer.kind === 'furniture' || offer.kind === 'component') {
      unitPriceMinor = offer.priceMinor;
      basis = 'each';
    } else if (offer.kind === 'service') {
      unitPriceMinor = offer.priceMinor;
      basis = offer.basis;
    } else if (
      'packs' in offer &&
      line.packs.length === 1 &&
      line.quantity?.unit === 'can'
    ) {
      unitPriceMinor =
        offer.packs.find((p) => p.id === line.packs[0]!.id)?.priceMinor ?? null;
      basis = 'can';
    }
  }
  const q = line.quantity,
    divisor =
      q?.unit === 'mm2' && basis === 'm2'
        ? 1_000_000
        : q?.unit === 'mm' && basis === 'm'
          ? 1000
          : q?.unit === basis
            ? 1
            : 0;
  if (
    !q ||
    line.amountMinor === null ||
    unitPriceMinor === null ||
    !divisor ||
    BigInt(q.numerator) * BigInt(unitPriceMinor) !==
      BigInt(line.amountMinor) * BigInt(q.denominator) * BigInt(divisor)
  )
    unitPriceMinor = null;
  return {
    kind,
    manual,
    facts,
    walls,
    tiles: [
      {
        label: kind === 'floor' ? 'Room floor' : 'Net walls',
        quantity: line.installed,
      },
      {
        label: kind === 'floor' ? 'With cutting waste' : 'Paint needed',
        quantity: line.required,
      },
      { label: manual ? 'Your quantity' : 'Buy', quantity: line.quantity },
    ],
    unitPriceMinor,
    status:
      line.quantityStatus === 'known'
        ? 'Recorded quantities'
        : line.quantityStatus === 'estimated'
          ? 'Planning quantities'
          : 'Needs review',
  };
}
