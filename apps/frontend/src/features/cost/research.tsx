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
  MARKET_TARGET_LIMIT,
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
  entryIsCurrent,
  visibleMarketEntries,
} from './selection-guide';
import type { GuideAction } from './selection-guide';
import styles from './workspace.module.css';
import { marketVisualGuidance } from '../assistant/visual-guidance';
import { productReference } from './product-visual';

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
  const fresh = (entry: MarketEntry) => entryIsCurrent(entry, state);
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
      let started = 0,
        finished = 0,
        choicesFound = 0;
      pendingBatch.current = targets;
      pendingAll.current = all;
      if (all) setRemaining(targets);
      const running = runMarketResearch(
        controller,
        targets,
        (target, update) => {
          if (!live.current) return;
          if (update.kind === 'finding') {
            started++;
          } else if (
            update.answer.ok &&
            productChoices(update.answer.reply.candidates).length
          ) {
            choicesFound++;
          }
          if (update.kind === 'answer') {
            finished++;
            pendingBatch.current = pendingBatch.current.filter(
              (item) => item.key !== target.key,
            );
            if (all) setRemaining(pendingBatch.current);
          }
          setProgress(
            `Finding options · ${finished} of ${Math.min(targets.length, MARKET_TARGET_LIMIT)} finished · ${started - finished} searching`,
          );
          setEntries((previous) => {
            const entry: MarketEntry = {
              target,
              update,
              roomRevision: current.workspace!.current.roomRevision,
              costRevision: current.cost!.revision,
              generation: current.generation,
              workspaceId: current.workspace!.workspaceId,
            };
            return previous.some((item) => item.target.key === target.key)
              ? previous.map((item) =>
                  item.target.key === target.key ? entry : item,
                )
              : [...previous, entry];
          });
        },
        (session, brief, scope) =>
          beginResearch(session, brief, transport, scope),
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
        } else if (result.paused)
          setMessage(
            'Search paused because research is busy or unavailable. Your found options are saved.',
          );
        else if (result.remaining.length && !all)
          setMessage('Finish the current preview before finding options.');
        if (!result.cancelled) {
          say(
            result.remaining.length && all
              ? `Found options for ${choicesFound} of ${targets.length} items. The search was interrupted; your results are shown below.`
              : choicesFound
                ? `Found options for ${choicesFound} of ${targets.length} items. Compare the cards below and choose products in any order.`
                : 'The search is finished. Items without suitable options are shown below; you can try those items again.',
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
    pass.mode = action === 'auto' ? 'automatic' : 'manual';
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
          'The remaining items are shown below; no usable product option was available for them.',
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
  const visibleEntries = visibleMarketEntries(room, draft, entries, guide);
  const counts = visibleEntries
    .filter(fresh)
    .map((entry) =>
      entry.update.kind === 'answer' && entry.update.answer.ok
        ? productChoices(entry.update.answer.reply.candidates).length
        : 0,
    );
  const visualGuide = marketVisualGuidance(
    busy,
    counts.reduce((sum, count) => sum + count, 0),
    counts.some((count) => count > 1),
  );
  if (!message && !entries.length && !busy) return null;
  if (
    !busy &&
    !visibleEntries.length &&
    guide.stage === 'done' &&
    allProductsChosen(room, draft)
  )
    return null;
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className={styles.marketResearch}
      aria-label="Product options"
    >
      {visualGuide && <p>{visualGuide}</p>}
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
      {!busy && entries.length > 0 && !entries.some(fresh) && (
        <button
          className="glass-control"
          disabled={!!state.candidate}
          onClick={() => void start('all', '')}
        >
          Find current options →
        </button>
      )}
      {(['Furniture', 'Flooring', 'Wall paint', 'Services'] as const).map(
        (group) => {
          const items = visibleEntries.filter(
            (entry) => entry.target.group === group,
          );
          if (!items.length) return null;
          return (
            <section
              key={group}
              className={styles.marketGroup}
              aria-label={`${group} market options`}
            >
              <h3>{group}</h3>
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
                    <h4>{target.label} options</h4>
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
                            reference={productReference(room, target.key)}
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
          Resume search <span aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}
