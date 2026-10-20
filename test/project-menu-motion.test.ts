import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProjectMenuMotion } from '../apps/frontend/src/features/room-editor/project-menu-motion.js';

function fixture(open = false, canAnimate = true) {
  const attributes = new Map<string, string>();
  const summary = {
    focus: vi.fn(),
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    removeAttribute: (key: string) => attributes.delete(key),
  };
  const runs: {
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    animation: {
      cancel: ReturnType<typeof vi.fn>;
      onfinish: (() => void) | null;
    };
  }[] = [];
  const style = { opacity: '1', transform: 'none' };
  vi.stubGlobal('getComputedStyle', () => style);
  const panel = {
    inert: false,
    ownerDocument: { activeElement: {} },
    contains: vi.fn(() => false),
    animate: canAnimate
      ? vi.fn((frames: Keyframe[], options: KeyframeAnimationOptions) => {
          const animation = {
            cancel: vi.fn(),
            onfinish: null as (() => void) | null,
          };
          runs.push({ frames, options, animation });
          return animation as unknown as Animation;
        })
      : undefined,
  };
  const menu = { open, querySelector: () => summary };
  const motion = createProjectMenuMotion(
    menu as unknown as HTMLDetailsElement,
    panel as unknown as HTMLElement,
  );
  return { menu, panel, summary, attributes, runs, style, motion };
}

afterEach(() => vi.unstubAllGlobals());

describe('finite Project disclosure motion', () => {
  it('keeps exit paint alive while closing controls are inert, then retires the animation and native disclosure', () => {
    const f = fixture();
    expect(f.panel.inert).toBe(true);
    f.motion.setOpen(true);
    expect(f.menu.open).toBe(true);
    expect(f.panel.inert).toBe(false);
    expect(f.attributes.get('aria-expanded')).toBe('true');
    expect(Number(f.runs[0]!.options.duration)).toBeGreaterThan(0);
    expect(Number(f.runs[0]!.options.duration)).toBeLessThanOrEqual(500);
    f.runs[0]!.animation.onfinish!();
    expect(f.menu.open).toBe(true);
    expect(f.attributes.has('aria-expanded')).toBe(false);
    expect(f.runs[0]!.animation.cancel).toHaveBeenCalledOnce();
    f.motion.setOpen(false);
    expect(f.menu.open).toBe(true);
    expect(f.panel.inert).toBe(true);
    expect(f.attributes.get('aria-expanded')).toBe('false');
    f.runs[1]!.animation.onfinish!();
    expect(f.menu.open).toBe(false);
    expect(f.panel.inert).toBe(true);
    expect(f.attributes.has('aria-expanded')).toBe(false);
    expect(f.runs[1]!.animation.cancel).toHaveBeenCalledOnce();
  });

  it('reverses from the visible pose and fences stale completion instead of jumping or hiding a reopened menu', () => {
    const f = fixture();
    f.motion.toggle();
    const oldOpen = f.runs[0]!.animation.onfinish!;
    Object.assign(f.style, {
      opacity: '0.47',
      transform: 'matrix(0.98, 0, 0, 0.98, 0, -5)',
    });
    f.motion.toggle();
    const oldClose = f.runs[1]!.animation.onfinish!;
    expect(f.runs[1]!.frames[0]).toEqual(f.style);
    Object.assign(f.style, {
      opacity: '0.28',
      transform: 'matrix(0.97, 0, 0, 0.97, 0, -7)',
    });
    f.motion.toggle();
    expect(f.runs[2]!.frames[0]).toEqual(f.style);
    expect(f.runs[0]!.animation.cancel).toHaveBeenCalledOnce();
    expect(f.runs[1]!.animation.cancel).toHaveBeenCalledOnce();
    oldOpen();
    oldClose();
    expect(f.menu.open).toBe(true);
    expect(f.panel.inert).toBe(false);
    f.runs[2]!.animation.onfinish!();
    expect(f.menu.open).toBe(true);
  });

  it('does not restart repeated intents and toggles the destination while the native menu is still painting an exit', () => {
    const f = fixture();
    f.motion.setOpen(true);
    f.motion.setOpen(true);
    expect(f.runs).toHaveLength(1);
    f.runs[0]!.animation.onfinish!();
    f.motion.setOpen(true);
    expect(f.runs).toHaveLength(1);
    f.motion.setOpen(false);
    f.motion.setOpen(false);
    expect(f.runs).toHaveLength(2);
    expect(f.menu.open).toBe(true);
    f.motion.toggle();
    expect(f.runs).toHaveLength(3);
    expect(f.panel.inert).toBe(false);
  });

  it('returns focus before making a focused closing panel inert, without stealing focus on programmatic opening', () => {
    const f = fixture();
    f.motion.setOpen(true);
    expect(f.summary.focus).not.toHaveBeenCalled();
    f.panel.contains.mockReturnValue(true);
    f.summary.focus.mockImplementation(() => expect(f.panel.inert).toBe(false));
    f.motion.setOpen(false);
    expect(f.summary.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(f.panel.inert).toBe(true);
    f.panel.contains.mockReturnValue(false);
    f.motion.setOpen(true);
    f.motion.setOpen(false);
    expect(f.summary.focus).toHaveBeenCalledOnce();
  });

  it('cancels teardown work and makes late completion or stale controls unable to reopen or mutate the menu', () => {
    const f = fixture();
    f.motion.setOpen(true);
    const finish = f.runs[0]!.animation.onfinish!;
    f.motion.dispose();
    finish();
    f.motion.setOpen(true);
    f.motion.toggle();
    f.motion.dispose();
    expect(f.menu.open).toBe(false);
    expect(f.panel.inert).toBe(true);
    expect(f.runs).toHaveLength(1);
    expect(f.runs[0]!.animation.cancel).toHaveBeenCalledOnce();
    expect(f.attributes.has('aria-expanded')).toBe(false);
  });

  it('keeps native open/close usable when the animation API is unavailable', () => {
    const f = fixture(false, false);
    f.motion.setOpen(true);
    expect(f.menu.open).toBe(true);
    expect(f.panel.inert).toBe(false);
    expect(f.attributes.has('aria-expanded')).toBe(false);
    f.motion.setOpen(false);
    expect(f.menu.open).toBe(false);
    expect(f.panel.inert).toBe(true);
    expect(f.runs).toHaveLength(0);
  });

  it('adopts an already open native disclosure without replaying its entrance', () => {
    const f = fixture(true);
    expect(f.panel.inert).toBe(false);
    f.motion.setOpen(true);
    expect(f.runs).toHaveLength(0);
    f.motion.toggle();
    expect(f.panel.inert).toBe(true);
    f.runs[0]!.animation.onfinish!();
    expect(f.menu.open).toBe(false);
  });
});
