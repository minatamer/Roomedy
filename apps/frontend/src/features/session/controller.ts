import {
  createCostDraft,
  reconcileCost,
  validatedCost,
  pricingState,
  money,
  hasChosenPrices,
} from '../cost/state';
import {
  estimateStateSchema,
  selectedTakeoffSchema,
} from '@roomedy/contracts/estimates';
import { idSchema } from '@roomedy/contracts/primitives';
import type { EstimateState } from '@roomedy/contracts/estimates';
import { productChoicesSchema } from '@roomedy/contracts/estimates';
import type { ProductChoice } from '@roomedy/contracts/estimates';
import {
  allProductsChosen,
  currentProductChoices,
  productChoiceScope,
  choiceOfferActive,
} from '../cost/product-choices';
import { marketTargets, marketTargetForKey } from '../cost/market-research';
import { selectedPriceInputs } from '../cost/listed-prices';
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
  FurnitureRefinement,
} from '@roomedy/spatial';
import { ResourceRegistry } from './effects';
import { initialPresentation } from './state';
import type { Panel, PhotoNotes, SessionSnapshot } from './state';
import { recoverySchema } from '@roomedy/contracts/project';
import { ESTIMATE_VERSION_LIMIT } from '@roomedy/contracts/project';
import type {
  EstimateVersion,
  Recovery,
  RecoveryConversations,
} from '@roomedy/contracts/project';
import { continuedConversations, restoredCostMessages } from './conversations';
import { validateProject, projectOf } from './project';
import { captureVersion, freezeVersion } from '../cost/versions';
import { clearanceNotice } from './clearance';
import { changeShoppingLocality, shoppingLocality } from '../cost/journey';
import { shoppingCountry } from '../cost/shopping-countries';
import { MessageReveal } from '../assistant/message-reveal';
import { appendInspectorEdits } from './inspector-draft';

interface Dependencies {
  now?: () => number;
  id?: () => string;
}
interface AssistantPreview {
  token: OperationIdentity;
  command: CommandEnvelope;
  scope: ActionScope | undefined;
  authority: 'assistant' | 'visitor';
  refinements?: FurnitureRefinement[];
  label: string;
}
export class SessionController {
  readonly costReveal = new MessageReveal();
  private costMessageId = 0;
  private lastChoiceCompletion = '';
  private lastGuideCompletion = '';
  private lastPriceRepair = '';
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
    inspector?: boolean;
    edits?: VisitorAction[][];
  } | null = null;

  constructor(room?: RoomDocument, dependencies: Dependencies = {}) {
    this.now = dependencies.now ?? Date.now;
    this.id = dependencies.id ?? (() => crypto.randomUUID());
    const createdAt = this.now();
    this.state = Object.freeze({
      phase: room ? 'editor' : 'entry',
      tourOffered: false,
      destination: 'design',
      cost: null,
      shoppingLocation: null,
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
  rememberConversations(
    value: Partial<RecoveryConversations>,
    identity: { workspaceId: string; generation: number },
  ): boolean {
    const state = this.state;
    if (
      !this.active() ||
      this.cleaning ||
      !state.workspace ||
      state.workspace.workspaceId !== identity.workspaceId ||
      state.generation !== identity.generation
    )
      return false;
    this.publish({ conversations: { ...state.conversations, ...value } });
    return true;
  }
  markTourOffered() {
    if (this.active() && this.state.workspace && !this.state.tourOffered)
      this.publish({ tourOffered: true });
  }
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
      ...(change.generation !== undefined ? { conversations: undefined } : {}),
      ...(change.generation !== undefined || change.cost === null
        ? { shoppingLocation: null }
        : {}),
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
    const inspectorReset =
      this.state.candidate?.source === 'inspector'
        ? ((this.state.inspectorReset ?? 0) + 1) % 1_000_000
        : (this.state.inspectorReset ?? 0);
    this.costPreview = null;
    this.visitorPreview = null;
    this.assistantPreview = null;
    this.lastAssistant = null;
    this.state = Object.freeze({
      ...this.state,
      inspectorReset,
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
    this.costReveal.clear();
    // Fence identity and accepted semantics BEFORE aborting/revoking resources.
    this.state = Object.freeze({
      ...this.state,
      phase,
      conversations: undefined,
      destination: 'design',
      cost: null,
      shoppingLocation: null,
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
      conversations?: RecoveryConversations | undefined;
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
    const conversations = continuedConversations(
      options?.conversations,
      room?.roomRevision ?? 0,
      workspace?.current.roomRevision ?? 0,
    );
    this.costReveal.clear();
    this.state = Object.freeze({
      ...this.state,
      generation,
      workspace,
      conversations,
      tourOffered:
        this.state.tourOffered || !!options?.conversations?.medy?.tourSeen,
      shoppingLocation: null,
      pending: null,
      candidate: null,
      phase: room ? 'editor' : 'entry',
      destination: options?.destination ?? 'design',
      cost:
        room && options?.cost
          ? {
              ...structuredClone(options.cost),
              revision: 0,
              roomRevision: workspace!.current.roomRevision,
              messages: conversations?.estimate
                ? restoredCostMessages(
                    conversations.estimate,
                    workspace!.current.roomRevision,
                    0,
                  )
                : [],
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
    this.costMessageId = Math.max(
      0,
      ...(this.state.cost?.messages ?? []).map((message) => message.id ?? 0),
    );
    this.costReveal.complete(
      (this.state.cost?.messages ?? []).map((message) => message.id!),
    );
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
      conversations: record.conversations,
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
  setDestination(destination: ProjectDestination, locale?: string): boolean {
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
      cost:
        this.state.cost ??
        createCostDraft(this.state.workspace.current, locale),
    });
    return true;
  }
  updateCost(
    settings: unknown,
    offers: unknown = this.state.cost?.offers,
  ): boolean {
    const parsed = estimateStateSchema.shape.settings.safeParse(settings);
    if (
      !parsed.success ||
      (parsed.data.selectedPrices &&
        JSON.stringify(parsed.data.selectedPrices) !==
          JSON.stringify(this.state.cost?.settings.selectedPrices ?? []))
    )
      return false;
    if (this.state.cost?.settings.selectedPrices)
      parsed.data.selectedPrices = structuredClone(
        this.state.cost.settings.selectedPrices,
      );
    return this.writeCost(parsed.data, offers, this.state.cost?.productChoices);
  }
  /** Only the explicit product action can author these preferences. */
  chooseCostProduct(
    settings: unknown,
    offers: unknown,
    input: unknown,
    costRevision: number,
    roomRevision: number,
    announceCompletion = true,
  ) {
    return this.chooseCostProducts(
      settings,
      offers,
      [input],
      costRevision,
      roomRevision,
      announceCompletion,
    );
  }
  /** One explicit visitor action, one validated financial transaction and Undo. */
  chooseCostProducts(
    settings: unknown,
    offers: unknown,
    input: unknown,
    costRevision: number,
    roomRevision: number,
    announceCompletion = true,
  ) {
    const state = this.state;
    if (
      !this.canEdit() ||
      !state.workspace ||
      !state.cost ||
      state.destination !== 'cost' ||
      state.pending ||
      state.candidate ||
      state.cost.revision !== costRevision ||
      state.workspace.current.roomRevision !== roomRevision
    )
      return false;
    const parsed = productChoicesSchema.safeParse(input);
    if (
      !parsed.success ||
      !parsed.data.length ||
      parsed.data.some(
        (choice) =>
          choice.scope !==
          productChoiceScope(state.workspace!.current, state.cost!, choice.key),
      )
    )
      return false;
    if (
      parsed.data.every(
        (choice) =>
          JSON.stringify(
            state.cost!.productChoices?.find((item) => item.key === choice.key),
          ) === JSON.stringify(choice),
      )
    )
      return true;
    if (!allProductsChosen(state.workspace.current, state.cost))
      this.lastChoiceCompletion = '';
    const keys = new Set(
      marketTargets(state.workspace.current).map((target) => target.key),
    );
    const replaced = new Set(parsed.data.map((choice) => choice.key));
    const choices = [
      ...(state.cost.productChoices ?? []).filter(
        (item) => !replaced.has(item.key) && keys.has(item.key),
      ),
      ...parsed.data,
    ];
    if (!this.writeCost(settings, offers, choices)) return false;
    if (announceCompletion) this.announceChosenProducts();
    return true;
  }
  completeProductChoices(passId: number) {
    const state = this.state;
    if (
      !Number.isSafeInteger(passId) ||
      passId < 1 ||
      !this.canEdit() ||
      state.destination !== 'cost' ||
      state.pending ||
      state.candidate ||
      !state.workspace ||
      !state.cost ||
      !allProductsChosen(state.workspace.current, state.cost)
    )
      return false;
    const key = JSON.stringify([
      state.generation,
      state.workspace.workspaceId,
      passId,
    ]);
    if (key === this.lastGuideCompletion) return false;
    if (!this.announceChosenProducts(true)) return false;
    this.lastGuideCompletion = key;
    return true;
  }
  private announceChosenProducts(force = false) {
    const current = this.state;
    if (
      current.workspace &&
      current.cost &&
      allProductsChosen(current.workspace.current, current.cost)
    ) {
      const key = JSON.stringify([
        current.generation,
        current.workspace.workspaceId,
        current.cost.revision,
        currentProductChoices(current.workspace.current, current.cost),
      ]);
      if (force || key !== this.lastChoiceCompletion) {
        if (this.postCostBreakdown(true)) {
          this.lastChoiceCompletion = key;
          return true;
        }
      }
    }
    return false;
  }
  private writeCost(
    settings: unknown,
    offers: unknown,
    productChoices?: ProductChoice[],
  ): boolean {
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.candidate
    )
      return false;
    const parsed = estimateStateSchema.shape.settings.safeParse(settings);
    if (!parsed.success) return false;
    const prices = selectedPriceInputs(this.state.workspace.current, {
      settings: parsed.data,
      offers: [],
      budgetMinor: null,
      ...(productChoices ? { productChoices } : {}),
    });
    if (prices.length) parsed.data.selectedPrices = prices;
    else delete parsed.data.selectedPrices;
    const cost = validatedCost(
      this.state.workspace.current,
      parsed.data,
      offers,
    );
    if (!cost) {
      this.notify(
        'Review the estimate units, products and currency before applying.',
      );
      return false;
    }
    const pricing = {
      ...pricingState(cost),
      ...(productChoices?.length
        ? { productChoices: structuredClone(productChoices) }
        : {}),
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
  /** Upgrade an existing working selection once; saved snapshots remain immutable. */
  repairSelectedPrices() {
    const state = this.state;
    if (
      !state.cost ||
      !state.workspace ||
      state.destination !== 'cost' ||
      state.pending ||
      state.candidate
    )
      return false;
    const repairKey = JSON.stringify([
      state.generation,
      state.workspace.workspaceId,
      state.cost.productChoices,
      'whole-room-takeoff-2',
    ]);
    if (repairKey === this.lastPriceRepair) return false;
    const prices = selectedPriceInputs(state.workspace.current, state.cost);
    const settings = structuredClone(state.cost.settings);
    for (const choice of currentProductChoices(
      state.workspace.current,
      state.cost,
    )) {
      if (
        !choice.offerId ||
        !choiceOfferActive(choice, state.cost) ||
        !marketTargetForKey(state.workspace.current, choice.key)
          ?.matchingWalls ||
        !state.cost.offers.some(
          (offer) =>
            offer.id === choice.offerId &&
            offer.kind === 'paint' &&
            offer.source.url === choice.url,
        )
      )
        continue;
      for (const wall of settings.walls) {
        if (
          wall.enabled &&
          wall.paintOfferId === null &&
          marketTargetForKey(state.workspace.current, `surface:${wall.wall}`)
            ?.key === choice.key
        )
          wall.paintOfferId = choice.offerId;
      }
    }
    if (
      JSON.stringify(prices) ===
        JSON.stringify(state.cost.settings.selectedPrices ?? []) &&
      JSON.stringify(settings) === JSON.stringify(state.cost.settings)
    )
      return false;
    if (!this.writeCost(settings, state.cost.offers, state.cost.productChoices))
      return false;
    this.lastPriceRepair = repairKey;
    this.announceChosenProducts();
    return true;
  }
  setSelectedQuantity(key: string, quantity: number, revision: number) {
    const state = this.state;
    if (
      !state.cost ||
      !state.workspace ||
      state.destination !== 'cost' ||
      state.pending ||
      state.candidate ||
      state.cost.revision !== revision ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100_000
    )
      return false;
    const settings = structuredClone(state.cost.settings);
    const price = settings.selectedPrices?.find((price) => price.key === key);
    if (
      !price ||
      price.unit === 'm2' ||
      price.targets.some((target) => target.kind === 'furniture')
    )
      return false;
    price.quantity = quantity;
    price.quantityConfirmed = true;
    if (price.takeoff) price.takeoff.mode = 'manual';
    if (!this.writeCost(settings, state.cost.offers, state.cost.productChoices))
      return false;
    this.announceChosenProducts();
    return true;
  }
  setSelectedTakeoff(
    key: string,
    updates: { coverageMm2?: number; volumeMl?: number; automatic?: boolean },
    revision: number,
  ) {
    const state = this.state;
    if (
      !state.cost ||
      !state.workspace ||
      state.destination !== 'cost' ||
      state.pending ||
      state.candidate ||
      state.cost.revision !== revision
    )
      return false;
    const settings = structuredClone(state.cost.settings),
      price = settings.selectedPrices?.find((price) => price.key === key);
    if (!price?.takeoff) return false;
    const takeoff = price.takeoff;
    if (updates.coverageMm2 !== undefined) {
      if (takeoff.kind === 'floor') takeoff.coverageMm2 = updates.coverageMm2;
      else takeoff.coverageMm2PerLitre = updates.coverageMm2;
      takeoff.coverageSource = 'visitor';
    }
    if (updates.volumeMl !== undefined) {
      if (takeoff.kind !== 'paint') return false;
      takeoff.volumeMl = updates.volumeMl;
      takeoff.volumeSource = 'visitor';
    }
    if (updates.automatic) {
      takeoff.mode = 'automatic';
      price.quantityConfirmed = false;
    }
    if (!selectedTakeoffSchema.safeParse(takeoff).success) return false;
    if (!this.writeCost(settings, state.cost.offers, state.cost.productChoices))
      return false;
    this.announceChosenProducts();
    return true;
  }
  chooseShoppingLocation(
    country: string,
    method: 'browser' | 'skip' | 'chat' | 'manual',
    generation: number,
    costRevision: number,
    shoppingLabel?: string,
  ): boolean {
    if (
      !this.canEdit() ||
      !this.state.cost ||
      this.state.pending ||
      this.state.destination !== 'cost' ||
      this.state.candidate ||
      this.state.generation !== generation ||
      this.state.cost.revision !== costRevision ||
      this.state.cost.settings.locality.currency !== 'USD' ||
      !/^[A-Z]{2}$/.test(country) ||
      (method === 'manual' && !shoppingCountry(country)) ||
      (shoppingLabel !== undefined &&
        (method !== 'chat' ||
          !shoppingLabel.trim() ||
          shoppingLabel.length > 80)) ||
      (method === 'skip' ? country !== 'ZZ' : country === 'ZZ')
    )
      return false;
    const locality = shoppingLocality(country);
    if (shoppingLabel !== undefined) locality.city = shoppingLabel;
    const existing = this.state.cost.settings.locality;
    if (
      existing.country !== locality.country ||
      existing.city !== locality.city ||
      existing.currency !== locality.currency
    ) {
      const changed = changeShoppingLocality(this.state.cost, locality);
      if (!this.updateCost(changed.settings, changed.offers)) return false;
    }
    this.publish({ shoppingLocation: { country, method } });
    return true;
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
    // Product preferences are visitor-owned; a pricing proposal cannot add/change them.
    if (
      parsed.data.settings.selectedPrices &&
      JSON.stringify(parsed.data.settings.selectedPrices) !==
        JSON.stringify(this.state.cost.settings.selectedPrices ?? [])
    )
      return { ok: false, code: 'invalid-input' };
    if (this.state.cost.settings.selectedPrices)
      parsed.data.settings.selectedPrices = structuredClone(
        this.state.cost.settings.selectedPrices,
      );
    if (
      parsed.data.productChoices &&
      JSON.stringify(parsed.data.productChoices) !==
        JSON.stringify(this.state.cost.productChoices ?? [])
    )
      return { ok: false, code: 'invalid-input' };
    if (this.state.cost.productChoices)
      parsed.data.productChoices = structuredClone(
        this.state.cost.productChoices,
      );
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
    if (parsed.data.settings.selectedPrices)
      parsed.data.settings.selectedPrices = selectedPriceInputs(
        room,
        parsed.data,
      );
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
    // An explicit fit-and-price Apply can rebind the same already chosen product
    // to its newly accepted dimensions. Ordinary design changes cannot do this.
    const priorChoices = currentProductChoices(
      this.state.workspace.current,
      this.state.cost,
    );
    let reboundChoice = false;
    if (preview.pricing.productChoices)
      preview.pricing.productChoices = preview.pricing.productChoices.map(
        (choice) => {
          if (
            priorChoices.some(
              (prior) => JSON.stringify(prior) === JSON.stringify(choice),
            ) &&
            !choiceOfferActive(choice, this.state.cost!) &&
            choiceOfferActive(choice, preview.pricing)
          ) {
            const scope = productChoiceScope(room, preview.pricing, choice.key);
            if (scope) {
              reboundChoice = true;
              return { ...choice, scope };
            }
          }
          return choice;
        },
      );
    if (preview.pricing.settings.selectedPrices)
      preview.pricing.settings.selectedPrices = selectedPriceInputs(
        room,
        preview.pricing,
      );
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
    const committed = this.commitCommand(
      { commandId },
      preview.label,
      result,
      preview.pricing,
    );
    if (committed.ok && reboundChoice) this.announceChosenProducts();
    return committed;
  }
  costMessage(role: 'visitor' | 'assistant', text: string, lineIds?: string[]) {
    return this.appendCostMessage(role, text, lineIds);
  }
  /** Local calculation reply; provider mode never changes this command. */
  costBreakdown() {
    return this.postCostBreakdown(false);
  }
  private postCostBreakdown(completed: boolean) {
    if (
      !this.active() ||
      this.state.destination !== 'cost' ||
      this.state.candidate ||
      !this.state.workspace ||
      !this.state.cost ||
      this.state.cost.settings.locality.currency !== 'USD' ||
      this.state.cost.roomRevision !== this.state.workspace.current.roomRevision
    )
      return false;
    const result = calculateRoomEstimate(
      this.state.workspace.current,
      this.state.cost.settings,
      this.state.cost.offers,
    );
    if (!result.ok) return false;
    const estimate = result.estimate;
    if (
      !completed &&
      !hasChosenPrices(estimate, this.state.cost.offers) &&
      !currentProductChoices(this.state.workspace.current, this.state.cost)
        .length
    )
      return this.appendCostMessage(
        'assistant',
        'Let’s find options for your furniture, flooring and walls first. Choose products and use their prices, then I can put your estimate together.',
        undefined,
        'find-options',
      );
    return this.appendCostMessage(
      'assistant',
      completed
        ? `All ${currentProductChoices(this.state.workspace.current, this.state.cost).length} products are selected. Known subtotal: ${money(estimate.knownTotalMinor, 'USD')}. Review your choices below, or export your room.`
        : `Here’s your cost breakdown: ${money(estimate.knownTotalMinor, 'USD')} ${estimate.complete ? 'planning total' : 'known subtotal'}.${estimate.unpricedCount ? ' Choose products for the items that still need a price.' : ''}${estimate.lines.some((line) => line.pricing === 'listed') ? ' Listed prices are included provisionally; review quantities, coverage and fit before exporting.' : ''} Open an item for its quantities and sources.`,
      undefined,
      completed ? 'selection-summary' : 'breakdown',
    );
  }
  private appendCostMessage(
    role: 'visitor' | 'assistant',
    text: string,
    lineIds?: string[],
    kind?: 'breakdown' | 'find-options' | 'selection-summary',
  ) {
    if (
      !this.active() ||
      !this.state.cost ||
      this.state.destination !== 'cost' ||
      this.costMessageId >= Number.MAX_SAFE_INTEGER - 1 ||
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
        id: ++this.costMessageId,
        role,
        text: text.trim(),
        ...(kind && role === 'assistant' ? { kind } : {}),
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
    this.costReveal.retain(
      messages.map((message, index) => message.id ?? -index - 1),
    );
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
    if (
      this.state.candidate?.source === 'inspector' &&
      (panel === 'assistant' || panel === 'catalogue')
    ) {
      this.notify('Apply or reset your changes before opening another task.');
      return;
    }
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
        snap: true,
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
  previewInspector(
    actions: VisitorAction[],
    label: string,
  ): { ok: true; changed: boolean } | CommandFailure {
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      this.state.destination !== 'design' ||
      (this.state.candidate && this.state.candidate.source !== 'inspector')
    )
      return { ok: false, code: 'stale' };
    const existing = this.visitorPreview?.inspector
      ? this.visitorPreview
      : null;
    if (existing && !this.isCurrent(existing.token))
      return { ok: false, code: 'stale' };
    const batches = appendInspectorEdits(
      existing ? [existing.actions, ...(existing.edits ?? [])] : [],
      actions,
    );
    if (!batches.length || batches.length > POLICY.actions * POLICY.actions)
      return { ok: false, code: 'capacity' };
    const first = batches[0]!;
    const edits = batches.slice(1);
    const evaluated = prepareCommand(
      this.state.workspace,
      this.envelope(first),
      'visitor',
      undefined,
      [],
      edits,
    );
    if (!evaluated.ok) return evaluated;
    if (!evaluated.changed) {
      if (existing) this.resetInspectorChanges();
      return { ok: true, changed: false };
    }
    const token = existing?.token ?? this.beginOperation();
    if (!token) return { ok: false, code: 'stale' };
    this.visitorPreview = {
      token,
      actions: first,
      edits,
      label: 'Update room settings',
      inspector: true,
    };
    this.publish({
      candidate: {
        identity: token,
        source: 'inspector',
        room: evaluated.room,
        checks: evaluated.checks,
        label,
      },
      message: 'Previewing changes. Apply changes to save.',
      messageKind: 'confirmation',
    });
    return { ok: true, changed: true };
  }
  applyInspectorChanges(): { ok: true; changed: boolean } | CommandFailure {
    const preview = this.visitorPreview;
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      this.state.candidate?.source !== 'inspector' ||
      !preview?.inspector ||
      !this.isCurrent(preview.token)
    )
      return { ok: false, code: 'stale' };
    const command = this.envelope(preview.actions);
    const result = applyCommand(
      this.state.workspace,
      command,
      'visitor',
      undefined,
      this.state.cost ? pricingState(this.state.cost) : undefined,
      [],
      preview.edits,
    );
    return this.commitCommand(command, preview.label, result);
  }
  resetInspectorChanges() {
    if (
      !this.active() ||
      (this.state.candidate && this.state.candidate.source !== 'inspector')
    )
      return;
    const hadDraft = this.state.candidate?.source === 'inspector';
    if (hadDraft) this.cancelWork();
    this.publish({
      inspectorReset: hadDraft
        ? (this.state.inspectorReset ?? 0)
        : ((this.state.inspectorReset ?? 0) + 1) % 1_000_000,
      message: 'Changes reset to the last applied design.',
      messageKind: 'confirmation',
    });
  }
  prepareVisitorPreview(
    actions: VisitorAction[],
    label: string,
  ): { ok: true } | { ok: false; code: string } {
    if (this.state.candidate?.source === 'inspector')
      return { ok: false, code: 'stale' };
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
      candidate: {
        identity: token,
        room: result.room,
        checks: result.checks,
        label,
      },
      message: 'Preview ready. Apply or cancel the appearance change.',
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
    const selected = this.state.presentation.selectedId;
    const remains =
      this.state.workspace &&
      [
        ...this.state.workspace.current.furniture,
        ...this.state.workspace.current.room.features,
      ].some((item) => item.id === selected);
    this.publish({
      presentation: {
        ...this.state.presentation,
        selectedId: remains ? selected : null,
      },
      message: 'Preview cancelled.',
    });
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
    if (this.state.candidate?.source === 'inspector')
      return { ok: false, code: 'stale' };
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
  /** Furniture form clicks refine the pending preview, never the accepted room. */
  refineAssistantFurniture(
    id: string,
    actions: VisitorAction[],
    operationId: string,
  ): { ok: true; changed: boolean } | CommandFailure {
    const preview = this.assistantPreview,
      candidate = this.state.candidate;
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !preview ||
      candidate?.source !== 'assistant' ||
      candidate.identity.operationId !== operationId ||
      !this.isCurrent(preview.token)
    )
      return { ok: false, code: 'stale' };
    const refinements = structuredClone(preview.refinements ?? []);
    const last = refinements.at(-1);
    if (last?.id === id) {
      const merged = appendInspectorEdits([last.actions], actions);
      if (merged.length === 1) last.actions = merged[0]!;
      else refinements.push({ id, actions: structuredClone(actions) });
    } else refinements.push({ id, actions: structuredClone(actions) });
    const evaluated = prepareCommand(
      this.state.workspace,
      preview.command,
      preview.authority,
      preview.scope,
      refinements,
    );
    if (!evaluated.ok) return evaluated;
    if (JSON.stringify(evaluated.room) === JSON.stringify(candidate.room))
      return { ok: true, changed: false };
    preview.refinements = refinements;
    preview.label = 'Edited room design';
    this.publish({
      candidate: {
        ...candidate,
        label: preview.label,
        room: evaluated.room,
        checks: evaluated.checks,
      },
      message:
        'Preview updated. Apply changes to keep it, or Cancel to discard.',
    });
    return { ok: true, changed: true };
  }
  resetAssistantRefinements(): { ok: true; changed: boolean } | CommandFailure {
    const preview = this.assistantPreview;
    if (
      !this.canEdit() ||
      !this.state.workspace ||
      !preview ||
      this.state.candidate?.source !== 'assistant' ||
      !this.isCurrent(preview.token)
    )
      return { ok: false, code: 'stale' };
    const result = prepareCommand(
      this.state.workspace,
      preview.command,
      preview.authority,
      preview.scope,
    );
    if (!result.ok) return result;
    preview.refinements = [];
    this.publish({
      candidate: {
        ...this.state.candidate,
        room: result.room,
        checks: result.checks,
      },
      inspectorReset: ((this.state.inspectorReset ?? 0) + 1) % 1_000_000,
      message: 'Manual changes reset to the original proposal.',
      messageKind: 'confirmation',
    });
    return { ok: true, changed: result.changed };
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
      preview.refinements,
    );
    if (result.ok && result.status === 'unchanged' && this.assistantPreview)
      this.cancelWork();
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
    if (this.state.candidate?.source === 'inspector') {
      if (!this.canEdit()) return { ok: false, code: 'stale' };
      this.resetInspectorChanges();
      return { ok: true };
    }
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
    if (this.state.candidate?.source === 'inspector') {
      this.notify('Apply or reset your changes before starting another task.');
      return null;
    }
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
