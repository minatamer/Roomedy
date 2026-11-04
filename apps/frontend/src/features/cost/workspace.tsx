import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode, RefObject } from 'react';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { MedyIcon } from '../assistant/medy-icon';
import { Research } from './research';
import { costIntent, FIND_OPTIONS_MESSAGE } from './planning';
import { OptionsPrompt } from './options-prompt';
import { ChosenProducts } from './chosen-products';
import { useCostConversationState } from './conversation';
import { guideIntent, entryIsCurrent } from './selection-guide';
import { allProductsChosen } from './product-choices';
import { productChoices } from './source-card';
import type { GuideAction } from './selection-guide';
import { PlanCards } from './plan-cards';
import { VersionControls } from './version-controls';
import { EstimatePdfControls } from './estimate-pdf-controls';
import { EstimateReview } from './estimate-review';
import { RevealedText } from '../assistant/revealed-text';
import { useChatReading } from '../assistant/chat-reading';
import { JourneyCards } from './journey-cards';
import { LocationCard } from './location-card';
import {
  costSectionRequest,
  localityCorrection,
  simplifyCostScope,
  simpleEstimateInputs,
} from './journey';
import type { CostSection } from './journey';
import { explainCost, explanationLines, targetKey } from './state';
import type { CostMessage } from './state';
import { ChatIcon, CostLineCards } from './chat-visuals';
import assistant from '../assistant/assistant.module.css';
import styles from './workspace.module.css';

export function CostWorkspace({
  controller,
  state,
  onDesign,
  onExport,
  exportButtonRef,
  panelRef,
  header,
  onReadOnlyChange,
  researchTransport,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onDesign: () => void;
  onExport: () => void;
  exportButtonRef: RefObject<HTMLButtonElement | null>;
  panelRef?: RefObject<HTMLElement | null>;
  header?: ReactNode;
  onReadOnlyChange?: (readOnly: boolean) => void;
  researchTransport?: typeof fetch;
}) {
  const [viewingId, setViewingId] = useCostConversationState(
    controller,
    'viewingId',
  );
  const [section, setSection] = useCostConversationState(controller, 'section');
  const [selected, setSelected] = useCostConversationState(
    controller,
    'selected',
  );
  const [input, setInput] = useCostConversationState(controller, 'input');
  const [budget, setBudget] = useCostConversationState(controller, 'budget');
  const [work, setWork] = useCostConversationState(controller, 'work');
  const [researchBusy, setResearchBusy] = useState(false);
  const [guideEntries] = useCostConversationState(controller, 'entries');
  const guideAction = useRef<
    ((action: GuideAction, request?: string) => void) | null
  >(null);
  const [researchAfter, setResearchAfter] = useCostConversationState(
    controller,
    'researchAfter',
  );
  const showWelcome = section === 'welcome' && researchAfter === null;
  const saved = state.estimateVersions.find((v) => v.id === viewingId);
  useEffect(() => {
    onReadOnlyChange?.(!!saved);
    return () => onReadOnlyChange?.(false);
  }, [saved, onReadOnlyChange]);
  const currentRoom = state.workspace!.current,
    currentCost = state.cost!;
  const room = saved?.room ?? currentRoom;
  const draft = saved
    ? {
        ...saved.pricing,
        revision: 0,
        roomRevision: saved.room.roomRevision,
        messages: [],
      }
    : currentCost;
  const result = useMemo(
    () =>
      saved
        ? { ok: true as const, estimate: saved.estimate }
        : calculateRoomEstimate(room, draft.settings, draft.offers),
    [room, draft.settings, draft.offers, saved],
  );
  const currentResult = useMemo(
    () =>
      calculateRoomEstimate(
        currentRoom,
        currentCost.settings,
        currentCost.offers,
      ),
    [currentRoom, currentCost.settings, currentCost.offers],
  );
  const estimate = result.ok ? result.estimate : null;
  const research = useRef<
    | ((
        key: string,
        query: string,
        primer?: boolean,
        matchingWalls?: boolean,
      ) => Promise<void>)
    | null
  >(null);
  const heading = useRef<HTMLHeadingElement>(null),
    researchResults = useRef<HTMLElement>(null),
    composer = useRef<HTMLTextAreaElement>(null),
    log = useRef<HTMLDivElement>(null),
    latestReply = useRef<HTMLElement>(null),
    planReply = useRef<HTMLDivElement>(null),
    savedReply = useRef<HTMLDivElement>(null),
    sectionStart = useRef<HTMLDivElement>(null);
  const latestMessageId = draft.messages.at(-1)?.id,
    savedId = saved?.id;
  const requestKey = `${state.workspace!.workspaceId}:${state.generation}:${draft.messages.findLast((message) => message.role === 'visitor')?.id ?? ''}`;
  const read = useChatReading(log);
  const previousReading = useRef({
    section,
    proposal: state.costProposal,
    viewingId,
  });
  const legacy = draft.settings.locality.currency !== 'USD';
  const guided = !saved && !legacy && guideEntries.length > 0;
  const offerAutoChoice =
    guided &&
    !researchBusy &&
    !state.pending &&
    !allProductsChosen(currentRoom, currentCost) &&
    guideEntries.some(
      (entry) =>
        entryIsCurrent(entry, state) &&
        entry.update.kind === 'answer' &&
        entry.update.answer.ok &&
        productChoices(entry.update.answer.reply.candidates).length > 0,
    );
  useEffect(() => {
    if (!saved) controller.repairSelectedPrices();
  }, [controller, saved, currentCost.revision, state.generation]);
  const locationChosen =
    state.shoppingLocation?.country === currentCost.settings.locality.country;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const changedSection = previousReading.current.section !== section;
    const changedPreview =
      previousReading.current.proposal !== state.costProposal &&
      !!state.costProposal;
    const changedVersion = previousReading.current.viewingId !== viewingId;
    previousReading.current = {
      section,
      proposal: state.costProposal,
      viewingId,
    };
    const target = savedId
      ? savedReply.current
      : changedPreview
        ? planReply.current
        : researchBusy
          ? researchResults.current
          : changedSection && section !== 'welcome'
            ? sectionStart.current
            : (latestReply.current ?? sectionStart.current);
    read(
      target,
      changedSection || changedPreview || changedVersion,
      requestKey,
    );
  }, [
    read,
    latestMessageId,
    requestKey,
    section,
    researchBusy,
    state.costProposal,
    viewingId,
    savedId,
  ]);
  const openSection = (next: CostSection) => {
    setSection(next);
    setBudget(null);
    setWork(false);
  };
  const ask = (text: string) => {
    if (!text.trim() || !estimate || researchBusy || !controller.checkExpiry())
      return;
    if (state.candidate) {
      controller.notify(
        'Apply or Cancel the preview before starting another request.',
      );
      return;
    }
    const guidedAction = guideIntent(text);
    if (guided && guidedAction) {
      guideAction.current?.(guidedAction, text);
      return;
    }
    if (!controller.costMessage('visitor', text)) return;
    const requested = costSectionRequest(text);
    if (requested) {
      if (requested === 'review') {
        if (controller.costBreakdown()) {
          setViewingId(null);
          setBudget(null);
          setWork(false);
        }
      } else openSection(requested);
      return;
    }
    const locality = localityCorrection(text);
    if (locality) {
      const current = controller.getSnapshot();
      if (
        controller.chooseShoppingLocation(
          locality.country,
          'chat',
          current.generation,
          current.cost!.revision,
          locality.city,
        )
      )
        controller.costMessage(
          'assistant',
          `I’ll look around ${locality.city} and keep the estimate in USD. Choose furniture, flooring or wall paint to get started.`,
        );
      return;
    }
    const intent = costIntent(text, room, 'USD', selected);
    const primerRequest =
      /^(?:find|research|price|buy|choose|compare)?\s*(?:a\s+)?primer\b/i.test(
        text.trim(),
      );
    if (intent.kind === 'budget') {
      setBudget(intent.amountMinor);
      setWork(false);
      controller.costMessage('assistant', 'Let’s compare your options.');
    } else if (intent.kind === 'work') {
      if (draft.settings.demoScope) {
        setBudget(null);
        setWork(false);
        controller.costBreakdown();
        return;
      }
      setBudget(null);
      setWork(true);
      controller.costMessage('assistant', 'Your work plan.');
    } else if (intent.kind === 'research') {
      if (
        draft.settings.demoScope &&
        (intent.key.startsWith('service:') || primerRequest)
      ) {
        controller.costMessage(
          'assistant',
          'This estimate covers furniture, flooring and wall paint. Installation, preparation and primer are outside its scope.',
        );
        return;
      }
      setBudget(null);
      setWork(false);
      setResearchAfter(controller.getSnapshot().cost!.messages.at(-1)!.id!);
      void research.current?.(intent.key, intent.query, primerRequest);
    } else {
      setBudget(null);
      setWork(false);
      controller.costMessage(
        'assistant',
        intent.kind === 'clarify'
          ? intent.message
          : explainCost(estimate, text, selected),
        intent.kind === 'clarify'
          ? undefined
          : explanationLines(estimate, text, selected)
              .slice(0, 4)
              .map((line) => line.id),
      );
    }
  };
  const inspect = (key: string | null) => {
    if (!estimate || state.candidate || !controller.checkExpiry()) return;
    setSelected(key);
    if (!key) return;
    const text = key.startsWith('surface:')
      ? `Explain ${key.slice(8)} costs`
      : `Explain ${room.furniture.find((p) => p.id === key)?.label ?? 'furniture'} costs`;
    if (!controller.costMessage('visitor', text)) return;
    controller.costMessage(
      'assistant',
      explainCost(estimate, text, key),
      explanationLines(estimate, text, key)
        .slice(0, 4)
        .map((line) => line.id),
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
    setInput('');
  };
  const chooseProducts = () => {
    if (researchResults.current) {
      researchResults.current.focus({ preventScroll: true });
      read(researchResults.current, true);
    } else ask(FIND_OPTIONS_MESSAGE);
  };
  const renderMessage = (message: CostMessage, i: number) => {
    const lines =
      estimate?.lines.filter((line) => message.lineIds?.includes(line.id)) ??
      [];
    const prose =
      message.role === 'assistant' && i === draft.messages.length - 1 ? (
        <RevealedText
          id={message.id ?? -i - 1}
          text={message.text}
          ledger={controller.costReveal}
          enabled={state.destination === 'cost'}
          onComplete={revealComplete}
        />
      ) : (
        <p>{message.text}</p>
      );
    return (
      <article
        key={message.id ?? i}
        ref={i === draft.messages.length - 1 ? latestReply : undefined}
        className={
          message.role === 'visitor'
            ? `${styles.visitor} ${assistant.user}`
            : `${styles.reply} ${assistant.reply}`
        }
        aria-label={
          message.role === 'visitor' ? 'Your request' : 'Medy response'
        }
      >
        {message.kind === 'selection-summary' ||
        message.kind === 'breakdown' ||
        message.kind === 'find-options' ? (
          <>
            <RevealedText
              id={message.id ?? -i - 1}
              text={message.text}
              ledger={controller.costReveal}
              enabled={state.destination === 'cost'}
              onComplete={revealComplete}
            />
            {estimate &&
            !message.historical &&
            message.roomRevision === room.roomRevision &&
            message.costRevision === draft.revision ? (
              <div className={assistant.cards}>
                {message.kind !== 'selection-summary' && (
                  <p className={styles.note}>
                    {message.kind === 'find-options'
                      ? 'Look through the room items below, then use Find options for my room to search for products.'
                      : 'Review the breakdown below. Select a category tile to jump to its item costs, and expand product details to review quantities and sources.'}
                  </p>
                )}
                {message.kind === 'find-options' ? (
                  <OptionsPrompt
                    room={room}
                    disabled={
                      researchBusy ||
                      !!state.candidate ||
                      state.destination !== 'cost'
                    }
                    onFind={() => ask(FIND_OPTIONS_MESSAGE)}
                  />
                ) : message.kind !== 'selection-summary' ? (
                  <EstimateReview
                    estimate={estimate}
                    room={room}
                    offers={draft.offers}
                    materialsOnly={draft.settings.demoScope === 'materials'}
                    onChooseProducts={chooseProducts}
                    hasOptions={researchAfter !== null}
                    download={
                      state.destination === 'cost' ? (
                        <EstimatePdfControls
                          controller={controller}
                          selectedId={null}
                        />
                      ) : null
                    }
                  />
                ) : null}
                {message.kind !== 'find-options' && (
                  <ChosenProducts
                    room={room}
                    pricing={draft}
                    estimate={estimate}
                    onTakeoff={
                      !saved
                        ? (key, updates) => {
                            controller.setSelectedTakeoff(
                              key,
                              updates,
                              currentCost.revision,
                            );
                          }
                        : undefined
                    }
                    onQuantity={
                      !saved
                        ? (key, quantity) => {
                            controller.setSelectedQuantity(
                              key,
                              quantity,
                              currentCost.revision,
                            );
                          }
                        : undefined
                    }
                  />
                )}
                {message.kind === 'selection-summary' && (
                  <div className={styles.completionExport}>
                    <p>Export your room and selected products as a PDF.</p>
                    <EstimatePdfControls
                      controller={controller}
                      selectedId={null}
                      label="Export estimate PDF"
                    />
                  </div>
                )}
                {message.kind === 'breakdown' && currentResult.ok && (
                  <VersionControls
                    controller={controller}
                    state={state}
                    estimate={currentResult.estimate}
                    selectedId={null}
                    onView={setViewingId}
                  />
                )}
              </div>
            ) : (
              <p className={styles.note}>
                {message.kind === 'breakdown'
                  ? 'Earlier breakdown.'
                  : 'Earlier reply.'}{' '}
                Your choices have changed since this reply.
              </p>
            )}
          </>
        ) : message.lineIds &&
          !message.historical &&
          estimate &&
          message.roomRevision === room.roomRevision &&
          message.costRevision === draft.revision ? (
          <>
            {prose}
            {lines.length > 0 && (
              <p className={styles.note}>
                Compare the cost cards below. Open Calculation &amp; assumptions
                to see how each amount is worked out.
                {lines.some((line) =>
                  line.targets.some((target) => targetKey(target) !== null),
                ) && ' Use See related costs to explore an item.'}
              </p>
            )}
            <CostLineCards
              estimate={estimate}
              lines={lines}
              inspect={inspect}
            />
          </>
        ) : message.lineIds ? (
          <details>
            <summary>Earlier cost explanation</summary>
            {message.text}
          </details>
        ) : (
          prose
        )}
      </article>
    );
  };
  const researchNode = !saved ? (
    <Research
      key="research-owner"
      requestRef={research}
      guideRef={guideAction}
      resultsRef={researchResults}
      onBusyChange={setResearchBusy}
      transport={researchTransport}
      onDesign={onDesign}
      controller={controller}
      state={state}
      onInspect={setSelected}
    />
  ) : null;
  const conversation: ReactNode[] = draft.messages.flatMap((message, i) =>
    message.id === researchAfter
      ? [renderMessage(message, i), researchNode]
      : [renderMessage(message, i)],
  );
  if (
    researchNode &&
    !draft.messages.some((message) => message.id === researchAfter)
  ) {
    if (researchAfter === null) conversation.push(researchNode);
    else conversation.unshift(researchNode);
  }
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <h1 ref={heading} className={styles.srOnly} tabIndex={-1}>
          Estimate conversation
        </h1>
        <section
          ref={panelRef}
          className={styles.chat}
          aria-label="Medy planning assistant"
          style={{ transformOrigin: 'top left' }}
        >
          {header}
          <div
            className={
              header
                ? styles.srOnly
                : `${assistant.heading} ${styles.chatHeading}`
            }
          >
            <h2 className={assistant.name} data-cost-focus tabIndex={-1}>
              <MedyIcon /> Medy
            </h2>
          </div>
          <div
            ref={log}
            className={`${styles.transcript} roomedy-scroll`}
            role="log"
            aria-label="Cost conversation"
            tabIndex={0}
          >
            <div className={styles.reading}>
              {legacy ? (
                <article className={styles.reply}>
                  <h2>Keep your history. Plan in USD.</h2>
                  <p>
                    This earlier estimate retains its original amounts in your
                    project.
                  </p>
                  <button
                    className="glass-control"
                    onClick={() => {
                      if (
                        saved &&
                        currentCost.settings.locality.currency === 'USD'
                      ) {
                        setViewingId(null);
                        return;
                      }
                      const fresh = simpleEstimateInputs(currentRoom, {
                        ...currentCost.settings.locality,
                        currency: 'USD',
                      });
                      if (controller.updateCost(fresh.settings, fresh.offers))
                        setViewingId(null);
                    }}
                  >
                    Start a fresh USD estimate
                  </button>
                </article>
              ) : (
                <>
                  {!saved && (showWelcome || !draft.settings.demoScope) && (
                    <article className={styles.welcome}>
                      {showWelcome && (
                        <RevealedText
                          id={0}
                          text="Let’s turn your design into a shopping plan. We’ll choose furniture and finishes, then bring the costs together."
                          ledger={controller.costReveal}
                          enabled
                          onComplete={revealComplete}
                        />
                      )}
                      {!draft.settings.demoScope && (
                        <>
                          <p>
                            This earlier draft includes extra work costs. Start
                            a simpler furniture and materials estimate?
                          </p>
                          <button
                            className="glass-control"
                            disabled={!!state.candidate}
                            onClick={() => {
                              if (
                                controller.updateCost(
                                  simplifyCostScope(currentCost),
                                )
                              )
                                controller.notify(
                                  'Simple scope ready. Installation and extras are excluded; Undo restores the earlier scope.',
                                );
                            }}
                          >
                            Start a simple material estimate
                          </button>
                        </>
                      )}
                      {showWelcome && (
                        <LocationCard
                          controller={controller}
                          state={state}
                          onReady={() => {
                            requestAnimationFrame(() => {
                              sectionStart.current?.focus({
                                preventScroll: true,
                              });
                              read(sectionStart.current, true);
                            });
                          }}
                        />
                      )}
                    </article>
                  )}
                  {!saved && conversation}
                  {!saved && estimate && (
                    <div ref={planReply}>
                      <PlanCards
                        controller={controller}
                        state={state}
                        estimate={estimate}
                        budget={budget}
                        work={work}
                        inspect={inspect}
                        onPreview={setSelected}
                        onResolved={() =>
                          composer.current?.focus({ preventScroll: true })
                        }
                      />
                    </div>
                  )}
                  <div
                    ref={sectionStart}
                    tabIndex={-1}
                    className={styles.sectionStart}
                    aria-label="Planning choices"
                  >
                    {!saved &&
                      (section !== 'welcome' ||
                        (showWelcome && locationChosen)) && (
                        <JourneyCards
                          section={section}
                          controller={controller}
                          state={state}
                          researchBusy={researchBusy}
                          onFindOptions={() => {
                            ask(FIND_OPTIONS_MESSAGE);
                            composer.current?.focus({ preventScroll: true });
                          }}
                          onContinue={(next) =>
                            next === 'review'
                              ? ask('Show my cost breakdown.')
                              : openSection(next)
                          }
                          onResearch={(key, query, matchingWalls) => {
                            setResearchAfter(
                              controller.getSnapshot().cost!.messages.at(-1)
                                ?.id ?? null,
                            );
                            setSelected(key);
                            void research.current?.(
                              key,
                              query,
                              false,
                              matchingWalls,
                            );
                          }}
                        />
                      )}
                  </div>
                  {saved && estimate && (
                    <div ref={savedReply}>
                      <p>
                        This is your saved estimate. Review the selected
                        products below, expand their details for quantities and
                        sources, or select a category tile in the breakdown to
                        jump to its item costs.
                      </p>
                      <ChosenProducts
                        room={room}
                        pricing={draft}
                        estimate={estimate}
                      />
                    </div>
                  )}
                  {saved && estimate && (
                    <EstimateReview
                      key={saved.id}
                      estimate={estimate}
                      room={room}
                      offers={draft.offers}
                      materialsOnly={draft.settings.demoScope === 'materials'}
                      download={
                        state.destination === 'cost' ? (
                          <EstimatePdfControls
                            controller={controller}
                            selectedId={saved?.id ?? null}
                          />
                        ) : null
                      }
                    />
                  )}
                  {saved && currentResult.ok && (
                    <VersionControls
                      controller={controller}
                      state={state}
                      estimate={currentResult.estimate}
                      selectedId={saved?.id ?? null}
                      onView={setViewingId}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.chatFooter}>
            <div
              className={`${assistant.goals} ${styles.choices}`}
              role="group"
              aria-label="Planning shortcuts"
            >
              <button
                className="glass-control"
                disabled={
                  !!state.candidate ||
                  researchBusy ||
                  currentCost.settings.locality.currency !== 'USD'
                }
                onClick={() => ask('Show my cost breakdown.')}
              >
                <ChatIcon kind="budget" />
                <span>Cost breakdown</span>
                <span className={assistant.choiceArrow} aria-hidden="true">
                  →
                </span>
              </button>
              <button
                className="glass-control"
                disabled={
                  !!saved || legacy || researchBusy || !!state.candidate
                }
                onClick={() =>
                  ask(offerAutoChoice ? 'Choose for me.' : FIND_OPTIONS_MESSAGE)
                }
              >
                <ChatIcon kind={offerAutoChoice ? 'start' : 'search'} />
                <span>
                  {offerAutoChoice ? 'Choose for me' : 'Find options'}
                </span>
                <span className={assistant.choiceArrow} aria-hidden="true">
                  →
                </span>
              </button>
              <button
                ref={exportButtonRef}
                className={`glass-control ${styles.pinnedShortcut}`}
                title="Pinned shortcut"
                onClick={onExport}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3h8M9 3v6l-3 4v2h12v-2l-3-4V3M12 15v6" />
                </svg>
                <span>Export</span>
                <span className={assistant.choiceArrow} aria-hidden="true">
                  →
                </span>
              </button>
            </div>
            {!saved && !legacy && (
              <form
                className={`${assistant.composer} ${styles.costComposer}`}
                onSubmit={submit}
              >
                <div className={assistant.composerBox}>
                  <textarea
                    ref={composer}
                    aria-label="Ask Medy about costs"
                    value={input}
                    maxLength={2000}
                    rows={2}
                    placeholder="Let’s plan your room…"
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    className={assistant.sendButton}
                    aria-label="Send cost message"
                    disabled={
                      !input.trim() ||
                      !estimate ||
                      !!state.candidate ||
                      researchBusy
                    }
                    type="submit"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 13V3m-4 4 4-4 4 4" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>
          <p role="status" className={styles.status}>
            {state.message}
          </p>
          {(state.expiresSoon || state.persistence === 'memory-only') && (
            <p className={styles.note}>
              Keep an editable project copy from Design before leaving this
              session.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

const revealComplete = () => {};
