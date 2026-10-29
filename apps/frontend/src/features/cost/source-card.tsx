import type { SourcingReply } from '@roomedy/contracts/sourcing';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import Image from 'next/image';
import { useState } from 'react';
import { money } from './state';
import { OfferVisual } from './chat-visuals';
import { ExternalLink } from './external-link';
import styles from './workspace.module.css';

function ProductMedia({
  candidate,
  simulation,
}: {
  candidate: SourcingReply['candidates'][number];
  simulation: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = safeProductImage(candidate.imageUrl);
  if (!src || failed)
    return (
      <div className={styles.productFallback}>
        <OfferVisual offer={candidate.offer} />
      </div>
    );
  return (
    <ExternalLink url={candidate.url} className={styles.productImage}>
      <Image
        src={src}
        alt={`${candidate.label} · ${simulation ? 'illustrative product photo' : 'source product photo'}`}
        unoptimized
        width={640}
        height={440}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </ExternalLink>
  );
}
export function SourceCard({
  candidate,
  simulation,
  matchingWalls = false,
  selected,
  disabled,
  needsSizeReview = false,
  onSelect,
  onReview,
}: {
  candidate: SourcingReply['candidates'][number];
  simulation: boolean;
  matchingWalls?: boolean;
  selected: boolean;
  disabled: boolean;
  needsSizeReview?: boolean;
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
      <ProductMedia
        key={candidate.imageUrl ?? 'none'}
        candidate={candidate}
        simulation={simulation}
      />
      <h3>
        <ExternalLink url={candidate.url} className={styles.productTitle}>
          {candidate.label}
        </ExternalLink>
      </h3>
      {simulation && candidate.imageUrl && (
        <p className={styles.note}>
          Illustrative photo · example amount and size
        </p>
      )}
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
      {candidate.offer?.kind === 'floor' && (
        <p className={styles.note}>
          Replacement material price. Your drawn finish stays unchanged.
        </p>
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
        <ExternalLink url={candidate.url}>
          {simulation ? 'Explore source ↗' : 'Read cited source ↗'}
        </ExternalLink>
      </details>
      <div className={styles.actions}>
        {candidate.offer && (
          <button
            className={styles.primary}
            disabled={
              disabled ||
              selected ||
              (candidate.offer.kind === 'furniture' &&
                !candidate.offer.outerSizeMm)
            }
            onClick={needsSizeReview ? onReview : onSelect}
          >
            {selected
              ? 'Selected'
              : needsSizeReview
                ? 'Review size & price'
                : matchingWalls && candidate.offer.kind === 'paint'
                  ? 'Use for matching walls'
                  : 'Use this price'}
          </button>
        )}
      </div>
    </article>
  );
}
