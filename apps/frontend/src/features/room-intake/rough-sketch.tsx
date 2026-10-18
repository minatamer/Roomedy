import type { KeyboardEvent } from 'react';
import { footprint, findCatalogueEntry, wallBand } from '@roomedy/spatial';
import { planBox } from '../plan-view/adapter';
import type { ReviewDraft, ReviewQuestion } from './draft';
import styles from './intake.module.css';

export function RoughSketch({
  draft,
  selectedId,
  question,
  onSelect,
}: {
  draft: ReviewDraft;
  selectedId: string;
  question: ReviewQuestion | null;
  onSelect: (id: string) => void;
}) {
  const doc = draft.room,
    w = doc.room.width.value ?? 4200,
    d = doc.room.depth.value ?? 4800,
    box = planBox(doc, { zoom: 1, panX: 0, panZ: 0 });
  const choose = (id: string) => ({
    onClick: () => onSelect(id),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(id);
      }
    },
  });
  return (
    <div className={styles.sketch}>
      <svg
        viewBox={`${box.x} ${box.z} ${box.width} ${box.depth}`}
        role="group"
        aria-label="Rough 2D room sketch. Positions and unknown sizes are illustrative until reviewed."
      >
        <rect
          x="0"
          y="0"
          width={w}
          height={d}
          rx="35"
          fill="#eee2cd"
          stroke={selectedId === doc.roomId ? '#735137' : '#a18a6c'}
          strokeWidth="40"
          strokeDasharray={
            doc.room.width.value === null || doc.room.depth.value === null
              ? '100 55'
              : undefined
          }
          role="button"
          tabIndex={0}
          aria-label="Select room measurements"
          {...choose(doc.roomId)}
        />
        {doc.room.features.map((f) => {
          const region = wallBand(doc, f, 100);
          if (!region) return null;
          return (
            <g
              key={f.id}
              role="button"
              tabIndex={0}
              aria-label={`${f.kind}, ${f.wall} wall, select to review`}
              {...choose(f.id)}
            >
              <line
                x1={region.minX}
                y1={region.minZ}
                x2={region.maxX}
                y2={region.maxZ}
                stroke={
                  selectedId === f.id
                    ? '#735137'
                    : f.kind === 'window'
                      ? '#709795'
                      : '#ad7851'
                }
                strokeWidth="110"
              />
              <text
                x={(region.minX + region.maxX) / 2}
                y={(region.minZ + region.maxZ) / 2 - 160}
                textAnchor="middle"
                fontSize="115"
                fill="#5b4532"
              >
                {f.kind}
              </text>
            </g>
          );
        })}
        {doc.furniture.map((p) => {
          const entry = findCatalogueEntry(p.catalogueId, p.catalogueVersion),
            actual = footprint(p),
            width =
              p.dimensions.width.value ?? entry?.size.width.default ?? 600,
            depth =
              p.dimensions.depth.value ?? entry?.size.depth.default ?? 600,
            illustrative = !actual;
          return (
            <g
              key={p.id}
              transform={`translate(${p.pose.centerX} ${p.pose.centerZ}) rotate(${p.pose.quarterTurns * 90})`}
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === p.id}
              aria-label={`${p.label}, ${illustrative ? 'illustrative size' : 'reviewed footprint'}, select to review`}
              {...choose(p.id)}
            >
              <rect
                x={-width / 2}
                y={-depth / 2}
                width={width}
                height={depth}
                rx="40"
                fill={p.ownership === 'owned' ? '#c9ab83' : '#dfccb0'}
                stroke={selectedId === p.id ? '#644329' : '#98764f'}
                strokeWidth={selectedId === p.id ? 45 : 22}
                strokeDasharray={illustrative ? '90 55' : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="120"
                fill="#4f3b2b"
              >
                {entry?.category ?? 'Piece'}
                {illustrative ? ' ≈' : ''}
              </text>
              <line
                x1={-width * 0.15}
                y1={depth / 2 - 45}
                x2={width * 0.15}
                y2={depth / 2 - 45}
                stroke="#795b3c"
                strokeWidth="35"
              />
            </g>
          );
        })}
        <line
          x1="0"
          y1="-220"
          x2={w}
          y2="-220"
          stroke={
            question?.kind === 'room' && question.field === 'width'
              ? '#a96934'
              : '#a18a6c'
          }
          strokeWidth="22"
        />
        <text
          x={w / 2}
          y="-350"
          textAnchor="middle"
          fontSize="130"
          fill="#5b4532"
        >
          {doc.room.width.value === null
            ? 'Width unknown'
            : `${doc.room.width.value} mm · ${doc.room.width.status}`}
        </text>
        <text
          transform={`translate(${-330} ${d / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="130"
          fill="#5b4532"
        >
          {doc.room.depth.value === null
            ? 'Depth unknown'
            : `${doc.room.depth.value} mm · ${doc.room.depth.status}`}
        </text>
      </svg>
      <p>Top edge = your reference wall · Dashed sizes are illustrative</p>
    </div>
  );
}
