import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './assistant.module.css';
const steps = [
  {
    target: 'canvas',
    title: 'Your room stays yours',
    text: 'Select a piece to inspect it. Use the 2D plan for precise edits and the cutaway to look around.',
  },
  {
    target: 'properties',
    title: 'Ask for one useful change',
    text: 'Choose a goal or send a message. Your draft text stays here when you inspect another panel.',
  },
  {
    target: 'preview',
    title: 'Review before applying',
    text: 'A proposal leaves Current unchanged. Review its pieces and checks, then Apply or Cancel. Undo reverses the whole accepted change.',
  },
] as const;
export function AssistantTour() {
  const [step, setStep] = useState(-1),
    [box, setBox] = useState<{
      left: number;
      top: number;
      width: number;
      height: number;
      cardTop: number;
      cardLeft: number;
    } | null>(null);
  const start = useRef<HTMLButtonElement>(null),
    next = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setStep(-1);
    setBox(null);
    start.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (step < 0) return;
    const item = steps[step]!,
      target =
        document.querySelector<HTMLElement>(
          `[data-room-target="${item.target}"]`,
        ) ?? document.querySelector<HTMLElement>('[data-room-target="canvas"]');
    if (!target) return;
    let live = true,
      frame = 0,
      stable = 0,
      last = '',
      shown = false;
    let began = performance.now();
    const measure = () => {
      if (!live) return;
      const r = target.getBoundingClientRect(),
        viewportWidth = document.documentElement.clientWidth,
        viewportHeight = document.documentElement.clientHeight,
        key = [r.left, r.top, r.width, r.height, viewportWidth, viewportHeight]
          .map((v) => Math.round(v))
          .join('/');
      stable = key === last ? stable + 1 : 0;
      last = key;
      const visible =
        r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < viewportHeight;
      if ((visible && stable >= 2) || shown) {
        const cardLeft = Math.max(
            16,
            Math.min(viewportWidth - 316, r.left + 12),
          ),
          cardTop = Math.max(12, Math.min(viewportHeight - 220, r.bottom + 10));
        setBox({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          cardLeft,
          cardTop,
        });
        if (!shown) {
          shown = true;
          requestAnimationFrame(() =>
            next.current?.focus({ preventScroll: true }),
          );
        }
        if (stable >= 2) return;
      }
      if (performance.now() - began < 4000)
        frame = requestAnimationFrame(measure);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      stable = 0;
      began = performance.now();
      frame = requestAnimationFrame(measure);
    };
    const resize = () => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      schedule();
    };
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', key);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', resize);
      document.removeEventListener('keydown', key);
    };
  }, [step, close]);
  return (
    <>
      <button
        ref={start}
        type="button"
        onClick={() => {
          setBox(null);
          setStep(0);
        }}
      >
        Quick tour
      </button>
      {step >= 0 &&
        box &&
        createPortal(
          <>
            <div
              className={styles.tourOutline}
              style={{
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }}
            />
            <section
              role="dialog"
              aria-modal="false"
              aria-label={`Room guide ${step + 1} of 3`}
              className={styles.tourCard}
              style={{ left: box.cardLeft, top: box.cardTop }}
            >
              <h3>{steps[step]!.title}</h3>
              <p>{steps[step]!.text}</p>
              <div>
                <button onClick={close}>Skip</button>
                <button
                  ref={next}
                  onClick={() => {
                    if (step === steps.length - 1) close();
                    else {
                      setBox(null);
                      setStep(step + 1);
                    }
                  }}
                >
                  {step === steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </section>
          </>,
          document.body,
        )}
    </>
  );
}
