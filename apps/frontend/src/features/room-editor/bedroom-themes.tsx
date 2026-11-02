import {
  BEDROOM_THEMES,
  roomBedroomTheme,
} from '@roomedy/contracts/furniture-materials';
import type { RoomDocument } from '@roomedy/contracts/room';
import { FINISH_COLORS } from '@roomedy/contracts/surfaces';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './bedroom-themes.module.css';
import layout from './appearance-controls.module.css';

export function BedroomThemes({
  controller,
  room,
  onEdit,
}: {
  controller: SessionController;
  room: RoomDocument;
  onEdit?: SessionController['dispatch'];
}) {
  const selectedTheme = roomBedroomTheme(room.room);
  return (
    <details
      className={`${styles.themes} ${layout.disclosure}`}
      aria-label="Bedroom themes"
    >
      <summary>
        Room theme <span>{selectedTheme?.name ?? 'Custom'}</span>
      </summary>
      <div className={styles.choices}>
        {BEDROOM_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-label={`Preview ${theme.name} bedroom theme`}
            aria-pressed={selectedTheme?.id === theme.id}
            onClick={() => {
              const result = (
                onEdit ?? controller.prepareVisitorPreview.bind(controller)
              )(
                [{ type: 'set-bedroom-theme', theme: theme.id }],
                `${theme.name} bedroom theme`,
              );
              if (!result.ok) controller.notify(failureMessage(result, room));
            }}
          >
            <span className={styles.swatches} aria-hidden="true">
              {[
                theme.wallColor,
                theme.floorColor,
                FINISH_COLORS[theme.furnitureFinish],
                theme.softColor,
              ].map((color, index) => (
                <i key={index} style={{ background: color }} />
              ))}
            </span>
            <strong>{theme.name}</strong>
            <small>{theme.description}</small>
          </button>
        ))}
      </div>
    </details>
  );
}
