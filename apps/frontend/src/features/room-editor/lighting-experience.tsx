import { useEffect, useId, useRef, useState } from 'react';
import { offerNightLighting } from './lighting-preference';
import controls from './view-controls.module.css';
import styles from './lighting-experience.module.css';

function DaylightIcon({ night }: { night: boolean }) {
  return (
    <svg
      className={styles.timeIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {night ? (
        <path d="M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </>
      )}
    </svg>
  );
}

export function LightingExperience({
  owner,
  view,
  night,
  layer,
  onNight,
  onLayer,
  hasFixtures,
  canOffer,
  onManual,
  onMedy,
}: {
  owner: object;
  view: 'plan' | 'cutaway';
  night: boolean;
  layer: 'floor' | 'ceiling';
  onNight: (night: boolean) => void;
  onLayer: (layer: 'floor' | 'ceiling') => void;
  hasFixtures: boolean;
  canOffer: boolean;
  onManual: () => void;
  onMedy: () => void;
}) {
  const [step, setStep] = useState<'ask' | 'choose' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    title = useId(),
    description = useId();
  useEffect(() => {
    if (!night || !canOffer) return;
    let live = true;
    queueMicrotask(() => {
      if (live && offerNightLighting(owner, hasFixtures)) setStep('ask');
    });
    return () => {
      live = false;
    };
  }, [owner, night, canOffer, hasFixtures]);
  const showing = step !== null;
  useEffect(() => {
    const element = dialog.current;
    if (showing && element && !element.open) element.showModal();
    else if (!showing) element?.close();
    return () => element?.close();
  }, [showing]);
  useEffect(() => {
    if (step === 'choose') dialog.current?.querySelector('button')?.focus();
  }, [step]);
  const close = () => setStep(null);
  return (
    <>
      <div
        className={controls.viewSwitch}
        role="group"
        aria-label={view === 'plan' ? 'Plan layer' : 'Room daylight'}
        data-view={
          (view === 'plan' ? layer === 'ceiling' : night) ? 'cutaway' : 'plan'
        }
      >
        <span className={controls.viewThumb} aria-hidden="true" />
        {view === 'plan' ? (
          <>
            <button
              disabled={!canOffer}
              aria-pressed={layer === 'floor'}
              onClick={() => onLayer('floor')}
            >
              Floor
            </button>
            <button
              disabled={!canOffer}
              aria-pressed={layer === 'ceiling'}
              onClick={() => onLayer('ceiling')}
            >
              Ceiling
            </button>
          </>
        ) : (
          <>
            <button
              aria-label="Day"
              title="Day"
              aria-pressed={!night}
              onClick={() => onNight(false)}
            >
              <DaylightIcon night={false} />
            </button>
            <button
              aria-label="Night"
              title="Night"
              aria-pressed={night}
              onClick={() => onNight(true)}
            >
              <DaylightIcon night />
            </button>
          </>
        )}
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={title}
        aria-describedby={description}
        onCancel={close}
        onClose={close}
      >
        <div className={styles.mark} aria-hidden="true">
          ☾
        </div>
        <small>A different light on your room</small>
        <h2 id={title}>
          {step === 'choose'
            ? 'Let’s bring in a little glow.'
            : 'Your room is ready for night.'}
        </h2>
        <p id={description}>
          {step === 'choose'
            ? 'Browse lamps and ceiling lights, or plan the lighting with Medy.'
            : 'There aren’t any lights in this room yet. Would you like to start by adding one?'}
        </p>
        <div className={styles.actions}>
          {step === 'choose' ? (
            <>
              <button
                onClick={() => {
                  close();
                  onManual();
                }}
              >
                Add manually
              </button>
              <button
                onClick={() => {
                  close();
                  onMedy();
                }}
              >
                Plan with Medy
              </button>
              <button onClick={close}>Later</button>
            </>
          ) : (
            <>
              <button autoFocus onClick={() => setStep('choose')}>
                Yes, add lighting
              </button>
              <button onClick={close}>Later</button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
