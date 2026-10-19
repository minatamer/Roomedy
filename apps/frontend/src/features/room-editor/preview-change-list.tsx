import type { RoomDocument } from '@roomedy/contracts/room';

export function PreviewChangeList({
  current,
  proposed,
  className,
}: {
  current: RoomDocument;
  proposed: RoomDocument;
  className: string | undefined;
}) {
  const changed = proposed.furniture
      .filter(
        (piece) =>
          JSON.stringify(piece) !==
          JSON.stringify(
            current.furniture.find((before) => before.id === piece.id),
          ),
      )
      .slice(0, 8),
    removed = current.furniture
      .filter(
        (piece) => !proposed.furniture.some((after) => after.id === piece.id),
      )
      .slice(0, 8);
  if (!changed.length && !removed.length) return null;
  return (
    <ul className={className}>
      {changed.map((piece) => (
        <li key={piece.id}>
          {current.furniture.some((before) => before.id === piece.id)
            ? 'Change'
            : 'Add'}{' '}
          {piece.label} · {piece.ownership === 'owned' ? 'Owned' : 'Proposed'}
        </li>
      ))}
      {removed.map((piece) => (
        <li key={piece.id}>Remove {piece.label} from this plan</li>
      ))}
    </ul>
  );
}
