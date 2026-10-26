import { sourcingBriefSchema } from '@roomedy/contracts/sourcing';
import type { RoomDocument } from '@roomedy/contracts/room';
import { roomSurface, roomSurfaceDetail } from '@roomedy/contracts/surfaces';
import { findCatalogueEntry } from '@roomedy/spatial';
import { serviceScopeSchema } from '@roomedy/contracts/estimates';
export function buildSourcingBrief(
  room: RoomDocument,
  key: string,
  query = '',
  primer = false,
) {
  const piece = room.furniture.find((p) => p.id === key);
  if (piece) {
    const entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
    if (!entry) return null;
    return sourcingBriefSchema.parse({
      target: { kind: 'furniture', id: piece.id },
      kind: 'furniture',
      category: entry?.category ?? null,
      label: piece.label,
      size: {
        width: piece.dimensions.width.value,
        depth: piece.dimensions.depth.value,
        height: piece.dimensions.height.value,
      },
      appearance: `${piece.finish}; ${JSON.stringify(piece.materials ?? {})}. Similar representation, not an identified SKU.`,
      colour: null,
      query,
    });
  }
  if (/^surface:(floor|north|east|south|west)$/.test(key)) {
    const surface = key.slice(8) as
        'floor' | 'north' | 'east' | 'south' | 'west',
      appearance = roomSurface(room.room, surface);
    return sourcingBriefSchema.parse({
      target: { kind: 'surface', surface },
      kind: surface === 'floor' ? 'floor' : primer ? 'primer' : 'paint',
      category: null,
      label:
        surface === 'floor'
          ? 'Flooring'
          : `${surface} wall ${primer ? 'primer' : 'paint'}`,
      size: null,
      appearance: `${appearance.texture}; ${appearance.color}; ${roomSurfaceDetail(room.room, surface).sheen}`,
      colour: primer ? null : appearance.color,
      query,
    });
  }
  const scope = serviceScopeSchema.safeParse(key.replace(/^service:/, ''));
  if (!key.startsWith('service:') || !scope.success) return null;
  return sourcingBriefSchema.parse({
    target: { kind: 'service', scope: scope.data },
    kind: 'service',
    category: null,
    label: scope.data.replaceAll('-', ' '),
    size: null,
    appearance:
      scope.data === 'moving'
        ? 'Clear and return furniture within this home. Between-address relocation needs a separate assessment.'
        : 'A local service quote with explicit scope, units, access conditions and minimum charge.',
    colour: null,
    query,
  });
}
