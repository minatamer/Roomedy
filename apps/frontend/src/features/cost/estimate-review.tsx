import Image from 'next/image';
import type { EstimateOffer, RoomEstimate } from '@roomedy/contracts/estimates';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomSurface } from '@roomedy/contracts/surfaces';
import { findCatalogueEntry } from '@roomedy/spatial';
import { thumbnailUrl } from '../catalogue/catalogue';
import { ChatIcon } from './chat-visuals';
import { ExternalLink } from './external-link';
import {
  estimateGroups,
  humanQuantity,
  paintCoverage,
  readableEstimateNote,
  lineSummary,
} from './estimate-presentation';
import { money } from './state';
import type { ReactNode } from 'react';
import styles from './workspace.module.css';

export function EstimateReview({
  estimate,
  room,
  offers,
  materialsOnly,
  download,
}: {
  estimate: RoomEstimate;
  room: RoomDocument;
  offers: EstimateOffer[];
  materialsOnly: boolean;
  download: ReactNode;
}) {
  const groups = estimateGroups(estimate);
  return (
    <section
      className={styles.estimateReview}
      aria-label="Your shopping estimate"
    >
      <div className={styles.estimateHero}>
        <div>
          <p className={styles.eyebrow}>Your shopping estimate</p>
          <h2>{money(estimate.knownTotalMinor, 'USD')}</h2>
          <p>
            {!estimate.complete
              ? 'Known subtotal · some items still need a price'
              : 'Planning total · confirm before ordering'}
          </p>
        </div>
        <span className={styles.estimateEmblem}>
          <ChatIcon kind="budget" />
        </span>
        {download}
      </div>
      <div className={styles.estimateGroups} aria-label="Cost by category">
        {groups.map((group) => (
          <a
            key={group.category}
            href={`#estimate-${group.category}`}
            onClick={(event) => {
              event.preventDefault();
              event.currentTarget
                .closest('section')
                ?.querySelector(`#estimate-${group.category}`)
                ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }}
          >
            <ChatIcon
              kind={
                group.category === 'floor'
                  ? 'floor'
                  : group.category === 'walls'
                    ? 'walls'
                    : group.category === 'furniture'
                      ? 'furniture'
                      : 'budget'
              }
            />
            <span>
              {group.label}
              <strong>{money(group.known, 'USD')}</strong>
              {group.unpriced > 0 && (
                <small>{group.unpriced} still to price</small>
              )}
            </span>
          </a>
        ))}
      </div>
      {estimate.unpricedCount > 0 && (
        <p className={styles.estimateNotice}>
          The subtotal excludes {estimate.unpricedCount} unpriced{' '}
          {estimate.unpricedCount === 1 ? 'item' : 'items'}. Choose products to
          complete those prices.
        </p>
      )}
      {materialsOnly && (
        <p className={styles.note}>
          Furniture and finish materials. Fitting and delivery are outside this
          estimate.
        </p>
      )}
      {groups.map((group) => (
        <section
          key={group.category}
          id={`estimate-${group.category}`}
          className={styles.estimateCategory}
        >
          <div className={styles.cardTop}>
            <h3>{group.label}</h3>
            <strong>
              {money(group.known, 'USD')}
              {group.unpriced > 0 ? ' + unpriced' : ''}
            </strong>
          </div>
          <div className={styles.estimateItems}>
            {group.lines.map((line) => {
              const target = line.targets.find((t) => t.kind === 'furniture'),
                piece =
                  target?.kind === 'furniture'
                    ? room.furniture.find((p) => p.id === target.id)
                    : null;
              const entry = piece
                ? findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
                : null;
              const surface = line.targets.find((t) => t.kind === 'surface');
              const coverage = line.notes
                .map(paintCoverage)
                .filter((c) => c !== null);
              const sources = offers.filter((o) =>
                line.offerIds.includes(o.id),
              );
              const pricing = {
                sample: 'Example price',
                sourced: 'Store price',
                manual: 'Entered price',
                allowance: 'Allowance',
                included: 'Already included',
                unpriced: 'Price needed',
              }[line.pricing];
              return (
                <article key={line.id}>
                  <div className={styles.estimateItemTop}>
                    <div className={styles.estimateItemVisual}>
                      {entry ? (
                        <Image
                          src={thumbnailUrl(entry)}
                          width={82}
                          height={68}
                          alt={`${piece!.label} design reference`}
                        />
                      ) : surface?.kind === 'surface' ? (
                        <span
                          style={{
                            background: roomSurface(room.room, surface.surface)
                              .color,
                          }}
                          aria-label="Design colour"
                        >
                          <ChatIcon
                            kind={
                              surface.surface === 'floor' ? 'floor' : 'walls'
                            }
                          />
                        </span>
                      ) : (
                        <ChatIcon kind="budget" />
                      )}
                    </div>
                    <div>
                      <h4>{line.label}</h4>
                      <p>
                        {line.pricing === 'included'
                          ? 'No new purchase'
                          : humanQuantity(line.quantity)}{' '}
                        · {pricing}
                      </p>
                    </div>
                    <strong>
                      {line.amountMinor === null
                        ? 'Not priced'
                        : money(line.amountMinor, 'USD')}
                    </strong>
                  </div>
                  <details>
                    <summary>Item details &amp; source</summary>
                    <p>{lineSummary(line)}</p>
                    <div className={styles.coverageGrid}>
                      {coverage.map((c) => (
                        <div key={c.wall}>
                          <strong>{c.wall} wall</strong>
                          <span>{c.area} m²</span>
                          <small>
                            {c.coats} {c.coats === 1 ? 'coat' : 'coats'}
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className={styles.measureChips}>
                      {(
                        [
                          ['Area in plan', line.installed],
                          ['Material needed', line.required],
                          ['Buying', line.purchased],
                        ] as const
                      )
                        .filter(([, q]) => q !== null)
                        .map(([label, q]) => (
                          <span key={label}>
                            {label}: <strong>{humanQuantity(q)}</strong>
                          </span>
                        ))}
                    </div>
                    {line.notes
                      .filter((n) => !paintCoverage(n) && n !== line.rule)
                      .map((n, i) => (
                        <p key={i} className={styles.note}>
                          {readableEstimateNote(n)}
                        </p>
                      ))}
                    {sources.map((offer) => (
                      <div key={offer.id} className={styles.estimateSource}>
                        <strong>{offer.label}</strong>
                        <span>
                          {offer.source.kind === 'sample'
                            ? 'Illustrative example · confirm a store price'
                            : offer.source.kind === 'manual'
                              ? 'Manually entered'
                              : offer.supplier}
                        </span>
                        <p>{offer.source.evidence}</p>
                        {offer.source.url && (
                          <ExternalLink url={offer.source.url}>
                            View store ↗
                          </ExternalLink>
                        )}
                        {offer.fx && (
                          <p className={styles.note}>
                            USD reference rate dated {offer.fx.date}. Original
                            currency and conversion evidence are retained in
                            your PDF and project.
                          </p>
                        )}
                      </div>
                    ))}
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      ))}
      <details className={styles.estimateAssumptions}>
        <summary>Scope &amp; assumptions</summary>
        {estimate.assumptions.map((a, i) => (
          <p key={i}>{readableEstimateNote(a)}</p>
        ))}
      </details>
    </section>
  );
}
