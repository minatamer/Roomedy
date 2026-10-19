import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import type {
  AssistantReply,
  DesignSuggestion,
} from '@roomedy/contracts/assistant';
import type {
  OperationIdentity,
  ActionScope,
} from '@roomedy/contracts/commands';
import type { SearchGoal, SearchResult } from '@roomedy/contracts/search';
import {
  emptyAssistantReply,
  resolveAssistantTask,
  jsonBytes,
} from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { operationAvailability } from '../session/operation-client';
import { releaseTransport } from '../session/release-client';
import { askAssistant } from './client';

export interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  reply: AssistantReply | null;
  operationId: string | null;
  simulation: boolean;
}
interface Snapshot {
  readonly draft: string;
  readonly messages: readonly AssistantMessage[];
  readonly busy: boolean;
  readonly stage: 'idle' | 'search' | 'request';
  readonly mode: 'loading' | 'fake' | 'live' | 'unavailable';
}
interface Dependencies {
  transport?: typeof fetch;
  search?: (
    token: OperationIdentity,
    goal: SearchGoal,
    scope: ActionScope,
  ) => Promise<SearchResult>;
}
/** Ephemeral conversation only. Canonical room, one candidate, Apply and Undo belong to SessionController. */
export class AssistantController {
  private state: Snapshot = Object.freeze({
    draft: '',
    messages: [],
    busy: false,
    stage: 'idle',
    mode: 'loading',
  });
  private live = true;
  private serial = 0;
  private listeners = new Set<() => void>();
  private release: (() => void) | null = null;
  private pending: OperationIdentity | null = null;
  private configAbort = new AbortController();
  private transport: typeof fetch;
  constructor(
    readonly session: SessionController,
    private deps: Dependencies = {},
  ) {
    this.transport = releaseTransport(deps.transport ?? fetch, () =>
      session.clientPartFailed(),
    );
    this.release = session.ownResource(() => this.dispose());
    void operationAvailability(this.configAbort.signal, this.transport).then(
      (config) => {
        if (this.live)
          this.publish({
            mode: config?.capabilities.assistant ? config.mode : 'unavailable',
          });
      },
    );
  }
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private publish(change: Partial<Snapshot>) {
    if (!this.live) return;
    this.state = Object.freeze({ ...this.state, ...change });
    for (const listener of this.listeners) listener();
  }
  draft(text: string) {
    this.publish({ draft: text.slice(0, POLICY.visitorTextChars) });
  }
  private append(
    role: AssistantMessage['role'],
    text: string,
    reply: AssistantReply | null = null,
    operationId: string | null = null,
    simulation = false,
  ) {
    if (this.serial >= Number.MAX_SAFE_INTEGER - 1) return;
    const messages = [
      ...this.state.messages,
      {
        id: ++this.serial,
        role,
        text: text.slice(0, 6000),
        reply: reply
          ? {
              ...reply,
              actions: null,
              objectIds: reply.objectIds.slice(0, 8),
              checks: {
                ...reply.checks,
                issues: reply.checks.issues.slice(0, 8),
              },
              facts: reply.facts
                ? {
                    ...reply.facts,
                    missingInputs: reply.facts.missingInputs.slice(0, 8),
                    changedIds: reply.facts.changedIds.slice(0, 8),
                    coordinatedIds: reply.facts.coordinatedIds.slice(0, 8),
                  }
                : null,
            }
          : null,
        operationId,
        simulation,
      },
    ];
    while (
      messages.length > POLICY.contextTurns * 2 ||
      jsonBytes(messages) > POLICY.contextBytes * 4
    )
      messages.shift();
    this.publish({ messages });
  }
  private async search(
    token: OperationIdentity,
    goal: SearchGoal,
    scope: ActionScope,
  ) {
    if (this.deps.search) return this.deps.search(token, goal, scope);
    try {
      const { BrowserLayoutSearch } = await import('../layout-search/client');
      return new BrowserLayoutSearch(this.session).run(token, goal, scope);
    } catch {
      if (this.session.isCurrent(token)) this.session.clientPartFailed();
      throw new Error('client-load');
    }
  }
  async submit(value = this.state.draft) {
    const text = value.trim();
    if (!this.live || !text || text.length > POLICY.visitorTextChars) return;
    const workspace = this.session.getSnapshot().workspace;
    if (!workspace || this.session.getSnapshot().phase !== 'editor') return;
    const selectedId = this.session.getSnapshot().presentation.selectedId;
    const token = this.session.beginOperation();
    if (!token) return;
    const context = this.state.messages
      .map((m) => ({ role: m.role, text: m.text }))
      .slice(-POLICY.contextTurns);
    while (jsonBytes(context) > POLICY.contextBytes) context.shift();
    const task = resolveAssistantTask(
      workspace.current,
      text,
      selectedId,
      token.operationId,
      context,
    );
    this.pending = token;
    this.publish({ draft: '', busy: true, stage: 'request' });
    this.append('user', text);
    let done = false;
    const abort = new AbortController(),
      deadline = new AbortController();
    const signal = AbortSignal.any([abort.signal, deadline.signal]);
    const timer = setTimeout(() => {
      if (!this.session.isCurrent(token)) return;
      done = true;
      this.pending = null;
      this.session.completeOperation(token, () => {
        this.publish({ busy: false, stage: 'idle' });
        this.append(
          'assistant',
          'The assistant took too long. Your room is unchanged.',
        );
      });
      deadline.abort();
    }, POLICY.operationBridgeMs);
    const release = this.session.ownResource(() => {
      clearTimeout(timer);
      abort.abort();
      if (!done && this.pending === token) {
        this.pending = null;
        this.publish({ busy: false, stage: 'idle' });
        this.append(
          'assistant',
          'The earlier request was cancelled. Your current room is preserved.',
        );
      }
    }, token);
    const current = () =>
      this.live && !signal.aborted && this.session.isCurrent(token);
    const finish = (reply: AssistantReply, simulation = false) => {
      if (!current()) return;
      done = true;
      this.pending = null;
      this.publish({ busy: false, stage: 'idle' });
      if (reply.kind === 'proposal' && reply.actions) {
        const result = this.session.prepareAssistant(
          token,
          reply.actions,
          task.scope,
          task.label,
        );
        if (!result.ok) {
          this.session.completeOperation(token, () =>
            this.append(
              'assistant',
              'This proposal no longer matches the room rules. Your current room is unchanged.',
            ),
          );
          return;
        }
        this.append(
          'assistant',
          reply.summary,
          reply,
          token.operationId,
          simulation,
        );
      } else
        this.session.completeOperation(token, () =>
          this.append(
            'assistant',
            reply.summary,
            reply,
            token.operationId,
            simulation,
          ),
        );
    };
    try {
      if (
        !task.interpret &&
        ['clarify', 'unsupported', 'control', 'undo'].includes(task.kind)
      ) {
        finish({
          ...emptyAssistantReply(
            workspace.current,
            task.label,
            task.kind === 'unsupported'
              ? 'unsupported'
              : task.kind === 'clarify'
                ? 'clarification'
                : 'visitor-action',
          ),
          objectIds: task.objectIds,
          question: task.question,
          control: task.control,
        });
        return;
      }
      if (this.state.mode !== 'fake' && this.state.mode !== 'live') {
        finish(
          emptyAssistantReply(
            workspace.current,
            'The assistant is unavailable here. Your manual room controls remain available.',
          ),
        );
        return;
      }
      let localCandidate = null;
      if (task.goal) {
        if (
          task.goal.kind === 'appearance' &&
          (!task.goal.roomFinish ||
            (task.goal.roomFinish.floorFinish ===
              workspace.current.room.floorFinish &&
              task.goal.roomFinish.wallFinish ===
                workspace.current.room.wallFinish)) &&
          task.goal.pieceFinishes.every(
            (f) =>
              workspace.current.furniture.find((p) => p.id === f.id)?.finish ===
              f.finish,
          )
        ) {
          finish(
            emptyAssistantReply(
              workspace.current,
              'This room already uses the selected finishes. Its layout and measurements are unchanged.',
            ),
          );
          return;
        }
        this.publish({ stage: 'search' });
        const found = await this.search(token, task.goal, task.scope);
        if (!current()) return;
        if (!found.candidate) {
          if (
            ['invalid-input', 'out-of-scope', 'cancelled'].includes(
              found.termination,
            )
          ) {
            finish(
              emptyAssistantReply(
                workspace.current,
                'This arrangement request could not run. Your room is unchanged; you can keep editing manually.',
              ),
            );
            return;
          }
          finish({
            ...emptyAssistantReply(
              workspace.current,
              found.question
                ? 'Review this relevant measurement before asking for the arrangement.'
                : 'No better arrangement was found within this bounded search. Review a lock, measurement or selected essential before retrying.',
              found.question ? 'visitor-action' : 'explanation',
            ),
            objectIds: found.question ? [found.question.id] : task.objectIds,
            question: found.question,
            control: found.question ? 'measurement' : null,
          });
          return;
        }
        localCandidate = found.candidate;
      }
      this.publish({ stage: 'request' });
      const result = await askAssistant(
        {
          schemaVersion: VERSIONS.schema,
          catalogueVersion: VERSIONS.catalogue,
          rulesVersion: VERSIONS.rules,
          kind: 'assistant',
          identity: token,
          room: workspace.current,
          text,
          selectedId,
          localCandidate,
          context,
        },
        signal,
        this.transport,
      );
      if (!current()) return;
      finish(
        result.ok
          ? result.reply
          : emptyAssistantReply(workspace.current, result.message),
        result.ok && result.simulation,
      );
    } catch {
      if (current())
        finish(
          emptyAssistantReply(
            workspace.current,
            'The assistant could not finish. Your current room is unchanged.',
          ),
        );
    } finally {
      done = true;
      release?.();
    }
  }
  cancel() {
    this.session.cancelPreview();
  }
  chooseSuggestion(messageId: number, suggestion: DesignSuggestion) {
    const last = this.state.messages.at(-1),
      workspace = this.session.getSnapshot().workspace;
    if (
      !this.session.canEdit() ||
      this.state.busy ||
      last?.id !== messageId ||
      !last.reply?.suggestions?.includes(suggestion) ||
      !workspace ||
      workspace.current.roomRevision !== suggestion.roomRevision ||
      (suggestion.selectedId !== null &&
        !workspace.current.furniture.some(
          (p) => p.id === suggestion.selectedId,
        ))
    )
      return;
    if (suggestion.selectedId) this.session.select(suggestion.selectedId);
    this.session.setPanel('assistant');
    void this.submit(suggestion.request);
  }
  apply() {
    const label = this.session.getSnapshot().candidate?.label ?? 'Room changes';
    const result = this.session.applyAssistantPreview();
    if (result.ok && result.status === 'applied' && result.receipt)
      this.append(
        'assistant',
        `${label} applied. Room revision ${result.receipt.committedRevision}. Undo reverses this whole change.`,
      );
    else if (!result.ok)
      this.append(
        'assistant',
        'This proposal cannot be applied to the current room. Your room is unchanged.',
      );
    return result;
  }
  undo() {
    const label = this.session.getSnapshot().undoLabel,
      result = this.session.undo();
    this.append(
      'assistant',
      result.ok
        ? `Undid ${label ?? 'the last room change'}.`
        : 'There is no eligible room change to undo.',
    );
    return result;
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    this.configAbort.abort();
    if (this.pending && this.session.isCurrent(this.pending))
      this.session.cancelPreview();
    this.pending = null;
    this.state = Object.freeze({
      draft: '',
      messages: [],
      busy: false,
      stage: 'idle',
      mode: 'unavailable',
    });
    this.listeners.clear();
    const release = this.release;
    this.release = null;
    release?.();
  }
}
