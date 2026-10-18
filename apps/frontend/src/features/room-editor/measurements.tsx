import { useId, useRef, useState } from 'react';
import type { VisitorAction } from '@roomedy/contracts/commands';
import type { Measurement } from '@roomedy/contracts/primitives';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './editor.module.css';

export function measurementLabel(value: Measurement) {
  const status =
    value.status === 'scan-derived'
      ? 'Scan derived'
      : value.status[0]!.toUpperCase() + value.status.slice(1);
  const source =
    value.sourceId === 'authored-sample'
      ? 'supplied sample'
      : value.sourceId === 'visitor-confirmed'
        ? 'your measurement'
        : value.sourceId === 'visitor-estimate'
          ? 'your estimate'
          : null;
  return `${status}${source ? ` · ${source}` : ''}`;
}
type Target = Extract<VisitorAction, { type: 'confirm-measurement' }>['target'];
export function MeasurementField({
  controller,
  target,
  measurement,
  label,
  min = 1,
  max,
}: {
  controller: SessionController;
  target: Target;
  measurement: Measurement;
  label: string;
  min?: number;
  max: number;
}) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  const committed = measurement.value?.toString() ?? '';
  const [form, setForm] = useState({ committed, value: committed, error: '' });
  if (form.committed !== committed)
    setForm({ committed, value: committed, error: '' });
  const apply = (value: number | null) => {
    const result = controller.dispatch(
      [{ type: 'confirm-measurement', target, value }],
      value === null
        ? `Mark ${label.toLowerCase()} unknown`
        : `Confirm ${label.toLowerCase()}`,
    );
    setForm((f) => ({
      ...f,
      error: result.ok
        ? ''
        : failureMessage(result, controller.getSnapshot().workspace?.current),
    }));
    if (!result.ok) input.current?.focus();
  };
  return (
    <form
      className={styles.measurement}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const n = Number(form.value);
        if (!form.value.trim() || !Number.isInteger(n) || n < min || n > max) {
          setForm((f) => ({
            ...f,
            error: `Enter a whole number from ${min} to ${max} mm.`,
          }));
          input.current?.focus();
          return;
        }
        apply(n);
      }}
    >
      <label htmlFor={id}>
        {label} <span>(mm)</span>
      </label>
      <div className={styles.fieldAction}>
        <input
          ref={input}
          id={id}
          type="number"
          step="1"
          min={min}
          max={max}
          value={form.value}
          onChange={(e) =>
            setForm((f) => ({ ...f, value: e.target.value, error: '' }))
          }
          aria-invalid={!!form.error}
          aria-describedby={`${id}-evidence${form.error ? ` ${id}-error` : ''}`}
        />
        <button type="submit">Confirm</button>
      </div>
      <p id={`${id}-evidence`} className={styles.hint}>
        Current:{' '}
        {measurement.value === null ? 'unknown' : `${measurement.value} mm`} ·{' '}
        {measurementLabel(measurement)}
      </p>
      {form.error && (
        <p role="alert" id={`${id}-error`} className={styles.error}>
          {form.error}
        </p>
      )}
      {measurement.value !== null && (
        <button
          className={styles.quiet}
          type="button"
          onClick={() => apply(null)}
        >
          Mark unknown
        </button>
      )}
    </form>
  );
}
