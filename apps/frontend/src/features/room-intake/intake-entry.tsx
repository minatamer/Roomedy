'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RoomCondition } from '../session/entry/entry-state';
import type { SessionController } from '../session/controller';
import { createGuestSession } from '../session/lifecycle';
import { Editor } from '../room-editor/editor';
import { ReviewController } from './review-controller';
import { Intake } from './intake';
import styles from './intake.module.css';

function Workspace({
  session,
  review,
  condition,
  onBack,
}: {
  session: SessionController;
  review: ReviewController | null;
  condition: RoomCondition;
  onBack: () => void;
}) {
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return state.phase === 'editor' ? (
    <div className={styles.studioTransition}>
      <Editor
        controller={session}
        condition={state.workspace?.current.intent.condition ?? condition}
        source="own"
        onBack={onBack}
      />
    </div>
  ) : state.phase === 'expired' || state.phase === 'disposed' ? (
    <main id="main-content" className={`${styles.intake} ${styles.main}`}>
      <h1>This room has expired.</h1>
      <button onClick={onBack}>Start a new room</button>
    </main>
  ) : review ? (
    <>
      {state.expiresSoon && (
        <p role="status" className={styles.message}>
          This room expires in under five minutes. Finish reviewing to export
          it, or start a new room.
        </p>
      )}
      <Intake controller={review} onBack={onBack} />
    </>
  ) : (
    <p role="status">Choose a new room to continue.</p>
  );
}
export default function IntakeEntry({
  condition,
  onBack,
}: {
  condition: RoomCondition;
  onBack: () => void;
}) {
  const [owned, setOwned] = useState<{
    session: SessionController;
    review: ReviewController | null;
    close: () => void;
  } | null>(null);
  useEffect(() => {
    let live = true,
      pair: typeof owned = null;
    queueMicrotask(() => {
      if (!live) return;
      const guest = createGuestSession(),
        session = guest.session;
      const review =
        session.getSnapshot().phase === 'entry'
          ? new ReviewController(session, condition)
          : null;
      pair = { session, review, close: guest.close };
      setOwned(pair);
    });
    return () => {
      live = false;
      pair?.review?.dispose();
      pair?.close();
    };
  }, [condition]);
  return owned ? (
    <Workspace {...owned} condition={condition} onBack={onBack} />
  ) : (
    <main id="main-content" className={`${styles.intake} ${styles.main}`}>
      <p role="status">Opening your room…</p>
    </main>
  );
}
