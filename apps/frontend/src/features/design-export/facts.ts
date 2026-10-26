import { furnitureBottom } from '@roomedy/spatial';
import type { Project } from '@roomedy/contracts/project';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
export const EXPORT_FORMATS = [
  {
    kind: 'pdf',
    title: 'PDF portfolio',
    extension: '.pdf',
    text: 'A designed book of room views, your plan, finishes and furniture.',
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
export const styleLabel = (room: RoomDocument) =>
  ({
    'warm-simple': 'Warm & simple',
    'light-airy': 'Light & airy',
    'calm-focused': 'Calm & focused',
  })[room.intent.style];
export function measurement(value: RoomDocument['room']['width']) {
  if (value.value === null) return 'Not recorded';
  return `${value.status === 'confirmed' ? '' : '~'}${(value.value / 1000).toLocaleString('en', { maximumFractionDigits: 3 })} m`;
}
export function portfolioFacts(project: Project) {
  const room = project.current,
    baseline = project.baseline;
  const moved = room.furniture.filter((p) => {
    const old = baseline.furniture.find((f) => f.id === p.id);
    return (
      old &&
      (old.pose.centerX !== p.pose.centerX ||
        old.pose.centerZ !== p.pose.centerZ ||
        furnitureBottom(old) !== furnitureBottom(p) ||
        old.pose.quarterTurns !== p.pose.quarterTurns)
    );
  }).length;
  const added = room.furniture.filter(
    (p) => !baseline.furniture.some((f) => f.id === p.id),
  ).length;
  const goalNames = {
    sleep: 'rest',
    work: 'focused work',
    storage: 'storage',
    'open-space': 'open space',
  };
  const goals = room.intent.goals.map((g) => goalNames[g]);
  const summary = goals.length
    ? `A room planned for ${goals.join(', ')}.`
    : 'A considered arrangement for everyday living.';
  const area =
    room.room.width.value !== null && room.room.depth.value !== null
      ? `${room.room.width.status === 'confirmed' && room.room.depth.status === 'confirmed' ? '' : '~'}${((room.room.width.value * room.room.depth.value) / 1_000_000).toFixed(1)} m²`
      : 'Room dimensions to review';
  const inventory = Array.from(
    { length: Math.ceil(room.furniture.length / 16) },
    (_, i) => room.furniture.slice(i * 16, i * 16 + 16),
  );
  if (3 + inventory.length > POLICY.designExportPages)
    throw new DesignExportError('too-large');
  return {
    room,
    style: styleLabel(room),
    summary,
    area,
    dimensions: `${measurement(room.room.width)} × ${measurement(room.room.depth)}`,
    moved,
    added,
    inventory,
    pages: 3 + inventory.length,
    uncertain: [room.room.width, room.room.depth, room.room.height].some(
      (v) => v.status !== 'confirmed',
    ),
    missingSize: room.furniture.filter(
      (p) =>
        furnitureBottom(p) === null ||
        Object.values(p.dimensions).some((v) => v.value === null),
    ).length,
  };
}

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
