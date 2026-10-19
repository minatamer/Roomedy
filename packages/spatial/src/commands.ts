import {
  proposalBatchSchema,
  visitorBatchSchema,
} from '@roomedy/contracts/commands';
import type { VisitorAction } from '@roomedy/contracts/commands';
import { roomDocumentSchema, furnitureSchema } from '@roomedy/contracts/room';
import type { RoomDocument, CheckFacts } from '@roomedy/contracts/room';
import type { Measurement } from '@roomedy/contracts/primitives';
import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { SpatialIssue } from '@roomedy/contracts/issues';
import { checkRoom } from './checks.js';
import { CATALOGUE } from './catalogue.js';
import { subsetRegion } from './coordinates.js';

export type CommandAuthority = 'visitor' | 'authored-sample' | 'assistant';
export type FailureCode =
  | 'out-of-scope'
  | 'invalid-input'
  | 'locked'
  | 'owned-dimensions'
  | 'retained'
  | 'unsupported-variant'
  | 'new-conflict'
  | 'no-improvement'
  | 'stale'
  | 'replay-mismatch'
  | 'capacity'
  | 'revision-limit'
  | 'nothing-to-undo';
export type CommandChange = {
  id: string;
  kind: 'added' | 'removed' | 'changed';
  fields: string[];
};
export type CommandFailure = {
  ok: false;
  code: FailureCode;
  issue?: SpatialIssue;
};
export type CommandResult =
  | CommandFailure
  | {
      ok: true;
      room: RoomDocument;
      checks: CheckFacts;
      affectedIds: string[];
      changes: CommandChange[];
      changed: boolean;
      policy:
        'clear' | 'repair' | 'appearance-with-issues' | 'measurement-review';
    };

/** Same monotone repair comparison for final commands and conservative search pruning. */
export function preservesHardIssue(
  previous: SpatialIssue | undefined,
  current: SpatialIssue,
): previous is SpatialIssue {
  return (
    !!previous &&
    (current.deficitMm ?? 0) <= (previous.deficitMm ?? 0) &&
    (current.areaMm2 ?? 0) <= (previous.areaMm2 ?? 0) &&
    (current.region === null ||
      (previous.region !== null &&
        subsetRegion(current.region, previous.region)))
  );
}

function diffRoom(before: RoomDocument, after: RoomDocument): CommandChange[] {
  const changes: CommandChange[] = [];
  const compare = (
    id: string,
    old: Record<string, unknown>,
    next: Record<string, unknown>,
  ) => {
    const fields = Object.keys(next)
      .filter((key) => JSON.stringify(old[key]) !== JSON.stringify(next[key]))
      .sort();
    if (fields.length) changes.push({ id, kind: 'changed', fields });
  };
  const { features: oldFeatures, ...oldRoom } = before.room,
    { features: newFeatures, ...newRoom } = after.room;
  compare(
    before.roomId,
    { ...oldRoom, intent: before.intent },
    { ...newRoom, intent: after.intent },
  );
  const oldFeatureMap = new Map(oldFeatures.map((f) => [f.id, f])),
    newFeatureMap = new Map(newFeatures.map((f) => [f.id, f]));
  for (const feature of oldFeatures)
    if (!newFeatureMap.has(feature.id))
      changes.push({ id: feature.id, kind: 'removed', fields: [] });
  for (const feature of newFeatures) {
    const prior = oldFeatureMap.get(feature.id);
    if (!prior) changes.push({ id: feature.id, kind: 'added', fields: [] });
    else compare(feature.id, prior, feature);
  }
  const old = new Map(before.furniture.map((f) => [f.id, f])),
    next = new Map(after.furniture.map((f) => [f.id, f]));
  for (const item of before.furniture)
    if (!next.has(item.id))
      changes.push({ id: item.id, kind: 'removed', fields: [] });
  for (const item of after.furniture) {
    const previous = old.get(item.id);
    if (!previous) changes.push({ id: item.id, kind: 'added', fields: [] });
    else compare(item.id, previous, item);
  }
  return changes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Structural/catalogue validity is separate from current arrangement problems. */
export function validateRoom(
  input: unknown,
  catalogue: readonly CatalogueEntry[] = CATALOGUE,
): RoomDocument | undefined {
  const parsed = roomDocumentSchema.safeParse(input);
  if (!parsed.success) return undefined;
  for (const item of parsed.data.furniture) {
    const entry = catalogue.find(
      (e) => e.id === item.catalogueId && e.version === item.catalogueVersion,
    );
    if (!entry) return undefined;
    for (const axis of ['width', 'depth', 'height'] as const) {
      const value = item.dimensions[axis].value;
      if (
        item.ownership !== 'owned' &&
        value !== null &&
        (value < entry.size[axis].min || value > entry.size[axis].max)
      )
        return undefined;
    }
    if (item.ownership !== 'owned' && !entry.finishes.includes(item.finish))
      return undefined;
  }
  return parsed.data;
}
const measured = (value: number | null, sourceId: string): Measurement =>
  value === null
    ? { value: null, status: 'unknown', sourceId: null }
    : { value, status: 'confirmed', sourceId };
const estimated = (value: number, sourceId: string): Measurement => ({
  value,
  status: 'estimated',
  sourceId,
});
const nonspatial = new Set([
  'finish',
  'room-finish',
  'set-locks',
  'set-preference',
  'set-ownership',
  'set-intent',
]);
const measurementActions = new Set([
  'correct-dimensions',
  'confirm-measurement',
  'add-feature',
  'update-feature',
  'remove-feature',
]);

export function evaluateBatch(
  input: unknown,
  rawActions: unknown,
  authority: CommandAuthority,
  catalogue: readonly CatalogueEntry[] = CATALOGUE,
  // Only the scoped application entry point supplies explicit owned-finish permission.
  ownedFinishIds: readonly string[] = [],
): CommandResult {
  if (!['visitor', 'authored-sample', 'assistant'].includes(authority))
    return { ok: false, code: 'invalid-input' };
  const before = validateRoom(input, catalogue);
  if (!before) return { ok: false, code: 'invalid-input' };
  const parsed = (
    authority === 'assistant' ? proposalBatchSchema : visitorBatchSchema
  ).safeParse(rawActions);
  if (!parsed.success) return { ok: false, code: 'invalid-input' };
  const actions: VisitorAction[] = parsed.data;
  const room = roomDocumentSchema.parse(before),
    originals = new Map(before.furniture.map((f) => [f.id, f]));
  const originalIds = new Set([
    before.roomId,
    ...before.furniture.map((f) => f.id),
    ...before.room.features.map((f) => f.id),
  ]);
  const affected = new Set<string>();
  for (const action of actions) {
    if (action.type === 'add') {
      if (
        originalIds.has(action.furniture.id) ||
        room.furniture.some((f) => f.id === action.furniture.id)
      )
        return { ok: false, code: 'invalid-input' };
      if (
        authority === 'assistant' &&
        Object.values(action.furniture.dimensions).some((v) => v.value === null)
      )
        return { ok: false, code: 'invalid-input' };
      const added = furnitureSchema.parse(action.furniture);
      if (authority === 'assistant')
        added.pose.provenance = {
          status: 'planned',
          sourceId: 'assistant-plan',
        };
      room.furniture.push(added);
      affected.add(action.furniture.id);
      continue;
    }
    if (action.type === 'add-feature') {
      if (
        originalIds.has(action.feature.id) ||
        room.furniture.some((f) => f.id === action.feature.id) ||
        room.room.features.some((f) => f.id === action.feature.id)
      )
        return { ok: false, code: 'invalid-input' };
      room.room.features.push(action.feature);
      affected.add(action.feature.id);
      continue;
    }
    if (action.type === 'update-feature' || action.type === 'remove-feature') {
      const index = room.room.features.findIndex((f) => f.id === action.id);
      if (index < 0) return { ok: false, code: 'invalid-input' };
      if (action.type === 'remove-feature') room.room.features.splice(index, 1);
      else {
        if (action.feature.id !== action.id)
          return { ok: false, code: 'invalid-input' };
        room.room.features[index] = action.feature;
      }
      affected.add(action.id);
      continue;
    }
    if (action.type === 'room-finish') {
      room.room.floorFinish = action.floorFinish;
      room.room.wallFinish = action.wallFinish;
      affected.add(room.roomId);
      continue;
    }
    if (action.type === 'set-intent') {
      room.intent = { ...action.intent, goals: [...action.intent.goals] };
      affected.add(room.roomId);
      continue;
    }
    if (action.type === 'confirm-measurement') {
      if (authority === 'assistant')
        return { ok: false, code: 'invalid-input' };
      const target = action.target;
      let record: Record<string, Measurement>;
      if (target.kind === 'room') {
        if (
          target.id !== room.roomId ||
          !['width', 'depth', 'height'].includes(target.field)
        )
          return { ok: false, code: 'invalid-input' };
        record = room.room as unknown as Record<string, Measurement>;
      } else if (target.kind === 'furniture') {
        const item = room.furniture.find((f) => f.id === target.id);
        if (!item || !['width', 'depth', 'height'].includes(target.field))
          return { ok: false, code: 'invalid-input' };
        record = item.dimensions;
      } else {
        const feature = room.room.features.find((f) => f.id === target.id);
        if (
          !feature ||
          !['offset', 'width', 'height', 'sill', 'projection'].includes(
            target.field,
          ) ||
          (target.field === 'projection' && feature.kind !== 'obstacle')
        )
          return { ok: false, code: 'invalid-input' };
        record = feature as unknown as Record<string, Measurement>;
      }
      record[target.field] = measured(
        action.value,
        authority === 'authored-sample'
          ? 'authored-sample'
          : 'visitor-confirmed',
      );
      affected.add(target.id);
      continue;
    }
    if (action.type === 'correct-dimensions' && action.id === room.roomId) {
      if (authority === 'assistant')
        return { ok: false, code: 'invalid-input' };
      for (const axis of ['width', 'depth', 'height'] as const)
        room.room[axis] = measured(action[axis], 'visitor-confirmed');
      affected.add(room.roomId);
      continue;
    }
    const item = room.furniture.find((f) => f.id === action.id);
    if (!item) return { ok: false, code: 'invalid-input' };
    const start = originals.get(item.id) ?? item;
    affected.add(item.id);
    if (action.type === 'move') {
      if (
        (start.locks.position &&
          (action.pose.centerX !== start.pose.centerX ||
            action.pose.centerZ !== start.pose.centerZ)) ||
        (start.locks.rotation &&
          action.pose.quarterTurns !== start.pose.quarterTurns)
      )
        return { ok: false, code: 'locked' };
      item.pose = {
        ...action.pose,
        provenance: {
          status: 'planned',
          sourceId:
            authority === 'assistant' ? 'assistant-plan' : 'visitor-plan',
        },
      };
    } else if (action.type === 'rotate') {
      if (
        start.locks.rotation &&
        action.quarterTurns !== start.pose.quarterTurns
      )
        return { ok: false, code: 'locked' };
      item.pose = {
        ...item.pose,
        quarterTurns: action.quarterTurns,
        provenance: {
          status: 'planned',
          sourceId:
            authority === 'assistant' ? 'assistant-plan' : 'visitor-plan',
        },
      };
    } else if (action.type === 'resize') {
      if (start.ownership === 'owned')
        return { ok: false, code: 'owned-dimensions' };
      if (start.locks.dimensions) return { ok: false, code: 'locked' };
      for (const axis of ['width', 'depth', 'height'] as const)
        item.dimensions[axis] = estimated(
          action[axis],
          authority === 'assistant' ? 'assistant-proposal' : 'visitor-estimate',
        );
    } else if (action.type === 'set-size-estimate') {
      if (start.locks.dimensions) return { ok: false, code: 'locked' };
      for (const axis of ['width', 'depth', 'height'] as const) {
        const value = action[axis];
        if (value !== undefined && value !== item.dimensions[axis].value)
          item.dimensions[axis] = estimated(value, 'visitor-estimate');
      }
    } else if (action.type === 'remove' || action.type === 'replace') {
      if (Object.values(start.locks).some(Boolean))
        return { ok: false, code: 'locked' };
      if (
        authority === 'assistant' &&
        (start.preference === 'keep' ||
          (start.ownership === 'owned' && start.preference !== 'replace'))
      )
        return { ok: false, code: 'retained' };
      if (action.type === 'remove')
        room.furniture = room.furniture.filter((f) => f.id !== item.id);
      else {
        if (
          action.furniture.id !== item.id ||
          (authority === 'assistant' &&
            Object.values(action.furniture.dimensions).some(
              (v) => v.value === null,
            ))
        )
          return { ok: false, code: 'invalid-input' };
        const replacement = furnitureSchema.parse(action.furniture);
        if (authority === 'assistant')
          replacement.pose.provenance = {
            status: 'planned',
            sourceId: 'assistant-plan',
          };
        if (authority === 'assistant' && replacement.ownership === 'owned')
          return { ok: false, code: 'invalid-input' };
        room.furniture[room.furniture.indexOf(item)] = replacement;
      }
    } else if (action.type === 'finish') {
      if (
        authority === 'assistant' &&
        start.ownership === 'owned' &&
        !ownedFinishIds.includes(start.id) &&
        action.finish !== start.finish
      )
        return { ok: false, code: 'retained' };
      const entry = catalogue.find(
        (e) => e.id === item.catalogueId && e.version === item.catalogueVersion,
      );
      if (
        action.finish !== item.finish &&
        !entry?.finishes.includes(action.finish)
      )
        return { ok: false, code: 'unsupported-variant' };
      item.finish = action.finish;
    } else if (action.type === 'set-locks') item.locks = { ...action.locks };
    else if (action.type === 'set-preference')
      item.preference = action.preference;
    else if (action.type === 'set-ownership') item.ownership = action.ownership;
    else if (action.type === 'correct-dimensions')
      for (const axis of ['width', 'depth', 'height'] as const)
        item.dimensions[axis] = measured(action[axis], 'visitor-confirmed');
  }
  if (!roomDocumentSchema.safeParse(room).success)
    return { ok: false, code: 'invalid-input' };
  const candidate = validateRoom(room, catalogue);
  if (!candidate) return { ok: false, code: 'unsupported-variant' };
  const oldChecks = checkRoom(before, catalogue),
    nextChecks = checkRoom(candidate, catalogue);
  const oldHard = new Map(
    oldChecks.issues.filter((i) => i.severity === 'hard').map((i) => [i.id, i]),
  );
  const nextHard = nextChecks.issues.filter((i) => i.severity === 'hard');
  const measurement =
    authority !== 'assistant' &&
    actions.every((a) => measurementActions.has(a.type));
  const appearance = actions.every((a) => nonspatial.has(a.type));
  let improved = nextHard.length < oldHard.size;
  if (!measurement)
    for (const current of nextHard) {
      const previous = oldHard.get(current.id);
      if (!preservesHardIssue(previous, current))
        return { ok: false, code: 'new-conflict', issue: current };
      if (
        (current.areaMm2 ?? 0) < (previous.areaMm2 ?? 0) ||
        (current.deficitMm ?? 0) < (previous.deficitMm ?? 0)
      )
        improved = true;
    }
  const changed = JSON.stringify(candidate) !== JSON.stringify(before);
  if (changed && !measurement && !appearance && oldHard.size > 0 && !improved)
    return { ok: false, code: 'no-improvement' };
  return {
    ok: true,
    room: candidate,
    checks: nextChecks,
    affectedIds: [...affected].sort(),
    changes: diffRoom(before, candidate),
    changed,
    policy: measurement
      ? 'measurement-review'
      : oldHard.size
        ? appearance
          ? 'appearance-with-issues'
          : 'repair'
        : 'clear',
  };
}
