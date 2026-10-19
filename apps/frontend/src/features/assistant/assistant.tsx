import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { AssistantReply } from '@roomedy/contracts/assistant';
import type { SessionSnapshot } from '../session/state';
import { thumbnailUrl } from '../catalogue/catalogue';
import { focusProperties } from '../room-editor/focus';
import { issueText } from '../room-editor/messages';
import type { AssistantController } from './controller';
import { AssistantTour } from './tour';
import styles from './assistant.module.css';

export function Assistant({
  controller,
  roomState,
}: {
  controller: AssistantController;
  roomState: SessionSnapshot;
}) {
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    end = useRef<HTMLDivElement>(null);
  const [goalsOpen, setGoalsOpen] = useState(() => state.messages.length === 0);
  const session = controller.session,
    room = roomState.workspace!.current,
    preview = roomState.candidate;
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.length, state.busy]);
  const focus = (id: string, question: AssistantReply['question'] = null) => {
    if (question) session.cancelPreview();
    if (id === room.roomId) session.setPanel('room');
    else session.select(id);
    focusProperties(session, id === room.roomId ? undefined : id);
    if (question)
      requestAnimationFrame(() => {
        const words: Record<string, string> = {
          width: 'width',
          depth: 'depth',
          height: 'height',
          wall: 'wall',
          offset: 'distance along',
          sill: 'height above',
          mechanism: 'mechanism',
          hinge: 'hinge',
        };
        const label = [
          ...document.querySelectorAll<HTMLLabelElement>(
            'aside[aria-label="Room properties"] label',
          ),
        ].find((l) =>
          l.textContent
            ?.toLowerCase()
            .includes(words[question.field] ?? question.field),
        );
        const target =
          label?.querySelector<HTMLElement>('input,select') ??
          (label?.htmlFor ? document.getElementById(label.htmlFor) : null);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
  };
  const send = (text: string) => {
    setGoalsOpen(false);
    void controller.submit(text);
  };
  const submit = () => {
    setGoalsOpen(false);
    void controller.submit();
  };
  const goalOptions = (
    <details
      className={styles.goalOptions}
      open={goalsOpen}
      onToggle={(e) => setGoalsOpen(e.currentTarget.open)}
    >
      <summary>Room goals & finishes</summary>
      <div className={styles.goals} aria-label="Room goals">
        {room.furniture.some(
          (p) =>
            findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
            'desk',
        ) &&
          room.room.features.some((f) => f.kind === 'window') && (
            <button onClick={() => send('Move the work area near the window')}>
              Work area by window
            </button>
          )}
        {room.furniture.some((p) => p.ownership === 'owned') ? (
          <button onClick={() => send('Rearrange what I own')}>
            Rearrange what I own
          </button>
        ) : (
          <button
            onClick={() => send('I need a bed, desk, chair and wardrobe')}
          >
            Furnish with essentials
          </button>
        )}
        <button onClick={() => send('Explain the room checks')}>
          Explain checks
        </button>
      </div>
      <div className={styles.finishes} aria-label="Finish directions">
        {['Warm & simple', 'Light & airy', 'Calm & focused'].map((label) => (
          <button
            key={label}
            onClick={() => send('Preview ' + label + ' room palette')}
          >
            {label}
          </button>
        ))}
      </div>
    </details>
  );
  return (
    <section className={styles.assistant} aria-label="Roomedy assistant">
      <div className={styles.heading}>
        <h2 tabIndex={-1}>Roomedy assistant</h2>
        <AssistantTour />
      </div>
      {state.mode !== 'fake' && (
        <p className={styles.mode}>
          {state.mode === 'live'
            ? 'Send shares this room and your message with the AI provider.'
            : state.mode === 'loading'
              ? 'Checking assistant availability…'
              : 'Assistant unavailable · manual editing is ready'}
        </p>
      )}
      <div
        className={styles.messages}
        role="log"
        aria-label="Room conversation"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {state.messages.length > 0 && goalOptions}
        {!state.messages.length && (
          <div className={styles.welcome}>{goalOptions}</div>
        )}
        {state.messages.map((message) => {
          const reply = message.reply,
            active =
              preview?.source === 'assistant' &&
              preview.identity.operationId === message.operationId;
          const shown = active ? preview.room : room;
          return (
            <article
              key={message.id}
              className={message.role === 'user' ? styles.user : styles.reply}
              aria-label={
                message.role === 'user' ? 'Your request' : 'Assistant response'
              }
            >
              <p>{message.text}</p>
              {!!reply?.suggestions?.length && (
                <div
                  className={styles.goals}
                  aria-label="Clarify your design goal"
                >
                  {reply.suggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      disabled={
                        roomState.comparison !== 'current' ||
                        state.busy ||
                        state.messages.at(-1)?.id !== message.id ||
                        suggestion.roomRevision !== room.roomRevision
                      }
                      onClick={() =>
                        controller.chooseSuggestion(message.id, suggestion)
                      }
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
              {reply?.kind === 'proposal' && active && (
                <p className={styles.note}>Preview</p>
              )}
              {!!reply?.objectIds.length && (
                <div className={styles.cards}>
                  {reply.objectIds.map((id) => {
                    const piece = shown.furniture.find((p) => p.id === id),
                      feature = shown.room.features.find((f) => f.id === id);
                    if (id !== room.roomId && !piece && !feature) return null;
                    return (
                      <button
                        className={styles.objectCard}
                        key={id}
                        onClick={() => focus(id)}
                      >
                        {piece && (
                          <Image
                            src={thumbnailUrl(
                              findCatalogueEntry(
                                piece.catalogueId,
                                piece.catalogueVersion,
                              )!,
                            )}
                            width={58}
                            height={48}
                            alt=""
                            unoptimized
                          />
                        )}
                        <span>
                          <strong>
                            {piece?.label ?? feature?.kind ?? 'Room'}
                          </strong>
                          {piece && (
                            <small>
                              {piece.dimensions.width.value ?? '?'} ×{' '}
                              {piece.dimensions.depth.value ?? '?'} mm ·{' '}
                              {piece.ownership === 'owned'
                                ? 'Owned'
                                : 'Proposed'}
                            </small>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!!reply?.catalogueIds.length && (
                <div className={styles.cards}>
                  {reply.catalogueIds.map((id) => {
                    const item = findCatalogueEntry(id, VERSIONS.catalogue);
                    if (!item) return null;
                    return (
                      <button
                        key={id}
                        className={styles.objectCard}
                        onClick={() => {
                          session.setPanel('catalogue');
                          focusProperties(session);
                        }}
                      >
                        <Image
                          src={thumbnailUrl(item)}
                          width={58}
                          height={48}
                          alt=""
                          unoptimized
                        />
                        <span>
                          <strong>{item.label}</strong>
                          <small>
                            {item.size.width.min}–{item.size.width.max} ×{' '}
                            {item.size.depth.min}–{item.size.depth.max} mm
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {reply?.question && (
                <button
                  onClick={() => focus(reply.question!.id, reply.question)}
                >
                  Review {reply.question.field}
                </button>
              )}
              {(reply?.control === 'position-lock' ||
                reply?.control === 'rotation-lock') &&
                reply.objectIds[0] && (
                  <button onClick={() => focus(reply.objectIds[0]!)}>
                    Review{' '}
                    {reply.control === 'position-lock'
                      ? 'position'
                      : 'rotation'}{' '}
                    lock
                  </button>
                )}
              {(reply?.control === 'dimensions-lock' ||
                reply?.control === 'preference') &&
                reply.objectIds[0] && (
                  <button onClick={() => focus(reply.objectIds[0]!)}>
                    Review{' '}
                    {reply.control === 'preference'
                      ? 'Keep / May replace'
                      : 'dimensions lock'}
                  </button>
                )}
              {reply?.control === 'undo' && (
                <button
                  disabled={!roomState.undoLabel}
                  onClick={() => controller.undo()}
                >
                  Undo {roomState.undoLabel ?? 'last change'}
                </button>
              )}
              {reply?.blockedIssue && (
                <button
                  className={styles.issue}
                  onClick={() => {
                    const ids = reply.blockedIssue!.objectIds,
                      id =
                        ids.find((id) =>
                          room.room.features.some((f) => f.id === id),
                        ) ??
                        ids.find((id) =>
                          room.furniture.some((p) => p.id === id),
                        );
                    if (id) focus(id);
                  }}
                >
                  Proposed change blocked: {issueText(reply.blockedIssue)}
                  {reply.blockedIssue.deficitMm === null
                    ? ''
                    : ` · ${reply.blockedIssue.deficitMm} mm deficit`}
                </button>
              )}
              {reply &&
                reply.kind === 'explanation' &&
                reply.checks.issues.slice(0, 3).map((issue) => (
                  <button
                    key={issue.id}
                    className={styles.issue}
                    onClick={() => {
                      const id = issue.objectIds.find(
                        (id) =>
                          room.furniture.some((p) => p.id === id) ||
                          room.room.features.some((f) => f.id === id),
                      );
                      if (id) focus(id);
                      else {
                        session.setPanel('checks');
                        focusProperties(session);
                      }
                    }}
                  >
                    {issueText(issue)}
                    {issue.deficitMm === null
                      ? ''
                      : ` · ${issue.deficitMm} mm deficit`}
                  </button>
                ))}
            </article>
          );
        })}
        {state.busy && (
          <div className={styles.progress} role="status">
            <span aria-hidden="true" />
            {state.stage === 'search'
              ? 'Exploring the room…'
              : 'Preparing a response…'}
            <button onClick={() => controller.cancel()}>Cancel request</button>
          </div>
        )}
        <div ref={end} />
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="roomedy-message">Ask Roomedy</label>
        <textarea
          id="roomedy-message"
          rows={3}
          value={state.draft}
          maxLength={POLICY.visitorTextChars}
          placeholder="Move my desk near the window…"
          onChange={(e) => controller.draft(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div>
          <small>Enter to send · Shift+Enter for a new line</small>
          <button
            type="submit"
            disabled={!state.draft.trim()}
            aria-label="Send message"
          >
            Send ↗
          </button>
        </div>
      </form>
    </section>
  );
}
