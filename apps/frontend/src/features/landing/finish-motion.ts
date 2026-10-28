import { boundedProgress } from './scroll-motion';
import type { BoxPart } from '../room-view/representations/definitions';

export const landingSurfaces = {
  width: 4.4,
  depth: 4.9,
  wallHeight: 2.65,
  wallBottom: -0.025,
  northWidth: 4.45,
  westWidth: 5,
  windowArea: 1.25 ** 2,
  floorColumns: 4,
  floorRows: 7,
} as const;

const smooth = (value: number, start: number, end: number) => {
  const t = boundedProgress((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
export type LandingWall = 'north' | 'west';
export const landingWallParts: Record<LandingWall, BoxPart[]> = {
  north: [
    {
      name: 'below-window',
      role: 'frame',
      size: [4450, 1050, 120],
      center: [0, 500, 0],
    },
    {
      name: 'above-window',
      role: 'frame',
      size: [4450, 350, 120],
      center: [0, 2450, 0],
    },
    {
      name: 'left-of-window',
      role: 'frame',
      size: [2550, 1250, 120],
      center: [-950, 1650, 0],
    },
    {
      name: 'right-of-window',
      role: 'frame',
      size: [650, 1250, 120],
      center: [1900, 1650, 0],
    },
  ],
  west: [
    {
      name: 'west-wall',
      role: 'frame',
      size: [120, 2650, 5000],
      center: [0, 1300, 0],
    },
  ],
};

/** The last fifth of each stroke moves sideways at its end; reversal has no reset. */
export function landingPaintStroke(wall: LandingWall, value: number) {
  const p = boundedProgress(value),
    north = wall === 'north',
    width = north ? landingSurfaces.northWidth : landingSurfaces.westWidth,
    columns = north ? 8 : 10,
    amount = smooth(p, north ? 0.19 : 0.29, north ? 0.3 : 0.4),
    at = amount * columns,
    column = Math.min(columns - 1, Math.floor(at)),
    phase = amount === 1 ? 1 : at - column,
    stroke = boundedProgress(phase / 0.8),
    y = column % 2 === 0 ? stroke : 1 - stroke,
    along =
      -width / 2 +
      ((column + 0.5 + (column < columns - 1 ? smooth(phase, 0.8, 1) : 0)) *
        width) /
        columns,
    wallY = landingSurfaces.wallBottom + y * landingSurfaces.wallHeight,
    rollerY = Math.max(0.07, Math.min(2.56, wallY));
  return {
    amount,
    columns,
    width,
    along,
    y: wallY,
    rollerY,
    handlePitch: -Math.acos(boundedProgress((rollerY - 0.04) / 0.56)),
    lift: north
      ? smooth(along, 0, 0.35) *
        (1 - smooth(along, 1.55, 1.9)) *
        smooth(wallY, 0.75, 1.05) *
        (1 - smooth(wallY, 2.25, 2.6))
      : 0,
    spin: -(y * landingSurfaces.wallHeight) / 0.055,
    opacity: smooth(amount, 0, 0.02) * (1 - smooth(amount, 0.98, 1)),
  };
}

export const landingFloorCount =
  landingSurfaces.floorColumns * landingSurfaces.floorRows;
export function landingFloorPanel(index: number, value: number) {
  const p = boundedProgress(value),
    safe = Math.min(
      landingFloorCount - 1,
      Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0),
    ),
    column = safe % landingSurfaces.floorColumns,
    row = Math.floor(safe / landingSurfaces.floorColumns),
    amount = smooth(p, 0.34 + safe * 0.0028, 0.38 + safe * 0.0028),
    width = landingSurfaces.width / landingSurfaces.floorColumns,
    depth = landingSurfaces.depth / landingSurfaces.floorRows;
  return {
    amount,
    position: [
      -landingSurfaces.width / 2 + (column + 0.5) * width,
      -0.015 + (1 - amount) * 0.16,
      -landingSurfaces.depth / 2 + (row + 0.5) * depth + (1 - amount) * 0.07,
    ] as [number, number, number],
    scale: [
      (width - 0.005) * smooth(amount, 0, 0.25),
      0.03 * amount,
      (depth - 0.005) * smooth(amount, 0, 0.25),
    ] as [number, number, number],
  };
}

export function landingFinishState(value: number) {
  const p = boundedProgress(value),
    floorMix = smooth(p, 0.525, 0.565),
    floorHighlight =
      smooth(p, 0.46, 0.48) * (1 - smooth(p, 0.5, 0.51)) +
      smooth(p, 0.525, 0.54) * (1 - smooth(p, 0.615, 0.64)),
    paintHighlight = smooth(p, 0.5, 0.51) * (1 - smooth(p, 0.52, 0.535));
  return {
    floorMix,
    planOpen: smooth(p, 0.62, 0.7),
    floorHighlight,
    paintHighlight,
    choice: floorMix < 0.5 ? ('oak' as const) : ('laminate' as const),
    focus:
      p < 0.46 || p > 0.64
        ? ('none' as const)
        : p < 0.505 || p >= 0.53
          ? ('floor' as const)
          : ('paint' as const),
  };
}
