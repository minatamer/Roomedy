export {
  CATALOGUE,
  findCatalogueEntry,
  supportsDimensions,
} from './catalogue.js';
export {
  rotatePoint,
  localFront,
  footprint,
  corners,
  intersection,
  area,
  subsetRegion,
  outsideRegions,
  frontBand,
  wallBand,
  wallInterval,
} from './coordinates.js';
export { checkRoom } from './checks.js';
export { evaluateBatch, validateRoom } from './commands.js';
export {
  LayoutSearch,
  proposedSearchPiece,
  emptySearchResult,
  validateSearchCandidate,
} from './search/engine.js';
export { scopeAllows, evaluateScopedBatch } from './search/scope.js';
export type {
  CommandAuthority,
  CommandFailure,
  CommandResult,
  FailureCode,
} from './commands.js';
export {
  createCommandWorkspace,
  prepareCommand,
  applyCommand,
  undoCommand,
  commandPayload,
  payloadDigest,
} from './proposals.js';
export type { CommandWorkspace, ApplyResult } from './proposals.js';
export { emptyHistory, pushHistory, popHistory, jsonBytes } from './history.js';
export type { History, HistoryEntry } from './history.js';

/** +X east, +Z south, +Y up. Meshes and display units never determine fit. */
export const COORDINATES = Object.freeze({
  unit: 'mm',
  origin: 'northwest',
  pose: 'footprint-center',
  localFront: 'positive-z',
  rotations: 4,
} as const);

export { resolveAssistantTask, emptyAssistantReply } from './assistant.js';
export type { AssistantTask } from './assistant.js';
