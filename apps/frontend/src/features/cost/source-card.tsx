import type { SourcingReply } from '@roomedy/contracts/sourcing';
import { safeProductImage } from '@roomedy/contracts/sourcing';
import Image from 'next/image';
import { useState } from 'react';
import { money } from './state';
import { ExternalLink } from './external-link';
import styles from './workspace.module.css';

/** Keep actual unpriced products, rather than presenting store directories as choices. */
export function productChoices(candidates: SourcingReply['candidates']) {
  return candidates
    .filter((candidate) => {
      if (candidate.offer || candidate.listing) return true;
      const url = new URL(candidate.url);
      return (
        !/^(?:www\.)?(?:google|bing|duckduckgo)\./i.test(url.hostname) &&
        !/\/(?:search|s)(?:[/?#]|$)/i.test(url.pathname)
      );
    })
    .sort(
      (a, b) =>
        Number(!!(b.offer || b.listing)) - Number(!!(a.offer || a.listing)) ||
        Number(!!b.imageUrl) - Number(!!a.imageUrl),
    );
}

function ProductMedia({
  candidate,
  simulation,
}: {
  candidate: SourcingReply['candidates'][number];
  simulation: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = safeProductImage(candidate.imageUrl);
  if (!src || failed) return null;
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
  chooseLabel,
  selected,
  confirmSelection = false,
  disabled,
  needsSizeReview = false,
  onSelect,
  onReview,
}: {
  candidate: SourcingReply['candidates'][number];
  simulation: boolean;
  matchingWalls?: boolean;
  chooseLabel?: string;
  selected: boolean;
  confirmSelection?: boolean;
  disabled: boolean;
  needsSizeReview?: boolean;
  onSelect: () => void;
  onReview: () => void;
}) {
  return (
    <article aria-label={candidate.label} className={styles.sourceCard}>
      <ProductMedia
        key={candidate.imageUrl ?? 'none'}
        candidate={candidate}
        simulation={simulation}
      />
      <div className={styles.productBody}>
        <p className={styles.productStore}>
          {candidate.offer?.supplier ??
            new URL(candidate.url).hostname.replace(/^www\./, '')}
        </p>
        <h5 className={styles.productHeading}>
          <ExternalLink url={candidate.url} className={styles.productTitle}>
            {candidate.label}
          </ExternalLink>
        </h5>
        {candidate.offer && (
          <strong className={styles.productPrice}>
            {candidate.offer.pricing === 'allowance' ? 'Allowance · ' : ''}
            {candidate.conditions === 'from'
              ? 'From '
              : candidate.conditions === 'conditional'
                ? 'Conditional '
                : ''}
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
        {!candidate.offer && candidate.listing && (
          <>
            <strong className={styles.productPrice}>
              {candidate.conditions === 'from'
                ? 'From '
                : candidate.conditions === 'conditional'
                  ? 'Conditional '
                  : ''}
              {money(candidate.listing.priceMinor, candidate.listing.currency)}{' '}
              /{' '}
              {candidate.listing.volumeMl
                ? `${candidate.listing.volumeMl / 1000} L`
                : candidate.listing.unit}
            </strong>
            <p className={styles.note}>
              Listed price · confirm variant and quantities before ordering.
            </p>
            {candidate.listing.coverageMm2 &&
              candidate.listing.unit === 'pack' && (
                <p className={styles.note}>
                  Pack coverage: {candidate.listing.coverageMm2 / 1_000_000} m²
                  per pack.
                </p>
              )}
            {candidate.listing.coverageMm2PerLitre &&
              candidate.listing.unit === 'can' && (
                <p className={styles.note}>
                  Paint coverage:{' '}
                  {candidate.listing.coverageMm2PerLitre / 1_000_000} m² per
                  litre per coat.
                </p>
              )}
          </>
        )}
        {!candidate.offer && !candidate.listing && (
          <p className={styles.productStatus}>Price not listed</p>
        )}
        {candidate.offer?.availability === 'unavailable' && (
          <p className={styles.productStatus}>
            Currently unavailable · choose another option for pricing
          </p>
        )}
        {matchingWalls && (
          <p className={styles.productStatus}>
            One paint choice covers all matching walls.
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.primary}
            disabled={disabled || (selected && !confirmSelection)}
            onClick={onSelect}
          >
            {selected
              ? confirmSelection
                ? 'Keep this product'
                : '✓ Selected product'
              : chooseLabel
                ? chooseLabel
                : matchingWalls
                  ? 'Choose this product for these walls'
                  : 'Choose this product'}
          </button>
          {selected &&
            needsSizeReview &&
            candidate.offer?.kind === 'furniture' &&
            candidate.offer.outerSizeMm && (
              <button disabled={disabled} onClick={onReview}>
                Review fit &amp; price
              </button>
            )}
        </div>
        <details className={styles.sourceEvidence}>
          <summary>
            Details &amp; source
            {candidate.differences.length
              ? ` · ${candidate.differences.length} ${candidate.differences.length === 1 ? 'difference' : 'differences'}`
              : ''}
          </summary>
          <p className={styles.eyebrow}>
            {candidate.match === 'lead'
              ? candidate.listing
                ? 'store option'
                : 'product option'
              : candidate.match}{' '}
            ·{' '}
            {!candidate.offer
              ? candidate.listing
                ? candidate.conditions === 'conditional'
                  ? 'conditional price · check terms'
                  : candidate.conditions === 'from'
                    ? 'starting price · check variant'
                    : 'listed price · details to confirm'
                : 'price unavailable · review source'
              : candidate.offer.pricing === 'allowance'
                ? 'planning allowance'
                : `${candidate.conditions} price`}
          </p>
          {simulation && candidate.imageUrl && (
            <p className={styles.note}>
              Illustrative photo · example amount and size
            </p>
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
                  {new Date(
                    candidate.offer.source.observedAt,
                  ).toLocaleDateString('en-GB')}
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
      </div>
    </article>
  );
}
