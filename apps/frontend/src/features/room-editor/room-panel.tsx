import {
  featureLabel,
  BALCONY_SIZE_PRESETS,
  placeDoor,
} from '@roomedy/spatial';
import type { Feature, RoomDocument } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { POLICY } from '@roomedy/contracts/policy';
import {
  FINISH_PALETTE,
  FINISH_PRESETS,
  previewFinishPreset,
} from '../catalogue/finishes';
import type { SessionController } from '../session/controller';
import { MeasurementField } from './measurements';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';
import { SurfaceControls } from './surface-controls';

export function RoomPanel({
  controller,
  room,
}: {
  controller: SessionController;
  room: RoomDocument;
}) {
  const photoNotes = controller.getSnapshot().photoNotes;
  const run = (actions: VisitorAction[], label: string) => {
    const r = controller.dispatch(actions, label);
    if (!r.ok)
      controller.notify(
        failureMessage(r, controller.getSnapshot().workspace?.current),
      );
  };
  const addFeature = (
    kind: Feature['kind'],
    purpose: 'room' | 'bathroom' | 'balcony' = 'room',
  ) => {
    const unknown = { status: 'unknown' as const, sourceId: null },
      estimate = (value: number) => ({
        status: 'estimated' as const,
        sourceId: 'visitor-estimate',
        value,
      });
    const base = {
      id: crypto.randomUUID(),
      wall: 'unknown' as const,
      wallProvenance: unknown,
      offset: estimate(200),
      width: estimate(
        purpose === 'balcony'
          ? BALCONY_SIZE_PRESETS[0]!.width
          : kind === 'door'
            ? 900
            : 1000,
      ),
      height: estimate(
        purpose === 'balcony'
          ? BALCONY_SIZE_PRESETS[0]!.height
          : kind === 'door'
            ? 2100
            : 1000,
      ),
      sill: estimate(0),
    };
    let feature: Feature =
      kind === 'door'
        ? {
            ...base,
            kind,
            purpose,
            mechanism: purpose === 'balcony' ? 'sliding' : 'unknown',
            mechanismProvenance:
              purpose === 'balcony'
                ? { status: 'estimated', sourceId: 'visitor-estimate' }
                : unknown,
            hinge: 'unknown',
            hingeProvenance: unknown,
          }
        : kind === 'window'
          ? {
              ...base,
              kind,
              mechanism: 'unknown',
              mechanismProvenance: unknown,
            }
          : { ...base, kind, projection: estimate(300) };
    if (feature.kind === 'door' && purpose === 'bathroom') {
      const placed = placeDoor(room, feature);
      if (!placed) {
        controller.notify(
          'There isn’t a clear spot for a bathroom door. Make space along a wall, or review missing room measurements.',
        );
        return;
      }
      feature = placed;
    }
    const r = controller.dispatch(
      [{ type: 'add-feature', feature }],
      'Add room feature',
    );
    if (r.ok) {
      controller.select(feature.id);
      focusProperties(controller, feature.id);
    } else
      controller.notify(
        failureMessage(r, controller.getSnapshot().workspace?.current),
      );
  };
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>
          {photoNotes?.simulated ? 'Example room' : 'Your starting point'}
        </p>
        <h2 tabIndex={-1}>Room & intention</h2>
      </div>
      {photoNotes &&
        (photoNotes.outline !== 'rectangle' ||
          photoNotes.unplaced.length > 0) && (
          <section
            className={styles.section}
            aria-label="Photo details to check"
          >
            <h3>Photo details to check</h3>
            {photoNotes.outline !== 'rectangle' && (
              <p className={styles.hint}>
                {photoNotes.outline === 'unsupported'
                  ? 'The photos suggest extra corners. This studio uses a rectangular planning frame; adjust it to the area you want to arrange.'
                  : 'The room outline was unclear. Adjust the rectangular planning frame using the measurements below.'}
              </p>
            )}
            {photoNotes.unplaced.length > 0 && (
              <>
                <p className={styles.hint}>
                  These photo observations need a furniture or room-feature
                  choice:
                </p>
                <ul>
                  {photoNotes.unplaced.map((label, index) => (
                    <li key={index}>{label}</li>
                  ))}
                </ul>
                <button onClick={() => controller.setPanel('catalogue')}>
                  Choose furniture
                </button>
              </>
            )}
            <button onClick={() => controller.dismissPhotoNotes()}>
              Dismiss notes
            </button>
          </section>
        )}
      <SurfaceControls
        key={controller.getSnapshot().generation}
        room={room}
        onApply={(actions, label) => {
          const result = controller.dispatch(actions, label);
          return result.ok
            ? null
            : failureMessage(
                result,
                controller.getSnapshot().workspace?.current,
              );
        }}
      />
      <div className={styles.section}>
        <label>
          Starting condition
          <select
            value={room.intent.condition}
            onChange={(event) => {
              const condition = event.target.value;
              if (
                condition === 'empty' ||
                condition === 'partial' ||
                condition === 'furnished'
              )
                run(
                  [
                    {
                      type: 'set-intent',
                      intent: { ...room.intent, condition },
                    },
                  ],
                  'Update starting condition',
                );
            }}
          >
            <option value="empty">Empty room</option>
            <option value="partial">Partly furnished</option>
            <option value="furnished">Furnished</option>
          </select>
        </label>
      </div>
      <div className={styles.section}>
        <h3>Room measurements</h3>
        <div className={styles.measurementGrid}>
          {(['width', 'depth', 'height'] as const).map((field) => (
            <MeasurementField
              key={field}
              controller={controller}
              target={{ kind: 'room', id: room.roomId, field }}
              label={field[0]!.toUpperCase() + field.slice(1)}
              measurement={room.room[field]}
              max={POLICY.roomEdgeMm}
            />
          ))}
        </div>
      </div>
      <fieldset className={styles.section}>
        <legend>Make room for</legend>
        <div className={styles.goalFields}>
          {(['sleep', 'work', 'storage', 'open-space'] as const).map((goal) => (
            <label key={goal} className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={room.intent.goals.includes(goal)}
                onChange={(e) =>
                  run(
                    [
                      {
                        type: 'set-intent',
                        intent: {
                          ...room.intent,
                          goals: e.target.checked
                            ? [...room.intent.goals, goal]
                            : room.intent.goals.filter((g) => g !== goal),
                        },
                      },
                    ],
                    'Update room goals',
                  )
                }
              />
              {goal === 'open-space'
                ? 'Open space'
                : goal[0]!.toUpperCase() + goal.slice(1)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.section}>
        <h3>Room palettes</h3>
        <p className={styles.hint}>
          Preview a palette for the room and compatible proposed furniture.
          Owned finishes stay as recorded.
        </p>
        <div className={styles.presetList}>
          {FINISH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const next = previewFinishPreset(room, preset.id);
                const actions: VisitorAction[] = [
                  {
                    type: 'room-finish',
                    floorFinish: next.room.room.floorFinish,
                    wallFinish: next.room.room.wallFinish,
                  },
                  {
                    type: 'set-intent',
                    intent: { ...room.intent, style: preset.id },
                  },
                  ...next.room.furniture
                    .filter(
                      (item, i) => item.finish !== room.furniture[i]!.finish,
                    )
                    .map((item) => ({
                      type: 'finish' as const,
                      id: item.id,
                      finish: item.finish,
                    })),
                ];
                if (actions.length > POLICY.actions) {
                  controller.notify(
                    'Too many pieces for one palette change. Change individual finishes instead.',
                  );
                  return;
                }
                const r = controller.prepareVisitorPreview(
                  actions,
                  'Apply room palette',
                );
                if (!r.ok)
                  controller.notify(
                    failureMessage(
                      r,
                      controller.getSnapshot().workspace?.current,
                    ),
                  );
                else if (
                  controller.getSnapshot().candidate &&
                  next.unavailableIds.length
                )
                  controller.notify(
                    `Palette preview. ${next.unavailableIds.length} incompatible ${next.unavailableIds.length === 1 ? 'piece keeps its' : 'pieces keep their'} current finish.`,
                  );
              }}
            >
              <span
                className={styles.swatch}
                style={{ background: FINISH_PALETTE[preset.floor] }}
                aria-hidden="true"
              />
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <h3>Walls & openings</h3>
        <ul className={styles.inventory}>
          {room.room.features.map((feature) => (
            <li key={feature.id}>
              <button
                onClick={() => {
                  controller.select(feature.id);
                  focusProperties(controller, feature.id);
                }}
              >
                {featureLabel(feature)} · {feature.wall}
                <span>
                  {feature.width.value ?? '?'} mm ·{' '}
                  {feature.wallProvenance.status} wall
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.actionRow}>
          <button onClick={() => addFeature('door')}>Add door</button>
          <button onClick={() => addFeature('door', 'bathroom')}>
            Add bathroom door
          </button>
          <button onClick={() => addFeature('window')}>Add window</button>
          <button onClick={() => addFeature('door', 'balcony')}>
            Add balcony doors
          </button>
          <button onClick={() => addFeature('obstacle')}>Add obstacle</button>
        </div>
        <p className={styles.hint}>
          New features start with estimated sizes and an unknown wall. Review
          each physical fact.
        </p>
      </div>
    </>
  );
}
