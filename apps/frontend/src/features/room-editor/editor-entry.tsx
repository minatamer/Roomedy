'use client';
import { useEffect, useState } from 'react';
import type { RoomCondition } from '../session/entry/entry-state';
import { createRoomFixture } from '../session/fixtures/rooms';
import type { SessionController } from '../session/controller';
import { createGuestSession } from '../session/lifecycle';
import { RecoveryChoice } from '../session/entry/recovery-choice';
import { Editor } from './editor';

export default function EditorEntry({
  condition,
  fresh = false,
  onBack,
}: {
  condition: RoomCondition;
  fresh?: boolean;
  onBack: () => void;
}) {
  const [needsChoice, setNeedsChoice] = useState(false);
  const [controller, setController] = useState<SessionController | null>(null);
  useEffect(() => {
    let live = true;
    let owned: ReturnType<typeof createGuestSession> | undefined;
    // Client-only resource initialization. An unmounted/StrictMode setup cannot publish a session.
    queueMicrotask(() => {
      if (!live) return;
      owned = createGuestSession(
        createRoomFixture(condition === 'furnished' ? 'sample' : condition),
      );
      setNeedsChoice(fresh && owned.session.getSnapshot().recovered);
      setController(owned.session);
    });
    return () => {
      live = false;
      owned?.close();
    };
  }, [condition, fresh]);
  if (controller && needsChoice)
    return (
      <RecoveryChoice
        photos={false}
        onContinue={() => setNeedsChoice(false)}
        onStart={() => {
          controller.reset(
            createRoomFixture(condition === 'furnished' ? 'sample' : condition),
          );
          setNeedsChoice(false);
        }}
      />
    );
  return controller ? (
    <Editor controller={controller} onBack={onBack} condition={condition} />
  ) : (
    <main id="main-content">
      <p role="status">Opening your room…</p>
    </main>
  );
}
