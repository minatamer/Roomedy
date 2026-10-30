import type { VisitorAction } from '@roomedy/contracts/commands';

function slot(action: VisitorAction): string | null {
  switch (action.type) {
    case 'set-furniture-materials':
    case 'set-opening-materials':
    case 'move':
    case 'rotate':
    case 'resize':
    case 'finish':
    case 'set-size-estimate':
    case 'set-locks':
    case 'set-preference':
    case 'set-ownership':
    case 'update-feature':
      return `${action.type}/${action.id}`;
    case 'set-room-surface':
      return `${action.type}/${action.surface}`;
    case 'confirm-measurement':
      return `${action.type}/${JSON.stringify(action.target)}`;
    case 'set-intent':
    case 'set-bedroom-theme':
      return action.type;
    default:
      return null;
  }
}
/** Coalesce adjacent absolute edits only. Never reorder locks, themes or other commands. */
export function appendInspectorEdits(
  previous: readonly VisitorAction[][],
  incoming: readonly VisitorAction[],
): VisitorAction[][] {
  const batches = structuredClone(previous) as VisitorAction[][];
  const batch = batches.at(-1);
  const last = batch?.length === 1 ? batch[0] : undefined;
  const action = incoming.length === 1 ? incoming[0] : undefined;
  if (last && action && slot(action) !== null && slot(last) === slot(action)) {
    let merged = structuredClone(action);
    if (last.type === 'set-furniture-materials' && action.type === last.type)
      merged = {
        ...action,
        materials: { ...last.materials, ...action.materials },
      };
    else if (last.type === 'set-opening-materials' && action.type === last.type)
      merged = {
        ...action,
        materials: { ...last.materials, ...action.materials },
      };
    else if (last.type === 'set-room-surface' && action.type === last.type)
      merged = { ...last, ...action };
    batch![0] = merged;
  } else if (incoming.length)
    batches.push(structuredClone(incoming) as VisitorAction[]);
  return batches;
}
