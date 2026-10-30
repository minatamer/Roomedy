import { COMPACT_PROPERTIES, OPEN_PROPERTIES } from './properties-drawer';
import type { SessionController } from '../session/controller';

/** Panel transitions announce their new task without taking focus from plan gestures. */
export function focusProperties(controller: SessionController, id?: string) {
  const expected = controller.getSnapshot();
  if (!expected.workspace) return;
  document
    .querySelector<HTMLElement>('aside[aria-label="Room properties"]')
    ?.dispatchEvent(new Event(OPEN_PROPERTIES));
  requestAnimationFrame(() => {
    const current = controller.getSnapshot();
    if (
      current.phase !== 'editor' ||
      current.workspace?.workspaceId !== expected.workspace?.workspaceId ||
      current.generation !== expected.generation ||
      current.presentation.panel !== expected.presentation.panel ||
      current.presentation.selectedId !== expected.presentation.selectedId
    )
      return;
    const target = id
      ? document.getElementById(`properties-${id}`)
      : (document.querySelector<HTMLElement>(
          'aside[aria-label="Room properties"] h2',
        ) ??
        document.querySelector<HTMLElement>(
          'aside[aria-label="Room properties"]',
        ));
    target?.focus({ preventScroll: true });
    if (window.matchMedia(COMPACT_PROPERTIES).matches)
      target
        ?.closest<HTMLElement>('[data-properties-scroll]')
        ?.scrollTo({ top: 0, behavior: 'smooth' });
    else target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
