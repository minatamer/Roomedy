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
    assembly: smooth(progress, 0, 0.31),
    rotation: smooth(progress, 0.3, 0.68),
    opening: smooth(progress, 0.64, 1),
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
