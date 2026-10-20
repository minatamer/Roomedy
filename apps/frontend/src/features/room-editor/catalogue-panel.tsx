import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Image from 'next/image';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Furniture, RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import {
  CATALOGUE,
  preferredFurnitureFacing,
  wallMountedPose,
} from '@roomedy/spatial';
import { thumbnailUrl } from '../catalogue/catalogue';
import type { SessionController } from '../session/controller';
import { failureMessage } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';
import { FurnitureSizeFields } from './furniture-size-form';
import { furnitureSizePresets, parseSizeInput } from './size-presets';
import type { SizeInputValues } from './size-presets';
import { catalogueFurniture } from './catalogue-placement';
import type { CataloguePlacement } from './catalogue-placement';
import { useCataloguePlacementInput } from './catalogue-placement-input';

function PlacementForm({
  entry,
  room,
  controller,
  replacement,
  onDone,
}: {
  entry: CatalogueEntry;
  room: RoomDocument;
  controller: SessionController;
  replacement: Furniture | null;
  onDone: () => void;
}) {
  const [values, setValues] = useState({
    x: String(replacement?.pose.centerX ?? (room.room.width.value ?? 4200) / 2),
    z: String(replacement?.pose.centerZ ?? (room.room.depth.value ?? 4800) / 2),
    error: '',
    field: 'x',
  });
  const [sizeValues, setSizeValues] = useState<SizeInputValues>({
    preset: '',
    width: String(entry.size.width.default),
    depth: String(entry.size.depth.default),
  });
  const errorId = useId();
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <form
      ref={form}
      noValidate
      className={styles.section}
      onSubmit={(e) => {
        e.preventDefault();
        const chosenSize = parseSizeInput(sizeValues, entry, false);
        if (!chosenSize.ok) {
          setValues((v) => ({
            ...v,
            error: chosenSize.message,
            field: chosenSize.field,
          }));
          form.current
            ?.querySelector<HTMLInputElement>(`[name="${chosenSize.field}"]`)
            ?.focus();
          return;
        }
        for (const axis of ['x', 'z'] as const) {
          const n = Number(values[axis]);
          if (
            !values[axis].trim() ||
            !Number.isFinite(n) ||
            !Number.isInteger(n * 2) ||
            Math.abs(n) > POLICY.coordinateAbsMm
          ) {
            setValues((v) => ({
              ...v,
              error: `Enter ${axis.toUpperCase()} in 0.5 mm steps between -${POLICY.coordinateAbsMm} and ${POLICY.coordinateAbsMm} mm.`,
              field: axis,
            }));
            form.current
              ?.querySelector<HTMLInputElement>(`[name="${axis}"]`)
              ?.focus();
            return;
          }
        }
        const furniture = catalogueFurniture(
          entry,
          chosenSize.size,
          {
            centerX: Number(values.x),
            centerZ: Number(values.z),
            quarterTurns: replacement?.pose.quarterTurns ?? 0,
          },
          replacement?.id,
        );
        if (!replacement)
          furniture.pose.quarterTurns = preferredFurnitureFacing(
            room,
            furniture,
          );
        furniture.pose = wallMountedPose(room, furniture);
        const result = controller.dispatch(
          [
            replacement
              ? { type: 'replace', id: replacement.id, furniture }
              : { type: 'add', furniture },
          ],
          replacement ? 'Replace piece' : 'Add piece',
        );
        if (!result.ok) {
          setValues((v) => ({
            ...v,
            error: failureMessage(
              result,
              controller.getSnapshot().workspace?.current,
            ),
            field: 'x',
          }));
          form.current?.querySelector<HTMLInputElement>('[name="x"]')?.focus();
          return;
        }
        controller.select(furniture.id);
        onDone();
        focusProperties(controller, furniture.id);
      }}
    >
      <h3 ref={heading} tabIndex={-1}>
        {replacement ? 'Replace with' : 'Add'} {entry.label}
      </h3>
      <p>
        {sizeValues.width || '?'} × {sizeValues.depth || '?'} ×{' '}
        {sizeValues.height ?? entry.size.height.default} mm · proposed size
      </p>
      {furnitureSizePresets(entry).length > 0 && (
        <FurnitureSizeFields
          entry={entry}
          values={sizeValues}
          onChange={(values) => {
            setSizeValues(values);
            setValues((v) => ({ ...v, error: '', field: '' }));
          }}
          errorField={values.error ? values.field : ''}
          errorId={errorId}
        />
      )}
      {replacement && (
        <p className={styles.notice}>
          This explicitly replaces {replacement.label} (
          {replacement.dimensions.width.value ?? '?'} ×{' '}
          {replacement.dimensions.depth.value ?? '?'} ×{' '}
          {replacement.dimensions.height.value ?? '?'} mm). Its recorded
          dimensions are not resized to fit this model.
        </p>
      )}
      <div className={styles.twoFields}>
        {(['x', 'z'] as const).map((axis) => (
          <label key={axis}>
            {axis === 'x' ? 'X from left' : 'Z from top'} (mm)
            <input
              type="number"
              name={axis}
              step="0.5"
              value={values[axis]}
              aria-invalid={!!values.error && values.field === axis}
              onChange={(e) =>
                setValues((v) => ({ ...v, [axis]: e.target.value, error: '' }))
              }
            />
          </label>
        ))}
      </div>
      {values.error && (
        <p role="alert" id={errorId} className={styles.error}>
          {values.error}
        </p>
      )}
      <div className={styles.actionRow}>
        <button className={styles.primary} type="submit">
          {replacement ? 'Replace piece' : 'Add piece'}
        </button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
export function CataloguePanel({
  controller,
  room,
  replacement,
  onDone,
  placement,
  initialCategory = 'all',
  onReplaceSelected,
}: {
  controller: SessionController;
  room: RoomDocument;
  replacement: Furniture | null;
  onDone: () => void;
  placement: CataloguePlacement;
  initialCategory?: string;
  onReplaceSelected?: (() => void) | undefined;
}) {
  const [chosen, setChosen] = useState<CatalogueEntry | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const [advanced, setAdvanced] = useState(false);
  const active = useSyncExternalStore(
    placement.subscribe,
    placement.getEntry,
    placement.getEntry,
  );
  const input = useCataloguePlacementInput(placement);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!chosen) heading.current?.focus();
  }, [chosen]);
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>
          {replacement ? 'Explicit replacement' : 'Curated furniture'}
        </p>
        <h2 ref={heading} tabIndex={-1}>
          {replacement ? 'Choose a replacement' : 'Add a piece'}
        </h2>
      </div>
      {!replacement && onReplaceSelected && (
        <button
          disabled={Object.values(
            room.furniture.find(
              (piece) =>
                piece.id === controller.getSnapshot().presentation.selectedId,
            )?.locks ?? {},
          ).some(Boolean)}
          title="Replace the selected piece; protected properties can be changed in Advanced"
          onClick={() => {
            placement.cancel();
            setChosen(null);
            setAdvanced(false);
            onReplaceSelected();
          }}
        >
          Replace selected piece…
        </button>
      )}
      {chosen && replacement ? (
        <PlacementForm
          key={`${chosen.id}-${replacement?.id ?? 'add'}`}
          entry={chosen}
          room={room}
          controller={controller}
          replacement={replacement}
          onDone={() => {
            setChosen(null);
            onDone();
          }}
        />
      ) : (
        <>
          {!replacement && (
            <p className={styles.catalogueHelp}>
              Drag into the room, or select a piece to place.
            </p>
          )}
          <label>
            Category
            <select
              value={category}
              onChange={(e) => {
                placement.cancel();
                setChosen(null);
                setAdvanced(false);
                setCategory(e.target.value);
              }}
            >
              {[
                'all',
                'bed',
                'desk',
                'chair',
                'wardrobe',
                'storage',
                'mirror',
                'tv',
                'seating',
                'table',
                'lighting',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.catalogue}>
            {CATALOGUE.filter(
              (e) => category === 'all' || e.category === category,
            ).map((entry) => (
              <button
                className={styles.catalogueCard}
                key={entry.id}
                data-active={active?.id === entry.id}
                onPointerDown={(event) => {
                  if (replacement) return;
                  if (input.beginDrag(event, entry)) {
                    setChosen(entry);
                    setAdvanced(false);
                  }
                }}
                onClick={(event) => {
                  setChosen(entry);
                  if (
                    !replacement &&
                    (event.detail === 0 || !input.consumeClick())
                  ) {
                    setAdvanced(false);
                    input.choose(entry);
                  }
                }}
              >
                <Image
                  src={thumbnailUrl(entry)}
                  width={120}
                  height={90}
                  unoptimized
                  alt=""
                  draggable={false}
                />
                <strong>{entry.label}</strong>
                <span>
                  {entry.size.width.default} × {entry.size.depth.default} mm
                </span>
                {!replacement && (
                  <span
                    className={styles.dragGrip}
                    data-placement-grip
                    title="Drag into the room"
                    aria-hidden="true"
                  >
                    ⠿
                  </span>
                )}
              </button>
            ))}
          </div>
          {chosen && !replacement && (
            <details
              className={styles.advancedPlacement}
              open={advanced}
              onToggle={(event) => {
                const open = event.currentTarget.open;
                if (open) placement.cancel();
                setAdvanced(open);
              }}
            >
              <summary>Advanced placement · {chosen.label}</summary>
              {advanced && (
                <PlacementForm
                  key={chosen.id}
                  entry={chosen}
                  room={room}
                  controller={controller}
                  replacement={null}
                  onDone={() => {
                    setChosen(null);
                    setAdvanced(false);
                    onDone();
                  }}
                />
              )}
            </details>
          )}
        </>
      )}
    </>
  );
}
