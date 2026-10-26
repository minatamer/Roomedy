import { utf8ToBytes } from '@noble/hashes/utils.js';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { estimateStateSchema } from '@roomedy/contracts/estimates';
import type { EstimateState } from '@roomedy/contracts/estimates';

export interface HistoryEntry {
  readonly commandId: string;
  readonly previous: RoomDocument;
  readonly pricing?: EstimateState;
  readonly costOnly?: true;
  readonly bytes: number;
}
export interface History {
  readonly entries: readonly HistoryEntry[];
  readonly bytes: number;
}
export const emptyHistory = (): History =>
  Object.freeze({ entries: Object.freeze([]), bytes: 0 });
export const jsonBytes = (value: unknown): number =>
  utf8ToBytes(JSON.stringify(value)).byteLength;

function immutable<T>(copy: T): T {
  const freeze = (value: unknown): void => {
    if (value && typeof value === 'object') {
      for (const v of Object.values(value)) freeze(v);
      Object.freeze(value);
    }
  };
  freeze(copy);
  return copy;
}
export function immutableRoom(room: RoomDocument): RoomDocument {
  return immutable(roomDocumentSchema.parse(room));
}

export function pushHistory(
  history: History,
  previous: RoomDocument,
  commandId: string,
  limits: { entries: number; bytes: number } = {
    entries: POLICY.undoEntries,
    bytes: POLICY.undoBytes,
  },
  context: { pricing?: EstimateState; costOnly?: true } = {},
): { history: History; recorded: boolean } {
  if (
    !Number.isInteger(limits.entries) ||
    !Number.isInteger(limits.bytes) ||
    limits.entries < 0 ||
    limits.bytes < 0 ||
    limits.entries > POLICY.undoEntries ||
    limits.bytes > POLICY.undoBytes
  )
    throw new Error('invalid-history-policy');
  const snapshot = {
    commandId,
    previous: immutableRoom(previous),
    ...(context.pricing
      ? { pricing: immutable(estimateStateSchema.parse(context.pricing)) }
      : {}),
    ...(context.costOnly ? { costOnly: true as const } : {}),
  };
  const entry = Object.freeze({ ...snapshot, bytes: jsonBytes(snapshot) });
  const entries = [...history.entries, entry];
  let bytes = entries.reduce((total, item) => total + item.bytes, 0);
  while (entries.length > limits.entries || bytes > limits.bytes)
    bytes -= entries.shift()!.bytes;
  return {
    history: Object.freeze({ entries: Object.freeze(entries), bytes }),
    recorded: entries.includes(entry),
  };
}
export function popHistory(
  history: History,
): { history: History; entry: HistoryEntry } | undefined {
  const entry = history.entries.at(-1);
  if (!entry) return undefined;
  const entries = history.entries.slice(0, -1);
  return {
    entry,
    history: Object.freeze({
      entries: Object.freeze(entries),
      bytes: entries.reduce((total, item) => total + item.bytes, 0),
    }),
  };
}
