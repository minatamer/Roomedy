'use client';
import { useEffect, useReducer, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSurfaceMotion } from '../../room-editor/use-surface-motion';
import { Brand } from '../../landing/brand';
import { entryHref, entryReducer } from './entry-state';
import type { EntryState, RoomCondition } from './entry-state';
const EditorEntry = dynamic(() => import('../../room-editor/editor-entry'), {
  ssr: false,
  loading: () => (
    <main id="main-content">
      <p role="status">Opening your room…</p>
    </main>
  ),
});
const IntakeEntry = dynamic(() => import('../../room-intake/intake-entry'), {
  ssr: false,
  loading: () => (
    <main id="main-content">
      <p role="status">Opening your room…</p>
    </main>
  ),
});
const conditions: readonly {
  id: RoomCondition;
  title: string;
  copy: string;
  icon: string;
}[] = [
  {
    id: 'empty',
    title: 'An empty room',
    copy: 'A blank canvas for your essentials.',
    icon: '□',
  },
  {
    id: 'partial',
    title: 'A few pieces',
    copy: 'Keep what works. Fill in the rest.',
    icon: '▥',
  },
  {
    id: 'furnished',
    title: 'Already furnished',
    copy: 'Find a fresh arrangement for what’s there.',
    icon: '▦',
  },
];
export function GuestEntry({ initial }: { initial: EntryState }) {
  const [state, dispatch] = useReducer(entryReducer, initial);
  const motion = useSurfaceMotion(state.step);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
    window.history.replaceState(null, '', entryHref(state));
  }, [state]);
  if (state.step === 'ready')
    return state.intent.source === 'sample' ? (
      <EditorEntry
        condition={state.intent.condition}
        onBack={() => dispatch({ type: 'back' })}
      />
    ) : (
      <IntakeEntry
        condition={state.intent.condition}
        onBack={() => dispatch({ type: 'back' })}
      />
    );

  const title =
    state.step === 'source'
      ? 'Let’s make a little room.'
      : 'What are we starting with?';
  return (
    <>
      <header className="site-header shell">
        <Brand />
        <Link href="/" className="text-link">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="main-content" className="entry-main shell">
        <div ref={motion} className="motion-surface">
          <div className="motion-flow entry-layout">
            <div className="entry-heading">
              {state.step !== 'source' && (
                <button
                  className="back-button"
                  onClick={() => dispatch({ type: 'back' })}
                >
                  ← Back
                </button>
              )}
              <p className="eyebrow">YOUR SPACE, A FRESH PERSPECTIVE</p>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>
                {state.step === 'source'
                  ? 'Explore a sample or start with your room.'
                  : state.step === 'condition'
                    ? 'Choose the starting point that feels closest.'
                    : 'Photos become a rough 2D sketch for you to review before the main editor.'}
              </p>
            </div>
            {state.step === 'source' ? (
              <div className="entry-options source-options">
                <button
                  className="choice-card"
                  onClick={() => dispatch({ type: 'source', source: 'sample' })}
                >
                  <span className="choice-art sample-art" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="choice-title">
                    Use a sample room <span>↗</span>
                  </span>
                  <span className="choice-copy">
                    Start with a room you can edit right away.
                  </span>
                </button>
                <button
                  className="choice-card"
                  onClick={() => dispatch({ type: 'source', source: 'own' })}
                >
                  <span className="choice-art own-art" aria-hidden="true">
                    <svg viewBox="0 0 140 90">
                      <rect
                        x="22"
                        y="12"
                        width="95"
                        height="65"
                        rx="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="m35 64 25-26 19 19 12-12 17 19M95 29h.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="94" cy="29" r="5" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="choice-title">
                    Add my room <span>↗</span>
                  </span>
                  <span className="choice-copy">
                    Begin with your own bedroom or workspace.
                  </span>
                </button>
              </div>
            ) : (
              <div className="entry-options condition-options">
                {conditions.map((condition) => (
                  <button
                    className="choice-card"
                    key={condition.id}
                    onClick={() =>
                      dispatch({ type: 'condition', condition: condition.id })
                    }
                  >
                    <span className="condition-icon" aria-hidden="true">
                      {condition.icon}
                    </span>
                    <span className="choice-title">
                      {condition.title} <span>↗</span>
                    </span>
                    <span className="choice-copy">{condition.copy}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
