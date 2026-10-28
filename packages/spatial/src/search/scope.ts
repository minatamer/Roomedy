import {
  actionScopeSchema,
  proposalBatchSchema,
} from '@roomedy/contracts/commands';
import type { ActionScope, ProposalAction } from '@roomedy/contracts/commands';
import type { RoomDocument } from '@roomedy/contracts/room';
import { evaluateBatch } from '../commands.js';
import type { CommandResult } from '../commands.js';
import { wallMountedPose } from '../elevation.js';
import { planningRoom } from '../planning.js';
/** Scope is supplied by the application separately from untrusted tool/goal arguments. */
export function scopeAllows(
  room: RoomDocument,
  raw: unknown,
  rawScope: unknown,
): boolean {
  const scope = actionScopeSchema.safeParse(rawScope),
    actions = proposalBatchSchema.safeParse(raw);
  if (
    !scope.success ||
    !actions.success ||
    scope.data.roomId !== room.roomId ||
    scope.data.roomRevision !== room.roomRevision
  )
    return false;
  const permission = scope.data;
  return actions.data.every((action) => {
    if (!permission.actionKinds.includes(action.type)) return false;
    if (action.type === 'room-finish') return permission.roomFinishes;
    if (action.type === 'add')
      return permission.additions.some(
        (p) =>
          p.id === action.furniture.id &&
          p.catalogueId === action.furniture.catalogueId,
      );
    if (!permission.targetIds.includes(action.id)) return false;
    if (action.type === 'rotate' && !permission.actionKinds.includes('move')) {
      const item = room.furniture.find((p) => p.id === action.id);
      if (item) {
        const pose = wallMountedPose(room, item, {
          ...item.pose,
          quarterTurns: action.quarterTurns,
        });
        if (
          pose.centerX !== item.pose.centerX ||
          pose.centerZ !== item.pose.centerZ
        )
          return false;
      }
    }
    if (
      action.type === 'move' &&
      room.furniture.find((p) => p.id === action.id)?.pose.quarterTurns !==
        action.pose.quarterTurns &&
      !permission.actionKinds.includes('rotate')
    )
      return false;
    if (action.type === 'replace')
      return permission.replacements.some(
        (p) =>
          p.id === action.id && p.catalogueId === action.furniture.catalogueId,
      );
    if (action.type === 'remove')
      return permission.removals.includes(action.id);
    return true;
  });
}
export function evaluateScopedBatch(
  room: RoomDocument,
  actions: readonly ProposalAction[],
  scope: ActionScope | undefined,
): CommandResult {
  if (!scopeAllows(room, actions, scope))
    return { ok: false, code: 'out-of-scope' };
  const accepted = evaluateBatch(
    room,
    actions,
    'assistant',
    undefined,
    scope?.actionKinds.includes('finish') ? scope.targetIds : [],
  );
  if (!accepted.ok) return accepted;
  const projected = planningRoom(room);
  if (projected === room) return accepted;
  const evaluated = evaluateBatch(
    projected,
    actions,
    'assistant',
    undefined,
    scope?.actionKinds.includes('finish') ? scope.targetIds : [],
  );
  return evaluated.ok ? { ...accepted, checks: evaluated.checks } : evaluated;
}
