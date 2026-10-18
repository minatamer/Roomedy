'use client';
import { useEffect, useState } from 'react';
import type { RoomCondition } from '../session/entry/entry-state';
import { createRoomFixture } from '../session/fixtures/rooms';
import { SessionController } from '../session/controller';
import { Editor } from './editor';

export default function EditorEntry({
  condition,
  onBack,
}: {
  condition: RoomCondition;
  onBack: () => void;
}) {
  const [controller, setController] = useState<SessionController | null>(null);
  useEffect(() => {
    let live = true;
    let owned: SessionController | undefined;
    // Client-only resource initialization. An unmounted/StrictMode setup cannot publish a session.
    queueMicrotask(() => {
      if (!live) return;
      owned = new SessionController(
        createRoomFixture(condition === 'furnished' ? 'sample' : condition),
      );
      owned.startTimer();
      setController(owned);
    });
    return () => {
      live = false;
      owned?.dispose();
    };
  }, [condition]);
  return controller ? (
    <Editor controller={controller} onBack={onBack} condition={condition} />
  ) : (
    <main id="main-content">
      <p role="status">Opening your room…</p>
    </main>
  );
}
