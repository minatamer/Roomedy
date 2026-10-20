import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Feature, Furniture, RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from './catalogue.js';
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
  };
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
  const pieces = names.length
    ? names
    : room.furniture.filter((p) => {
        const entry = findCatalogueEntry(p.catalogueId, p.catalogueVersion);
        if (entry && catalogueMention(entry, t)) return true;
        const category = entry?.category;
        const aliases =
          category === 'storage'
            ? 'storage|shelf|shelves|cabinet|nightstand|bedside'
            : category === 'wardrobe'
              ? 'wardrobe|closet'
              : category;
        return !!aliases && new RegExp(`\\b(${aliases})s?\\b`).test(t);
      });
  const targets: MedyTarget[] = pieces.map((piece) => ({
    kind: 'furniture',
    id: piece.id,
    piece,
  }));
  let featureWords = t;
  for (const piece of names)
    featureWords = featureWords.replace(namePattern(piece.label), 'item');
  for (const feature of room.room.features)
    if (
      new RegExp(`\\b${feature.kind}s?\\b`).test(featureWords) &&
      (!/\bbathroom\b/.test(featureWords) ||
        (feature.kind === 'door' && feature.purpose === 'bathroom'))
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
  if (!/\b(it|this|that|selected|same|its)\b/.test(medyText(text))) return [];
  const selected = room.furniture.find((p) => p.id === selectedId);
  if (selected)
    return [{ kind: 'furniture', id: selected.id, piece: selected }];
  const feature = room.room.features.find((f) => f.id === selectedId);
  if (feature) return [{ kind: 'feature', id: feature.id, feature }];
  const last = context
    .filter((t) => t.role === 'user')
    .slice(-6)
    .reverse()
    .map((turn) => references(room, turn.text))
    .find((targets) => targets.length > 0);
  return last ?? [];
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
