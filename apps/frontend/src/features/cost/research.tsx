import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Ref } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import {
  MARKET_BATCH_SIZE,
  marketTargets,
  runMarketResearch,
} from './market-research';
import type { MarketTarget, MarketUpdate } from './market-research';
import {
  reviewSourceSize,
  selectOffer,
  sourceOfferSelected,
  sourceSizeNeedsReview,
} from './attach-offer';
import { SourceCard } from './source-card';
import { ExternalLink } from './external-link';
import { ChatIcon } from './chat-visuals';
import styles from './workspace.module.css';

export function ResearchProgress({
  sectionRef,
  statusRef,
}: {
  sectionRef?: Ref<HTMLElement>;
  statusRef?: Ref<HTMLParagraphElement>;
}) {
  return (
    <section
      ref={sectionRef}
      className={styles.researchPending}
      aria-label="Product options"
    >
      <p
        role="status"
        ref={statusRef}
        tabIndex={-1}
        className={styles.thinking}
      >
        <span aria-hidden="true" />
        Thinking
      </p>
    </section>
  );
}

interface MarketEntry {
  target: MarketTarget;
  update: MarketUpdate;
  roomRevision: number;
  costRevision: number;
  generation: number;
  workspaceId: string;
}
export function Research({
  controller,
  state,
  onInspect,
  onDesign,
  requestRef,
  onBusyChange,
  transport,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onInspect: (key: string | null) => void;
  onDesign: () => void;
  onBusyChange?: (busy: boolean) => void;
  transport?: typeof fetch | undefined;
  requestRef?: Ref<
    (
      key: string,
      query: string,
      primer?: boolean,
      matchingWalls?: boolean,
    ) => Promise<void>
  >;
}) {
  const room = state.workspace!.current,
    draft = state.cost!;
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [entries, setEntries] = useState<MarketEntry[]>([]);
  const [remaining, setRemaining] = useState<MarketTarget[]>([]);
  const [progress, setProgress] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null),
    sectionRef = useRef<HTMLElement>(null);
  const task = useRef<ReturnType<typeof runMarketResearch> | null>(null),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      task.current?.cancel();
      onBusyChange?.(false);
    };
  }, [onBusyChange]);
  useEffect(() => {
    if (state.destination === 'cost') return;
    task.current?.cancel();
  }, [state.destination]);
  useEffect(() => {
    if (!busy) return;
    const frame = requestAnimationFrame(() => {
      const section = sectionRef.current,
        log = section?.closest<HTMLElement>('[role="log"]');
      if (section && log)
        log.scrollTo({
          top:
            log.scrollTop +
            section.getBoundingClientRect().top -
            log.getBoundingClientRect().top,
          behavior: 'smooth',
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [busy]);
  const fresh = (entry: MarketEntry) =>
    entry.generation === state.generation &&
    entry.workspaceId === state.workspace?.workspaceId &&
    entry.roomRevision === room.roomRevision &&
    entry.costRevision === draft.revision;
  const start = useCallback(
    async (
      requestedKey: string,
      preferences: string,
      usePrimer = false,
      matchingWalls = false,
    ) => {
      if (task.current) return;
      const current = controller.getSnapshot();
      if (!current.workspace || !current.cost || current.destination !== 'cost')
        return;
      const all = requestedKey === 'all' || requestedKey === 'remaining';
      let targets: MarketTarget[];
      if (all) {
        const keys = new Set(remaining.map((target) => target.key));
        targets = marketTargets(current.workspace.current).filter(
          (target) => requestedKey !== 'remaining' || keys.has(target.key),
        );
        if (preferences)
          targets = targets.map((target) => ({
            ...target,
            brief: { ...target.brief, query: preferences },
          }));
      } else {
        const brief = buildSourcingBrief(
          current.workspace.current,
          requestedKey,
          preferences,
          usePrimer,
        );
        if (!brief) {
          setMessage(
            'Choose a piece or finish and keep preferences within 240 characters.',
          );
          return;
        }
        targets = [
          {
            key: requestedKey,
            brief,
            label: brief.label,
            group:
              brief.kind === 'furniture'
                ? 'Furniture'
                : brief.kind === 'floor'
                  ? 'Flooring'
                  : brief.kind === 'service'
                    ? 'Services'
                    : 'Wall paint',
            matchingWalls,
          },
        ];
      }
      if (!targets.length) return;
      if (requestedKey === 'all') setEntries([]);
      setMessage('');
      setBusy(true);
      onBusyChange?.(true);
      let index = 0;
      const running = runMarketResearch(
        controller,
        targets,
        (target, update) => {
          if (!live.current) return;
          if (update.kind === 'finding') {
            index++;
            setProgress(
              `Finding ${index} of ${Math.min(targets.length, MARKET_BATCH_SIZE)} · ${target.label}`,
            );
          }
          setEntries((previous) => [
            ...previous.filter((entry) => entry.target.key !== target.key),
            {
              target,
              update,
              roomRevision: current.workspace!.current.roomRevision,
              costRevision: current.cost!.revision,
              generation: current.generation,
              workspaceId: current.workspace!.workspaceId,
            },
          ]);
        },
        (session, brief) => beginResearch(session, brief, transport),
      );
      task.current = running;
      try {
        const result = await running.result;
        if (!live.current || task.current !== running) return;
        setRemaining(all && !result.cancelled ? result.remaining : []);
        if (result.cancelled)
          setMessage('Search stopped. Your accepted prices are unchanged.');
        else if (result.remaining.length && !all)
          setMessage('Finish the current preview before finding options.');
      } catch {
        if (live.current)
          setMessage(
            'Search could not finish. Your accepted prices are unchanged.',
          );
      } finally {
        if (task.current === running) {
          task.current = null;
          if (live.current) {
            setBusy(false);
            onBusyChange?.(false);
          }
        }
      }
    },
    [controller, remaining, onBusyChange, transport],
  );
  useImperativeHandle(requestRef, () => start, [start]);
  if (!message && !entries.length && !busy) return null;
  return (
    <section
      ref={sectionRef}
      className={styles.marketResearch}
      aria-label="Product options"
    >
      <div className={styles.marketHeading}>
        <ChatIcon kind="search" />
        <div>
          <h3>Market options</h3>
          <p>
            Compare products for your design. Choose a price when you’re ready.
          </p>
        </div>
      </div>
      {busy && (
        <div className={styles.researchPending}>
          <p role="status" className={styles.thinking}>
            <span aria-hidden="true" />
            {progress || 'Finding options…'}
          </p>
        </div>
      )}
      <p
        role="status"
        ref={statusRef}
        tabIndex={-1}
        className={styles.marketStatus}
      >
        {message}
      </p>
      {message.includes('in Design') && (
        <button onClick={onDesign}>Review this piece in Design ↗</button>
      )}
      {(['Furniture', 'Flooring', 'Wall paint', 'Services'] as const).map(
        (group) => {
          const items = entries.filter((entry) => entry.target.group === group);
          if (!items.length) return null;
          return (
            <section
              key={group}
              className={styles.marketGroup}
              aria-label={`${group} market options`}
            >
              <h3>{group}</h3>
              {items.map((entry, itemIndex) => {
                const { target, update } = entry;
                if (update.kind === 'finding')
                  return (
                    <p className={styles.marketWaiting} key={target.key}>
                      {target.label}
                      <span>{busy ? 'Searching' : 'Search stopped'}</span>
                    </p>
                  );
                const answer = update.answer;
                if (!answer.ok)
                  return (
                    <article className={styles.marketFailure} key={target.key}>
                      <h4>{target.label}</h4>
                      <p>{answer.message}</p>
                      <button
                        className="glass-control"
                        disabled={busy || !!state.candidate}
                        onClick={() =>
                          void start(
                            target.key,
                            target.brief.query,
                            target.brief.kind === 'primer',
                            target.matchingWalls,
                          )
                        }
                      >
                        Try this item again
                      </button>
                    </article>
                  );
                const reply = answer.reply,
                  products = reply.candidates
                    .filter((candidate) => candidate.offer || candidate.listing)
                    .sort(
                      (a, b) => Number(!!b.imageUrl) - Number(!!a.imageUrl),
                    ),
                  leads = reply.candidates.filter(
                    (candidate) => !candidate.offer && !candidate.listing,
                  ),
                  isFresh = fresh(entry);
                return (
                  <details
                    className={styles.marketItem}
                    key={target.key}
                    open={items.length === 1 || itemIndex === 0}
                  >
                    <summary>
                      <span>{target.label}</span>
                      <small>
                        {!isFresh
                          ? 'Earlier design or estimate'
                          : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
                      </small>
                    </summary>
                    {answer.simulation && (
                      <p className={styles.note}>
                        Example options · illustrative prices, not live store
                        quotes.
                      </p>
                    )}
                    {!products.length && (
                      <p>
                        No suitable match found. Try a specific product or
                        store.
                      </p>
                    )}
                    <div className={styles.sourceCards}>
                      {products.map((candidate, index) => (
                        <SourceCard
                          key={`${candidate.url}:${index}`}
                          candidate={candidate}
                          simulation={answer.simulation}
                          matchingWalls={target.matchingWalls}
                          selected={
                            !!candidate.offer &&
                            sourceOfferSelected(
                              draft,
                              target.brief,
                              candidate.offer.id,
                            )
                          }
                          disabled={!isFresh || busy || !!state.candidate}
                          needsSizeReview={sourceSizeNeedsReview(
                            target.brief,
                            candidate.offer,
                          )}
                          onSelect={() => {
                            if (!isFresh) return;
                            const applied = selectOffer(
                              controller,
                              target.brief,
                              candidate,
                              entry.costRevision,
                              entry.roomRevision,
                              target.matchingWalls,
                            );
                            if (applied.ok) {
                              const revision =
                                controller.getSnapshot().cost!.revision;
                              setEntries((previous) =>
                                previous.map((item) =>
                                  item.costRevision === entry.costRevision &&
                                  item.roomRevision === entry.roomRevision &&
                                  item.generation === entry.generation &&
                                  item.workspaceId === entry.workspaceId
                                    ? { ...item, costRevision: revision }
                                    : item,
                                ),
                              );
                              requestAnimationFrame(() =>
                                statusRef.current?.focus({
                                  preventScroll: true,
                                }),
                              );
                            }
                            setMessage(
                              applied.ok
                                ? 'Price selected. Unresolved extras stay in the breakdown.'
                                : applied.reason,
                            );
                          }}
                          onReview={() => {
                            if (!isFresh) return;
                            const result = reviewSourceSize(
                              controller,
                              target.brief,
                              candidate,
                              entry.costRevision,
                              entry.roomRevision,
                            );
                            setMessage(
                              result.ok
                                ? 'Preview ready · review the room and costs before Apply.'
                                : result.reason,
                            );
                            if (result.ok)
                              onInspect(
                                target.brief.target.kind === 'furniture'
                                  ? target.brief.target.id
                                  : null,
                              );
                          }}
                        />
                      ))}
                    </div>
                    <button
                      className="glass-control"
                      disabled={busy || !!state.candidate}
                      onClick={() =>
                        void start(
                          target.key,
                          `${target.brief.query} Find different products or merchants.`
                            .trim()
                            .slice(0, 240),
                          target.brief.kind === 'primer',
                          target.matchingWalls,
                        )
                      }
                    >
                      Find more for this item
                    </button>
                    {!!leads.length && (
                      <details className={styles.sourceEvidence}>
                        <summary>Other stores to check</summary>
                        {leads.map((candidate) => (
                          <p key={candidate.url}>
                            <ExternalLink url={candidate.url}>
                              {candidate.label}
                            </ExternalLink>
                          </p>
                        ))}
                      </details>
                    )}
                    {!!reply.notes.length && (
                      <details className={styles.sourceEvidence}>
                        <summary>Research notes</summary>
                        {reply.notes.map((note) => (
                          <p key={note}>{note}</p>
                        ))}
                      </details>
                    )}
                  </details>
                );
              })}
            </section>
          );
        },
      )}
      {!busy && remaining.length > 0 && entries.some(fresh) && (
        <button
          className="glass-control"
          disabled={!!state.candidate}
          onClick={() => void start('remaining', '')}
        >
          Find the next {Math.min(remaining.length, MARKET_BATCH_SIZE)}{' '}
          {remaining.length === 1 ? 'item' : 'items'}{' '}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}
