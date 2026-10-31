import Image from 'next/image';
import { useId } from 'react';
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
  displayEstimateLines,
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
  onChooseProducts,
  hasOptions = false,
}: {
  estimate: RoomEstimate;
  room: RoomDocument;
  offers: EstimateOffer[];
  materialsOnly: boolean;
  download: ReactNode;
  onChooseProducts?: () => void;
  hasOptions?: boolean;
}) {
  const id = useId(),
    groups = estimateGroups(estimate).map((group) => {
      const displayLines = displayEstimateLines(group.lines, room);
      return {
        ...group,
        displayLines,
        choicesToPrice: displayLines.filter((line) => line.amountMinor === null)
          .length,
      };
    }),
    choicesToPrice = groups.reduce(
      (sum, group) => sum + group.choicesToPrice,
      0,
    );
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
            {estimate.unpricedCount
              ? 'Known subtotal · some items still need a price'
              : !estimate.complete
                ? 'Listed-price subtotal · review quantities and fit'
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
            href={`#${id}-estimate-${group.category}`}
            onClick={(event) => {
              event.preventDefault();
              event.currentTarget
                .closest('section')
                ?.querySelector(`[id="${id}-estimate-${group.category}"]`)
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
                <small>{group.choicesToPrice} still to price</small>
              )}
            </span>
          </a>
        ))}
      </div>
      {estimate.unpricedCount > 0 && (
        <div className={styles.estimateNotice}>
          <p>
            Choose products to complete your estimate. {choicesToPrice}{' '}
            {choicesToPrice === 1 ? 'choice still needs' : 'choices still need'}{' '}
            a price.
          </p>
          {onChooseProducts && (
            <button className="glass-control" onClick={onChooseProducts}>
              {hasOptions ? 'Choose products' : 'Find options'}{' '}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
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
          id={`${id}-estimate-${group.category}`}
          className={styles.estimateCategory}
        >
          <div className={styles.cardTop}>
            <h3>{group.label}</h3>
            <strong>
              {money(group.known, 'USD')}
              {group.unpriced > 0 ? ' + unpriced' : ''}
            </strong>
          </div>
          {group.category === 'walls' && (
            <p className={styles.categoryGuide}>
              {group.choicesToPrice > 0
                ? 'Choose paint for each included wall finish. Matching walls share the paint and can quantity.'
                : 'Paint covers every included matching wall, rounded up to whole cans.'}
            </p>
          )}
          <div className={styles.estimateItems}>
            {group.displayLines.map((line) => {
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
                listed: 'Listed price · review details',
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
                      <h4>
                        {line.label[0]!.toUpperCase() + line.label.slice(1)}
                      </h4>
                      <p>
                        {line.pricing === 'unpriced'
                          ? 'Choose a priced product to add this cost'
                          : line.pricing === 'included'
                            ? 'No new purchase'
                            : `${humanQuantity(line.quantity)}${line.category === 'walls' && line.targets.length === 4 ? ' · All four walls' : ''} · ${pricing}`}
                      </p>
                    </div>
                    <strong>
                      {line.amountMinor === null
                        ? 'Price pending'
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
