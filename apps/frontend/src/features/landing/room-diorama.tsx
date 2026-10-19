import { useId } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import { corners, findCatalogueEntry, footprint } from '@roomedy/spatial';
import { FINISH_PALETTE } from '../catalogue/finishes';
import { proceduralParts } from '../room-view/representations/definitions';
import type { BoxPart } from '../room-view/representations/definitions';

const project = (x: number, y: number, z: number) =>
  `${(x - z) * 0.07},${(x + z) * 0.035 - y * 0.08}`;
function shade(color: string, factor: number) {
  return (
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.min(255, Math.round(parseInt(color.slice(i, i + 2), 16) * factor))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function Solid({
  part,
  color,
  turns = 0,
}: {
  part: BoxPart;
  color: string;
  turns?: number;
}) {
  const [x, y, z] = part.center,
    [w, h, d] = part.size;
  const point = (a: number, b: number, c: number) => {
    for (let i = 0; i < turns; i++) [a, c] = [-c, a];
    return project(a, b, c);
  };
  const corners = [
    [x - w / 2, y + h / 2, z - d / 2],
    [x + w / 2, y + h / 2, z - d / 2],
    [x + w / 2, y + h / 2, z + d / 2],
    [x - w / 2, y + h / 2, z + d / 2],
    [x - w / 2, y - h / 2, z - d / 2],
    [x + w / 2, y - h / 2, z - d / 2],
    [x + w / 2, y - h / 2, z + d / 2],
    [x - w / 2, y - h / 2, z + d / 2],
  ];
  const face = (indices: number[]) =>
    indices
      .map((i) => {
        const c = corners[i]!;
        return point(c[0]!, c[1]!, c[2]!);
      })
      .join(' ');
  // Pick the two camera-facing side faces after canonical quarter turns.
  const sides = [
    [
      [1, 2, 6, 5],
      [2, 3, 7, 6],
    ],
    [
      [0, 1, 5, 4],
      [1, 2, 6, 5],
    ],
    [
      [3, 0, 4, 7],
      [0, 1, 5, 4],
    ],
    [
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ],
  ][turns % 4]!;
  return (
    <g stroke="#604b3820" strokeWidth=".65" strokeLinejoin="round">
      <polygon points={face(sides[0]!)} fill={shade(color, 0.76)} />
      <polygon points={face(sides[1]!)} fill={shade(color, 0.91)} />
      <polygon points={face([0, 1, 2, 3])} fill={shade(color, 1.08)} />
    </g>
  );
}

export function RoomDiorama({
  room,
  stage,
}: {
  room: RoomDocument;
  stage: 'original' | 'preview' | 'applied' | 'undone';
}) {
  const shadow = useId().replace(/:/g, '');
  const w = room.room.width.value ?? 4200,
    d = room.room.depth.value ?? 4800;
  const floor = (a: number, b: number) => project(a, 0, b);
  const pieces = room.furniture
    .slice()
    .sort(
      (a, b) =>
        a.pose.centerX + a.pose.centerZ - b.pose.centerX - b.pose.centerZ,
    );
  return (
    <svg
      className="room-diorama"
      viewBox={`${-d * 0.07 - 65} -210 ${(w + d) * 0.07 + 130} ${(w + d) * 0.035 + 280}`}
      role="img"
      aria-label="Bedroom and workspace in three dimensions. The desk and chair move together toward the window."
    >
      <defs>
        <filter id={shadow} x="-30%" y="-50%" width="160%" height="200%">
          <feDropShadow
            dx="0"
            dy="16"
            stdDeviation="17"
            floodColor="#63482f"
            floodOpacity=".18"
          />
        </filter>
      </defs>
      <g className="diorama-floor" filter={`url(#${shadow})`}>
        <Solid
          part={{
            name: 'floor',
            center: [w / 2, -75, d / 2],
            size: [w, 150, d],
            role: 'frame',
          }}
          color="#c9a77d"
        />
      </g>
      <g stroke="#b49169" strokeWidth="1" opacity=".55">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M${floor((w * (i + 1)) / 13, 0)}L${floor((w * (i + 1)) / 13, d)}`}
          />
        ))}
      </g>
      <g className="diorama-walls">
        <Solid
          part={{
            name: 'north',
            center: [w / 2, 900, -45],
            size: [w + 90, 1800, 90],
            role: 'frame',
          }}
          color="#e7daca"
        />
        <Solid
          part={{
            name: 'west',
            center: [-45, 900, d / 2],
            size: [90, 1800, d + 90],
            role: 'frame',
          }}
          color="#e7daca"
        />
        {room.room.features
          .filter((f) => f.kind === 'window' && f.wall === 'north')
          .map((f) => {
            const start = f.offset.value ?? 0,
              end = start + (f.width.value ?? 1200);
            return (
              <g
                key={f.id}
                stroke="#fff8ed"
                strokeWidth="7"
                strokeLinejoin="round"
              >
                <polygon
                  points={`${project(start, 650, 2)} ${project(end, 650, 2)} ${project(end, 1650, 2)} ${project(start, 1650, 2)}`}
                  fill="#bdd0cc"
                />
                <path
                  d={`M${project((start + end) / 2, 650, 2)}L${project((start + end) / 2, 1650, 2)}`}
                />
              </g>
            );
          })}
      </g>
      {stage === 'preview' &&
        pieces
          .filter((item) => item.id === 'desk_1' || item.id === 'chair_1')
          .map((item) => {
            const target = footprint({
              ...item,
              pose: { ...item.pose, centerZ: item.pose.centerZ - 350 },
            });
            return target ? (
              <polygon
                key={`target-${item.id}`}
                points={corners(target)
                  .map(([x, z]) => project(x, 4, z))
                  .join(' ')}
                fill="#795b3a18"
                stroke="#795b3a"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
            ) : null;
          })}
      {pieces.map((item, index) => {
        const entry = findCatalogueEntry(
          item.catalogueId,
          item.catalogueVersion,
        );
        const width = item.dimensions.width.value,
          depth = item.dimensions.depth.value,
          height = item.dimensions.height.value;
        if (!entry || width === null || depth === null || height === null)
          return null;
        const moving = item.id === 'desk_1' || item.id === 'chair_1';
        const shift = moving && stage === 'applied' ? -350 : 0;
        const position = project(
          item.pose.centerX,
          0,
          item.pose.centerZ + shift,
        ).split(',');
        const parts = proceduralParts(
          entry.category,
          { width, depth, height },
          entry.accessMechanism,
        ).sort((a, b) => a.center[1] - b.center[1]);
        return (
          <g
            key={item.id}
            className="diorama-piece"
            style={{
              transform: `translate(${position[0]}px,${position[1]}px)`,
            }}
          >
            <g
              className="diorama-object"
              style={{ animationDelay: `${index * 85}ms` }}
            >
              {parts.map((part) => (
                <Solid
                  key={part.name}
                  part={part}
                  turns={item.pose.quarterTurns}
                  color={
                    part.role === 'metal'
                      ? '#675443'
                      : part.role === 'soft'
                        ? part.name === 'blanket'
                          ? '#bd8062'
                          : '#f2e7d6'
                        : FINISH_PALETTE[item.finish]
                  }
                />
              ))}
              {moving && (stage === 'preview' || stage === 'applied') && (
                <ellipse
                  cx="0"
                  cy="4"
                  rx="38"
                  ry="15"
                  fill="none"
                  stroke="#795b3a"
                  strokeWidth="2"
                  strokeDasharray={stage === 'preview' ? '5 4' : undefined}
                />
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
