import { useEffect, useId, useRef, useState } from 'react';
import { POLICY } from '@roomedy/contracts/policy';
import type { Project } from '@roomedy/contracts/project';
import type { SessionController } from '../session/controller';
import {
  exportProject,
  readProject,
  projectMessages,
} from '../session/project';
import styles from './editor.module.css';
type Decision = {
  kind: 'import' | 'reset';
  project: Project | null;
  generation: number;
  workspaceId: string | undefined;
  revision: number | undefined;
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
}: {
  controller: SessionController;
  onNewRoom: () => void;
}) {
  const fileHintId = useId(),
    menu = useRef<HTMLDetailsElement>(null),
    input = useRef<HTMLInputElement>(null),
    readRelease = useRef<(() => void) | null>(null),
    downloadRelease = useRef<(() => void) | null>(null),
    decisionRelease = useRef<(() => void) | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    reading = useRef(false),
    mounted = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [decision, setDecision] = useState<Decision | null>(null);
  useEffect(() => {
    if (decision && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [decision]);
  useEffect(() => {
    mounted.current = true;
    const outside = (e: PointerEvent) => {
      if (dialog.current?.open) return;
      if (e.target instanceof Node && !menu.current?.contains(e.target))
        menu.current?.removeAttribute('open');
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      mounted.current = false;
      document.removeEventListener('pointerdown', outside);
      readRelease.current?.();
      downloadRelease.current?.();
      decisionRelease.current?.();
    };
  }, []);
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
        if (kind === 'import' && menu.current?.open) input.current?.focus();
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
      state.workspace?.current.roomRevision !== accepted.revision
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
        next.workspace?.current.roomRevision === revision
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
    downloadRelease.current?.();
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = controller.ownResource(() => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    });
    if (!release) return;
    downloadRelease.current = release;
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'roomedy-project.json';
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
  return (
    <>
      <details
        ref={menu}
        className={styles.projectMenu}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            menu.current?.removeAttribute('open');
            menu.current?.querySelector('summary')?.focus();
          }
        }}
      >
        <summary>Project</summary>
        <div className={styles.projectOptions}>
          <p>
            JSON includes Current, Before and measurement labels. No photos,
            chat or Undo history.
          </p>
          <div className={styles.projectFileActions}>
            <button onClick={download}>Export project</button>
            <label className={styles.projectImport}>
              Import project
              <input
                ref={input}
                type="file"
                aria-label="Import project"
                aria-describedby={fileHintId}
                accept=".json,application/json"
                disabled={busy}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  e.currentTarget.value = '';
                  if (file) void load(file);
                }}
              />
            </label>
          </div>
          <p id={fileHintId}>JSON · up to 1 MiB</p>
          {busy && <p role="status">Reading project…</p>}
          {message && <p role="alert">{message}</p>}
          <hr />
          <button onClick={() => reviewDecision('reset')}>
            Start a new room
          </button>
        </div>
      </details>
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
              Before layout is included.
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
