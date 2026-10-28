import type { RoomDocument } from '@roomedy/contracts/room';
import {
  CATALOGUE,
  findCatalogueEntry,
  supportsDimensions,
} from './catalogue.js';
import { roomSurface, FINISH_COLORS } from '@roomedy/contracts/surfaces';
import {
  furnitureMaterialRoles,
  furnitureMaterialTargets,
} from '@roomedy/contracts/furniture-materials';
import { medyTargets } from './medy-language.js';

export interface MaterialOpportunity {
  label: string;
  request: string;
  reason: string;
  colors: string[];
}

/** Explicit optional appearance previews; neither their labels nor model prose authorize edits. */
export function roomMaterialOpportunities(
  room: RoomDocument,
): MaterialOpportunity[] {
  const options: MaterialOpportunity[] = [];
  if (roomSurface(room.room, 'floor').texture === 'concrete')
    options.push({
      label: 'Try oak flooring',
      request: 'Change floor texture to wood planks in oak',
      reason:
        'Oak planks would bring warmth and a natural grain to the plain floor.',
      colors: [roomSurface(room.room, 'floor').color, FINISH_COLORS.oak],
    });
  const pieces = room.furniture
    .map((piece) => ({
      piece,
      entry: findCatalogueEntry(piece.catalogueId, piece.catalogueVersion),
    }))
    .sort((a, b) => {
      const priority = (category?: string) =>
        category === 'bed' ? 0 : category === 'wardrobe' ? 1 : 2;
      return priority(a.entry?.category) - priority(b.entry?.category);
    });
  for (const { piece, entry } of pieces) {
    if (!entry) continue;
    const roles = furnitureMaterialRoles(
        entry,
        supportsDimensions(entry, {
          width: piece.dimensions.width.value ?? 0,
          depth: piece.dimensions.depth.value ?? 0,
          height: piece.dimensions.height.value ?? 0,
        }),
      ),
      body = roles.body && piece.materials?.body === 'plain',
      soft = roles.soft && piece.materials?.upholstery === 'plain';
    if (!body && !soft) continue;
    const target = entry.category;
    const request = body
      ? `Make the ${target} frame material wood${soft ? ' and upholstery linen' : ''}; make the ${target} finish oak`
      : `Make the ${target} upholstery linen`;
    // A category must identify this actual piece; avoid guessing between duplicates or labels.
    const targets = medyTargets(room, request, null, []);
    if (targets.length !== 1 || targets[0]?.id !== piece.id) continue;
    options.push({
      label: body ? `Wood for the ${target}` : `Linen for the ${target}`,
      request,
      colors: body
        ? [
            furnitureMaterialTargets(piece, entry.category).frame.color,
            FINISH_COLORS.oak,
          ]
        : [furnitureMaterialTargets(piece, entry.category).soft.color],
      reason: body
        ? `A warm wood frame${soft ? ' with linen soft parts' : ''} would give ${piece.label} texture while keeping its size and position.`
        : `Linen would give ${piece.label} a softer woven finish without changing its shape.`,
    });
  }
  if (roomSurface(room.room, 'walls').texture === 'smooth')
    options.push({
      label: 'Try soft plaster walls',
      request: 'Change walls texture to plaster',
      reason:
        'A soft plaster finish can add subtle depth while retaining the wall colour.',
      colors: [roomSurface(room.room, 'walls').color],
    });
  return options.slice(0, 5);
}

export interface DesignOpportunity {
  label: string;
  request: string;
  catalogueIds: string[];
  reason: string;
}

/** Suggestions about this plan's inventory, never a requirement to own every category. */
export function roomDesignOpportunities(
  room: RoomDocument,
): DesignOpportunity[] {
  const categories = new Set(
    room.furniture.flatMap((piece) => {
      const entry = findCatalogueEntry(
        piece.catalogueId,
        piece.catalogueVersion,
      );
      return entry ? [entry.category] : [];
    }),
  );
  const opportunities: DesignOpportunity[] = [];
  const workAreaLocation =
    room.room.features.filter((feature) => feature.kind === 'window').length ===
    1
      ? ' near the window'
      : '';
  const offer = (
    label: string,
    request: string,
    catalogueIds: string[],
    reason: string,
  ) => {
    if (catalogueIds.every((id) => CATALOGUE.some((entry) => entry.id === id)))
      opportunities.push({ label, request, catalogueIds, reason });
  };
  if (room.intent.goals.includes('work') && !categories.has('desk'))
    offer(
      'Add a work area',
      `${categories.has('chair') ? 'I need a desk' : 'I need a desk and chair'}${workAreaLocation}`,
      categories.has('chair')
        ? ['procedural-desk']
        : ['procedural-desk', 'procedural-chair'],
      'There is no desk in the plan yet. A desk and suitable seat would give the work zone a purpose.',
    );
  if (categories.has('desk') && !categories.has('chair'))
    offer(
      'Add a work chair',
      'I need a chair',
      ['procedural-chair'],
      'The plan has a desk but no work chair to use with it.',
    );
  if (room.intent.goals.includes('sleep') && !categories.has('bed'))
    offer(
      'Start with a bed',
      'I need a bed',
      ['procedural-bed'],
      'A bed would establish the sleeping zone requested for this room.',
    );
  if (
    room.intent.goals.includes('storage') &&
    !categories.has('wardrobe') &&
    !categories.has('storage')
  )
    offer(
      'Add useful storage',
      'I need a wardrobe',
      ['wardrobe-hinged'],
      'There is no wardrobe or storage piece in this plan yet.',
    );
  if (
    categories.has('bed') &&
    !room.furniture.some((piece) =>
      ['bedside-storage-fixed', 'bedside-drawers'].includes(piece.catalogueId),
    )
  )
    offer(
      'Add a bedside cabinet',
      'I need storage with a Bedside cabinet',
      ['bedside-storage-fixed'],
      'A small bedside surface could keep everyday items within reach without adding a large piece.',
    );
  if (room.furniture.length && !categories.has('lighting'))
    offer(
      'Try a floor lamp',
      'I need lighting with a Floor lamp',
      ['floor-lamp'],
      'A floor lamp is an optional way to make a reading or evening corner more useful.',
    );
  if (categories.has('bed') && !categories.has('mirror'))
    offer(
      'Try a full-length mirror',
      'I need a Full-length mirror',
      ['full-length-mirror'],
      'A full-length mirror could make a dressing spot more practical.',
    );
  return opportunities.slice(0, 5);
}
