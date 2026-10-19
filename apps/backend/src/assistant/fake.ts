import type {
  ProviderOutcome,
  ProviderRequest,
} from '../providers/provider.js';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { DesignIntent } from '@roomedy/contracts/assistant';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const categories = ['bed', 'desk', 'chair', 'wardrobe', 'storage'] as const;
/** Authored sample vocabulary, bound to current objects/finishes. It never returns edit actions. */
function interpret(
  room: RoomDocument,
  text: string,
  selectedId: unknown,
  recent: unknown,
): DesignIntent {
  const t = text.toLowerCase(),
    empty: DesignIntent = {
      goal: 'clarify',
      targetIds: [],
      categories: [],
      finish: null,
      palette: null,
    };
  if (/\b(ignore|unlock|confirm|buy|price|budget)\b/.test(t)) return empty;
  const refs = (words: string) => {
    const names = room.furniture.filter(
      (p) =>
        words.includes(p.label.toLowerCase()) &&
        p.label.toLowerCase() !==
          findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category,
    );
    return names.length
      ? names
      : room.furniture.filter((p) =>
          categories.some(
            (c) =>
              new RegExp('\\b' + c + 's?\\b').test(words) &&
              findCatalogueEntry(p.catalogueId, p.catalogueVersion)
                ?.category === c,
          ),
        );
  };
  const named = refs(t),
    selected = room.furniture.find((p) => p.id === selectedId);
  const previous = Array.isArray(recent)
    ? recent
        .slice(-POLICY.contextTurns)
        .filter(
          (v) =>
            record(v) &&
            v.role === 'user' &&
            typeof v.text === 'string' &&
            v.text.length <= POLICY.visitorTextChars,
        )
        .at(-1)
    : null;
  const prior =
    record(previous) && typeof previous.text === 'string'
      ? refs(previous.text.toLowerCase())
      : [];
  const target =
    named.length === 1
      ? named[0]
      : selected &&
          /\b(this|that|it|selected)\b/.test(t) &&
          (!named.length || named.some((p) => p.id === selected.id))
        ? selected
        : named.length === 0 && /\b(it|that)\b/.test(t) && prior.length === 1
          ? prior[0]
          : null;
  const requestedFinish =
    /\b(dark wood|darker wood|rich wood|richer wood)\b/.test(t)
      ? 'walnut'
      : /\b(blend in|soft accent|quieter colou?r|soften this|soften that)\b/.test(
            t,
          )
        ? 'sage'
        : null;
  if (
    requestedFinish &&
    target &&
    findCatalogueEntry(
      target.catalogueId,
      target.catalogueVersion,
    )?.finishes.includes(requestedFinish)
  )
    return {
      ...empty,
      goal: 'piece-finish',
      targetIds: [target.id],
      finish: requestedFinish,
    };
  if (
    /\b(boxed in|bumping into|path through|in the way|spread things out)\b/.test(
      t,
    )
  )
    return room.furniture.some((p) => !p.locks.position)
      ? { ...empty, goal: 'open-space' }
      : empty;
  if (
    /\b(quiet(?:er)? visual rhythm|peaceful|soft overall look|pull the look together)\b/.test(
      t,
    )
  )
    return { ...empty, goal: 'palette', palette: 'calm' };
  if (
    /\b(start from scratch|somewhere to sleep|bedroom essentials|sleep and study)\b/.test(
      t,
    ) &&
    room.furniture.length === 0
  )
    return {
      ...empty,
      goal: 'furnish',
      categories: ['bed', 'desk', 'chair', 'wardrobe'],
    };
  if (/\b(what is blocking|what needs attention|where am i stuck)\b/.test(t))
    return { ...empty, goal: 'explain' };
  return empty;
}
/** Stateless authored tool turns, not natural-language model quality. */
export async function assistantFakeResponse(
  request: ProviderRequest,
  signal: AbortSignal,
): Promise<ProviderOutcome> {
  if (signal.aborted) return { kind: 'cancelled' };
  if (
    !['room_assistant_1', 'room_design_intent_1'].includes(request.format.name)
  )
    return { kind: 'malformed' };
  if (request.input.at(-1)?.type === 'function_call_output')
    return { kind: 'completed', data: { kind: 'done' }, calls: [] };
  const content = request.input.at(-1)?.content;
  if (!Array.isArray(content) || typeof content[0]?.text !== 'string')
    return { kind: 'malformed' };
  let context: unknown;
  try {
    context = JSON.parse(content[0].text);
  } catch {
    return { kind: 'malformed' };
  }
  if (
    !record(context) ||
    typeof context.request !== 'string' ||
    context.request.length > POLICY.visitorTextChars
  )
    return { kind: 'malformed' };
  if (request.format.name === 'room_design_intent_1') {
    const room = roomDocumentSchema.safeParse(context.room);
    return room.success
      ? {
          kind: 'completed',
          calls: [],
          data: interpret(
            room.data,
            context.request,
            context.selectedId,
            context.recentTurns,
          ),
        }
      : { kind: 'malformed' };
  }
  if (
    !record(context.task) ||
    !['search', 'catalogue', 'undo', 'explain'].includes(
      String(context.task.kind),
    )
  )
    return { kind: 'malformed' };
  const name =
    context.task.kind === 'search'
      ? 'find_arrangements'
      : context.task.kind === 'catalogue'
        ? 'find_furniture'
        : context.task.kind === 'undo'
          ? 'request_undo'
          : 'explain_checks';
  const requestText = context.request;
  const category =
    categories.find((c) =>
      new RegExp('\\b' + c + '\\b').test(requestText.toLowerCase()),
    ) ?? null;
  if (!request.tools.some((tool) => tool.name === name))
    return { kind: 'malformed' };
  return {
    kind: 'completed',
    data: null,
    calls: [
      {
        name,
        callId: 'fixture_assist_1',
        arguments:
          name === 'find_furniture'
            ? { category, maxWidth: null, maxDepth: null }
            : name === 'explain_checks'
              ? { issueId: null }
              : {},
      },
    ],
  };
}
