import { furnitureAppearanceSwatches } from '@roomedy/contracts/furniture-materials';
import { featureLabel } from '@roomedy/spatial';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { SessionSnapshot } from '../session/state';
import { thumbnailUrl } from '../catalogue/catalogue';
import { focusProperties } from '../room-editor/focus';
import { failureMessage, issueText } from '../room-editor/messages';
import { PreviewChangeList } from '../room-editor/preview-change-list';
import type { AssistantController } from './controller';
import { MedyIcon } from './medy-icon';
import { ThinkingStatus } from './thinking-status';
import { ChatIcon } from './chat-icon';
import { SurfacePreview } from './surface-preview';
import { FINISH_COLORS } from '@roomedy/contracts/surfaces';
import { guidanceChoices, guidanceMessage } from './guidance';
import { RevealedText } from './revealed-text';
import styles from './assistant.module.css';

export function Assistant({
  controller,
  roomState,
  tourActive,
}: {
  controller: AssistantController;
  roomState: SessionSnapshot;
  tourActive: boolean;
}) {
  const state = useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    ),
    end = useRef<HTMLDivElement>(null),
    proposalActions = useRef<HTMLDivElement>(null),
    composer = useRef<HTMLTextAreaElement>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const session = controller.session,
    room = roomState.workspace!.current,
    preview = roomState.candidate;
  useEffect(() => {
    if (state.messages.length > 0)
      end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.length, state.busy]);
  const previewOperation =
    preview?.source === 'assistant' ? preview.identity.operationId : null;
  useEffect(() => {
    if (!previewOperation) return;
    const target = proposalActions.current;
    target
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [previewOperation, state.messages.length]);
  const focusComposer = () =>
    requestAnimationFrame(() =>
      composer.current?.focus({ preventScroll: true }),
    );
  const focus = (id: string) => {
    if (id === room.roomId) session.setPanel('room');
    else session.select(id);
    focusProperties(session, id === room.roomId ? undefined : id);
  };
  const submit = () => void controller.submit();
  const latest = state.messages.at(-1),
    replyId = latest ? (latest.role === 'assistant' ? latest.id : null) : 0,
    guidance = latest?.guidance?.step ?? (!latest ? 'welcome' : null),
    options =
      preview?.source === 'assistant'
        ? []
        : guidance
          ? guidanceChoices(guidance, room, state.tourSeen)
          : latest?.role === 'assistant'
            ? latest.quickReplies
            : [],
    repliesReady =
      replyId !== null && revealedId === replyId && !tourActive && !state.busy;
  return (
    <section
      className={styles.assistant}
      data-room-target="assistant"
      aria-label="Medy room assistant"
    >
      <div className={styles.heading}>
        <h2 tabIndex={-1}>
          <span className={styles.name}>
            <MedyIcon />
            Medy
          </span>
        </h2>
        {state.mode === 'live' && (
          <details className={styles.privacy}>
            <summary aria-label="AI privacy information">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v6m0-10h.01" />
              </svg>
            </summary>
            <p>Send shares this room and your message with the AI provider.</p>
          </details>
        )}
      </div>
      {state.mode !== 'fake' && state.mode !== 'live' && (
        <p className={styles.mode}>
          {state.mode === 'loading'
            ? 'Checking assistant availability…'
            : 'Assistant unavailable · manual editing is ready'}
        </p>
      )}
      <div
        className={styles.messages}
        role="log"
        tabIndex={0}
        aria-label="Room conversation"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {!state.messages.length && (
          <div className={styles.welcome}>
            <RevealedText
              id={0}
              text={guidanceMessage('welcome', room)}
              ledger={controller.reveal}
              enabled={!tourActive}
              onComplete={setRevealedId}
            />
          </div>
        )}
        {state.messages.map((message) => {
          const reply = message.reply,
            active =
              preview?.source === 'assistant' &&
              preview.identity.operationId === message.operationId;
          const shown = active ? preview.room : room;
          const visualReply =
            reply?.kind === 'proposal' ||
            (reply?.kind === 'explanation' &&
              (!!reply.objectIds.length ||
                !!reply.catalogueIds.length ||
                !!reply.checks.issues.length));
          const prose =
            message.role === 'assistant' &&
            state.messages.at(-1)?.id === message.id ? (
              <RevealedText
                id={message.id}
                text={message.text}
                ledger={controller.reveal}
                enabled={!tourActive}
                onComplete={setRevealedId}
              />
            ) : (
              <p>{message.text}</p>
            );
          return (
            <article
              key={message.id}
              className={message.role === 'user' ? styles.user : styles.reply}
              aria-label={
                message.role === 'user' ? 'Your request' : 'Medy response'
              }
            >
              {visualReply ? (
                <details className={styles.responseNotes}>
                  <summary>
                    {active ? 'Why this change?' : 'Medy’s notes'}
                  </summary>
                  {prose}
                </details>
              ) : (
                prose
              )}
              {reply?.kind === 'proposal' && active && (
                <p className={styles.note}>Preview</p>
              )}
              {active && (
                <SurfacePreview current={room} proposed={preview.room} />
              )}
              {!!reply?.objectIds.length && (
                <div className={styles.cards}>
                  {reply.objectIds.map((id) => {
                    const piece = shown.furniture.find((p) => p.id === id),
                      before = room.furniture.find((p) => p.id === id),
                      feature = shown.room.features.find((f) => f.id === id);
                    if (id !== room.roomId && !piece && !feature) return null;
                    const swatches =
                      active && piece && before
                        ? furnitureAppearanceSwatches(
                            before,
                            piece,
                            findCatalogueEntry(
                              piece.catalogueId,
                              piece.catalogueVersion,
                            )?.category ?? 'storage',
                          )
                        : null;
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
                            {piece?.label ??
                              (feature ? featureLabel(feature) : 'Room')}
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
                          {active &&
                            piece &&
                            before &&
                            (before.finish !== piece.finish ||
                              JSON.stringify(before.materials) !==
                                JSON.stringify(piece.materials)) && (
                              <span className={styles.finishChange}>
                                <i
                                  style={{
                                    background:
                                      swatches?.before ??
                                      FINISH_COLORS[before.finish],
                                  }}
                                />{' '}
                                →{' '}
                                <i
                                  style={{
                                    background:
                                      swatches?.after ??
                                      FINISH_COLORS[piece.finish],
                                  }}
                                />
                                <small>
                                  {before.finish !== piece.finish
                                    ? `${piece.finish} preview`
                                    : 'Material preview'}
                                </small>
                              </span>
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
              {reply?.blockedIssue &&
                reply.blockedIssue.severity !== 'unassessed' && (
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
                message.operationId !== null &&
                reply.kind === 'explanation' &&
                reply.checks.issues
                  .filter((issue) => issue.severity !== 'unassessed')
                  .slice(0, 3)
                  .map((issue) => (
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
              {reply?.kind === 'proposal' && active && (
                <>
                  <details className={styles.responseNotes}>
                    <summary>Review every change</summary>
                    <PreviewChangeList
                      current={room}
                      proposed={preview.room}
                      className={styles.changeList}
                    />
                  </details>
                  <div
                    ref={proposalActions}
                    className={styles.proposalActions}
                    data-room-target="preview"
                    role="group"
                    aria-label="Proposed changes"
                  >
                    <button
                      className={styles.applyProposal}
                      aria-label="Apply proposed changes"
                      onClick={() => {
                        const result = controller.apply(message.operationId!);
                        if (result.ok) focusComposer();
                        else session.notify(failureMessage(result, room));
                      }}
                    >
                      Apply changes
                    </button>
                    <button
                      onClick={() => {
                        if (controller.cancel(message.operationId!))
                          focusComposer();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
        {state.busy && <ThinkingStatus />}
        <div ref={end} />
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!!options.length && (
          <div
            className={styles.quickReplies}
            data-ready={repliesReady || undefined}
            inert={!repliesReady}
            aria-hidden={!repliesReady || undefined}
            style={{ visibility: repliesReady ? 'visible' : 'hidden' }}
          >
            <div
              className={styles.goals}
              role="group"
              aria-label="Quick replies"
            >
              {options.map((option) => (
                <button
                  type="button"
                  className="glass-control"
                  key={option.label}
                  disabled={
                    !repliesReady ||
                    roomState.comparison !== 'current' ||
                    (latest?.guidance
                      ? latest.guidance.roomRevision !== room.roomRevision
                      : 'roomRevision' in option &&
                        option.roomRevision !== room.roomRevision)
                  }
                  onClick={() => {
                    if ('id' in option && replyId !== null)
                      controller.chooseGuidance(replyId, option.id);
                    else if (
                      latest &&
                      'request' in option &&
                      'roomRevision' in option
                    )
                      controller.chooseSuggestion(latest.id, option);
                    focusComposer();
                  }}
                >
                  {'id' in option && (
                    <span className={styles.choiceVisual} aria-hidden="true">
                      {guidance === 'finishes' ? (
                        <span className={styles.paletteSwatches}>
                          {(
                            option.colors ??
                            (option.id === 'Warm & simple'
                              ? ['clay', 'oak']
                              : option.id === 'Light & airy'
                                ? ['ivory', 'oak']
                                : ['ivory', 'walnut'])
                          ).map((finish) => (
                            <i
                              key={finish}
                              style={{
                                background: finish.startsWith('#')
                                  ? finish
                                  : FINISH_COLORS[
                                      finish as keyof typeof FINISH_COLORS
                                    ],
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <ChatIcon
                          kind={
                            option.id === 'talk'
                              ? 'talk'
                              : option.id === 'finishes'
                                ? 'walls'
                                : option.id === 'checks'
                                  ? 'work'
                                  : 'room'
                          }
                        />
                      )}
                    </span>
                  )}
                  <span className={styles.choiceLabel}>{option.label}</span>
                  <ChoiceArrow />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={styles.composerBox}>
          <textarea
            ref={composer}
            id="roomedy-message"
            aria-label="Ask Medy"
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
          <button
            className={styles.sendButton}
            type="submit"
            disabled={!state.draft.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 19V5m-5 5 5-5 5 5" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}

function ChoiceArrow() {
  return (
    <span className={styles.choiceArrow} aria-hidden="true">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </svg>
    </span>
  );
}
