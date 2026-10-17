import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type {
  ProposalAction,
  VisitorAction,
} from '@roomedy/contracts/commands';
import type { CheckFacts, RoomDocument } from '@roomedy/contracts/room';

export {
  CATALOGUE,
  findCatalogueEntry,
  supportsDimensions,
} from './catalogue.js';

/** Origin is assigned by the calling controller/use case, never parsed from a wire payload. */
export type CommandAuthority = 'visitor' | 'authored-sample' | 'assistant';
export interface SpatialEngine {
  check(room: RoomDocument, catalogue: readonly CatalogueEntry[]): CheckFacts;
  propose(
    room: RoomDocument,
    actions: readonly ProposalAction[],
    catalogue: readonly CatalogueEntry[],
  ): CommandResult;
  apply(
    room: RoomDocument,
    actions: readonly VisitorAction[],
    authority: CommandAuthority,
    catalogue: readonly CatalogueEntry[],
  ): CommandResult;
}
export type CommandResult =
  | { ok: true; room: RoomDocument; checks: CheckFacts }
  | {
      ok: false;
      code:
        'invalid-input' | 'locked' | 'stale' | 'new-conflict' | 'unassessed';
    };

/** +X east, +Z south, +Y up. Meshes and display units never determine fit. */
export const COORDINATES = Object.freeze({
  unit: 'mm',
  origin: 'northwest',
  pose: 'footprint-center',
  localFront: 'positive-z',
  rotations: 4,
} as const);
