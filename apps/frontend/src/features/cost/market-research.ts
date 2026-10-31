import type { RoomDocument } from '@roomedy/contracts/room';
import {
  roomSurface,
  roomSurfaceDetail,
  WALLS,
} from '@roomedy/contracts/surfaces';
import type { SourcingBrief } from '@roomedy/contracts/sourcing';
import type { SessionController } from '../session/controller';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';

export const MARKET_BATCH_SIZE = 6;
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

/** One visitor-selected finite batch. Each target retains the existing one-operation owner. */
export function runMarketResearch(
  controller: SessionController,
  targets: MarketTarget[],
  receive: (target: MarketTarget, update: MarketUpdate) => void,
  begin: typeof beginResearch = beginResearch,
) {
  const initial = controller.getSnapshot();
  let stopped = false;
  let current: ReturnType<typeof beginResearch> = null;
  const fresh = () => {
    const state = controller.getSnapshot();
    return (
      !stopped &&
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
    current?.cancel();
  };
  const unsubscribe = controller.subscribe(() => {
    if (!fresh()) cancel();
  });
  const result = (async () => {
    let processed = 0;
    try {
      for (const target of targets.slice(0, MARKET_BATCH_SIZE)) {
        if (!fresh() || !controller.checkExpiry()) break;
        current = begin(controller, target.brief);
        if (!current) break;
        receive(target, { kind: 'finding' });
        const answer = await current.result;
        current = null;
        if (!answer.ok && 'retired' in answer && answer.retired) stopped = true;
        if (!fresh()) break;
        processed++;
        receive(target, { kind: 'answer', answer });
      }
      return { remaining: targets.slice(processed), cancelled: stopped };
    } finally {
      unsubscribe();
    }
  })();
  return { cancel, result };
}
