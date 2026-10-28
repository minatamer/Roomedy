import type { RoomDocument } from '@roomedy/contracts/room';
import {
  findCatalogueEntry,
  roomMaterialOpportunities,
} from '@roomedy/spatial';

export type GuidanceStep =
  'welcome' | 'direction' | 'layout' | 'finishes' | 'talk';
export interface GuidanceChoice {
  id: string;
  label: string;
  next?: Exclude<GuidanceStep, 'welcome'>;
  request?: string;
  colors?: readonly string[];
}
export const guidanceText: Record<GuidanceStep, string> = {
  welcome: 'Hi, I’m Medy. What would you like to make room for?',
  direction: 'Start with the layout or the mood?',
  layout: 'What would make your space work better?',
  finishes: 'Choose a palette to preview.',
  talk: 'What’s working in your room, and what would you change?',
};

export function guidanceMessage(step: GuidanceStep, room: RoomDocument) {
  if (roomMaterialOpportunities(room).length) {
    if (step === 'welcome')
      return 'Hi, I’m Medy. Let’s bring your room to life with materials.';
    if (step === 'finishes') return 'Start with a finish you’d like to see.';
  }
  return guidanceText[step];
}

export function guidanceChoices(
  step: GuidanceStep,
  room: RoomDocument,
  tourSeen: boolean,
): readonly GuidanceChoice[] {
  const materials = roomMaterialOpportunities(room);
  switch (step) {
    case 'welcome':
      return [
        ...(!tourSeen
          ? [{ id: 'tour', label: 'Show me around', request: 'Show me around' }]
          : []),
        {
          id: materials.length ? 'materials' : 'direction',
          label: materials.length
            ? 'Explore materials'
            : 'Help me find a direction',
          next: materials.length ? 'finishes' : 'direction',
        },
        { id: 'talk', label: 'Let’s talk', next: 'talk' },
      ];
    case 'direction':
      return [
        { id: 'layout', label: 'Layout & space', next: 'layout' },
        { id: 'finishes', label: 'Colours & materials', next: 'finishes' },
      ];
    case 'layout':
      return [
        room.furniture.some((p) => p.ownership === 'owned')
          ? {
              id: 'owned',
              label: 'Rearrange what I own',
              request: 'Rearrange what I own',
            }
          : {
              id: 'essentials',
              label: 'Start with the essentials',
              request: 'I need a bed, desk, chair and wardrobe',
            },
        ...(room.furniture.some(
          (p) =>
            findCatalogueEntry(p.catalogueId, p.catalogueVersion)?.category ===
            'desk',
        ) && room.room.features.some((f) => f.kind === 'window')
          ? [
              {
                id: 'window',
                label: 'Work area by the window',
                request: 'Move the work area near the window',
              },
            ]
          : []),
        {
          id: 'checks',
          label: 'Understand the room checks',
          request: 'Explain the room checks',
        },
      ];
    case 'finishes':
      if (materials.length)
        return materials
          .slice(0, 3)
          .map(({ label, request, colors }, index) => ({
            id: `material-${index}`,
            label,
            request,
            colors,
          }));
      return ['Warm & simple', 'Light & airy', 'Calm & focused'].map(
        (label) => ({
          id: label,
          label,
          request: `Preview ${label} room palette`,
        }),
      );
    case 'talk':
      return [];
  }
}
