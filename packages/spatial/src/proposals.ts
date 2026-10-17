import { utf8ToBytes } from '@noble/hashes/utils.js';
import { roomDocumentSchema } from '@roomedy/contracts/room';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  commandEnvelopeSchema,
  receiptSchema,
} from '@roomedy/contracts/commands';
import type { CommandEnvelope, Receipt } from '@roomedy/contracts/commands';
import type { RoomDocument } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { idSchema, revisionSchema } from '@roomedy/contracts/primitives';
import { checkRoom } from './checks.js';
import { evaluateBatch, validateRoom } from './commands.js';
import type {
  CommandAuthority,
  CommandResult,
  FailureCode,
} from './commands.js';
import {
  emptyHistory,
  jsonBytes,
  pushHistory,
  popHistory,
  immutableRoom,
} from './history.js';
import type { History } from './history.js';

export interface CommandWorkspace {
  readonly workspaceId: string;
  readonly generation: number;
  readonly lastCommandSequence: number;
  readonly current: RoomDocument;
  readonly baseline: RoomDocument;
  readonly history: History;
  readonly receipts: readonly {
    receipt: Receipt;
    payload: string;
    bytes: number;
  }[];
}
export function createCommandWorkspace(
  room: unknown,
  identity: { workspaceId: string; generation: number },
  baseline: unknown = room,
): CommandWorkspace {
  const current = validateRoom(room),
    before = validateRoom(baseline);
  if (
    !current ||
    !before ||
    current.roomId !== before.roomId ||
    !idSchema.safeParse(identity.workspaceId).success ||
    !revisionSchema.safeParse(identity.generation).success ||
    jsonBytes({ current, baseline: before }) > POLICY.semanticPairBytes
  )
    throw new Error('invalid-input');
  return {
    workspaceId: identity.workspaceId,
    generation: identity.generation,
    lastCommandSequence: 0,
    current: immutableRoom(current),
    baseline: immutableRoom(before),
    history: emptyHistory(),
    receipts: [],
  };
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function commandPayload(command: CommandEnvelope): string {
  return JSON.stringify(canonical(command));
}
export function payloadDigest(payload: string): string {
  return Array.from(sha256(utf8ToBytes(payload)), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
}
function matches(
  workspace: CommandWorkspace,
  command: CommandEnvelope,
): boolean {
  return (
    command.identity.workspaceId === workspace.workspaceId &&
    command.identity.generation === workspace.generation &&
    command.identity.roomId === workspace.current.roomId &&
    command.identity.inputRevision === workspace.current.roomRevision
  );
}
export function prepareCommand(
  workspace: CommandWorkspace,
  raw: unknown,
  authority: CommandAuthority,
): CommandResult {
  const parsed = commandEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'invalid-input' };
  if (
    !matches(workspace, parsed.data) ||
    parsed.data.commandSequence !== workspace.lastCommandSequence + 1
  )
    return { ok: false, code: 'stale' };
  return evaluateBatch(workspace.current, parsed.data.actions, authority);
}
export type ApplyResult =
  | { ok: false; code: FailureCode }
  | {
      ok: true;
      workspace: CommandWorkspace;
      receipt: Receipt | null;
      status: 'applied' | 'already-applied' | 'unchanged';
      evaluation: CommandResult | null;
      undoRecorded: boolean;
    };
export function applyCommand(
  workspace: CommandWorkspace,
  raw: unknown,
  authority: CommandAuthority,
): ApplyResult {
  const parsed = commandEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'invalid-input' };
  const command = parsed.data,
    payload = commandPayload(command);
  if (
    command.identity.workspaceId !== workspace.workspaceId ||
    command.identity.generation !== workspace.generation ||
    command.identity.roomId !== workspace.current.roomId
  )
    return { ok: false, code: 'stale' };
  const previous = workspace.receipts.find(
    (item) => item.receipt.proposalId === command.commandId,
  );
  if (previous) {
    if (previous.payload !== payload)
      return { ok: false, code: 'replay-mismatch' };
    return {
      ok: true,
      workspace,
      receipt: previous.receipt,
      status: 'already-applied',
      evaluation: null,
      undoRecorded: false,
    };
  }
  if (
    !matches(workspace, command) ||
    command.commandSequence !== workspace.lastCommandSequence + 1
  )
    return { ok: false, code: 'stale' };
  const evaluation = evaluateBatch(
    workspace.current,
    command.actions,
    authority,
  );
  if (!evaluation.ok) return evaluation;
  if (
    evaluation.changed &&
    workspace.current.roomRevision >= Number.MAX_SAFE_INTEGER - 1
  )
    return { ok: false, code: 'revision-limit' };
  const current = {
    ...evaluation.room,
    roomRevision: workspace.current.roomRevision + (evaluation.changed ? 1 : 0),
  };
  if (
    jsonBytes({ current, baseline: workspace.baseline }) >
    POLICY.semanticPairBytes
  )
    return { ok: false, code: 'capacity' };
  const receipt = receiptSchema.parse({
    identity: command.identity,
    proposalId: command.commandId,
    commandSequence: command.commandSequence,
    payloadDigest: payloadDigest(payload),
    committedRevision: current.roomRevision,
  });
  const record = { receipt, payload, bytes: jsonBytes({ receipt, payload }) };
  if (record.bytes > POLICY.receiptBytes)
    return { ok: false, code: 'capacity' };
  const receipts = [...workspace.receipts, record];
  let receiptBytes = receipts.reduce((n, r) => n + r.bytes, 0);
  while (
    receipts.length > POLICY.receiptEntries ||
    receiptBytes > POLICY.receiptBytes
  )
    receiptBytes -= receipts.shift()!.bytes;
  const history = evaluation.changed
    ? pushHistory(workspace.history, workspace.current, command.commandId)
    : { history: workspace.history, recorded: false };
  const next: CommandWorkspace = {
    ...workspace,
    lastCommandSequence: command.commandSequence,
    current: immutableRoom(current),
    history: history.history,
    receipts,
  };
  return {
    ok: true,
    workspace: next,
    receipt,
    status: evaluation.changed ? 'applied' : 'unchanged',
    evaluation: { ...evaluation, room: current, checks: checkRoom(current) },
    undoRecorded: history.recorded,
  };
}
export function undoCommand(workspace: CommandWorkspace):
  | { ok: false; code: FailureCode }
  | {
      ok: true;
      workspace: CommandWorkspace;
      checks: ReturnType<typeof checkRoom>;
      commandId: string;
    } {
  const entry = popHistory(workspace.history);
  if (!entry) return { ok: false, code: 'nothing-to-undo' };
  if (workspace.current.roomRevision >= Number.MAX_SAFE_INTEGER - 1)
    return { ok: false, code: 'revision-limit' };
  const current = immutableRoom({
    ...roomDocumentSchema.parse(entry.entry.previous),
    roomRevision: workspace.current.roomRevision + 1,
  });
  return {
    ok: true,
    workspace: { ...workspace, current, history: entry.history },
    checks: checkRoom(current),
    commandId: entry.entry.commandId,
  };
}
