import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SessionController } from '../session/controller';
import {
  DesignExportError,
  EXPORT_FORMATS,
  exportFailureText,
} from '../design-export/facts';
import type { DesignExportKind } from '../design-export/facts';
import { startDesignExport } from '../design-export/job';
import type { ExportPort } from '../design-export/job';
import { ensureEstimateSnapshot } from '../cost/versions';
import styles from './export.module.css';
async function prepare(kind: DesignExportKind, port: ExportPort) {
  port.check();
  port.progress('Preparing your design…');
  if (kind === 'glb') {
    const { exportGlb } = await import('../design-export/scene');
    port.check();
    return exportGlb(port.project.current, port.signal, port.check);
  }
  if (kind === 'obj') {
    const { exportObj } = await import('../design-export/obj');
    port.check();
    return exportObj(port.project.current, port.signal, port.check);
  }
  if (port.estimate) {
    const [{ captureEstimatePictures }, { estimatePdf }] = await Promise.all([
      import('../cost/estimate-pdf-capture'),
      import('../cost/estimate-pdf'),
    ]);
    port.check();
    const pictures = await captureEstimatePictures(port);
    port.check();
    const bytes = await estimatePdf(port.estimate, pictures, {
      check: port.check,
      progress: port.progress,
    });
    port.check();
    return new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  }
  const { captureRoomPictures } = await import('../design-export/capture');
  port.check();
  const captures = await captureRoomPictures(
    port.project.current,
    port.signal,
    port.check,
    port.progress,
  );
  try {
    port.check();
    const { createPortfolioPages } = await import('../design-export/portfolio');
    const pages = await createPortfolioPages(port.project, captures.pictures, {
      check: port.check,
      progress: port.progress,
      simpleShapes: captures.simplified,
    });
    const { portfolioPdf } = await import('../design-export/pdf');
    port.progress('Preparing your portfolio…');
    const bytes = await portfolioPdf(pages, port.check);
    return new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  } finally {
    captures.dispose();
  }
}
export function ExportDialog({
  controller,
  onClose,
  onProject,
  onDownload,
  onEstimate,
  requestedFormat = null,
}: {
  controller: SessionController;
  onClose: () => void;
  onProject: () => void;
  onDownload: (blob: Blob, name: string) => void;
  onEstimate: () => void;
  requestedFormat?: DesignExportKind | 'project' | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    job = useRef<ReturnType<typeof startDesignExport> | null>(null),
    live = useRef(false),
    closeRef = useRef(onClose);
  const requestedButton = useRef<HTMLButtonElement | null>(null);
  const pdfButton = useRef<HTMLButtonElement | null>(null),
    estimateButton = useRef<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false),
    [pdfPrompt, setPdfPrompt] = useState(false),
    [progress, setProgress] = useState(''),
    [message, setMessage] = useState('');
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    live.current = true;
    const node = dialog.current;
    node?.showModal();
    const own = controller.ownResource(() => {
      job.current?.cancel();
      if (live.current) closeRef.current();
    });
    return () => {
      live.current = false;
      job.current?.cancel();
      own?.();
      node?.close();
    };
  }, [controller]);
  const choose = async (kind: DesignExportKind, designOnly = false) => {
    if (job.current) return;
    let target: { estimateId: string } | undefined;
    if (kind === 'pdf' && !designOnly) {
      if (controller.getSnapshot().cost?.settings.locality.currency !== 'USD') {
        setMessage('');
        setPdfPrompt(true);
        return;
      }
      const snapshot = ensureEstimateSnapshot(controller);
      if (!snapshot.ok) {
        setMessage(snapshot.reason);
        return;
      }
      target = { estimateId: snapshot.id };
    }
    setBusy(true);
    setMessage('');
    try {
      const current = startDesignExport(
        controller,
        (port) => prepare(kind, port),
        (blob) => {
          if (!live.current) return;
          onDownload(
            blob,
            kind === 'pdf'
              ? target
                ? 'roomedy-room-and-estimate.pdf'
                : 'roomedy-design-portfolio.pdf'
              : kind === 'obj'
                ? 'roomedy-obj-model.zip'
                : 'roomedy-design.glb',
          );
          onClose();
        },
        (text) => {
          if (live.current) setProgress(text);
        },
        undefined,
        target,
      );
      job.current = current;
      await current.completion;
    } catch (error) {
      if (live.current)
        setMessage(
          exportFailureText[
            error instanceof DesignExportError ? error.code : 'failed'
          ],
        );
    } finally {
      job.current = null;
      if (live.current) {
        setBusy(false);
        setProgress('');
      }
    }
  };
  useEffect(() => {
    if (pdfPrompt) estimateButton.current?.focus({ preventScroll: true });
  }, [pdfPrompt]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active && requestedFormat)
        (requestedFormat === 'pdf'
          ? pdfButton
          : requestedButton
        ).current?.click();
    });
    return () => {
      active = false;
    };
  }, [requestedFormat]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="design-export-title"
      aria-describedby={pdfPrompt ? 'pdf-estimate-intro' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {pdfPrompt ? (
        <>
          <span className={styles.promptIcon} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 3h12v18H6zM9 7h6M9 11h2M13 11h2M9 15h2M13 15h2M9 18h2M13 18h2" />
            </svg>
          </span>
          <p className={styles.eyebrow}>A MORE COMPLETE PDF</p>
          <h2 id="design-export-title">
            Bring your <em>plan along.</em>
          </h2>
          <p id="pdf-estimate-intro" className={styles.intro}>
            Visit Estimate to compare furniture and finishes and review your
            costs. Then export a detailed PDF with your room, cost breakdown and
            supplier links.
          </p>
          <div className={styles.includes} aria-label="What Estimate adds">
            <span>Furniture &amp; finishes</span>
            <span>Costs &amp; shopping links</span>
          </div>
          {!busy && (
            <div className={styles.promptActions}>
              <button
                ref={estimateButton}
                type="button"
                className={styles.primary}
                onClick={onEstimate}
              >
                <span>Visit Estimate</span>
                <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={() => void choose('pdf', true)}>
                <span>Export design only</span>
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className={styles.eyebrow}>TAKE YOUR DESIGN WITH YOU</p>
          <h2 id="design-export-title">
            Made to <em>share.</em>
          </h2>
          <p className={styles.intro}>
            Export your Current arrangement, or keep an editable project with
            your design, prices and saved estimate versions. Photos, chat and
            Undo are excluded.
          </p>
          <div className={styles.formats}>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.kind}
                ref={
                  format.kind === 'pdf'
                    ? pdfButton
                    : format.kind === requestedFormat
                      ? requestedButton
                      : undefined
                }
                type="button"
                className={styles.format}
                disabled={busy}
                onClick={() => {
                  if (format.kind === 'project') {
                    onProject();
                    onClose();
                  } else void choose(format.kind);
                }}
              >
                <span className={styles.icon} aria-hidden="true">
                  <svg
                    viewBox="0 0 28 28"
                    width="30"
                    height="30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d={
                        format.kind === 'glb' || format.kind === 'obj'
                          ? 'M14 3 25 9v11l-11 6L3 20V9Zm0 12v11M3 9l11 6 11-6M14 3v12'
                          : format.kind === 'pdf'
                            ? 'M5 2h12l6 6v18H5Zm12 0v7h6M9 14h10M9 18h10M9 22h6'
                            : 'M4 4h20v20H4Zm8 20V14h12M4 10h8'
                      }
                    />
                  </svg>
                </span>
                <span>
                  <strong>{format.title}</strong>
                  <small>{format.text}</small>
                </span>
                <span className={styles.extension}>{format.extension}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {busy && (
        <p className={styles.progress} role="status">
          <span aria-hidden="true" />
          {progress || 'Preparing your design…'}
        </p>
      )}
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
      <div className={styles.actions}>
        {pdfPrompt && !busy && (
          <button
            type="button"
            onClick={() => {
              setPdfPrompt(false);
              setMessage('');
              requestAnimationFrame(() =>
                pdfButton.current?.focus({ preventScroll: true }),
              );
            }}
          >
            Back to formats
          </button>
        )}
        <button type="button" onClick={onClose}>
          {busy ? 'Cancel export' : 'Close'}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
