import { useEffect, useId, useRef, useState } from 'react';
import { offerNightLighting } from './lighting-preference';
import controls from './view-controls.module.css';
import styles from './lighting-experience.module.css';

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
            <button aria-pressed={!night} onClick={() => onNight(false)}>
              Day
            </button>
            <button aria-pressed={night} onClick={() => onNight(true)}>
              Night
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
