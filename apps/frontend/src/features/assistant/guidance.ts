import type { RoomDocument } from '@roomedy/contracts/room';
import {
  BEDROOM_THEMES,
  bedroomTheme,
  furnitureMaterialTargets,
  roomBedroomTheme,
} from '@roomedy/contracts/furniture-materials';
import type { BedroomThemeId } from '@roomedy/contracts/furniture-materials';
import { FINISH_COLORS, roomSurface } from '@roomedy/contracts/surfaces';
import {
  featureLabel,
  roomDesignOpportunities,
  findCatalogueEntry,
} from '@roomedy/spatial';

export type GuidanceStep =
  | 'welcome'
  | 'themes'
  | 'themes-2'
  | 'themes-3'
  | 'services'
  | 'furniture'
  | 'openings'
  | 'layout'
  | 'done';
export interface GuidanceChoice {
  id: string;
  label: string;
  next?: GuidanceStep;
  request?: string;
  afterApply?: GuidanceStep;
  themeId?: BedroomThemeId;
  colors?: readonly string[];
  icon?:
    | 'tour'
    | 'start'
    | 'capabilities'
    | 'walls'
    | 'furniture'
    | 'floor'
    | 'room';
}
export const guidanceText: Record<GuidanceStep, string> = {
  welcome: 'Hi, I’m Medy. Let’s make this room yours, one step at a time.',
  themes:
    'First, let’s choose a theme. Try a warm, natural look or a cleaner modern contrast. You’ll see the colours and textures before keeping anything.',
  'themes-2':
    'Light Scandinavian wood or a warmer earthy palette? Each theme pairs wall and floor textures with furniture colours.',
  'themes-3':
    'Try an industrial look, or keep your solid colours. Either way, we can move on to furniture.',
  services:
    'I can help choose colours and textures, add useful furniture, arrange your layout, and edit doors and window frames. You can also ask for a tour, switch views or export the design. Room changes stay in preview until you Apply.',
  furniture:
    'Next, let’s make the room useful. Add a piece you need, or keep the furniture you have.',
  openings:
    'Let’s check the doors and window frames before arranging the room.',
  layout:
    'Now, how would you like the room to work? We can open up the floor or make a better work area.',
  done: 'Your theme, furniture and layout are a starting point. Tell me what you’d like to refine, or keep exploring the room.',
};
const opening = (room: RoomDocument) =>
  room.room.features.find(
    (feature) => feature.kind === 'door' && feature.purpose === 'bathroom',
  ) ??
  room.room.features.find((feature) => feature.kind === 'door') ??
  room.room.features.find((feature) => feature.kind === 'window');

export function guidanceMessage(step: GuidanceStep, room: RoomDocument) {
  if (step === 'furniture') {
    const opportunity = roomDesignOpportunities(room)[0];
    if (opportunity)
      return `Next, let’s look at furniture. ${opportunity.reason} Would you like to try it, or keep the pieces you have?`;
  }
  if (step === 'openings') {
    const feature = opening(room);
    return feature
      ? `There’s a ${featureLabel(feature).toLowerCase()} here. Is its ${feature.kind === 'window' ? 'frame colour' : 'colour'} right, or would you like to coordinate it with the room?`
      : 'There are no openings in this plan yet. We can keep going with the layout, or use Room to add a door or window.';
  }
  return guidanceText[step];
}

export function guidanceChoices(
  step: GuidanceStep,
  room: RoomDocument,
  tourSeen: boolean,
  themeId: BedroomThemeId | null = null,
): readonly GuidanceChoice[] {
  if (step === 'welcome')
    return [
      ...(!tourSeen
        ? [
            {
              id: 'tour',
              label: 'Show me around',
              request: 'Show me around',
              icon: 'tour' as const,
            },
          ]
        : []),
      {
        id: 'get-started',
        label: 'Let’s get started',
        next: 'themes',
        icon: 'start',
      },
      {
        id: 'services',
        label: 'What can you do for me?',
        next: 'services',
        icon: 'capabilities',
      },
    ];
  if (step === 'themes' || step === 'themes-2' || step === 'themes-3') {
    const page = step === 'themes' ? 0 : step === 'themes-2' ? 1 : 2;
    return [
      ...BEDROOM_THEMES.slice(page * 2, page * 2 + 2).map((theme) => ({
        id: `theme-${theme.id}`,
        label: theme.name,
        request: `Preview ${theme.name} bedroom theme`,
        themeId: theme.id,
        afterApply: 'furniture' as const,
        colors: [
          theme.wallColor,
          theme.floorColor,
          FINISH_COLORS[theme.furnitureFinish],
          theme.softColor,
        ],
      })),
      ...(page === 2
        ? [
            {
              id: 'keep-plain',
              label: 'Keep my solid colours',
              next: 'furniture' as const,
              icon: 'furniture' as const,
            },
          ]
        : []),
      {
        id: 'more-themes',
        label: page === 2 ? 'Back to the first themes' : 'More themes',
        next: page === 0 ? 'themes-2' : page === 1 ? 'themes-3' : 'themes',
        icon: 'capabilities',
      },
    ];
  }
  if (step === 'services')
    return [
      {
        id: 'start-theme',
        label: 'Choose a theme',
        next: 'themes',
        icon: 'walls',
      },
      {
        id: 'start-furniture',
        label: 'Find useful furniture',
        next: 'furniture',
        icon: 'furniture',
      },
      {
        id: 'start-layout',
        label: 'Work on the layout',
        next: 'layout',
        icon: 'floor',
      },
    ];
  if (step === 'furniture')
    return [
      ...roomDesignOpportunities(room)
        .slice(0, 2)
        .map((opportunity, index) => ({
          id: `add-${index}`,
          label: opportunity.label,
          request: opportunity.request,
          afterApply: 'openings' as const,
          icon: 'furniture' as const,
        })),
      {
        id: 'keep-furniture',
        label: 'Keep these pieces',
        next: 'openings',
        icon: 'room',
      },
    ];
  if (step === 'openings') {
    const feature = opening(room);
    if (!feature)
      return [
        {
          id: 'continue-layout',
          label: 'Plan the layout',
          next: 'layout',
          icon: 'floor',
        },
      ];
    const label = featureLabel(feature).toLowerCase();
    const piece =
      room.furniture.find(
        (piece) =>
          findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
            ?.category === 'bed',
      ) ?? room.furniture[0];
    const entry = piece
      ? findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
      : undefined;
    const preset = themeId ? bedroomTheme(themeId) : undefined;
    const currentTheme =
      roomBedroomTheme(room.room) ??
      (preset && roomSurface(room.room, 'floor').color === preset.floorColor
        ? preset
        : undefined);
    const color =
      piece && entry
        ? furnitureMaterialTargets(piece, entry.category).frame.color
        : currentTheme
          ? FINISH_COLORS[currentTheme.furnitureFinish]
          : FINISH_COLORS.oak;
    const target = feature.kind === 'window' ? `${label} frame` : label;
    return [
      {
        id: 'opening-wood',
        label:
          feature.kind === 'window'
            ? 'Coordinate the frame'
            : 'Match the furniture',
        request: `Paint the ${target} ${color}`,
        afterApply: 'layout',
        colors: [color],
      },
      {
        id: 'opening-white',
        label: 'Try a soft white',
        request: `Paint the ${target} #f5f3ec`,
        afterApply: 'layout',
        colors: ['#f5f3ec'],
      },
      {
        id: 'keep-openings',
        label: 'Keep this colour',
        next: 'layout',
        icon: 'room',
      },
    ];
  }
  if (step === 'layout')
    return [
      {
        id: 'open-floor',
        label: 'More open floor space',
        request: 'Make more open floor space',
        afterApply: 'done',
        icon: 'floor',
      },
      ...(room.furniture.some(
        (piece) =>
          findCatalogueEntry(piece.catalogueId, piece.catalogueVersion)
            ?.category === 'desk',
      ) && room.room.features.some((feature) => feature.kind === 'window')
        ? [
            {
              id: 'work-window',
              label: 'Work area by the window',
              request: 'Move the work area near the window',
              afterApply: 'done' as const,
              icon: 'furniture' as const,
            },
          ]
        : []),
      {
        id: 'keep-layout',
        label: 'Keep this layout',
        next: 'done',
        icon: 'room',
      },
    ];
  return [
    {
      id: 'refine-theme',
      label: 'Try another theme',
      next: 'themes',
      icon: 'walls',
    },
    {
      id: 'what-next',
      label: 'What else can you help with?',
      next: 'services',
      icon: 'capabilities',
    },
  ];
}
