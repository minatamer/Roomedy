import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { revealWords } from './message-reveal';
import type { MessageReveal } from './message-reveal';
import styles from './assistant.module.css';

export function RevealedText({
  id,
  text,
  ledger,
  enabled,
  onComplete,
}: {
  id: number;
  text: string;
  ledger: MessageReveal;
  enabled: boolean;
  onComplete: (id: number) => void;
}) {
  const words = useMemo(() => revealWords(text), [text]);
  const [timing, setTiming] = useState<{
    elapsed: number;
    done: boolean;
  } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const elapsed = ledger.begin(id, performance.now()),
      remaining = Math.max(0, words.duration - elapsed);
    queueMicrotask(() => {
      if (live) {
        setTiming({ elapsed, done: remaining === 0 });
        if (!remaining) onComplete(id);
      }
    });
    const timer = window.setTimeout(() => {
      if (live) {
        setTiming({ elapsed, done: true });
        onComplete(id);
      }
    }, remaining);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [id, ledger, words, enabled, onComplete]);
  return (
    <>
      <p className={styles.revealedText}>
        <span className={styles.srOnly}>{text}</span>
        <span
          aria-hidden="true"
          data-medy-reveal={timing?.done ? 'complete' : 'writing'}
        >
          {timing?.done
            ? text
            : words.parts.map((part, index) =>
                part.text.trim() ? (
                  <span
                    key={index}
                    className={timing ? styles.word : styles.waitingWord}
                    style={
                      {
                        '--word-delay': `${part.delay - (timing?.elapsed ?? 0)}ms`,
                      } as CSSProperties
                    }
                  >
                    {part.text}
                  </span>
                ) : (
                  part.text
                ),
              )}
        </span>
      </p>
    </>
  );
}
