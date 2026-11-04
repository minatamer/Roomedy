import { OpeningMaterialControls } from './opening-material-controls';
import { FurnitureMaterialControls } from './furniture-material-controls';
import { MountControls } from './mount-controls';
import { LightControls } from './light-controls';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { POLICY } from '@roomedy/contracts/policy';
import {
  findCatalogueEntry,
  supportsDimensions,
  placementTarget,
  featureLabel,
  wallMountedPose,
  openingSizePresets,
  applyOpeningSizePreset,
} from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { MeasurementField, MeasurementInput } from './measurements';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';
import furnitureStyles from './furniture-inspector.module.css';
import { FurnitureSizeForm } from './furniture-size-form';
import { InspectorTabs } from './inspector-tabs';
import layout from './appearance-controls.module.css';

function PositionForm({
  item,
  room,
  onEdit,
}: {
  item: Furniture;
  room: RoomDocument;
  onEdit: SessionController['dispatch'];
}) {
  const signature = `${item.id}/${item.pose.centerX}/${item.pose.centerZ}`;
  const errorId = useId();
  const [form, setForm] = useState({
    signature,
    x: String(item.pose.centerX),
    z: String(item.pose.centerZ),
    error: '',
    touched: false,
  });
  if (form.signature !== signature)
    setForm({
      ...form,
      signature,
      x: String(item.pose.centerX),
      z: String(item.pose.centerZ),
      error: '',
    });
  const valid = (value: string) =>
    value.trim() !== '' &&
    Number.isFinite(Number(value)) &&
    Number.isInteger(Number(value) * 2) &&
    Math.abs(Number(value)) <= POLICY.coordinateAbsMm;
  const update = (values: { x: string; z: string }) => {
    setForm({ signature, ...values, error: '', touched: true });
    if (!valid(values.x) || !valid(values.z)) return;
    const result = onEdit(
      [
        {
          type: 'move',
          id: item.id,
          pose: placementTarget(
            wallMountedPose(room, item, {
              ...item.pose,
              centerX: Number(values.x),
              centerZ: Number(values.z),
            }),
          ),
        },
      ],
      'Move piece',
    );
    if (!result.ok)
      setForm({
        signature,
        ...values,
        error: failureMessage(result, room),
        touched: true,
      });
  };
  return (
    <form
      noValidate
      className={styles.section}
      data-inspector-invalid={
        (form.touched && (!valid(form.x) || !valid(form.z) || !!form.error)) ||
        undefined
      }
      onSubmit={(event) => {
        event.preventDefault();
        update(form);
      }}
    >
      <h3>Position</h3>
      <p className={styles.hint}>Centre from the left and top walls.</p>
      <div className={styles.twoFields}>
        {(['x', 'z'] as const).map((axis) => (
          <label key={axis}>
            {axis === 'x' ? 'X from left (mm)' : 'Z from top (mm)'}
            <input
              type="number"
              step="0.5"
              min={-POLICY.coordinateAbsMm}
              max={POLICY.coordinateAbsMm}
              value={form[axis]}
              disabled={item.locks.position}
              aria-invalid={form.touched && !valid(form[axis])}
              aria-describedby={form.error ? errorId : undefined}
              onChange={(event) =>
                update({ x: form.x, z: form.z, [axis]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
      {form.error && (
        <p role="alert" id={errorId} className={styles.error}>
          {form.error}
        </p>
      )}
      <p className={styles.hint}>Rotation: {item.pose.quarterTurns * 90}°.</p>
    </form>
  );
}

export function FurnitureInspector({
  controller,
  item,
  openingPreview,
  room = controller.getSnapshot().workspace!.current,
  onEdit,
}: {
  controller: SessionController;
  item: Furniture;
  room?: RoomDocument;
  onEdit?: SessionController['dispatch'] | undefined;
  openingPreview?: ReactNode;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  const run = (actions: VisitorAction[], label: string) => {
    const r = onEdit
      ? onEdit(actions, label)
      : controller.previewInspector(actions, label);
    if (!r.ok) controller.notify(failureMessage(r, room));
    return r;
  };
  const size = {
    width: item.dimensions.width.value ?? 0,
    depth: item.dimensions.depth.value ?? 0,
    height: item.dimensions.height.value ?? 0,
  };
  return (
    <div className={furnitureStyles.inspector}>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>{entry.category}</p>
        <h2 id={`properties-${item.id}`} tabIndex={-1}>
          {item.label}
        </h2>
      </div>
      {openingPreview}
      <FurnitureSizeForm
        resetKey={controller.getSnapshot().inspectorReset ?? 0}
        item={item}
        onCommit={(action) => {
          const result = run([action], 'Change size');
          return result.ok ? null : failureMessage(result, room);
        }}
      >
        {(customSize, presetSize) => (
          <InspectorTabs
            resetKey={controller.getSnapshot().inspectorReset ?? 0}
            label="Furniture settings"
            sections={[
              {
                id: 'appearance',
                label: 'Appearance',
                content: (
                  <div className={layout.stack}>
                    {entry.category === 'lighting' && (
                      <LightControls item={item} onEdit={run} />
                    )}
                    <FurnitureMaterialControls
                      finishControl={
                        <label>
                          Base finish
                          <select
                            aria-label="Piece finish"
                            value={item.finish}
                            onChange={(e) =>
                              run(
                                [
                                  {
                                    type: 'finish',
                                    id: item.id,
                                    finish: e.target
                                      .value as Furniture['finish'],
                                  },
                                ],
                                'Change piece finish',
                              )
                            }
                          >
                            {!entry.finishes.includes(item.finish) && (
                              <option value={item.finish}>
                                {item.finish} (recorded)
                              </option>
                            )}
                            {entry.finishes.map((finish) => (
                              <option key={finish} value={finish}>
                                {finish}
                              </option>
                            ))}
                          </select>
                        </label>
                      }
                      item={item}
                      onCommit={(materials) => {
                        const result = run(
                          [
                            {
                              type: 'set-furniture-materials',
                              id: item.id,
                              materials,
                            },
                          ],
                          'Change piece materials',
                        );
                        return result.ok ? null : failureMessage(result, room);
                      }}
                    />
                  </div>
                ),
              },
              {
                id: 'size',
                label: 'Size',
                content: (
                  <>
                    <MountControls
                      live
                      controller={controller}
                      room={room}
                      onEdit={run}
                      item={item}
                    />
                    {presetSize}
                    {customSize}
                    <PositionForm room={room} onEdit={run} item={item} />
                    <MountControls
                      live
                      advanced
                      controller={controller}
                      room={room}
                      onEdit={run}
                      item={item}
                    />
                  </>
                ),
              },
              {
                id: 'advanced',
                label: 'Advanced',
                content: (
                  <>
                    <div className={styles.section}>
                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={item.ownership === 'owned'}
                          onChange={(e) =>
                            run(
                              [
                                {
                                  type: 'set-ownership',
                                  id: item.id,
                                  ownership: e.target.checked
                                    ? 'owned'
                                    : 'proposed',
                                },
                              ],
                              'Update ownership',
                            )
                          }
                        />
                        I already own this
                      </label>
                      <label>
                        In this plan
                        <select
                          value={item.preference}
                          onChange={(e) =>
                            run(
                              [
                                {
                                  type: 'set-preference',
                                  id: item.id,
                                  preference: e.target
                                    .value as Furniture['preference'],
                                },
                              ],
                              'Update piece preference',
                            )
                          }
                        >
                          <option value="keep">Keep</option>
                          <option value="flexible">Flexible</option>
                          <option value="replace">May replace</option>
                        </select>
                      </label>
                    </div>

                    <div className={styles.section}>
                      <fieldset>
                        <legend>Protect properties independently</legend>
                        {(['position', 'rotation', 'dimensions'] as const).map(
                          (lock) => (
                            <label className={styles.checkLabel} key={lock}>
                              <input
                                type="checkbox"
                                checked={item.locks[lock]}
                                onChange={(e) =>
                                  run(
                                    [
                                      {
                                        type: 'set-locks',
                                        id: item.id,
                                        locks: {
                                          ...item.locks,
                                          [lock]: e.target.checked,
                                        },
                                      },
                                    ],
                                    `Update ${lock} lock`,
                                  )
                                }
                              />
                              {lock} lock
                            </label>
                          ),
                        )}
                      </fieldset>
                      <p className={styles.hint}>
                        Locks protect moves, rotation and automatic changes.
                        Applying a size preset is a deliberate edit; it leaves
                        the locks as set.
                      </p>
                    </div>
                    <div className={styles.section}>
                      <h3>Dimensions</h3>
                      <div className={styles.measurementGrid}>
                        {(['width', 'depth', 'height'] as const).map(
                          (field) => (
                            <MeasurementInput
                              live
                              key={field}
                              onCommit={(value) => {
                                const result = run(
                                  [
                                    {
                                      type: 'confirm-measurement',
                                      target: {
                                        kind: 'furniture',
                                        id: item.id,
                                        field,
                                      },
                                      value,
                                    },
                                  ],
                                  value === null
                                    ? `Clear ${field}`
                                    : `Set ${field}`,
                                );
                                return result.ok
                                  ? null
                                  : failureMessage(result, room);
                              }}
                              measurement={item.dimensions[field]}
                              label={field[0]!.toUpperCase() + field.slice(1)}
                              max={POLICY.furnitureEdgeMm}
                            />
                          ),
                        )}
                      </div>
                      {item.ownership === 'owned' &&
                        Object.values(size).every((v) => v > 0) &&
                        !supportsDimensions(entry, size) && (
                          <p className={styles.notice}>
                            Measured size retained. Model detail is limited;
                            this plan uses the true footprint.
                          </p>
                        )}
                    </div>
                    {item.ownership === 'proposed' && !entry.adjustable && (
                      <p className={styles.hint}>
                        This proposed variant has one supported size. Choose
                        another variant to replace it.
                      </p>
                    )}
                  </>
                ),
              },
            ]}
          />
        )}
      </FurnitureSizeForm>
    </div>
  );
}

export function FeatureInspector({
  controller,
  feature,
  openingPreview,
  onEdit,
  room = controller.getSnapshot().workspace!.current,
}: {
  controller: SessionController;
  feature: Feature;
  openingPreview?: ReactNode;
  onEdit?: SessionController['dispatch'];
  room?: RoomDocument;
}) {
  const run = onEdit ?? controller.previewInspector.bind(controller);
  const update = (next: Feature, label = 'Correct opening') => {
    const r = run(
      [{ type: 'update-feature', id: feature.id, feature: next }],
      label,
    );
    if (!r.ok) controller.notify(failureMessage(r, room));
  };
  const evidence = (value: string) =>
    value === 'unknown'
      ? { status: 'unknown' as const, sourceId: null }
      : { status: 'confirmed' as const, sourceId: 'visitor-confirmed' };
  const presets = openingSizePresets(feature),
    currentPreset = presets.find(
      (preset) =>
        preset.width === feature.width.value &&
        preset.height === feature.height.value,
    );
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>Physical correction</p>
        <h2 id={`properties-${feature.id}`} tabIndex={-1}>
          {featureLabel(feature)}
        </h2>
      </div>
      {openingPreview}
      <OpeningMaterialControls
        feature={feature}
        onCommit={(materials) => {
          const result = run(
            [{ type: 'set-opening-materials', id: feature.id, materials }],
            'Change opening appearance',
          );
          return result.ok ? null : failureMessage(result, room);
        }}
      />
      {presets.length > 0 && (
        <label>
          Size preset
          <select
            value={currentPreset?.id ?? 'custom'}
            onChange={(event) => {
              const next = applyOpeningSizePreset(feature, event.target.value);
              if (next)
                update(next, `Resize ${featureLabel(feature).toLowerCase()}`);
            }}
          >
            <option value="custom" disabled>
              Custom / current size
            </option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} · {preset.width} × {preset.height} mm
              </option>
            ))}
          </select>
        </label>
      )}
      {feature.kind === 'door' && (
        <label>
          Door leads to
          <select
            value={feature.purpose ?? 'room'}
            onChange={(e) =>
              update({
                ...feature,
                purpose: e.target.value as 'room' | 'bathroom' | 'balcony',
              })
            }
          >
            <option value="room">Hall / adjoining space</option>
            <option value="bathroom">Bathroom</option>
            <option value="balcony">Balcony · double glass doors</option>
          </select>
        </label>
      )}
      <div className={styles.section}>
        <label>
          Wall (your correction)
          <select
            value={feature.wall}
            onChange={(e) =>
              update({
                ...feature,
                wall: e.target.value as Feature['wall'],
                wallProvenance: evidence(e.target.value),
              })
            }
          >
            {['north', 'east', 'south', 'west', 'unknown'].map((wall) => (
              <option key={wall} value={wall}>
                {wall}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.hint}>
          Offset is measured from the left on top/bottom walls, or from the top
          on side walls.
        </p>
        {feature.wall !== 'unknown' &&
          feature.wallProvenance.status !== 'confirmed' && (
            <button
              onClick={() =>
                update({ ...feature, wallProvenance: evidence(feature.wall) })
              }
            >
              Confirm wall
            </button>
          )}
        {feature.kind !== 'obstacle' && (
          <>
            <label>
              Mechanism (your correction)
              <select
                value={feature.mechanism}
                onChange={(e) => {
                  const mechanismProvenance = evidence(e.target.value);
                  if (feature.kind === 'door')
                    update({
                      ...feature,
                      mechanism: e.target.value as Extract<
                        Feature,
                        { kind: 'door' }
                      >['mechanism'],
                      mechanismProvenance,
                    });
                  else
                    update({
                      ...feature,
                      mechanism: e.target.value as Extract<
                        Feature,
                        { kind: 'window' }
                      >['mechanism'],
                      mechanismProvenance,
                    });
                }}
              >
                {(feature.kind === 'door'
                  ? ['inward', 'outward', 'sliding', 'unknown']
                  : ['fixed', 'inward', 'outward', 'sliding', 'unknown']
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <p className={styles.hint}>
              Mechanism: {feature.mechanismProvenance.status}
            </p>
            {feature.mechanism !== 'unknown' &&
              feature.mechanismProvenance.status !== 'confirmed' && (
                <button
                  onClick={() =>
                    update({
                      ...feature,
                      mechanismProvenance: evidence(feature.mechanism),
                    })
                  }
                >
                  Confirm mechanism
                </button>
              )}
          </>
        )}
        {feature.kind === 'door' && feature.mechanism !== 'sliding' && (
          <>
            <label>
              Hinge (your correction)
              <select
                value={feature.hinge}
                onChange={(e) =>
                  update({
                    ...feature,
                    hinge: e.target.value as 'left' | 'right' | 'unknown',
                    hingeProvenance: evidence(e.target.value),
                  })
                }
              >
                {['left', 'right', 'unknown'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <p className={styles.hint}>
              Hinge: {feature.hingeProvenance.status}. Inward-door clearance
              uses a conservative rectangle.
            </p>
            {feature.hinge !== 'unknown' &&
              feature.hingeProvenance.status !== 'confirmed' && (
                <button
                  onClick={() =>
                    update({
                      ...feature,
                      hingeProvenance: evidence(feature.hinge),
                    })
                  }
                >
                  Confirm hinge
                </button>
              )}
          </>
        )}
      </div>
      <div className={styles.section}>
        {(['offset', 'width', 'height', 'sill'] as const).map((field) => (
          <MeasurementField
            live
            onEdit={run}
            key={field}
            controller={controller}
            target={{ kind: 'feature', id: feature.id, field }}
            measurement={feature[field]}
            label={field[0]!.toUpperCase() + field.slice(1)}
            min={field === 'offset' || field === 'sill' ? 0 : 1}
            max={POLICY.roomEdgeMm}
          />
        ))}
        {feature.kind === 'obstacle' && (
          <MeasurementField
            live
            onEdit={run}
            controller={controller}
            target={{ kind: 'feature', id: feature.id, field: 'projection' }}
            measurement={feature.projection}
            label="Projection"
            max={POLICY.roomEdgeMm}
          />
        )}
      </div>
      {feature.kind !== 'door' && (
        <button
          onClick={() => {
            const r = run(
              [{ type: 'remove-feature', id: feature.id }],
              'Remove opening',
            );
            if (!r.ok) controller.notify(failureMessage(r, room));
            else focusProperties(controller);
          }}
        >
          Remove {featureLabel(feature).toLowerCase()}
        </button>
      )}
      <p className={styles.hint}>
        Corrections describe your room; they do not claim a renovation is
        possible.
      </p>
    </>
  );
}
