import { useCallback, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import type { SessionController } from '../session/controller';
import type { CostSection } from './journey';
import type { MarketTarget, MarketUpdate } from './market-research';
import type { ProductGuide } from './selection-guide';
import {
  costUIOf,
  estimateConversationOf,
  restoredCostUI,
} from '../session/conversations';
export const INITIAL_PRODUCT_GUIDE: ProductGuide = Object.freeze({
  stage: 'ready',
  key: null,
});
export interface MarketEntry {
  target: MarketTarget;
  update: MarketUpdate;
  roomRevision: number;
  costRevision: number;
  generation: number;
  workspaceId: string;
}
export interface Conversation {
  viewingId: string | null;
  section: CostSection;
  selected: string | null;
  input: string;
  budget: number | null;
  work: boolean;
  researchAfter: number | null;
  entries: MarketEntry[];
  remaining: MarketTarget[];
  message: string;
  guide: ProductGuide;
}
const initial = (): Conversation => ({
  viewingId: null,
  section: 'welcome',
  selected: null,
  input: '',
  budget: null,
  work: false,
  researchAfter: null,
  entries: [],
  remaining: [],
  message: '',
  guide: INITIAL_PRODUCT_GUIDE,
});
const conversations = new WeakMap<SessionController, CostConversation>();
/** UI state is recovery data only; it never becomes financial or Design AI authority. */
class CostConversation {
  private state = initial();
  private readonly identity: { workspaceId: string; generation: number };
  constructor(private controller: SessionController) {
    const state = controller.getSnapshot();
    this.identity = {
      workspaceId: state.workspace?.workspaceId ?? '',
      generation: state.generation,
    };
    const saved = state.conversations?.estimate?.ui;
    if (saved && state.cost && state.workspace)
      this.state = restoredCostUI(saved, state);
  }
  private listeners = new Set<() => void>();
  private live = true;
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  set<K extends keyof Conversation>(
    key: K,
    next: SetStateAction<Conversation[K]>,
  ) {
    if (!this.live) return;
    let value =
      typeof next === 'function'
        ? (next as (previous: Conversation[K]) => Conversation[K])(
            this.state[key],
          )
        : next;
    if (key === 'entries' || key === 'remaining')
      value = (value as unknown[]).slice(-45) as Conversation[K];
    if (key === 'input' || key === 'message')
      value = String(value).slice(0, 4000) as Conversation[K];
    if (key === 'guide') {
      const guide = value as ProductGuide;
      if (guide.reviewedKeys)
        value = {
          ...guide,
          reviewedKeys: [...new Set(guide.reviewedKeys)].slice(-64),
        } as Conversation[K];
    }
    if (Object.is(value, this.state[key])) return;
    this.state = { ...this.state, [key]: value };
    const session = this.controller.getSnapshot();
    const estimate = estimateConversationOf(session);
    if (estimate)
      this.controller.rememberConversations(
        { estimate: { ...estimate, ui: costUIOf(this.state, session) } },
        this.identity,
      );
    this.listeners.forEach((fn) => fn());
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    this.state = initial();
    this.listeners.forEach((fn) => fn());
    this.listeners.clear();
  }
}
export function costConversation(controller: SessionController) {
  let store = conversations.get(controller);
  if (!store) {
    store = new CostConversation(controller);
    conversations.set(controller, store);
    const owned = store;
    controller.ownResource(() => {
      owned.dispose();
      if (conversations.get(controller) === owned)
        conversations.delete(controller);
    });
  }
  return store;
}
export function useCostConversationState<K extends keyof Conversation>(
  controller: SessionController,
  key: K,
) {
  const store = costConversation(controller),
    read = useCallback(() => store.getSnapshot()[key], [store, key]);
  const value = useSyncExternalStore(store.subscribe, read, read);
  const set = useCallback(
    (next: SetStateAction<Conversation[K]>) => store.set(key, next),
    [store, key],
  );
  return [value, set] as const;
}
