import type { RoomDocument } from '@roomedy/contracts/room';
import {
  roomSurface,
  roomSurfaceDetail,
  WALLS,
} from '@roomedy/contracts/surfaces';
import type { SourcingBrief } from '@roomedy/contracts/sourcing';
import { POLICY } from '@roomedy/contracts/policy';
import type { SessionController } from '../session/controller';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import { createResearchScope } from './research-scope';
import type { ResearchScope } from './research-scope';

export const MARKET_TARGET_LIMIT = POLICY.furniture + WALLS.length + 1;
export const MARKET_RESEARCH_CONCURRENCY = Math.min(
  2,
  POLICY.expensiveOperations,
);
export interface MarketTarget {
  key: string;
  group: 'Furniture' | 'Flooring' | 'Wall paint' | 'Services';
  label: string;
  brief: SourcingBrief;
  matchingWalls: boolean;
}
export type ResearchAnswer = Awaited<
  NonNullable<ReturnType<typeof beginResearch>>['result']
>;
export type MarketUpdate =
  { kind: 'finding' } | { kind: 'answer'; answer: ResearchAnswer };

/** All room pieces and one request per distinct paint finish, never a guessed SKU. */
export function marketTargets(room: RoomDocument): MarketTarget[] {
  const targets: MarketTarget[] = [];
  const add = (
    key: string,
    group: MarketTarget['group'],
    label: string,
    matchingWalls = false,
  ) => {
    const brief = buildSourcingBrief(room, key);
    if (brief) targets.push({ key, group, label, brief, matchingWalls });
  };
  for (const piece of room.furniture) add(piece.id, 'Furniture', piece.label);
  add('surface:floor', 'Flooring', 'Floor finish');
  const finishes = new Map<string, (typeof WALLS)[number][]>();
  for (const wall of WALLS) {
    const finish = roomSurface(room.room, wall);
    const signature = JSON.stringify([
      finish,
      roomSurfaceDetail(room.room, wall).sheen,
    ]);
    finishes.set(signature, [...(finishes.get(signature) ?? []), wall]);
  }
  for (const walls of finishes.values()) {
    add(
      `surface:${walls[0]}`,
      'Wall paint',
      walls.length === 4 ? 'All walls' : `${walls.join(' / ')} wall paint`,
      walls.length > 1,
    );
  }
  return targets;
}

/** A wall request belongs to its complete matching-finish group. */
export function marketTargetForKey(room: RoomDocument, key: string) {
  const targets = marketTargets(room),
    direct = targets.find((target) => target.key === key);
  if (direct) return direct;
  const wall = WALLS.find((wall) => key === `surface:${wall}`);
  if (!wall) return null;
  const signature = (surface: (typeof WALLS)[number]) =>
    JSON.stringify([
      roomSurface(room.room, surface),
      roomSurfaceDetail(room.room, surface).sheen,
    ]);
  return (
    targets.find((target) => {
      const item = target.brief.target;
      return (
        item.kind === 'surface' &&
        item.surface !== 'floor' &&
        signature(item.surface) === signature(wall)
      );
    }) ?? null
  );
}

/** One finite foreground batch; independent children keep distinct admissions. */
export function runMarketResearch(
  controller: SessionController,
  targets: MarketTarget[],
  receive: (target: MarketTarget, update: MarketUpdate) => void,
  begin: (
    controller: SessionController,
    brief: SourcingBrief,
    scope: ResearchScope,
  ) => ReturnType<typeof beginResearch> = (session, brief, scope) =>
    beginResearch(session, brief, fetch, scope),
) {
  const initial = controller.getSnapshot();
  const owner =
    targets.length &&
    !initial.pending &&
    !initial.candidate &&
    initial.cost &&
    initial.destination === 'cost' &&
    controller.canEdit()
      ? controller.beginOperation()
      : null;
  const scope = owner ? createResearchScope(owner) : null;
  let stopped = false;
  let paused = false;
  const active = new Set<NonNullable<ReturnType<typeof beginResearch>>>();
  const completed = new Set<number>();
  let next = 0;
  const fresh = () => {
    const state = controller.getSnapshot();
    return (
      !stopped &&
      !!owner &&
      controller.isCurrent(owner) &&
      state.destination === 'cost' &&
      !state.candidate &&
      state.generation === initial.generation &&
      state.workspace?.current.roomRevision ===
        initial.workspace?.current.roomRevision &&
      state.cost?.revision === initial.cost?.revision &&
      controller.canEdit()
    );
  };
  const cancel = () => {
    stopped = true;
    for (const task of active) task.cancel();
  };
  const unsubscribe = controller.subscribe(() => {
    if (!fresh()) cancel();
  });
  const result = (async () => {
    const work = async () => {
      while (!paused && fresh() && controller.checkExpiry()) {
        const index = next++;
        if (index >= Math.min(targets.length, MARKET_TARGET_LIMIT)) return;
        const target = targets[index]!;
        const task = begin(controller, target.brief, scope!);
        if (!task) {
          paused = true;
          return;
        }
        active.add(task);
        receive(target, { kind: 'finding' });
        const answer = await task.result;
        active.delete(task);
        if (!answer.ok && 'retired' in answer && answer.retired) cancel();
        if (!fresh()) return;
        completed.add(index);
        if (!answer.ok && 'pause' in answer && answer.pause) paused = true;
        receive(target, { kind: 'answer', answer });
      }
    };
    try {
      await Promise.all(
        Array.from({ length: MARKET_RESEARCH_CONCURRENCY }, work),
      );
      return {
        remaining: targets.filter((_, index) => !completed.has(index)),
        cancelled: stopped,
        paused,
      };
    } finally {
      unsubscribe();
      for (const task of active) task.cancel();
      if (owner) controller.completeOperation(owner, () => {});
    }
  })();
  return { cancel, result };
}
