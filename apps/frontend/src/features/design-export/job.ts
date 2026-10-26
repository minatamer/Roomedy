import type { EstimateVersion, Project } from '@roomedy/contracts/project';
import { freezeVersion } from '../cost/versions';
import { POLICY } from '@roomedy/contracts/policy';
import type { SessionController } from '../session/controller';
import { projectOf } from '../session/project';
import { DesignExportError, withExportSignal } from './facts';
const active = new WeakSet<SessionController>();
export interface ExportPort {
  project: Project;
  estimate?: EstimateVersion;
  signal: AbortSignal;
  progress: (text: string) => void;
  check: () => void;
}
/** Accepted snapshot only; no late download after edits, lifecycle retirement or cancellation. */
export function startDesignExport(
  controller: SessionController,
  run: (port: ExportPort) => Promise<Blob>,
  deliver: (blob: Blob) => void,
  progress: (text: string) => void,
  deadlineMs: number = POLICY.designExportMs,
  target?: { estimateId: string },
) {
  if (active.has(controller)) throw new DesignExportError('busy');
  if (!controller.checkExpiry()) throw new DesignExportError('changed');
  const start = controller.getSnapshot(),
    project = projectOf(start);
  if (!project) throw new DesignExportError('changed');
  const saved = target
    ? project.versions.find((v) => v.id === target.estimateId)
    : undefined;
  if (target && !saved) throw new DesignExportError('changed');
  const estimate = saved ? freezeVersion(saved) : undefined;
  const selectedProject = estimate
    ? {
        ...project,
        current: estimate.room,
        cost: estimate.pricing,
        versions: [estimate],
      }
    : project;
  const abort = new AbortController();
  let reason: 'cancelled' | 'changed' | 'failed' = 'cancelled',
    retired = false;
  const cancel = (code: typeof reason = 'cancelled') => {
    reason = code;
    abort.abort();
  };
  const current = () => {
    const s = controller.getSnapshot();
    return (
      controller.checkExpiry() &&
      s.phase === 'editor' &&
      s.generation === start.generation &&
      s.workspace?.workspaceId === start.workspace?.workspaceId &&
      (!estimate || s.destination === start.destination) &&
      (estimate
        ? s.estimateVersions.some((v) => v.id === estimate.id)
        : s.workspace?.current.roomRevision ===
          start.workspace?.current.roomRevision)
    );
  };
  const check = () => {
    if (abort.signal.aborted) throw new DesignExportError(reason);
    if (!current()) throw new DesignExportError('changed');
  };
  const own = controller.ownResource(() => {
    retired = true;
    cancel('changed');
  });
  if (!own) throw new DesignExportError('changed');
  active.add(controller);
  const unsubscribe = controller.subscribe(() => {
    if (!current()) cancel('changed');
  });
  const timer = setTimeout(
    () => cancel('failed'),
    Math.min(deadlineMs, POLICY.designExportMs),
  );
  const completion = (async () => {
    let pending: Promise<Blob> | undefined;
    try {
      check();
      pending = Promise.resolve().then(() => {
        check();
        return run({
          project: selectedProject,
          ...(estimate ? { estimate } : {}),
          signal: abort.signal,
          progress: (text) => {
            if (!abort.signal.aborted && !retired) progress(text);
          },
          check,
        });
      });
      void pending
        .finally(() => active.delete(controller))
        .catch(() => undefined);
      const blob = await withExportSignal(pending, abort.signal);
      check();
      if (blob.size > POLICY.designExportPdfBytes)
        throw new DesignExportError('too-large');
      deliver(blob);
    } catch (error) {
      if (abort.signal.aborted) throw new DesignExportError(reason);
      throw error;
    } finally {
      clearTimeout(timer);
      unsubscribe();
      own();
      if (!pending) active.delete(controller);
    }
  })();
  return { cancel: () => cancel(), completion };
}
