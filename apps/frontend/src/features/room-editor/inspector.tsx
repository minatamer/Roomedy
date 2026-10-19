import { useId, useRef, useState } from 'react';
import type { Feature, Furniture } from '@roomedy/contracts/room';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry, supportsDimensions } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { MeasurementField, measurementLabel } from './measurements';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';

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
              pose: {
                centerX: Number(form.x),
                centerZ: Number(form.z),
                quarterTurns: item.pose.quarterTurns,
              },
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

function ResizeForm({
  controller,
  item,
}: {
  controller: SessionController;
  item: Furniture;
}) {
  const signature = `${item.id}/${item.dimensions.width.value}/${item.dimensions.depth.value}/${item.dimensions.height.value}`;
  const errorId = useId();
  const [form, setForm] = useState({
    signature,
    width: String(item.dimensions.width.value ?? ''),
    depth: String(item.dimensions.depth.value ?? ''),
    height: String(item.dimensions.height.value ?? ''),
    error: '',
    field: '',
  });
  if (form.signature !== signature)
    setForm({
      signature,
      width: String(item.dimensions.width.value ?? ''),
      depth: String(item.dimensions.depth.value ?? ''),
      height: String(item.dimensions.height.value ?? ''),
      error: '',
      field: '',
    });
  const formRef = useRef<HTMLFormElement>(null),
    entry = findCatalogueEntry(item.catalogueId, item.catalogueVersion)!;
  return (
    <form
      className={styles.section}
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        for (const axis of ['width', 'depth', 'height'] as const) {
          const n = Number(form[axis]),
            range = entry.size[axis];
          if (
            !form[axis].trim() ||
            !Number.isInteger(n) ||
            n < range.min ||
            n > range.max
          ) {
            setForm((f) => ({
              ...f,
              field: axis,
              error: `${axis}: enter a whole number from ${range.min} to ${range.max} mm.`,
            }));
            formRef.current
              ?.querySelector<HTMLInputElement>(`[name="${axis}"]`)
              ?.focus();
            return;
          }
        }
        const result = controller.dispatch(
          [
            {
              type: 'resize',
              id: item.id,
              width: Number(form.width),
              depth: Number(form.depth),
              height: Number(form.height),
            },
          ],
          'Resize proposed piece',
        );
        setForm((f) => ({
          ...f,
          field: 'size',
          error: result.ok
            ? ''
            : failureMessage(
                result,
                controller.getSnapshot().workspace?.current,
              ),
        }));
        if (!result.ok)
          formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      }}
    >
      <h3>Proposed size</h3>
      <p className={styles.hint}>
        Resizing keeps these values estimated. Confirm actual measurements
        separately.
      </p>
      {(['width', 'depth', 'height'] as const).map((axis) => (
        <label key={axis}>
          {axis} (mm)
          <input
            name={axis}
            type="number"
            step="1"
            value={form[axis]}
            disabled={item.locks.dimensions}
            aria-invalid={
              !!form.error && (form.field === axis || form.field === 'size')
            }
            aria-describedby={
              form.error && (form.field === axis || form.field === 'size')
                ? errorId
                : undefined
            }
            onChange={(e) =>
              setForm((f) => ({ ...f, [axis]: e.target.value, error: '' }))
            }
          />
        </label>
      ))}
      {form.error && (
        <p className={styles.error} role="alert" id={errorId}>
          {form.error}
        </p>
      )}
      <button disabled={item.locks.dimensions} type="submit">
        Resize piece
      </button>
    </form>
  );
}

export function FurnitureInspector({
  controller,
  item,
  onReplace,
}: {
  controller: SessionController;
  item: Furniture;
  onReplace: () => void;
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
  const protectedRemoval = Object.values(item.locks).some(Boolean);
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>{entry.category}</p>
        <h2 id={`properties-${item.id}`} tabIndex={-1}>
          {item.label}
        </h2>
      </div>
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
                    preference: e.target.value as Furniture['preference'],
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
              <option value={item.finish}>{item.finish} (recorded)</option>
            )}
            {entry.finishes.map((finish) => (
              <option key={finish} value={finish}>
                {finish}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        disabled={item.locks.rotation}
        onClick={() =>
          run(
            [
              {
                type: 'rotate',
                id: item.id,
                quarterTurns: ((item.pose.quarterTurns + 1) % 4) as
                  0 | 1 | 2 | 3,
              },
            ],
            'Rotate piece',
          )
        }
      >
        Rotate 90°
      </button>
      <details className={styles.advanced}>
        <summary>
          Advanced <span>Measurements, position & locks</span>
        </summary>
        <div className={styles.section}>
          <fieldset>
            <legend>Protect properties independently</legend>
            {(['position', 'rotation', 'dimensions'] as const).map((lock) => (
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
                          locks: { ...item.locks, [lock]: e.target.checked },
                        },
                      ],
                      `Update ${lock} lock`,
                    )
                  }
                />
                {lock} lock
              </label>
            ))}
          </fieldset>
          <p className={styles.hint}>
            Size locks protect resizing. A deliberate measurement correction
            records physical truth.
          </p>
        </div>
        <PositionForm controller={controller} item={item} />
        <div className={styles.section}>
          <h3>Measured dimensions</h3>
          <p className={styles.hint}>
            Confirm only values you have measured. Other evidence stays as it
            is.
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
                Measured size retained. Model detail is limited; this plan uses
                the true footprint.
              </p>
            )}
        </div>
        {item.ownership === 'proposed' && entry.adjustable && (
          <ResizeForm controller={controller} item={item} />
        )}
        {item.ownership === 'proposed' && !entry.adjustable && (
          <p className={styles.hint}>
            This proposed variant has one supported size. Choose another variant
            to replace it.
          </p>
        )}
      </details>
      <div className={styles.section}>
        <div className={styles.actionRow}>
          <button disabled={protectedRemoval} onClick={onReplace}>
            Replace piece…
          </button>
          <button
            disabled={protectedRemoval}
            onClick={() => {
              if (run([{ type: 'remove', id: item.id }], 'Remove piece').ok)
                focusProperties(controller);
            }}
          >
            Remove from plan
          </button>
        </div>
        {protectedRemoval && (
          <p className={styles.hint}>
            Open Advanced to unlock properties before removing or replacing this
            piece.
          </p>
        )}
      </div>
    </>
  );
}

export function FeatureInspector({
  controller,
  feature,
}: {
  controller: SessionController;
  feature: Feature;
}) {
  const update = (next: Feature) => {
    const r = controller.dispatch(
      [{ type: 'update-feature', id: feature.id, feature: next }],
      'Correct opening',
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
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>Physical correction</p>
        <h2 id={`properties-${feature.id}`} tabIndex={-1}>
          {feature.kind === 'obstacle'
            ? 'Fixed obstacle'
            : feature.kind === 'door'
              ? 'Door'
              : 'Window'}
        </h2>
      </div>
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
        {feature.kind === 'door' && (
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
        Remove {feature.kind}
      </button>
      <p className={styles.hint}>
        Corrections describe your room; they do not claim a renovation is
        possible. Width: {measurementLabel(feature.width)}.
      </p>
    </>
  );
}
