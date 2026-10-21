import { POLICY } from '@roomedy/contracts/policy';
import type { Furniture } from '@roomedy/contracts/room';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import { supportsDimensions } from '@roomedy/spatial';

export interface PhysicalSize {
  width: number;
  depth: number;
  height: number;
}
export interface BoxPart {
  name: string;
  center: readonly [number, number, number];
  size: readonly [number, number, number];
  role: 'frame' | 'soft' | 'metal';
}
export type Representation =
  | {
      kind: 'mesh';
      url: string;
      scale: 1;
      quarterTurns: 0;
      approximate: true;
      footprint: PhysicalSize;
    }
  | {
      kind: 'procedural';
      parts: BoxPart[];
      approximate: true;
      notice: string | null;
      footprint: PhysicalSize;
    }
  | { kind: 'unavailable'; notice: string };

/** mm, local center X/Z, floor at Y=0, front +Z. Each part is rebuilt, never mesh-stretched. */
export function proceduralParts(
  category: CatalogueEntry['category'],
  size: PhysicalSize,
  mechanism: CatalogueEntry['accessMechanism'],
  variant = '',
): BoxPart[] {
  const { width: w, depth: d, height: h } = size;
  const parts: BoxPart[] = [];
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    role: BoxPart['role'] = 'frame',
  ) => {
    parts.push({ name, center: [x, y, z], size: [width, height, depth], role });
  };
  const legs = (top: number, thickness: number, inset = 35) => {
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        box(
          `leg-${x}-${z}`,
          x * (w / 2 - inset),
          top / 2,
          z * (d / 2 - inset),
          thickness,
          top,
          thickness,
          'metal',
        );
  };
  if (category === 'bed') {
    const base = Math.min(230, h * 0.3);
    const mattress = Math.min(180, h * 0.25);
    box('frame', 0, base / 2, 0, w, base, d);
    box(
      'mattress',
      0,
      base + mattress / 2,
      0,
      w - 30,
      mattress,
      d - 50,
      'soft',
    );
    box('headboard', 0, h / 2, -d / 2 + 25, w, h, 50);
    box(
      'blanket',
      0,
      base + mattress + 6,
      d * 0.16,
      w - 20,
      12,
      d * 0.6,
      'soft',
    );
    box(
      'pillow',
      0,
      base + mattress + 25,
      -d * 0.33,
      w * 0.65,
      50,
      300,
      'soft',
    );
  } else if (category === 'desk') {
    box('top', 0, h - 20, 0, w, 40, d);
    legs(h - 40, 40);
    box('back-rail', 0, h - 130, -d / 2 + 35, w - 70, 70, 30);
  } else if (category === 'chair') {
    const seat = Math.min(470, h * 0.5);
    box('seat', 0, seat, 0, w, 70, d, 'soft');
    legs(seat - 35, 30);
    box('back', 0, (h + seat) / 2, -d / 2 + 25, w, h - seat, 50, 'soft');
  } else if (category === 'mirror') {
    for (const side of [-1, 1])
      box(`mirror-side-${side}`, side * (w / 2 - 10), h / 2, 0, 20, h, d);
    box('mirror-bottom', 0, 10, 0, w - 40, 20, d);
    box('mirror-top', 0, h - 10, 0, w - 40, 20, d);
    box('mirror-back', 0, h / 2, -d / 2 + 4, w - 40, h - 40, 8);
    box('mirror-glass', 0, h / 2, d / 2 - 4, w - 40, h - 40, 8, 'metal');
  } else if (category === 'tv') {
    const feet = variant === 'tv-tabletop' ? 60 : 0;
    const screenDepth = Math.min(55, d);
    box(
      'tv-body',
      0,
      feet + (h - feet) / 2,
      -d / 2 + screenDepth / 2,
      w,
      h - feet,
      screenDepth,
    );
    box(
      'tv-screen',
      0,
      feet + (h - feet) / 2,
      -d / 2 + screenDepth + 1,
      w - 20,
      h - feet - 20,
      2,
      'metal',
    );
    if (feet)
      for (const side of [-1, 1]) {
        box(
          `tv-foot-${side}`,
          side * w * 0.3,
          8,
          0,
          Math.min(120, w * 0.1),
          16,
          d,
          'metal',
        );
        box(
          `tv-neck-${side}`,
          side * w * 0.3,
          feet / 2,
          -d / 2 + screenDepth / 2,
          20,
          feet,
          20,
          'metal',
        );
      }
  } else if (category === 'seating') {
    const seat = variant === 'bench' ? h - 70 : Math.min(450, h * 0.52);
    box('seat', 0, seat, 0, w, 100, d, 'soft');
    legs(seat - 50, 40, 50);
    if (variant !== 'bench') {
      box('back', 0, (h + seat) / 2, -d / 2 + 70, w, h - seat, 140, 'soft');
      const armHeight = Math.min(230, h - seat + 15);
      for (const side of [-1, 1])
        box(
          `arm-${side}`,
          side * (w / 2 - 60),
          seat + armHeight / 2 - 15,
          0,
          120,
          armHeight,
          d,
          'soft',
        );
    }
  } else if (category === 'table') {
    box('top', 0, h - 15, 0, w, 30, d);
    legs(h - 30, 30, 30);
    box('lower-shelf', 0, h * 0.25, 0, w - 40, 20, d - 40);
  } else if (category === 'lighting') {
    box('lamp-base', 0, 12, 0, w * 0.75, 24, d * 0.75, 'metal');
    box('lamp-stem', 0, (h - 160) / 2, 0, 22, h - 160, 22, 'metal');
    box('lamp-shade', 0, h - 130, 0, w, 260, d, 'soft');
  } else {
    const t = 22;
    box('left-side', -w / 2 + t / 2, h / 2, 0, t, h, d);
    box('right-side', w / 2 - t / 2, h / 2, 0, t, h, d);
    box('bottom', 0, t / 2, 0, w, t, d);
    box('top', 0, h - t / 2, 0, w, t, d);
    box('back', 0, h / 2, -d / 2 + t / 2, w - 2 * t, h - 2 * t, t);
    if (category === 'storage' && mechanism === 'hinged') {
      box('door--1', 0, h / 2, d / 2 - 12, w - 2 * t, h - 2 * t, 24);
    } else if (
      mechanism !== 'drawer' &&
      (category === 'wardrobe' || mechanism === 'hinged')
    ) {
      for (const side of [-1, 1])
        box(
          `door-${side}`,
          (side * w) / 4,
          h / 2,
          d / 2 - 12 - (mechanism === 'sliding' && side === 1 ? 30 : 0),
          w / 2 - 4,
          h - 2 * t,
          24,
        );
      if (mechanism === 'sliding')
        box('sliding-track', 0, h - 45, d / 2 - 20, w - 30, 8, 30, 'metal');
    } else if (mechanism === 'drawer') {
      const drawerArea =
        variant === 'drawer-shelf'
          ? h * 0.42
          : variant === 'tv-stand'
            ? h * 0.6
            : h;
      const levels =
        variant === 'tv-stand'
          ? 1
          : variant === 'bedside-drawers' || variant === 'drawer-shelf'
            ? 2
            : 3;
      const lanes = variant === 'tv-stand' ? 2 : 1;
      for (let level = 0; level < levels; level++)
        for (let lane = 0; lane < lanes; lane++) {
          const y = t + ((drawerArea - 2 * t) * (level + 0.5)) / levels;
          const dh = (drawerArea - 2 * t) / levels - 8,
            dw = (w - 2 * t) / lanes - 4;
          const x = lanes === 1 ? 0 : ((lane === 0 ? -1 : 1) * (w - 2 * t)) / 4;
          const name = `drawer-${level}-${lane}`;
          box(`${name}-front`, x, y, d / 2 - 12, dw, dh, 24);
          box(`${name}-base`, x, y - dh / 2 + 8, 0, dw - 20, 16, d - 2 * t);
          box(`${name}-back`, x, y, -d / 2 + 2 * t, dw - 20, dh - 12, 16);
          for (const side of [-1, 1])
            box(
              `${name}-side-${side}`,
              x + side * (dw / 2 - 12),
              y,
              0,
              16,
              dh - 12,
              d - 2 * t,
            );
          box(
            `${name}-handle`,
            x,
            y,
            d / 2 - 4,
            Math.min(120, dw / 3),
            12,
            8,
            'metal',
          );
        }
      if (drawerArea < h) {
        box('case-divider', 0, drawerArea, 0, w - 2 * t, t, d - t);
        if (variant === 'drawer-shelf')
          for (const fraction of [0.63, 0.82])
            box(
              `upper-shelf-${fraction}`,
              0,
              h * fraction,
              0,
              w - 2 * t,
              t,
              d - t,
            );
      }
    } else
      for (const level of [1, 2, 3])
        box(`shelf-${level}`, 0, (h * level) / 4, 0, w - 2 * t, t, d - t);
  }
  return parts;
}

export function resolveRepresentation(
  entry: CatalogueEntry | undefined,
  size: PhysicalSize,
  assetAvailable = true,
  options: {
    ownership?: Furniture['ownership'];
    finish?: Furniture['finish'];
  } = {},
): Representation {
  if (!entry)
    return {
      kind: 'unavailable',
      notice:
        'This catalogue version is unavailable. The room dimensions are preserved.',
    };
  const physical = Object.values(size).every(
    (value) =>
      Number.isInteger(value) && value >= 1 && value <= POLICY.furnitureEdgeMm,
  );
  if (!physical)
    return {
      kind: 'unavailable',
      notice: 'The physical dimensions are invalid.',
    };
  const unsupportedFinish =
    options.finish !== undefined && !entry.finishes.includes(options.finish);
  if (
    options.ownership === 'owned' &&
    (!supportsDimensions(entry, size) || unsupportedFinish)
  )
    return {
      kind: 'procedural',
      approximate: true,
      footprint: { ...size },
      parts: [
        {
          name: 'physical-bounds',
          center: [0, size.height / 2, 0],
          size: [size.width, size.height, size.depth],
          role: 'frame',
        },
      ],
      notice:
        'A simple bounds representation preserves this owned item’s measured size and finish. The selected model cannot represent them.',
    };
  if (!supportsDimensions(entry, size) || unsupportedFinish)
    return {
      kind: 'unavailable',
      notice:
        'These dimensions are outside this item’s supported range. Choose an adjustable representation explicitly.',
    };
  if (entry.representation === 'prepared-mesh' && assetAvailable)
    return {
      kind: 'mesh',
      url: `/catalogue/${entry.assetId}-v1.glb`,
      scale: 1,
      quarterTurns: 0,
      approximate: true,
      footprint: { ...size },
    };
  return {
    kind: 'procedural',
    parts: proceduralParts(
      entry.category,
      size,
      entry.accessMechanism,
      entry.assetId,
    ),
    approximate: true,
    notice:
      entry.representation === 'prepared-mesh'
        ? 'A simple representation is shown at the same dimensions.'
        : null,
    footprint: { ...size },
  };
}
