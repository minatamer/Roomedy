import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { FormEvent, Ref } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import type { SourcingBrief, SourcingReply } from '@roomedy/contracts/sourcing';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import {
  reviewSourceSize,
  selectOffer,
  sourceOfferSelected,
} from './attach-offer';
import { ChatIcon } from './chat-visuals';
import { SourceCard } from './source-card';
import styles from './workspace.module.css';
export function Research({
  controller,
  state,
  selected,
  onInspect,
  onDesign,
  requestRef,
  open,
  onOpenChange,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  selected: string | null;
  onInspect: (key: string | null) => void;
  onDesign: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestRef?: Ref<
    (key: string, query: string, primer?: boolean) => Promise<void>
  >;
}) {
  const room = state.workspace!.current,
    draft = state.cost!;
  const [choice, setChoice] = useState(''),
    [query, setQuery] = useState(''),
    [primer, setPrimer] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [found, setFound] = useState<{
    brief: SourcingBrief;
    reply: SourcingReply;
    roomRevision: number;
    costRevision: number;
    simulation: boolean;
  } | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const task = useRef<ReturnType<typeof beginResearch>>(null),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      task.current?.cancel();
    };
  }, []);
  const requested = choice || selected || 'surface:floor';
  const key = buildSourcingBrief(room, requested) ? requested : 'surface:floor';
  const fresh =
    found &&
    found.roomRevision === room.roomRevision &&
    found.costRevision === draft.revision;
  const start = useCallback(
    async (requestedKey: string, preferences: string, usePrimer = false) => {
      onOpenChange(true);
      if (task.current) return;
      const current = controller.getSnapshot();
      if (!current.workspace) return;
      const brief = buildSourcingBrief(
        current.workspace.current,
        requestedKey,
        preferences,
        usePrimer,
      );
      if (!brief) {
        setMessage(
          'Review the selected item’s measurements and keep preferences within 240 characters before researching.',
        );
        return;
      }
      const running = beginResearch(controller, brief);
      if (!running) {
        setMessage('Resolve the current preview before starting research.');
        return;
      }
      task.current = running;
      setChoice(requestedKey);
      setQuery(preferences);
      setPrimer(usePrimer);
      setFound(null);
      setBusy(true);
      setMessage('Finding options…');
      const answer = await running.result;
      if (!live.current || task.current !== running) return;
      task.current = null;
      setBusy(false);
      if (!answer.ok) {
        setMessage(answer.message);
        return;
      }
      setFound({
        brief,
        reply: answer.reply,
        roomRevision: answer.input.identity.inputRevision,
        costRevision: answer.input.costRevision,
        simulation: answer.simulation,
      });
      setMessage(
        answer.reply.candidates.length
          ? ''
          : 'No suitable priced match was found. You can enter a manual allowance.',
      );
    },
    [controller, onOpenChange],
  );
  useImperativeHandle(requestRef, () => start, [start]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void start(key, query, primer);
  };
  return (
    <section
      className={styles.research}
      aria-label="Find real products and services"
      hidden={!open && !found && !busy && !message}
    >
      <details
        open={open}
        onToggle={(event) => onOpenChange(event.currentTarget.open)}
        className={styles.researchForm}
      >
        <summary>
          <ChatIcon kind="search" /> Find products &amp; services
        </summary>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className={styles.form}
        >
          <div className={styles.fields}>
            <label>
              Research for
              <select
                value={key}
                onChange={(event) => {
                  setChoice(event.target.value);
                  setPrimer(false);
                }}
              >
                <option value="surface:floor">Flooring</option>
                {(['north', 'east', 'south', 'west'] as const).map((wall) => (
                  <option key={wall} value={`surface:${wall}`}>
                    {wall} wall
                  </option>
                ))}
                {room.furniture.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.label}
                  </option>
                ))}
                {draft.settings.services.map((service) => (
                  <option
                    key={service.scope}
                    value={`service:${service.scope}`}
                  >
                    {service.scope.replaceAll('-', ' ')} service
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferences · optional
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={240}
                placeholder="e.g. washable, warm white, local delivery"
              />
            </label>
            {key.startsWith('surface:') && key !== 'surface:floor' && (
              <label>
                Paint system
                <select
                  value={primer ? 'primer' : 'paint'}
                  onChange={(event) =>
                    setPrimer(event.target.value === 'primer')
                  }
                >
                  <option value="paint">Topcoat paint</option>
                  <option value="primer">Primer</option>
                </select>
              </label>
            )}
          </div>
          <details className={styles.evidenceInfo}>
            <summary>What’s shared with AI?</summary>
            <p>
              This item’s dimensions and finish, your city/country/currency and
              these preferences. Review source pages before ordering.
            </p>
          </details>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primary}
              disabled={busy || !!state.candidate}
            >
              {busy ? 'Researching…' : 'Research options'}
            </button>
            {busy && (
              <button type="button" onClick={() => task.current?.cancel()}>
                Cancel research
              </button>
            )}
          </div>
        </form>
      </details>
      <p role="status" ref={statusRef} tabIndex={-1}>
        {message}
      </p>
      {message.includes('in Design') &&
        found?.brief.target.kind === 'furniture' && (
          <button type="button" onClick={onDesign}>
            Review this piece in Design ↗
          </button>
        )}
      {found && (
        <>
          {(found.simulation || !fresh) && (
            <p className={styles.note}>
              {found.simulation
                ? 'Example options · discovery links, not verified prices.'
                : ''}
              {!fresh && ' Earlier estimate · research again to select.'}
            </p>
          )}
          <div className={styles.sourceCards}>
            {found.reply.candidates.map((candidate, index) => (
              <SourceCard
                key={`${candidate.url}:${index}`}
                candidate={candidate}
                simulation={found.simulation}
                selected={
                  !!candidate.offer &&
                  sourceOfferSelected(draft, found.brief, candidate.offer.id)
                }
                disabled={!fresh || busy || !!state.candidate}
                onInspect={() =>
                  onInspect(
                    found.brief.target.kind === 'furniture'
                      ? found.brief.target.id
                      : found.brief.target.kind === 'surface'
                        ? `surface:${found.brief.target.surface}`
                        : null,
                  )
                }
                onSelect={() => {
                  if (!fresh) return;
                  const applied = selectOffer(
                    controller,
                    found.brief,
                    candidate,
                    found.costRevision,
                    found.roomRevision,
                  );
                  if (applied.ok) {
                    setFound({
                      ...found,
                      costRevision: controller.getSnapshot().cost!.revision,
                    });
                    requestAnimationFrame(() =>
                      statusRef.current?.focus({ preventScroll: true }),
                    );
                  }
                  setMessage(
                    applied.ok
                      ? 'Price selected. Unresolved extras stay in the breakdown.'
                      : applied.reason,
                  );
                }}
                onReview={() => {
                  if (!fresh) return;
                  const result = reviewSourceSize(
                    controller,
                    found.brief,
                    candidate,
                    found.costRevision,
                    found.roomRevision,
                  );
                  setMessage(
                    result.ok
                      ? 'Preview ready · review the room and costs before Apply.'
                      : result.reason,
                  );
                  if (result.ok)
                    onInspect(
                      found.brief.target.kind === 'furniture'
                        ? found.brief.target.id
                        : null,
                    );
                }}
              />
            ))}
          </div>
          {!!found.reply.notes.length && (
            <details className={styles.sourceEvidence}>
              <summary>Research notes</summary>
              {found.reply.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </details>
          )}
        </>
      )}
    </section>
  );
}
