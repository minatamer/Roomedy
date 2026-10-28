import type { RoomDocument } from '@roomedy/contracts/room';
import {
  roomSurface,
  roomSurfaceDetail,
  SURFACE_TEXTURES,
  WALLS,
} from '@roomedy/contracts/surfaces';
import styles from './assistant.module.css';

/** Swatches represent actual preview values; complete semantic changes remain reviewable. */
export function SurfacePreview({
  current,
  proposed,
}: {
  current: RoomDocument;
  proposed: RoomDocument;
}) {
  const surfaces = (['floor', 'walls', ...WALLS] as const).filter((surface) => {
    if (
      WALLS.some((wall) => wall === surface) &&
      !current.room.surfaces?.[surface] &&
      !proposed.room.surfaces?.[surface]
    )
      return false;
    return (
      JSON.stringify([
        roomSurface(current.room, surface),
        roomSurfaceDetail(current.room, surface),
      ]) !==
      JSON.stringify([
        roomSurface(proposed.room, surface),
        roomSurfaceDetail(proposed.room, surface),
      ])
    );
  });
  if (!surfaces.length) return null;
  return (
    <div className={styles.surfaceChanges} aria-label="Material preview">
      {surfaces.map((surface) => {
        const before = roomSurface(current.room, surface),
          after = roomSurface(proposed.room, surface);
        return (
          <div key={surface}>
            <strong>
              {surface === 'floor'
                ? 'Floor'
                : surface === 'walls'
                  ? 'Walls'
                  : `${surface} wall`}
            </strong>
            <div className={styles.swatchPair}>
              <span>
                <i style={{ background: before.color }} />
                <small>Current</small>
              </span>
              <span aria-hidden="true">→</span>
              <span>
                <i style={{ background: after.color }} />
                <small>Preview</small>
              </span>
            </div>
            <small>
              {SURFACE_TEXTURES[after.texture]} ·{' '}
              {roomSurfaceDetail(proposed.room, surface).sheen}
            </small>
          </div>
        );
      })}
    </div>
  );
}
