import { useId, useState } from 'react';
import {
  COLOUR_PRESETS,
  surfaceColorSchema,
} from '@roomedy/contracts/surfaces';
import { MATERIAL_PATTERNS } from '@roomedy/contracts/furniture-materials';
import type { MaterialPattern } from '@roomedy/contracts/furniture-materials';
import styles from './colour-picker.module.css';

const PRESETS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(COLOUR_PRESETS).map(([name, hex]) => [
    name[0]!.toUpperCase() + name.slice(1),
    hex,
  ]),
);
const channels = (hex: string) =>
  [1, 3, 5].map((i) => String(parseInt(hex.slice(i, i + 2), 16)));

export function ColourPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId(),
    valid = surfaceColorSchema.safeParse(value).success;
  const [tab, setTab] = useState<'presets' | 'custom'>(() =>
    Object.values(PRESETS).includes(value.toLowerCase()) ? 'presets' : 'custom',
  );
  const [draft, setDraft] = useState({
    source: value,
    rgb: channels(valid ? value : '#f3eee2'),
  });
  if (draft.source !== value)
    setDraft({ source: value, rgb: valid ? channels(value) : draft.rgb });
  const choose = (hex: string) => {
    setDraft({ source: hex, rgb: channels(hex) });
    onChange(hex);
  };
  return (
    <fieldset className={styles.picker}>
      <legend>{label}</legend>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={`${label} choices`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const next = tab === 'presets' ? 'custom' : 'presets';
            setTab(next);
            document.getElementById(`${id}-${next}`)?.focus();
          }
        }}
      >
        {(['presets', 'custom'] as const).map((key) => (
          <button
            key={key}
            id={`${id}-${key}`}
            type="button"
            role="tab"
            tabIndex={tab === key ? 0 : -1}
            aria-selected={tab === key}
            aria-controls={`${id}-panel`}
            onClick={() => setTab(key)}
          >
            {key === 'presets' ? 'Presets' : 'Custom'}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`}>
        {tab === 'presets' ? (
          <div className={styles.swatches}>
            {Object.entries(PRESETS).map(([name, hex]) => (
              <button
                type="button"
                key={name}
                aria-label={`${label}: ${name}`}
                aria-pressed={value.toLowerCase() === hex}
                title={name}
                onClick={() => choose(hex)}
              >
                <span style={{ backgroundColor: hex }} />
                <small>{name}</small>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.hex}>
              <input
                type="color"
                aria-label={`${label} picker`}
                value={valid ? value : '#f3eee2'}
                onChange={(e) => choose(e.target.value)}
              />
              <label>
                Hex
                <input
                  aria-label={`${label} hex`}
                  value={value}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!valid}
                  onChange={(e) => onChange(e.target.value)}
                />
              </label>
            </div>
            <div className={styles.rgb}>
              {['R', 'G', 'B'].map((name, i) => (
                <label key={name}>
                  {name}
                  <input
                    aria-label={`${label} ${name}`}
                    inputMode="numeric"
                    type="number"
                    min={0}
                    max={255}
                    step={1}
                    value={draft.rgb[i]}
                    aria-invalid={
                      !/^\d{1,3}$/.test(draft.rgb[i]!) ||
                      Number(draft.rgb[i]) > 255
                    }
                    onChange={(e) => {
                      const rgb = [...draft.rgb];
                      rgb[i] = e.target.value;
                      const hex = rgb.every(
                        (n) => /^\d{1,3}$/.test(n) && Number(n) <= 255,
                      )
                        ? `#${rgb.map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`
                        : '';
                      setDraft({ source: hex, rgb });
                      onChange(hex);
                    }}
                  />
                </label>
              ))}
            </div>
            {!valid && (
              <small role="status">
                Use RGB 0–255 or a six-digit hex colour.
              </small>
            )}
          </>
        )}
      </div>
    </fieldset>
  );
}

export function PatternPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MaterialPattern;
  onChange: (value: MaterialPattern) => void;
}) {
  return (
    <fieldset className={styles.picker}>
      <legend>{label}</legend>
      <div className={styles.patterns}>
        {Object.entries(MATERIAL_PATTERNS).map(([pattern, name]) => (
          <button
            key={pattern}
            type="button"
            aria-pressed={value === pattern}
            onClick={() => onChange(pattern as MaterialPattern)}
          >
            <span data-pattern={pattern} />
            <small>{name}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
