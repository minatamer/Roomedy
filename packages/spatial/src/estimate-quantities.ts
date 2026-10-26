import type { RoomDocument } from '@roomedy/contracts/room';
import type { EstimateOffer } from '@roomedy/contracts/estimates';
import { paintPackSchema } from '@roomedy/contracts/estimates';
import { WALLS } from '@roomedy/contracts/surfaces';
import { intersection, unionArea } from './coordinates.js';
import type { Region } from '@roomedy/contracts/issues';

export const MAX_ESTIMATE_MINOR = 1_000_000_000_000_000n;
/** Round money once, half up to the supported two-decimal currency's minor unit. */
export function estimateMoney(numerator: bigint, denominator = 1n) {
  if (numerator < 0n || denominator <= 0n) throw new Error('estimate-range');
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  if (rounded > MAX_ESTIMATE_MINOR) throw new Error('estimate-range');
  return Number(rounded);
}
export function ceilQuantity(numerator: bigint, denominator: bigint) {
  if (numerator < 0n || denominator <= 0n) throw new Error('estimate-range');
  const result = (numerator + denominator - 1n) / denominator;
  if (result > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('estimate-range');
  return Number(result);
}

/** Exact integer area: opening rectangles are clipped and their union deducted once. */
export function estimateWallAreas(room: RoomDocument) {
  return WALLS.map((wall) => {
    const length =
        room.room[wall === 'north' || wall === 'south' ? 'width' : 'depth'],
      height = room.room.height;
    const openings = room.room.features.filter(
      (feature) =>
        feature.kind !== 'obstacle' &&
        (feature.wall === wall || feature.wall === 'unknown'),
    );
    const grossMm2 =
      length.value === null || height.value === null
        ? null
        : length.value * height.value;
    const incomplete =
      grossMm2 === null ||
      openings.some(
        (feature) =>
          feature.wall === 'unknown' ||
          [feature.offset, feature.sill, feature.width, feature.height].some(
            (value) => value.value === null,
          ),
      );
    const estimated = [
      length,
      height,
      ...openings.flatMap((feature) => [
        feature.offset,
        feature.sill,
        feature.width,
        feature.height,
      ]),
    ].some((value) => value.status !== 'confirmed');
    if (
      incomplete ||
      length.value === null ||
      height.value === null ||
      grossMm2 === null
    )
      return {
        wall,
        grossMm2,
        netMm2: null,
        deductedMm2: null,
        status: 'incomplete' as const,
        notes: [
          'Confirm wall length, height and relevant opening positions/sizes before calculating paint.',
        ],
      };
    const bounds = { minX: 0, maxX: length.value, minZ: 0, maxZ: height.value };
    const holes: Region[] = [];
    let clipped = false;
    for (const feature of openings) {
      const rectangle = {
        minX: feature.offset.value!,
        maxX: feature.offset.value! + feature.width.value!,
        minZ: feature.sill.value!,
        maxZ: feature.sill.value! + feature.height.value!,
      };
      const hole = intersection(rectangle, bounds);
      if (hole) holes.push(hole);
      if (
        !hole ||
        hole.minX !== rectangle.minX ||
        hole.maxX !== rectangle.maxX ||
        hole.minZ !== rectangle.minZ ||
        hole.maxZ !== rectangle.maxZ
      )
        clipped = true;
    }
    const deductedMm2 = unionArea(holes);
    return {
      wall,
      grossMm2,
      netMm2: grossMm2 - deductedMm2,
      deductedMm2,
      status:
        estimated || clipped ? ('estimated' as const) : ('known' as const),
      notes: clipped
        ? [
            'An opening extends beyond this wall; only its clipped area is deducted. Review its measurements.',
          ]
        : [],
    };
  });
}

type PaintPack = Extract<
  EstimateOffer,
  { kind: 'paint' | 'primer' }
>['packs'][number];
/** At most50k quarter-litre states and four actual pack options; no floating money. */
export function paintPackPlan(
  requiredNumeratorMl: number,
  denominator: number,
  rawPacks: readonly PaintPack[],
) {
  if (
    !Number.isSafeInteger(requiredNumeratorMl) ||
    requiredNumeratorMl < 0 ||
    !Number.isSafeInteger(denominator) ||
    denominator < 1 ||
    rawPacks.length < 1 ||
    rawPacks.length > 4
  )
    throw new Error('estimate-range');
  const packs = rawPacks
    .map((pack) => paintPackSchema.parse(pack))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (new Set(packs.map((pack) => pack.id)).size !== packs.length)
    throw new Error('estimate-range');
  const needed = ceilQuantity(
    BigInt(requiredNumeratorMl),
    BigInt(denominator) * 250n,
  );
  const maxPack = Math.max(...packs.map((pack) => pack.volumeMl / 250));
  const limit = needed + maxPack - 1;
  if (limit > 50_000) throw new Error('estimate-range');
  const costs = new Float64Array(limit + 1).fill(Infinity),
    counts = new Uint32Array(limit + 1),
    choices = new Int16Array(limit + 1).fill(-1);
  costs[0] = 0;
  for (let units = 1; units <= limit; units++)
    for (let index = 0; index < packs.length; index++) {
      const pack = packs[index]!,
        previous = units - pack.volumeMl / 250;
      if (previous < 0 || !Number.isFinite(costs[previous]!)) continue;
      const price = costs[previous]! + pack.priceMinor,
        count = counts[previous]! + 1;
      // All addends and bounded sums are safe integers; no fractional price enters DP.
      if (
        price < costs[units]! ||
        (price === costs[units]! && count < counts[units]!)
      ) {
        costs[units] = price;
        counts[units] = count;
        choices[units] = index;
      }
    }
  let selected = needed;
  for (let units = needed; units <= limit; units++)
    if (costs[units]! < costs[selected]!) selected = units;
  if (!Number.isFinite(costs[selected]!)) throw new Error('estimate-range');
  const picked = new Map<string, number>();
  for (let remaining = selected; remaining > 0;) {
    const pack = packs[choices[remaining]!]!;
    if (!pack) throw new Error('estimate-range');
    picked.set(pack.id, (picked.get(pack.id) ?? 0) + 1);
    remaining -= pack.volumeMl / 250;
  }
  return {
    requiredMlCeil: ceilQuantity(
      BigInt(requiredNumeratorMl),
      BigInt(denominator),
    ),
    purchasedMl: selected * 250,
    priceMinor: estimateMoney(BigInt(costs[selected]!)),
    packs: [...picked].map(([id, count]) => ({ id, count })),
  };
}
