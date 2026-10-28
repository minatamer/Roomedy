import { landingFinishState, landingSurfaces } from './finish-motion';

/** Authored marketing illustration, never a visitor estimate or merchant evidence. */
export const landingEstimate = {
  currency: 'USD',
  floorArea: landingSurfaces.width * landingSurfaces.depth,
  paintArea:
    (landingSurfaces.northWidth + landingSurfaces.westWidth) *
      landingSurfaces.wallHeight -
    landingSurfaces.windowArea,
  packArea: 1.8,
  waste: 0.08,
  paintCanLitres: 2.5,
  paintYield: 10,
  coats: 2,
  oakPack: 42,
  laminatePack: 28,
  underlayAndTrim: 120,
  paintCan: 38,
  primer: 24,
  furniture: [450, 140, 160, 90, 75],
  fitting: 220,
  painting: 260,
  moving: 100,
} as const;
export const landingFloorPacks = Math.ceil(
  (landingEstimate.floorArea * (1 + landingEstimate.waste)) /
    landingEstimate.packArea,
);
export const landingPaintCans = Math.ceil(
  (landingEstimate.paintArea * landingEstimate.coats) /
    landingEstimate.paintYield /
    landingEstimate.paintCanLitres,
);
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
export const landingAmount = (value: number) => number.format(value);

export function landingEstimateAt(progress: number) {
  const state = landingFinishState(progress),
    floor =
      landingFloorPacks *
        (state.choice === 'oak'
          ? landingEstimate.oakPack
          : landingEstimate.laminatePack) +
      landingEstimate.underlayAndTrim,
    paint =
      landingPaintCans * landingEstimate.paintCan + landingEstimate.primer,
    furniture = landingEstimate.furniture.reduce(
      (sum, amount) => sum + amount,
      0,
    ),
    work =
      landingEstimate.fitting +
      landingEstimate.painting +
      landingEstimate.moving;
  return {
    choice: state.choice,
    finish: state.choice === 'oak' ? 'Oak planks' : 'Light oak laminate',
    floor,
    paint,
    furniture,
    work,
    total: floor + paint + furniture + work,
    saving:
      state.choice === 'oak'
        ? 0
        : landingFloorPacks *
          (landingEstimate.oakPack - landingEstimate.laminatePack),
  };
}
