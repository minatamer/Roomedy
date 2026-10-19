/** One finite journey. Retired animation callbacks cannot move a newer page or target. */
export function startScrollJourney(
  from: number,
  to: number,
  port: {
    now: () => number;
    request: (callback: (time: number) => void) => number;
    cancel: (frame: number) => void;
    write: (position: number) => void;
    done: () => void;
  },
) {
  const started = port.now(),
    duration = Math.min(1050, Math.max(450, Math.abs(to - from) * 0.6));
  let current = true,
    frame = 0;
  const stop = () => {
    if (!current) return;
    current = false;
    port.cancel(frame);
    port.done();
  };
  const tick = (time: number) => {
    if (!current) return;
    const t = Math.max(0, Math.min(1, (time - started) / duration)),
      eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    port.write(from + (to - from) * eased);
    if (t < 1) frame = port.request(tick);
    else stop();
  };
  frame = port.request(tick);
  return stop;
}
