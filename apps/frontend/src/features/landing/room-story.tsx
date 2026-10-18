'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';

type Stage = 'original' | 'preview' | 'applied' | 'undone';
const words: Record<Stage, string> = {
  original: 'A little more room to work.',
  preview: 'Preview the desk and chair move.',
  applied: 'One change. Applied together.',
  undone: 'Back to where you started.',
};
export function RoomPlan({
  room,
  stage = 'original',
  scripted = false,
}: {
  room: RoomDocument;
  stage?: Stage;
  scripted?: boolean;
}) {
  const pattern = useId().replace(/:/g, '');
  const w = room.room.width.value ?? 4200,
    d = room.room.depth.value ?? 4800;
  return (
    <svg
      className="room-plan"
      viewBox={`-240 -250 ${w + 480} ${d + 500}`}
      role="img"
      aria-label={`Authored room plan with ${room.furniture.length ? room.furniture.map((item) => item.label).join(', ') : 'no furniture'} and ${room.room.features.length} wall features.${scripted ? ' The highlighted desk and chair move toward the window in this scripted example.' : ''}`}
    >
      <defs>
        <pattern
          id={pattern}
          width="500"
          height="500"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0V500M0 250H500"
            stroke="#c5aa83"
            strokeWidth="7"
            opacity=".25"
          />
        </pattern>
      </defs>
      <rect
        x="-65"
        y="-65"
        width={w + 130}
        height={d + 130}
        rx="110"
        fill="#d1bfa4"
      />
      <rect width={w} height={d} fill="#e8d6b8" />
      <rect width={w} height={d} fill={`url(#${pattern})`} />
      <path
        d={`M0 0H${w}V${d}H0Z`}
        fill="none"
        stroke="#75573c"
        strokeWidth="100"
      />
      {room.room.features.map((feature) => {
        if (feature.offset.value === null || feature.width.value === null)
          return null;
        const start = feature.offset.value,
          end = start + feature.width.value;
        if (feature.kind === 'window' && feature.wall === 'north')
          return (
            <g key={feature.id}>
              <path
                d={`M${start} 0H${end}`}
                stroke="#e9d6af"
                strokeWidth="120"
              />
              <path
                d={`M${start} 0H${end}`}
                stroke="#fff8ea"
                strokeWidth="35"
              />
              <text
                x={(start + end) / 2}
                y="-140"
                textAnchor="middle"
                fontSize="130"
                fill="#7a6147"
              >
                WINDOW
              </text>
            </g>
          );
        if (feature.kind === 'door' && feature.wall === 'south')
          return (
            <g key={feature.id}>
              <path
                d={`M${start} ${d}H${end}`}
                stroke="#f4efe5"
                strokeWidth="130"
              />
              <path
                d={`M${start} ${d}V${d - feature.width.value}A${feature.width.value} ${feature.width.value} 0 0 1 ${end} ${d}`}
                fill="none"
                stroke="#ab9475"
                strokeWidth="18"
                strokeDasharray="40 35"
              />
            </g>
          );
        return null;
      })}
      {room.furniture.map((item) => {
        const width = item.dimensions.width.value,
          depth = item.dimensions.depth.value;
        if (width === null || depth === null) return null;
        const category = findCatalogueEntry(
          item.catalogueId,
          item.catalogueVersion,
        )?.category;
        const moved = item.id === 'desk_1' || item.id === 'chair_1';
        const shift = moved && stage === 'applied' ? -350 : 0;
        const colors = {
          bed: '#f8f2e6',
          desk: '#94734d',
          chair: '#c17c60',
          wardrobe: '#ad9775',
          storage: '#b89b77',
        };
        return (
          <g
            key={item.id}
            className={`room-piece ${moved ? 'story-piece' : ''}`}
            style={{
              transform: `translate(${item.pose.centerX}px,${item.pose.centerZ + shift}px) rotate(${item.pose.quarterTurns * 90}deg)`,
            }}
          >
            <rect
              x={-width / 2 + 30}
              y={-depth / 2 + 65}
              width={width}
              height={depth}
              rx="65"
              fill="#50392920"
            />
            <rect
              x={-width / 2}
              y={-depth / 2}
              width={width}
              height={depth}
              rx={category === 'chair' ? 130 : 50}
              fill={colors[category ?? 'storage']}
              stroke="#68492b40"
              strokeWidth="18"
            />
            {category === 'bed' && (
              <>
                <rect
                  x={-width / 2 + 60}
                  y={-depth / 2 + 65}
                  width={width - 120}
                  height="460"
                  rx="110"
                  fill="#fffdf8"
                />
                <path
                  d={`M${-width / 2 + 40} ${-depth / 2 + 650}H${width / 2 - 40}V${depth / 2 - 45}H${-width / 2 + 40}Z`}
                  fill="#c58266"
                />
                <path
                  d={`M${-width / 2 + 40} ${-depth / 2 + 740}H${width / 2 - 40}`}
                  stroke="#e6b49a"
                  strokeWidth="50"
                />
              </>
            )}
            {category === 'desk' && (
              <>
                <rect
                  x="-170"
                  y="-190"
                  width="340"
                  height="230"
                  rx="20"
                  fill="#f4ecdc"
                />
                <path d="M-190 70H190" stroke="#f4ecdc" strokeWidth="25" />
                <circle cx={width / 2 - 140} cy="-110" r="65" fill="#e7ddcc" />
              </>
            )}
            {category === 'wardrobe' && (
              <path
                d={`M0 ${-depth / 2 + 25}V${depth / 2 - 25}`}
                stroke="#8d7353"
                strokeWidth="16"
              />
            )}
            {category === 'storage' && (
              <path
                d={`M${-width / 2 + 30} 0H${width / 2 - 30}`}
                stroke="#866c4d"
                strokeWidth="16"
              />
            )}
            {moved && (stage === 'preview' || stage === 'applied') && (
              <rect
                x={-width / 2 - 45}
                y={-depth / 2 - 45}
                width={width + 90}
                height={depth + 90}
                rx="75"
                fill="none"
                stroke="#78553d"
                strokeWidth="28"
                strokeDasharray={stage === 'preview' ? '65 40' : undefined}
              />
            )}
          </g>
        );
      })}
      {stage === 'preview' &&
        room.furniture
          .filter((item) => item.id === 'desk_1' || item.id === 'chair_1')
          .map((item) => (
            <rect
              key={item.id}
              x={item.pose.centerX - (item.dimensions.width.value ?? 0) / 2}
              y={
                item.pose.centerZ - (item.dimensions.depth.value ?? 0) / 2 - 350
              }
              width={item.dimensions.width.value ?? 0}
              height={item.dimensions.depth.value ?? 0}
              rx="50"
              fill="#78553d15"
              stroke="#78553d"
              strokeWidth="22"
              strokeDasharray="60 45"
            />
          ))}
    </svg>
  );
}
export function RoomStory({ room }: { room: RoomDocument }) {
  const [stage, setStage] = useState<Stage>('original');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => {
    timers.current = [
      setTimeout(() => setStage('preview'), 650),
      setTimeout(() => setStage('applied'), 1850),
      setTimeout(() => setStage('undone'), 3350),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);
  const choose = (next: Stage) => {
    clear();
    setStage(next);
  };
  return (
    <div className="story-card">
      <div className="story-topline">
        <span className="story-label">Scripted example</span>
        <span>BEDROOM + WORKSPACE</span>
      </div>
      <RoomPlan room={room} stage={stage} scripted />
      <div className="assistant-note">
        <span className="assistant-kicker">
          <span aria-hidden="true">✦</span> Roomedy assistant
        </span>
        <p>“Bring my desk closer to the window.”</p>
      </div>
      <div className="story-bottom">
        <p aria-live="polite">{words[stage]}</p>
        <div className="story-actions" aria-label="Scripted room example">
          <button
            onClick={() => choose('preview')}
            aria-pressed={stage === 'preview'}
          >
            Preview
          </button>
          <button
            onClick={() => choose('applied')}
            disabled={stage !== 'preview'}
          >
            Apply
          </button>
          <button
            onClick={() => choose('undone')}
            disabled={stage !== 'applied'}
          >
            Undo <span aria-hidden="true">↶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
