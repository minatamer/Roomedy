export type MedyControl =
  | { type: 'view'; view: 'plan' | 'cutaway' }
  | {
      type: 'camera';
      kind:
        | 'zoom-in'
        | 'zoom-out'
        | 'fit'
        | 'overview'
        | 'doorway'
        | 'work-area'
        | 'corner'
        | 'left'
        | 'right'
        | 'up'
        | 'down'
        | 'forward'
        | 'backward';
    }
  | { type: 'arrange'; enabled: boolean }
  | { type: 'snap'; enabled: boolean }
  | { type: 'select'; id: string | null }
  | {
      type: 'panel';
      panel: 'inventory' | 'catalogue' | 'room' | 'checks' | 'assistant';
    }
  | { type: 'tour' }
  | {
      type: 'project';
      action: 'export' | 'import' | 'new';
      format: 'pdf' | 'glb' | 'obj' | 'project' | null;
    }
  | { type: 'apply' | 'cancel' | 'undo' };
export type MedyControlResult = { ok: boolean; summary: string };
/** These are application controls, not model-selected executable code or selectors. */
export function medyControl(text: string): MedyControl | null {
  const t = text
    .replace(/^(?:can|could|would) you\s+/, '')
    .replace(/[?.!]+$/, '')
    .trim();
  if (
    /^(?:apply|accept|keep)(?: (?:it|that|this|the changes|the preview|the proposal|these changes))?$/.test(
      t,
    )
  )
    return { type: 'apply' };
  if (
    /^(?:cancel|discard|reject)(?: (?:it|that|this|the changes|the preview|the proposal|these changes))?$/.test(
      t,
    )
  )
    return { type: 'cancel' };
  if (
    /^(?:undo|undo (?:that|it|the last change|last change)|reverse the last change)$/.test(
      t,
    )
  )
    return { type: 'undo' };
  if (
    /^(?:(?:start|show|give|restart|replay|open|take) (?:me )?(?:(?:the|a|quick|short) )*(?:tour|guide)(?: (?:again|of the studio|of the editor))?|tour|show me around|how do i use (?:this|the studio|the editor))$/.test(
      t,
    )
  )
    return { type: 'tour' };
  if (
    /^(?:switch|change|go|show|open)(?: (?:me|the|to|view|room|in))* (?:2d|plan)(?: view| plan)?$|^2d$/.test(
      t,
    )
  )
    return { type: 'view', view: 'plan' };
  if (
    /^(?:switch|change|go|show|open)(?: (?:me|the|to|view|room|in))* (?:3d|cutaway)(?: view)?$|^3d$/.test(
      t,
    )
  )
    return { type: 'view', view: 'cutaway' };
  if (
    /^(?:zoom in|move closer|get closer|closer(?: view)?|zoom closer)(?: (?:a bit|please))?$/.test(
      t,
    )
  )
    return { type: 'camera', kind: 'zoom-in' };
  if (
    /^(?:zoom out|move (?:the camera )?away|zoom back|wider view)(?: a bit)?$/.test(
      t,
    )
  )
    return { type: 'camera', kind: 'zoom-out' };
  if (
    /^(?:fit (?:the )?room|reset (?:the )?(?:view|camera)|show (?:the )?whole room)$/.test(
      t,
    )
  )
    return { type: 'camera', kind: 'fit' };
  const view = t.match(
    /^(?:(?:show|open|go to|view|look from|take me to)(?: (?:me|the))? )?(overview|doorway|work area|corner)(?: view)?$/,
  );
  if (view)
    return {
      type: 'camera',
      kind: view[1]!.replace(' ', '-') as
        'overview' | 'doorway' | 'work-area' | 'corner',
    };
  const direction = t.match(
    /^(?:pan|look|orbit|turn (?:the )?camera|move (?:the )?camera) (left|right|up|down)$/,
  );
  if (direction)
    return {
      type: 'camera',
      kind: direction[1] as 'left' | 'right' | 'up' | 'down',
    };
  const step = t.match(
    /^(?:step|walk|move) (?:the camera )?(forward|back|backward)$/,
  );
  if (step)
    return {
      type: 'camera',
      kind: step[1] === 'forward' ? 'forward' : 'backward',
    };
  if (
    /^(?:start arranging|arrange (?:the )?room|switch to arrange(?: room)?|edit mode)$/.test(
      t,
    )
  )
    return { type: 'arrange', enabled: true };
  if (
    /^(?:explore(?: (?:the )?room| view)?|switch to explore(?: view)?)$/.test(t)
  )
    return { type: 'arrange', enabled: false };
  const snap = t.match(
    /^(?:turn|switch|set) (?:the )?(?:snap|snapping|placement snap) (on|off)$|^(enable|disable) (?:snap|snapping)$/,
  );
  if (snap)
    return { type: 'snap', enabled: snap[1] === 'on' || snap[2] === 'enable' };
  if (/^(?:deselect(?: everything| all| it)?|clear selection)$/.test(t))
    return { type: 'select', id: null };
  if (
    /^(?:show|open)(?: (?:me|the))? (?:medy|assistant|chat)(?: panel)?$/.test(t)
  )
    return { type: 'panel', panel: 'assistant' };
  if (
    /^(?:show|open)(?: (?:me|the|my))* (?:furniture|inventory)(?: panel)?$/.test(
      t,
    )
  )
    return { type: 'panel', panel: 'inventory' };
  if (
    /^(?:show|open)(?: (?:me|the))? (?:catalogue|catalog|add a piece)(?: panel)?$/.test(
      t,
    )
  )
    return { type: 'panel', panel: 'catalogue' };
  if (
    /^(?:show|open)(?: (?:me|the))? (?:room|room settings|room measurements|measurements)(?: panel)?$/.test(
      t,
    )
  )
    return { type: 'panel', panel: 'room' };
  if (
    /^(?:show|open)(?: (?:me|the))? (?:checks|room checks|issues)(?: panel)?$/.test(
      t,
    )
  )
    return { type: 'panel', panel: 'checks' };
  if (/^(?:start|create|open) (?:a )?new room$|^start over$/.test(t))
    return { type: 'project', action: 'new', format: null };
  if (
    /^(?:import|open|load) (?:a |my |the )?(?:project|project file|saved project)$/.test(
      t,
    )
  )
    return { type: 'project', action: 'import', format: null };
  if (
    /^(?:export|download|save)(?: (?:my|the|this|a|as|to|design|room|portfolio|model|editable|3d))* (?:pdf|glb|obj|json|project)(?: (?:file|model|portfolio|project))?$|^(?:export|download)(?: (?:my|the))? (?:design|room)$/.test(
      t,
    )
  ) {
    const format = /\bpdf\b/.test(t)
      ? 'pdf'
      : /\bglb\b/.test(t)
        ? 'glb'
        : /\bobj\b/.test(t)
          ? 'obj'
          : /\b(json|project)\b/.test(t)
            ? 'project'
            : null;
    return { type: 'project', action: 'export', format };
  }
  return null;
}
