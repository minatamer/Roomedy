import type { EstimateState, RoomEstimate } from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { currentProductChoices, choicePriceIncluded } from './product-choices';
import { ExternalLink } from './external-link';
import styles from './workspace.module.css';
import { money } from './state';
import { ProductVisual, productReference } from './product-visual';

export function ChosenProducts({
  room,
  pricing,
  estimate,
  onQuantity,
  onTakeoff,
}: {
  room: RoomDocument;
  pricing: EstimateState;
  estimate: RoomEstimate;
  onQuantity?: ((key: string, quantity: number) => void) | undefined;
  onTakeoff?:
    | ((
        key: string,
        updates: {
          coverageMm2?: number;
          volumeMl?: number;
          automatic?: boolean;
        },
      ) => void)
    | undefined;
}) {
  const choices = currentProductChoices(room, pricing);
  if (!choices.length) return null;
  return (
    <section
      className={styles.chosenProducts}
      aria-label="Your selected products"
    >
      <h3>Your selected products</h3>
      <ul className={styles.selectedGrid}>
        {choices.map((choice) => {
          const price = pricing.settings.selectedPrices?.find(
            (price) => price.key === choice.key && price.scope === choice.scope,
          );
          const listed = estimate.lines.find(
            (line) =>
              line.productKey === choice.key && line.pricing === 'listed',
          );
          const count = listed?.quantity
            ? listed.quantity.numerator / listed.quantity.denominator
            : (price?.quantity ?? 1);
          return (
            <li key={choice.key} className={styles.selectedCard}>
              <ProductVisual
                key={`${choice.url}:${choice.imageUrl ?? ''}`}
                imageUrl={choice.imageUrl}
                url={choice.url}
                label={choice.label}
                simulation={choice.simulation}
                reference={productReference(room, choice.key)}
              />
              <div className={styles.selectedBody}>
                <ExternalLink url={choice.url}>{choice.label} ↗</ExternalLink>
                <span>
                  {choicePriceIncluded(choice, pricing, estimate)
                    ? 'Price included in the breakdown'
                    : 'Selected · price or fit needs review'}
                </span>
                <details className={styles.selectedDetails}>
                  <summary>Quantity &amp; source details</summary>
                  {listed && price && (
                    <>
                      <small>
                        {choice.simulation ? 'Example' : 'Listed'}{' '}
                        {money(price.unitPriceMinor, 'USD')} /{' '}
                        {price.unit === 'each' ? 'item' : price.unit} ·{' '}
                        {price.qualifier} Included provisionally; confirm fit,
                        coverage, tax and delivery.
                      </small>
                      {price.unit !== 'm2' &&
                        !price.targets.some(
                          (target) => target.kind === 'furniture',
                        ) && (
                          <label className={styles.listedQuantity}>
                            Quantity ({price.unit}s)
                            <input
                              key={`${price.key}-${count}-${price.quantityConfirmed}-${price.takeoff?.mode}`}
                              type="number"
                              min="1"
                              max="100000"
                              step="1"
                              defaultValue={count}
                              aria-label={`Quantity for ${choice.label}`}
                              disabled={!onQuantity}
                              onBlur={(event) => {
                                const n = event.currentTarget.valueAsNumber;
                                if (
                                  Number.isSafeInteger(n) &&
                                  n >= 1 &&
                                  n <= 100_000
                                ) {
                                  if (n !== count) onQuantity?.(price.key, n);
                                } else
                                  event.currentTarget.value = String(count);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  event.currentTarget.blur();
                                }
                              }}
                            />
                            <small>
                              {price.takeoff?.mode === 'automatic'
                                ? 'Calculated from your room · rounds up to whole units'
                                : price.quantityConfirmed
                                  ? 'Quantity entered · confirm supplier coverage'
                                  : 'Starts at 1 · set how many you need; full-room coverage is unconfirmed'}
                            </small>
                          </label>
                        )}
                      {price.takeoff && (
                        <>
                          <small>
                            {price.takeoff.coverageSource === 'product'
                              ? 'Product coverage'
                              : price.takeoff.coverageSource === 'visitor'
                                ? 'Your coverage setting'
                                : 'Planning assumption'}
                            :{' '}
                            {price.takeoff.kind === 'floor'
                              ? `${price.takeoff.coverageMm2 / 1_000_000} m² per pack`
                              : `${price.takeoff.coverageMm2PerLitre / 1_000_000} m² per litre per coat`}
                            .{' '}
                            {price.takeoff.kind === 'paint' &&
                              `${price.takeoff.volumeSource === 'planning' ? 'Assumed' : price.takeoff.volumeSource === 'visitor' ? 'Your' : 'Listed'} ${price.takeoff.volumeMl / 1000} L cans.`}
                          </small>
                          <details className={styles.materialCoverage}>
                            <summary>Coverage & calculation</summary>
                            <p>{listed.rule}</p>
                            <small>
                              {price.takeoff.coverageSource === 'product'
                                ? 'Product coverage'
                                : price.takeoff.coverageSource === 'visitor'
                                  ? 'Your coverage setting'
                                  : 'Editable planning assumption · product coverage was not supplied'}
                            </small>
                            <CoverageField
                              label={
                                price.takeoff.kind === 'floor'
                                  ? `Coverage per pack for ${choice.label} (m²)`
                                  : `Coverage per litre per coat for ${choice.label} (m²)`
                              }
                              value={
                                (price.takeoff.kind === 'floor'
                                  ? price.takeoff.coverageMm2
                                  : price.takeoff.coverageMm2PerLitre) /
                                1_000_000
                              }
                              max={1000}
                              min={0.01}
                              disabled={!onTakeoff}
                              onChange={(value) =>
                                onTakeoff?.(price.key, {
                                  coverageMm2: Math.round(value * 1_000_000),
                                })
                              }
                            />
                            {price.takeoff.kind === 'paint' && (
                              <>
                                <small>
                                  {price.takeoff.volumeSource === 'product'
                                    ? 'Listed can size'
                                    : price.takeoff.volumeSource === 'visitor'
                                      ? 'Your can size'
                                      : 'Editable planning assumption · can size was not supplied'}
                                </small>
                                <CoverageField
                                  label={`Can size for ${choice.label} (L)`}
                                  value={price.takeoff.volumeMl / 1000}
                                  min={0.001}
                                  max={100}
                                  disabled={!onTakeoff}
                                  onChange={(value) =>
                                    onTakeoff?.(price.key, {
                                      volumeMl: Math.round(value * 1000),
                                    })
                                  }
                                />
                              </>
                            )}
                            {price.takeoff.mode === 'manual' && onTakeoff && (
                              <button
                                type="button"
                                onClick={() =>
                                  onTakeoff(price.key, { automatic: true })
                                }
                              >
                                Use calculated quantity
                              </button>
                            )}
                            {listed.notes
                              .filter((note) =>
                                /net after openings|Planning|Product coverage|Product yield|Visitor|Assumed/.test(
                                  note,
                                ),
                              )
                              .map((note) => (
                                <small key={note}>{note}</small>
                              ))}
                          </details>
                        </>
                      )}
                    </>
                  )}
                  {choice.quotedPrice &&
                    !choicePriceIncluded(choice, pricing, estimate) && (
                      <small>
                        {choice.simulation ? 'Example' : 'Listed'}{' '}
                        {choice.quotedPrice} · reference only, excluded from
                        subtotal
                      </small>
                    )}
                  <ExternalLink url={choice.url}>
                    View product source ↗
                  </ExternalLink>
                </details>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CoverageField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.listedQuantity}>
      {label}
      <input
        key={`${label}-${value}`}
        type="number"
        aria-label={label}
        defaultValue={value}
        min={min}
        max={max}
        step="any"
        disabled={disabled}
        onBlur={(event) => {
          const n = event.currentTarget.valueAsNumber;
          if (Number.isFinite(n) && n >= min && n <= max) {
            if (n !== value) onChange(n);
          } else event.currentTarget.value = String(value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
