import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SessionController } from '../session/controller';
import type { EstimateVersion } from '@roomedy/contracts/project';
import { startDesignExport } from '../design-export/job';
import { DesignExportError, exportFailureText } from '../design-export/facts';
import styles from './workspace.module.css';
export function EstimatePdfControls({
  controller,
  selectedId,
}: {
  controller: SessionController;
  selectedId: string | null;
}) {
  const [chosen, setChosen] = useState<EstimateVersion | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const button = useRef<HTMLButtonElement>(null),
    closeButton = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    live = useRef(false),
    running = useRef<ReturnType<typeof startDesignExport> | null>(null),
    downloadRelease = useRef<(() => void) | null>(null);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      running.current?.cancel();
      downloadRelease.current?.();
    };
  }, []);
  useEffect(() => {
    if (chosen && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [chosen]);
  const close = () => {
    running.current?.cancel();
    running.current = null;
    dialog.current?.close();
    setChosen(null);
    setBusy(false);
    button.current?.focus({ preventScroll: true });
  };
  const deliver = (blob: Blob, version: EstimateVersion) => {
    downloadRelease.current?.();
    const url = URL.createObjectURL(blob);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = controller.ownResource(() => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    });
    if (!release) {
      URL.revokeObjectURL(url);
      throw new DesignExportError('changed');
    }
    downloadRelease.current = release;
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `roomedy-estimate-${version.label.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'version'}.pdf`;
      anchor.click();
      timer = setTimeout(() => {
        release();
        if (downloadRelease.current === release) downloadRelease.current = null;
      }, 1000);
    } catch (error) {
      release();
      throw error;
    }
  };
  const start = () => {
    if (!chosen || running.current) return;
    setMessage('Preparing this saved room and estimate...');
    try {
      const job = startDesignExport(
        controller,
        async (port) => {
          const [{ captureEstimatePictures }, { estimatePdf }] =
            await Promise.all([
              import('./estimate-pdf-capture'),
              import('./estimate-pdf'),
            ]);
          port.check();
          if (!port.estimate) throw new DesignExportError('changed');
          const pictures = await captureEstimatePictures(port);
          port.check();
          const bytes = await estimatePdf(port.estimate, pictures, {
            check: port.check,
            progress: port.progress,
          });
          port.check();
          return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
        },
        (blob) => deliver(blob, chosen),
        (text) => {
          if (live.current) setMessage(text);
        },
        undefined,
        { estimateId: chosen.id },
      );
      running.current = job;
      setBusy(true);
      queueMicrotask(() => {
        if (live.current && running.current === job)
          closeButton.current?.focus();
      });
      void job.completion
        .then(() => {
          if (live.current && running.current === job)
            setMessage(
              'Estimate ready. Check your browser downloads. This saved version is unchanged.',
            );
        })
        .catch((error: unknown) => {
          if (live.current && running.current === job)
            setMessage(
              error instanceof DesignExportError
                ? exportFailureText[error.code]
                : exportFailureText.failed,
            );
        })
        .finally(() => {
          if (running.current === job) {
            running.current = null;
            if (live.current) setBusy(false);
          }
        });
    } catch (error) {
      setMessage(
        error instanceof DesignExportError
          ? exportFailureText[error.code]
          : exportFailureText.failed,
      );
    }
  };
  return (
    <section className={styles.pdfExport} aria-label="Estimate PDF export">
      <div>
        <h2>Take the plan with you.</h2>
        <p>
          {selectedId
            ? 'Download this saved estimate with its room views, quantities, sources and work plan.'
            : 'Approve and save the draft, or view a saved version above, to export its exact estimate.'}
        </p>
      </div>
      <button
        ref={button}
        disabled={!selectedId}
        onClick={() => {
          if (!controller.checkExpiry()) return;
          const version = controller
            .getSnapshot()
            .estimateVersions.find((v) => v.id === selectedId);
          if (version) {
            setMessage('');
            setChosen(version);
          }
        }}
      >
        Download Roomedy estimate
      </button>
      {chosen &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.pdfDialog}
            aria-labelledby="estimate-pdf-title"
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
          >
            <p className={styles.eyebrow}>Your room, made real</p>
            <h2 id="estimate-pdf-title">Your Roomedy estimate.</h2>
            <p>
              <strong>{chosen.label}</strong> · saved{' '}
              {new Date(chosen.savedAt).toLocaleString('en-GB')}
            </p>
            <p>
              Includes this exact saved design, itemized costs, allowances,
              unpriced items, supplier links and the shopping/work plan. No
              prices are refreshed and no order is placed.
            </p>
            <p>
              English Latin-font financial text is selectable. The room and plan
              are images. Arabic/RTL PDF output is not supported yet.
            </p>
            <p role="status" aria-live="polite">
              {message}
            </p>
            <div className={styles.actions}>
              <button ref={closeButton} onClick={close}>
                {busy ? 'Cancel export' : 'Close'}
              </button>
              <button
                className={styles.primary}
                disabled={busy}
                onClick={start}
              >
                {busy ? 'Creating estimate...' : 'Create & download PDF'}
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </section>
  );
}
