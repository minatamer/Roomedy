import { useId, useRef, useState } from 'react';
import type { Furniture } from '@roomedy/contracts/room';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { findCatalogueEntry } from '@roomedy/spatial';
import {
  furnitureSizePresets,
  parseSizeInput,
  selectSizePreset,
  sizeInputValues,
} from './size-presets';
import type { SizeInputValues } from './size-presets';
import styles from './editor.module.css';
export function FurnitureSizeFields({
  entry,
  values,
  onChange,
  errorField,
  errorId,
  disabled = false,
}: {
  entry: CatalogueEntry;
  values: SizeInputValues;
  onChange: (values: SizeInputValues) => void;
  errorField?: string;
  errorId?: string;
  disabled?: boolean;
}) {
  const presets = furnitureSizePresets(entry),
    selected = presets.find((p) => p.id === values.preset);
  return (
    <div className={styles.sizeFields}>
      {presets.length > 0 && (
        <label>
          Size preset
          <select
            value={values.preset}
            disabled={disabled}
            onChange={(e) =>
              onChange(
                selectSizePreset(
                  values,
                  presets.find((p) => p.id === e.target.value),
                ),
              )
            }
          >
            <option value="">Custom / current size</option>
            {[...new Set(presets.map((p) => p.group))].map((group) => (
              <optgroup key={group} label={group}>
                {presets
                  .filter((p) => p.group === group)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
      {selected?.mattress && (
        <p className={styles.hint}>
          Mattress {selected.mattress}; includes an estimated 10 cm total frame
          allowance in width and length. Adjust the overall size below.
        </p>
      )}
      <div className={styles.twoFields}>
        {(['width', 'depth', 'height'] as const)
          .filter((axis) => axis !== 'height' || values.height !== undefined)
          .map((axis) => (
            <label key={axis}>
              {axis === 'width'
                ? 'Overall width'
                : axis === 'depth'
                  ? 'Overall depth'
                  : 'Overall height'}{' '}
              (mm)
              <input
                name={axis}
                type="number"
                step="1"
                disabled={disabled}
                value={values[axis] ?? ''}
                aria-invalid={errorField === axis}
                aria-describedby={errorField === axis ? errorId : undefined}
                onChange={(e) =>
                  onChange({ ...values, preset: '', [axis]: e.target.value })
                }
              />
            </label>
          ))}
      </div>
    </div>
  );
}
export function FurnitureSizeForm({
  item,
  onCommit,
  onUnlock,
}: {
  item: Furniture;
  onCommit: (action: VisitorAction) => string | null;
  onUnlock: () => string | null;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  const signature = JSON.stringify([
    item.id,
    item.catalogueId,
    item.ownership,
    item.dimensions,
  ]);
  const [form, setForm] = useState({
    signature,
    values: sizeInputValues(item.dimensions),
    error: '',
    field: '',
  });
  if (form.signature !== signature)
    setForm({
      signature,
      values:
        Number(form.values.width) === item.dimensions.width.value &&
        Number(form.values.depth) === item.dimensions.depth.value &&
        (form.values.height === undefined ||
          Number(form.values.height) === item.dimensions.height.value)
          ? form.values
          : sizeInputValues(item.dimensions),
      error: '',
      field: '',
    });
  const ref = useRef<HTMLFormElement>(null),
    errorId = useId();
  if (!furnitureSizePresets(entry).length) return null;
  return (
    <form
      className={styles.section}
      ref={ref}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const result = parseSizeInput(
          form.values,
          entry,
          item.ownership === 'owned',
        );
        if (!result.ok) {
          setForm((f) => ({
            ...f,
            error: result.message,
            field: result.field,
          }));
          ref.current
            ?.querySelector<HTMLInputElement>(`[name="${result.field}"]`)
            ?.focus();
          return;
        }
        const error = onCommit({
          type: 'set-size-estimate',
          id: item.id,
          ...result.size,
        });
        setForm((f) => ({
          ...f,
          error: error ?? '',
          field: error ? 'width' : '',
        }));
        if (error)
          ref.current
            ?.querySelector<HTMLInputElement>('[name="width"]')
            ?.focus();
      }}
    >
      <h3>Size</h3>
      <FurnitureSizeFields
        entry={entry}
        values={form.values}
        onChange={(values) =>
          setForm((f) => ({ ...f, values, error: '', field: '' }))
        }
        errorField={form.field}
        errorId={errorId}
      />
      <p className={styles.hint}>
        Planning estimate. Confirm actual measurements separately.
      </p>
      {form.error && (
        <p className={styles.error} role="alert" id={errorId}>
          {form.error}
        </p>
      )}
      <div className={styles.actionRow}>
        {item.locks.dimensions ? (
          <button
            type="button"
            onClick={() => {
              const error = onUnlock();
              setForm((f) => ({
                ...f,
                error: error ?? '',
                field: error ? 'width' : '',
              }));
            }}
          >
            Unlock size
          </button>
        ) : (
          <button type="submit">Use size</button>
        )}
      </div>
    </form>
  );
}
