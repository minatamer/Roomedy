import type { Furniture } from '@roomedy/contracts/room';
import {
  LIGHT_PRESETS,
  lightSettings,
} from '@roomedy/contracts/furniture-materials';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { ColourPicker } from './colour-picker';
import styles from './editor.module.css';
import layout from './appearance-controls.module.css';
import lighting from './lighting-experience.module.css';

export function LightControls({
  item,
  onEdit,
}: {
  item: Furniture;
  onEdit: (actions: VisitorAction[], label: string) => unknown;
}) {
  const value = lightSettings(item);
  const update = (
    light: Extract<VisitorAction, { type: 'set-light' }>['light'],
  ) => onEdit([{ type: 'set-light', id: item.id, light }], 'Change light');
  return (
    <section
      className={`${layout.stack} ${lighting.lightControls}`}
      aria-label="Light emission"
    >
      <h3>Light</h3>
      <label>
        <input
          type="checkbox"
          checked={value.on}
          onChange={(event) => update({ on: event.target.checked })}
        />{' '}
        Light on
      </label>
      <label>
        Brightness · {value.brightness}%
        <input
          aria-label="Light brightness"
          type="range"
          min="0"
          max="100"
          step="5"
          value={value.brightness}
          onChange={(event) =>
            update({ brightness: Number(event.target.value) })
          }
        />
      </label>
      <label>
        Light colour
        <select
          aria-label="Light colour preset"
          value={
            LIGHT_PRESETS.find((preset) => preset.color === value.color)?.id ??
            'custom'
          }
          onChange={(event) => {
            const preset = LIGHT_PRESETS.find(
              (preset) => preset.id === event.target.value,
            );
            if (preset) update({ color: preset.color });
          }}
        >
          <option value="custom">Custom colour</option>
          {LIGHT_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <ColourPicker
        label="Light colour"
        value={value.color}
        onChange={(color) => update({ color })}
      />
      <p className={styles.hint}>
        Preview the glow in Night. Light colour is independent of the shade and
        frame.
      </p>
    </section>
  );
}
