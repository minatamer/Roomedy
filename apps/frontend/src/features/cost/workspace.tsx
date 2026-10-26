import { Research } from './research';
import { costIntent } from './planning';
import { PlanCards } from './plan-cards';
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FormEvent, ReactNode } from 'react';
import type {
  EstimateLine,
  EstimateQuantity,
} from '@roomedy/contracts/estimates';
import { calculateRoomEstimate } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import type { CataloguePlacement } from '../room-editor/catalogue-placement';
import type { CameraPose } from '../room-view/adapter';
import { Brand } from '../landing/brand';
import { MedyIcon } from '../assistant/medy-icon';
import { ScopeControls } from './scope-controls';
import { explainCost, money, targetExists, targetKey } from './state';
import styles from './workspace.module.css';
const Cutaway = lazy(() => import('../room-view/cutaway'));
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function quantity(q: EstimateQuantity | null) {
  if (!q) return 'Needs measurement';
  const value = q.numerator / q.denominator;
  const divisor =
    q.unit === 'mm2' ? 1e6 : q.unit === 'mm' || q.unit === 'ml' ? 1000 : 1;
  const unit =
    q.unit === 'mm2'
      ? 'm²'
      : q.unit === 'mm'
        ? 'm'
        : q.unit === 'ml'
          ? 'L'
          : q.unit;
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(value / divisor)} ${unit}`;
}
export function CostWorkspace({
  controller,
  state,
  placement,
  onDesign,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  placement: CataloguePlacement;
  onDesign: () => void;
}) {
  const room = state.workspace!.current,
    draft = state.cost!;
  const [selected, setSelected] = useState<string | null>(null),
    [lineId, setLineId] = useState<string | null>(null),
    [isolated, setIsolated] = useState(false),
    [graphics, setGraphics] = useState(true),
    [input, setInput] = useState(''),
    [openedAt] = useState(() => performance.now()),
    [budget, setBudget] = useState<{ amount: number; currency: string } | null>(
      draft.budgetMinor === null
        ? null
        : {
            amount: draft.budgetMinor,
            currency: draft.settings.locality.currency,
          },
    ),
    [work, setWork] = useState(false);
  const research = useRef<
    ((key: string, query: string, primer?: boolean) => Promise<void>) | null
  >(null);
  const camera = useRef<CameraPose | null>(null),
    roomCard = useRef<HTMLElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    composer = useRef<HTMLTextAreaElement>(null),
    logEnd = useRef<HTMLDivElement>(null);
  const result = useMemo(
    () => calculateRoomEstimate(room, draft.settings, draft.offers),
    [room, draft.settings, draft.offers],
  );
  const target = targetExists(room, selected) ? selected : null;
  const inspection = useMemo(() => ({ target, isolated }), [target, isolated]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (draft.messages.length)
      logEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [draft.messages.length]);
  const estimate = result.ok ? result.estimate : null;
  const pickedLine =
    estimate?.lines.find((line) => line.id === lineId) ??
    estimate?.lines.find(
      (line) => target && line.targets.some((t) => targetKey(t) === target),
    );
  const pick = (line: EstimateLine) => {
    setLineId(line.id);
    setSelected(targetKey(line.targets[0]!));
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
    const intent = costIntent(
      text,
      room,
      draft.settings.locality.currency,
      target,
    );
    if (intent.kind === 'budget') {
      setWork(false);
      setBudget({
        amount: intent.amountMinor,
        currency: draft.settings.locality.currency,
      });
      controller.costMessage(
        'assistant',
        'I’ll compare compatible recorded products and keeping your owned furniture. Review the alternatives below; required work and unresolved costs stay visible.',
      );
    } else if (intent.kind === 'work') {
      setBudget(null);
      setWork(true);
      controller.costMessage(
        'assistant',
        'Your work sequence and shopping quantities are ready below. Site checks, product instructions and unresolved timing remain visible.',
      );
    } else if (intent.kind === 'research') {
      setBudget(null);
      setWork(false);
      controller.costMessage(
        'assistant',
        'I’ll research this part using its design brief and your selected city and currency. Review the evidence and differences before using a price.',
      );
      void research.current?.(intent.key, intent.query, /primer/i.test(text));
    } else
      controller.costMessage(
        'assistant',
        intent.kind === 'clarify'
          ? intent.message
          : explainCost(estimate, text, target),
      );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
    setInput('');
  };
  const inspect = (key: string | null) => {
    setSelected(key);
    setLineId(null);
    setGraphics(true);
    roomCard.current?.focus({ preventScroll: true });
    roomCard.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  const fallback = (
    <div className={styles.fallback}>
      <p>
        Your room and estimate are ready to explore below. Select a line for
        quantities, assumptions and source details.
      </p>
      <button onClick={onDesign}>Open Design &amp; 2D plan</button>
    </div>
  );
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <nav aria-label="Project phases">
          <button onClick={onDesign}>← Design</button>
          <span aria-current="page">Plan &amp; cost</span>
          <button disabled={!state.undoLabel} onClick={() => controller.undo()}>
            Undo{state.undoLabel ? ` · ${state.undoLabel}` : ''}
          </button>
        </nav>
        <span className={styles.revision}>
          Room revision {room.roomRevision}
        </span>
      </header>
      <main id="main-content" className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Your room, made real</p>
          <h1 ref={heading} tabIndex={-1}>
            Bring your room to life.
          </h1>
          <p>
            Explore what to buy, what to keep and the work that brings it
            together.
          </p>
        </div>
        <section
          ref={roomCard}
          tabIndex={-1}
          aria-label="Room and estimate"
          className={styles.roomCard}
        >
          <div className={styles.cardTop}>
            <div>
              <p className={styles.eyebrow}>
                {state.costProposal
                  ? 'Proposal preview'
                  : target
                    ? 'In focus'
                    : 'The whole picture'}
              </p>
              <h2>
                {target?.startsWith('surface:')
                  ? `${target.slice(8)} surface`
                  : (room.furniture.find((p) => p.id === target)?.label ??
                    'Your room')}
              </h2>
            </div>
            <div className={styles.actions}>
              <button
                aria-pressed={isolated}
                disabled={!target}
                onClick={() => setIsolated((v) => !v)}
              >
                Isolate
              </button>
              <button
                onClick={() => {
                  setSelected(null);
                  setLineId(null);
                  setIsolated(false);
                }}
              >
                Whole room
              </button>
              <button
                aria-pressed={graphics}
                onClick={() => setGraphics((v) => !v)}
              >
                {graphics ? 'Use text view' : 'Show 3D'}
              </button>
            </div>
          </div>
          {graphics ? (
            <SceneBoundary fallback={fallback}>
              <Suspense
                fallback={
                  <div className={styles.fallback} role="status">
                    Preparing your 3D room…
                  </div>
                }
              >
                <Cutaway
                  room={room}
                  candidate={
                    state.candidate?.source === 'cost'
                      ? state.candidate.room
                      : undefined
                  }
                  checks={state.checks!}
                  selectedId={target?.startsWith('surface:') ? null : target}
                  onSelect={(id) => {
                    setSelected(id);
                    setLineId(null);
                  }}
                  cameraFrame={undefined}
                  inspection={inspection}
                  cameraStateRef={camera}
                  openedAt={openedAt}
                  onPlan={() => setGraphics(false)}
                  controller={controller}
                  readOnly
                  snap={false}
                  placement={placement}
                  onAddDesk={onDesign}
                  arranging={false}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            fallback
          )}
          <div className={styles.total}>
            <div>
              <small>
                {estimate?.complete ? 'Estimated total' : 'Known costs so far'}
              </small>
              <strong>
                {estimate
                  ? money(estimate.knownTotalMinor, estimate.locality.currency)
                  : 'Review your cost scope'}
              </strong>
            </div>
            <p>
              {estimate
                ? `${estimate.unpricedCount} unresolved ${estimate.unpricedCount === 1 ? 'line' : 'lines'} · ${draft.settings.locality.city}`
                : result.ok
                  ? ''
                  : result.code}
              <br />
              <span>
                Authored sample prices until you select sourced or manual
                prices.
              </span>
            </p>
          </div>
        </section>
        <section
          className={styles.conversation}
          aria-label="Plan and cost conversation"
        >
          <h2>
            <MedyIcon /> Let’s bring it together
          </h2>
          <p className={styles.welcome}>
            I’ve broken your room into materials, furniture and work. Choose a
            part in 3D or a cost line below, and we can explore its quantities
            and assumptions.
          </p>
          <div role="log" aria-label="Cost conversation">
            {draft.messages.map((message, i) => (
              <div
                key={i}
                className={
                  message.role === 'visitor' ? styles.visitor : styles.reply
                }
              >
                <span className={styles.srOnly}>
                  {message.role === 'visitor' ? 'You' : 'Medy'}:{' '}
                </span>
                {message.text}
                <small className={styles.messageStamp}>
                  Room {message.roomRevision} · estimate {message.costRevision}
                </small>
              </div>
            ))}
            <div ref={logEnd} />
          </div>
          <div className={styles.quick}>
            {[
              'Find options for this part',
              'Compare a cheaper budget',
              'Show my work plan',
            ].map((text) => (
              <button
                key={text}
                disabled={!!state.candidate}
                onClick={() => ask(text)}
              >
                {text}
              </button>
            ))}
          </div>
          <form className={styles.composer} onSubmit={submit}>
            <textarea
              ref={composer}
              aria-label="Ask Medy about costs"
              value={input}
              maxLength={2000}
              rows={2}
              placeholder="Ask about your room’s costs…"
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
              aria-label="Send cost message"
              disabled={!input.trim() || !estimate || !!state.candidate}
              type="submit"
            >
              ↑
            </button>
          </form>
        </section>
        {estimate && (
          <PlanCards
            controller={controller}
            state={state}
            estimate={estimate}
            budget={
              budget?.currency === draft.settings.locality.currency
                ? budget.amount
                : null
            }
            work={work}
            inspect={inspect}
            onPreview={(key) => {
              setSelected(key);
              setLineId(null);
              setGraphics(true);
            }}
            onResolved={() => composer.current?.focus({ preventScroll: true })}
          />
        )}
        <Research
          requestRef={research}
          controller={controller}
          state={state}
          selected={target}
          onInspect={(key) => {
            setSelected(key);
            setLineId(null);
            setGraphics(true);
            roomCard.current?.focus({ preventScroll: true });
            roomCard.current?.scrollIntoView({
              block: 'start',
              behavior: 'smooth',
            });
          }}
        />
        <fieldset className={styles.scopeGuard} disabled={!!state.candidate}>
          <legend className={styles.srOnly}>Estimate scope</legend>
          <ScopeControls controller={controller} room={room} draft={draft} />
        </fieldset>
        {estimate && (
          <section className={styles.breakdown} aria-label="Itemized estimate">
            <div className={styles.cardTop}>
              <div>
                <p className={styles.eyebrow}>Connected to your design</p>
                <h2>The breakdown</h2>
              </div>
              <span>{estimate.lines.length} lines</span>
            </div>
            {(
              [
                'floor',
                'walls',
                'furniture',
                'services',
                'delivery',
                'tax',
                'allowance',
              ] as const
            ).map((category) => {
              const lines = estimate.lines.filter(
                (line) => line.category === category,
              );
              if (!lines.length) return null;
              return (
                <details key={category} open={category === 'floor'}>
                  <summary>
                    {category === 'walls'
                      ? 'Walls & painting'
                      : category[0]!.toUpperCase() + category.slice(1)}{' '}
                    <span>
                      {money(
                        lines.reduce(
                          (sum, line) => sum + (line.amountMinor ?? 0),
                          0,
                        ),
                        estimate.locality.currency,
                      )}
                      {lines.some((line) => line.amountMinor === null)
                        ? ' + unresolved'
                        : ''}
                    </span>
                  </summary>
                  <ul>
                    {lines.map((line) => (
                      <li key={line.id}>
                        <button
                          aria-pressed={pickedLine?.id === line.id}
                          onClick={() => pick(line)}
                        >
                          <span>
                            {line.label}
                            <small>
                              {quantity(line.quantity)} · {line.pricing}
                            </small>
                          </span>
                          <strong>
                            {line.amountMinor === null
                              ? 'Needs review'
                              : money(
                                  line.amountMinor,
                                  estimate.locality.currency,
                                )}
                          </strong>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
            {pickedLine && (
              <Calculation
                line={pickedLine}
                draft={draft}
                onInspect={(key) => {
                  setSelected(key);
                  setGraphics(true);
                  roomCard.current?.focus({ preventScroll: true });
                  roomCard.current?.scrollIntoView({
                    block: 'start',
                    behavior: 'smooth',
                  });
                }}
              />
            )}
            <p className={styles.note}>
              Allowances{' '}
              {money(estimate.allowanceMinor, estimate.locality.currency)} · tax{' '}
              {money(estimate.taxMinor, estimate.locality.currency)}. An
              unresolved line is excluded from known costs, never priced at
              zero.
            </p>
          </section>
        )}
        {state.expiresSoon && (
          <p role="status">
            This room expires soon. Keep a project copy from Design.
          </p>
        )}
        {state.persistence === 'memory-only' && (
          <p role="status">
            This room is held in this tab. Export a copy from Design before
            leaving.
          </p>
        )}
        <p role="status" className={styles.status}>
          {state.message}
        </p>
      </main>
    </div>
  );
}
function Calculation({
  line,
  draft,
  onInspect,
}: {
  onInspect: (key: string | null) => void;
  line: EstimateLine;
  draft: NonNullable<SessionSnapshot['cost']>;
}) {
  return (
    <article className={styles.calculation} aria-label="Selected calculation">
      <h3>{line.label}</h3>
      <div className={styles.quick}>
        {line.targets
          .filter((t) => t.kind !== 'room')
          .map((t) => (
            <button key={targetKey(t)} onClick={() => onInspect(targetKey(t))}>
              Inspect{' '}
              {t.kind === 'surface' ? `${t.surface} surface` : 'furniture'} in
              3D ↗
            </button>
          ))}
      </div>
      <p>{line.rule}</p>
      <dl>
        {(
          [
            ['Installed', line.installed],
            ['Required', line.required],
            ['Purchased', line.purchased],
          ] as const
        ).map(
          ([label, q]) =>
            q && (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{quantity(q)}</dd>
              </div>
            ),
        )}
      </dl>
      <p>{line.quantityStatus} quantities</p>
      {line.notes.map((note) => (
        <p key={note}>{note}</p>
      ))}
      {line.offerIds.map((id) => {
        const offer = draft.offers.find((o) => o.id === id);
        return (
          offer && (
            <p key={id}>
              <strong>{offer.label}</strong> · {offer.variant}
              <br />
              {offer.supplier} · {offer.source.kind} · {offer.source.evidence}
              {offer.source.url && (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={offer.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View source ↗
                  </a>
                </>
              )}
              {offer.source.observedAt !== null && (
                <>
                  {' '}
                  · {offer.source.kind === 'manual'
                    ? 'entered'
                    : 'checked'}{' '}
                  {new Date(offer.source.observedAt).toLocaleDateString(
                    'en-GB',
                  )}
                </>
              )}
            </p>
          )
        );
      })}
    </article>
  );
}
