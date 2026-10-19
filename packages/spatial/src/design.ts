import type {
  DesignIntent,
  DesignSuggestion,
} from '@roomedy/contracts/assistant';
import type { RoomDocument, Furniture } from '@roomedy/contracts/room';
import { findCatalogueEntry } from './catalogue.js';

export type DesignTurn = { role: 'user' | 'assistant'; text: string };
const categories = ['bed', 'desk', 'chair', 'wardrobe', 'storage'] as const;
const openWording =
  /\b(less cramped|less crowded|more breathing room|more open|open up|easier to (?:walk|move)|better (?:flow|circulation)|improve (?:the )?(?:flow|circulation)|free up (?:the )?(?:centre|center)|room to (?:walk|move))\b/;
const category = (p: Furniture) =>
  findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category;
function referenced(room: RoomDocument, text: string) {
  const named = room.furniture.filter((p) =>
    text.includes(p.label.toLowerCase()),
  );
  if (named.length) return named;
  const types = categories.filter((c) =>
    new RegExp('\\b' + c + 's?\\b').test(text),
  );
  return room.furniture.filter((p) => types.includes(category(p)!));
}
export const designPalette = (mood: 'warm' | 'light' | 'calm') =>
  mood === 'calm'
    ? { floorFinish: 'walnut' as const, wallFinish: 'sage' as const }
    : {
        floorFinish: 'oak' as const,
        wallFinish: mood === 'warm' ? ('clay' as const) : ('ivory' as const),
      };

/** Bounded user-language context can resolve a reference, never inherit old edit permissions. */
export function designerRequest(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
  context: readonly DesignTurn[],
) {
  let t = text.toLowerCase().replace(/[’]/g, "'").trim();
  const excluded: string[] = [];
  let targets: string[] | null = null;
  let clarification: string | null = null;
  const result = (
    request = t,
    openSpace = false,
    mood: 'warm' | 'light' | 'calm' | null = null,
  ) => ({
    text: request,
    selectedId,
    excluded,
    targets,
    openSpace,
    mood,
    clarification,
  });
  // No historical text or paraphrase may turn these into an edit request.
  if (
    /\b(ignore|unlock|confirm|price|budget|shopping|retailer|buy|cost)\b|[$€£]/.test(
      t,
    )
  )
    return result();
  const exclusion = t.match(
    /\s+(?:without moving|but (?:keep|leave))\s+(.+?)(?:\s+(?:where (?:it|they) (?:is|are)|in place|as (?:it|they) (?:is|are)))?[.!]?$/,
  );
  if (exclusion) {
    const clause = exclusion[1]!;
    const refs = referenced(room, clause);
    const types = categories.filter((c) =>
      new RegExp('\\b' + c + 's?\\b').test(clause),
    );
    if (
      !refs.length ||
      types.some((c) => refs.filter((p) => category(p) === c).length !== 1) ||
      /\b(move|add|remove|replace|finish|except|not|don't)\b/.test(clause)
    ) {
      clarification =
        'Which exact piece should stay in place? Select its card, then ask for the layout change.';
      return result();
    }
    excluded.push(...refs.map((p) => p.id));
    t = t.slice(0, exclusion.index).trim();
  }
  // Restrictive layout wording is understood only with an appearance-only request.
  t = t.replace(
    /^(?:keep the layout|leave the layout as it is)[,.;]?\s*(?:but |and )?/,
    '',
  );
  const past =
    context
      .filter((turn) => turn.role === 'user')
      .slice(-6)
      .at(-1)
      ?.text.toLowerCase() ?? '';
  const explicit = referenced(room, t);
  const pronoun = /\b(it|this|that|selected|instead|actually|rather)\b/.test(t);
  const finish = t.match(/\b(oak|ivory|walnut|clay|sage|charcoal)\b/)?.[1];
  const mood =
    /\b(cozy|cosy|cozier|cosier|warm|warmer|warmth|welcoming)\b/.test(t)
      ? 'warm'
      : /\b(light|lighter|bright|brighter|airy|airier)\b/.test(t)
        ? 'light'
        : /\b(calm|calmer|serene|cohesive|coordinat(?:e|ed)|minimal|focused)\b/.test(
              t,
            )
          ? 'calm'
          : null;
  const finishChoices = new Set(
    [...t.matchAll(/\b(oak|ivory|walnut|clay|sage|charcoal)\b/g)].map(
      (match) => match[1],
    ),
  );
  if (finishChoices.size > 1 || (/\bleft\b/.test(t) && /\bright\b/.test(t))) {
    clarification =
      finishChoices.size > 1
        ? 'Which single finish should I use? Choose one for the piece, or name a room palette.'
        : 'Which side should this piece use: left or right?';
    return result();
  }
  const adding =
    /\b(add|furnish)\b/.test(t) ||
    (/\bneed\b/.test(t) &&
      categories.some((c) => new RegExp('\\b' + c + 's?\\b').test(t)));
  if (
    (adding &&
      (openWording.test(t) || /\b(rearrange|clear the entrance)\b/.test(t))) ||
    (/\b(rotate|turn)\b/.test(t) &&
      /\b(move|put|bring|add|remove|replace)\b/.test(t))
  ) {
    clarification =
      'Choose one layout or furniture change first; I can preview its palette with it.';
    return result();
  }
  const appearanceOnly =
    !!(finish || mood) &&
    !openWording.test(t) &&
    !/\b(move|add|need|furnish|rearrange|remove|replace|cramped|circulation|walk|work area|workspace|desk setup|workstation)\b/.test(
      t,
    );
  const referenceMove =
    /^(?:actually[, ]*)?(?:(?:move|put|bring)\s+)?(?:it|this|that|the selected piece)\b/.test(
      t,
    ) &&
    /\b(left|right|window)\b/.test(t) &&
    !/\b(add|remove|replace|finish|and|but|or)\b/.test(t);
  if (appearanceOnly) t = t.replace(/^actually[, ]+/, '');
  if (
    appearanceOnly &&
    /^(?:not (?:that |so )?dark[,.;]?\s*)/.test(t) &&
    mood === 'light'
  )
    t = t.replace(/^not (?:that |so )?dark[,.;]?\s*/, '');
  if (
    /\b(don't|do not|never|without|except|not|instead|rather)\b/.test(t) &&
    !(
      (appearanceOnly || referenceMove) &&
      !/\b(don't|do not|never|without|except|not)\b/.test(t)
    )
  )
    return result();
  if (referenceMove)
    t = t.replace(/\b(?:actually|instead|rather)\b/g, '').trim();
  if (
    /\b(remove|replace)\b/.test(t) &&
    (openWording.test(t) ||
      /\b(palette|circulation)\b/.test(t) ||
      mood !== null ||
      finish !== undefined)
  ) {
    clarification =
      'Choose the removal or replacement first, then the layout or palette change.';
    return result();
  }
  if (appearanceOnly) {
    t = t.replace(/\b(?:actually|instead|rather)\b/g, '').trim();
    const current = room.furniture.find((p) => p.id === selectedId);
    const previous = referenced(room, past);
    const target =
      explicit.length === 1
        ? explicit[0]
        : pronoun && current
          ? current
          : pronoun &&
              previous.length === 1 &&
              !/\b(room|palette|walls?|floor)\b/.test(past)
            ? previous[0]
            : null;
    if (finish && !/\b(room|palette|walls?|floor)\b/.test(t)) {
      if (explicit.length > 1) return result();
      if (!target) {
        clarification =
          'Which piece should use that finish? Select its card, or name the room palette.';
        return result();
      }
      selectedId = target.id;
      return result(`Preview this selected piece finish ${finish}`);
    }
    if (mood) return result(`Preview ${mood} room palette`);
  }
  if (openWording.test(t)) {
    if (/\b(keep|keeping|leave|preserve|retain)\b/.test(t)) {
      clarification =
        'Name the pieces that should stay in place using “without moving”, then ask for the layout change.';
      return result();
    }
    const group = /\b(work area|workspace|desk setup)\b/.test(t)
      ? room.furniture.filter((p) => ['desk', 'chair'].includes(category(p)!))
      : explicit;
    if (
      /\b(only|just|selected piece|this piece|that piece)\b/.test(t) &&
      !group.length
    ) {
      const current = room.furniture.find((p) => p.id === selectedId);
      if (current) targets = [current.id];
      else {
        clarification = 'Which exact piece may move? Select its card first.';
        return result();
      }
    } else if (group.length) targets = group.map((p) => p.id);
    if (
      targets &&
      new Set(
        targets.map((id) => category(room.furniture.find((p) => p.id === id)!)),
      ).size !== targets.length
    ) {
      clarification =
        'Which pieces form this area? Select a single piece or name it exactly.';
      return result();
    }
    return result('Rearrange what I own', true, mood);
  }
  if (
    /\b(work area|workspace|desk setup|workstation)\b/.test(t) &&
    /\b(better|improve|comfortable|daylight|natural light|window|brighter)\b/.test(
      t,
    ) &&
    !/\b(add|remove|replace|furnish)\b/.test(t)
  )
    return result(
      'Move the work area near the window',
      false,
      /\b(room|palette|style|finishes)\b/.test(t) ? mood : null,
    );
  if (pronoun && /\b(left|right|window)\b/.test(t) && !explicit.length) {
    const current = room.furniture.find((p) => p.id === selectedId),
      previous = referenced(room, past);
    const target = current ?? (previous.length === 1 ? previous[0] : null);
    if (target) {
      selectedId = target.id;
      return result(
        `Move this selected piece ${/\bwindow\b/.test(t) ? 'near the window' : /\bleft\b/.test(t) ? 'to the left' : 'to the right'}`,
      );
    }
  }
  if (pronoun && /\b(rotate|turn)\b/.test(t) && !explicit.length) {
    const current = room.furniture.find((p) => p.id === selectedId),
      previous = referenced(room, past);
    const target = current ?? (previous.length === 1 ? previous[0] : null);
    if (target) {
      selectedId = target.id;
      return result(t.replace(/\b(it|that)\b/, 'this selected piece'));
    }
  }
  return result();
}

/** A model interpretation authors no command. A visitor may choose a concrete new request. */
export function designSuggestions(
  room: RoomDocument,
  intent: DesignIntent,
): DesignSuggestion[] {
  if (
    new Set(intent.targetIds).size !== intent.targetIds.length ||
    new Set(intent.categories).size !== intent.categories.length ||
    intent.targetIds.some((id) => !room.furniture.some((p) => p.id === id))
  )
    return [];
  const option = (
    label: string,
    request: string,
    selectedId: string | null = null,
  ): DesignSuggestion => ({
    label: label.slice(0, 240),
    request,
    selectedId,
    roomRevision: room.roomRevision,
  });
  const unrelated =
    intent.categories.length ||
    intent.finish !== null ||
    intent.palette !== null;
  if (intent.goal === 'open-space' && !unrelated && !intent.targetIds.length)
    return room.furniture.some((p) => !p.locks.position)
      ? [option('Preview a more open layout', 'Make the room less cramped')]
      : [];
  if (
    intent.goal === 'work-by-window' &&
    !unrelated &&
    !intent.targetIds.length
  )
    return room.furniture.filter((p) => category(p) === 'desk').length === 1 &&
      room.room.features.some((f) => f.kind === 'window')
      ? [
          option(
            'Preview the work area by the window',
            'Move the work area near the window',
          ),
        ]
      : [];
  if (
    intent.goal === 'palette' &&
    intent.palette &&
    !intent.targetIds.length &&
    !intent.categories.length &&
    intent.finish === null
  )
    return [
      option(
        `Preview a ${intent.palette} room palette`,
        `Preview ${intent.palette} room palette`,
      ),
    ];
  if (
    ['piece-finish', 'left', 'right'].includes(intent.goal) &&
    intent.targetIds.length === 1 &&
    !intent.categories.length &&
    intent.palette === null &&
    (intent.goal === 'piece-finish'
      ? intent.finish !== null
      : intent.finish === null)
  ) {
    const piece = room.furniture.find((p) => p.id === intent.targetIds[0])!;
    if (intent.goal === 'piece-finish') {
      if (
        !findCatalogueEntry(
          piece.catalogueId,
          piece.catalogueVersion,
        )?.finishes.includes(intent.finish!)
      )
        return [];
      return [
        option(
          `Preview ${piece.label} in ${intent.finish}`,
          `Preview this selected piece finish ${intent.finish}`,
          piece.id,
        ),
      ];
    }
    return [
      option(
        `Move ${piece.label} to the ${intent.goal}`,
        `Move this selected piece to the ${intent.goal}`,
        piece.id,
      ),
    ];
  }
  if (
    intent.goal === 'furnish' &&
    intent.categories.length &&
    !intent.targetIds.length &&
    intent.finish === null &&
    intent.palette === null
  ) {
    const names = intent.categories.join(', ');
    return [
      option(`Add ${names}`, `Add a ${intent.categories.join(' and a ')}`),
    ];
  }
  if (intent.goal === 'explain' && !unrelated && !intent.targetIds.length)
    return [option('Review the room checks', 'Explain the room checks')];
  if (intent.goal === 'clarify' && !unrelated && !intent.targetIds.length)
    return [
      ...(room.furniture.length === 0
        ? [
            option(
              'Furnish with essentials',
              'Add a bed, desk, chair and wardrobe',
            ),
          ]
        : room.furniture.some((p) => !p.locks.position)
          ? [option('Preview a more open layout', 'Make the room less cramped')]
          : []),
      option('Preview a calm palette', 'Preview calm room palette'),
      option('Review the room checks', 'Explain the room checks'),
    ];
  return [];
}
