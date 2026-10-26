import { useId, useState } from 'react';
import type { Furniture } from '@roomedy/contracts/room';
import {
  furnitureMaterialsSchema,
  furnitureMaterialRoles,
  furnitureMaterialTargets,
  furnitureUpholsteryChoices,
} from '@roomedy/contracts/furniture-materials';
import type { FurnitureMaterials } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry, supportsDimensions } from '@roomedy/spatial';
import styles from './editor.module.css';

export function FurnitureMaterialControls({
  item,
  onCommit,
}: {
  item: Furniture;
  onCommit: (materials: FurnitureMaterials) => string | null;
}) {
  const errorId = useId(),
    entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion);
  const detailed =
    !!entry &&
    supportsDimensions(entry, {
      width: item.dimensions.width.value ?? 0,
      depth: item.dimensions.depth.value ?? 0,
      height: item.dimensions.height.value ?? 0,
    });
  const roles = entry
    ? furnitureMaterialRoles(entry, detailed)
    : { body: false, soft: false, hardware: false };
  const upholstery = entry ? furnitureUpholsteryChoices(entry) : [];
  const values = {
    body: item.materials?.body ?? 'auto',
    upholstery: item.materials?.upholstery ?? 'linen',
    softColor: item.materials?.softColor ?? 'auto',
    hardware: item.materials?.hardware ?? 'original',
  };
  const defaultSoftColor = furnitureMaterialTargets(
    { ...item, materials: { ...item.materials, softColor: null } },
    entry?.category ?? 'storage',
  ).soft.color;
  const signature = JSON.stringify([item.id, item.dimensions, values]);
  const [form, setForm] = useState({
    signature,
    values: { ...values } as Record<keyof typeof values, string>,
    error: '',
  });
  if (form.signature !== signature) setForm({ signature, values, error: '' });
  const fields = (
    ['body', 'upholstery', 'softColor', 'hardware'] as const
  ).filter((key) =>
    key === 'body'
      ? roles.body
      : key === 'hardware'
        ? roles.hardware
        : roles.soft,
  );
  const patch = Object.fromEntries(
    fields
      .filter((key) => form.values[key] !== values[key])
      .map((key) => [
        key,
        key === 'softColor' && form.values[key] === 'auto'
          ? null
          : form.values[key],
      ]),
  );
  const dirty = Object.keys(patch).length > 0;
  const update = (key: keyof typeof values, value: string) =>
    setForm((current) => ({
      ...current,
      values: { ...current.values, [key]: value },
      error: '',
    }));
  if (!fields.length) return null;
  return (
    <details className={styles.advanced}>
      <summary>
        Materials & details <span>Make it your own</span>
      </summary>
      <form
        className={styles.section}
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = furnitureMaterialsSchema.safeParse(patch);
          if (!parsed.success) {
            setForm((current) => ({
              ...current,
              error: 'Choose a supported material or a six-digit colour.',
            }));
            return;
          }
          const error = onCommit(parsed.data);
          setForm((current) => ({ ...current, error: error ?? '' }));
        }}
      >
        <p className={styles.hint}>
          {detailed
            ? 'Choose the frame, soft parts and hardware available on this piece. Size and placement stay as you set them.'
            : 'This size uses a simple shape. Frame appearance is available; detailed parts return with a supported catalogue size.'}
        </p>
        {roles.body && (
          <label>
            Frame material
            <select
              value={form.values.body}
              onChange={(e) => update('body', e.target.value)}
            >
              <option value="auto">Follow piece finish</option>
              <option value="wood">Wood grain</option>
              <option value="painted">Painted</option>
              <option value="metal">Metal</option>
            </select>
          </label>
        )}
        {roles.soft && (
          <div className={styles.twoFields}>
            {upholstery.length > 1 && (
              <label>
                {entry?.category === 'bed' ? 'Bedding material' : 'Upholstery'}
                <select
                  value={form.values.upholstery}
                  onChange={(e) => update('upholstery', e.target.value)}
                >
                  {upholstery.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice[0]!.toUpperCase() + choice.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Soft-part colour
              <input
                type="color"
                value={
                  form.values.softColor === 'auto'
                    ? defaultSoftColor
                    : form.values.softColor
                }
                onChange={(e) => update('softColor', e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={form.values.softColor === 'auto'}
              onClick={() => update('softColor', 'auto')}
            >
              Use default colour
            </button>
          </div>
        )}
        {roles.hardware && (
          <label>
            Hardware
            <select
              value={form.values.hardware}
              onChange={(e) => update('hardware', e.target.value)}
            >
              <option value="original">Original</option>
              <option value="dark">Dark</option>
              <option value="brass">Brass</option>
              <option value="steel">Steel</option>
            </select>
          </label>
        )}
        <button
          type="submit"
          className={styles.primary}
          disabled={!dirty}
          aria-describedby={form.error ? errorId : undefined}
        >
          Apply materials
        </button>
        {form.error && (
          <p id={errorId} role="alert">
            {form.error}
          </p>
        )}
      </form>
    </details>
  );
}
