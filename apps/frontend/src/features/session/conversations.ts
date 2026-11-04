import type {
  RecoveryEstimate,
  RecoveryMedy,
  RecoveryCostUI,
  RecoveryConversations,
} from '@roomedy/contracts/project';
import { VERSIONS } from '@roomedy/contracts/policy';
import type { AssistantController } from '../assistant/controller';
import type { CostMessage } from '../cost/state';
import type { Conversation, MarketEntry } from '../cost/conversation';
import type { MarketTarget } from '../cost/market-research';
import { marketTargetForKey } from '../cost/market-research';
import { buildSourcingBrief } from '../cost/brief';
import { researchLocality } from '../cost/journey';
import type { SessionSnapshot } from './state';

/** History is display/context data. Pending operations and their identities never enter it. */
export function medyConversationOf(
  state: ReturnType<AssistantController['getSnapshot']>,
  roomRevision: number,
): RecoveryMedy {
  return {
    roomRevision,
    draft: state.draft,
    tourSeen: state.tourSeen,
    themeId: state.themeId,
    messages: state.messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      reply: message.reply ? { ...message.reply, actions: null } : null,
      simulation: message.simulation,
      quickReplies: [...message.quickReplies],
    })),
  };
}

export function estimateConversationOf(
  state: SessionSnapshot,
): RecoveryEstimate | undefined {
  if (!state.cost || !state.workspace) return undefined;
  const highest = Math.max(
    0,
    ...state.cost.messages.map((message) => message.id ?? 0),
  );
  return {
    roomRevision: state.workspace.current.roomRevision,
    revision: state.cost.revision,
    messages: state.cost.messages.map((message, index) => ({
      ...message,
      id: message.id ?? highest + index + 1,
    })),
    ...(state.conversations?.estimate?.ui
      ? { ui: state.conversations.estimate.ui }
      : {}),
  };
}

export function restoredCostMessages(
  saved: RecoveryEstimate,
  roomRevision: number,
  costRevision: number,
): CostMessage[] {
  return saved.messages.map<CostMessage>((message) => {
    const current =
      !message.historical &&
      message.roomRevision === saved.roomRevision &&
      message.costRevision === saved.revision;
    return {
      id: message.id,
      role: message.role,
      text: message.text,
      roomRevision: current ? roomRevision : message.roomRevision,
      costRevision: current ? costRevision : message.costRevision,
      ...(message.kind ? { kind: message.kind } : {}),
      ...(message.lineIds ? { lineIds: [...message.lineIds] } : {}),
      ...(!current ? { historical: true as const } : {}),
    };
  });
}

const currentEntry = (entry: MarketEntry, state: SessionSnapshot) =>
  entry.workspaceId === state.workspace?.workspaceId &&
  entry.generation === state.generation &&
  entry.roomRevision === state.workspace?.current.roomRevision &&
  entry.costRevision === state.cost?.revision;

export function costUIOf(
  ui: Conversation,
  state: SessionSnapshot,
): RecoveryCostUI {
  return {
    roomRevision: state.workspace!.current.roomRevision,
    costRevision: state.cost!.revision,
    viewingId: ui.viewingId,
    section: ui.section,
    selected: ui.selected,
    input: ui.input,
    budget: ui.budget,
    work: ui.work,
    researchAfter: ui.researchAfter,
    entries: ui.entries.flatMap((entry) => {
      if (entry.update.kind !== 'answer') return [];
      const answer = entry.update.answer;
      return [
        {
          target: entry.target,
          current: currentEntry(entry, state),
          result: answer.ok
            ? {
                ok: true as const,
                reply: answer.reply,
                simulation: answer.simulation,
              }
            : { ok: false as const, message: answer.message },
        },
      ];
    }),
    remaining: ui.remaining,
    message: ui.entries.some((entry) => entry.update.kind === 'finding')
      ? 'Search paused. Your found options and choices are saved.'
      : ui.message,
    guide: ui.guide,
  };
}

/** Fresh workspace counters must not turn older replies or source results into current facts. */
export function continuedConversations(
  saved: RecoveryConversations | undefined,
  priorRoomRevision: number,
  roomRevision: number,
): RecoveryConversations | undefined {
  if (!saved) return undefined;
  const medy = saved.medy;
  const estimate = saved.estimate;
  const uiCurrent =
    estimate?.ui?.roomRevision === estimate?.roomRevision &&
    estimate?.ui?.costRevision === estimate?.revision;
  return {
    ...(medy
      ? {
          medy: {
            ...medy,
            roomRevision,
            messages: medy.messages.map((message) => ({
              ...message,
              quickReplies: message.quickReplies
                .filter((choice) => choice.roomRevision === priorRoomRevision)
                .map((choice) => ({ ...choice, roomRevision })),
              reply: message.reply
                ? {
                    ...message.reply,
                    actions: null,
                    ...(message.reply.suggestions
                      ? {
                          suggestions: message.reply.suggestions
                            .filter(
                              (choice) =>
                                choice.roomRevision === priorRoomRevision,
                            )
                            .map((choice) => ({ ...choice, roomRevision })),
                        }
                      : {}),
                  }
                : null,
            })),
          },
        }
      : {}),
    ...(estimate
      ? {
          estimate: {
            ...estimate,
            roomRevision,
            revision: 0,
            messages: restoredCostMessages(estimate, roomRevision, 0).map(
              (message) => ({ ...message, id: message.id! }),
            ),
            ...(estimate.ui
              ? {
                  ui: {
                    ...estimate.ui,
                    roomRevision,
                    costRevision: 0,
                    entries: estimate.ui.entries.map((entry) => ({
                      ...entry,
                      current: entry.current && uiCurrent,
                    })),
                  },
                }
              : {}),
          },
        }
      : {}),
  };
}

/** Only a still-matching brief can regain actionable current-room options after Continue. */
function currentTarget(
  target: MarketTarget,
  state: SessionSnapshot,
): MarketTarget | null {
  if (!state.workspace) return null;
  const room = state.workspace.current;
  const brief = buildSourcingBrief(
    room,
    target.key,
    target.brief.query,
    target.brief.kind === 'primer',
  );
  if (!brief || JSON.stringify(brief) !== JSON.stringify(target.brief))
    return null;
  const group =
    brief.kind === 'furniture'
      ? 'Furniture'
      : brief.kind === 'floor'
        ? 'Flooring'
        : brief.kind === 'service'
          ? 'Services'
          : 'Wall paint';
  if (target.group !== group) return null;
  const grouped = marketTargetForKey(room, target.key);
  return {
    ...target,
    brief,
    matchingWalls: target.matchingWalls && !!grouped?.matchingWalls,
  };
}

export function restoredCostUI(
  saved: RecoveryCostUI,
  state: SessionSnapshot,
): Conversation {
  const room = state.workspace!.current,
    cost = state.cost!;
  const entries: MarketEntry[] = saved.entries.map((entry) => {
    const matched = currentTarget(entry.target, state);
    const current =
      entry.current &&
      matched !== null &&
      saved.roomRevision === state.conversations?.estimate?.roomRevision &&
      saved.costRevision === state.conversations?.estimate?.revision;
    const target = matched ?? entry.target;
    const input = {
      kind: 'sourcing' as const,
      schemaVersion: VERSIONS.schema,
      catalogueVersion: VERSIONS.catalogue,
      rulesVersion: VERSIONS.rules,
      identity: {
        workspaceId: state.workspace!.workspaceId,
        generation: state.generation,
        operationId: 'continued-options',
        roomId: room.roomId,
        inputRevision: room.roomRevision,
      },
      costRevision: cost.revision,
      locality: researchLocality(
        cost.settings.locality,
        target.brief.kind !== 'service',
      ),
      brief: target.brief,
    };
    return {
      target,
      workspaceId: state.workspace!.workspaceId,
      generation: state.generation,
      roomRevision: current ? room.roomRevision : -1,
      costRevision: current ? cost.revision : -1,
      update: {
        kind: 'answer',
        answer: entry.result.ok
          ? {
              ok: true,
              input,
              reply: entry.result.reply,
              simulation: entry.result.simulation,
            }
          : { ok: false, retired: false, message: entry.result.message },
      },
    };
  });
  return {
    ...saved,
    viewingId: state.estimateVersions.some(
      (version) => version.id === saved.viewingId,
    )
      ? saved.viewingId
      : null,
    entries,
    remaining: saved.remaining.flatMap(
      (target) => currentTarget(target, state) ?? [],
    ),
    guide: {
      stage: saved.guide.stage,
      key: saved.guide.key,
      ...(saved.guide.reviewedKeys
        ? { reviewedKeys: [...saved.guide.reviewedKeys] }
        : {}),
      ...(saved.guide.passId !== undefined
        ? { passId: saved.guide.passId }
        : {}),
      ...(saved.guide.mode ? { mode: saved.guide.mode } : {}),
    },
  };
}
