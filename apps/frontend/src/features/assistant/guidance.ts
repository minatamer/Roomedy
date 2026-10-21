import type { RoomDocument } from '@roomedy/contracts/room';
import { findCatalogueEntry } from '@roomedy/spatial';

export type GuidanceStep =
  'welcome' | 'direction' | 'layout' | 'finishes' | 'talk';
export interface GuidanceChoice {
  id: string;
  label: string;
  next?: Exclude<GuidanceStep, 'welcome'>;
  request?: string;
}
export const guidanceText: Record<GuidanceStep, string> = {
  welcome:
    'Hi, I’m Medy. What would you like to make room for?\n\nWe can find a direction together, or talk through what’s on your mind.',
  direction:
    'Let’s take it one step at a time. Would you like to start with how the room works, or how it feels?',
  layout:
    'What would make the space more useful for you? We can start with one idea and preview it together.',
  finishes:
    'What kind of atmosphere feels like you? Pick a starting point and I’ll prepare a palette to preview.',
  talk: 'I’m listening. What do you like about your room, and what isn’t working for you? You can start anywhere.',
};

export function guidanceChoices(
  step: GuidanceStep,
  room: RoomDocument,
  tourSeen: boolean,
): readonly GuidanceChoice[] {
  switch (step) {
    case 'welcome':
      return [
        ...(!tourSeen
          ? [{ id: 'tour', label: 'Show me around', request: 'Show me around' }]
          : []),
        {
          id: 'direction',
          label: 'Help me find a direction',
          next: 'direction',
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
