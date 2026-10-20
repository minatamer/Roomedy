import {
  featureLabel,
  placementTarget,
  wallMountedPose,
  wallMounted,
} from './elevation.js';
import { catalogueMention } from './medy-language.js';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { visitorBatchSchema } from '@roomedy/contracts/commands';
import type { Feature, RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import {
  FINISH_COLORS,
  SURFACE_TEXTURES,
  isSurfaceTexture,
} from '@roomedy/contracts/surfaces';
import {
  CATALOGUE,
  findCatalogueEntry,
  visitorCatalogueFurniture,
} from './catalogue.js';
import {
  matchingFurnitureSizePresets,
  requestedCatalogueSize,
} from './size-presets.js';
import { preferredFurnitureFacing } from './orientation.js';
import {
  BALCONY_SIZE_PRESETS,
  applyOpeningSizePreset,
  openingSizePresets,
} from './opening-sizes.js';
import { designPalette } from './design.js';
import {
  medyDimensions,
  medyMillimetres,
  MEDY_QUANTITY,
} from './medy-language.js';
import type { MedyTarget } from './medy-language.js';
import type { DesignSuggestion } from '@roomedy/contracts/assistant';

export type MedyEdit =
  | {
      kind: 'edits';
      label: string;
      actions: VisitorAction[];
      objectIds: string[];
    }
  | {
      kind: 'reply';
      summary: string;
      objectIds: string[];
      suggestions?: DesignSuggestion[];
    };
const estimate = (value: number) => ({
  value,
  status: 'estimated' as const,
  sourceId: 'visitor-estimate',
});
const unknown = () => ({ status: 'unknown' as const, sourceId: null });
const planned = () => ({
  status: 'estimated' as const,
  sourceId: 'visitor-estimate',
});
const title = (target: MedyTarget) =>
  target.kind === 'furniture'
    ? target.piece.label.slice(0, 80)
    : target.kind === 'room'
      ? 'the room'
      : `the ${featureLabel(target.feature).toLowerCase()}`;

/** Input is the current human request after names are masked; no model text enters here. */
export function medyEdit(
  room: RoomDocument,
  words: string,
  targets: MedyTarget[],
  operationId: string,
): MedyEdit | null {
  const actions: VisitorAction[] = [];
  const ask = (
    summary: string,
    suggestions?: DesignSuggestion[],
  ): MedyEdit => ({
    kind: 'reply',
    summary,
    objectIds: targets.map((t) => t.id),
    ...(suggestions?.length ? { suggestions } : {}),
  });
  const batch = (label: string): MedyEdit => {
    const parsed = visitorBatchSchema.safeParse(actions);
    return parsed.success
      ? {
          kind: 'edits',
          label,
          actions: parsed.data,
          objectIds: [...new Set(targets.map((t) => t.id))],
        }
      : ask(
          'That value is outside the supported range. Tell me the size in mm, cm, m, feet or inches.',
        );
  };
  const editing =
    /\b(set|make|change|preview|resize|adjust|correct|confirm|measured|mark|move|place|put|rotate|turn|face|delete|remove|lock|unlock|protect|unprotect|own|owned|replace|add|mount|hang)\b/.test(
      words,
    );
  const openingPresetRequest =
    /\buse\b/.test(words) &&
    /\b(size|preset)\b/.test(words) &&
    targets.length === 1 &&
    targets[0]!.kind === 'feature' &&
    openingSizePresets(targets[0]!.feature).length > 0;
  if (!editing && !openingPresetRequest && !/\bshould be\b/.test(words))
    return null;
  if (/\d,\d|\d\s*[-–—/*]\s*\d/.test(words))
    return ask(
      'Give me one exact value per dimension, using a dot for decimals and no thousands separator — for example, 1800 mm or 1.8 m.',
    );
  if (/\b(or|if|whether)\b/.test(words))
    return ask(
      'Which exact change should I preview? Choose one value or condition; I won’t guess between alternatives.',
    );
  if (
    /\b(room palette|room style|warm-simple|calm-focused|light-airy)\b/.test(
      words,
    ) &&
    !/\b(move|rearrange|add|delete|remove|replace)\b/.test(words)
  ) {
    const mood = /\b(calm|focused|modern|minimal|japandi|scandinavian)\b/.test(
      words,
    )
      ? 'calm'
      : /\b(warm|simple)\b/.test(words)
        ? 'warm'
        : /\b(light|airy)\b/.test(words)
          ? 'light'
          : null;
    if (!mood)
      return ask(
        'Would you like Warm & simple, Light & airy, or Calm & focused?',
      );
    const style =
      mood === 'calm'
        ? 'calm-focused'
        : mood === 'warm'
          ? 'warm-simple'
          : 'light-airy';
    actions.push(
      { type: 'room-finish', ...designPalette(mood) },
      { type: 'set-intent', intent: { ...room.intent, style } },
    );
    const finish =
      mood === 'calm' ? 'walnut' : mood === 'warm' ? 'oak' : 'ivory';
    for (const piece of room.furniture)
      if (
        piece.ownership === 'proposed' &&
        findCatalogueEntry(
          piece.catalogueId,
          piece.catalogueVersion,
        )?.finishes.includes(finish)
      )
        actions.push({ type: 'finish', id: piece.id, finish });
    return batch(`Preview ${style.replace('-', ' & ')} palette`);
  }
  if (/\b(?:starting condition|room condition)\b/.test(words)) {
    const condition = /\b(partial|partly furnished)\b/.test(words)
      ? 'partial'
      : /\bempty\b/.test(words)
        ? 'empty'
        : /\bfurnished\b/.test(words)
          ? 'furnished'
          : null;
    if (!condition)
      return ask('Is the starting room empty, partly furnished or furnished?');
    actions.push({ type: 'set-intent', intent: { ...room.intent, condition } });
    return batch(`Set starting condition to ${condition}`);
  }
  if (/\bgoals?\b/.test(words)) {
    const goals = (['sleep', 'work', 'storage', 'open-space'] as const).filter(
      (goal) =>
        new RegExp(
          `\\b${goal === 'open-space' ? '(?:open space|open-space)' : goal}\\b`,
        ).test(words),
    );
    if (!goals.length)
      return ask('Which goal: sleep, work, storage or open space?');
    const next = /\b(remove|clear|disable)\b/.test(words)
      ? room.intent.goals.filter((goal) => !goals.includes(goal))
      : /\b(add|enable)\b/.test(words)
        ? [...new Set([...room.intent.goals, ...goals])]
        : goals;
    actions.push({
      type: 'set-intent',
      intent: { ...room.intent, goals: next },
    });
    return batch(`Update room goals: ${next.join(', ') || 'none'}`);
  }
  const surface = /\b(floor)\b/.test(words)
    ? 'floor'
    : /\b(wall|walls)\b/.test(words) &&
        !targets.some((t) => t.kind === 'feature')
      ? 'walls'
      : null;
  if (
    surface &&
    /\b(colou?r|finish|texture|paint|plaster|wood|linen|smooth|tile|carpet|concrete|#[a-f0-9]{6})\b/.test(
      words,
    )
  ) {
    const chosen = Object.keys(FINISH_COLORS).filter((f) =>
      new RegExp(`\\b${f}\\b`).test(words),
    );
    const hex = words.match(/#[a-f0-9]{6}\b/g);
    if (chosen.length > 1 || (hex?.length ?? 0) > 1)
      return ask('Which one colour should I use for that surface?');
    const color =
      hex?.[0] ?? FINISH_COLORS[chosen[0] as keyof typeof FINISH_COLORS];
    const texture = (
      Object.keys(SURFACE_TEXTURES) as (keyof typeof SURFACE_TEXTURES)[]
    )
      .filter((t) => isSurfaceTexture(surface, t))
      .find((t) =>
        new RegExp(`\\b${t === 'planks' ? '(?:planks|wood)' : t}\\b`).test(
          words,
        ),
      );
    if (!color && !texture)
      return ask(
        'I can use a six-digit hex colour or a supported surface texture. Which would you like?',
      );
    const surfaces: readonly ('floor' | 'walls')[] =
      /\bfloor\b/.test(words) && /\bwalls?\b/.test(words)
        ? (['floor', 'walls'] as const)
        : [surface];
    for (const target of surfaces) {
      if (texture && !isSurfaceTexture(target, texture))
        return ask(
          'Those surfaces offer different textures. Let’s choose the floor texture and wall texture separately.',
        );
      actions.push({
        type: 'set-room-surface',
        surface: target,
        ...(color ? { color } : {}),
        ...(texture ? { texture } : {}),
      });
    }
    return batch(
      `Change ${surfaces.length > 1 ? 'floor and wall' : surface === 'walls' ? 'wall' : 'floor'} finish`,
    );
  }
  // Feature additions use the same unknown/default measurements as the manual Add flow.
  const newFeature = words.match(
    /\badd\s+(?:a |an |new )?(?:(?:bathroom|balcony|patio|french|double glass|window) )?(door|window|obstacle)s?\b/,
  );
  if (newFeature) {
    if (room.room.features.length >= POLICY.features)
      return ask(
        'This room is at its feature limit. Remove an unused opening or obstacle first.',
      );
    const kind = newFeature[1] as Feature['kind'];
    const balcony =
      kind === 'door' &&
      /\b(balcony|patio|french)\b|\b(?:double glass|window) doors?\b/.test(
        words,
      );
    const base = {
      id: `medy-feature-${operationId}`.slice(0, 80),
      wall: 'unknown' as const,
      wallProvenance: unknown(),
      offset: estimate(200),
      width: estimate(
        balcony ? BALCONY_SIZE_PRESETS[0]!.width : kind === 'door' ? 900 : 1000,
      ),
      height: estimate(
        balcony
          ? BALCONY_SIZE_PRESETS[0]!.height
          : kind === 'door'
            ? 2100
            : 1000,
      ),
      sill: estimate(0),
    };
    const feature: Feature =
      kind === 'door'
        ? {
            ...base,
            kind,
            ...(balcony
              ? { purpose: 'balcony' as const }
              : /\bbathroom\b/.test(words)
                ? { purpose: 'bathroom' as const }
                : {}),
            mechanism: balcony ? 'sliding' : 'unknown',
            mechanismProvenance: balcony ? planned() : unknown(),
            hinge: 'unknown',
            hingeProvenance: unknown(),
          }
        : kind === 'window'
          ? {
              ...base,
              kind,
              mechanism: 'unknown',
              mechanismProvenance: unknown(),
            }
          : { ...base, kind, projection: estimate(300) };
    const fields = medyDimensions(words);
    if (fields.invalid)
      return ask(
        'There are conflicting feature dimensions. Give me one value for each dimension.',
      );
    for (const axis of ['width', 'height', 'offset', 'sill'] as const)
      if (fields.values[axis] !== undefined)
        feature[axis] = estimate(fields.values[axis]!);
    if (feature.kind === 'obstacle' && fields.values.projection !== undefined)
      feature.projection = estimate(fields.values.projection);
    const wall = words.match(/\b(north|south|east|west)\b/);
    if (wall) {
      feature.wall = wall[1] as 'north' | 'south' | 'east' | 'west';
      feature.wallProvenance = planned();
    }
    if (feature.kind !== 'obstacle') {
      const mechanism = words.match(/\b(inward|outward|sliding|fixed)\b/)?.[1];
      if (mechanism) {
        if (mechanism === 'fixed' && feature.kind === 'door')
          return ask(
            'A door can swing inward, outward or slide. Which mechanism should I use?',
          );
        feature.mechanism = mechanism as typeof feature.mechanism;
        feature.mechanismProvenance = planned();
      }
      if (feature.kind === 'door' && /\bhinge\b/.test(words)) {
        const hinge = words.match(
          /\b(left|right)\s+hinge\b|\bhinge\s+(?:on (?:the )?)?(left|right)\b/,
        );
        if (!hinge) return ask('Is that door hinge on the left or right?');
        feature.hinge = (hinge[1] ?? hinge[2]) as 'left' | 'right';
        feature.hingeProvenance = planned();
      }
    }
    actions.push({ type: 'add-feature', feature });
    return batch(
      `Add ${featureLabel(feature).toLowerCase()}${wall ? ` on the ${wall[1]} wall` : ' with wall to review'}`,
    );
  }
  const hasDimensions = medyDimensions(words);
  const replacement = words.split(/\breplace\b/)[1]?.split(/\bwith\b/)[1];
  const explicitAddition =
    /\badd\b/.test(words) &&
    (hasDimensions.values.x !== undefined ||
      hasDimensions.values.z !== undefined);
  if (/\badd\b/.test(words) && !explicitAddition) return null;
  if (
    /\breplace\b/.test(words) &&
    !replacement &&
    !/\bmay replace\b/.test(words)
  )
    return ask(
      'Which representation should replace the selected piece? For example, replace this desk with an Everyday desk.',
    );
  if (replacement || explicitAddition) {
    const clause = replacement ?? words;
    const named = CATALOGUE.filter((entry) => catalogueMention(entry, clause));
    const matches = named.length
      ? named
      : CATALOGUE.filter((entry) =>
          new RegExp(
            `\\b${entry.category === 'storage' ? '(?:storage|shelf|cabinet)' : entry.category}s?\\b`,
          ).test(clause),
        );
    const entries = named.length
      ? named
      : matches.filter(
          (entry, index) =>
            matches.findIndex((other) => other.category === entry.category) ===
            index,
        );
    if (!entries.length)
      return ask(
        'Which catalogue piece should I use? You can name a bed, desk, wardrobe, mirror, drawer shelf, TV stand or wall-mounted TV.',
      );
    // Categories with multiple representations require the actual catalogue name.
    if (entries.length !== 1)
      return ask(
        `Which representation: ${entries
          .slice(0, 5)
          .map((entry) => entry.label)
          .join(', ')}?`,
      );
    const entry = entries[0]!,
      choice = requestedCatalogueSize(entry, clause);
    if (choice.error) return ask(choice.error);
    const target =
      replacement && targets.length === 1 && targets[0]?.kind === 'furniture'
        ? targets[0].piece
        : null;
    if (replacement && !target)
      return ask(
        'Which existing piece should I replace? Select it or use its full name.',
      );
    const pose = target
      ? {
          centerX: target.pose.centerX,
          centerZ: target.pose.centerZ,
          quarterTurns: target.pose.quarterTurns,
        }
      : {
          centerX: hasDimensions.values.x ?? NaN,
          centerZ: hasDimensions.values.z ?? NaN,
          quarterTurns: 0 as const,
        };
    if (hasDimensions.values.x !== undefined)
      pose.centerX = hasDimensions.values.x;
    if (hasDimensions.values.z !== undefined)
      pose.centerZ = hasDimensions.values.z;
    if (![pose.centerX, pose.centerZ].every(Number.isFinite))
      return ask(
        'Give me both X and Z for that exact placement, or ask me to find a suitable place for it.',
      );
    const item = visitorCatalogueFurniture(
      entry,
      choice.size ?? {
        width: entry.size.width.default,
        depth: entry.size.depth.default,
      },
      pose,
      target?.id ?? `medy-piece-${operationId}`.slice(0, 80),
    );
    if (!target) item.pose.quarterTurns = preferredFurnitureFacing(room, item);
    item.pose = wallMountedPose(room, item);
    const finishes = entry.finishes.filter((f) =>
      new RegExp(`\\b${f}\\b`).test(clause),
    );
    if (finishes.length > 1) return ask('Which single finish should I use?');
    if (finishes[0]) item.finish = finishes[0];
    actions.push(
      target
        ? { type: 'replace', id: target.id, furniture: item }
        : { type: 'add', furniture: item },
    );
    return batch(
      `${target ? `Replace ${target.label} with` : 'Add'} ${item.label}: ${item.dimensions.width.value} × ${item.dimensions.depth.value} mm (planning size)${explicitAddition ? ` at X ${item.pose.centerX}, Z ${item.pose.centerZ} mm` : ''}`,
    );
  }
  const sizeWords =
    /\b(width|wide|depth|deep|height|high|tall|length|long|size|resize|offset|sill|projection|x|z|queen|king|twin|double|compact|standard|narrow|inch|inches)\b/.test(
      words,
    ) || /\d\s*x\s*\d/.test(words);
  const metadata =
    /\b(lock|unlock|protect|unprotect|ownership|owned|own|proposed|preference|flexible|may replace|mark.*keep)\b/.test(
      words,
    );
  const moving =
    /\b(move|place|put)\b/.test(words) ||
    hasDimensions.values.x !== undefined ||
    hasDimensions.values.z !== undefined;
  const rotation =
    /\b(rotate|face)\b/.test(words) ||
    (/\bturn\b/.test(words) &&
      /\b(around|clockwise|counterclockwise|anticlockwise|degrees?)\b|\d/.test(
        words,
      ));
  const deletion =
    /\b(delete|remove)\b/.test(words) && !/\bgoals?\b/.test(words);
  const measured = /\b(measured|confirm|actual measurement)\b/.test(words);
  const markUnknown = /\b(unknown|not known|not sure)\b/.test(words);
  if (targets.length !== 1) {
    if (
      sizeWords ||
      metadata ||
      rotation ||
      deletion ||
      (moving && Object.keys(hasDimensions.values).length)
    )
      return ask(
        targets.length
          ? 'Which piece or opening do you mean? Select one, or use its full name.'
          : 'Which piece, opening or room dimension should I change? Select it or name it.',
      );
    return null;
  }
  const target = targets[0]!,
    label = title(target);
  if (
    target.kind === 'furniture' &&
    /\b(lock|unlock|protect|unprotect)\b/.test(words)
  ) {
    const value = !/\b(unlock|unprotect)\b/.test(words),
      locks = { ...target.piece.locks };
    const keys = [
      ...(/\b(position|place|moving|movement)\b/.test(words)
        ? ['position' as const]
        : []),
      ...(/\b(rotation|turning|orientation)\b/.test(words)
        ? ['rotation' as const]
        : []),
      ...(/\b(size|dimensions|width|height|depth)\b/.test(words)
        ? ['dimensions' as const]
        : []),
    ];
    for (const key of keys.length
      ? keys
      : (['position', 'rotation', 'dimensions'] as const))
      locks[key] = value;
    actions.push({ type: 'set-locks', id: target.id, locks });
    return batch(
      `${value ? 'Lock' : 'Unlock'} ${keys.length ? keys.join(' and ') : 'all controls'} for ${label}`,
    );
  }
  if (
    target.kind === 'furniture' &&
    /\b(ownership|owned|own|proposed)\b/.test(words)
  ) {
    actions.push({
      type: 'set-ownership',
      id: target.id,
      ownership: /\b(proposed|do not own|don't own)\b/.test(words)
        ? 'proposed'
        : 'owned',
    });
    return batch(
      `Mark ${label} as ${actions[0]!.type === 'set-ownership' ? actions[0]!.ownership : 'owned'}`,
    );
  }
  if (
    target.kind === 'furniture' &&
    /\b(preference|flexible|may replace|mark.*keep)\b/.test(words)
  ) {
    const preference = /\b(may replace|replaceable)\b/.test(words)
      ? 'replace'
      : /\bflexible\b/.test(words)
        ? 'flexible'
        : 'keep';
    actions.push({ type: 'set-preference', id: target.id, preference });
    return batch(
      `Mark ${label} ${preference === 'replace' ? 'May replace' : preference}`,
    );
  }
  if (deletion) {
    if (target.kind === 'room')
      return ask(
        'To replace this room, ask me to start a new room. Your existing confirmation will appear first.',
      );
    if (target.kind === 'feature' && target.feature.kind === 'door')
      return ask(
        'Doors stay in the room. I can help you move this door or change how it opens.',
      );
    actions.push(
      target.kind === 'feature'
        ? { type: 'remove-feature', id: target.id }
        : { type: 'remove', id: target.id, overrideLocks: true },
    );
    return batch(`Delete ${label}`);
  }
  if (target.kind === 'furniture' && rotation) {
    const piece = target.piece;
    if (piece.locks.rotation)
      return ask(
        `${label} has rotation locked. Ask me to unlock its rotation first, then I can turn it.`,
      );
    const numbers = [...words.matchAll(/[-+]?\d+(?:\.\d+)?/g)];
    const number = numbers[0]?.[0];
    if (
      numbers.length > 1 ||
      (number !== undefined && !['90', '180', '270'].includes(number))
    )
      return ask(
        'The editor turns furniture in 90° steps. Would you like 90°, 180° or 270°?',
      );
    const facing = words.match(/\bface\s+(north|south|east|west)\b/);
    if (/\bface\b/.test(words) && !facing)
      return ask(
        'Which way should its front face: north, south, east or west?',
      );
    const compass = { north: 2, south: 0, east: 3, west: 1 } as const;
    const turns = number
      ? Number(number) / 90
      : /\baround\b/.test(words)
        ? 2
        : 1;
    const direction = /\b(counterclockwise|anticlockwise)\b/.test(words)
      ? -1
      : 1;
    const quarterTurns = facing
      ? compass[facing[1] as keyof typeof compass]
      : (((piece.pose.quarterTurns + direction * turns + 4) % 4) as
          0 | 1 | 2 | 3);
    actions.push({ type: 'rotate', id: piece.id, quarterTurns });
    return batch(
      `Turn ${label}${facing ? ` to face ${facing[1]}` : ` ${turns * 90}° ${direction === -1 ? 'counterclockwise' : 'clockwise'}`}`,
    );
  }
  if (hasDimensions.invalid)
    return ask(
      'I found conflicting values. Give me one value per dimension, with units.',
    );
  if (
    target.kind === 'furniture' &&
    findCatalogueEntry(target.piece.catalogueId, target.piece.catalogueVersion)
      ?.category === 'tv'
  ) {
    const elevation =
      words.match(
        new RegExp(
          `(?:bottom(?: edge)?(?: height)?|mounting height|height above (?:the )?floor)\\s*(?:to|at|is|of)?\\s*${MEDY_QUANTITY}`,
        ),
      ) ?? words.match(new RegExp(`${MEDY_QUANTITY}\\s*above (?:the )?floor`));
    const wall = words.match(
      /\b(?:on|to|against) (?:the )?(north|east|south|west) wall\b/,
    );
    if (elevation || wall) {
      if (target.piece.locks.position)
        return ask(`${label} has position locked. Unlock its position first.`);
      if (wall && !wallMounted(target.piece))
        return ask(
          'Choose the Wall-mounted TV representation to mount it on a wall.',
        );
      const pose = { ...target.piece.pose };
      if (elevation) {
        const mm = medyMillimetres(elevation[1]!, elevation[2], true);
        if (mm === null || mm < 0)
          return ask(
            'Give me a positive mounting height above the floor, with units.',
          );
        pose.bottomY = mm;
      }
      if (wall) {
        if (target.piece.locks.rotation)
          return ask('Unlock rotation before changing the mounting wall.');
        pose.quarterTurns = ({ north: 0, east: 1, south: 2, west: 3 } as const)[
          wall[1] as 'north' | 'east' | 'south' | 'west'
        ];
      }
      actions.push({
        type: 'move',
        id: target.id,
        pose: placementTarget(wallMountedPose(room, target.piece, pose)),
      });
      return batch(
        `Change ${label} mounting${elevation ? ` to ${pose.bottomY} mm above the floor` : ''}`,
      );
    }
  }
  if (target.kind === 'furniture' && moving) {
    const piece = target.piece,
      pose = {
        centerX: piece.pose.centerX,
        centerZ: piece.pose.centerZ,
        quarterTurns: piece.pose.quarterTurns,
      };
    if (hasDimensions.values.x !== undefined)
      pose.centerX = hasDimensions.values.x;
    if (hasDimensions.values.z !== undefined)
      pose.centerZ = hasDimensions.values.z;
    const relative =
      words.match(
        new RegExp(
          `(?:\\bby\\s+)?${MEDY_QUANTITY}\\s*(?:to the )?(left|right|north|south|up|down|forward|backward)\\b`,
        ),
      ) ??
      words.match(
        new RegExp(
          `\\b(left|right|north|south|up|down|forward|backward)\\s+(?:by\\s+)?${MEDY_QUANTITY}`,
        ),
      );
    if (relative) {
      const forward = /^[-+\d]/.test(relative[1]!),
        distance = medyMillimetres(
          forward ? relative[1]! : relative[2]!,
          forward ? relative[2] : relative[3],
          true,
        ),
        direction = forward ? relative[3] : relative[1];
      if (distance === null || distance < 0)
        return ask(
          'Give me a positive distance and a direction, such as 20 cm to the right.',
        );
      if (direction === 'left' || direction === 'right')
        pose.centerX += distance * (direction === 'left' ? -1 : 1);
      else
        pose.centerZ +=
          distance * (['north', 'up', 'forward'].includes(direction!) ? -1 : 1);
    } else if (
      hasDimensions.values.x === undefined &&
      hasDimensions.values.z === undefined
    )
      return null;
    if (piece.locks.position)
      return ask(
        `${label} has position locked. Ask me to unlock its position first.`,
      );
    actions.push({
      type: 'move',
      id: piece.id,
      pose: placementTarget(
        wallMountedPose(room, piece, { ...piece.pose, ...pose }),
      ),
    });
    return batch(`Move ${label} to X ${pose.centerX} mm, Z ${pose.centerZ} mm`);
  }
  if (target.kind === 'feature') {
    const next = { ...target.feature },
      wall = words.match(
        /\b(north|south|east|west|unknown)\s+wall\b|\bwall\s+(?:to )?(north|south|east|west|unknown)\b/,
      );
    let changed = false;
    if (
      next.kind === 'door' &&
      /\b(bathroom|balcony|patio|hallway|hall)\b/.test(words)
    ) {
      next.purpose = /\b(balcony|patio)\b/.test(words)
        ? 'balcony'
        : /\bbathroom\b/.test(words)
          ? 'bathroom'
          : 'room';
      changed = true;
    }
    const sizeNames = [
        ...new Set(
          [
            ...words.matchAll(
              /\b(small|medium|wide|large|compact|standard|tall)\b/g,
            ),
          ].map((match) => match[1]!),
        ),
      ],
      sizeName = sizeNames[0];
    const numericAdjectives =
      !/\bpreset\b/.test(words) &&
      sizeNames.length > 0 &&
      sizeNames.every(
        (name) =>
          (name === 'wide' && hasDimensions.values.width !== undefined) ||
          (name === 'tall' && hasDimensions.values.height !== undefined),
      );
    if (
      sizeName &&
      !numericAdjectives &&
      /\b(size|preset|resize|make|set|change|use)\b/.test(words) &&
      openingSizePresets(next).length
    ) {
      if (sizeNames.length > 1)
        return ask('Choose one opening size preset for this change.');
      if (Object.keys(hasDimensions.values).length || markUnknown)
        return ask(
          'Choose a size preset, or give me exact dimensions as a separate request.',
        );
      const resized = applyOpeningSizePreset(next, sizeName);
      if (!resized)
        return ask(
          `Choose ${openingSizePresets(next)
            .map((p) => p.label.toLowerCase())
            .join(', ')} for ${label}.`,
        );
      actions.push({ type: 'update-feature', id: next.id, feature: resized });
      return batch(
        `Resize ${label} to ${sizeName} · ${resized.width.value} × ${resized.height.value} mm`,
      );
    }
    for (const axis of [
      'width',
      'height',
      'offset',
      'sill',
      'projection',
    ] as const) {
      if (axis === 'projection' && next.kind !== 'obstacle') continue;
      const value = hasDimensions.values[axis];
      if (
        value === undefined &&
        !(markUnknown && new RegExp(`\\b${axis}\\b`).test(words))
      )
        continue;
      const measurement = markUnknown
        ? { value: null, status: 'unknown' as const, sourceId: null }
        : {
            value: value!,
            status: 'confirmed' as const,
            sourceId: 'visitor-confirmed',
          };
      if (axis === 'projection') {
        if (next.kind === 'obstacle') next.projection = measurement;
      } else next[axis] = measurement;
      changed = true;
    }
    if (wall) {
      next.wall = (wall[1] ?? wall[2]) as Feature['wall'];
      next.wallProvenance = next.wall === 'unknown' ? unknown() : planned();
      changed = true;
    }
    if (
      next.kind !== 'obstacle' &&
      /\b(mechanism|opening|opens?|sliding|inward|outward|fixed)\b/.test(words)
    ) {
      const mechanism = words.match(
        /\b(inward|outward|sliding|fixed|unknown)\b/,
      )?.[1];
      if (!mechanism || (mechanism === 'fixed' && next.kind === 'door'))
        return ask(
          'Does that opening swing inward, outward, slide, or is it unknown?',
        );
      next.mechanism = mechanism as typeof next.mechanism;
      next.mechanismProvenance =
        mechanism === 'unknown' ? unknown() : planned();
      changed = true;
    }
    if (next.kind === 'door' && /\bhinge\b/.test(words)) {
      const hinge = words.match(/\b(left|right|unknown)\b/)?.[1];
      if (!hinge)
        return ask('Is the door hinge on the left or right, or unknown?');
      next.hinge = hinge as 'left' | 'right' | 'unknown';
      next.hingeProvenance = hinge === 'unknown' ? unknown() : planned();
      changed = true;
    }
    if (changed) {
      actions.push({ type: 'update-feature', id: next.id, feature: next });
      return batch(`Update ${label}`);
    }
  }
  if (
    sizeWords &&
    (Object.keys(hasDimensions.values).length ||
      markUnknown ||
      /\b(size|resize|queen|king|twin|double|compact|standard|narrow|inch|inches)\b/.test(
        words,
      ))
  ) {
    if (
      target.kind === 'feature' ||
      target.kind === 'room' ||
      measured ||
      markUnknown
    ) {
      const axes =
        target.kind === 'feature'
          ? ([
              'width',
              'height',
              'offset',
              'sill',
              ...(target.feature.kind === 'obstacle' ? ['projection'] : []),
            ] as const)
          : (['width', 'depth', 'height'] as const);
      const chosen = axes.filter(
        (axis) =>
          hasDimensions.values[axis as keyof typeof hasDimensions.values] !==
            undefined ||
          (markUnknown && new RegExp(`\\b${axis}\\b`).test(words)),
      );
      if (!chosen.length)
        return ask(
          'Which dimension should I use, and what value? For example, room width 4.2 m.',
        );
      for (const field of chosen)
        actions.push({
          type: 'confirm-measurement',
          target: {
            kind: target.kind,
            id: target.id,
            field: field as
              'width' | 'depth' | 'height' | 'offset' | 'sill' | 'projection',
          },
          value: markUnknown
            ? null
            : hasDimensions.values[field as keyof typeof hasDimensions.values]!,
        });
      return batch(
        `${markUnknown ? 'Mark unknown' : 'Record your measurement for'} ${label}: ${chosen.map((axis) => `${axis}${markUnknown ? '' : ` ${hasDimensions.values[axis as keyof typeof hasDimensions.values]} mm`}`).join(', ')}`,
      );
    }
    const piece = target.piece,
      entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)!;
    const size = { ...hasDimensions.values };
    if (!Object.keys(size).length) {
      const presets = matchingFurnitureSizePresets(entry, words);
      if (presets.length !== 1)
        return ask(
          presets.length
            ? 'That bed size varies by region. Which of these do you mean? The displayed frame size includes the same 100 mm planning allowance as the manual presets.'
            : 'Which size would you like? Give me an overall width/depth or choose a supported preset.',
          presets.slice(0, 3).map((p) => ({
            label: `${p.group.replace(' mattress sizes', '')} ${p.label}`,
            request: `Set this selected piece size to ${p.id.replaceAll('-', ' ')}`,
            selectedId: piece.id,
            roomRevision: room.roomRevision,
          })),
        );
      Object.assign(size, {
        width: presets[0]!.width,
        depth: presets[0]!.depth,
        ...(presets[0]!.height === undefined
          ? {}
          : { height: presets[0]!.height }),
      });
    }
    const width = size.width ?? piece.dimensions.width.value,
      depth = size.depth ?? piece.dimensions.depth.value;
    if (width === null || depth === null)
      return ask(
        `I need ${width === null ? 'width' : 'depth'} for ${label} before I can preview its size. What is it?`,
      );
    actions.push({
      type: 'set-size-estimate',
      id: piece.id,
      width,
      depth,
      ...(size.height === undefined ? {} : { height: size.height }),
      overrideSizeLock: true,
    });
    const finishes = Object.keys(FINISH_COLORS).filter((finish) =>
      new RegExp(`\\b${finish}\\b`).test(words),
    );
    if (finishes.length > 1)
      return ask('Which single furniture finish should I use?');
    if (finishes[0]) {
      const finish = finishes[0] as keyof typeof FINISH_COLORS;
      if (!entry.finishes.includes(finish))
        return ask(
          `${label} offers ${entry.finishes.join(', ')}. Which finish would you like?`,
        );
      actions.push({ type: 'finish', id: piece.id, finish });
    }
    return batch(
      `Set ${label} to ${width} × ${depth}${size.height === undefined ? '' : ` × ${size.height}`} mm (planning size)${finishes[0] ? ` in ${finishes[0]}` : ''}`,
    );
  }
  if (
    target.kind === 'furniture' &&
    /\b(finish|colou?r|paint|oak|ivory|clay|sage|walnut|charcoal|blue|red|pink|purple|green|white|black)\b/.test(
      words,
    )
  ) {
    const finishes = Object.keys(FINISH_COLORS).filter((f) =>
      new RegExp(`\\b${f}\\b`).test(words),
    );
    const entry = CATALOGUE.find((e) => e.id === target.piece.catalogueId)!;
    if (
      finishes.length !== 1 ||
      !entry.finishes.includes(finishes[0] as (typeof entry.finishes)[number])
    )
      return ask(
        `${label} offers ${entry.finishes.join(', ')}. Which finish would you like?`,
      );
    actions.push({
      type: 'finish',
      id: target.id,
      finish: finishes[0] as (typeof entry.finishes)[number],
    });
    return batch(`Change ${label} to ${finishes[0]}`);
  }
  return null;
}
