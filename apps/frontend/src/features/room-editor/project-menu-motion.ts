/** One finite presentation owner; native details still owns the settled state. */
export function createProjectMenuMotion(
  menu: HTMLDetailsElement,
  panel: HTMLElement,
) {
  const summary = menu.querySelector('summary');
  let wanted = menu.open;
  let running: Animation | null = null;
  let disposed = false;
  panel.inert = !wanted;
  const hidden = { opacity: '0', transform: 'translateY(-10px) scale(.97)' };
  const visible = { opacity: '1', transform: 'translateY(0) scale(1)' };
  const setOpen = (next: boolean) => {
    if (disposed || (next === wanted && (running || menu.open === next)))
      return;
    // Read before cancelling so rapid reversals start at the actual visible pose.
    const computed = menu.open ? getComputedStyle(panel) : null;
    const from = computed
      ? { opacity: computed.opacity, transform: computed.transform }
      : hidden;
    wanted = next;
    running?.cancel();
    running = null;
    if (!next && panel.contains(panel.ownerDocument.activeElement))
      summary?.focus({ preventScroll: true });
    menu.open = true;
    panel.inert = !next;
    summary?.setAttribute('aria-expanded', String(next));
    const settle = (animation: Animation | null) => {
      if (disposed || running !== animation) return;
      menu.open = next;
      panel.inert = !next;
      summary?.removeAttribute('aria-expanded');
      running = null;
      animation?.cancel();
    };
    if (typeof panel.animate !== 'function') {
      settle(null);
      return;
    }
    const animation = panel.animate([from, next ? visible : hidden], {
      duration: next ? 300 : 220,
      easing: 'cubic-bezier(.2,.75,.2,1)',
      fill: 'both',
    });
    running = animation;
    animation.onfinish = () => settle(animation);
  };
  return {
    setOpen,
    toggle: () => setOpen(!wanted),
    dispose: () => {
      disposed = true;
      running?.cancel();
      running = null;
      menu.open = false;
      panel.inert = true;
      summary?.removeAttribute('aria-expanded');
    },
  };
}
