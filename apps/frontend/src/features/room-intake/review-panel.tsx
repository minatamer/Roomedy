import { useRef, useState } from 'react';
import Image from 'next/image';
import { POLICY } from '@roomedy/contracts/policy';
import type { Feature, Furniture } from '@roomedy/contracts/room';
import type { Measurement } from '@roomedy/contracts/primitives';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { CATALOGUE, findCatalogueEntry } from '@roomedy/spatial';
import { MeasurementInput } from '../room-editor/measurements';
import { draftFeature } from './draft';
import { FurnitureSizeForm } from '../room-editor/furniture-size-form';
import { SurfaceControls } from '../room-editor/surface-controls';
import type { ReviewController, ReviewSnapshot } from './review-controller';
import editorStyles from '../room-editor/editor.module.css';
import styles from './intake.module.css';

type Target = Extract<VisitorAction, { type: 'confirm-measurement' }>['target'];
function Value({
  controller,
  target,
  value,
  label,
  max = POLICY.roomEdgeMm,
  min = 1,
}: {
  controller: ReviewController;
  target: Target;
  value: Measurement;
  label: string;
  max?: number;
  min?: number;
}) {
  return (
    <div data-review-field={target.field}>
      <MeasurementInput
        measurement={value}
        label={label}
        min={min}
        max={max}
        onCommit={(number) =>
          controller.command(
            [{ type: 'confirm-measurement', target, value: number }],
            number === null
              ? 'Value marked unknown.'
              : 'Measurement confirmed.',
          )
        }
      />
    </div>
  );
}
function Position({
  piece,
  controller,
}: {
  piece: Furniture;
  controller: ReviewController;
}) {
  const committed = `${piece.pose.centerX}/${piece.pose.centerZ}`,
    [form, setForm] = useState({
      committed,
      x: String(piece.pose.centerX),
      z: String(piece.pose.centerZ),
      error: '',
    }),
    first = useRef<HTMLInputElement>(null);
  if (form.committed !== committed)
    setForm({
      committed,
      x: String(piece.pose.centerX),
      z: String(piece.pose.centerZ),
      error: '',
    });
  return (
    <div className={editorStyles.section}>
      <h3>Sketch placement</h3>
      <p className={editorStyles.hint}>
        {piece.pose.provenance.status === 'planned'
          ? 'Your planned position.'
          : 'This position is a draft estimate.'}{' '}
        Set a deliberate position only when useful.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const x = Number(form.x),
            z = Number(form.z);
          if (
            !form.x.trim() ||
            !form.z.trim() ||
            ![x, z].every(
              (n) =>
                Number.isFinite(n) &&
                n * 2 === Math.round(n * 2) &&
                Math.abs(n) <= POLICY.coordinateAbsMm,
            )
          ) {
            setForm({
              ...form,
              error: 'Use millimetres in 0.5 mm steps, within ±40000 mm.',
            });
            first.current?.focus();
            return;
          }
          const error = controller.command(
            [
              {
                type: 'move',
                id: piece.id,
                pose: {
                  centerX: x,
                  centerZ: z,
                  quarterTurns: piece.pose.quarterTurns,
                },
              },
            ],
            'Planned position set.',
          );
          setForm({ ...form, error: error ?? '' });
        }}
      >
        <div className={editorStyles.twoFields}>
          <label>
            X from left (mm)
            <input
              ref={first}
              type="number"
              step="0.5"
              value={form.x}
              disabled={piece.locks.position}
              onChange={(e) =>
                setForm({ ...form, x: e.target.value, error: '' })
              }
            />
          </label>
          <label>
            Z from top (mm)
            <input
              type="number"
              step="0.5"
              value={form.z}
              disabled={piece.locks.position}
              onChange={(e) =>
                setForm({ ...form, z: e.target.value, error: '' })
              }
            />
          </label>
        </div>
        <button disabled={piece.locks.position}>Set sketch position</button>
        {form.error && (
          <p role="alert" className={editorStyles.error}>
            {form.error}
          </p>
        )}
      </form>
      <button
        disabled={piece.locks.rotation}
        onClick={() =>
          controller.command(
            [
              {
                type: 'rotate',
                id: piece.id,
                quarterTurns: ((piece.pose.quarterTurns + 1) % 4) as
                  0 | 1 | 2 | 3,
              },
            ],
            'Rotation corrected.',
          )
        }
      >
        Rotate 90°
      </button>
    </div>
  );
}
function Evidence({
  state,
  controller,
  id,
}: {
  state: ReviewSnapshot;
  controller: ReviewController;
  id: string;
}) {
  const [photo, setPhoto] = useState(''),
    link = state.draft.links.find((l) => l.entityId === id),
    others = state.draft.observations.filter(
      (o) => !state.draft.links.some((l) => l.observations.includes(o.ref)),
    );
  const available = state.photos.filter((photo) => photo.status === 'ready');
  if (
    !link?.observations.length &&
    available.length === 0 &&
    others.length === 0
  )
    return null;
  return (
    <section className={editorStyles.section}>
      <h3>Photo evidence</h3>
      {!!link && link.observations.length > 1 && (
        <p className={styles.hint}>
          Check whether these photos show one piece. Separate them if they show
          different pieces.
        </p>
      )}
      {link?.observations.map((ref) => {
        const observation = state.draft.observations.find((o) => o.ref === ref),
          photo = state.photos.find((p) => p.id === observation?.sourceId),
          index = state.photos.findIndex((p) => p.id === observation?.sourceId);
        return (
          <div key={ref} className={styles.evidence}>
            {photo?.previewUrl ? (
              <Image
                src={photo.previewUrl}
                width={140}
                height={100}
                alt={`Linked photo ${index + 1}`}
                unoptimized
              />
            ) : (
              <p>Original photo unavailable</p>
            )}
            <span>
              {observation?.label ?? 'Observation'}
              {observation?.visibility !== 'visible'
                ? ` · ${observation?.visibility}`
                : ''}
            </span>
            {!!state.draft.room.furniture.find((p) => p.id === id) &&
              link.observations.length > 1 && (
                <button onClick={() => controller.split(id, ref)}>
                  Separate as another piece
                </button>
              )}
            <button onClick={() => controller.excludeObservation(ref)}>
              Exclude observation
            </button>
          </div>
        );
      })}
      {available.length > 0 && (
        <>
          <label>
            Link an available photo
            <select value={photo} onChange={(e) => setPhoto(e.target.value)}>
              <option value="">Choose a photo</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  Photo {state.photos.indexOf(p) + 1} ·{' '}
                  {(() => {
                    const source = state.draft.sources.find(
                      (s) => s.id === p.id,
                    );
                    const role =
                      p.purpose === 'auto'
                        ? source?.detectedPurpose
                        : p.purpose;
                    return role === 'room'
                      ? 'Room view'
                      : role === 'furniture'
                        ? 'Furniture detail'
                        : 'Photo';
                  })()}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={
              !state.photos.some((p) => p.id === photo && p.status === 'ready')
            }
            onClick={() => controller.attachPhoto(id, photo)}
          >
            Link photo
          </button>
        </>
      )}
      {others.length > 0 && (
        <>
          <p>Unassigned observations</p>
          {others.map((o) => (
            <div key={o.ref}>
              <span>{o.label}</span>
              <button onClick={() => controller.linkObservation(id, o.ref)}>
                Link to this item
              </button>
              <button onClick={() => controller.excludeObservation(o.ref)}>
                Exclude
              </button>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
function PiecePanel({
  piece,
  state,
  controller,
}: {
  piece: Furniture;
  state: ReviewSnapshot;
  controller: ReviewController;
}) {
  const [other, setOther] = useState(''),
    entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
  return (
    <>
      <p className={styles.eyebrow}>Existing or planned furniture</p>
      <h2 tabIndex={-1}>{piece.label}</h2>
      <label>
        Similar representation
        <select
          value={piece.catalogueId}
          onChange={(e) => controller.category(piece.id, e.target.value)}
        >
          {CATALOGUE.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <FurnitureSizeForm
        key={`${controller.session.getSnapshot().generation}/${piece.id}/${piece.catalogueId}/${piece.ownership}`}
        item={piece}
        onCommit={(action) =>
          controller.command([action], 'Size estimate updated.')
        }
        onUnlock={() =>
          controller.command(
            [
              {
                type: 'set-locks',
                id: piece.id,
                locks: { ...piece.locks, dimensions: false },
              },
            ],
            'Size unlocked.',
          )
        }
      />
      <label className={editorStyles.checkLabel}>
        <input
          type="checkbox"
          checked={piece.ownership === 'owned'}
          onChange={(e) =>
            controller.command([
              {
                type: 'set-ownership',
                id: piece.id,
                ownership: e.target.checked ? 'owned' : 'proposed',
              },
            ])
          }
        />
        I already own this
      </label>
      <label>
        In this room
        <select
          value={piece.preference}
          onChange={(e) =>
            controller.command([
              {
                type: 'set-preference',
                id: piece.id,
                preference: e.target.value as Furniture['preference'],
              },
            ])
          }
        >
          <option value="keep">Keep</option>
          <option value="replace">May replace</option>
          <option value="flexible">Flexible</option>
        </select>
      </label>
      <fieldset>
        <legend>Protect independently</legend>
        {(['position', 'rotation', 'dimensions'] as const).map((key) => (
          <label key={key} className={editorStyles.checkLabel}>
            <input
              type="checkbox"
              checked={piece.locks[key]}
              onChange={(e) =>
                controller.command([
                  {
                    type: 'set-locks',
                    id: piece.id,
                    locks: { ...piece.locks, [key]: e.target.checked },
                  },
                ])
              }
            />
            {key} lock
          </label>
        ))}
      </fieldset>
      <section className={editorStyles.section}>
        <h3>Physical measurements</h3>
        <p>Confirm what you measured. Unknown values can stay unknown.</p>
        <div className={editorStyles.measurementGrid}>
          {(['width', 'depth', 'height'] as const).map((axis) => (
            <Value
              key={axis}
              controller={controller}
              target={{ kind: 'furniture', id: piece.id, field: axis }}
              value={piece.dimensions[axis]}
              label={axis[0]!.toUpperCase() + axis.slice(1)}
              max={
                piece.ownership === 'owned'
                  ? POLICY.furnitureEdgeMm
                  : (entry?.size[axis].max ?? POLICY.furnitureEdgeMm)
              }
              min={
                piece.ownership === 'owned' ? 1 : (entry?.size[axis].min ?? 1)
              }
            />
          ))}
        </div>
      </section>
      <Position piece={piece} controller={controller} />
      <Evidence id={piece.id} state={state} controller={controller} />
      {state.draft.room.furniture.length > 1 && (
        <section className={editorStyles.section}>
          <h3>Same physical piece?</h3>
          <p>
            Merge its photo observations here. Reviewed measurements and locks
            are preserved; conflicting values need correction.
          </p>
          <label>
            Other sketch piece
            <select value={other} onChange={(e) => setOther(e.target.value)}>
              <option value="">Choose a piece</option>
              {state.draft.room.furniture
                .filter((p) => p.id !== piece.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={
              !state.draft.room.furniture.some(
                (p) => p.id === other && p.id !== piece.id,
              )
            }
            onClick={() => controller.merge(piece.id, other)}
          >
            Merge into this piece
          </button>
        </section>
      )}
      <section className={editorStyles.section}>
        <button onClick={() => controller.remove(piece.id)}>
          Remove piece from sketch
        </button>
      </section>
    </>
  );
}
function FeaturePanel({
  feature,
  state,
  controller,
}: {
  feature: Feature;
  state: ReviewSnapshot;
  controller: ReviewController;
}) {
  const update = (next: Feature) =>
    controller.command(
      [{ type: 'update-feature', id: feature.id, feature: next }],
      'Feature corrected.',
    );
  return (
    <>
      <p className={styles.eyebrow}>Wall feature</p>
      <h2 tabIndex={-1}>{feature.kind}</h2>
      <label>
        Feature type
        <select
          value={feature.kind}
          onChange={(e) => {
            const base = draftFeature(
              e.target.value as Feature['kind'],
              feature.id,
            );
            update({
              ...base,
              wall: feature.wall,
              wallProvenance: feature.wallProvenance,
              offset: feature.offset,
              width: feature.width,
              height: feature.height,
              sill: feature.sill,
            });
          }}
        >
          <option value="door">Door</option>
          <option value="window">Window</option>
          <option value="obstacle">Fixed obstacle</option>
        </select>
      </label>
      <label data-review-field="wall">
        Sketch wall
        <select
          value={feature.wall}
          onChange={(e) => {
            const wall = e.target.value as Feature['wall'];
            update({
              ...feature,
              wall,
              wallProvenance:
                wall === 'unknown'
                  ? { status: 'unknown', sourceId: null }
                  : { status: 'confirmed', sourceId: 'visitor-confirmed' },
            });
          }}
        >
          <option value="unknown">Unknown</option>
          <option value="north">Top / reference wall</option>
          <option value="east">Right wall</option>
          <option value="south">Bottom wall</option>
          <option value="west">Left wall</option>
        </select>
      </label>
      {feature.wall !== 'unknown' &&
        feature.wallProvenance.status !== 'confirmed' && (
          <button
            onClick={() =>
              update({
                ...feature,
                wallProvenance: {
                  status: 'confirmed',
                  sourceId: 'visitor-confirmed',
                },
              })
            }
          >
            Confirm this wall
          </button>
        )}
      {feature.kind !== 'obstacle' && (
        <>
          <label data-review-field="mechanism">
            Opening mechanism
            <select
              value={feature.mechanism}
              onChange={(e) => {
                const mechanism = e.target.value as typeof feature.mechanism;
                const next = structuredClone(feature);
                if (next.kind === 'door') {
                  if (mechanism === 'fixed') {
                    controller.notify(
                      'A fixed opening is not a supported door mechanism.',
                    );
                    return;
                  }
                  next.mechanism = mechanism;
                } else next.mechanism = mechanism;
                next.mechanismProvenance =
                  mechanism === 'unknown'
                    ? { status: 'unknown', sourceId: null }
                    : { status: 'confirmed', sourceId: 'visitor-confirmed' };
                update(next);
              }}
            >
              <option value="unknown">Unknown</option>
              {feature.kind === 'window' && (
                <option value="fixed">Fixed</option>
              )}
              <option value="inward">Opens inward</option>
              <option value="outward">Opens outward</option>
              <option value="sliding">Sliding</option>
            </select>
          </label>
          {feature.mechanism !== 'unknown' &&
            feature.mechanismProvenance.status !== 'confirmed' && (
              <button
                onClick={() =>
                  update({
                    ...feature,
                    mechanismProvenance: {
                      status: 'confirmed',
                      sourceId: 'visitor-confirmed',
                    },
                  })
                }
              >
                Confirm this mechanism
              </button>
            )}
        </>
      )}
      {feature.kind === 'door' && (
        <>
          <label data-review-field="hinge">
            Hinge end along the wall
            <select
              value={feature.hinge}
              onChange={(e) => {
                const hinge = e.target.value as typeof feature.hinge;
                update({
                  ...feature,
                  hinge,
                  hingeProvenance:
                    hinge === 'unknown'
                      ? { status: 'unknown', sourceId: null }
                      : { status: 'confirmed', sourceId: 'visitor-confirmed' },
                });
              }}
            >
              <option value="unknown">Unknown</option>
              <option value="left">Start of wall interval</option>
              <option value="right">End of wall interval</option>
            </select>
          </label>
          {feature.hinge !== 'unknown' &&
            feature.hingeProvenance.status !== 'confirmed' && (
              <button
                onClick={() =>
                  update({
                    ...feature,
                    hingeProvenance: {
                      status: 'confirmed',
                      sourceId: 'visitor-confirmed',
                    },
                  })
                }
              >
                Confirm this hinge
              </button>
            )}
        </>
      )}
      {(['offset', 'width', 'height', 'sill'] as const).map((field) => (
        <Value
          key={field}
          controller={controller}
          target={{ kind: 'feature', id: feature.id, field }}
          value={feature[field]}
          label={
            field === 'offset'
              ? 'Distance along wall'
              : field === 'sill'
                ? 'Height above floor'
                : field[0]!.toUpperCase() + field.slice(1)
          }
          min={field === 'offset' || field === 'sill' ? 0 : 1}
        />
      ))}
      {feature.kind === 'obstacle' && (
        <Value
          controller={controller}
          target={{ kind: 'feature', id: feature.id, field: 'projection' }}
          value={feature.projection}
          label="Projection into room"
        />
      )}
      <Evidence id={feature.id} state={state} controller={controller} />
      <button
        onClick={() =>
          controller.command(
            [{ type: 'remove-feature', id: feature.id }],
            'Feature removed from sketch.',
          )
        }
      >
        Remove feature from sketch
      </button>
    </>
  );
}
export function ReviewPanel({
  state,
  controller,
  onFocusSelected,
}: {
  state: ReviewSnapshot;
  controller: ReviewController;
  onFocusSelected: () => void;
}) {
  const { draft, selectedId } = state,
    piece = draft.room.furniture.find((p) => p.id === selectedId),
    feature = draft.room.room.features.find((f) => f.id === selectedId);
  return (
    <div
      className={`${editorStyles.panel} ${styles.reviewPanel}`}
      key={selectedId}
    >
      {piece ? (
        <PiecePanel piece={piece} state={state} controller={controller} />
      ) : feature ? (
        <FeaturePanel feature={feature} state={state} controller={controller} />
      ) : (
        <>
          <p className={styles.eyebrow}>Your reference rectangle</p>
          <h2 tabIndex={-1}>Room measurements</h2>
          <label data-review-field="shape">
            Room shape
            <select
              value={draft.shape}
              onChange={(e) =>
                controller.shape(e.target.value as typeof draft.shape)
              }
            >
              <option value="unknown">Not reviewed yet</option>
              <option value="rectangle">One rectangular room</option>
              <option value="unsupported">
                Room has extra corners / another shape
              </option>
            </select>
          </label>
          <label>
            Starting condition
            <select
              value={draft.room.intent.condition}
              onChange={(e) =>
                controller.command([
                  {
                    type: 'set-intent',
                    intent: {
                      ...draft.room.intent,
                      condition: e.target
                        .value as typeof draft.room.intent.condition,
                    },
                  },
                ])
              }
            >
              <option value="empty">Empty room</option>
              <option value="partial">Partly furnished</option>
              <option value="furnished">Furnished</option>
            </select>
          </label>
          {draft.shape === 'unsupported' && (
            <p className={editorStyles.notice}>
              Check the room shape. Only one rectangular room can be opened.
            </p>
          )}
          <div className={editorStyles.measurementGrid}>
            {(['width', 'depth', 'height'] as const).map((axis) => (
              <Value
                key={axis}
                controller={controller}
                target={{ kind: 'room', id: draft.room.roomId, field: axis }}
                value={draft.room.room[axis]}
                label={
                  axis === 'width'
                    ? 'Room width · left to right'
                    : axis === 'depth'
                      ? 'Room depth · top to bottom'
                      : 'Room height'
                }
              />
            ))}
          </div>
          <SurfaceControls
            key={controller.session.getSnapshot().generation}
            room={draft.room}
            onApply={(actions, label) => controller.command(actions, label)}
          />
          {draft.frameReviewed && (
            <fieldset>
              <legend>Make room for</legend>
              {(['sleep', 'work', 'storage', 'open-space'] as const).map(
                (goal) => (
                  <label key={goal} className={editorStyles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={draft.room.intent.goals.includes(goal)}
                      onChange={(e) =>
                        controller.command([
                          {
                            type: 'set-intent',
                            intent: {
                              ...draft.room.intent,
                              goals: e.target.checked
                                ? [...draft.room.intent.goals, goal]
                                : draft.room.intent.goals.filter(
                                    (g) => g !== goal,
                                  ),
                            },
                          },
                        ])
                      }
                    />
                    {goal === 'open-space'
                      ? 'Open space'
                      : goal[0]!.toUpperCase() + goal.slice(1)}
                  </label>
                ),
              )}
            </fieldset>
          )}
          <p className={editorStyles.hint}>
            The sketch top is your reference wall. Width and depth corrections
            preserve measured pieces and deliberate placements.
          </p>
          {draft.observations.filter(
            (o) => !draft.links.some((l) => l.observations.includes(o.ref)),
          ).length > 0 && (
            <section className={editorStyles.section}>
              <h3>Unassigned observations</h3>
              {draft.observations
                .filter(
                  (o) =>
                    !draft.links.some((l) => l.observations.includes(o.ref)),
                )
                .map((o) => (
                  <div key={o.ref}>
                    <p>
                      {o.label} · {o.visibility} · choose a similar
                      representation and link it, or exclude a mistaken
                      observation.
                    </p>
                    <button
                      onClick={() => controller.excludeObservation(o.ref)}
                    >
                      Exclude observation
                    </button>
                  </div>
                ))}
            </section>
          )}
        </>
      )}
      <section className={editorStyles.section}>
        <h3>Add a missed feature</h3>
        <div className={styles.actions}>
          {(['door', 'window', 'obstacle'] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => {
                controller.addFeature(kind);
                onFocusSelected();
              }}
            >
              Add {kind}
            </button>
          ))}
        </div>
      </section>
      {state.message && (
        <p role="status" aria-live="polite" className={styles.reviewMessage}>
          {state.message}
        </p>
      )}
    </div>
  );
}
