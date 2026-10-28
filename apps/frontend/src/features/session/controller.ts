import {
  createCostDraft,
  reconcileCost,
  validatedCost,
  pricingState,
} from '../cost/state';
import { estimateStateSchema } from '@roomedy/contracts/estimates';
import { idSchema } from '@roomedy/contracts/primitives';
import type { EstimateState } from '@roomedy/contracts/estimates';
import type { ProjectDestination } from '../cost/navigation';
import type {
  OperationIdentity,
  VisitorAction,
  ActionScope,
  ProposalAction,
  CommandEnvelope,
  Receipt,
} from '@roomedy/contracts/commands';
import type { SearchGoal, SearchResult } from '@roomedy/contracts/search';
import { POLICY, VERSIONS } from '@roomedy/contracts/policy';
import type { RoomDocument } from '@roomedy/contracts/room';
import {
  applyCommand,
  recordCostChange,
  calculateRoomEstimate,
  checkRoom,
  createCommandWorkspace,
  prepareCommand,
  undoCommand,
  emptySearchResult,
  resolveMedyRequest,
} from '@roomedy/spatial';
import type {
  CommandResult,
  CommandFailure,
  ApplyResult,
} from '@roomedy/spatial';
import { ResourceRegistry } from './effects';
import { initialPresentation } from './state';
import type { Panel, PhotoNotes, SessionSnapshot } from './state';
import { recoverySchema } from '@roomedy/contracts/project';
import { ESTIMATE_VERSION_LIMIT } from '@roomedy/contracts/project';
import type { EstimateVersion, Recovery } from '@roomedy/contracts/project';
import { validateProject, projectOf } from './project';
import { captureVersion, freezeVersion } from '../cost/versions';
import { clearanceNotice } from './clearance';

interface Dependencies {
  now?: () => number;
  id?: () => string;
}
interface AssistantPreview {
  token: OperationIdentity;
  command: CommandEnvelope;
  scope: ActionScope | undefined;
  authority: 'assistant' | 'visitor';
  label: string;
}
export class SessionController {
  private state: SessionSnapshot;
  private readonly now: () => number;
  private readonly id: () => string;
  private readonly listeners = new Set<() => void>();
  private readonly resources = new ResourceRegistry(64);
  private readonly operations = new ResourceRegistry(16);
  private readonly labels = new Map<string, string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private messageTimer: ReturnType<typeof setTimeout> | undefined;
  private cleaning = false;
  private assistantPreview: AssistantPreview | null = null;
  private lastAssistant: AssistantPreview | null = null;
  private costPreview: {
    token: OperationIdentity;
    command: CommandEnvelope | null;
    revision: number;
    pricing: EstimateState;
    label: string;
  } | null = null;
  private visitorPreview: {
    token: OperationIdentity;
    actions: VisitorAction[];
    label: string;
  } | null = null;

  constructor(room?: RoomDocument, dependencies: Dependencies = {}) {
    this.now = dependencies.now ?? Date.now;
    this.id = dependencies.id ?? (() => crypto.randomUUID());
    const createdAt = this.now();
    this.state = Object.freeze({
      phase: room ? 'editor' : 'entry',
      destination: 'design',
      cost: null,
      costProposal: null,
      estimateVersions: Object.freeze([]),
      generation: 0,
      createdAt,
      expiresAt: createdAt + POLICY.guestLifetimeMs,
      workspace: room
        ? createCommandWorkspace(room, {
            workspaceId: this.id(),
            generation: 0,
          })
        : null,
      checks: room ? checkRoom(room) : null,
      presentation: initialPresentation(),
      pending: null,
      candidate: null,
      message: '',
      messageKind: 'notice',
      undoLabel: null,
      comparison: 'current',
      persistence: 'checking',
      recovered: false,
      imported: false,
      expiresSoon: false,
      clientLoadFailure: false,
      photoNotes: null,
    });
  }
  getSnapshot = (): SessionSnapshot => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(change: Partial<SessionSnapshot>) {
    if (change.workspace?.current && this.state.cost && !('cost' in change))
      change = {
        ...change,
        cost: reconcileCost(change.workspace.current, this.state.cost),
      };
    this.state = Object.freeze({
      ...this.state,
      ...('message' in change ? { messageKind: 'notice' as const } : {}),
      ...change,
    });
    if ('message' in change) {
      this.clearMessageTimer();
      if (
        this.state.message &&
        !['expired', 'disposed'].includes(this.state.phase)
      ) {
        const timer = setTimeout(() => {
          if (this.messageTimer !== timer) return;
          this.messageTimer = undefined;
          if (this.active()) this.publish({ message: '' });
        }, 4000);
        this.messageTimer = timer;
      }
    }
    for (const listener of this.listeners) listener();
  }
  private clearMessageTimer() {
    if (this.messageTimer !== undefined) clearTimeout(this.messageTimer);
    this.messageTimer = undefined;
  }
  /** Enforced at every action/result entry, independently of timer wake-up. */
  private active(): boolean {
    if (
      this.cleaning ||
      this.state.phase === 'disposed' ||
      this.state.phase === 'expired'
    )
      return false;
    if (this.now() >= this.state.expiresAt) {
      this.retire('expired');
      return false;
    }
    return true;
  }
  canEdit(): boolean {
    return (
      this.active() &&
      this.state.comparison === 'current' &&
      !this.state.clientLoadFailure
    );
  }
  checkExpiry(): boolean {
    return this.active();
  }
  expiredRecovery() {
    this.retire('expired');
  }
  private cancelWork() {
    this.costPreview = null;
    this.visitorPreview = null;
    this.assistantPreview = null;
    this.lastAssistant = null;
    this.state = Object.freeze({
      ...this.state,
      pending: null,
      candidate: null,
      costProposal: null,
    });
    this.cleaning = true;
    this.operations.clear();
    this.cleaning = false;
  }
  private retire(phase: 'expired' | 'disposed') {
    this.clearMessageTimer();
    // Fence identity and accepted semantics BEFORE aborting/revoking resources.
    this.state = Object.freeze({
      ...this.state,
      phase,
      destination: 'design',
      cost: null,
      costProposal: null,
      estimateVersions: Object.freeze([]),
      generation: this.state.generation + 1,
      workspace: null,
      photoNotes: null,
      checks: null,
      pending: null,
      candidate: null,
      presentation: initialPresentation(),
      undoLabel: null,
      message:
        phase === 'expired'
          ? 'This room session has expired. Start a new room to continue.'
          : '',
    });
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.labels.clear();
    this.visitorPreview = null;
    this.assistantPreview = null;
    this.lastAssistant = null;
    this.costPreview = null;
    this.cleaning = true;
    this.operations.clear();
    this.resources.clear();
    this.cleaning = false;
    this.publish({});
  }
  startTimer() {
    if (!this.active()) return;
    if (this.timer) clearTimeout(this.timer);
    const now = this.now(),
      warningAt = this.state.expiresAt - 5 * 60_000;
    if (now >= warningAt && !this.state.expiresSoon)
      this.publish({ expiresSoon: true });
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        if (this.active()) this.startTimer();
      },
      Math.max(
        1,
        (this.state.expiresSoon ? this.state.expiresAt : warningAt) - now,
      ),
    );
  }
  dispose() {
    if (this.state.phase !== 'disposed') this.retire('disposed');
    this.listeners.clear();
  }
  beginIntake(): boolean {
    if (
      !this.active() ||
      this.state.clientLoadFailure ||
      this.state.phase !== 'entry'
    )
      return false;
    this.publish({ phase: 'intake' });
    return true;
  }
  isIntakeCurrent(generation: number): boolean {
    return (
      this.active() &&
      this.state.phase === 'intake' &&
      !this.state.clientLoadFailure &&
      this.state.generation === generation
    );
  }
  acceptRoom(room: RoomDocument, photoNotes?: PhotoNotes): boolean {
    if (
      !this.active() ||
      this.state.clientLoadFailure ||
      !['entry', 'intake'].includes(this.state.phase)
    )
      return false;
    const generation = this.state.generation + 1;
    const workspace = createCommandWorkspace(room, {
      workspaceId: this.id(),
      generation,
    });
    this.cancelWork();
    this.publish({
      phase: 'editor',
      generation,
      workspace,
      checks: checkRoom(workspace.current),
      presentation: initialPresentation(),
      message: '',
      undoLabel: null,
      photoNotes: photoNotes
        ? {
            outline: photoNotes.outline,
            simulated: photoNotes.simulated,
            unplaced: photoNotes.unplaced
              .slice(0, POLICY.draftObservations)
              .map((label) => label.slice(0, 120)),
          }
        : null,
    });
    return true;
  }
  dismissPhotoNotes() {
    if (this.active()) this.publish({ photoNotes: null });
  }
  reset(room?: RoomDocument): boolean {
    return this.replaceRoom(room);
  }
  private replaceRoom(
    room?: RoomDocument,
    options?: {
      baseline: RoomDocument;
      createdAt: number;
      expiresAt: number;
      recovered: boolean;
      imported: boolean;
      roomView: 'plan' | 'cutaway';
      cost?: EstimateState | null;
      versions?: readonly EstimateVersion[];
      destination?: ProjectDestination;
    },
  ): boolean {
    if (this.cleaning || this.state.phase === 'disposed') return false;
    const generation = this.state.generation + 1;
    // Validation precedes retirement; an invalid replacement cannot discard useful work.
    const workspace = room
      ? createCommandWorkspace(
          room,
          { workspaceId: this.id(), generation },
          options?.baseline ?? room,
        )
      : null;
    const createdAt = options?.createdAt ?? this.now();
    this.state = Object.freeze({
      ...this.state,
      generation,
      workspace,
      pending: null,
      candidate: null,
      phase: room ? 'editor' : 'entry',
      destination: options?.destination ?? 'design',
      cost:
        room && options?.cost
          ? {
              ...structuredClone(options.cost),
              revision: 0,
              roomRevision: room.roomRevision,
              messages: [],
            }
          : null,
      estimateVersions: Object.freeze(
        (options?.versions ?? []).map(freezeVersion),
      ),
      createdAt,
      costProposal: null,
      expiresAt: options?.expiresAt ?? createdAt + POLICY.guestLifetimeMs,
      checks: room ? checkRoom(room) : null,
      presentation: initialPresentation(options?.roomView),
      message: '',
      undoLabel: null,
      comparison: 'current',
      persistence: 'checking',
      recovered: options?.recovered ?? false,
      imported: options?.imported ?? false,
      expiresSoon: false,
      clientLoadFailure: false,
      photoNotes: null,
    });
    this.clearMessageTimer();
    this.cleaning = true;
    this.operations.clear();
    this.resources.clear();
    this.cleaning = false;
    this.labels.clear();
    this.visitorPreview = null;
    this.assistantPreview = null;
    this.lastAssistant = null;
    this.costPreview = null;
    this.publish({});
    this.startTimer();
    return true;
  }
  importProject(project: unknown): boolean {
    const validated = validateProject(project);
    if (!validated.ok) return false;
    const now = this.now();
    return this.replaceRoom(
      { ...validated.value.current, roomRevision: 0 },
      {
        baseline: validated.value.baseline,
        createdAt: now,
        expiresAt: now + POLICY.guestLifetimeMs,
        recovered: false,
        imported: true,
        roomView: this.state.presentation.roomView,
        cost: validated.value.cost,
        versions: validated.value.versions,
        destination: validated.value.cost ? 'cost' : 'design',
      },
    );
  }
  restore(record: Recovery): boolean {
    const parsed = recoverySchema.safeParse(record);
    if (!parsed.success) return false;
    record = parsed.data;
    const now = this.now(),
      validated = validateProject(record.project);
    if (
      !validated.ok ||
      record.createdAt > now ||
      record.expiresAt <= now ||
      record.expiresAt !== record.createdAt + POLICY.guestLifetimeMs
    )
      return false;
    return this.replaceRoom(validated.value.current, {
      baseline: validated.value.baseline,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      recovered: true,
      imported: false,
      roomView: record.ui.view === '2d' ? 'plan' : 'cutaway',
      cost: validated.value.cost,
      versions: validated.value.versions,
      destination: validated.value.cost ? record.ui.destination : 'design',
    });
  }
  saveEstimate(
    label: string,
  ): { ok: true; id: string } | { ok: false; reason: string } {
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.candidate
    )
      return {
        ok: false,
        reason: 'Resolve the preview and open the current cost draft first.',
      };
    if (this.state.estimateVersions.length >= ESTIMATE_VERSION_LIMIT)
      return {
        ok: false,
        reason:
          'This project already has four saved versions. Download the project to keep them; start a separate room project for further versions.',
      };
    const version = captureVersion(
      this.state.workspace.current,
      pricingState(this.state.cost),
      this.id(),
      label,
      this.now(),
    );
    if (!version)
      return {
        ok: false,
        reason: 'Review the version name and estimate before saving.',
      };
    const versions = Object.freeze([...this.state.estimateVersions, version]);
    if (!projectOf({ ...this.state, estimateVersions: versions }))
      return {
        ok: false,
        reason:
          'This version exceeds the bounded project size. Download the existing project before starting a separate one.',
      };
    if (!this.active())
      return { ok: false, reason: 'This room session has expired.' };
    this.cancelWork();
    this.publish({
      estimateVersions: versions,
      message: `${label} saved in this session as a reviewed planning estimate.`,
    });
    return { ok: true, id: version.id };
  }
  draftFromEstimate(id: string): boolean {
    if (!this.canEdit() || !this.state.workspace || this.state.candidate)
      return false;
    const version = this.state.estimateVersions.find((v) => v.id === id);
    if (!version) return false;
    return this.replaceRoom(
      { ...version.room, roomRevision: 0 },
      {
        baseline: this.state.workspace.baseline,
        createdAt: this.state.createdAt,
        expiresAt: this.state.expiresAt,
        recovered: false,
        imported: false,
        roomView: this.state.presentation.roomView,
        cost: version.pricing,
        versions: this.state.estimateVersions,
        destination: 'cost',
      },
    );
  }
  setPersistence(status: SessionSnapshot['persistence']) {
    if (this.state.persistence !== status && this.state.phase !== 'disposed')
      this.publish({ persistence: status });
  }
  setDestination(destination: ProjectDestination): boolean {
    if (!this.active() || !this.state.workspace) return false;
    if (this.state.candidate) {
      this.notify('Apply or Cancel the preview before changing project phase.');
      return false;
    }
    if (destination === this.state.destination) return true;
    this.cancelWork();
    this.publish({
      destination,
      comparison: 'current',
      cost: this.state.cost ?? createCostDraft(this.state.workspace.current),
    });
    return true;
  }
  updateCost(
    settings: unknown,
    offers: unknown = this.state.cost?.offers,
  ): boolean {
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.candidate
    )
      return false;
    const cost = validatedCost(this.state.workspace.current, settings, offers);
    if (!cost) {
      this.notify(
        'Review the estimate units, products and currency before applying.',
      );
      return false;
    }
    const pricing = {
      ...pricingState(cost),
      budgetMinor:
        cost.settings.locality.currency ===
        this.state.cost.settings.locality.currency
          ? this.state.cost.budgetMinor
          : null,
    };
    if (
      JSON.stringify(pricing) === JSON.stringify(pricingState(this.state.cost))
    )
      return true;
    const commandId = this.id();
    return this.commitCommand(
      { commandId },
      'Estimate updated',
      recordCostChange(
        this.state.workspace,
        pricingState(this.state.cost),
        commandId,
      ),
      pricing,
    ).ok;
  }
  prepareCostProposal(
    pricing: EstimateState,
    label: string,
    tradeoffs: string[],
    expectedRevision: number,
    actions: VisitorAction[] = [],
  ): { ok: true } | { ok: false; code: string } {
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.cost.revision !== expectedRevision
    )
      return { ok: false, code: 'stale' };
    const parsed = estimateStateSchema.safeParse(pricing);
    if (
      !parsed.success ||
      tradeoffs.length > 8 ||
      tradeoffs.some((t) => t.length > 600) ||
      !label.trim() ||
      label.length > 120
    )
      return { ok: false, code: 'invalid-input' };
    const command = actions.length
      ? this.envelope(structuredClone(actions))
      : null;
    const evaluation = command
      ? prepareCommand(this.state.workspace, command, 'visitor')
      : null;
    if (evaluation && !evaluation.ok) return evaluation;
    const room = evaluation?.ok
      ? evaluation.room
      : this.state.workspace.current;
    const before = calculateRoomEstimate(
        this.state.workspace.current,
        this.state.cost.settings,
        this.state.cost.offers,
      ),
      after = calculateRoomEstimate(
        room,
        parsed.data.settings,
        parsed.data.offers,
      );
    if (!before.ok || !after.ok) return { ok: false, code: 'invalid-input' };
    const token = this.beginOperation();
    if (!token) return { ok: false, code: 'stale' };
    this.costPreview = {
      token,
      command,
      revision: expectedRevision,
      pricing: structuredClone(parsed.data),
      label,
    };
    this.publish({
      candidate: {
        identity: token,
        source: 'cost',
        label,
        room,
        checks: checkRoom(room),
      },
      costProposal: {
        label,
        tradeoffs: [...tradeoffs],
        before: before.estimate,
        after: after.estimate,
        pricing: parsed.data,
      },
      message: 'Review the design, quantities and cost changes before Apply.',
    });
    return { ok: true };
  }
  applyCostProposal(): { ok: true; changed: boolean } | CommandFailure {
    const preview = this.costPreview;
    if (
      !preview ||
      !this.canEdit() ||
      !this.isCurrent(preview.token) ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.cost.revision !== preview.revision
    )
      return { ok: false, code: 'stale' };
    const commandId = preview.command?.commandId ?? this.id();
    let result = preview.command
      ? applyCommand(
          this.state.workspace,
          preview.command,
          'visitor',
          undefined,
          pricingState(this.state.cost),
        )
      : null;
    if (result && !result.ok) return result;
    const room = result?.ok
      ? result.workspace.current
      : this.state.workspace.current;
    if (
      !calculateRoomEstimate(
        room,
        preview.pricing.settings,
        preview.pricing.offers,
      ).ok
    )
      return { ok: false, code: 'invalid-input' };
    const financialChange =
      JSON.stringify(preview.pricing) !==
      JSON.stringify(pricingState(this.state.cost));
    if (!result || (result.status !== 'applied' && financialChange))
      result = financialChange
        ? recordCostChange(
            this.state.workspace,
            pricingState(this.state.cost),
            commandId,
          )
        : null;
    if (!result) {
      this.cancelPreview();
      return { ok: true, changed: false };
    }
    return this.commitCommand(
      { commandId },
      preview.label,
      result,
      preview.pricing,
    );
  }
  costMessage(role: 'visitor' | 'assistant', text: string, lineIds?: string[]) {
    if (
      !this.active() ||
      !this.state.cost ||
      !text.trim() ||
      text.length > 4000
    )
      return false;
    const cards =
      role === 'assistant'
        ? [...new Set(lineIds ?? [])]
            .filter((id) => idSchema.safeParse(id).success)
            .slice(0, 4)
        : [];
    const messages = [
      ...this.state.cost.messages,
      {
        role,
        text: text.trim(),
        ...(cards.length ? { lineIds: cards } : {}),
        roomRevision: this.state.cost.roomRevision,
        costRevision: this.state.cost.revision,
      },
    ].slice(-40);
    while (
      new TextEncoder().encode(messages.map((message) => message.text).join(''))
        .byteLength > 131072
    )
      messages.shift();
    this.publish({ cost: { ...this.state.cost, messages } });
    return true;
  }
  setRoomView(roomView: 'plan' | 'cutaway') {
    if (this.active())
      this.publish({ presentation: { ...this.state.presentation, roomView } });
  }
  setComparison(comparison: SessionSnapshot['comparison']): boolean {
    if (!this.active() || !this.state.workspace) return false;
    if (this.state.candidate) {
      this.publish({
        message:
          'Apply or Cancel the preview before comparing Before and Current.',
      });
      return false;
    }
    if (comparison === this.state.comparison) return true;
    if (this.state.pending) this.cancelWork();
    this.publish({
      comparison,
      message: '',
      presentation: { ...this.state.presentation, selectedId: null },
    });
    return true;
  }
  clientPartFailed() {
    if (!this.active()) return;
    this.state = Object.freeze({
      ...this.state,
      clientLoadFailure: true,
      pending: null,
      candidate: null,
      comparison: 'current',
    });
    this.cleaning = true;
    this.operations.clear();
    this.resources.clear();
    this.cleaning = false;
    this.visitorPreview = null;
    this.assistantPreview = null;
    this.lastAssistant = null;
    this.publish({
      message:
        'Part of the editor could not load. Export your accepted layout or reload to try again.',
    });
  }
  select(id: string | null) {
    if (!this.active()) return;
    const room =
      this.state.comparison === 'before'
        ? this.state.workspace?.baseline
        : (this.state.candidate?.room ?? this.state.workspace?.current);
    const selectedId =
      id &&
      room &&
      [...room.furniture, ...room.room.features].some((item) => item.id === id)
        ? id
        : null;
    const canAnnounce =
      this.state.comparison === 'current' &&
      !this.state.candidate &&
      !this.state.pending &&
      !this.state.clientLoadFailure;
    const notice =
      canAnnounce && room && this.state.checks
        ? clearanceNotice(room, this.state.checks, selectedId)
        : null;
    this.publish({
      presentation: {
        ...this.state.presentation,
        selectedId,
        panel: selectedId ? 'inspector' : this.state.presentation.panel,
      },
      ...(notice
        ? { message: notice, messageKind: 'clearance' as const }
        : canAnnounce && this.state.messageKind === 'clearance'
          ? { message: '' }
          : {}),
    });
  }
  setPanel(panel: Panel) {
    if (this.active())
      this.publish({ presentation: { ...this.state.presentation, panel } });
  }
  setView(
    change: Partial<
      Pick<SessionSnapshot['presentation'], 'zoom' | 'panX' | 'panZ' | 'snap'>
    >,
  ) {
    if (!this.active()) return;
    if (
      Object.values(change).some(
        (v) => typeof v === 'number' && !Number.isFinite(v),
      )
    )
      return;
    const next = { ...this.state.presentation, ...change };
    this.publish({
      presentation: {
        ...next,
        zoom: Math.max(0.6, Math.min(3, next.zoom)),
        panX: Math.max(
          -POLICY.roomEdgeMm,
          Math.min(POLICY.roomEdgeMm, next.panX),
        ),
        panZ: Math.max(
          -POLICY.roomEdgeMm,
          Math.min(POLICY.roomEdgeMm, next.panZ),
        ),
      },
    });
  }
  notify(message: string) {
    if (this.active()) this.publish({ message: message.slice(0, 240) });
  }
  previewVisitor(actions: VisitorAction[]): CommandResult {
    if (!this.canEdit() || !this.state.workspace)
      return { ok: false, code: 'stale' };
    return prepareCommand(
      this.state.workspace,
      this.envelope(actions),
      'visitor',
    );
  }
  prepareVisitorPreview(
    actions: VisitorAction[],
    label: string,
  ): { ok: true } | { ok: false; code: string } {
    const result = this.previewVisitor(actions);
    if (!result.ok) return result;
    if (!result.changed) {
      this.cancelWork();
      this.publish({ message: 'No change needed.' });
      return { ok: true };
    }
    const token = this.beginOperation();
    if (!token) return { ok: false, code: 'stale' };
    this.visitorPreview = { token, actions: structuredClone(actions), label };
    this.publish({
      candidate: { identity: token, room: result.room, checks: result.checks },
      message: 'Preview ready. Apply or cancel the palette change.',
    });
    return { ok: true };
  }
  applyVisitorPreview():
    { ok: true; changed: boolean } | { ok: false; code: string } {
    const preview = this.visitorPreview;
    if (!preview || !this.isCurrent(preview.token))
      return { ok: false, code: 'stale' };
    return this.dispatch(preview.actions, preview.label);
  }
  cancelPreview() {
    if (!this.active()) return;
    this.cancelWork();
    this.publish({ message: 'Preview cancelled.' });
  }
  private envelope(actions: VisitorAction[]) {
    const workspace = this.state.workspace!;
    return {
      commandId: this.id(),
      commandSequence: workspace.lastCommandSequence + 1,
      identity: {
        workspaceId: workspace.workspaceId,
        generation: workspace.generation,
        operationId: this.id(),
        roomId: workspace.current.roomId,
        inputRevision: workspace.current.roomRevision,
      },
      schemaVersion: VERSIONS.schema,
      catalogueVersion: VERSIONS.catalogue,
      rulesVersion: VERSIONS.rules,
      actions,
    };
  }
  dispatch(
    actions: VisitorAction[],
    label: string,
  ): { ok: true; changed: boolean } | CommandFailure {
    if (!this.canEdit() || !this.state.workspace)
      return { ok: false, code: 'stale' };
    const command = this.envelope(actions);
    return this.commitCommand(
      command,
      label,
      applyCommand(
        this.state.workspace,
        command,
        'visitor',
        undefined,
        this.state.cost ? pricingState(this.state.cost) : undefined,
      ),
    );
  }
  private commitCommand(
    command: Pick<CommandEnvelope, 'commandId'>,
    label: string,
    result: ApplyResult,
    pricing?: EstimateState,
  ): { ok: true; changed: boolean } | CommandFailure {
    if (!result.ok) return result;
    if (
      this.state.cost &&
      this.state.cost.revision >= Number.MAX_SAFE_INTEGER - 1
    )
      return { ok: false, code: 'revision-limit' };
    const changed = result.status === 'applied';
    if (changed) this.cancelWork();
    if (result.undoRecorded)
      this.labels.set(command.commandId, label.slice(0, 120));
    const liveIds = new Set(
      result.workspace.history.entries.map((entry) => entry.commandId),
    );
    for (const id of this.labels.keys())
      if (!liveIds.has(id)) this.labels.delete(id);
    const selectedId = this.state.presentation.selectedId;
    const remains = [
      ...result.workspace.current.furniture,
      ...result.workspace.current.room.features,
    ].some((item) => item.id === selectedId);
    const checks = result.evaluation?.ok
      ? result.evaluation.checks
      : checkRoom(result.workspace.current);
    const notice = changed
      ? clearanceNotice(
          result.workspace.current,
          checks,
          selectedId,
          this.state.checks,
        )
      : null;
    this.publish({
      workspace: result.workspace,
      ...(pricing && this.state.cost
        ? {
            cost: {
              ...pricing,
              revision: this.state.cost.revision + 1,
              roomRevision: result.workspace.current.roomRevision,
              messages: this.state.cost.messages,
            },
          }
        : {}),
      checks,
      presentation: {
        ...this.state.presentation,
        selectedId: remains ? selectedId : null,
      },
      message: notice ?? (changed ? `${label}.` : 'No change needed.'),
      messageKind: notice ? 'clearance' : 'confirmation',
      undoLabel:
        this.labels.get(
          result.workspace.history.entries.at(-1)?.commandId ?? '',
        ) ?? null,
    });
    return { ok: true, changed };
  }
  prepareAssistant(
    token: OperationIdentity,
    actions: ProposalAction[],
    scope: ActionScope,
    label: string,
  ): { ok: true; changed: boolean } | CommandFailure {
    if (!this.canEdit() || !this.isCurrent(token) || !this.state.workspace)
      return { ok: false, code: 'stale' };
    const command = { ...this.envelope(actions), identity: { ...token } };
    const evaluated = prepareCommand(
      this.state.workspace,
      command,
      'assistant',
      scope,
    );
    if (!evaluated.ok) return evaluated;
    if (!evaluated.changed) {
      this.completeOperation(token, () => {
        this.publish({ message: 'No change needed.' });
      });
      return { ok: true, changed: false };
    }
    this.assistantPreview = {
      token: { ...token },
      command: structuredClone(command),
      scope: structuredClone(scope),
      authority: 'assistant',
      label: label.slice(0, 120),
    };
    this.publish({
      candidate: {
        identity: { ...token },
        source: 'assistant',
        label: label.slice(0, 120),
        room: evaluated.room,
        checks: evaluated.checks,
      },
      message: 'Proposal ready. Review the changes before Apply.',
    });
    return { ok: true, changed: true };
  }
  /** Explicit chat instructions compile to the very same visitor command as a form.
   * This accepts human text, never a provider-supplied visitor action batch. */
  prepareAssistantManual(
    token: OperationIdentity,
    text: string,
    selectedId: string | null,
    context: readonly { role: 'user' | 'assistant'; text: string }[],
  ):
    | { ok: true; changed: boolean; label: string; objectIds: string[] }
    | CommandFailure {
    if (!this.canEdit() || !this.isCurrent(token) || !this.state.workspace)
      return { ok: false, code: 'stale' };
    const task = resolveMedyRequest(
      this.state.workspace.current,
      text,
      selectedId,
      context,
      token.operationId,
    );
    if (task?.kind !== 'edits') return { ok: false, code: 'out-of-scope' };
    const command = { ...this.envelope(task.actions), identity: { ...token } };
    const evaluated = prepareCommand(this.state.workspace, command, 'visitor');
    if (!evaluated.ok) return evaluated;
    if (!evaluated.changed) {
      this.completeOperation(token, () =>
        this.publish({ message: 'No change needed.' }),
      );
      return {
        ok: true,
        changed: false,
        label: task.label,
        objectIds: task.objectIds,
      };
    }
    this.assistantPreview = {
      token: { ...token },
      command: structuredClone(command),
      scope: undefined,
      authority: 'visitor',
      label: task.label.slice(0, 120),
    };
    this.publish({
      candidate: {
        identity: { ...token },
        source: 'assistant',
        label: task.label.slice(0, 120),
        room: evaluated.room,
        checks: evaluated.checks,
      },
      message: 'Preview ready. Review your requested change before Apply.',
    });
    return {
      ok: true,
      changed: true,
      label: task.label,
      objectIds: evaluated.affectedIds,
    };
  }
  applyAssistantPreview():
    | {
        ok: true;
        changed: boolean;
        receipt: Receipt | null;
        status: 'applied' | 'unchanged' | 'already-applied';
      }
    | CommandFailure {
    if (!this.canEdit() || !this.state.workspace)
      return { ok: false, code: 'stale' };
    const preview = this.assistantPreview ?? this.lastAssistant;
    if (!preview || (this.assistantPreview && !this.isCurrent(preview.token)))
      return { ok: false, code: 'stale' };
    const result = applyCommand(
      this.state.workspace,
      preview.command,
      preview.authority,
      preview.scope,
      this.state.cost ? pricingState(this.state.cost) : undefined,
    );
    const committed = this.commitCommand(
      preview.command,
      preview.label,
      result,
    );
    if (!committed.ok) return committed;
    if (!result.ok) return result;
    this.lastAssistant = preview;
    return { ...committed, receipt: result.receipt, status: result.status };
  }
  undo(): { ok: true } | { ok: false; code: string } {
    if (!this.canEdit() || !this.state.workspace)
      return { ok: false, code: 'stale' };
    if (
      this.state.cost &&
      this.state.cost.revision >= Number.MAX_SAFE_INTEGER - 1
    )
      return { ok: false, code: 'revision-limit' };
    const result = undoCommand(this.state.workspace);
    if (!result.ok) return result;
    this.cancelWork();
    this.labels.delete(result.commandId);
    const selectedId = this.state.presentation.selectedId;
    const notice = clearanceNotice(
      result.workspace.current,
      result.checks,
      selectedId,
      this.state.checks,
    );
    this.publish({
      workspace: result.workspace,
      ...(result.pricing && this.state.cost
        ? {
            cost: {
              ...result.pricing,
              revision: this.state.cost.revision + 1,
              roomRevision: result.workspace.current.roomRevision,
              messages: this.state.cost.messages,
            },
          }
        : {}),
      checks: result.checks,
      presentation: {
        ...this.state.presentation,
        selectedId: [
          ...result.workspace.current.furniture,
          ...result.workspace.current.room.features,
        ].some((item) => item.id === selectedId)
          ? selectedId
          : null,
      },
      undoLabel:
        this.labels.get(
          result.workspace.history.entries.at(-1)?.commandId ?? '',
        ) ?? null,
      message: notice ?? 'Last change undone.',
      messageKind: notice ? 'clearance' : 'confirmation',
    });
    return { ok: true };
  }
  beginOperation(): OperationIdentity | null {
    if (!this.canEdit() || !this.state.workspace) return null;
    this.cancelWork();
    const workspace = this.state.workspace;
    const pending = Object.freeze({
      workspaceId: workspace.workspaceId,
      generation: workspace.generation,
      operationId: this.id(),
      roomId: workspace.current.roomId,
      inputRevision: workspace.current.roomRevision,
    });
    this.publish({ pending, message: '' });
    return pending;
  }
  /** Local assistant search seam; the worker returns data and never commits a room/proposal. */
  async findLayout(
    goal: SearchGoal,
    scope: ActionScope,
    seed = 42,
  ): Promise<SearchResult> {
    const token = this.beginOperation();
    if (!token) return emptySearchResult(null, seed, 'cancelled');
    try {
      const { BrowserLayoutSearch } = await import('../layout-search/client');
      if (!this.isCurrent(token))
        return emptySearchResult(token, seed, 'cancelled');
      return await new BrowserLayoutSearch(this).run(token, goal, scope, seed);
    } catch {
      return emptySearchResult(token, seed);
    }
  }
  isCurrent(token: OperationIdentity): boolean {
    if (!this.active() || !this.state.workspace || !this.state.pending)
      return false;
    const pending = this.state.pending;
    return (
      pending.workspaceId === token.workspaceId &&
      pending.generation === token.generation &&
      pending.operationId === token.operationId &&
      pending.roomId === token.roomId &&
      pending.inputRevision === token.inputRevision &&
      this.state.workspace.current.roomRevision === token.inputRevision
    );
  }
  /** Resource ownership is bounded; rejected/stale registration releases immediately. */
  ownResource(
    cleanup: () => void,
    token?: OperationIdentity,
  ): (() => void) | null {
    if (!this.active() || (token && !this.isCurrent(token))) {
      const rejected = new ResourceRegistry(1);
      rejected.own(cleanup);
      rejected.clear();
      return null;
    }
    return (token ? this.operations : this.resources).own(cleanup);
  }
  completeOperation(token: OperationIdentity, accept: () => void): boolean {
    if (!this.isCurrent(token)) return false;
    this.cancelWork();
    const workspace = this.state.workspace;
    if (
      !this.active() ||
      !workspace ||
      workspace.workspaceId !== token.workspaceId ||
      workspace.generation !== token.generation ||
      workspace.current.roomRevision !== token.inputRevision
    )
      return false;
    // No subscriber notification between the identity check and this synchronous write.
    accept();
    this.publish({});
    return true;
  }
}
