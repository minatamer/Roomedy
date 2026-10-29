import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { MedyIcon } from '../assistant/medy-icon';
import { Research } from './research';
import { costIntent } from './planning';
import { PlanCards } from './plan-cards';
import { VersionControls } from './version-controls';
import { EstimatePdfControls } from './estimate-pdf-controls';
import { EstimateReview } from './estimate-review';
import { RevealedText } from '../assistant/revealed-text';
import { JourneyCards } from './journey-cards';
import { LocationCard } from './location-card';
import {
  costSectionRequest,
  localityCorrection,
  simplifyCostScope,
  simpleEstimateInputs,
} from './journey';
import type { CostSection } from './journey';
import { explainCost, explanationLines } from './state';
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
  onReadOnlyChange,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onDesign: () => void;
  onExport: () => void;
  exportButtonRef: RefObject<HTMLButtonElement | null>;
  panelRef?: RefObject<HTMLElement | null>;
  onReadOnlyChange?: (readOnly: boolean) => void;
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [reviewVisit, setReviewVisit] = useState(0);
  const [section, setSection] = useState<CostSection>('welcome');
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [budget, setBudget] = useState<number | null>(null);
  const [work, setWork] = useState(false);
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
    composer = useRef<HTMLTextAreaElement>(null),
    logEnd = useRef<HTMLDivElement>(null),
    sectionStart = useRef<HTMLDivElement>(null);
  const legacy = draft.settings.locality.currency !== 'USD';
  const locationChosen =
    state.shoppingLocation?.country === currentCost.settings.locality.country;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (draft.messages.length)
      logEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [draft.messages.length]);
  useEffect(() => {
    if (section !== 'welcome')
      sectionStart.current?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
  }, [section]);
  const openSection = (next: CostSection) => {
    setSection(next);
    setReview(next === 'review');
    setBudget(null);
    setWork(false);
  };
  const openBreakdown = (recordRequest = true) => {
    if (!controller.checkExpiry() || state.candidate) {
      controller.notify('Apply or Cancel the preview before reviewing costs.');
      return;
    }
    if (!review && !saved) {
      if (recordRequest)
        controller.costMessage('visitor', 'Show my cost breakdown.');
      controller.costMessage(
        'assistant',
        'Here’s your shopping estimate. Open an item for its details, or download a PDF when you’re ready.',
      );
    }
    openSection('review');
    setReviewVisit((value) => value + 1);
    requestAnimationFrame(() =>
      sectionStart.current?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      }),
    );
  };
  const ask = (text: string) => {
    if (!text.trim() || !estimate || !controller.checkExpiry()) return;
    if (state.candidate) {
      controller.notify(
        'Apply or Cancel the preview before starting another request.',
      );
      return;
    }
    if (!controller.costMessage('visitor', text)) return;
    const requested = costSectionRequest(text);
    if (requested) {
      if (requested === 'review') openBreakdown(false);
      else openSection(requested);
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
        openSection('review');
        controller.costMessage(
          'assistant',
          'Here’s what you need to buy. Installation and site work are outside this material estimate.',
        );
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
          <div className={`${assistant.heading} ${styles.chatHeading}`}>
            <h2 className={assistant.name} data-cost-focus tabIndex={-1}>
              <MedyIcon /> Medy
            </h2>
            <div className={styles.headingActions}>
              <details className={assistant.privacy}>
                <summary aria-label="AI privacy information">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" />
                    <path
                      d="M12 11v6M12 7v1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </summary>
                <p>
                  In AI mode, finding products shares the selected item’s size,
                  finishes, shopping region and your preferences with the
                  provider.
                </p>
              </details>
              <button
                ref={exportButtonRef}
                className={`glass-control ${styles.pinnedShortcut}`}
                title="Pinned shortcut"
                onClick={onExport}
              >
                <svg
                  width="16"
                  height="16"
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
              </button>
              <button
                className={styles.textAction}
                onClick={() => {
                  if (saved) setViewingId(null);
                  if (saved || review) openSection('welcome');
                  else openBreakdown();
                }}
              >
                {review || saved ? 'Back to chat' : 'Cost breakdown'}
              </button>
            </div>
          </div>
          <div
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
                  {!saved && (
                    <article className={styles.welcome}>
                      {section === 'welcome' && (
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
                      {section === 'welcome' && (
                        <LocationCard
                          controller={controller}
                          state={state}
                          onReady={() => {
                            requestAnimationFrame(() => {
                              sectionStart.current?.focus({
                                preventScroll: true,
                              });
                              sectionStart.current?.scrollIntoView({
                                block: 'start',
                                behavior: 'smooth',
                              });
                            });
                          }}
                        />
                      )}
                    </article>
                  )}
                  {!saved &&
                    draft.messages.map((message, i) => (
                      <article
                        key={message.id ?? i}
                        className={
                          message.role === 'visitor'
                            ? styles.visitor
                            : styles.reply
                        }
                        aria-label={
                          message.role === 'visitor'
                            ? 'Your request'
                            : 'Medy response'
                        }
                      >
                        {message.lineIds &&
                        estimate &&
                        message.roomRevision === room.roomRevision &&
                        message.costRevision === draft.revision ? (
                          <>
                            <CostLineCards
                              estimate={estimate}
                              lines={estimate.lines.filter((line) =>
                                message.lineIds!.includes(line.id),
                              )}
                              inspect={inspect}
                            />
                            <details>
                              <summary>Full explanation</summary>
                              {message.text}
                            </details>
                          </>
                        ) : message.lineIds ? (
                          <details>
                            <summary>Earlier cost explanation</summary>
                            {message.text}
                          </details>
                        ) : message.role === 'assistant' &&
                          [
                            'Your work plan.',
                            'Let’s compare your options.',
                          ].includes(message.text) ? (
                          <span className={styles.srOnly}>{message.text}</span>
                        ) : message.role === 'assistant' &&
                          i === draft.messages.length - 1 ? (
                          <RevealedText
                            id={message.id ?? -i - 1}
                            text={message.text}
                            ledger={controller.costReveal}
                            enabled
                            onComplete={revealComplete}
                          />
                        ) : (
                          message.text
                        )}
                      </article>
                    ))}
                  {!saved && estimate && (
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
                  )}
                  <div
                    ref={sectionStart}
                    tabIndex={-1}
                    className={styles.sectionStart}
                    aria-label="Planning choices"
                  >
                    {!saved && (section !== 'welcome' || locationChosen) && (
                      <JourneyCards
                        section={section}
                        controller={controller}
                        state={state}
                        onContinue={openSection}
                        onResearch={(key, query, matchingWalls) => {
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
                  {!saved && (
                    <Research
                      key={section}
                      requestRef={research}
                      onDesign={onDesign}
                      controller={controller}
                      state={state}
                      onInspect={setSelected}
                    />
                  )}
                  {(review || saved) && estimate && (
                    <EstimateReview
                      key={`${reviewVisit}:${draft.revision}:${saved?.id ?? 'current'}`}
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
                  {(review || saved) && currentResult.ok && (
                    <VersionControls
                      controller={controller}
                      state={state}
                      estimate={currentResult.estimate}
                      selectedId={saved?.id ?? null}
                      onView={(id) => {
                        setViewingId(id);
                        setReview(true);
                      }}
                    />
                  )}
                </>
              )}
              <div ref={logEnd} />
            </div>
          </div>
          {!saved && !legacy && (
            <div className={styles.chatFooter}>
              {!state.candidate && (
                <div
                  className={`${assistant.goals} ${styles.choices}`}
                  role="group"
                  aria-label="Planning choices"
                >
                  <button
                    className="glass-control"
                    onClick={() => openBreakdown()}
                  >
                    <ChatIcon kind="budget" />
                    <span>Cost breakdown</span>
                    <span className={assistant.choiceArrow} aria-hidden="true">
                      →
                    </span>
                  </button>
                  {section !== 'welcome' &&
                    (
                      [
                        ['Choose furniture', 'furniture', 'furniture'],
                        ['Plan flooring', 'floor', 'floor'],
                        ['Choose wall paint', 'walls', 'walls'],
                      ] as const
                    )
                      .filter(([, target]) => target !== section)
                      .slice(0, 2)
                      .map(([label, target, icon]) => (
                        <button
                          key={target}
                          className="glass-control"
                          onClick={() => openSection(target)}
                        >
                          <ChatIcon kind={icon} />
                          <span>{label}</span>
                          <span
                            className={assistant.choiceArrow}
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </button>
                      ))}
                </div>
              )}
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
                    disabled={!input.trim() || !estimate || !!state.candidate}
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
            </div>
          )}
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
