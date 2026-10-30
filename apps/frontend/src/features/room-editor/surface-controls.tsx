import { ColourPicker } from './colour-picker';
import { useId, useRef, useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import {
  SURFACE_OPTIONS,
  SURFACE_TEXTURES,
  roomSurface,
  surfaceColorSchema,
  roomSurfaceDetail,
  WALLS,
  surfaceDetailSchema,
  changedRoomSurface,
} from '@roomedy/contracts/surfaces';
import type { SurfaceTarget, SurfaceDetail } from '@roomedy/contracts/surfaces';
import styles from './editor.module.css';
import { focusInvalidInspector } from './inspector-tabs';
import layout from './appearance-controls.module.css';

type Apply = (actions: VisitorAction[], label: string) => string | null;
function SurfaceForm({
  room,
  target,
  onApply,
}: {
  room: RoomDocument;
  target: SurfaceTarget;
  onApply: Apply;
}) {
  const current = roomSurface(room.room, target),
    id = useId();
  const [color, setColor] = useState(current.color),
    [hex, setHex] = useState(current.color),
    [texture, setTexture] = useState(current.texture);
  const patternWidthInput = useRef<HTMLInputElement>(null);
  const patternHeightInput = useRef<HTMLInputElement>(null);
  const validColor = surfaceColorSchema.safeParse(hex).success;
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(() => ({
    ...roomSurfaceDetail(room.room, target),
  }));
  const signature = JSON.stringify([
    current,
    roomSurfaceDetail(room.room, target),
  ]);
  const [source, setSource] = useState(signature);
  if (source !== signature) {
    setSource(signature);
    setColor(current.color);
    setHex(current.color);
    setTexture(current.texture);
    setDetail({ ...roomSurfaceDetail(room.room, target) });
  }
  function preview(
    next: {
      hex?: string;
      texture?: typeof texture;
      detail?: SurfaceDetail;
    } = {},
  ) {
    const colour = next.hex ?? hex;
    const nextDetail = next.detail ?? detail;
    if (
      !surfaceColorSchema.safeParse(colour).success ||
      !surfaceDetailSchema.safeParse(nextDetail).success
    )
      return;
    const change = changedRoomSurface(room.room, target, {
      color: colour,
      texture: next.texture ?? texture,
      detail: nextDetail,
    });
    setError(
      change
        ? (onApply(
            [{ type: 'set-room-surface', ...change }],
            `Change ${target} finish`,
          ) ?? '')
        : '',
    );
  }
  const updateDetail = (next: SurfaceDetail) => {
    setDetail(next);
    setError('');
    preview({ detail: next });
  };
  const name =
    target === 'walls'
      ? 'All walls'
      : target === 'floor'
        ? 'Floor'
        : `${target[0]!.toUpperCase()}${target.slice(1)} wall`;
  const appearance = room.room.surfaces?.[target];
  const inherited = target === 'floor' ? undefined : room.room.surfaces?.walls;
  const colorEvidence = appearance?.color.value
    ? appearance.color
    : (inherited?.color ?? appearance?.color);
  const textureEvidence = appearance?.texture.value
    ? appearance.texture
    : (inherited?.texture ?? appearance?.texture);
  const patch = changedRoomSurface(room.room, target, {
    color: hex,
    texture,
    detail,
  });
  return (
    <form
      noValidate
      data-inspector-invalid={
        !validColor ||
        !surfaceDetailSchema.safeParse(detail).success ||
        !!error ||
        undefined
      }
      className={`${styles.surfaceForm} ${layout.group}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!validColor) {
          setError('Use a six-digit colour, for example #8eaa96.');
          return;
        }
        if (!surfaceDetailSchema.safeParse(detail).success) {
          setError('Use pattern dimensions from 10 to 300 cm.');
          const widthValid =
            Number.isInteger(detail.repeatWidthMm) &&
            detail.repeatWidthMm >= 100 &&
            detail.repeatWidthMm <= 3000;
          (widthValid
            ? patternHeightInput
            : patternWidthInput
          ).current?.focus();
          return;
        }
        if (!patch) return;
        setError(
          onApply(
            [
              {
                type: 'set-room-surface',
                ...patch,
              },
            ],
            `Change ${target} finish`,
          ) ?? '',
        );
      }}
    >
      <ColourPicker
        label={`${name} colour`}
        displayLabel="Colour"
        value={hex}
        onChange={(value) => {
          setHex(value);
          if (surfaceColorSchema.safeParse(value).success) setColor(value);
          setError('');
          preview({ hex: value });
        }}
      />
      {(colorEvidence?.status === 'estimated' ||
        textureEvidence?.status === 'estimated') && (
        <p className={styles.hint}>
          Appearance estimated from photos; lighting can affect colours.
        </p>
      )}
      <details className={layout.disclosure}>
        <summary>
          Material
          <span className={layout.materialSummary}>
            <span
              className={`${styles.surfacePreview} ${layout.swatch}`}
              data-texture={texture}
              style={{ backgroundColor: color }}
              role="img"
              aria-label={`${name}: ${color}, ${SURFACE_TEXTURES[texture]}`}
            />
            {SURFACE_TEXTURES[texture]}
          </span>
        </summary>
        <div
          className={styles.materialChoices}
          role="group"
          aria-label={`${name} materials`}
        >
          {SURFACE_OPTIONS[target].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={texture === value}
              className={styles.materialChoice}
              data-texture={value}
              onClick={() => {
                setTexture(value);
                preview({ texture: value });
              }}
            >
              <span
                style={{ backgroundColor: color }}
                data-texture={value}
                aria-hidden="true"
              />
              {SURFACE_TEXTURES[value]}
            </button>
          ))}
        </div>
      </details>
      <details className={`${styles.materialDetails} ${layout.disclosure}`}>
        <summary>Pattern &amp; finish</summary>
        <div className={styles.twoFields}>
          {(['repeatWidthMm', 'repeatHeightMm'] as const).map((field) => (
            <label key={field}>
              Pattern {field === 'repeatWidthMm' ? 'width' : 'height'} (cm)
              <input
                type="number"
                ref={
                  field === 'repeatWidthMm'
                    ? patternWidthInput
                    : patternHeightInput
                }
                min={10}
                max={300}
                step={0.1}
                value={Number.isFinite(detail[field]) ? detail[field] / 10 : ''}
                aria-invalid={
                  !Number.isFinite(detail[field]) ||
                  detail[field] < 100 ||
                  detail[field] > 3000
                }
                onChange={(event) =>
                  updateDetail({
                    ...detail,
                    [field]: Math.round(event.target.valueAsNumber * 10),
                  })
                }
              />
            </label>
          ))}
          <label>
            Direction
            <select
              value={detail.direction}
              onChange={(event) =>
                updateDetail({
                  ...detail,
                  direction: Number(
                    event.target.value,
                  ) as SurfaceDetail['direction'],
                })
              }
            >
              {[0, 1, 2, 3].map((turn) => (
                <option key={turn} value={turn}>
                  {turn * 90}°
                </option>
              ))}
            </select>
          </label>
          <label>
            Finish
            <select
              value={detail.sheen}
              onChange={(event) =>
                updateDetail({
                  ...detail,
                  sheen: event.target.value as SurfaceDetail['sheen'],
                })
              }
            >
              <option value="matte">Matte</option>
              <option value="satin">Satin</option>
              <option value="gloss">Gloss</option>
            </select>
          </label>
        </div>
      </details>
      {error && (
        <p id={id} role="alert" className={styles.surfaceError}>
          {error}
        </p>
      )}
    </form>
  );
}
export function SurfaceControls({
  room,
  onApply,
}: {
  room: RoomDocument;
  onApply: Apply;
}) {
  const [target, setTarget] = useState<SurfaceTarget>('walls');
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`${styles.surfaceControls} ${layout.stack} ${layout.surface}`}
      ref={root}
    >
      <label>
        Surface
        <select
          aria-label="Customize surface"
          value={target}
          onChange={(event) => {
            if (!focusInvalidInspector(root.current))
              setTarget(event.target.value as SurfaceTarget);
          }}
        >
          <option value="floor">Floor</option>
          <option value="walls">All walls</option>
          {WALLS.map((wall) => (
            <option key={wall} value={wall}>
              {wall[0]!.toUpperCase()}
              {wall.slice(1)} wall
            </option>
          ))}
        </select>
      </label>
      <SurfaceForm
        key={`${room.roomId}:${target}`}
        room={room}
        target={target}
        onApply={onApply}
      />
    </div>
  );
}
