import type { SessionController } from '../session/controller';

export function deleteSelectedFurniture(
  controller: SessionController,
): ReturnType<SessionController['dispatch']> {
  const current = controller.getSnapshot();
  if (!controller.canEdit() || current.candidate)
    return { ok: false, code: 'stale' };
  const piece = current.workspace?.current.furniture.find(
    (item) => item.id === current.presentation.selectedId,
  );
  if (!piece) return { ok: false, code: 'out-of-scope' };
  return controller.dispatch(
    [{ type: 'remove', id: piece.id, overrideLocks: true }],
    'Delete piece',
  );
}
