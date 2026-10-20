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
  assistantSearchFallback,
  resolveMedyRequest,
  medyAdvice,
} from '@roomedy/spatial';
import type { MedyControl, MedyControlResult } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { FINISH_COLORS, roomSurface } from '@roomedy/contracts/surfaces';
import { operationAvailability } from '../session/operation-client';
import { releaseTransport } from '../session/release-client';
import { askAssistant } from './client';
import { failureMessage } from '../room-editor/messages';

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
  control?: (
    control: MedyControl,
  ) => MedyControlResult | Promise<MedyControlResult>;
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
    const context = this.state.messages
      .map((m) => ({ role: m.role, text: m.text }))
      .slice(-POLICY.contextTurns);
    while (jsonBytes(context) > POLICY.contextBytes) context.shift();
    const medy = resolveMedyRequest(
      workspace.current,
      text,
      selectedId,
      context,
    );
    if (medy) {
      this.publish({ draft: '' });
      this.append('user', text);
      if (medy.kind === 'reply') {
        const reply = {
          ...emptyAssistantReply(
            workspace.current,
            medy.summary,
            medy.suggestions?.length ? 'clarification' : 'explanation',
          ),
          objectIds: medy.objectIds,
          ...(medy.suggestions ? { suggestions: medy.suggestions } : {}),
        };
        this.append(
          'assistant',
          reply.summary,
          reply.objectIds.length || reply.suggestions?.length ? reply : null,
        );
      } else if (medy.kind === 'control') {
        if (medy.control.type === 'apply') this.apply();
        else if (medy.control.type === 'undo') this.undo();
        else if (medy.control.type === 'cancel') {
          const hadWork =
            !!this.session.getSnapshot().candidate ||
            !!this.session.getSnapshot().pending;
          this.cancel();
          this.append(
            'assistant',
            hadWork
              ? 'Discarded that preview. Your current room stays as it was.'
              : 'There isn’t a preview to discard. What would you like to try?',
          );
        } else {
          const generation = this.session.getSnapshot().generation;
          let result: MedyControlResult;
          try {
            result = this.deps.control
              ? await this.deps.control(medy.control)
              : {
                  ok: false,
                  summary:
                    'The room controls are still opening. Try that once the room is ready.',
                };
          } catch {
            result = {
              ok: false,
              summary:
                'That control couldn’t open. Try it again, or use the room controls and Project menu.',
            };
          }
          if (
            this.live &&
            this.session.getSnapshot().generation === generation &&
            this.session.getSnapshot().workspace?.workspaceId ===
              workspace.workspaceId
          )
            this.append('assistant', result.summary);
        }
      } else {
        const manualToken = this.session.beginOperation();
        if (!manualToken) return;
        const prepared = this.session.prepareAssistantManual(
          manualToken,
          text,
          selectedId,
          context,
        );
        if (!prepared.ok) {
          this.session.completeOperation(manualToken, () =>
            this.append(
              'assistant',
              failureMessage(prepared, workspace.current),
            ),
          );
        } else {
          const summary = prepared.changed
            ? `Here’s the preview: ${prepared.label}. Take a look, then Apply if it’s right.`
            : 'That’s already how it’s set. What would you like to try next?';
          this.append(
            'assistant',
            summary,
            {
              ...emptyAssistantReply(
                workspace.current,
                summary,
                prepared.changed ? 'proposal' : 'explanation',
              ),
              objectIds: prepared.objectIds,
            },
            manualToken.operationId,
          );
        }
      }
      return;
    }
    const discussion = resolveAssistantTask(
      workspace.current,
      text,
      selectedId,
      'discussion',
      context,
    );
    if (
      discussion.kind === 'conversation' &&
      this.session.getSnapshot().candidate
    ) {
      this.publish({ draft: '' });
      this.append('user', text);
      this.append('assistant', medyAdvice(workspace.current, text, selectedId));
      return;
    }
    const token = this.session.beginOperation();
    if (!token) return;
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
            task.kind === 'conversation' ? null : reply,
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
            task.kind === 'conversation'
              ? medyAdvice(workspace.current, text, selectedId)
              : 'I can still help with exact edits, room controls and the tour. Design search is unavailable at the moment.',
          ),
        );
        return;
      }
      let localCandidate = null;
      if (task.goal) {
        if (
          task.goal.kind === 'appearance' &&
          (!task.goal.roomFinish ||
            (FINISH_COLORS[task.goal.roomFinish.floorFinish] ===
              roomSurface(workspace.current.room, 'floor').color &&
              FINISH_COLORS[task.goal.roomFinish.wallFinish] ===
                roomSurface(workspace.current.room, 'walls').color)) &&
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
          finish(assistantSearchFallback(workspace.current, task, found));
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
  cancel(operationId?: string) {
    const candidate = this.session.getSnapshot().candidate;
    if (
      operationId !== undefined &&
      (candidate?.source !== 'assistant' ||
        candidate.identity.operationId !== operationId)
    )
      return false;
    this.session.cancelPreview();
    return true;
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
        ) &&
        !workspace.current.room.features.some(
          (feature) => feature.id === suggestion.selectedId,
        ))
    )
      return;
    if (suggestion.selectedId) this.session.select(suggestion.selectedId);
    this.session.setPanel('assistant');
    void this.submit(suggestion.request);
  }
  apply(operationId?: string) {
    const candidate = this.session.getSnapshot().candidate;
    if (
      operationId !== undefined &&
      (candidate?.source !== 'assistant' ||
        candidate.identity.operationId !== operationId)
    )
      return { ok: false as const, code: 'stale' as const };
    const label = this.session.getSnapshot().candidate?.label ?? 'Room changes';
    if (
      candidate &&
      candidate.source !== 'assistant' &&
      operationId === undefined
    ) {
      const result = this.session.applyVisitorPreview();
      this.append(
        'assistant',
        result.ok
          ? 'Done — applied the room preview. You can Undo to bring it back.'
          : 'That preview is no longer current. Review the room before trying again.',
      );
      return result.ok
        ? {
            ...result,
            receipt: null,
            status: result.changed
              ? ('applied' as const)
              : ('unchanged' as const),
          }
        : { ok: false as const, code: 'stale' as const };
    }
    const result = this.session.applyAssistantPreview();
    if (result.ok && result.status === 'applied' && result.receipt)
      this.append(
        'assistant',
        `Done — ${label.charAt(0).toLowerCase() + label.slice(1)}. You can Undo if you’d like to go back.`,
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
