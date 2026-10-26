import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { POLICY } from '@roomedy/contracts/policy';
import type { Project } from '@roomedy/contracts/project';
import type { MedyControl, MedyControlResult } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import {
  exportProject,
  readProject,
  projectMessages,
} from '../session/project';
import { ExportDialog } from './export-dialog';
import { createProjectMenuMotion } from './project-menu-motion';
import styles from './editor.module.css';
type Decision = {
  kind: 'import' | 'reset';
  project: Project | null;
  generation: number;
  workspaceId: string | undefined;
  revision: number | undefined;
  costRevision: number | undefined;
  versions: object;
};

function readFile(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const clear = () => {
      signal.removeEventListener('abort', cancel);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    const cancel = () => {
      clear();
      reader.abort();
      reject(new Error('cancelled'));
    };
    if (signal.aborted) {
      cancel();
      return;
    }
    signal.addEventListener('abort', cancel, { once: true });
    reader.onload = () => {
      const text = reader.result;
      clear();
      try {
        if (
          !(text instanceof ArrayBuffer) ||
          text.byteLength > POLICY.projectBytes
        )
          throw new Error('file');
        resolve(new TextDecoder('utf-8', { fatal: true }).decode(text));
      } catch {
        reject(new Error('file'));
      }
    };
    reader.onerror = reader.onabort = () => {
      clear();
      reject(new Error('file'));
    };
    reader.readAsArrayBuffer(file);
  });
}
export function ProjectControls({
  controller,
  onNewRoom,
  registerMedy,
}: {
  controller: SessionController;
  onNewRoom: () => void;
  registerMedy?: (
    handler:
      | ((
          control: Extract<MedyControl, { type: 'project' }>,
        ) => MedyControlResult)
      | null,
  ) => void;
}) {
  const fileHintId = useId(),
    menu = useRef<HTMLDetailsElement>(null),
    menuPanel = useRef<HTMLDivElement>(null),
    menuMotion = useRef<ReturnType<typeof createProjectMenuMotion> | null>(
      null,
    ),
    input = useRef<HTMLInputElement>(null),
    readRelease = useRef<(() => void) | null>(null),
    downloadRelease = useRef<(() => void) | null>(null),
    decisionRelease = useRef<(() => void) | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    reading = useRef(false),
    mounted = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [exporting, setExporting] = useState(false),
    [requestedFormat, setRequestedFormat] =
      useState<Extract<MedyControl, { type: 'project' }>['format']>(null),
    [decision, setDecision] = useState<Decision | null>(null);
  const setMenuOpen = useCallback((open: boolean) => {
    if (menuMotion.current) menuMotion.current.setOpen(open);
    else if (menu.current) menu.current.open = open;
  }, []);
  useEffect(() => {
    if (decision && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [decision]);
  useEffect(() => {
    mounted.current = true;
    const motion =
      menu.current && menuPanel.current
        ? createProjectMenuMotion(menu.current, menuPanel.current)
        : null;
    menuMotion.current = motion;
    const outside = (e: PointerEvent) => {
      if (dialog.current?.open) return;
      if (e.target instanceof Node && !menu.current?.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      mounted.current = false;
      motion?.dispose();
      if (menuMotion.current === motion) menuMotion.current = null;
      document.removeEventListener('pointerdown', outside);
      readRelease.current?.();
      downloadRelease.current?.();
      decisionRelease.current?.();
    };
  }, [setMenuOpen]);
  const decline = () => {
    decisionRelease.current?.();
    decisionRelease.current = null;
  };
  const reviewDecision = (
    kind: Decision['kind'],
    project: Project | null = null,
  ) => {
    decline();
    const state = controller.getSnapshot();
    const release = controller.ownResource(() => {
      dialog.current?.close();
      if (mounted.current) {
        setDecision(null);
        if (
          kind === 'import' &&
          menu.current?.open &&
          menuPanel.current?.inert === false
        )
          input.current?.focus();
        else menu.current?.querySelector('summary')?.focus();
      }
    });
    decisionRelease.current = release;
    if (release)
      setDecision({
        kind,
        project,
        generation: state.generation,
        workspaceId: state.workspace?.workspaceId,
        revision: state.workspace?.current.roomRevision,
        costRevision: state.cost?.revision,
        versions: state.estimateVersions,
      });
  };
  const confirmDecision = () => {
    if (!decision) return;
    const state = controller.getSnapshot(),
      accepted = decision;
    if (
      !controller.checkExpiry() ||
      state.generation !== accepted.generation ||
      state.workspace?.workspaceId !== accepted.workspaceId ||
      state.workspace?.current.roomRevision !== accepted.revision ||
      state.cost?.revision !== accepted.costRevision ||
      state.estimateVersions !== accepted.versions
    ) {
      decline();
      setMessage(
        'The room changed. Review the project again before replacing it.',
      );
      return;
    }
    decline();
    if (accepted.kind === 'reset') {
      controller.reset();
      onNewRoom();
    } else if (accepted.project && controller.importProject(accepted.project))
      controller.notify(
        'Project imported. Measurement labels are user-supplied; review them against your room.',
      );
    else setMessage(projectMessages['invalid-project']);
  };
  const load = async (file: File) => {
    if (reading.current) return;
    if (file.size > POLICY.projectBytes) {
      setMessage(projectMessages['too-large']);
      return;
    }
    reading.current = true;
    setBusy(true);
    setMessage('');
    const state = controller.getSnapshot(),
      generation = state.generation,
      workspaceId = state.workspace?.workspaceId,
      revision = state.workspace?.current.roomRevision,
      costRevision = state.cost?.revision,
      versions = state.estimateVersions,
      abort = new AbortController();
    let live = true;
    const timer = setTimeout(() => abort.abort(), POLICY.intakeMs);
    const release = controller.ownResource(() => {
      live = false;
      clearTimeout(timer);
      abort.abort();
      if (mounted.current) setBusy(false);
    });
    readRelease.current = release;
    const current = () => {
      const next = controller.getSnapshot();
      return (
        live &&
        controller.checkExpiry() &&
        next.generation === generation &&
        next.workspace?.workspaceId === workspaceId &&
        next.workspace?.current.roomRevision === revision &&
        next.cost?.revision === costRevision &&
        next.estimateVersions === versions
      );
    };
    try {
      const text = await readFile(file, abort.signal);
      if (!current()) {
        if (live)
          setMessage(
            'The room changed while reading. Choose the project again to replace it.',
          );
        return;
      }
      const parsed = readProject(text);
      if (!parsed.ok) {
        setMessage(projectMessages[parsed.code]);
        input.current?.focus();
        return;
      }
      if (!current()) return;
      reviewDecision('import', parsed.value);
    } catch {
      if (live)
        setMessage(
          'The project could not be read. Your current room is unchanged. Choose the file again.',
        );
    } finally {
      reading.current = false;
      if (live) setBusy(false);
      release?.();
      if (readRelease.current === release) readRelease.current = null;
    }
  };
  const download = () => {
    if (!controller.checkExpiry()) return;
    const text = exportProject(controller.getSnapshot());
    if (!text) {
      setMessage(
        'This room could not be exported within the project limit. Your room is unchanged.',
      );
      return;
    }
    downloadBlob(
      new Blob([text], { type: 'application/json' }),
      'roomedy-project.json',
    );
  };
  const downloadBlob = (blob: Blob, name: string) => {
    downloadRelease.current?.();
    const url = URL.createObjectURL(blob);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = controller.ownResource(() => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    });
    if (!release) {
      URL.revokeObjectURL(url);
      return;
    }
    downloadRelease.current = release;
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      timer = setTimeout(() => {
        release();
        if (downloadRelease.current === release) downloadRelease.current = null;
      }, 1000);
    } catch {
      release();
      setMessage('The download could not start. Your room is unchanged.');
    }
  };
  useEffect(() => {
    registerMedy?.((control) => {
      if (busy || exporting || decision)
        return {
          ok: false,
          summary: 'Finish or cancel the open project action first.',
        };
      if (!controller.checkExpiry())
        return {
          ok: false,
          summary: 'This room has expired. Open a new room to continue.',
        };
      if (control.action === 'new') {
        reviewDecision('reset');
        return {
          ok: true,
          summary:
            'Review the new-room confirmation before replacing this room.',
        };
      }
      if (control.action === 'import') {
        setMenuOpen(true);
        input.current?.click();
        return {
          ok: true,
          summary:
            'Choose your saved project. I’ll ask before replacing this room.',
        };
      }
      setRequestedFormat(control.format);
      setExporting(true);
      return {
        ok: true,
        summary: control.format
          ? `Preparing your ${control.format === 'project' ? 'editable project' : control.format.toUpperCase()} download.`
          : 'Choose the format you’d like to take with you.',
      };
    });
    return () => registerMedy?.(null);
  });
  return (
    <>
      <details
        ref={menu}
        className={styles.projectMenu}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && menu.current?.open) {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(false);
            menu.current?.querySelector('summary')?.focus();
          }
        }}
      >
        <summary
          className="glass-control"
          onClick={(event) => {
            event.preventDefault();
            if (menuMotion.current) menuMotion.current.toggle();
            else if (menu.current) menu.current.open = !menu.current.open;
          }}
        >
          Project
        </summary>
        <div ref={menuPanel} className={styles.projectOptions}>
          <p>
            Take your Current design with you. An editable project also includes
            draft prices, source evidence and saved estimates; photos, chat and
            Undo are excluded.
          </p>
          <div className={styles.projectFileActions}>
            <button
              className={styles.beige}
              disabled={busy}
              onClick={() => {
                setRequestedFormat(null);
                setExporting(true);
              }}
            >
              Export
            </button>
            <label className={styles.projectImport}>
              Import project
              <input
                ref={input}
                type="file"
                aria-label="Import project"
                aria-describedby={fileHintId}
                accept=".roomedy,.json,application/vnd.roomedy.project+json,application/json"
                disabled={busy}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  e.currentTarget.value = '';
                  if (file) void load(file);
                }}
              />
            </label>
          </div>
          <p id={fileHintId}>Roomedy project · up to 1 MiB</p>
          {busy && <p role="status">Reading project…</p>}
          {message && <p role="alert">{message}</p>}
          <hr />
          <button
            className={styles.primary}
            onClick={() => reviewDecision('reset')}
          >
            Start a new room
          </button>
        </div>
      </details>
      {exporting && (
        <ExportDialog
          controller={controller}
          onClose={() => {
            setExporting(false);
            requestAnimationFrame(() =>
              menu.current
                ?.querySelector('summary')
                ?.focus({ preventScroll: true }),
            );
          }}
          onProject={download}
          onDownload={downloadBlob}
          requestedFormat={requestedFormat}
        />
      )}
      {decision && (
        <dialog
          ref={dialog}
          className={styles.projectDialog}
          aria-label={
            decision.kind === 'import'
              ? 'Replace room with project'
              : 'Start a new room'
          }
          onCancel={(e) => {
            e.preventDefault();
            decline();
          }}
        >
          <h2>
            {decision.kind === 'import'
              ? 'Replace this room?'
              : 'Start a new room?'}
          </h2>
          {decision.project && (
            <p>
              Imported room: {decision.project.current.room.width.value ?? '?'}{' '}
              × {decision.project.current.room.depth.value ?? '?'} mm ·{' '}
              {decision.project.current.furniture.length} pieces. Its starting
              Before layout, draft prices and {decision.project.versions.length}{' '}
              saved estimate versions are included.
            </p>
          )}
          <p>
            This clears the current room and unfinished work in this tab.{' '}
            {decision.kind === 'import'
              ? 'The imported project starts a fresh two-hour session.'
              : 'Downloaded project files stay available.'}
          </p>
          <div className={styles.actionRow}>
            <button onClick={decline}>Cancel</button>
            <button className={styles.primary} onClick={confirmDecision}>
              {decision.kind === 'import' ? 'Import project' : 'Start new room'}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
