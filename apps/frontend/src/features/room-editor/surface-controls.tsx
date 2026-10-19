import { useId, useRef, useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import {
  FINISH_COLORS,
  SURFACE_OPTIONS,
  SURFACE_TEXTURES,
  roomSurface,
  surfaceColorSchema,
} from '@roomedy/contracts/surfaces';
import type {
  SurfaceTarget,
  SurfaceTexture,
} from '@roomedy/contracts/surfaces';
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
  const validColor = surfaceColorSchema.safeParse(hex).success;
  const [error, setError] = useState('');
  const name = target === 'walls' ? 'Walls' : 'Floor';
  const appearance = room.room.surfaces?.[target];
  const preset =
    Object.entries(FINISH_COLORS).find(([, hex]) => hex === color)?.[0] ?? '';
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
        setError(
          onApply(
            [
              {
                type: 'set-room-surface',
                surface: target,
                color: hex.toLowerCase(),
                texture,
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
            Custom {target === 'walls' ? 'wall' : 'floor'} colour
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
      {appearance?.color.status === 'estimated' && (
        <p className={styles.hint}>
          Colour estimated from photos; lighting can affect it.
        </p>
      )}
      {appearance?.color.status === 'unknown' && (
        <p className={styles.hint}>Default colour.</p>
      )}
      <label>
        {name} texture
        <select
          value={texture}
          onChange={(event) => setTexture(event.target.value as SurfaceTexture)}
        >
          {SURFACE_OPTIONS[target].map((value) => (
            <option key={value} value={value}>
              {SURFACE_TEXTURES[value]}
            </option>
          ))}
        </select>
      </label>
      {appearance?.texture.status === 'estimated' && (
        <p className={styles.hint}>Texture estimated from photos.</p>
      )}
      {appearance?.texture.status === 'unknown' && (
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
        disabled={
          validColor && color === current.color && texture === current.texture
        }
      >
        Apply {target === 'walls' ? 'wall' : 'floor'} finish
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
  return (
    <div className={styles.surfaceControls}>
      {(['walls', 'floor'] as const).map((target) => (
        <SurfaceForm
          key={`${room.roomId}:${target}:${JSON.stringify(room.room.surfaces?.[target])}:${room.room.floorFinish}:${room.room.wallFinish}`}
          room={room}
          target={target}
          onApply={onApply}
        />
      ))}
    </div>
  );
}
