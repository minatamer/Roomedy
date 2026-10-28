import { openingMaterialsLabel } from '@roomedy/contracts/furniture-materials';
import { furnitureMaterialsLabel } from '@roomedy/contracts/furniture-materials';
import { furnitureBottom, featureLabel } from '@roomedy/spatial';
import type { RoomDocument } from '@roomedy/contracts/room';
import { surfacePreviewChanges } from './preview-surface-changes';

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const measurement = (value: { value: number | null; status: string }) =>
  value.value === null
    ? 'unknown'
    : `${value.value} mm (${value.status === 'estimated' ? 'estimate' : value.status})`;
const facing = (turns: number) => ['south', 'west', 'north', 'east'][turns];
/** Review actual semantic differences, including explicit measurements, openings and protections. */
export function PreviewChangeList({
  current,
  proposed,
  className,
}: {
  current: RoomDocument;
  proposed: RoomDocument;
  className: string | undefined;
}) {
  const rows: { id: string; text: string }[] = [];
  for (const piece of proposed.furniture) {
    const before = current.furniture.find((item) => item.id === piece.id);
    if (same(before, piece)) continue;
    const details: string[] = [];
    if (before && before.catalogueId !== piece.catalogueId)
      details.push(piece.label);
    if (!before)
      details.push(
        `${piece.dimensions.width.value ?? '?'} × ${piece.dimensions.depth.value ?? '?'} × ${piece.dimensions.height.value ?? '?'} mm (planning size)`,
      );
    for (const axis of ['width', 'depth', 'height'] as const)
      if (before && !same(before.dimensions[axis], piece.dimensions[axis]))
        details.push(
          `${axis}: ${before ? `${measurement(before.dimensions[axis])} → ` : ''}${measurement(piece.dimensions[axis])}`,
        );
    if (
      before &&
      (before.pose.centerX !== piece.pose.centerX ||
        before.pose.centerZ !== piece.pose.centerZ)
    )
      details.push(
        `position X ${piece.pose.centerX}, Z ${piece.pose.centerZ} mm`,
      );
    if (
      (!before && furnitureBottom(piece) !== 0) ||
      (before && furnitureBottom(before) !== furnitureBottom(piece))
    )
      details.push(
        `bottom edge: ${before ? `${furnitureBottom(before) ?? 'unknown'} → ` : ''}${furnitureBottom(piece) ?? 'unknown'} mm above floor (planned)`,
      );
    if (!before || before.pose.quarterTurns !== piece.pose.quarterTurns)
      details.push(`front facing ${facing(piece.pose.quarterTurns)}`);
    if (!before || before.finish !== piece.finish)
      details.push(`finish ${piece.finish}`);
    if (piece.materials && !same(before?.materials, piece.materials))
      details.push(furnitureMaterialsLabel(piece.materials));
    if (!before || before.ownership !== piece.ownership)
      details.push(piece.ownership === 'owned' ? 'owned' : 'proposed');
    if (before && before.preference !== piece.preference)
      details.push(
        `preference ${piece.preference === 'replace' ? 'may replace' : piece.preference}`,
      );
    if (before)
      for (const key of ['position', 'rotation', 'dimensions'] as const)
        if (before.locks[key] !== piece.locks[key])
          details.push(`${key} ${piece.locks[key] ? 'locked' : 'unlocked'}`);
    rows.push({
      id: piece.id,
      text: `${before ? 'Change' : 'Add'} ${before?.label ?? piece.label}: ${details.join(' · ')}`,
    });
  }
  for (const piece of current.furniture)
    if (!proposed.furniture.some((item) => item.id === piece.id))
      rows.push({ id: piece.id, text: `Remove ${piece.label} from this plan` });
  const roomDetails: string[] = [];
  for (const axis of ['width', 'depth', 'height'] as const)
    if (!same(current.room[axis], proposed.room[axis]))
      roomDetails.push(
        `${axis}: ${measurement(current.room[axis])} → ${measurement(proposed.room[axis])}`,
      );
  roomDetails.push(...surfacePreviewChanges(current, proposed));
  if (!same(current.intent, proposed.intent))
    roomDetails.push(
      `starting condition ${proposed.intent.condition}; goals ${proposed.intent.goals.join(', ') || 'none'}; style ${proposed.intent.style}`,
    );
  if (roomDetails.length)
    rows.push({
      id: proposed.roomId,
      text: `Room: ${roomDetails.join(' · ')}`,
    });
  for (const feature of proposed.room.features) {
    const before = current.room.features.find((item) => item.id === feature.id);
    if (same(before, feature)) continue;
    const details: string[] = [];
    if (
      feature.kind !== 'obstacle' &&
      feature.materials &&
      !same(
        before && before.kind !== 'obstacle' ? before.materials : undefined,
        feature.materials,
      )
    )
      details.push(openingMaterialsLabel(feature.materials));
    for (const key of [
      'wall',
      'width',
      'height',
      'offset',
      'sill',
      'projection',
      'mechanism',
      'hinge',
      'purpose',
    ] as const) {
      const after = (feature as unknown as Record<string, unknown>)[key],
        prior = before && (before as unknown as Record<string, unknown>)[key];
      if (after === undefined || same(prior, after)) continue;
      if (key === 'purpose') {
        details.push(
          `leads to ${after === 'bathroom' ? 'bathroom' : 'hall / adjoining space'}`,
        );
        continue;
      }
      details.push(
        `${key}: ${typeof after === 'object' && after !== null && 'value' in after ? measurement(after as { value: number | null; status: string }) : String(after)}`,
      );
    }
    rows.push({
      id: feature.id,
      text: `${before ? 'Change' : 'Add'} ${featureLabel(feature).toLowerCase()}: ${details.join(' · ')}`,
    });
  }
  for (const feature of current.room.features)
    if (!proposed.room.features.some((item) => item.id === feature.id))
      rows.push({
        id: feature.id,
        text: `Remove ${featureLabel(feature).toLowerCase()}`,
      });
  return rows.length ? (
    <ul className={className}>
      {rows.map((row) => (
        <li key={row.id}>{row.text}</li>
      ))}
    </ul>
  ) : null;
}
