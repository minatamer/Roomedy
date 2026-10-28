import type { RoomDocument } from '@roomedy/contracts/room';
import type {
  DesignSuggestion,
  QuickReply,
} from '@roomedy/contracts/assistant';
import { quickReplySchema } from '@roomedy/contracts/assistant';
import { resolveMedyRequest } from './medy.js';
import { resolveAssistantTask } from './assistant.js';
import type { DesignTurn } from './design.js';
import {
  roomDesignOpportunities,
  roomMaterialOpportunities,
} from './design-opportunities.js';

/** Validation only: a model-authored suggestion never executes or establishes visitor facts. */
export function validateQuickReplies(
  room: RoomDocument,
  choices: readonly QuickReply[],
  selectedId: string | null,
  context: readonly DesignTurn[] = [],
): DesignSuggestion[] {
  const result: DesignSuggestion[] = [],
    labels = new Set<string>(),
    requests = new Set<string>();
  const selected =
    selectedId !== null &&
    (room.furniture.some((p) => p.id === selectedId) ||
      room.room.features.some((f) => f.id === selectedId))
      ? selectedId
      : null;
  for (const raw of choices.slice(0, 3)) {
    const parsed = quickReplySchema.safeParse(raw);
    if (!parsed.success) continue;
    const choice = parsed.data,
      joined = `${choice.label} ${choice.request}`,
      labelKey = choice.label.toLocaleLowerCase(),
      requestKey = choice.request.toLocaleLowerCase();
    if (
      labels.has(labelKey) ||
      requests.has(requestKey) ||
      /https?:|www\.|javascript:|[<>\u0000-\u001f\u007f]/i.test(joined) ||
      /\b(ignore|instructions|system prompt|api key|shopping|buy|price|budget|export|download|import|reset|unlock|confirm|delete|remove|applied|unlocked|confirmed|measure|measured|measuring|measurement|measurements|dimension|dimensions|width|depth|height|hinge|sill|survey|physical)\b/i.test(
        joined,
      ) ||
      /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|ft|feet|inches|in)\b/i.test(
        choice.request,
      )
    )
      continue;
    const manual = resolveMedyRequest(room, choice.request, selected, context);
    if (
      (manual?.kind === 'reply' &&
        !/^(?:what can you do|help)[?.! ]*$/i.test(choice.request)) ||
      (manual?.kind === 'control' &&
        ['apply', 'cancel', 'undo', 'project', 'tour'].includes(
          manual.control.type,
        )) ||
      (manual?.kind === 'edits' &&
        manual.actions.some(
          (action) =>
            ![
              'finish',
              'room-finish',
              'set-intent',
              'set-room-surface',
              'set-furniture-materials',
              'set-opening-materials',
            ].includes(action.type) ||
            (action.type === 'set-intent' &&
              (!manual.actions.some((item) => item.type === 'room-finish') ||
                action.intent.condition !== room.intent.condition ||
                JSON.stringify(action.intent.goals) !==
                  JSON.stringify(room.intent.goals))),
        ))
    )
      continue;
    if (!manual) {
      const task = resolveAssistantTask(
        room,
        choice.request,
        selected,
        'quick-reply-validation',
        context,
      );
      if (
        task.interpret ||
        !['conversation', 'search', 'edits', 'explain', 'catalogue'].includes(
          task.kind,
        )
      )
        continue;
    }
    labels.add(labelKey);
    requests.add(requestKey);
    result.push({
      ...choice,
      selectedId: selected,
      roomRevision: room.roomRevision,
    });
  }
  return result;
}

/** Authored fake/local follow-ups are grounded in the response actually displayed. */
export function contextualQuickReplies(
  room: RoomDocument,
  message: string,
  selectedId: string | null,
  kind: 'proposal' | 'other' = 'other',
): QuickReply[] {
  if (kind === 'proposal')
    return [
      {
        label: 'Review this preview',
        request: 'How should I review this preview?',
      },
      {
        label: 'Explore another direction',
        request: 'What other design direction could work?',
      },
    ];
  if (/^(?:done|undid|applied)\b/i.test(message))
    return [
      {
        label: 'What could we try next?',
        request: 'How else can I improve this room?',
      },
      { label: 'Review the room checks', request: 'Explain the room checks' },
    ];
  if (
    /unavailable|couldn.t|could not|cancelled|too long|verification/i.test(
      message,
    )
  )
    return [
      { label: 'What can you help with?', request: 'What can you do?' },
      { label: 'Open room checks', request: 'Show room checks' },
    ];
  if (
    /\b(width|depth|height|measurement|mm|conflicts?|checks)\b/i.test(message)
  )
    return [
      { label: 'Open room checks', request: 'Show room checks' },
      {
        label: 'Try a calm palette',
        request: 'Preview Calm & focused room palette',
      },
    ];
  if (!room.furniture.length)
    return [
      {
        label: 'Start with the essentials',
        request: 'I need a bed, desk, chair and wardrobe',
      },
      {
        label: 'Talk through the layout',
        request: 'How should I plan the layout?',
      },
    ];
  if (
    /more open layout|open arrangement|clear route|circulation|floor space/i.test(
      message,
    )
  )
    return [
      {
        label: 'Preview a more open layout',
        request: 'Create more open space',
      },
      {
        label: 'Try a calm palette',
        request: 'Preview Calm & focused room palette',
      },
    ];
  if (
    /palette|oak|walnut|ivory|colour|color|finish|atmosphere|wood/i.test(
      message,
    )
  )
    return [
      { label: 'Warm & simple', request: 'Preview Warm & simple room palette' },
      { label: 'Light & airy', request: 'Preview Light & airy room palette' },
      {
        label: 'Calm & focused',
        request: 'Preview Calm & focused room palette',
      },
    ];
  return [
    {
      label: 'Find a design direction',
      request: 'How can I make this room tidy and modern?',
    },
    ...(selectedId
      ? [
          {
            label: 'Talk about this piece',
            request: 'How could this piece work better in my room?',
          },
        ]
      : []),
    {
      label: 'Talk through the layout',
      request: 'How can I improve this room’s layout?',
    },
  ];
}

interface ReplyOptions {
  message: string;
  choices?: readonly QuickReply[];
  selectedId: string | null;
  context?: readonly DesignTurn[];
  kind?: 'proposal' | 'other';
  previousRequest?: string;
}
const replyDirection = (request: string) =>
  /\b(?:need|add|furnish)\b/i.test(request)
    ? 'furnishing'
    : /palette|colou?r|materials?|finish|texture|upholstery|linen|plaster|oak|walnut|ivory/i.test(
          request,
        )
      ? 'appearance'
      : /layout|arrange|space|zone|window|circulation/i.test(request)
        ? 'layout'
        : 'discovery';

/** Fill the shelf once, without a second model call or permission to execute a suggestion. */
export function completeQuickReplies(
  room: RoomDocument,
  options: ReplyOptions,
): DesignSuggestion[] {
  const context = options.context ?? [],
    selectedId = options.selectedId,
    previous = options.previousRequest?.trim().toLocaleLowerCase(),
    proposal = options.kind === 'proposal',
    failure =
      /unavailable|couldn.t|could not|cancelled|too long|verification/i.test(
        options.message,
      );
  const supplied = (options.choices ?? []).slice(0, 3);
  const materialOptions =
    proposal || failure ? [] : roomMaterialOpportunities(room);
  const opportunities =
    proposal || failure ? [] : roomDesignOpportunities(room);
  const adjacent: QuickReply[] = proposal
    ? [
        {
          label: 'Review this preview',
          request: 'How should I review this preview?',
        },
        {
          label: 'Explore another direction',
          request: 'What other design direction could work?',
        },
        {
          label: 'Another layout idea',
          request: 'What is another way to arrange these pieces?',
        },
      ]
    : failure
      ? [
          { label: 'What can you help with?', request: 'What can you do?' },
          { label: 'Open room checks', request: 'Show room checks' },
          {
            label: 'Try a calm palette',
            request: 'Preview Calm & focused room palette',
          },
        ]
      : [
          ...opportunities.map(({ label, request }) => ({
            label,
            request,
          })),
          ...materialOptions.map(({ label, request }) => ({ label, request })),
          {
            label: 'Try a calm palette',
            request: 'Preview Calm & focused room palette',
          },
          {
            label: 'Another layout idea',
            request:
              'Suggest another layout while keeping my current furniture.',
          },
          ...contextualQuickReplies(room, options.message, selectedId),
          {
            label: 'Explore furniture ideas',
            request: 'What furniture could make this room more useful?',
          },
        ];
  const candidates: DesignSuggestion[] = [],
    labels = new Set<string>(),
    requests = new Set<string>();
  for (const raw of [...supplied, ...adjacent].slice(0, 16)) {
    const valid = validateQuickReplies(room, [raw], selectedId, context)[0];
    if (!valid) continue;
    const key = valid.request.trim().toLocaleLowerCase(),
      label = valid.label.toLocaleLowerCase();
    if (key === previous || requests.has(key) || labels.has(label)) continue;
    // A live proposal must remain reviewable; its shelf offers discussion, not another mutation.
    if (
      proposal &&
      resolveAssistantTask(
        room,
        valid.request,
        selectedId,
        'preview-reply',
        context,
      ).kind !== 'conversation'
    )
      continue;
    requests.add(key);
    labels.add(label);
    candidates.push(valid);
  }
  const result: DesignSuggestion[] = [],
    directions = new Set<string>();
  const take = (candidate: DesignSuggestion) => {
    if (result.length >= 3 || result.includes(candidate)) return;
    result.push(candidate);
    directions.add(replyDirection(candidate.request));
  };
  if (candidates[0]) take(candidates[0]);
  if (!directions.has('furnishing')) {
    const gap = candidates.find((candidate) =>
      opportunities.some((option) => option.request === candidate.request),
    );
    if (gap) take(gap);
  }
  if (
    !result.some((choice) =>
      /texture|frame material|upholstery/i.test(choice.request),
    )
  ) {
    const material = candidates.find((candidate) =>
      materialOptions.some((option) => option.request === candidate.request),
    );
    if (material) take(material);
  }
  // Keep the main model idea, a useful inventory gap, then a different design direction.
  for (const candidate of candidates) {
    if (!directions.has(replyDirection(candidate.request))) take(candidate);
  }
  for (const candidate of candidates) take(candidate);
  return result;
}
