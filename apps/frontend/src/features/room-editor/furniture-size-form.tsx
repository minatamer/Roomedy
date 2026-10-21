import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
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
  presentation = 'all',
}: {
  entry: CatalogueEntry;
  values: SizeInputValues;
  onChange: (values: SizeInputValues) => void;
  errorField?: string;
  errorId?: string;
  disabled?: boolean;
  presentation?: 'all' | 'preset' | 'dimensions';
}) {
  const presets = furnitureSizePresets(entry),
    selected = presets.find((p) => p.id === values.preset);
  return (
    <div className={styles.sizeFields}>
      {presets.length > 0 && presentation !== 'dimensions' && (
        <label>
          Size preset
          <select
            name="preset"
            value={values.preset}
            disabled={disabled}
            aria-invalid={presentation === 'preset' && !!errorField}
            aria-describedby={
              presentation === 'preset' && errorField ? errorId : undefined
            }
            onChange={(e) =>
              onChange(
                selectSizePreset(
                  values,
                  presets.find((p) => p.id === e.target.value),
                ),
              )
            }
          >
            <option value="">Custom size</option>
            {[...new Set(presets.map((p) => p.group))].map((group) => (
              <optgroup key={group} label={group}>
                {presets
                  .filter((p) => p.group === group)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {presentation === 'preset'
                        ? `${p.label.split(' · ')[0]}${p.mattress ? ` · ${p.group.replace(' mattress sizes', '')}` : ''}`
                        : p.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
      {presentation !== 'preset' && selected?.mattress && (
        <p className={styles.hint}>
          Mattress {selected.mattress}; includes an estimated 10 cm total frame
          allowance in width and length. Adjust the overall size below.
        </p>
      )}
      {presentation !== 'preset' && (
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
      )}
    </div>
  );
}
export function FurnitureSizeForm({
  item,
  onCommit,
  children,
}: {
  item: Furniture;
  onCommit: (action: VisitorAction) => string | null;
  children: (customSize: ReactNode) => ReactNode;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  const presets = furnitureSizePresets(entry);
  const signature = JSON.stringify([
    item.id,
    item.catalogueId,
    item.ownership,
    item.dimensions,
  ]);
  const [form, setForm] = useState({
    signature,
    values: sizeInputValues(item.dimensions, presets),
    error: '',
    field: '',
    mode: 'preset' as 'preset' | 'custom',
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
          : sizeInputValues(item.dimensions, presets),
      error: '',
      field: '',
      mode: form.mode,
    });
  const presetRef = useRef<HTMLFormElement>(null),
    customRef = useRef<HTMLFormElement>(null),
    errorId = useId();
  const changed = (['width', 'depth', 'height'] as const).some(
    (axis) =>
      form.values[axis] !== undefined &&
      Number(form.values[axis]) !== item.dimensions[axis].value,
  );
  const submit = (e: FormEvent<HTMLFormElement>, mode: 'preset' | 'custom') => {
    e.preventDefault();
    const ref = mode === 'preset' ? presetRef : customRef;
    const focusField = (field: string) =>
      ref.current
        ?.querySelector<HTMLElement>(
          mode === 'preset' ? 'select' : `[name="${field}"]`,
        )
        ?.focus();
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
        mode,
      }));
      focusField(result.field);
      return;
    }
    const error = onCommit({
      type: 'set-size-estimate',
      id: item.id,
      ...result.size,
      overrideSizeLock: true,
    });
    setForm((f) => ({
      ...f,
      error: error ?? '',
      field: error ? 'width' : '',
      mode,
    }));
    if (error) focusField('width');
  };
  const error = (mode: 'preset' | 'custom') =>
    form.error &&
    form.mode === mode && (
      <p className={styles.error} role="alert" id={errorId}>
        {form.error}
      </p>
    );
  const customSize = (
    <form
      className={styles.section}
      ref={customRef}
      noValidate
      onSubmit={(e) => submit(e, 'custom')}
    >
      <h3>Size estimate</h3>
      <FurnitureSizeFields
        entry={entry}
        values={{
          ...form.values,
          height:
            form.values.height ?? String(item.dimensions.height.value ?? ''),
        }}
        presentation="dimensions"
        onChange={(values) => {
          const { height, ...other } = values;
          setForm((f) => ({
            ...f,
            values:
              f.values.height === undefined &&
              height === String(item.dimensions.height.value ?? '')
                ? other
                : values,
            error: '',
            field: '',
            mode: 'custom',
          }));
        }}
        errorField={form.mode === 'custom' ? form.field : ''}
        errorId={errorId}
      />
      <p className={styles.hint}>
        Estimates stay approximate. Confirm measured values below. Applying a
        size leaves its protection settings unchanged.
      </p>
      {error('custom')}
      <button type="submit" disabled={!changed}>
        Apply custom size
      </button>
    </form>
  );
  return (
    <>
      {presets.length > 0 && (
        <form
          className={styles.section}
          ref={presetRef}
          noValidate
          onSubmit={(e) => submit(e, 'preset')}
        >
          <FurnitureSizeFields
            entry={entry}
            values={form.values}
            presentation="preset"
            onChange={(values) =>
              setForm((f) => ({
                ...f,
                values,
                error: '',
                field: '',
                mode: 'preset',
              }))
            }
            errorField={form.mode === 'preset' ? form.field : ''}
            errorId={errorId}
          />
          {error('preset')}
          {changed && form.values.preset && (
            <button type="submit">Apply size</button>
          )}
        </form>
      )}
      {children(customSize)}
    </>
  );
}
