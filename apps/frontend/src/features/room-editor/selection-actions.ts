import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';

/** Selection is the interaction mode; locks/read-only still govern each edit. */
export function arrangingSelection(state: SessionSnapshot): boolean {
  if (state.phase !== 'editor' || !state.presentation.selectedId) return false;
  const room =
    state.comparison === 'before'
      ? state.workspace?.baseline
      : (state.candidate?.room ?? state.workspace?.current);
  return (
    !!room &&
    (room.furniture.some((item) => item.id === state.presentation.selectedId) ||
      room.room.features.some(
        (item) =>
          item.id === state.presentation.selectedId && item.kind !== 'obstacle',
      ))
  );
}

export function deleteSelection(
  controller: SessionController,
): ReturnType<SessionController['dispatch']> {
  const current = controller.getSnapshot();
  if (!controller.canEdit() || current.candidate)
    return { ok: false, code: 'stale' };
  const piece = current.workspace?.current.furniture.find(
    (item) => item.id === current.presentation.selectedId,
  );
  if (piece)
    return controller.dispatch(
      [{ type: 'remove', id: piece.id, overrideLocks: true }],
      'Delete piece',
    );
  const feature = current.workspace?.current.room.features.find(
    (item) => item.id === current.presentation.selectedId,
  );
  if (!feature) return { ok: false, code: 'out-of-scope' };
  return controller.dispatch(
    [{ type: 'remove-feature', id: feature.id }],
    `Delete ${feature.kind}`,
  );
}
