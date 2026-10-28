import { createManualRoom } from './manual-room';
import { FINISH_PALETTE } from '../../catalogue/finishes';
import type { RoomCondition } from './entry-state';

/** Server-rendered authored choice context; never a visitor draft or controller. */
export function EntryRoomPreview({ condition }: { condition: RoomCondition }) {
  const room = createManualRoom(condition);
  const width = room.room.width.value,
    depth = room.room.depth.value;
  if (width === null || depth === null) return null;
  return (
    <svg
      viewBox={`-300 -300 ${width + 600} ${depth + 600}`}
      aria-hidden="true"
      data-entry-preview={condition}
    >
      <rect
        width={width}
        height={depth}
        rx="65"
        fill={FINISH_PALETTE[room.room.floorFinish]}
        stroke="#9b7a56"
        strokeWidth="45"
      />
      {room.room.features
        .filter(
          (f) =>
            f.kind === 'window' &&
            f.wall === 'north' &&
            f.offset.value !== null &&
            f.width.value !== null,
        )
        .map((f) => (
          <rect
            key={f.id}
            x={f.offset.value!}
            y="-35"
            width={f.width.value!}
            height="85"
            rx="15"
            fill="#c2cbbf"
            stroke="#fff6e7"
            strokeWidth="35"
          />
        ))}
      {room.furniture.map((piece) => {
        const w = piece.dimensions.width.value,
          d = piece.dimensions.depth.value;
        if (w === null || d === null) return null;
        return (
          <g
            key={piece.id}
            transform={`translate(${piece.pose.centerX} ${piece.pose.centerZ}) rotate(${piece.pose.quarterTurns * 90})`}
          >
            <rect
              x={-w / 2}
              y={-d / 2}
              width={w}
              height={d}
              rx="55"
              fill={
                piece.materials?.bodyColor ??
                piece.materials?.softColor ??
                FINISH_PALETTE[piece.finish]
              }
              stroke="#816346"
              strokeWidth="22"
            />
            {piece.catalogueId === 'procedural-bed' && (
              <>
                <rect
                  x={-w / 2 + 80}
                  y={-d / 2 + 100}
                  width={w - 160}
                  height={d * 0.25}
                  rx="55"
                  fill="#f7eee0"
                />
                <path
                  d={`M${-w / 2 + 80} ${-d / 2 + d * 0.36}H${w / 2 - 80}`}
                  stroke="#f7eee0"
                  strokeWidth="50"
                />
              </>
            )}
          </g>
        );
      })}
      {room.room.features
        .filter(
          (f) =>
            f.kind === 'door' &&
            f.wall === 'south' &&
            f.offset.value !== null &&
            f.width.value !== null,
        )
        .map((f) => (
          <path
            key={f.id}
            d={`M${f.offset.value} ${depth}v${-f.width.value!}a${f.width.value} ${f.width.value} 0 0 1 ${f.width.value} ${f.width.value}`}
            fill="none"
            stroke="#a78762"
            strokeWidth="25"
            strokeDasharray="65 45"
          />
        ))}
    </svg>
  );
}
