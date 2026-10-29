export type PhaseBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};
export function panelTransform(box: PhaseBox, base: PhaseBox) {
  const width = Math.max(1, base.width),
    height = Math.max(1, base.height);
  return `translate(${box.left - base.left}px, ${box.top - base.top}px) scale(${Math.max(1, box.width) / width}, ${Math.max(1, box.height) / height})`;
}
export function boundedPanel(box: PhaseBox, stage: PhaseBox): PhaseBox {
  if (box.top >= stage.top + stage.height || box.width <= 1 || box.height <= 1)
    return {
      left: stage.left,
      top: stage.top + stage.height * 0.55,
      width: stage.width,
      height: Math.max(1, stage.height * 0.45),
    };
  const left = Math.max(stage.left, box.left),
    top = Math.max(stage.top, box.top);
  return {
    left,
    top,
    width: Math.max(1, Math.min(box.width, stage.left + stage.width - left)),
    height: Math.max(1, Math.min(box.height, stage.top + stage.height - top)),
  };
}
/** Hold the terminal pose until the caller commits its layout handoff and releases it. */
export function animatePhase(
  panel: HTMLElement,
  from: PhaseBox,
  to: PhaseBox,
  entering: boolean,
  done: () => void,
  opacity: string[] = [],
) {
  let live = true;
  const base = panel.getBoundingClientRect(),
    animations: Animation[] = [];
  const cancel = () => {
    if (!live) return;
    live = false;
    animations.forEach((a) => a.cancel());
  };
  if (typeof panel.animate !== 'function') {
    done();
    return cancel;
  }
  try {
    animations.push(
      panel.animate(
        [
          { transform: panelTransform(from, base) },
          { transform: panelTransform(to, base) },
        ],
        { duration: 650, easing: 'cubic-bezier(.22,.7,.12,1)', fill: 'both' },
      ),
    );
    for (const [index, child] of Array.from(panel.children).entries()) {
      animations.push(
        child.animate(
          entering
            ? [
                { opacity: 0, transform: 'translateY(10px)', offset: 0 },
                {
                  opacity: 0,
                  transform: 'translateY(10px)',
                  offset: 650 / 850,
                },
                { opacity: 1, transform: 'translateY(0)', offset: 1 },
              ]
            : [
                { opacity: opacity[index] ?? getComputedStyle(child).opacity },
                { opacity: 0 },
              ],
          { duration: entering ? 850 : 150, easing: 'ease-out', fill: 'both' },
        ),
      );
    }
    void Promise.allSettled(animations.map((a) => a.finished)).then(() => {
      if (!live) return;
      done();
    });
  } catch {
    cancel();
    done();
  }
  return cancel;
}
