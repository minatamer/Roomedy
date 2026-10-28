import type { SourcingReply } from '@roomedy/contracts/sourcing';
import { money } from './state';
import { OfferVisual } from './chat-visuals';
import styles from './workspace.module.css';
export function SourceCard({
  candidate,
  simulation,
  selected,
  disabled,
  onInspect,
  onSelect,
  onReview,
}: {
  candidate: SourcingReply['candidates'][number];
  simulation: boolean;
  selected: boolean;
  disabled: boolean;
  onInspect: () => void;
  onSelect: () => void;
  onReview: () => void;
}) {
  return (
    <article>
      <p className={styles.eyebrow}>
        {candidate.match} ·{' '}
        {!candidate.offer
          ? 'unpriced lead'
          : candidate.offer.pricing === 'allowance'
            ? 'planning allowance'
            : `${candidate.conditions} price`}
      </p>
      <h3>{candidate.label}</h3>
      <OfferVisual offer={candidate.offer} />
      {candidate.offer && (
        <strong>
          {'packs' in candidate.offer
            ? candidate.offer.packs
                .map(
                  (pack) =>
                    `${pack.volumeMl / 1000} L: ${money(pack.priceMinor, candidate.offer!.market.currency)}`,
                )
                .join(' · ')
            : `${money(candidate.offer.priceMinor, candidate.offer.market.currency)} ${candidate.offer.kind === 'service' ? `/ ${candidate.offer.basis}` : candidate.offer.kind === 'floor' ? '/ pack' : '/ item'}`}
        </strong>
      )}
      {candidate.offer && (
        <div className={styles.factChips}>
          <span>
            {candidate.offer.availability === 'unknown'
              ? 'Stock unknown'
              : candidate.offer.availability}
          </span>
          <span>Tax {candidate.offer.tax.status}</span>
          {candidate.offer.kind === 'furniture' &&
            !candidate.offer.assemblyIncluded && (
              <span>Assembly extra / unknown</span>
            )}
          {candidate.offer.kind === 'service' && (
            <span>
              Minimum{' '}
              {money(
                candidate.offer.minimumMinor,
                candidate.offer.market.currency,
              )}
            </span>
          )}
          <span>
            {candidate.offer.deliveryIncluded
              ? 'Delivery included'
              : 'Delivery extra / unknown'}
          </span>
          {candidate.offer.fx && <span>USD equivalent</span>}
        </div>
      )}
      <details className={styles.sourceEvidence}>
        <summary>
          Details &amp; source
          {candidate.differences.length
            ? ` · ${candidate.differences.length} ${candidate.differences.length === 1 ? 'difference' : 'differences'}`
            : ''}
        </summary>
        {candidate.offer?.kind === 'floor' && (
          <p>
            {candidate.offer.coverageMm2 / 1e6} m² per pack · underlay{' '}
            {candidate.offer.underlay}
            <br />
            {candidate.offer.variant}
          </p>
        )}
        {candidate.offer?.fx && (
          <p>
            USD reference equivalent · rate dated {candidate.offer.fx.date}.{' '}
            <a href={candidate.offer.fx.url} target="_blank" rel="noreferrer">
              Exchange-rate source ↗
            </a>
            <br />
            Merchant checkout rates and fees may differ. Quantities are
            converted before rounding each line; displayed unit prices are
            rounded.
          </p>
        )}
        {candidate.offer && 'packs' in candidate.offer && (
          <p>
            {candidate.offer.coverageMm2PerLitre / 1e6} m²/L per coat ·{' '}
            {candidate.offer.sheen} · {candidate.offer.colour}
            <br />
            {candidate.offer.variant}
          </p>
        )}
        {candidate.offer?.kind === 'service' && (
          <p>
            Minimum charge{' '}
            {money(
              candidate.offer.minimumMinor,
              candidate.offer.market.currency,
            )}{' '}
            · {candidate.offer.market.city}
            <br />
            {candidate.offer.includedWork}
          </p>
        )}
        {candidate.offer?.kind === 'furniture' && (
          <p>
            Outer size:{' '}
            {candidate.offer.outerSizeMm
              ? `${candidate.offer.outerSizeMm.width} × ${candidate.offer.outerSizeMm.depth} × ${candidate.offer.outerSizeMm.height} mm`
              : 'Needs confirmation'}{' '}
            · {candidate.offer.variant}
            <br />
            Assembly{' '}
            {candidate.offer.assemblyIncluded
              ? 'included'
              : 'separate / unresolved'}
          </p>
        )}
        {candidate.offer && (
          <p>
            {candidate.offer.supplier} · {candidate.offer.source.kind} ·{' '}
            {candidate.offer.availability} availability · tax{' '}
            {candidate.offer.tax.status}
            <br />
            Delivery{' '}
            {candidate.offer.deliveryIncluded
              ? 'included'
              : 'separate / unresolved'}
            {candidate.offer.source.observedAt !== null && (
              <>
                {' '}
                · checked{' '}
                {new Date(candidate.offer.source.observedAt).toLocaleDateString(
                  'en-GB',
                )}
              </>
            )}
          </p>
        )}
        <p>{candidate.evidence}</p>
        <ul>
          {candidate.differences.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <a href={candidate.url} target="_blank" rel="noopener noreferrer">
          {simulation ? 'Explore source ↗' : 'Read cited source ↗'}
        </a>
      </details>
      <div className={styles.actions}>
        <button onClick={onInspect}>Locate in room ↗</button>
        {candidate.offer && (
          <button
            className={styles.primary}
            disabled={disabled || selected}
            onClick={onSelect}
          >
            {selected ? 'Selected' : 'Use this price'}
          </button>
        )}
        {candidate.offer?.kind === 'furniture' &&
          candidate.offer.outerSizeMm && (
            <button disabled={disabled} onClick={onReview}>
              Preview size &amp; price
            </button>
          )}
      </div>
    </article>
  );
}
