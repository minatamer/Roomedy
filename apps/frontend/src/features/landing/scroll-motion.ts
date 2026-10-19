export function boundedProgress(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

const smooth = (value: number, from: number, to: number) => {
  const t = boundedProgress((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

/** Presentation only. Reversing the page retraces the same continuous room. */
export function roomChoreography(value: number) {
  const progress = boundedProgress(value);
  return {
    rotation: smooth(progress, 0.2, 0.46),
    opening: smooth(progress, 0.43, 0.72),
  };
}

/** Interrupt from the displayed position, with a bounded step after idle. */
export function advanceScroll(current: number, target: number, delta: number) {
  const from = boundedProgress(current),
    to = boundedProgress(target),
    dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.05)) : 0;
  return Math.abs(to - from) < 0.0001
    ? to
    : from + (to - from) * (1 - Math.exp(-dt * 12));
}

export interface ScrollTarget {
  progress: number;
  visible: boolean;
  wake?: () => void;
}

/** Full-viewport composition: perspective changes remain continuous on resize/reverse. */
export function landingFraming(value: number, aspect: number) {
  const p = boundedProgress(value),
    { rotation, opening } = roomChoreography(p),
    final = smooth(p, 0.72, 1),
    ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1,
    narrow = boundedProgress((1.3 - ratio) / 0.8),
    distance = 1 + narrow * 0.28;
  return {
    camera: [
      (6.2 - opening * 2.1 + final * 0.8) * distance,
      (5.6 + rotation * 2.2 - opening * 4.7) * distance,
      (8.2 - opening * 0.8 - final * 0.8) * distance,
    ] as const,
    lookAt: [
      (-1.45 + rotation * 2.5 - opening * 1.3) * (1 - narrow),
      0.65,
      0,
    ] as const,
    scale: 1.55 - narrow * 0.2,
    turn: rotation * -0.85 + opening * 0.35 + final * 0.2,
  };
}

/** Same CSS stage gets a finite backing buffer, including very wide/high-DPI windows. */
export function landingPixelRatio(
  width: number,
  height: number,
  device: number,
) {
  const w = Number.isFinite(width) && width > 0 ? width : 1,
    h = Number.isFinite(height) && height > 0 ? height : 1,
    dpr = Number.isFinite(device) && device > 0 ? device : 1;
  return Math.min(dpr, 1.5, Math.sqrt(2_000_000 / (w * h)));
}

/** Authored marketing pieces only; this never becomes a visitor room or command. */
export const landingFurniture = [
  {
    key: 'bed',
    category: 'bed',
    size: { width: 1600, depth: 2100, height: 850 },
    color: '#b8875c',
  },
  {
    key: 'desk',
    category: 'desk',
    size: { width: 1200, depth: 600, height: 750 },
    color: '#c09a6f',
  },
  {
    key: 'chair',
    category: 'chair',
    size: { width: 670, depth: 630, height: 1150 },
    color: '#b67d66',
  },
  {
    key: 'shelf',
    category: 'storage',
    size: { width: 800, depth: 350, height: 1200 },
    color: '#b0875d',
  },
  {
    key: 'bedside',
    category: 'storage',
    size: { width: 450, depth: 450, height: 550 },
    color: '#a57551',
  },
] as const;
type LandingPiece = (typeof landingFurniture)[number]['key'];
type FloorFrame = readonly [
  progress: number,
  x: number,
  z: number,
  turn: number,
];
const floorPaths: Record<LandingPiece, readonly FloorFrame[]> = {
  shelf: [
    [0, -1.65, -1.85, 0],
    [0.03, -1.65, -1.85, 0],
    [0.06, -1.65, -1.85, Math.PI / 2],
    [0.08, -1.8, -1.85, Math.PI / 2],
    [0.16, -1.8, 1.9, Math.PI / 2],
  ],
  bed: [
    [0, -0.5, 0.5, Math.PI / 2],
    [0.17, -0.5, 0.5, Math.PI / 2],
    [0.34, -1.1, -0.7, 0],
  ],
  desk: [
    [0, 1.45, 1.65, Math.PI / 2],
    [0.35, 1.45, 1.65, Math.PI / 2],
    [0.43, 0.15, 1.65, Math.PI / 2],
    [0.53, 0.15, -1.65, Math.PI / 2],
    [0.62, 1.1, -1.65, 0],
  ],
  chair: [
    [0, 0.95, 0.1, Math.PI / 2],
    [0.63, 0.95, 0.1, Math.PI / 2],
    [0.72, 1.1, -0.7, Math.PI],
  ],
  bedside: [
    [0, 1.75, -0.8, 0],
    [0.73, 1.75, -0.8, 0],
    [0.79, 1.75, 0.5, 0],
    [0.85, 0.05, 0.5, 0],
    [0.92, 0.05, -1.45, 0],
  ],
};

/** Sequential clear floor paths: moving the desk toward daylight opens the middle of the room. */
export function landingFurniturePose(piece: LandingPiece, value: number) {
  const frames = floorPaths[piece],
    p = boundedProgress(value);
  let from = frames[0]!,
    to = from;
  for (let i = 1; i < frames.length; i++) {
    to = frames[i]!;
    if (p <= to[0]) break;
    from = to;
  }
  const t = to[0] === from[0] ? 0 : smooth(p, from[0], to[0]);
  return {
    position: [
      from[1] + (to[1] - from[1]) * t,
      0,
      from[2] + (to[2] - from[2]) * t,
    ] as const,
    turn: from[3] + (to[3] - from[3]) * t,
  };
}
