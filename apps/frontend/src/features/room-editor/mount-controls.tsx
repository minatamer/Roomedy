import { useId, useRef, useState } from 'react';
import type { Furniture } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import {
  placementTarget,
  findCatalogueEntry,
  furnitureBottom,
  wallMountedPose,
} from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './editor.module.css';

/** Planned vertical placement uses the same move/lock/check/Undo owner as X and Z. */
export function MountControls({
  controller,
  item,
  advanced = false,
}: {
  controller: SessionController;
  item: Furniture;
  advanced?: boolean;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion);
  const bottom = furnitureBottom(item);
  const [value, setValue] = useState(String(bottom ?? ''));
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null),
    errorId = useId();
  if (!entry?.placement || entry.placement === 'floor') return null;
  const apply = (pose: Furniture['pose']) => {
    const room = controller.getSnapshot().workspace?.current;
    if (!room) return;
    const result = controller.dispatch(
      [
        {
          type: 'move',
          id: item.id,
          pose: placementTarget(wallMountedPose(room, item, pose)),
        },
      ],
      'Change TV mounting',
    );
    setError(result.ok ? '' : failureMessage(result, room));
  };
  if (advanced)
    return (
      <form
        className={styles.section}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const number = Number(value);
          if (
            !value.trim() ||
            !Number.isFinite(number) ||
            number < 0 ||
            number > POLICY.roomEdgeMm ||
            !Number.isInteger(number * 2)
          ) {
            setError(
              `Enter a height from 0 to ${POLICY.roomEdgeMm} mm in 0.5 mm steps.`,
            );
            input.current?.focus();
            return;
          }
          apply({ ...item.pose, bottomY: number });
        }}
      >
        <label>
          Bottom edge above floor (mm)
          <input
            ref={input}
            type="number"
            step="0.5"
            min="0"
            max={POLICY.roomEdgeMm}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            disabled={item.locks.position}
          />
        </label>
        <button type="submit" disabled={item.locks.position}>
          Apply mounting height
        </button>
        {error && (
          <p id={errorId} role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </form>
    );
  const heights =
    entry.placement === 'wall' ? [800, 1000, 1200] : [450, 600, 750];
  return (
    <div className={styles.section}>
      {entry.placement === 'wall' && (
        <label>
          Mounting wall
          <select
            value={item.pose.quarterTurns}
            disabled={item.locks.position || item.locks.rotation}
            onChange={(e) =>
              apply({
                ...item.pose,
                quarterTurns: Number(e.target.value) as 0 | 1 | 2 | 3,
              })
            }
          >
            <option value="0">North</option>
            <option value="1">East</option>
            <option value="2">South</option>
            <option value="3">West</option>
          </select>
        </label>
      )}
      <label>
        {entry.placement === 'wall' ? 'Screen position' : 'Supporting surface'}
        <select
          value={bottom !== null && heights.includes(bottom) ? bottom : ''}
          disabled={item.locks.position}
          onChange={(e) =>
            apply({ ...item.pose, bottomY: Number(e.target.value) })
          }
        >
          <option value="" disabled>
            {bottom === null ? 'Choose height' : 'Custom height'}
          </option>
          {heights.map((height, i) => (
            <option key={height} value={height}>
              {entry.placement === 'wall'
                ? ['Low', 'Standard', 'High'][i]
                : ['Low unit', 'TV stand', 'Table'][i]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
