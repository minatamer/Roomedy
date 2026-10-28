import type {
  EstimateLine,
  EstimateOffer,
  RoomEstimate,
} from '@roomedy/contracts/estimates';
import { money, quantity, targetKey } from './state';
import styles from './workspace.module.css';

import { ChatIcon } from '../assistant/chat-icon';
export { ChatIcon } from '../assistant/chat-icon';

export function OfferVisual({ offer }: { offer: EstimateOffer | null }) {
  const kind = offer?.kind;
  return (
    <div className={styles.offerVisual}>
      <ChatIcon
        kind={
          !offer
            ? 'search'
            : kind === 'floor'
              ? 'floor'
              : kind === 'paint' || kind === 'primer'
                ? 'walls'
                : kind === 'service'
                  ? 'services'
                  : 'furniture'
        }
      />
      <span>
        {offer?.kind === 'furniture' ? (
          offer.outerSizeMm ? (
            <>
              <strong>
                {offer.outerSizeMm.width} × {offer.outerSizeMm.depth} ×{' '}
                {offer.outerSizeMm.height}
              </strong>
              <small>W × D × H · mm</small>
            </>
          ) : (
            <strong>Size needs confirmation</strong>
          )
        ) : offer?.kind === 'floor' ? (
          <>
            <strong>{offer.coverageMm2 / 1e6} m²</strong>
            <small>coverage per pack</small>
          </>
        ) : offer && 'packs' in offer ? (
          <>
            <strong>{offer.coverageMm2PerLitre / 1e6} m² / L</strong>
            <small>per coat · {offer.sheen}</small>
          </>
        ) : offer?.kind === 'service' ? (
          <>
            <strong>{offer.market.city}</strong>
            <small>{offer.scope.replaceAll('-', ' ')}</small>
          </>
        ) : (
          <strong>Unpriced lead</strong>
        )}
      </span>
    </div>
  );
}

export function CostLineCards({
  estimate,
  lines,
  inspect,
}: {
  estimate: RoomEstimate;
  lines: EstimateLine[];
  inspect: (key: string | null) => void;
}) {
  const maximum = Math.max(1, ...lines.map((line) => line.amountMinor ?? 0));
  return (
    <div className={styles.lineCards} aria-label="Cost explanation cards">
      {lines.map((line) => (
        <article key={line.id}>
          <div className={styles.lineCardTop}>
            <ChatIcon
              kind={
                line.category === 'floor'
                  ? 'floor'
                  : line.category === 'walls'
                    ? 'walls'
                    : line.category === 'furniture'
                      ? 'furniture'
                      : 'services'
              }
            />
            <h3>
              {line.label}
              <small className={styles.lineQuantity}>
                {quantity(line.quantity)} · {line.pricing}
              </small>
            </h3>
            <strong>
              {line.amountMinor === null
                ? 'Needs review'
                : money(line.amountMinor, estimate.locality.currency)}
            </strong>
          </div>
          <div className={styles.amountTrack} aria-hidden="true">
            <span
              style={{ width: `${((line.amountMinor ?? 0) / maximum) * 100}%` }}
            />
          </div>
          <details>
            <summary>Calculation & assumptions</summary>
            <p>{line.rule}</p>
            {line.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </details>
          {line.targets.some((t) => targetKey(t) !== null) && (
            <button
              onClick={() =>
                inspect(
                  line.targets.map(targetKey).find((key) => key !== null) ??
                    null,
                )
              }
            >
              Locate in room ↗
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
