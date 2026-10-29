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
import type { SourcingBrief, SourcingReply } from '@roomedy/contracts/sourcing';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import {
  reviewSourceSize,
  selectOffer,
  sourceOfferSelected,
  sourceSizeNeedsReview,
} from './attach-offer';
import { SourceCard } from './source-card';
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
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onInspect: (key: string | null) => void;
  onDesign: () => void;
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
  const [found, setFound] = useState<{
    brief: SourcingBrief;
    reply: SourcingReply;
    roomRevision: number;
    costRevision: number;
    simulation: boolean;
    matchingWalls: boolean;
  } | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null),
    task = useRef<ReturnType<typeof beginResearch>>(null),
    live = useRef(true),
    sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      task.current?.cancel();
    };
  }, []);
  useEffect(() => {
    if (state.destination === 'cost') return;
    const running = task.current;
    if (running) {
      running.cancel();
      task.current = null;
    }
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (running)
        setMessage('Search cancelled. Choose Find options when you’re ready.');
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [state.destination]);
  const fresh =
    found &&
    found.roomRevision === room.roomRevision &&
    found.costRevision === draft.revision;
  useEffect(() => {
    if (!found && !busy) return;
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
  }, [found, busy]);
  const start = useCallback(
    async (
      requestedKey: string,
      preferences: string,
      usePrimer = false,
      matchingWalls = false,
    ) => {
      if (task.current) return;
      const current = controller.getSnapshot();
      if (!current.workspace || current.destination !== 'cost') return;
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
      const running = beginResearch(controller, brief);
      if (!running) {
        setMessage('Resolve the current preview before starting research.');
        return;
      }
      task.current = running;
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
        matchingWalls,
      });
      setMessage(
        answer.reply.candidates.length
          ? ''
          : 'No suitable priced match was found. Try another product or store.',
      );
    },
    [controller],
  );
  useImperativeHandle(requestRef, () => start, [start]);
  if (busy)
    return <ResearchProgress sectionRef={sectionRef} statusRef={statusRef} />;
  if (!message && !found) return null;
  return (
    <section
      ref={sectionRef}
      className={styles.research}
      aria-label="Product options"
    >
      <p role="status" ref={statusRef} tabIndex={-1}>
        {found && !fresh ? '' : message}
      </p>
      {message.includes('in Design') &&
        found?.brief.target.kind === 'furniture' && (
          <button onClick={onDesign}>Review this piece in Design ↗</button>
        )}
      {found && (
        <>
          <h3>Options for {found.brief.label}</h3>
          {(found.simulation || !fresh) && (
            <p className={styles.note}>
              {found.simulation
                ? 'Example options · illustrative prices, not live store quotes.'
                : ''}
              {!fresh && ' Earlier estimate · find options again to select.'}
            </p>
          )}
          <div className={styles.sourceCards}>
            {found.reply.candidates.map((candidate, index) => (
              <SourceCard
                key={`${candidate.url}:${index}`}
                candidate={candidate}
                simulation={found.simulation}
                matchingWalls={found.matchingWalls}
                selected={
                  !!candidate.offer &&
                  sourceOfferSelected(draft, found.brief, candidate.offer.id)
                }
                disabled={!fresh || busy || !!state.candidate}
                needsSizeReview={sourceSizeNeedsReview(
                  found.brief,
                  candidate.offer,
                )}
                onSelect={() => {
                  if (!fresh) return;
                  const applied = selectOffer(
                    controller,
                    found.brief,
                    candidate,
                    found.costRevision,
                    found.roomRevision,
                    found.matchingWalls,
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
          <button
            className="glass-control"
            disabled={busy || !!state.candidate}
            onClick={() =>
              void start(
                found.brief.target.kind === 'furniture'
                  ? found.brief.target.id
                  : found.brief.target.kind === 'surface'
                    ? `surface:${found.brief.target.surface}`
                    : `service:${found.brief.target.scope}`,
                `${found.brief.query} Find different products or merchants.`
                  .trim()
                  .slice(0, 240),
                found.brief.kind === 'primer',
                found.matchingWalls,
              )
            }
          >
            Find more options
          </button>
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
