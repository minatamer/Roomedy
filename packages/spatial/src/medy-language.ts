import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { CATALOGUE, findCatalogueEntry } from './catalogue.js';
import type { DesignTurn } from './design.js';

export const medyText = (text: string) =>
  text
    .slice(0, POLICY.visitorTextChars)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[×]/g, ' x ')
    .replace(
      /\b(\d{1,3})\s*(?:feet|foot|ft|')\s*(\d{1,2}(?:\.\d+)?)\s*(?:inches|inch|in|")(?=\s|$|[.,?!])/g,
      (_match, feet: string, inches: string) =>
        `${(Number(feet) * 304.8 + Number(inches) * 25.4).toFixed(2)} mm`,
    )
    .trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const namePattern = (label: string) =>
  new RegExp(`(?<![a-z0-9])${escape(medyText(label))}(?![a-z0-9])`, 'g');
const furnitureCategories = [
  ...new Set(CATALOGUE.map((entry) => entry.category)),
];
const locationMention = (words: string, kind: Feature['kind'] | 'wall') =>
  new RegExp(
    `\\b(?:near|by|beside|next to|in front of|against)\\s+(?:the |a |my )?(?:north |east |south |west )?${kind}s?\\b`,
  ).test(words);
export type MedyTarget =
  | { kind: 'room'; id: string }
  | { kind: 'furniture'; id: string; piece: Furniture }
  | { kind: 'feature'; id: string; feature: Feature };

/** Object names are data: their words cannot become edit verbs or quantities. */
export function medyCommandWords(room: RoomDocument, text: string) {
  let words = medyText(text);
  for (const piece of [...room.furniture].sort(
    (a, b) => b.label.length - a.label.length,
  ))
    words = words.replace(namePattern(piece.label), ' item ');
  return words
    .replace(/^(?:hey|hi|hello)[, ]+(?:medy[, ]+)?/, '')
    .replace(/^medy[, ]+/, '')
    .replace(/\bplease\b/g, '')
    .replace(
      /^(?:let'?s|let us)\s+(?=(?:try|use|preview|change|make|paint)\b)/,
      '',
    )
    .replace(/^try\b/, 'preview')
    .replace(/\bspin\b/g, 'rotate')
    .replace(/\bnudge\b/g, 'move')
    .replace(/\bget rid of\b/g, 'delete')
    .replace(/\s+/g, ' ')
    .trim();
}
export function catalogueMention(
  entry: CatalogueEntry,
  words: string,
): boolean {
  const aliases: Record<string, string> = {
    'full-length-mirror': '(?:full[- ]length )?mirror',
    'mirror-wall':
      '(?:wall[- ](?:hung|mounted)|wall|hanging) mirror|mirror (?:that (?:can )?(?:hangs?|mounts?)|to hang|hanging) (?:on )?(?:the |a )?wall',
    'mirror-standing':
      '(?:standing(?: pivot)?|freestanding|pivot|cheval) mirror|mirror with (?:a )?(?:pivot|stand)',
    'wardrobe-mirrored':
      '(?:mirrored(?:[- ]door)?|mirror[- ]door) wardrobe|wardrobe with (?:a |one |a single )?(?:mirror|mirrored door)',
    'drawer-shelf':
      '(?:shelf|shelving) with (?:animated )?drawers|drawer shel(?:f|ving)',
    'chest-drawers': 'chest of drawers|dresser',
    'bedside-drawers': 'bedside drawers|nightstand with drawers',
    'tv-stand': 'tv stand|media (?:console|unit)',
    'tv-wall': 'wall[- ]mounted (?:tv|television)|wall (?:tv|television)',
    'tv-tabletop':
      'tabletop (?:tv|television)|(?:tv|television) on (?:a |the )?(?:stand|table)',
    armchair: '(?:lounge )?armchair',
    'bedroom-bench': '(?:bedroom )?bench',
    'side-table': 'side table',
    'floor-lamp': 'floor lamp',
    'ceiling-pendant': '(?:ceiling )?pendant(?: light| lamp)?',
    'ceiling-flush': 'flush(?: ceiling)? light',
    'ceiling-track': 'track(?: ceiling)? light',
  };
  if (
    entry.id === 'full-length-mirror' &&
    !/\bfull[- ]length mirror\b/.test(words) &&
    ['mirror-wall', 'mirror-standing', 'wardrobe-mirrored'].some((id) =>
      new RegExp(`\\b(?:${aliases[id]})s?\\b`).test(words),
    )
  )
    return false;
  return (
    words.includes(entry.label.toLowerCase()) ||
    (!!aliases[entry.id] &&
      new RegExp(`\\b(?:${aliases[entry.id]})s?\\b`).test(words))
  );
}
function references(room: RoomDocument, text: string): MedyTarget[] {
  const t = medyText(text);
  const mentions = room.furniture.map((piece) => ({
    piece,
    matches: [...t.matchAll(namePattern(piece.label))],
  }));
  const names = mentions
    .filter(({ piece, matches }) =>
      matches.some(
        (match) =>
          !mentions.some(
            (other) =>
              other.piece.label.length > piece.label.length &&
              other.matches.some(
                (cover) =>
                  cover.index <= match.index &&
                  cover.index + cover[0].length >=
                    match.index + match[0].length,
              ),
          ),
      ),
    )
    .map((mention) => mention.piece);
  const workAreaPattern =
    /\b(work[ -]area|workspace|workstation|work zone|desk setup)\b/;
  const workArea =
    workAreaPattern.test(t) &&
    !names.some((piece) => workAreaPattern.test(medyText(piece.label)));
  let remaining = t;
  for (const piece of names)
    remaining = remaining.replace(namePattern(piece.label), ' ');
  const pieces = room.furniture.filter((p) => {
    if (names.some((named) => named.id === p.id)) return true;
    const entry = findCatalogueEntry(p.catalogueId, p.catalogueVersion);
    if (entry && catalogueMention(entry, remaining)) return true;
    const category = entry?.category;
    if (category === 'mirror') {
      const specific = CATALOGUE.filter(
        (e) =>
          e.category === 'mirror' &&
          e.id !== 'full-length-mirror' &&
          catalogueMention(e, remaining),
      );
      if (specific.length && !specific.some((e) => e.id === entry?.id))
        return false;
    }
    // In “Floor lamp light colour”, light is the named fixture's property.
    if (
      category === 'lighting' &&
      names.some(
        (piece) =>
          findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
            ?.category === 'lighting',
      ) &&
      !/\b(and|all|both|other|lights|lamps)\b/.test(remaining)
    )
      return false;
    if (workArea && (category === 'desk' || category === 'chair')) return true;
    const aliases =
      category === 'storage'
        ? 'storage|shelf|shelves|cabinet|nightstand|bedside'
        : category === 'wardrobe'
          ? 'wardrobe|closet'
          : category === 'bed'
            ? 'bed|pillow|pillowcase|sheet|bedsheet|duvet|blanket|bedding'
            : category === 'lighting'
              ? 'lighting|lamp|light'
              : category;
    return !!aliases && new RegExp(`\\b(${aliases})s?\\b`).test(remaining);
  });
  const targets: MedyTarget[] = pieces.map((piece) => ({
    kind: 'furniture',
    id: piece.id,
    piece,
  }));
  const categories = pieces.map(
    (piece) =>
      findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)?.category,
  );
  if (
    (workArea &&
      ['desk', 'chair'].some(
        (category) =>
          categories.filter((current) => current === category).length !== 1,
      )) ||
    furnitureCategories.some(
      (category) =>
        new RegExp(`\\b${category}s?\\b`).test(remaining) &&
        !categories.includes(category),
    )
  )
    return [];
  let featureWords = t;
  for (const piece of names)
    featureWords = featureWords.replace(namePattern(piece.label), 'item');
  const balcony =
    /\b(?:balcony|patio|french|double glass|window) doors?\b/.test(
      featureWords,
    );
  for (const feature of room.room.features)
    if (
      new RegExp(`\\b${feature.kind}s?\\b`).test(featureWords) &&
      (!/\bbathroom doors?\b/.test(featureWords) ||
        (feature.kind === 'door' && feature.purpose === 'bathroom')) &&
      (!balcony || (feature.kind === 'door' && feature.purpose === 'balcony'))
    )
      targets.push({ kind: 'feature', id: feature.id, feature });
  if (/\b(room|bedroom)\b/.test(featureWords) && !targets.length)
    targets.push({ kind: 'room', id: room.roomId });
  return targets;
}
/** Current explicit objects win; only a human reference supplies a pronoun antecedent. */
export function medyTargets(
  room: RoomDocument,
  text: string,
  selectedId: string | null,
  context: readonly DesignTurn[],
): MedyTarget[] {
  const explicit = references(room, text);
  if (explicit.length) {
    if (/\b(this|selected|its)\b/.test(medyText(text))) {
      const pointed = explicit.find((target) => target.id === selectedId);
      if (pointed) return [pointed];
    }
    return explicit;
  }
  const plural = /\b(them|they|these|those|both)\b/.test(medyText(text));
  if (!plural && !/\b(it|this|that|selected|same|its)\b/.test(medyText(text)))
    return [];
  const selected = room.furniture.find((p) => p.id === selectedId);
  if (selected && !plural)
    return [{ kind: 'furniture', id: selected.id, piece: selected }];
  const feature = room.room.features.find((f) => f.id === selectedId);
  if (feature && !plural) return [{ kind: 'feature', id: feature.id, feature }];
  const recent = context
    .slice(-POLICY.contextTurns)
    .filter((t) => t.role === 'user')
    .slice(-6)
    .reverse();
  for (const turn of recent) {
    const subject = medyCommandWords(room, turn.text);
    const targets = references(room, turn.text);
    if (targets.length) {
      const furniture = targets.filter((target) => target.kind === 'furniture');
      if (plural && furniture.length) {
        // Inspect location syntax after masking names; never rewrite a piece's label into a different subject.
        const otherTargets = targets.filter(
          (target) => target.kind !== 'furniture',
        );
        if (
          otherTargets.some(
            (target) =>
              target.kind !== 'feature' ||
              !locationMention(subject, target.feature.kind),
          )
        )
          return [];
        const categories = furniture.map(
          (target) =>
            findCatalogueEntry(
              target.piece.catalogueId,
              target.piece.catalogueVersion,
            )?.category,
        );
        if (new Set(categories).size !== categories.length) return [];
        return furniture;
      }
      return targets;
    }
    // Do not reach past a new subject to resurrect an older furniture group.
    if (
      /\b(walls?|floor(?:ing)?|windows?|doors?|layout|palette|theme|bed|desk|chair|wardrobe|work[ -]area|workspace|workstation|desk setup)\b/i.test(
        subject,
      )
    )
      return [];
  }
  return [];
}

export type MedyTopic =
  | 'walls'
  | 'floor'
  | 'north wall'
  | 'east wall'
  | 'south wall'
  | 'west wall'
  | 'window'
  | 'door'
  | 'bathroom door'
  | 'furniture'
  | 'layout'
  | 'palette';

/** Topic only: the newest explicit human topic wins, including an ambiguous topic switch. */
export function medyTopic(
  room: RoomDocument,
  text: string,
  context: readonly DesignTurn[] = [],
): MedyTopic | null {
  for (const turn of [
    text,
    ...context
      .slice(-POLICY.contextTurns)
      .filter((turn) => turn.role === 'user')
      .slice(-6)
      .reverse()
      .map((turn) => turn.text),
  ]) {
    // In a surface-treatment question, nearby pieces/openings and unchanged
    // surfaces are context, not additional requested treatment targets.
    const question = medyCommandWords(room, turn.split(/[?!]/)[0] ?? '').split(
      /\b(?:considering|taking into account|given)\b/,
    )[0]!;
    const surfaceQuestion = question.match(
      /^(?:what|which)\s+(?:(north|east|south|west)\s+)?(walls?|floor(?:ing)?)\s+(?:treatments?|colou?rs?|textures?|finish(?:es)?|materials?)\b/,
    );
    if (
      surfaceQuestion &&
      !/\b(?:and|also)\s+(?:(?:what|which|the)\s+)?(?:walls?|floor(?:ing)?|furniture|desk|chair|doors?|windows?)\s+(?:treatments?|colou?rs?|textures?|finish(?:es)?|materials?)\b/.test(
        question,
      )
    )
      return surfaceQuestion[2]!.startsWith('floor')
        ? 'floor'
        : surfaceQuestion[1]
          ? (`${surfaceQuestion[1]} wall` as MedyTopic)
          : 'walls';
    const words = medyCommandWords(room, turn),
      topics: MedyTopic[] = [];
    const furniture =
      /\b(furniture|work[ -]area|workspace|workstation|work zone|desk setup)\b/.test(
        words,
      ) || references(room, turn).some((target) => target.kind === 'furniture');
    const wallMention =
      /\bwalls?\b/.test(words) &&
      !(furniture && locationMention(words, 'wall'));
    const walls = wallMention
      ? [...words.matchAll(/\b(north|east|south|west)\b/g)]
      : [];
    if (walls.length)
      topics.push(...walls.map((wall) => `${wall[1]} wall` as MedyTopic));
    else if (wallMention) topics.push('walls');
    if (/\bfloor(?:ing)?\b/.test(words)) topics.push('floor');
    if (
      /\bwindows?\b/.test(words) &&
      !(furniture && locationMention(words, 'window'))
    )
      topics.push('window');
    if (
      /\bdoors?\b/.test(words) &&
      !(furniture && locationMention(words, 'door'))
    )
      topics.push(/\bbathroom doors?\b/.test(words) ? 'bathroom door' : 'door');
    if (furniture) topics.push('furniture');
    if (
      !topics.length &&
      /\b(layout|arrang\w*|circulation|open space)\b/.test(words)
    )
      topics.push('layout');
    if (!topics.length && /\b(palette|theme)\b/.test(words))
      topics.push('palette');
    const unique = [...new Set(topics)];
    if (unique.length) return unique.length === 1 ? unique[0]! : null;
  }
  return null;
}

/** A bounded stated appearance preference, scoped to the active topic and superseded by a new choice. */
export function medyPrefersPlain(
  room: RoomDocument,
  text: string,
  context: readonly DesignTurn[] = [],
): boolean {
  const topic = medyTopic(room, text, context);
  for (const turn of [
    text,
    ...context
      .slice(-POLICY.contextTurns)
      .filter((turn) => turn.role === 'user')
      .slice(-6)
      .reverse()
      .map((turn) => turn.text),
  ]) {
    const statedTopic = medyTopic(room, turn);
    if (statedTopic && topic && statedTopic !== topic) continue;
    const words = medyText(turn);
    if (/\b(keep|stay|retain|prefer)\b.*\bplain\b|\bno textures?\b/.test(words))
      return true;
    if (
      /\b(try|use|want|prefer|add)\b.*\b(plaster|wood|textures?)\b/.test(words)
    )
      return false;
  }
  return false;
}

export const MEDY_QUANTITY =
  '(?<![a-z0-9.,])([+-]?\\d+(?:\\.\\d+)?)\\s*(millimet(?:er|re)s?|mm|centimet(?:er|re)s?|cm|met(?:er|re)s?|m|inches|inch|in|feet|foot|ft|["\'])?';
/** Physical sizes are whole mm; positions retain the canonical half-mm precision. */
export function medyMillimetres(
  value: string,
  unit = 'mm',
  half = false,
): number | null {
  const factors: Record<string, number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    in: 25.4,
    inch: 25.4,
    inches: 25.4,
    '"': 25.4,
    ft: 304.8,
    feet: 304.8,
    foot: 304.8,
    "'": 304.8,
  };
  const key = /^(?:millimet)/.test(unit)
    ? 'mm'
    : /^(?:centimet)/.test(unit)
      ? 'cm'
      : /^(?:met)/.test(unit)
        ? 'm'
        : unit;
  const amount = Number(value) * (factors[key] ?? NaN),
    step = half ? 2 : 1;
  return Number.isFinite(amount) && Math.abs(amount) <= POLICY.coordinateAbsMm
    ? Math.round(amount * step) / step
    : null;
}
export type MedyField =
  'width' | 'depth' | 'height' | 'offset' | 'sill' | 'projection' | 'x' | 'z';
const fields = {
  width: 'width|wide',
  depth: 'depth|deep|length|long',
  height: 'height|high|tall',
  offset: 'offset|distance along',
  sill: 'sill(?: height)?',
  projection: 'projection',
  x: 'x',
  z: 'z',
} as const;
export function medyDimensions(text: string): {
  values: Partial<Record<MedyField, number>>;
  invalid: boolean;
} {
  text = text
    .replace(/\bsill height\b/g, 'sill')
    .replace(/\b(?:of|for) (?:the )?item\b/g, '');
  const pair = text.match(
    new RegExp(
      `${MEDY_QUANTITY}\\s*x\\s*${MEDY_QUANTITY}(?:\\s*x\\s*${MEDY_QUANTITY})?`,
    ),
  );
  const fieldText = pair ? text.replace(pair[0], '') : text;
  const values: Partial<Record<MedyField, number>> = {};
  let invalid =
    /\d,\d|\d\s+\d|\d\s*[-–—/*]\s*\d|\d\s*(?:feet|foot|ft|')\s*\d|\d(?:\.\d+)?e[+-]?\d|\d\s*(?:mm|cm|m|in|ft)?\s+to\s+\d/.test(
      text,
    );
  for (const [field, aliases] of Object.entries(fields) as [
    MedyField,
    string,
  ][]) {
    const patterns = [
      new RegExp(
        `\\b(?:${aliases})\\b\\s*(?:to be|should be|to|is|of|at|as|=|:)?\\s*${MEDY_QUANTITY}(?![a-z0-9.])`,
        'g',
      ),
      new RegExp(`${MEDY_QUANTITY}\\s*(?:${aliases})\\b`, 'g'),
    ];
    for (const [index, pattern] of patterns.entries()) {
      // In "width 120 cm offset 2 m", the value before offset belongs to width.
      if (index === 1 && values[field] !== undefined) continue;
      for (const match of fieldText.matchAll(pattern)) {
        const suffix = fieldText
          .slice(match.index + match[0].length)
          .trimStart();
        if (
          index === 0 &&
          !match[2] &&
          /^[a-z]/.test(suffix) &&
          !/^(?:and|at|on|with|in|to|by|width|wide|depth|deep|length|long|height|high|tall|offset|sill|projection|x|z)\b/.test(
            suffix,
          )
        )
          invalid = true;
        const value = medyMillimetres(
          match[1]!,
          match[2],
          field === 'x' || field === 'z',
        );
        if (
          value === null ||
          (values[field] !== undefined && values[field] !== value)
        )
          invalid = true;
        else values[field] = value;
      }
    }
  }
  if (pair) {
    const units = pair[6] ?? pair[4] ?? pair[2];
    for (const [axis, index] of [
      ['width', 1],
      ['depth', 3],
      ['height', 5],
    ] as const) {
      if (pair[index] === undefined) continue;
      const value = medyMillimetres(pair[index]!, pair[index + 1] ?? units);
      if (
        value === null ||
        (values[axis] !== undefined && values[axis] !== value)
      )
        invalid = true;
      else values[axis] = value;
    }
  }
  return { values, invalid };
}
