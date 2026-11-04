import { roomSurface, WALLS } from '@roomedy/contracts/surfaces';
import { furnitureMaterialTargets } from '@roomedy/contracts/furniture-materials';
import { findCatalogueEntry } from '@roomedy/spatial';
import Image from 'next/image';
import { thumbnailUrl } from '../catalogue/catalogue';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { ChatIcon } from './chat-visuals';
import { furniturePurchase } from './journey';
import type { CostSection } from './journey';
import { money } from './state';
import styles from './workspace.module.css';

export function JourneyCards({
  section,
  controller,
  state,
  onResearch,
  onFindOptions,
  onContinue,
  researchBusy = false,
}: {
  section: CostSection;
  controller: SessionController;
  state: SessionSnapshot;
  onResearch: (key: string, query: string, matchingWalls?: boolean) => void;
  onFindOptions: () => void;
  onContinue: (section: CostSection) => void;
  researchBusy?: boolean;
}) {
  const room = state.workspace!.current,
    draft = state.cost!;
  const update = (settings: typeof draft.settings, message: string) => {
    if (controller.updateCost(settings)) controller.notify(message);
  };
  if (section === 'review') return null;
  if (section === 'welcome')
    return (
      <section
        className={styles.startChoices}
        aria-label="Choose where to start"
      >
        <h3>What would you like to start with?</h3>
        <p>
          Find options for the whole room, or start with one part. I’ll help you
          choose, then bring the costs together.
        </p>
        <div className={styles.wholeRoomStart}>
          <span className={styles.startVisual}>
            <ChatIcon kind="search" />
          </span>
          <div className={styles.wholeRoomCopy}>
            <span>Recommended</span>
            <h4>Find options for the whole room</h4>
            <p>
              Compare furniture, flooring and wall paint together, then choose
              your favourites for the estimate.
            </p>
          </div>
          <button
            className="glass-control"
            disabled={!!state.candidate || researchBusy}
            onClick={onFindOptions}
          >
            Find all options <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={styles.startGrid}>
          {(
            [
              [
                'furniture',
                'Furniture',
                'Keep what you have, or find similar pieces to buy.',
                'Choose furniture',
              ],
              [
                'floor',
                'Flooring',
                'Compare materials for a new floor, or keep the one you have.',
                'Plan your flooring',
              ],
              [
                'walls',
                'Walls',
                'Find paint for the colours and finishes in your design.',
                'Choose wall paint',
              ],
            ] as const
          ).map(([target, title, description, action]) => (
            <button
              key={target}
              className="glass-control"
              disabled={!!state.candidate}
              onClick={() => onContinue(target)}
            >
              <span className={styles.startVisual}>
                <ChatIcon kind={target} />
              </span>
              <strong>{title}</strong>
              <span>{description}</span>
              <span className={styles.startAction}>
                {action}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  return (
    <section
      className={styles.journey}
      aria-label={`${section === 'floor' ? 'Flooring' : section[0]!.toUpperCase() + section.slice(1)} choices`}
    >
      <h3>
        {section === 'furniture'
          ? 'What’s staying, and what’s new?'
          : section === 'floor'
            ? 'Let’s choose your flooring.'
            : 'A finish for your walls.'}
      </h3>
      <p>
        {section === 'furniture'
          ? 'Review the piece cards below. Choose what to keep, or use Find options on a piece you want to buy.'
          : section === 'floor'
            ? 'Review the floor card below. Choose whether to keep the existing floor or include the finish in your design, then use Find flooring to compare products.'
            : 'Review the wall card below. Choose whether to keep the existing finish or include the one in your design, then use Find paint options to compare products.'}
      </p>
      <div className={styles.journeyGrid}>
        {section === 'furniture' ? (
          room.furniture.map((piece) => {
            const selected = draft.settings.furniture.find(
              (item) => item.id === piece.id,
            )!;
            const entry = findCatalogueEntry(
              piece.catalogueId,
              piece.catalogueVersion,
            );
            const category = entry?.category ?? 'storage';
            const targets = furnitureMaterialTargets(piece, category);
            const offer = draft.offers.find((o) => o.id === selected.offerId);
            return (
              <article key={piece.id}>
                <div className={styles.itemVisual}>
                  {entry ? (
                    <Image
                      src={thumbnailUrl(entry)}
                      alt={`${piece.label} representation`}
                      width={130}
                      height={90}
                    />
                  ) : (
                    <ChatIcon kind="furniture" />
                  )}
                  <div className={styles.swatches} aria-label="Design colours">
                    {[
                      targets.frame.color,
                      ...(category === 'bed'
                        ? [
                            targets.blanket.color,
                            targets.sheet.color,
                            targets.pillow.color,
                          ]
                        : []),
                    ].map((color, i) => (
                      <span key={i} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <h4>{piece.label}</h4>
                <p>
                  {selected.mode === 'reuse'
                    ? 'Keeping your existing piece'
                    : offer && 'priceMinor' in offer
                      ? `${money(offer.priceMinor, 'USD')} · ${offer.source.kind === 'sample' ? 'example price' : 'selected product'}`
                      : 'Choose a product to price this piece'}
                </p>
                <div className={styles.actions}>
                  <button
                    aria-pressed={selected.mode === 'reuse'}
                    disabled={!!state.candidate}
                    onClick={() => {
                      const next = furniturePurchase(
                        draft.settings,
                        piece.id,
                        false,
                      );
                      if (next)
                        update(next, `${piece.label} will stay in your room.`);
                    }}
                  >
                    Keep this piece
                  </button>
                  <button
                    disabled={!!state.candidate || researchBusy}
                    onClick={() => onResearch(piece.id, '')}
                  >
                    Find options
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <article>
            <div className={styles.itemVisual}>
              <ChatIcon kind={section} />
              <div className={styles.finishPalette}>
                {(section === 'floor' ? ['floor' as const] : WALLS).map(
                  (surface) => {
                    const finish = roomSurface(room.room, surface);
                    return (
                      <span
                        key={surface}
                        style={{ backgroundColor: finish.color }}
                        title={`${surface}: ${finish.color}, ${finish.texture}`}
                      />
                    );
                  },
                )}
              </div>
            </div>
            <h4>
              {section === 'floor' ? 'Your floor finish' : 'Your wall finishes'}
            </h4>
            <p>
              {section === 'floor'
                ? roomSurface(room.room, 'floor').texture.replace(
                    'planks',
                    'Wood planks',
                  )
                : 'Colours from your current design'}
            </p>
            <div className={styles.actions}>
              {([false, true] as const).map((include) => (
                <button
                  key={String(include)}
                  disabled={!!state.candidate}
                  aria-pressed={
                    section === 'floor'
                      ? draft.settings.floor.enabled === include
                      : draft.settings.walls.every((w) => w.enabled === include)
                  }
                  onClick={() => {
                    const next = structuredClone(draft.settings);
                    if (section === 'floor') next.floor.enabled = include;
                    else
                      next.walls.forEach((w) => {
                        w.enabled = include;
                      });
                    update(
                      next,
                      include
                        ? 'This finish is included in your estimate.'
                        : 'Keeping the existing finish. No new material is included.',
                    );
                  }}
                >
                  {include
                    ? section === 'floor'
                      ? 'Include a new floor'
                      : 'Include this finish'
                    : 'Keep existing finish'}
                </button>
              ))}
              <button
                disabled={!!state.candidate || researchBusy}
                onClick={() =>
                  onResearch(
                    section === 'floor' ? 'surface:floor' : 'surface:north',
                    '',
                    section === 'walls',
                  )
                }
              >
                {section === 'floor' ? 'Find flooring' : 'Find paint options'}
              </button>
            </div>
          </article>
        )}
      </div>
      {section === 'furniture' && !room.furniture.length && (
        <p>
          Your design has no furniture yet. Add pieces in Design, or continue
          with finishes.
        </p>
      )}
      <button
        className="glass-control"
        onClick={() =>
          onContinue(
            section === 'furniture'
              ? 'floor'
              : section === 'floor'
                ? 'walls'
                : 'review',
          )
        }
      >
        {section === 'walls'
          ? 'Review the full estimate'
          : section === 'floor'
            ? 'Next, the walls'
            : 'Next, the floor'}{' '}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
