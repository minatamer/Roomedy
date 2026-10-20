import type { SessionController } from '../session/controller';

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
