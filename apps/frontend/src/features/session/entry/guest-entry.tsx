'use client';
import { useEffect, useReducer, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
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
}[] = [
  {
    id: 'empty',
    title: 'An empty room',
    copy: 'A blank canvas for your essentials.',
  },
  {
    id: 'partial',
    title: 'A few pieces',
    copy: 'Keep what works. Fill in the rest.',
  },
  {
    id: 'furnished',
    title: 'Already furnished',
    copy: 'Find a fresh arrangement for what’s there.',
  },
];
export function GuestEntry({
  initial,
  previews,
}: {
  initial: EntryState;
  previews: Record<RoomCondition, ReactNode>;
}) {
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
    return state.intent.source === 'manual' ? (
      <EditorEntry
        condition={state.intent.condition}
        fresh={!!state.fresh}
        onBack={() => dispatch({ type: 'back' })}
      />
    ) : (
      <IntakeEntry
        condition={state.intent.condition}
        fresh={!!state.fresh}
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
        {state.step === 'source' ? (
          <Link href="/" className="text-link">
            Back to home <span aria-hidden="true">↗</span>
          </Link>
        ) : (
          <button
            className="text-link"
            aria-label="Back to room choices"
            onClick={() => dispatch({ type: 'back' })}
          >
            <span aria-hidden="true">←</span> Back
          </button>
        )}
      </header>
      <main
        id="main-content"
        className="entry-main shell"
        data-entry-step={state.step}
      >
        <div ref={motion} className="motion-surface">
          <div className="motion-flow entry-layout">
            <div className="entry-heading">
              <p className="eyebrow">YOUR SPACE, A FRESH PERSPECTIVE</p>
              <h1 ref={heading} tabIndex={-1}>
                {title}
              </h1>
              <p>
                {state.step === 'source'
                  ? 'Start from photos, or build a room yourself.'
                  : state.step === 'condition'
                    ? 'Choose the starting point that feels closest.'
                    : 'Photos become a rough 2D sketch for you to review before the main editor.'}
              </p>
            </div>
            {state.step === 'source' ? (
              <div className="entry-options source-options">
                <button
                  className="choice-card"
                  onClick={() => dispatch({ type: 'source', source: 'manual' })}
                >
                  <span className="choice-art sample-art" aria-hidden="true">
                    {previews.furnished}
                  </span>
                  <span className="choice-title">
                    Build manually <span>↗</span>
                  </span>
                  <span className="choice-copy">
                    Choose an empty room, a few pieces or a furnished layout.
                  </span>
                </button>
                <button
                  className="choice-card"
                  onClick={() => dispatch({ type: 'source', source: 'photos' })}
                >
                  <span className="choice-art own-art" aria-hidden="true">
                    <picture>
                      <source
                        media="(max-width: 600px)"
                        srcSet="/landing/bedroom-narrow.webp"
                      />
                      <Image
                        src="/landing/bedroom-wide.webp"
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 700px) 110px, 50vw"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    </picture>
                  </span>
                  <span className="choice-title">
                    Upload photos <span>↗</span>
                  </span>
                  <span className="choice-copy">
                    Turn room photos into a sketch, review it, then edit in 2D
                    and 3D.
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
                    <span
                      className="choice-art condition-art"
                      aria-hidden="true"
                    >
                      {previews[condition.id]}
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
