import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Ref, RefObject } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import {
  MARKET_BATCH_SIZE,
  marketTargets,
  marketTargetForKey,
  runMarketResearch,
} from './market-research';
import type { MarketTarget } from './market-research';
import { useCostConversationState } from './conversation';
import type { MarketEntry } from './conversation';
import {
  reviewSourceSize,
  productChosen,
  sourceOfferSelected,
  sourceSizeNeedsReview,
} from './attach-offer';
import { SourceCard, productChoices } from './source-card';
import { ProductCarousel } from './product-carousel';
import { currentProductChoices, allProductsChosen } from './product-choices';
import {
  INITIAL_PRODUCT_GUIDE,
  guideView,
  chooseRemainingProducts,
  chooseGuidedProduct,
} from './selection-guide';
import type { GuideAction } from './selection-guide';
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

export function Research({
  controller,
  state,
  onInspect,
  onDesign,
  requestRef,
  onBusyChange,
  transport,
  resultsRef,
  guideRef,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onInspect: (key: string | null) => void;
  onDesign: () => void;
  onBusyChange?: (busy: boolean) => void;
  transport?: typeof fetch | undefined;
  resultsRef?: RefObject<HTMLElement | null>;
  guideRef?: Ref<(action: GuideAction, request?: string) => void>;
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
    [message, setMessage] = useCostConversationState(controller, 'message');
  const [entries, setEntries] = useCostConversationState(controller, 'entries');
  const [storedGuide, setGuide] = useCostConversationState(controller, 'guide');
  const guide = storedGuide ?? INITIAL_PRODUCT_GUIDE;
  const [, setResearchAfter] = useCostConversationState(
    controller,
    'researchAfter',
  );
  const [remaining, setRemaining] = useCostConversationState(
    controller,
    'remaining',
  );
  const [progress, setProgress] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null),
    localSectionRef = useRef<HTMLElement>(null),
    sectionRef = resultsRef ?? localSectionRef;
  const task = useRef<ReturnType<typeof runMarketResearch> | null>(null),
    live = useRef(true),
    pendingBatch = useRef<MarketTarget[]>([]),
    pendingAll = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      if (task.current) {
        task.current.cancel();
        setEntries((previous) =>
          previous.map((entry) =>
            entry.update.kind === 'finding'
              ? {
                  ...entry,
                  update: {
                    kind: 'answer',
                    answer: {
                      ok: false,
                      retired: true,
                      message:
                        'Search paused. Find options for this item when you’re ready.',
                    },
                  },
                }
              : entry,
          ),
        );
        if (pendingAll.current) setRemaining(pendingBatch.current);
        setMessage('Search paused. Your found options and choices are saved.');
      }
      onBusyChange?.(false);
    };
  }, [onBusyChange, setEntries, setRemaining, setMessage]);
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
  }, [busy, sectionRef]);
  const fresh = (entry: MarketEntry) =>
    entry.generation === state.generation &&
    entry.workspaceId === state.workspace?.workspaceId &&
    entry.roomRevision === room.roomRevision &&
    entry.costRevision === draft.revision;
  const say = useCallback(
    (text: string) => {
      if (controller.costMessage('assistant', text))
        setResearchAfter(controller.getSnapshot().cost!.messages.at(-1)!.id!);
    },
    [controller, setResearchAfter],
  );
  const start = useCallback(
    async (
      requestedKey: string,
      preferences: string,
      usePrimer = false,
      matchingWalls = false,
    ) => {
      if (!live.current || task.current) return;
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
        const grouped = !usePrimer
          ? marketTargetForKey(current.workspace.current, requestedKey)
          : null;
        const brief = buildSourcingBrief(
          current.workspace.current,
          grouped?.key ?? requestedKey,
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
            key: grouped?.key ?? requestedKey,
            brief,
            label: grouped?.label ?? brief.label,
            group:
              brief.kind === 'furniture'
                ? 'Furniture'
                : brief.kind === 'floor'
                  ? 'Flooring'
                  : brief.kind === 'service'
                    ? 'Services'
                    : 'Wall paint',
            matchingWalls: grouped?.matchingWalls ?? matchingWalls,
          },
        ];
      }
      if (!targets.length) return;
      if (requestedKey === 'all') setEntries([]);
      setGuide((previous) =>
        requestedKey === 'all' || previous?.stage === 'done'
          ? {
              stage: 'ready',
              key: all ? null : targets[0]!.key,
              reviewedKeys: [],
            }
          : {
              ...(previous ?? INITIAL_PRODUCT_GUIDE),
              stage: 'ready',
              key: all ? null : targets[0]!.key,
              reviewedKeys: (previous?.reviewedKeys ?? []).filter(
                (key) => all || key !== targets[0]!.key,
              ),
            },
      );
      setMessage('');
      setBusy(true);
      onBusyChange?.(true);
      let index = 0,
        choicesFound = 0;
      pendingBatch.current = targets;
      pendingAll.current = all;
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
          } else if (
            update.answer.ok &&
            productChoices(update.answer.reply.candidates).length
          ) {
            choicesFound++;
          }
          if (update.kind === 'answer')
            pendingBatch.current = pendingBatch.current.filter(
              (item) => item.key !== target.key,
            );
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
        setRemaining(
          all
            ? result.remaining
            : result.cancelled
              ? remaining
              : remaining.filter((target) => target.key !== targets[0]!.key),
        );
        if (result.cancelled) {
          setMessage('Search stopped. Your accepted prices are unchanged.');
          setEntries((previous) =>
            previous.map((entry) =>
              entry.update.kind === 'finding'
                ? {
                    ...entry,
                    update: {
                      kind: 'answer',
                      answer: {
                        ok: false,
                        retired: true,
                        message:
                          'Search stopped. Try this item again when you’re ready.',
                      },
                    },
                  }
                : entry,
            ),
          );
        } else if (result.remaining.length && !all)
          setMessage('Finish the current preview before finding options.');
        if (!result.cancelled) {
          say(
            result.remaining.length && all
              ? `Options for the first ${Math.min(targets.length, MARKET_BATCH_SIZE)} items are ready. There ${result.remaining.length === 1 ? 'is 1 more item' : `are ${result.remaining.length} more items`} to find. Continue the search, or start choosing from the ready options one item at a time.`
              : choicesFound
                ? 'Your options are ready. We’ll choose one item at a time: furniture first, then flooring and paint. Choose each product with me, or let me choose the rest from the closest priced matches. Then I’ll show your cost breakdown and help you export it.'
                : 'The search is finished, but these items still need suitable options. Let’s review them one at a time; I won’t choose an unsupported product for you.',
          );
        }
      } catch {
        if (live.current)
          setMessage(
            'Search could not finish. Your accepted prices are unchanged.',
          );
      } finally {
        if (task.current === running) {
          task.current = null;
          pendingBatch.current = [];
          if (live.current) {
            setBusy(false);
            onBusyChange?.(false);
          }
        }
      }
    },
    [
      controller,
      remaining,
      onBusyChange,
      transport,
      setMessage,
      setEntries,
      setRemaining,
      setGuide,
      say,
    ],
  );
  const view = guideView(room, draft, entries, guide);
  const refreshEntries = (before: SessionSnapshot, revision: number) =>
    setEntries((previous) =>
      previous.map((entry) =>
        entry.costRevision === before.cost?.revision &&
        entry.roomRevision === before.workspace?.current.roomRevision &&
        entry.generation === before.generation &&
        entry.workspaceId === before.workspace?.workspaceId
          ? { ...entry, costRevision: revision }
          : entry,
      ),
    );
  const act = (action: GuideAction, request?: string) => {
    if (busy || task.current || state.candidate || !controller.checkExpiry())
      return;
    const before = controller.getSnapshot();
    if (
      before.destination !== 'cost' ||
      before.pending ||
      before.candidate ||
      !before.cost ||
      !before.workspace
    )
      return;
    if (action === 'next' && view.stage === 'ready') action = 'start';
    if (
      !controller.costMessage(
        'visitor',
        request ??
          (action === 'auto'
            ? 'Choose the rest for me.'
            : action === 'next'
              ? 'Next item.'
              : action === 'review'
                ? 'Review my choices.'
                : 'Let’s start choosing.'),
      )
    )
      return;
    const freshPass =
      action === 'review' ||
      !guide.passId ||
      (guide.stage === 'done' && view.stage === 'ready');
    const passId = freshPass
      ? controller.getSnapshot().cost!.messages.at(-1)!.id!
      : guide.passId!;
    const reviewedKeys = freshPass ? [] : (guide.reviewedKeys ?? []);
    const pass = { ...guide, stage: 'choosing' as const, passId, reviewedKeys };
    const currentView = guideView(room, draft, entries, pass);
    if (action === 'auto') {
      if (allProductsChosen(before.workspace.current, before.cost)) {
        setGuide({
          ...pass,
          stage: 'done',
          key: null,
          reviewedKeys: marketTargets(room).map((target) => target.key),
        });
        controller.completeProductChoices(passId);
        return;
      }
      const result = chooseRemainingProducts(controller, entries, false);
      if (result.ok) {
        refreshEntries(before, result.revision);
        const current = controller.getSnapshot();
        if (allProductsChosen(current.workspace!.current, current.cost!)) {
          setGuide({
            ...pass,
            stage: 'done',
            key: null,
            reviewedKeys: marketTargets(room).map((target) => target.key),
          });
          controller.completeProductChoices(passId);
          setMessage('');
          return;
        }
        const missing = marketTargets(current.workspace!.current).find(
          (target) =>
            !currentProductChoices(
              current.workspace!.current,
              current.cost!,
            ).some((choice) => choice.key === target.key),
        );
        setGuide({
          ...pass,
          stage: 'choosing',
          key: missing?.key ?? currentView.active?.key ?? null,
          reviewedKeys: currentProductChoices(
            current.workspace!.current,
            current.cost!,
          ).map((choice) => choice.key),
        });
        say(
          `I chose ${result.selected.length} ${result.selected.length === 1 ? 'product' : 'products'} from the supported priced options. Some items still need your choice or better options. Let’s review ${missing?.label ?? 'the next item'} together.`,
        );
      } else {
        setGuide({
          ...pass,
          stage: 'choosing',
          key: currentView.active?.key ?? null,
        });
        say(result.reason);
      }
      return;
    }
    const target =
      action === 'review'
        ? currentView.queue[0]
        : action === 'next'
          ? currentView.next
          : currentView.active;
    if (!target) {
      if (currentView.complete) {
        setGuide({ ...pass, stage: 'done', key: null });
        controller.completeProductChoices(passId);
      } else {
        setGuide({ ...pass, stage: 'ready', key: null });
        say(
          'Some items still need a choice or more options. We can review them together, or you can ask me to choose from the supported options we already found.',
        );
      }
      return;
    }
    setGuide({ ...pass, stage: 'choosing', key: target.key });
    setMessage('');
    say(
      `${action === 'next' && currentView.active && !currentView.reviewed.has(currentView.active.key) ? `We’ll leave ${currentView.active.label} for later. ` : ''}${action === 'start' || action === 'review' ? 'Let’s look at' : 'Next,'} ${target.label}. ${target.group === 'Wall paint' && target.label === 'All walls' ? 'One paint choice covers all four matching walls. ' : ''}Compare these options and choose one, or ask me to choose the rest for you.`,
    );
  };
  useImperativeHandle(requestRef, () => start, [start]);
  useImperativeHandle(guideRef, () => act);
  if (!message && !entries.length && !busy) return null;
  if (view.stage === 'done' && view.complete && !busy) return null;
  const chosen = currentProductChoices(room, draft);
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className={styles.marketResearch}
      aria-label="Product options"
    >
      {busy ? (
        <div className={styles.researchPending}>
          <p role="status" className={styles.thinking}>
            <span aria-hidden="true" />
            {progress || 'Finding options…'}
          </p>
        </div>
      ) : view.stage === 'ready' ? (
        <div className={styles.guideIntro}>
          <p>
            {entries.some(fresh)
              ? `${view.available.length} ${view.available.length === 1 ? 'item is' : 'items are'} ready to review. We’ll keep just one item in view.`
              : 'These options need refreshing for your current design.'}
          </p>
          <div className={styles.actions}>
            {entries.some(fresh) ? (
              <>
                <button
                  className="glass-control"
                  onClick={() => act('start')}
                  disabled={!!state.candidate}
                >
                  Start choosing →
                </button>
                <button
                  className="glass-control"
                  onClick={() => act('auto')}
                  disabled={!!state.candidate}
                >
                  Choose for me
                </button>
              </>
            ) : (
              <button
                className="glass-control"
                onClick={() => void start('all', '')}
                disabled={!!state.candidate}
              >
                Find current options →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.marketHeading}>
          <ChatIcon kind="search" />
          <div>
            <h3>{view.active?.label ?? 'Choose your next product'}</h3>
            <p>
              Item{' '}
              {view.queue.findIndex(
                (target) => target.key === view.active?.key,
              ) + 1}{' '}
              of {view.queue.length} · {view.active?.group}
            </p>
            <p className={styles.choiceProgress} aria-live="polite">
              {
                view.targets.filter((target) => view.reviewed.has(target.key))
                  .length
              }{' '}
              of {marketTargets(room).length} choices completed
            </p>
          </div>
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
      {!busy &&
        view.stage === 'choosing' &&
        view.active &&
        !entries.some((entry) => entry.target.key === view.active!.key) && (
          <div className={styles.guideIntro}>
            <p>
              We still need options for {view.active.label} before choosing this
              product.
            </p>
            <button
              className="glass-control"
              disabled={!!state.candidate}
              onClick={() => {
                if (
                  !controller.costMessage(
                    'visitor',
                    `Find options for ${view.active!.label}.`,
                  )
                )
                  return;
                setResearchAfter(
                  controller.getSnapshot().cost!.messages.at(-1)!.id!,
                );
                void start(view.active!.key, '');
              }}
            >
              Find options for this item →
            </button>
          </div>
        )}
      {(['Furniture', 'Flooring', 'Wall paint', 'Services'] as const).map(
        (group) => {
          const items =
            !busy && view.stage === 'choosing'
              ? entries.filter(
                  (entry) =>
                    entry.target.group === group &&
                    entry.target.key === view.active?.key,
                )
              : [];
          if (!items.length) return null;
          return (
            <section
              key={group}
              className={styles.marketGroup}
              aria-label={`${group} market options`}
            >
              {items.map((entry) => {
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
                  products = productChoices(reply.candidates),
                  isFresh = fresh(entry);
                return (
                  <article
                    className={styles.marketItem}
                    key={target.key}
                    aria-label={`${target.label} options`}
                  >
                    <h4 className={styles.srOnly}>{target.label} options</h4>
                    {chosen.some((choice) => choice.key === target.key) && (
                      <p className={styles.note}>
                        Keep this product to continue, or choose another option.
                      </p>
                    )}
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
                    {!!products.length && (
                      <ProductCarousel label={target.label}>
                        {products.map((candidate, index) => (
                          <SourceCard
                            key={`${candidate.url}:${index}`}
                            candidate={candidate}
                            confirmSelection
                            simulation={answer.simulation}
                            matchingWalls={target.matchingWalls}
                            chooseLabel={
                              target.group === 'Wall paint'
                                ? target.label === 'All walls'
                                  ? 'Choose paint for all walls'
                                  : target.matchingWalls
                                    ? 'Choose paint for these walls'
                                    : 'Choose this paint'
                                : 'Choose this product'
                            }
                            selected={
                              target.brief.target.kind === 'service' ||
                              target.brief.kind === 'primer'
                                ? !!candidate.offer &&
                                  sourceOfferSelected(
                                    draft,
                                    target.brief,
                                    candidate.offer.id,
                                  )
                                : productChosen(
                                    room,
                                    draft,
                                    target.brief,
                                    candidate,
                                  )
                            }
                            disabled={!isFresh || busy || !!state.candidate}
                            needsSizeReview={sourceSizeNeedsReview(
                              target.brief,
                              candidate.offer,
                            )}
                            onSelect={() => {
                              if (!isFresh) return;
                              const before = controller.getSnapshot();
                              const kept = productChosen(
                                room,
                                draft,
                                target.brief,
                                candidate,
                              );
                              const applied = chooseGuidedProduct(
                                controller,
                                entries,
                                entry,
                                candidate,
                                guide,
                              );
                              if (applied.ok) {
                                refreshEntries(before, applied.revision);
                                setGuide(applied.guide);
                                setMessage('');
                                if (applied.complete) return;
                                say(
                                  `${kept ? 'Kept' : 'Added'} ${candidate.label} in your estimate. ${applied.next ? `Next, ${applied.next.label}. Choose one of these options, or let me choose the rest.` : 'Some items still need your choice or more options.'}`,
                                );
                              } else setMessage(applied.reason);
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
                      </ProductCarousel>
                    )}
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
                    {!!reply.notes.length && (
                      <details className={styles.sourceEvidence}>
                        <summary>Research notes</summary>
                        {reply.notes.map((note) => (
                          <p key={note}>{note}</p>
                        ))}
                      </details>
                    )}
                  </article>
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
