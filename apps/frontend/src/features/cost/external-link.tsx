import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { sourceUrlSchema } from '@roomedy/contracts/estimates';
import styles from './workspace.module.css';

export function ExternalLink({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const safe = sourceUrlSchema.safeParse(url);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [open]);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  if (!safe.success) return <span>{children}</span>;
  const host = new URL(safe.data).hostname.replace(/^www\./, '');
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`${styles.storeLink} ${className ?? ''}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={`${styles.pdfDialog} ${styles.storeDialog}`}
            aria-labelledby={title}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClose={() => setOpen(false)}
          >
            <h2 id={title}>Visit {host}?</h2>
            <p>
              You’re leaving Roomedy. We’re not affiliated with this store. The
              retailer sets its prices, availability and terms.
            </p>
            <div className={styles.actions}>
              <button onClick={close}>Stay here</button>
              <a
                className="glass-control"
                href={safe.data}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                Continue to store <span aria-hidden="true">↗</span>
              </a>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
