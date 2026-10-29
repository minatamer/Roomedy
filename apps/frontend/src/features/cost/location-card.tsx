import { useEffect, useId, useRef, useState } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { requestShoppingLocation } from './location';
import type { LocationResult } from './location';
import { SHOPPING_COUNTRIES, shoppingCountry } from './shopping-countries';
import styles from './workspace.module.css';

export function LocationCard({
  controller,
  state,
  onReady,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  onReady: () => void;
}) {
  const [status, setStatus] = useState<
    LocationResult['kind'] | 'idle' | 'waiting'
  >('idle');
  const task = useRef<ReturnType<typeof requestShoppingLocation> | null>(null);
  const countryId = useId();
  const busy = status === 'waiting';
  const chosen =
    state.shoppingLocation?.country === state.cost!.settings.locality.country
      ? state.shoppingLocation
      : null;
  const country = shoppingCountry(state.cost!.settings.locality.country)
    ? state.cost!.settings.locality.country
    : 'US';
  const blocked = !!state.candidate || !!state.pending;
  useEffect(() => {
    if (state.destination === 'cost') return;
    task.current?.cancel();
    task.current = null;
    let live = true;
    queueMicrotask(() => {
      if (live) setStatus('idle');
    });
    return () => {
      live = false;
    };
  }, [state.destination]);
  useEffect(
    () => () => {
      task.current?.cancel();
      task.current = null;
    },
    [],
  );
  const begin = () => {
    if (
      task.current ||
      state.candidate ||
      state.pending ||
      !controller.checkExpiry()
    )
      return;
    const before = controller.getSnapshot();
    const running = requestShoppingLocation(
      window.isSecureContext ? navigator.geolocation : undefined,
    );
    task.current = running;
    setStatus('waiting');
    void running.result.then((answer) => {
      if (task.current !== running) return;
      task.current = null;
      if (answer.kind === 'located') {
        if (
          controller.chooseShoppingLocation(
            answer.country,
            'browser',
            before.generation,
            before.cost!.revision,
          )
        ) {
          setStatus('idle');
          onReady();
        } else setStatus('unavailable');
      } else if (answer.kind !== 'cancelled') setStatus(answer.kind);
    });
  };
  const chooseCountry = (country: string, continueToPlan = false) => {
    task.current?.cancel();
    task.current = null;
    const current = controller.getSnapshot();
    if (!current.cost) return;
    if (
      controller.chooseShoppingLocation(
        country,
        'manual',
        current.generation,
        current.cost.revision,
      )
    ) {
      setStatus('idle');
      if (continueToPlan) onReady();
    }
  };
  const error = {
    denied:
      'Location is blocked. Choose a country below, or allow Location in your browser’s site controls and try again. Your browser may ask you to reload after changing this permission.',
    timeout:
      'Your browser couldn’t find a location in time. Choose a country below or try location again.',
    unavailable:
      'Your device couldn’t share a location. Choose a country below or try location again.',
    unsupported:
      'Location isn’t available in this browser or page. Choose a shopping country below to continue.',
    unresolved:
      'I couldn’t confidently match that location to a country. Choose a shopping country below to continue.',
  };
  return (
    <section className={styles.locationCard} aria-label="Shopping country">
      <div className={styles.locationVisual}>
        <LocationIcon />
        <span aria-hidden="true">↗</span>
      </div>
      <div>
        <h3>Where would you like to shop?</h3>
        <p>
          {chosen && chosen.country !== 'ZZ'
            ? `We’ll look for stores in ${shoppingCountry(country)!.name}. You can change this any time.`
            : country === 'US'
              ? 'We’ll start with popular United States stores. Choose another country whenever you like.'
              : 'Choose the country whose stores you’d like to browse.'}
        </p>
        <label className={styles.countryField} htmlFor={countryId}>
          Shopping country
          <select
            id={countryId}
            value={country}
            disabled={blocked}
            onChange={(event) => chooseCountry(event.currentTarget.value)}
          >
            {SHOPPING_COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.note}>
          Device location is optional. Coordinates stay in this browser. Prices
          are always in USD.
        </p>
        <div role="status" className={busy ? styles.thinking : undefined}>
          {busy ? (
            <>
              <span aria-hidden="true" />
              Waiting for your browser…
            </>
          ) : status in error ? (
            error[status as keyof typeof error]
          ) : (
            ''
          )}
        </div>
        <div className={styles.locationActions}>
          <button
            className="glass-control"
            disabled={blocked}
            onClick={() => chooseCountry(country, true)}
          >
            Use this country <span aria-hidden="true">→</span>
          </button>
          <button
            className="glass-control"
            disabled={busy || blocked}
            onClick={begin}
          >
            {busy
              ? 'Waiting…'
              : status === 'idle'
                ? 'Use device location'
                : 'Try location again'}
          </button>
        </div>
      </div>
    </section>
  );
}

function LocationIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
