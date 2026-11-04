import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
          Mattress {selected.mattress}; includes a 10 cm total frame allowance
          in width and length. Adjust the overall size below.
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
  resetKey = 0,
}: {
  resetKey?: number;
  item: Furniture;
  onCommit: (action: VisitorAction) => string | null;
  children: (customSize: ReactNode, presetSize: ReactNode) => ReactNode;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  const presets = furnitureSizePresets(entry);
  const signature = JSON.stringify([
    resetKey,
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
    touched: false,
  });
  if (form.signature !== signature)
    setForm({
      ...form,
      signature,
      values: sizeInputValues(item.dimensions, presets),
      error: '',
      field: '',
      touched: false,
    });
  const errorId = useId();
  const presetRef = useRef<HTMLFormElement>(null),
    customRef = useRef<HTMLFormElement>(null);
  const parsed = parseSizeInput(form.values, entry, item.ownership === 'owned');
  const invalid = form.touched && (!parsed.ok || !!form.error);
  const change = (values: SizeInputValues, mode: 'preset' | 'custom') => {
    const result = parseSizeInput(values, entry, item.ownership === 'owned');
    if (!result.ok) {
      setForm({
        signature,
        values,
        error: result.message,
        field: result.field,
        mode,
        touched: true,
      });
      return;
    }
    const error = onCommit({
      type: 'set-size-estimate',
      id: item.id,
      ...result.size,
      overrideSizeLock: true,
    });
    setForm({
      signature,
      values,
      error: error ?? '',
      field: error ? 'width' : '',
      mode,
      touched: true,
    });
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
      data-inspector-invalid={(invalid && form.mode === 'custom') || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        change(form.values, 'custom');
      }}
    >
      <h3>Dimensions</h3>
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
          change(
            form.values.height === undefined &&
              height === String(item.dimensions.height.value ?? '')
              ? other
              : values,
            'custom',
          );
        }}
        errorField={form.mode === 'custom' ? form.field : ''}
        errorId={errorId}
      />
      <p className={styles.hint}>
        Size edits leave protection settings unchanged.
      </p>
      {error('custom')}
    </form>
  );
  const presetSize =
    presets.length > 0 ? (
      <form
        className={styles.section}
        ref={presetRef}
        noValidate
        data-inspector-invalid={
          (invalid && form.mode === 'preset') || undefined
        }
        onSubmit={(event) => {
          event.preventDefault();
          change(form.values, 'preset');
        }}
      >
        <FurnitureSizeFields
          entry={entry}
          values={form.values}
          presentation="preset"
          onChange={(values) => change(values, 'preset')}
          errorField={form.mode === 'preset' ? form.field : ''}
          errorId={errorId}
        />
        {error('preset')}
      </form>
    ) : null;
  return <>{children(customSize, presetSize)}</>;
}
