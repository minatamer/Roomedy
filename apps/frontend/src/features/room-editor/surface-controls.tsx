import { useId, useRef, useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import {
  FINISH_COLORS,
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
  const hexInput = useRef<HTMLInputElement>(null);
  const patternWidthInput = useRef<HTMLInputElement>(null);
  const patternHeightInput = useRef<HTMLInputElement>(null);
  const validColor = surfaceColorSchema.safeParse(hex).success;
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(() => ({
    ...roomSurfaceDetail(room.room, target),
  }));
  const updateDetail = (next: SurfaceDetail) => {
    setDetail(next);
    setError('');
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
  const preset =
    Object.entries(FINISH_COLORS).find(([, hex]) => hex === color)?.[0] ?? '';
  const patch = changedRoomSurface(room.room, target, {
    color: hex,
    texture,
    detail,
  });
  return (
    <form
      noValidate
      className={styles.surfaceForm}
      onSubmit={(event) => {
        event.preventDefault();
        if (!validColor) {
          setError('Use a six-digit colour, for example #8eaa96.');
          hexInput.current?.focus();
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
      <h3>{name}</h3>
      <div
        className={styles.surfacePreview}
        data-texture={texture}
        style={{ backgroundColor: color }}
        role="img"
        aria-label={`${name}: ${color}, ${SURFACE_TEXTURES[texture]}`}
      />
      <div className={styles.twoFields}>
        <label>
          {name} colour
          <select
            value={preset}
            onChange={(event) => {
              const chosen =
                FINISH_COLORS[event.target.value as keyof typeof FINISH_COLORS];
              if (chosen) {
                setColor(chosen);
                setHex(chosen);
                setError('');
              }
            }}
          >
            <option value="" disabled>
              Custom
            </option>
            {Object.keys(FINISH_COLORS).map((finish) => (
              <option key={finish} value={finish}>
                {finish[0]!.toUpperCase() + finish.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <div>
          <label htmlFor={`${id}-picker`}>
            Custom {target === 'floor' ? 'floor' : 'wall'} colour
          </label>
          <div className={styles.colourInput}>
            <input
              id={`${id}-picker`}
              type="color"
              value={color}
              onChange={(event) => {
                setColor(event.target.value);
                setHex(event.target.value);
                setError('');
              }}
            />
            <input
              ref={hexInput}
              aria-label={`${name} colour hex`}
              type="text"
              maxLength={7}
              value={hex}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!validColor}
              aria-describedby={error && !validColor ? id : undefined}
              onChange={(event) => {
                setHex(event.target.value);
                if (surfaceColorSchema.safeParse(event.target.value).success) {
                  setColor(event.target.value.toLowerCase());
                  setError('');
                }
              }}
            />
          </div>
        </div>
      </div>
      {colorEvidence?.status === 'estimated' && (
        <p className={styles.hint}>
          Colour estimated from photos; lighting can affect it.
        </p>
      )}
      {colorEvidence?.status === 'unknown' && (
        <p className={styles.hint}>Default colour.</p>
      )}
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
            onClick={() => setTexture(value)}
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
      <details className={styles.materialDetails}>
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
      {textureEvidence?.status === 'estimated' && (
        <p className={styles.hint}>Texture estimated from photos.</p>
      )}
      {textureEvidence?.status === 'unknown' && (
        <p className={styles.hint}>Default texture.</p>
      )}
      {error && (
        <p id={id} role="alert" className={styles.surfaceError}>
          {error}
        </p>
      )}
      <button
        type="submit"
        aria-describedby={error ? id : undefined}
        disabled={validColor && patch === null}
      >
        Apply {name.toLowerCase()} finish
      </button>
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
  return (
    <div className={styles.surfaceControls}>
      <label>
        Customize surface
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value as SurfaceTarget)}
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
        key={`${room.roomId}:${target}:${JSON.stringify(room.room.surfaces)}:${room.room.floorFinish}:${room.room.wallFinish}`}
        room={room}
        target={target}
        onApply={onApply}
      />
    </div>
  );
}
