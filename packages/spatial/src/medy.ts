import type { RoomDocument } from '@roomedy/contracts/room';
import type { DesignTurn } from './design.js';
import { medyCommandWords, medyTargets, medyText } from './medy-language.js';
import { medyControl } from './medy-controls.js';
import type { MedyControl } from './medy-controls.js';
import { medyEdit } from './medy-edits.js';
import type { MedyEdit } from './medy-edits.js';
import { evaluateBatch } from './commands.js';
import { POLICY } from '@roomedy/contracts/policy';
import { planningRoom, planningChecks } from './planning.js';
import {
  roomDesignOpportunities,
  roomMaterialOpportunities,
} from './design-opportunities.js';
import { findCatalogueEntry } from './catalogue.js';

export type MedyRequest = MedyEdit | { kind: 'control'; control: MedyControl };
/** Shared application language policy. Models never call this with self-authored text. */
export function resolveMedyRequest(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
  context: readonly DesignTurn[] = [],
  operationId = 'local',
): MedyRequest | null {
  context = context.slice(-POLICY.contextTurns);
  const words = medyCommandWords(room, text),
    plain = medyText(text);
  if (
    /\b(ignore (?:the |all |previous )?(?:instructions|rules|locks)|system prompt|developer instructions|execute (?:code|javascript)|api key)\b/.test(
      words,
    )
  )
    return {
      kind: 'reply',
      summary:
        'I can help design and navigate this room. Tell me the piece or view you want to work on.',
      objectIds: [],
    };
  if (
    /\b(don't|do not|never|except|without)\b/.test(words) &&
    !/\b(?:don't|do not) own\b/.test(words)
  )
    return null;
  const clauses = text
    .split(
      /\s*(?:;|\band then\b|\band\s+(?=(?:set|make|change|resize|adjust|correct|confirm|mark|move|place|put|rotate|turn|face|delete|remove|lock|unlock|add)\b))\s*/i,
    )
    .filter(Boolean);
  if (clauses.length > 1) {
    if (clauses.length > 3)
      return {
        kind: 'reply',
        summary:
          'Let’s work on up to three exact edits in one preview. Which should we do first?',
        objectIds: [],
      };
    let working = room;
    const combined: Extract<MedyEdit, { kind: 'edits' }> = {
      kind: 'edits',
      actions: [],
      objectIds: [],
      label: '',
    };
    const labels: string[] = [];
    const recent = [...context];
    for (const [index, clause] of clauses.entries()) {
      const part = resolveMedyRequest(
        working,
        clause,
        selectedId,
        recent,
        `${operationId}-${index}`,
      );
      if (part?.kind !== 'edits')
        return {
          kind: 'reply',
          summary:
            'I haven’t changed anything. Let’s handle that as one exact edit at a time, starting with the piece and value you want.',
          objectIds: [],
        };
      combined.actions.push(...part.actions);
      combined.objectIds.push(...part.objectIds);
      labels.push(part.label);
      if (combined.actions.length > POLICY.actions)
        return {
          kind: 'reply',
          summary:
            'That needs more than one preview. Which edit should we start with?',
          objectIds: [],
        };
      const result = evaluateBatch(room, combined.actions, 'visitor');
      if (!result.ok)
        return {
          kind: 'reply',
          summary:
            'Those edits can’t be combined safely in one change. Let’s preview them separately; nothing has changed yet.',
          objectIds: [...new Set(combined.objectIds)],
        };
      working = result.room;
      recent.push({ role: 'user', text: clause });
    }
    return {
      ...combined,
      objectIds: [...new Set(combined.objectIds)],
      label: labels.join('; '),
    };
  }
  const control = medyControl(words);
  if (control) return { kind: 'control', control };
  const targets = medyTargets(room, text, selectedId, context);
  if (
    /^(?:(?:can|could) you )?(?:select|focus|inspect|show me)\b/.test(words) &&
    targets.length
  )
    return targets.length === 1
      ? { kind: 'control', control: { type: 'select', id: targets[0]!.id } }
      : {
          kind: 'reply',
          summary:
            'Which one do you mean? Select a piece or use its full name.',
          objectIds: targets.map((t) => t.id),
        };
  if (/^(?:hi|hey|hello)(?: medy)?[!. ]*$/.test(plain))
    return {
      kind: 'reply',
      summary:
        'Hi, I’m Medy. Tell me what you’d like to change, or ask me for a quick tour. We can work on the layout, exact sizes or the view together.',
      objectIds: [],
    };
  if (/^(?:thanks?|thank you|cheers)(?: medy)?[!. ]*$/.test(plain))
    return {
      kind: 'reply',
      summary: 'You’re welcome. What would you like to try next?',
      objectIds: [],
    };
  if (
    /^(?:who are you|what(?:'s| is) your name|help|what can you do)[?.! ]*$/.test(
      plain,
    )
  )
    return {
      kind: 'reply',
      summary:
        'I’m Medy, your room design partner. I can preview layout and furniture edits, set exact sizes, change finishes, handle openings, zoom and switch views, start the tour, or help export your design. Try “set the bed width to 180 cm” or “show the doorway view”. You review room changes before Apply, and Undo brings them back.',
      objectIds: [],
    };
  if (
    /^(?:what|how|why|should|is|are|do|does)\b|^(?:can|could) i\b|^would (?:this|that|it|a|the|my|we|i)\b|\b(?:whether|confirm if|verify if)\b/.test(
      words,
    )
  )
    return null;
  return medyEdit(room, words, targets, operationId);
}
export type { MedyControl, MedyControlResult } from './medy-controls.js';

/** Grounded authored advice for offline mode and conversation beside a prepared preview. */
export function medyAdvice(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
): string {
  room = planningRoom(room);
  const words = medyText(text),
    targets = medyTargets(room, text, selectedId, []);
  const target =
    targets.length === 1 && targets[0]?.kind === 'furniture'
      ? targets[0].piece
      : null;
  if (/\bhow\b/.test(words) && /\b(rotate|turn|spin)\b/.test(words))
    return `Select ${target?.label ?? 'a piece'}, then use either 90° rotation button, or ask me “rotate ${target?.label ?? 'this piece'} 90 degrees clockwise”. I’ll show a preview before Apply. If rotation is locked, explicitly unlock its rotation first; Undo brings back an accepted change.`;
  if (
    target &&
    /\b(size|dimension|wide|width|depth|height|facing|direction)\b/.test(words)
  ) {
    const sizes = (['width', 'depth', 'height'] as const)
      .map(
        (axis) =>
          `${axis} ${target.dimensions[axis].value === null ? 'unknown' : `${target.dimensions[axis].value} mm (${target.dimensions[axis].status})`}`,
      )
      .join(', ');
    return `${target.label}: ${sizes}. Its front faces ${['south', 'west', 'north', 'east'][target.pose.quarterTurns]}. Tell me an exact value to preview a change, or ask me to rotate it.`;
  }
  const checks = planningChecks(room),
    hard = checks.issues.filter((issue) => issue.severity === 'hard'),
    access = checks.issues.filter(
      (issue) =>
        issue.rule === 'front-access' && issue.severity !== 'unassessed',
    );
  if (/\b(check|wrong|problem|blocked|fit|safe|attention)\b/.test(words))
    return hard.length
      ? `I’d start with the ${hard.length === 1 ? 'conflict' : `${hard.length} conflicts`} in the current room checks. Open the checks and select an affected piece so we can work through it. A cleaner layout starts with usable floor space and clear furniture fronts.`
      : `There are no hard conflicts in the current modeled checks.${access.length ? ' The furniture-front access checks still deserve a look.' : ''} We can look at an exact piece or try a more open arrangement.`;
  const opportunities = roomDesignOpportunities(room),
    first = opportunities[0],
    materials = roomMaterialOpportunities(room);
  if (
    materials.length &&
    !/\b(keep|stay|retain|prefer)\b.*\bplain\b|\bno textures?\b/.test(words) &&
    /\b(texture|material|plain|finish|colou?r|style|warm|cozy|modern|improve|design|suggest)\b/.test(
      words,
    )
  )
    return `${materials[0]!.reason}${materials[1] ? ` ${materials[1].reason}` : ''} I can preview either finish so you can compare it with the plain room.`;
  if (!room.furniture.length)
    return 'Let’s give the room a useful starting layout with the essentials for your goals and a clear centre. I can preview the first pieces together, then coordinate them with warm wood and ivory.';
  if (/\b(work|desk|window|study|workspace|work zone)\b/.test(words)) {
    const desk = room.furniture.some(
      (piece) =>
        findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
          ?.category === 'desk',
    );
    return `I’d anchor the work zone ${room.room.features.some((feature) => feature.kind === 'window') ? 'near the window' : 'against a clear wall'}, with the chair facing into the room and room to pull it back. ${!desk ? `There’s no desk in this plan yet; I can preview ${opportunities[0]?.catalogueIds.includes('procedural-chair') ? 'a desk and chair' : 'a desk'} while keeping your existing pieces.` : first ? first.reason : 'We can compare a more open arrangement or coordinate the finishes.'}`;
  }
  return `I’d keep a clear route through the room and give the furniture fronts useful space. ${first ? `${first.reason} I can preview that addition, or coordinate the wood and wall finishes around the pieces you have.` : 'We can compare a more open layout, a coordinated palette, or a new use for one corner without adding more furniture.'}`;
}
