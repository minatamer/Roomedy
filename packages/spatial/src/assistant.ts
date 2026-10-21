import type { AssistantReply } from '@roomedy/contracts/assistant';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { ActionScope, ProposalAction } from '@roomedy/contracts/commands';
import type { SearchGoal } from '@roomedy/contracts/search';
import type { SearchResult } from '@roomedy/contracts/search';
import { findCatalogueEntry, CATALOGUE } from './catalogue.js';
import { checkRoom } from './checks.js';
import { designerRequest, designPalette, designSuggestions } from './design.js';
import type { DesignTurn } from './design.js';
import { medyCommandWords } from './medy-language.js';
import { requestedCatalogueSize } from './size-presets.js';

const clarificationLabel =
  'Which change would help: move the work area by a window, rearrange owned pieces, choose furniture, or preview a finish?';

export interface AssistantTask {
  kind:
    | 'search'
    | 'edits'
    | 'explain'
    | 'catalogue'
    | 'clarify'
    | 'unsupported'
    | 'control'
    | 'undo'
    | 'conversation';
  interpret?: boolean;
  label: string;
  scope: ActionScope;
  goal: SearchGoal | null;
  actions: ProposalAction[] | null;
  objectIds: string[];
  question: AssistantReply['question'];
  control: AssistantReply['control'];
  extraFinish: Extract<ProposalAction, { type: 'room-finish' }> | null;
}
export function emptyAssistantReply(
  room: RoomDocument,
  summary: string,
  kind: AssistantReply['kind'] = 'explanation',
): AssistantReply {
  return {
    kind,
    summary,
    actions: null,
    objectIds: [],
    catalogueIds: [],
    checks: checkRoom(room),
    facts: null,
    question: null,
    control: null,
    blockedIssue: null,
  };
}
/** Same factual alternative in browser/backend; no candidate is never a fabricated success. */
export function assistantSearchFallback(
  room: RoomDocument,
  task: AssistantTask,
  found: SearchResult,
): AssistantReply {
  if (found.question)
    return {
      ...emptyAssistantReply(
        room,
        'Review this measurement so I can check the arrangement.',
        'visitor-action',
      ),
      objectIds: [found.question.id],
      question: found.question,
      control: 'measurement',
    };
  const finish = task.goal?.pieceFinishes.find((f) => {
    const piece = room.furniture.find((p) => p.id === f.id);
    return (
      piece &&
      !findCatalogueEntry(
        piece.catalogueId,
        piece.catalogueVersion,
      )?.finishes.includes(f.finish)
    );
  });
  if (finish) {
    const piece = room.furniture.find((p) => p.id === finish.id)!,
      entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)!;
    return {
      ...emptyAssistantReply(
        room,
        `${piece.label} offers ${entry.finishes.join(', ')}. Which of those finishes would you like?`,
        'clarification',
      ),
      objectIds: [piece.id],
    };
  }
  const locked = room.furniture.find(
    (p) =>
      task.objectIds.includes(p.id) && (p.locks.position || p.locks.rotation),
  );
  const palette =
    room.room.floorFinish === 'walnut' && room.room.wallFinish === 'ivory'
      ? 'light'
      : 'calm';
  const suggestions = designSuggestions(room, {
    goal: 'palette',
    targetIds: [],
    categories: [],
    finish: null,
    palette,
  });
  if (locked && found.alternatives.includes('review-lock'))
    return {
      ...emptyAssistantReply(
        room,
        `${locked.label} is protected. Review its lock, or try a palette change.`,
        'visitor-action',
      ),
      objectIds: [locked.id],
      control: locked.locks.position ? 'position-lock' : 'rotation-lock',
      suggestions,
    };
  if (task.goal?.additions.length || task.goal?.replacements.length)
    return {
      ...emptyAssistantReply(
        room,
        'I haven’t found a layout for those pieces with the current constraints. Try fewer essentials or review the offered sizes.',
      ),
      catalogueIds: [
        ...new Set(
          [
            ...(task.goal.additions ?? []),
            ...(task.goal.replacements ?? []),
          ].map((p) => p.catalogueId),
        ),
      ].slice(0, 8),
      objectIds: task.objectIds,
    };
  return {
    ...emptyAssistantReply(
      room,
      'I haven’t found an improvement with the current constraints. We can try a palette change, or review the pieces you want to move.',
    ),
    objectIds: task.objectIds,
    suggestions,
  };
}
/** Pure application policy, not model-generated authority. Unresolved language is clarified before any mutation capability exists. */
function resolveExplicitTask(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
  operationId: string,
): AssistantTask {
  const t = text.toLowerCase().replace(/[’]/g, "'").trim();
  const scope: ActionScope = {
    roomId: room.roomId,
    roomRevision: room.roomRevision,
    actionKinds: [],
    targetIds: [],
    additions: [],
    replacements: [],
    removals: [],
    roomFinishes: false,
  };
  const task: AssistantTask = {
    kind: 'clarify',
    label: clarificationLabel,
    scope,
    goal: null,
    actions: null,
    objectIds: [],
    question: null,
    control: null,
    extraFinish: null,
  };
  if (
    /\b(price|budget|shopping|retailer|buy|cost|dollars?|euros?|afford)\b|[$€£]/.test(
      t,
    )
  )
    return {
      ...task,
      kind: 'unsupported',
      label: 'I can help with furniture sizes, layouts and finishes.',
    };
  if (
    /\b(undo|reverse the last change)\b/.test(t) &&
    !/\b(do not|don't|never)\b/.test(t)
  )
    return {
      ...task,
      kind: 'undo',
      label: 'Undo the latest room change using the shared history?',
      control: 'undo',
    };
  const pieces = room.furniture,
    selected = pieces.find((p) => p.id === selectedId);
  const category = (id: string) => {
    const p = pieces.find((p) => p.id === id);
    return p
      ? findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category
      : undefined;
  };
  const named = pieces.filter((p) => t.includes(p.label.toLowerCase()));
  const types = [
    'bed',
    'desk',
    'chair',
    'wardrobe',
    'storage',
    'mirror',
    'tv',
    'seating',
    'table',
    'lighting',
  ] as const;
  const mentioned = types.filter((c) =>
    new RegExp('\\b' + c + 's?\\b').test(t),
  );
  const referenced = named.length
    ? named
    : pieces.filter((p) => mentioned.includes(category(p.id)!));
  if (
    /\b(explain|check|why|problem|warning|clearance|measure|help)\b/.test(t) &&
    !/\b(move|add|furnish|rearrange|replace|remove)\b/.test(t)
  )
    return {
      ...task,
      kind: 'explain',
      label: 'Here are the current modeled checks and their missing inputs.',
      objectIds: selected ? [selected.id] : referenced.map((p) => p.id),
    };
  if (
    /\b(show|choose|which|find)\b.*\b(furniture|desk|bed|chair|wardrobe|storage)\b/.test(
      t,
    ) &&
    !/\b(move|add|furnish|rearrange)\b/.test(t)
  )
    return {
      ...task,
      kind: 'catalogue',
      label:
        'These are the supported similar representations. Their offered dimensions are not measurements of furniture you own.',
    };
  // Negation and mixed exclusion wording need an explicit narrower goal instead of substring-based authority.
  if (
    /\b(don't|do not|never|except|without|instead|ignore|unlock|confirm)\b/.test(
      t,
    )
  )
    return {
      ...task,
      label:
        'Choose the exact pieces and action to change. Existing locks and measured dimensions will stay protected.',
      objectIds: referenced.map((p) => p.id),
    };
  const goal: SearchGoal = {
    kind: 'rearrange-owned',
    targetIds: [],
    retainedIds: pieces.filter((p) => p.preference === 'keep').map((p) => p.id),
    fixedIds: pieces.filter((p) => p.locks.position).map((p) => p.id),
    windowId: null,
    additions: [],
    replacements: [],
    removals: [],
    roomFinish: null,
    pieceFinishes: [],
  };
  const appearance =
    /\b(warm|warmer|warm-simple|light|airy|light-airy|calm|focused|calm-focused|palette|finish|oak|ivory|walnut|clay|sage|charcoal)\b/.test(
      t,
    ) &&
    /\b(make|feel|preview|palette|finish|warm|calm|airy|focused)\b/.test(t);
  const preset = designPalette(
    /\b(calm|focused|calm-focused)\b/.test(t)
      ? 'calm'
      : /\b(warm|warmer|warm-simple)\b/.test(t)
        ? 'warm'
        : 'light',
  );
  const adding = /\b(add|need|furnish)\b/.test(t);
  if (
    /\b(rotate|turn)\b/.test(t) &&
    !/\b(move|add|remove|replace|finish)\b/.test(t)
  ) {
    const targets =
      selected && /\b(this|that|selected|it)\b/.test(t)
        ? [selected]
        : referenced;
    const degrees = t.match(/\b(\d+(?:\.\d+)?)\s*(?:degrees?|°)?/);
    if (
      targets.length !== 1 ||
      (degrees &&
        (!['90', '180', '270'].includes(degrees[1]!) ||
          [...t.matchAll(/\d+(?:\.\d+)?/g)].length !== 1)) ||
      /\b(or|and)\b/.test(t) ||
      /[-−]\s*\d/.test(t)
    )
      return {
        ...task,
        label: 'Select one piece and choose a 90, 180 or 270 degree turn.',
        objectIds: targets.map((p) => p.id),
      };
    const p = targets[0]!;
    if (p.locks.rotation)
      return {
        ...task,
        kind: 'control',
        label: `${p.label} has a rotation lock. Review it before turning the piece.`,
        objectIds: [p.id],
        control: 'rotation-lock',
      };
    const turns = degrees
      ? Number(degrees[1]) / 90
      : /\baround\b/.test(t)
        ? 2
        : 1;
    const directed = /\b(counterclockwise|anticlockwise)\b/.test(t)
      ? -turns
      : turns;
    scope.actionKinds = ['rotate'];
    scope.targetIds = [p.id];
    return {
      ...task,
      kind: 'edits',
      label: `Turn ${p.label}`,
      objectIds: [p.id],
      actions: [
        {
          type: 'rotate',
          id: p.id,
          quarterTurns: ((p.pose.quarterTurns + directed + 4) % 4) as
            0 | 1 | 2 | 3,
        },
      ],
    };
  }
  if (/\b(remove|replace)\b/.test(t)) {
    const targetText = t.split(/\bwith\b/)[0]!;
    const targetTypes = types.filter((c) =>
      new RegExp('\\b' + c + 's?\\b').test(targetText),
    );
    const targetNames = pieces.filter((p) =>
      targetText.includes(p.label.toLowerCase()),
    );
    const targets =
      selected && /\b(this|that|selected)\b/.test(targetText)
        ? [selected]
        : targetNames.length
          ? targetNames
          : pieces.filter((p) => targetTypes.includes(category(p.id)!));
    if (targets.length !== 1)
      return {
        ...task,
        label:
          'Which single piece should be removed or replaced? Choose its card first.',
        objectIds: targets.map((p) => p.id),
      };
    const target = targets[0]!;
    if (Object.values(target.locks).some(Boolean))
      return {
        ...task,
        kind: 'control',
        label: `${target.label} is protected by a lock. Review its independent locks before removal or replacement.`,
        objectIds: [target.id],
        control: target.locks.position
          ? 'position-lock'
          : target.locks.rotation
            ? 'rotation-lock'
            : 'dimensions-lock',
      };
    if (
      target.preference === 'keep' ||
      (target.ownership === 'owned' && target.preference !== 'replace')
    )
      return {
        ...task,
        kind: 'control',
        label: `${target.label} is protected as retained furniture. Mark May replace explicitly before asking to remove or replace it.`,
        objectIds: [target.id],
        control: 'preference',
      };
    scope.targetIds = [target.id];
    if (/\bremove\b/.test(t)) {
      scope.actionKinds = ['remove'];
      scope.removals = [target.id];
      return {
        ...task,
        kind: 'edits',
        label: `Remove ${target.label} from plan`,
        actions: [{ type: 'remove', id: target.id }],
        objectIds: [target.id],
      };
    }
    const replacementText = t.split(/\bwith\b/)[1];
    if (!replacementText)
      return {
        ...task,
        label: 'Which supported representation should replace this piece?',
        objectIds: [target.id],
      };
    const replacementTypes = types.filter((c) =>
      new RegExp('\\b' + c + 's?\\b').test(replacementText),
    );
    if (replacementTypes.length !== 1)
      return {
        ...task,
        label:
          'Choose a supported piece, such as a bed, desk, wardrobe, mirror, drawer shelf or TV.',
        objectIds: [target.id],
      };
    const entry = CATALOGUE.find((e) => e.category === replacementTypes[0])!;
    let size = null;
    if (/\bsmaller\b/.test(replacementText)) {
      const width = target.dimensions.width.value,
        depth = target.dimensions.depth.value;
      if (width === null || depth === null)
        return {
          ...task,
          kind: 'control',
          label:
            'Measure the existing footprint before comparing a smaller replacement.',
          objectIds: [target.id],
          question: {
            id: target.id,
            field: width === null ? 'width' : 'depth',
          },
          control: 'measurement',
        };
      if (entry.size.width.min >= width)
        return {
          ...task,
          label:
            'This catalogue has no narrower supported variant for that footprint. Choose another representation.',
          objectIds: [target.id],
        };
      size = {
        width: Math.max(
          entry.size.width.min,
          Math.min(entry.size.width.default, width - 100),
        ),
        depth: Math.max(
          entry.size.depth.min,
          Math.min(entry.size.depth.default, depth),
        ),
        height: entry.size.height.default,
      };
    }
    const choice = { id: target.id, catalogueId: entry.id, size, finish: null };
    goal.kind = 'add';
    goal.replacements = [choice];
    goal.targetIds = [target.id];
    scope.actionKinds = ['replace'];
    scope.replacements = [{ id: target.id, catalogueId: entry.id }];
    return {
      ...task,
      kind: 'search',
      label: `Replace ${target.label}`,
      goal,
      objectIds: [target.id],
    };
  }
  if (
    appearance &&
    !/\b(move|add|need|furnish|rearrange|remove|replace)\b/.test(t)
  ) {
    goal.kind = 'appearance';
    const finish = t.match(/\b(oak|ivory|walnut|clay|sage|charcoal)\b/)?.[1] as
      RoomDocument['room']['floorFinish'] | undefined;
    const piece =
      selected && /\b(this|that|selected)\b/.test(t)
        ? selected
        : referenced.length === 1
          ? referenced[0]
          : null;
    if (finish && piece && !/\b(room|wall|floor)\b/.test(t)) {
      goal.pieceFinishes = [{ id: piece.id, finish }];
      scope.actionKinds = ['finish'];
      scope.targetIds = [piece.id];
      return {
        ...task,
        kind: 'search',
        label: `Preview ${piece.label} in ${finish}`,
        goal,
        objectIds: [piece.id],
      };
    }
    if (/\bfinish\b/.test(t) && !/\b(warm|calm|light|airy|focused)\b/.test(t))
      return {
        ...task,
        label:
          'Choose a supported room direction, or select a piece and name oak, ivory, walnut, clay, sage or charcoal.',
      };
    goal.roomFinish = preset;
    const furnitureFinish = /\b(light|airy)\b/.test(t)
      ? ('ivory' as const)
      : /\b(calm|focused)\b/.test(t)
        ? ('walnut' as const)
        : ('oak' as const);
    goal.pieceFinishes = pieces
      .filter(
        (p) =>
          p.ownership === 'proposed' &&
          findCatalogueEntry(
            p.catalogueId,
            p.catalogueVersion,
          )?.finishes.includes(furnitureFinish),
      )
      .map((p) => ({ id: p.id, finish: furnitureFinish }));
    scope.targetIds = goal.pieceFinishes.map((p) => p.id);
    scope.actionKinds = goal.pieceFinishes.length
      ? ['room-finish', 'finish']
      : ['room-finish'];
    scope.roomFinishes = true;
    return { ...task, kind: 'search', label: 'Preview room finishes', goal };
  }
  if (adding) {
    const additionClauses = [
      ...t.matchAll(/\b(?:add|need|furnish)\b([^.!?;]*)/g),
    ]
      .map(
        (match) =>
          match[1]!.split(
            /\b(?:keep|keeping|preserve|retain|leave|move|replace|remove|but|near|by|beside|around|next|under)\b/,
          )[0]!,
      )
      .join(' ');
    const additionTypes = types.filter((c) =>
      new RegExp('\\b' + c + 's?\\b').test(additionClauses),
    );
    if (
      /\b(?:two|three|four|five|six|\d+)\s+(?:beds?|desks?|chairs?|wardrobes?)\b/.test(
        additionClauses,
      ) ||
      /\b(?:beds|desks|chairs|wardrobes)\b/.test(additionClauses)
    )
      return {
        ...task,
        label:
          'Add one of each named essential at a time, or choose repeated pieces in the catalogue. Which single piece should I add first?',
      };
    if (!additionTypes.length)
      return {
        ...task,
        label:
          'What would you like to add: a bed, desk, wardrobe, mirror, drawer storage or TV?',
      };
    if (/\b(replace|remove|move)\b/.test(t))
      return {
        ...task,
        label:
          'Choose the addition first, then the pieces to move or replace. I will keep the current furniture protected.',
      };
    goal.kind = pieces.length ? 'add' : 'furnish';
    for (const [i, c] of additionTypes.entries()) {
      const namedEntry = CATALOGUE.find(
        (e) => e.category === c && t.includes(e.label.toLowerCase()),
      );
      const entry = namedEntry ?? CATALOGUE.find((e) => e.category === c)!;
      const requested = requestedCatalogueSize(
        entry,
        medyCommandWords(room, t),
      );
      if (requested.error) return { ...task, label: requested.error };
      if (additionTypes.length > 1 && requested.size)
        return {
          ...task,
          label:
            'Let’s add the piece with its exact size first, then the other essentials. Which one should use those dimensions?',
        };
      const choice = {
        id: `added_${operationId}_${i}`,
        catalogueId: entry.id,
        size: requested.size,
        finish:
          entry.finishes.find((finish) =>
            new RegExp(`\\b${finish}\\b`).test(t),
          ) ??
          (appearance && entry.finishes.includes(preset.floorFinish)
            ? preset.floorFinish
            : null),
      };
      goal.additions.push(choice);
      scope.additions.push({ id: choice.id, catalogueId: choice.catalogueId });
    }
    scope.actionKinds = ['add'];
    if (/\bwindow\b/.test(t)) {
      const windows = room.room.features.filter((f) => f.kind === 'window');
      if (windows.length !== 1)
        return {
          ...task,
          label:
            'Choose one window in the plan, then ask for these essentials near it.',
          objectIds: windows.map((w) => w.id),
        };
      goal.windowId = windows[0]!.id;
    }
    if (appearance) {
      scope.actionKinds.push('room-finish');
      scope.roomFinishes = true;
      task.extraFinish = { type: 'room-finish', ...preset };
    }
    return { ...task, kind: 'search', label: 'Add selected essentials', goal };
  }
  if (/\b(rearrange|clear the entrance|more open space)\b/.test(t)) {
    const blockers = /\bclear the entrance\b/.test(t)
      ? new Set(
          checkRoom(room)
            .issues.filter(
              (issue) =>
                issue.rule === 'door-envelope' ||
                issue.rule === 'entry-connectivity',
            )
            .flatMap((issue) => issue.objectIds),
        )
      : null;
    goal.targetIds = pieces
      .filter((p) => p.ownership === 'owned' && !p.locks.position)
      .filter((p) => blockers === null || blockers.has(p.id))
      .map((p) => p.id);
    if (blockers !== null && goal.targetIds.length === 0)
      return {
        ...task,
        kind: 'explain',
        label:
          'Review the recorded entrance checks and missing doorway measurements before choosing a piece to move.',
      };
    scope.targetIds = [...goal.targetIds];
    scope.actionKinds = ['move', 'rotate'];
    return {
      ...task,
      kind: 'search',
      label: 'Rearrange owned furniture',
      goal,
      objectIds: [...goal.targetIds],
    };
  }
  if (/\b(move|put|bring)\b/.test(t)) {
    let targets =
      selected && /\b(this|that|selected)\b/.test(t) ? [selected] : referenced;
    const workArea = /\b(work area|desk and chair|desk.*chair)\b/.test(t);
    if (workArea) {
      targets = pieces.filter((p) =>
        ['desk', 'chair'].includes(category(p.id)!),
      );
      if (
        targets.filter((p) => category(p.id) === 'desk').length !== 1 ||
        targets.filter((p) => category(p.id) === 'chair').length > 1
      )
        return {
          ...task,
          label:
            'Which desk and chair form this work area? Choose their cards before coordinating them.',
          objectIds: targets.map((p) => p.id),
        };
    }
    if (!targets.length || (!workArea && targets.length !== 1))
      return {
        ...task,
        label:
          'Which piece do you want to move? Select it in the room or choose its card.',
        objectIds: targets.length
          ? targets.map((p) => p.id)
          : pieces.slice(0, 8).map((p) => p.id),
      };
    const locked = targets.find((p) => p.locks.position);
    if (locked)
      return {
        ...task,
        kind: 'control',
        label: `${locked.label} has a position lock. Review that control before requesting a move.`,
        objectIds: [locked.id],
        control: 'position-lock',
      };
    scope.targetIds = targets.map((p) => p.id);
    scope.actionKinds = ['move', 'rotate'];
    if (/\bwindow\b/.test(t)) {
      const windows = room.room.features.filter((f) => f.kind === 'window'),
        chosen = windows.find((f) => f.id === selectedId);
      if (!chosen && windows.length !== 1)
        return {
          ...task,
          label:
            'Which window should the work area use? Select one in the plan, then ask again.',
          objectIds: windows.map((w) => w.id),
        };
      goal.kind = 'window';
      goal.windowId = (chosen ?? windows[0])!.id;
      goal.targetIds = [...scope.targetIds];
      return {
        ...task,
        kind: 'search',
        label:
          targets.length > 1
            ? 'Move desk and chair near window'
            : 'Move desk near window',
        goal,
        objectIds: [...scope.targetIds],
      };
    }
    if (/\b(left|right)\b/.test(t)) {
      const p = targets[0]!;
      if (targets.length > 1)
        return {
          ...task,
          label: 'Choose one piece for a left/right move.',
          objectIds: targets.map((p) => p.id),
        };
      const w =
          p.pose.quarterTurns % 2
            ? p.dimensions.depth.value
            : p.dimensions.width.value,
        roomWidth = room.room.width.value;
      if (w === null || roomWidth === null)
        return {
          ...task,
          kind: 'control',
          label:
            'Confirm the room and piece footprint width before a wall-side move.',
          objectIds: [roomWidth === null ? room.roomId : p.id],
          question: {
            id: roomWidth === null ? room.roomId : p.id,
            field:
              roomWidth === null || p.pose.quarterTurns % 2 === 0
                ? 'width'
                : 'depth',
          },
          control: 'measurement',
        };
      const x = /\bleft\b/.test(t) ? w / 2 + 100 : roomWidth - w / 2 - 100;
      scope.actionKinds = ['move'];
      return {
        ...task,
        kind: 'edits',
        label: `Move ${p.label} to the ${/\bleft\b/.test(t) ? 'left' : 'right'}`,
        objectIds: [p.id],
        actions: [
          {
            type: 'move',
            id: p.id,
            pose: {
              centerX: x,
              centerZ: p.pose.centerZ,
              quarterTurns: p.pose.quarterTurns,
            },
          },
        ],
      };
    }
    return {
      ...task,
      label:
        'Move this piece near a window, to the left/right, or use its precise position fields.',
      objectIds: targets.map((p) => p.id),
    };
  }
  return task;
}

/** Understanding may use conversational context; exact edit authority remains application-owned. */
export function resolveAssistantTask(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
  operationId: string,
  context: readonly DesignTurn[] = [],
): AssistantTask {
  const conversationalText = text
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/^(?:hi|hey|hello)(?:\s+medy)?[\s,!:.–—-]+/i, '');
  const advice =
    (/^(?:what|how|why|should|do|does|is|are|any|suggest|recommend|tell me|i feel|i'm|i am)\b|^(?:can|could) i\b|^(?:can|could|would) you (?:suggest|recommend|explain|tell)\b|^would (?:this|that|it|a|the|my|we|i)\b|\b(?:whether|confirm if|verify if)\b/i.test(
      conversationalText,
    ) ||
      /\b(?:(?:can|could|may) we|let's|let us) (?:talk|chat|discuss)\b/i.test(
        conversationalText,
      )) &&
    !/\b(ignore|price|budget|shopping)\b/i.test(text);
  if (advice)
    return {
      ...resolveExplicitTask(room, '', null, operationId),
      kind: 'conversation',
      label: 'Talk through your room design',
    };
  const design = designerRequest(room, text, selectedId, context.slice(-40));
  const empty = () => resolveExplicitTask(room, '', null, operationId);
  if (design.clarification) return { ...empty(), label: design.clarification };
  const task = resolveExplicitTask(
    room,
    design.text,
    design.selectedId,
    operationId,
  );
  if (task.kind === 'search' && task.goal) {
    if (design.openSpace) {
      task.goal.kind = 'open-space';
      task.goal.targetIds = room.furniture
        .filter(
          (p) =>
            !p.locks.position &&
            (design.targets === null || design.targets.includes(p.id)),
        )
        .map((p) => p.id);
      task.scope.targetIds = [...task.goal.targetIds];
      task.objectIds = [...task.goal.targetIds];
      task.label = 'Open up the room';
    }
    if (design.excluded.length) {
      task.goal.fixedIds = [
        ...new Set([...task.goal.fixedIds, ...design.excluded]),
      ];
      task.goal.targetIds = task.goal.targetIds.filter(
        (id) => !design.excluded.includes(id),
      );
      task.scope.targetIds = task.scope.targetIds.filter(
        (id) => !design.excluded.includes(id),
      );
      task.objectIds = task.objectIds.filter(
        (id) => !design.excluded.includes(id),
      );
    }
    if (design.mood && task.goal.kind !== 'appearance') {
      task.extraFinish = { type: 'room-finish', ...designPalette(design.mood) };
      task.scope.roomFinishes = true;
      if (!task.scope.actionKinds.includes('room-finish'))
        task.scope.actionKinds.push('room-finish');
      task.label += ` with a ${design.mood} palette`;
    }
    if (
      !task.goal.targetIds.length &&
      !task.goal.additions.length &&
      !task.goal.replacements.length &&
      task.goal.kind !== 'appearance'
    ) {
      const locked = room.furniture.find(
        (p) =>
          p.locks.position &&
          (design.targets === null || design.targets.includes(p.id)),
      );
      if (locked)
        return {
          ...empty(),
          kind: 'control',
          label: `${locked.label} has a position lock. Review it before requesting a layout change.`,
          objectIds: [locked.id],
          control: 'position-lock',
        };
      return {
        ...empty(),
        label:
          'Which piece can change position? Review a position lock or choose a finish-only change.',
      };
    }
  }
  if (
    task.kind === 'clarify' &&
    task.label === clarificationLabel &&
    /\b(keep|keeping|leave|preserve|retain|only|just)\b/.test(
      text.toLowerCase(),
    )
  )
    return {
      ...task,
      label:
        'Which exact pieces may change, and which must stay in place? Name one layout goal with those pieces.',
      objectIds: [...design.excluded],
    };
  if (
    task.kind === 'clarify' &&
    task.label === clarificationLabel &&
    !/\b(don't|do not|never|except|without|instead|ignore|unlock|confirm|not)\b/.test(
      text.toLowerCase().replace(/[’]/g, "'"),
    )
  )
    return { ...task, interpret: true };
  return task;
}
