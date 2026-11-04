export const EXPORT_FORMATS = [
  {
    kind: 'pdf',
    title: 'PDF portfolio',
    extension: '.pdf',
    text: 'Room views, finishes and furniture. Includes costs and shopping details after Estimate.',
  },
  {
    kind: 'glb',
    title: '3D model',
    extension: '.glb',
    text: 'Room geometry, furniture and materials for 3D design tools.',
  },
  {
    kind: 'obj',
    title: 'OBJ model',
    extension: '.zip',
    text: 'OBJ geometry, MTL materials and textures for compatible 3D tools.',
  },
  {
    kind: 'project',
    title: 'Editable project',
    extension: '.json',
    text: 'Reopen Current, Before, measurements, draft prices and saved estimates. No photos, chat or Undo.',
  },
] as const;
export type DesignExportKind = 'pdf' | 'glb' | 'obj';
export type ExportCode =
  | 'cancelled'
  | 'changed'
  | 'busy'
  | 'too-large'
  | 'graphics'
  | 'failed'
  | 'unsupported-text';
export class DesignExportError extends Error {
  constructor(readonly code: ExportCode) {
    super(code);
  }
}
export const exportFailureText: Record<ExportCode, string> = {
  'unsupported-text':
    'This English estimate PDF supports Latin text. Use Latin names/notes for this export, or keep the editable project with the original text. Arabic/RTL PDF output is not supported yet.',
  cancelled: 'Export cancelled. Your room is unchanged.',
  changed: 'The room changed. Export again to include your latest design.',
  busy: 'An export is already being prepared.',
  'too-large':
    'This design exceeds the export limit. Your editable project is still available.',
  graphics:
    'Room views could not be rendered. Try again, or save the editable project.',
  failed: 'The export could not be created. Try again; your room is unchanged.',
};
/** Abort only presentation work; a late result never obtains download authority. */
export function withExportSignal<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    const clear = () => {
      done = true;
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      if (done) return;
      clear();
      reject(new DesignExportError('cancelled'));
    };
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      (value) => {
        if (done) return;
        clear();
        resolve(value);
      },
      (error: unknown) => {
        if (done) return;
        clear();
        reject(error);
      },
    );
    if (signal.aborted) abort();
  });
}
