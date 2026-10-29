import { useState } from 'react';
import type { Furniture } from '@roomedy/contracts/room';
import {
  furnitureMaterialsSchema,
  furnitureMaterialRoles,
  furnitureMaterialTargets,
  furnitureUpholsteryChoices,
  BEDROOM_THEMES,
  bedroomFurnitureMaterials,
  BED_BEDDING_PARTS,
} from '@roomedy/contracts/furniture-materials';
import type {
  FurnitureMaterials,
  MaterialPattern,
} from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry, supportsDimensions } from '@roomedy/spatial';
import { ColourPicker, PatternPicker } from './colour-picker';
import styles from './editor.module.css';

export function FurnitureMaterialControls({
  item,
  onCommit,
}: {
  item: Furniture;
  onCommit: (materials: FurnitureMaterials) => string | null;
}) {
  const [themeError, setThemeError] = useState('');
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion);
  if (!entry) return null;
  const detailed = supportsDimensions(entry, {
    width: item.dimensions.width.value ?? entry.size.width.default,
    depth: item.dimensions.depth.value ?? entry.size.depth.default,
    height: item.dimensions.height.value ?? entry.size.height.default,
  });
  const selectedTheme =
    BEDROOM_THEMES.find((theme) =>
      Object.entries(bedroomFurnitureMaterials(theme, entry, detailed)).every(
        ([key, value]) =>
          item.materials?.[key as keyof FurnitureMaterials] === value,
      ),
    )?.id ?? '';
  return (
    <>
      <label className={styles.section}>
        Furniture theme
        <select
          value={selectedTheme}
          onChange={(event) => {
            const theme = BEDROOM_THEMES.find(
              (theme) => theme.id === event.target.value,
            );
            if (theme)
              setThemeError(
                onCommit(bedroomFurnitureMaterials(theme, entry, detailed)) ??
                  '',
              );
          }}
        >
          <option value="" disabled>
            Choose a colour & texture preset
          </option>
          {BEDROOM_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      {themeError && (
        <p role="alert" className={styles.error}>
          {themeError}
        </p>
      )}
      <details className={styles.advanced}>
        <summary>
          Materials & details <span>Make it your own</span>
        </summary>
        <MaterialForm
          key={JSON.stringify([
            item.id,
            item.dimensions,
            item.finish,
            item.materials,
          ])}
          item={item}
          entry={entry}
          onCommit={onCommit}
        />
      </details>
    </>
  );
}
function MaterialForm({
  item,
  entry,
  onCommit,
}: {
  item: Furniture;
  entry: NonNullable<ReturnType<typeof findCatalogueEntry>>;
  onCommit: (materials: FurnitureMaterials) => string | null;
}) {
  const detailed = supportsDimensions(entry, {
    width: item.dimensions.width.value ?? entry.size.width.default,
    depth: item.dimensions.depth.value ?? entry.size.depth.default,
    height: item.dimensions.height.value ?? entry.size.height.default,
  });
  const roles = furnitureMaterialRoles(entry, detailed);
  const [patch, setPatch] = useState<FurnitureMaterials>({}),
    [error, setError] = useState('');
  const chosen = { ...item.materials, ...patch };
  const current = furnitureMaterialTargets(
    { ...item, materials: chosen },
    entry.category,
  );
  const update = (next: FurnitureMaterials) => {
    setPatch((p) => ({ ...p, ...next }));
    setError('');
  };
  const valid = furnitureMaterialsSchema.safeParse(patch).success;
  return (
    <form
      className={styles.section}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = furnitureMaterialsSchema.safeParse(patch);
        if (!parsed.success) return;
        setError(onCommit(parsed.data) ?? '');
      }}
    >
      {!detailed && (
        <p className={styles.hint}>Simple shape - frame appearance</p>
      )}
      {roles.body && (
        <>
          <label>
            Frame material
            <select
              value={chosen.body ?? 'auto'}
              onChange={(e) =>
                update({
                  body: e.target.value as FurnitureMaterials['body'],
                  bodyPattern: null,
                })
              }
            >
              {Object.entries({
                auto: 'Follow piece finish',
                plain: 'Plain matte',
                wood: 'Wood grain',
                painted: 'Painted',
                metal: 'Metal',
              }).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <ColourPicker
            label="Frame colour"
            value={chosen.bodyColor ?? current.frame.color}
            onChange={(bodyColor) => update({ bodyColor })}
          />
          <PatternPicker
            label="Frame pattern"
            value={
              (chosen.bodyPattern ??
                (current.frame.surface === 'plaster' ||
                current.frame.surface === 'paint'
                  ? 'smooth'
                  : current.frame.surface)) as MaterialPattern
            }
            onChange={(bodyPattern) => update({ bodyPattern })}
          />
        </>
      )}
      {roles.soft && (
        <>
          <label>
            {entry.category === 'bed' ? 'Bedding material' : 'Upholstery'}
            <select
              value={chosen.upholstery ?? 'linen'}
              onChange={(e) =>
                update({
                  upholstery: e.target
                    .value as FurnitureMaterials['upholstery'],
                  softPattern: null,
                  ...(entry.category === 'bed'
                    ? {
                        coverPattern: null,
                        pillowPattern: null,
                        sheetPattern: null,
                      }
                    : {}),
                })
              }
            >
              {furnitureUpholsteryChoices(entry).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {entry.category !== 'bed' && (
            <>
              <ColourPicker
                label="Soft-part colour"
                value={chosen.softColor ?? current.soft.color}
                onChange={(softColor) => update({ softColor })}
              />
              <button
                type="button"
                disabled={!chosen.softColor}
                onClick={() => update({ softColor: null })}
              >
                Use default colour
              </button>
              <PatternPicker
                label="Soft-part pattern"
                value={
                  (chosen.softPattern ??
                    current.soft.surface) as MaterialPattern
                }
                onChange={(softPattern) => update({ softPattern })}
              />
            </>
          )}
        </>
      )}
      {roles.soft &&
        entry.category === 'bed' &&
        BED_BEDDING_PARTS.map((part) => (
          <section
            key={part.target}
            className={styles.section}
            aria-label={part.label}
          >
            <h3>{part.label}</h3>
            <ColourPicker
              label={`${part.label} colour`}
              value={chosen[part.color] ?? current[part.target].color}
              onChange={(color) => update({ [part.color]: color })}
            />
            <PatternPicker
              label={`${part.label} pattern`}
              value={
                (chosen[part.pattern] ??
                  current[part.target].surface) as MaterialPattern
              }
              onChange={(pattern) => update({ [part.pattern]: pattern })}
            />
            <button
              type="button"
              disabled={!chosen[part.color] && !chosen[part.pattern]}
              onClick={() =>
                update({ [part.color]: null, [part.pattern]: null })
              }
            >
              Reset {part.label.toLowerCase()} finish
            </button>
          </section>
        ))}
      {roles.hardware && (
        <>
          <label>
            Hardware
            <select
              value={chosen.hardware ?? 'original'}
              onChange={(e) =>
                update({
                  hardware: e.target.value as FurnitureMaterials['hardware'],
                  hardwareColor: null,
                })
              }
            >
              {['original', 'dark', 'brass', 'steel'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <ColourPicker
            label="Hardware colour"
            value={chosen.hardwareColor ?? current.metal.color}
            onChange={(hardwareColor) => update({ hardwareColor })}
          />
        </>
      )}
      <button type="submit" className={styles.primary} disabled={!valid}>
        Apply materials
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
