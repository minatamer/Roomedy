import { BEDROOM_THEMES } from '@roomedy/contracts/furniture-materials';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomSurface, FINISH_COLORS } from '@roomedy/contracts/surfaces';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import styles from './bedroom-themes.module.css';

export function BedroomThemes({
  controller,
  room,
}: {
  controller: SessionController;
  room: RoomDocument;
}) {
  const floor = roomSurface(room.room, 'floor');
  const walls = roomSurface(room.room, 'walls');
  return (
    <section className={styles.themes} aria-label="Bedroom themes">
      <h3>Bedroom theme</h3>
      <p>Preview colours and textures together.</p>
      <div className={styles.choices}>
        {BEDROOM_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-label={`Preview ${theme.name} bedroom theme`}
            aria-pressed={
              floor.color === theme.floorColor &&
              floor.texture === theme.floorTexture &&
              walls.color === theme.wallColor &&
              walls.texture === theme.wallTexture
            }
            onClick={() => {
              const result = controller.prepareVisitorPreview(
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
    </section>
  );
}
