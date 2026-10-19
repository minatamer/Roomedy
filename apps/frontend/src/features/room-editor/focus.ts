import type { SessionController } from '../session/controller';

/** Panel transitions announce their new task without taking focus from plan gestures. */
export function focusProperties(controller: SessionController, id?: string) {
  const expected = controller.getSnapshot();
  if (!expected.workspace) return;
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
    target?.scrollIntoView({
      behavior: 'smooth',
      block: window.matchMedia(
        '(max-width:759px), (max-width:899px) and (max-height:800px)',
      ).matches
        ? 'start'
        : 'nearest',
    });
  });
}
