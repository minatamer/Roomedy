import { describe, expect, it, vi } from 'vitest';
import {
  bindDrawerInteraction,
  followDrawerViewport,
  returnDrawerFocus,
} from '../apps/frontend/src/features/room-editor/properties-drawer.js';

function fixture() {
  const doc = {
    body: { style: { overflow: 'auto' } },
    documentElement: { style: { overflow: '' } },
    activeElement: null as unknown,
  };
  const control = (visible = true, blocked = false) => ({
    isConnected: true,
    getClientRects: () => (visible ? [{}] : []),
    closest: () => (blocked ? {} : null),
    focus: vi.fn(function (this: unknown) {
      doc.activeElement = this;
    }),
  });
  const first = control(),
    last = control(),
    hidden = control(false),
    inert = control(true, true);
  const panel = Object.assign(new EventTarget(), {
    ownerDocument: doc,
    querySelectorAll: () => [first, hidden, inert, last],
    closest: () => null,
    focus: vi.fn(),
  });
  doc.activeElement = first;
  const key = (key: string, options: Record<string, unknown> = {}) => {
    const event = new Event('keydown', { cancelable: true });
    Object.assign(event, {
      key,
      shiftKey: false,
      isComposing: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      ...options,
    });
    panel.dispatchEvent(event);
    return event;
  };
  return {
    doc,
    control,
    first,
    last,
    panel: panel as unknown as HTMLElement,
    key,
  };
}
describe('responsive properties interaction ownership', () => {
  it('traps phone Tab at both boundaries, excluding hidden and inert controls', () => {
    const f = fixture(),
      release = bindDrawerInteraction(f.panel, true, vi.fn());
    f.doc.activeElement = f.last;
    expect(f.key('Tab').defaultPrevented).toBe(true);
    expect(f.first.focus).toHaveBeenCalledOnce();
    expect(f.key('Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(f.last.focus).toHaveBeenCalledOnce();
    release();
  });
  it('keeps tablet Tab nonmodal while Escape remains an explicit close', () => {
    const f = fixture(),
      close = vi.fn(),
      release = bindDrawerInteraction(f.panel, false, close);
    f.doc.activeElement = f.last;
    expect(f.key('Tab').defaultPrevented).toBe(false);
    expect(f.first.focus).not.toHaveBeenCalled();
    expect(f.key('Escape').defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(f.doc.body.style.overflow).toBe('auto');
    release();
  });
  it('does not consume composing/modified keys or a child-handled Escape', () => {
    const f = fixture(),
      close = vi.fn(),
      release = bindDrawerInteraction(f.panel, true, close);
    f.key('Escape', { isComposing: true });
    f.key('Escape', { ctrlKey: true });
    const handled = new Event('keydown', { cancelable: true });
    Object.assign(handled, { key: 'Escape' });
    handled.preventDefault();
    f.panel.dispatchEvent(handled);
    expect(close).not.toHaveBeenCalled();
    release();
  });
  it('restores exact scroll styles and removes keyboard ownership on close, resize or disposal', () => {
    const f = fixture(),
      close = vi.fn(),
      release = bindDrawerInteraction(f.panel, true, close);
    expect(f.doc.body.style.overflow).toBe('hidden');
    expect(f.doc.documentElement.style.overflow).toBe('hidden');
    release();
    expect(f.doc.body.style.overflow).toBe('auto');
    expect(f.doc.documentElement.style.overflow).toBe('');
    expect(f.key('Escape').defaultPrevented).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });
  it('contains focus safely even when no controls are available', () => {
    const f = fixture();
    f.panel.querySelectorAll =
      (() => []) as unknown as HTMLElement['querySelectorAll'];
    const release = bindDrawerInteraction(f.panel, true, vi.fn());
    expect(f.key('Tab').defaultPrevented).toBe(true);
    expect(f.panel.focus).toHaveBeenCalledOnce();
    release();
  });
  it('restores the visible launcher and falls back safely when it is hidden or disconnected', () => {
    const f = fixture(),
      trigger = f.control(),
      fallback = f.control();
    returnDrawerFocus(
      trigger as unknown as HTMLElement,
      fallback as unknown as HTMLElement,
    );
    expect(trigger.focus).toHaveBeenCalledOnce();
    trigger.isConnected = false;
    returnDrawerFocus(
      trigger as unknown as HTMLElement,
      fallback as unknown as HTMLElement,
    );
    expect(fallback.focus).toHaveBeenCalledOnce();
    fallback.isConnected = false;
    returnDrawerFocus(
      trigger as unknown as HTMLElement,
      fallback as unknown as HTMLElement,
    );
    expect(fallback.focus).toHaveBeenCalledOnce();
  });
});
describe('phone visual viewport ownership', () => {
  it('follows keyboard-sized height/offset and removes listeners and properties on retirement', () => {
    const values = new Map<string, string>();
    const panel = {
      style: {
        setProperty: (k: string, v: string) => values.set(k, v),
        removeProperty: (k: string) => values.delete(k),
      },
    } as unknown as HTMLElement;
    const viewport = Object.assign(new EventTarget(), {
      scale: 1,
      offsetTop: 0,
      height: 844,
    });
    const release = followDrawerViewport(
      panel,
      viewport as unknown as VisualViewport,
    );
    expect(values.get('--properties-height')).toBe('844px');
    viewport.height = 356;
    viewport.offsetTop = 24;
    viewport.dispatchEvent(new Event('resize'));
    expect(values.get('--properties-height')).toBe('356px');
    expect(values.get('--properties-top')).toBe('24px');
    release();
    expect(values.size).toBe(0);
    viewport.dispatchEvent(new Event('resize'));
    expect(values.size).toBe(0);
  });
  it('leaves pinch zoom to the browser and supports browsers without visualViewport', () => {
    const values = new Map<string, string>();
    const panel = {
      style: {
        setProperty: (k: string, v: string) => values.set(k, v),
        removeProperty: (k: string) => values.delete(k),
      },
    } as unknown as HTMLElement;
    const viewport = Object.assign(new EventTarget(), {
      scale: 1,
      offsetTop: 0,
      height: 568,
    });
    const release = followDrawerViewport(
      panel,
      viewport as unknown as VisualViewport,
    );
    viewport.scale = 2;
    viewport.dispatchEvent(new Event('scroll'));
    expect(values.size).toBe(0);
    release();
    expect(() => followDrawerViewport(panel, null)()).not.toThrow();
  });
});
