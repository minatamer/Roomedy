'use client';
import { useEffect, useRef, useState } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import { RoomDiorama } from './room-diorama';

type Stage = 'original' | 'preview' | 'applied' | 'undone';
const words: Record<Stage, string> = {
  original: 'A little more room to work.',
  preview: 'Preview the desk and chair move.',
  applied: 'One change. Applied together.',
  undone: 'Back to where you started.',
};
export function RoomStory({ room }: { room: RoomDocument }) {
  const [stage, setStage] = useState<Stage>('original');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => {
    timers.current = [
      setTimeout(() => setStage('preview'), 650),
      setTimeout(() => setStage('applied'), 1850),
      setTimeout(() => setStage('undone'), 3350),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);
  const choose = (next: Stage) => {
    clear();
    setStage(next);
  };
  return (
    <div className="story-card">
      <div className="story-topline">
        <span className="story-label">Scripted example</span>
        <span>BEDROOM + WORKSPACE</span>
      </div>
      <RoomDiorama room={room} stage={stage} />
      <div className="assistant-note">
        <span className="assistant-kicker">
          <span aria-hidden="true">✦</span> Roomedy assistant
        </span>
        <p>“Bring my desk closer to the window.”</p>
      </div>
      <div className="story-bottom">
        <p aria-live="polite">{words[stage]}</p>
        <div className="story-actions" aria-label="Scripted room example">
          <button
            onClick={() => choose('preview')}
            aria-pressed={stage === 'preview'}
          >
            Preview
          </button>
          <button
            onClick={() => choose('applied')}
            disabled={stage !== 'preview'}
          >
            Apply
          </button>
          <button
            onClick={() => choose('undone')}
            disabled={stage !== 'applied'}
          >
            Undo <span aria-hidden="true">↶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
