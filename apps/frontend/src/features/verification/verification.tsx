'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { mountVerification } from './turnstile';
import type { Turnstile } from './turnstile';
import { loadVerificationScript } from './script';
import {
  verificationSnapshot,
  serverVerificationSnapshot,
  subscribeVerification,
} from './state';
import type { PendingVerification } from './state';
import styles from './verification.module.css';

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function Verification() {
  const pending = useSyncExternalStore(
    subscribeVerification,
    verificationSnapshot,
    serverVerificationSnapshot,
  );
  return pending ? (
    <VerificationDialog key={pending.challenge.inputHash} pending={pending} />
  ) : null;
}

function VerificationDialog({ pending }: { pending: PendingVerification }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [slowAttempt, setSlowAttempt] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const slow = slowAttempt === attempt;
  const generation = useRef({ value: 0 });
  useEffect(() => {
    const lifecycle = generation.current;
    const ownedGeneration = ++lifecycle.value;
    const owned = dialog.current;
    const previous = document.activeElement;
    return () => {
      owned?.close();
      // React's development effect replay remounts before this cancellation check.
      queueMicrotask(() => {
        if (lifecycle.value === ownedGeneration) pending.finish();
      });
      if (
        previous instanceof HTMLElement &&
        previous.isConnected &&
        (document.activeElement === document.body ||
          owned?.contains(document.activeElement))
      )
        previous.focus({ preventScroll: true });
    };
  }, [pending]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const owned = dialog.current;
      if (!owned) return;
      try {
        if (!owned.open) owned.showModal();
        setInteractive(true);
        setSlowAttempt(attempt);
      } catch {
        pending.finish();
      }
    }, 15_000);
    return () => clearTimeout(timer);
  }, [pending, attempt]);
  useEffect(() => {
    return loadVerificationScript(
      document,
      () => Boolean(window.turnstile),
      () => setReady(true),
      (reason) => pending.finish(undefined, reason),
    );
  }, [pending]);
  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const owned = dialog.current;
    return mountVerification(
      window.turnstile,
      container.current,
      pending.challenge,
      pending.finish,
      () => {
        if (!owned || owned.open) return;
        try {
          owned.showModal();
          setInteractive(true);
        } catch {
          pending.finish();
        }
      },
    );
  }, [ready, pending, attempt]);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="verification-heading"
      aria-describedby="verification-description"
      onCancel={(event) => {
        event.preventDefault();
        pending.finish();
      }}
    >
      <div hidden={!interactive}>
        <h2 id="verification-heading">One quick check</h2>
        <p id="verification-description">
          {slow
            ? 'The browser check is taking longer than usual. You can keep waiting or try the check again.'
            : 'Complete this check to continue. Your room and photos stay here if you cancel.'}
        </p>
      </div>
      <div className={styles.widget} ref={container} />
      <div hidden={!interactive} className={styles.footer}>
        {slow && (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try the check again
          </button>
        )}
        <button type="button" onClick={() => pending.finish()}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
