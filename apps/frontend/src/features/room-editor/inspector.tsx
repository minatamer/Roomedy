import { FurnitureMaterialControls } from './furniture-material-controls';
import { MountControls } from './mount-controls';
import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Feature, Furniture } from '@roomedy/contracts/room';
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
import { MeasurementField, measurementLabel } from './measurements';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';
import { FurnitureSizeForm } from './furniture-size-form';

function PositionForm({
  controller,
  item,
}: {
  controller: SessionController;
  item: Furniture;
}) {
  const signature = `${item.id}/${item.pose.centerX}/${item.pose.centerZ}`;
  const errorId = useId();
  const [form, setForm] = useState({
    signature,
    x: String(item.pose.centerX),
    z: String(item.pose.centerZ),
    error: '',
    field: 'x',
  });
  if (form.signature !== signature)
    setForm({
      signature,
      x: String(item.pose.centerX),
      z: String(item.pose.centerZ),
      error: '',
      field: 'x',
    });
  const xRef = useRef<HTMLInputElement>(null),
    zRef = useRef<HTMLInputElement>(null);
  return (
    <form
      noValidate
      className={styles.section}
      onSubmit={(e) => {
        e.preventDefault();
        for (const axis of ['x', 'z'] as const) {
          const n = Number(form[axis]);
          if (
            !form[axis].trim() ||
            !Number.isFinite(n) ||
            !Number.isInteger(n * 2) ||
            Math.abs(n) > POLICY.coordinateAbsMm
          ) {
            setForm((f) => ({
              ...f,
              error: `Enter ${axis.toUpperCase()} from -${POLICY.coordinateAbsMm} to ${POLICY.coordinateAbsMm} mm in 0.5 mm steps.`,
              field: axis,
            }));
            (axis === 'x' ? xRef : zRef).current?.focus();
            return;
          }
        }
        const result = controller.dispatch(
          [
            {
              type: 'move',
              id: item.id,
              pose: placementTarget(
                wallMountedPose(
                  controller.getSnapshot().workspace!.current,
                  item,
                  {
                    ...item.pose,
                    centerX: Number(form.x),
                    centerZ: Number(form.z),
                  },
                ),
              ),
            },
          ],
          'Move piece',
        );
        setForm((f) => ({
          ...f,
          field: 'position',
          error: result.ok
            ? ''
            : failureMessage(
                result,
                controller.getSnapshot().workspace?.current,
              ),
        }));
        if (!result.ok) xRef.current?.focus();
      }}
    >
      <h3>Position</h3>
      <p className={styles.hint}>
        Centre from the left and top walls.{' '}
        {item.pose.provenance.status === 'planned'
          ? 'Planned placement; original position is not confirmed.'
          : `${item.pose.provenance.status} position.`}
      </p>
      <div className={styles.twoFields}>
        <label>
          X from left (mm)
          <input
            ref={xRef}
            type="number"
            step="0.5"
            value={form.x}
            disabled={item.locks.position}
            aria-invalid={
              !!form.error && (form.field === 'x' || form.field === 'position')
            }
            aria-describedby={
              form.error && (form.field === 'x' || form.field === 'position')
                ? errorId
                : undefined
            }
            onChange={(e) =>
              setForm((f) => ({ ...f, x: e.target.value, error: '' }))
            }
          />
        </label>
        <label>
          Z from top (mm)
          <input
            ref={zRef}
            type="number"
            step="0.5"
            value={form.z}
            disabled={item.locks.position}
            aria-invalid={
              !!form.error && (form.field === 'z' || form.field === 'position')
            }
            aria-describedby={
              form.error && (form.field === 'z' || form.field === 'position')
                ? errorId
                : undefined
            }
            onChange={(e) =>
              setForm((f) => ({ ...f, z: e.target.value, error: '' }))
            }
          />
        </label>
      </div>
      {form.error && (
        <p role="alert" id={errorId} className={styles.error}>
          {form.error}
        </p>
      )}
      <div className={styles.actionRow}>
        <button type="submit" disabled={item.locks.position}>
          Set position
        </button>
      </div>
      <p className={styles.hint}>
        Rotation: {item.pose.quarterTurns * 90}°. Arrow keys move 10 mm; Shift
        100 mm; Alt 0.5 mm.
      </p>
    </form>
  );
}

export function FurnitureInspector({
  controller,
  item,
  openingPreview,
}: {
  controller: SessionController;
  item: Furniture;
  openingPreview?: ReactNode;
}) {
  const entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  const run = (actions: VisitorAction[], label: string) => {
    const r = controller.dispatch(actions, label);
    if (!r.ok)
      controller.notify(
        failureMessage(r, controller.getSnapshot().workspace?.current),
      );
    return r;
  };
  const size = {
    width: item.dimensions.width.value ?? 0,
    depth: item.dimensions.depth.value ?? 0,
    height: item.dimensions.height.value ?? 0,
  };
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>{entry.category}</p>
        <h2 id={`properties-${item.id}`} tabIndex={-1}>
          {item.label}
        </h2>
      </div>
      {openingPreview}
      <MountControls
        key={`${item.id}/${item.pose.bottomY}`}
        controller={controller}
        item={item}
      />
      <FurnitureSizeForm
        key={`${controller.getSnapshot().generation}/${item.id}/${item.catalogueId}`}
        item={item}
        onCommit={(action) => {
          const r = run([action], 'Change size estimate');
          return r.ok
            ? null
            : failureMessage(r, controller.getSnapshot().workspace?.current);
        }}
      >
        {(customSize) => (
          <>
            <div className={styles.section}>
              <label>
                Piece finish
                <select
                  value={item.finish}
                  onChange={(e) =>
                    run(
                      [
                        {
                          type: 'finish',
                          id: item.id,
                          finish: e.target.value as Furniture['finish'],
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
            </div>
            <FurnitureMaterialControls
              item={item}
              onCommit={(materials) => {
                const result = run(
                  [{ type: 'set-furniture-materials', id: item.id, materials }],
                  'Change piece materials',
                );
                return result.ok
                  ? null
                  : failureMessage(
                      result,
                      controller.getSnapshot().workspace?.current,
                    );
              }}
            />
            <details className={styles.advanced}>
              <summary>
                Advanced <span>Measurements, position & locks</span>
              </summary>
              <p className={styles.dimensionSummary}>
                {(['width', 'depth', 'height'] as const).map((axis, index) => (
                  <span key={axis}>
                    {index > 0 ? ' × ' : ''}
                    {item.dimensions[axis].status === 'estimated' ? '≈' : ''}
                    {item.dimensions[axis].value ?? '?'}
                  </span>
                ))}{' '}
                mm
              </p>
              {customSize}
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
                            ownership: e.target.checked ? 'owned' : 'proposed',
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
                  Locks protect moves, rotation and automatic changes. Applying
                  a size preset is a deliberate edit; it leaves the locks as
                  set.
                </p>
              </div>
              <PositionForm controller={controller} item={item} />
              <MountControls
                key={`${item.id}/${item.pose.bottomY}`}
                advanced
                controller={controller}
                item={item}
              />
              <div className={styles.section}>
                <h3>Measured dimensions</h3>
                <p className={styles.hint}>
                  Confirm only values you have measured. Other evidence stays as
                  it is.
                </p>
                <div className={styles.measurementGrid}>
                  {(['width', 'depth', 'height'] as const).map((field) => (
                    <MeasurementField
                      key={field}
                      controller={controller}
                      target={{ kind: 'furniture', id: item.id, field }}
                      measurement={item.dimensions[field]}
                      label={field[0]!.toUpperCase() + field.slice(1)}
                      max={POLICY.furnitureEdgeMm}
                    />
                  ))}
                </div>
                {item.ownership === 'owned' &&
                  Object.values(size).every((v) => v > 0) &&
                  !supportsDimensions(entry, size) && (
                    <p className={styles.notice}>
                      Measured size retained. Model detail is limited; this plan
                      uses the true footprint.
                    </p>
                  )}
              </div>
              {item.ownership === 'proposed' && !entry.adjustable && (
                <p className={styles.hint}>
                  This proposed variant has one supported size. Choose another
                  variant to replace it.
                </p>
              )}
            </details>
          </>
        )}
      </FurnitureSizeForm>
    </>
  );
}

export function FeatureInspector({
  controller,
  feature,
  openingPreview,
}: {
  controller: SessionController;
  feature: Feature;
  openingPreview?: ReactNode;
}) {
  const update = (next: Feature, label = 'Correct opening') => {
    const r = controller.dispatch(
      [{ type: 'update-feature', id: feature.id, feature: next }],
      label,
    );
    if (!r.ok)
      controller.notify(
        failureMessage(r, controller.getSnapshot().workspace?.current),
      );
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
          Wall: {feature.wallProvenance.status}. Offset is measured from the
          left on top/bottom walls, or from the top on side walls.
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
            const r = controller.dispatch(
              [{ type: 'remove-feature', id: feature.id }],
              'Remove opening',
            );
            if (!r.ok)
              controller.notify(
                failureMessage(r, controller.getSnapshot().workspace?.current),
              );
            else focusProperties(controller);
          }}
        >
          Remove {featureLabel(feature).toLowerCase()}
        </button>
      )}
      <p className={styles.hint}>
        Corrections describe your room; they do not claim a renovation is
        possible. Width: {measurementLabel(feature.width)}.
      </p>
    </>
  );
}
