'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RoomCondition } from '../session/entry/entry-state';
import { SessionController } from '../session/controller';
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
  review: ReviewController;
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
      <h1>This room session has expired.</h1>
      <p>Selected photos and the unfinished sketch have been cleared.</p>
      <button onClick={onBack}>Start a new room</button>
    </main>
  ) : (
    <Intake controller={review} onBack={onBack} />
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
    review: ReviewController;
  } | null>(null);
  useEffect(() => {
    let live = true,
      pair: typeof owned = null;
    queueMicrotask(() => {
      if (!live) return;
      const session = new SessionController();
      const review = new ReviewController(session, condition);
      session.startTimer();
      pair = { session, review };
      setOwned(pair);
    });
    return () => {
      live = false;
      pair?.review.dispose();
      pair?.session.dispose();
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
