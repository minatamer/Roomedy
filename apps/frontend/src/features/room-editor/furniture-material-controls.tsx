import { useState } from 'react';
import type { ReactNode } from 'react';
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
import layout from './appearance-controls.module.css';

export function FurnitureMaterialControls({
  item,
  onCommit,
  finishControl,
}: {
  item: Furniture;
  onCommit: (materials: FurnitureMaterials) => string | null;
  finishControl?: ReactNode;
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
      <div className={finishControl ? layout.presets : layout.group}>
        {finishControl}
        <label>
          Theme
          <select
            aria-label="Furniture theme"
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
              Choose a theme
            </option>
            {BEDROOM_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {themeError && (
        <p role="alert" className={styles.error}>
          {themeError}
        </p>
      )}
      <div>
        <MaterialForm
          key={item.id}
          item={item}
          entry={entry}
          onCommit={onCommit}
        />
      </div>
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
  const signature = JSON.stringify([item.materials, item.finish]);
  const [base, setBase] = useState(signature);
  if (base !== signature) {
    setBase(signature);
    setPatch({});
  }
  const chosen = { ...item.materials, ...patch };
  const current = furnitureMaterialTargets(
    { ...item, materials: chosen },
    entry.category,
  );
  const update = (next: FurnitureMaterials) => {
    const draft = { ...patch, ...next };
    setPatch(draft);
    const parsed = furnitureMaterialsSchema.safeParse(draft);
    setError(parsed.success ? (onCommit(parsed.data) ?? '') : '');
  };
  const valid =
    Object.keys(patch).length === 0 ||
    furnitureMaterialsSchema.safeParse(patch).success;
  return (
    <form
      className={layout.stack}
      data-inspector-invalid={!valid || !!error || undefined}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = furnitureMaterialsSchema.safeParse(patch);
        if (!parsed.success) return;
        setError(onCommit(parsed.data) ?? '');
      }}
    >
      {!detailed && (
        <p className={styles.hint}>Simple shape · frame appearance</p>
      )}
      {roles.body && (
        <section className={layout.group} aria-label="Frame appearance">
          <h3>Frame</h3>
          <label>
            Material
            <select
              aria-label="Frame material"
              value={chosen.body ?? 'auto'}
              onChange={(e) =>
                update({
                  body: e.target.value as FurnitureMaterials['body'],
                  bodyPattern: null,
                })
              }
            >
              {Object.entries({
                auto: 'Follow base finish',
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
            displayLabel="Colour"
            value={chosen.bodyColor ?? current.frame.color}
            onChange={(bodyColor) => update({ bodyColor })}
          />
          <PatternPicker
            label="Frame pattern"
            displayLabel="Pattern"
            collapsible
            value={
              (chosen.bodyPattern ??
                (current.frame.surface === 'plaster' ||
                current.frame.surface === 'paint'
                  ? 'smooth'
                  : current.frame.surface)) as MaterialPattern
            }
            onChange={(bodyPattern) => update({ bodyPattern })}
          />
        </section>
      )}
      {roles.soft && (
        <section
          className={layout.group}
          aria-label={
            entry.category === 'bed'
              ? 'Bedding appearance'
              : 'Upholstery appearance'
          }
        >
          <h3>{entry.category === 'bed' ? 'Bedding' : 'Upholstery'}</h3>
          <label>
            Material
            <select
              aria-label={
                entry.category === 'bed' ? 'Bedding material' : 'Upholstery'
              }
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
          {entry.category === 'bed' ? (
            BED_BEDDING_PARTS.map((part) => (
              <section
                key={part.target}
                className={layout.group}
                aria-label={part.label}
              >
                <h3>{part.label}</h3>
                <ColourPicker
                  label={`${part.label} colour`}
                  displayLabel="Colour"
                  value={chosen[part.color] ?? current[part.target].color}
                  onChange={(color) => update({ [part.color]: color })}
                />
                <PatternPicker
                  label={`${part.label} pattern`}
                  displayLabel="Pattern"
                  collapsible
                  value={
                    (chosen[part.pattern] ??
                      current[part.target].surface) as MaterialPattern
                  }
                  onChange={(pattern) => update({ [part.pattern]: pattern })}
                />
                <button
                  type="button"
                  className={layout.reset}
                  aria-label={`Reset ${part.label.toLowerCase()} finish`}
                  disabled={!chosen[part.color] && !chosen[part.pattern]}
                  onClick={() =>
                    update({ [part.color]: null, [part.pattern]: null })
                  }
                >
                  Reset finish
                </button>
              </section>
            ))
          ) : (
            <>
              <ColourPicker
                label="Soft-part colour"
                displayLabel="Colour"
                value={chosen.softColor ?? current.soft.color}
                onChange={(softColor) => update({ softColor })}
              />
              <PatternPicker
                label="Soft-part pattern"
                displayLabel="Pattern"
                collapsible
                value={
                  (chosen.softPattern ??
                    current.soft.surface) as MaterialPattern
                }
                onChange={(softPattern) => update({ softPattern })}
              />
              <button
                type="button"
                className={layout.reset}
                disabled={!chosen.softColor}
                onClick={() => update({ softColor: null })}
              >
                Use default colour
              </button>
            </>
          )}
        </section>
      )}
      {roles.hardware && (
        <section className={layout.group} aria-label="Hardware appearance">
          <h3>Hardware</h3>
          <label>
            Finish
            <select
              aria-label="Hardware"
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
            displayLabel="Colour"
            value={chosen.hardwareColor ?? current.metal.color}
            onChange={(hardwareColor) => update({ hardwareColor })}
          />
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
