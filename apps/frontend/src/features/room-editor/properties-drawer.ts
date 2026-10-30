export const COMPACT_PROPERTIES = '(max-width: 1199px)';
export const FULLSCREEN_PROPERTIES =
  '(max-width: 599px), (max-width: 959px) and (max-height: 499px)';
export const OPEN_PROPERTIES = 'roomedy:open-properties';

function reachable(element: HTMLElement | null): element is HTMLElement {
  return (
    !!element?.isConnected &&
    element.getClientRects().length > 0 &&
    !element.closest('[inert], [hidden], [aria-hidden="true"]')
  );
}
export function returnDrawerFocus(
  trigger: HTMLElement | null,
  fallback: HTMLElement | null,
) {
  (reachable(trigger) ? trigger : reachable(fallback) ? fallback : null)?.focus(
    { preventScroll: true },
  );
}
/** Tablet tools are nonmodal; only the complete phone overlay owns Tab and page scrolling. */
export function bindDrawerInteraction(
  panel: HTMLElement,
  modal: boolean,
  close: () => void,
) {
  const doc = panel.ownerDocument;
  const bodyOverflow = doc.body.style.overflow;
  const rootOverflow = doc.documentElement.style.overflow;
  if (modal) {
    doc.body.style.overflow = 'hidden';
    doc.documentElement.style.overflow = 'hidden';
  }
  const keyboard = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if ((event.target as HTMLElement | null)?.closest?.('dialog[open]')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (!modal || event.key !== 'Tab') return;
    const controls = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(reachable);
    const index = controls.indexOf(doc.activeElement as HTMLElement);
    if (!controls.length) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
    } else if (
      (event.shiftKey && index <= 0) ||
      (!event.shiftKey && (index === -1 || index === controls.length - 1))
    ) {
      event.preventDefault();
      (event.shiftKey ? controls.at(-1) : controls[0])?.focus({
        preventScroll: true,
      });
    }
  };
  panel.addEventListener('keydown', keyboard);
  return () => {
    panel.removeEventListener('keydown', keyboard);
    if (modal) {
      doc.body.style.overflow = bodyOverflow;
      doc.documentElement.style.overflow = rootOverflow;
    }
  };
}

/** Visual viewport follows a software keyboard without changing browser zoom or room geometry. */
export function followDrawerViewport(
  panel: HTMLElement,
  viewport: VisualViewport | null,
) {
  if (!viewport) return () => {};
  const update = () => {
    if (Math.abs(viewport.scale - 1) > 0.01) {
      panel.style.removeProperty('--properties-top');
      panel.style.removeProperty('--properties-height');
      return;
    }
    panel.style.setProperty(
      '--properties-top',
      `${Math.max(0, viewport.offsetTop)}px`,
    );
    panel.style.setProperty(
      '--properties-height',
      `${Math.max(180, viewport.height)}px`,
    );
  };
  update();
  viewport.addEventListener('resize', update);
  viewport.addEventListener('scroll', update);
  return () => {
    viewport.removeEventListener('resize', update);
    viewport.removeEventListener('scroll', update);
    panel.style.removeProperty('--properties-top');
    panel.style.removeProperty('--properties-height');
  };
}
