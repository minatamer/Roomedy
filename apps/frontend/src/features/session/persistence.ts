import { POLICY } from '@roomedy/contracts/policy';
import type { SessionController } from './controller';
import { readRecovery, recoveryOf, projectMessages } from './project';

export const RECOVERY_KEY = 'roomedy:workspace:v1';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/** One synchronous, bounded per-tab record. No async storage transaction can outlive its identity. */
export class SessionPersistence {
  private live = true;
  private failed = false;
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private unsubscribe: () => void;
  private generation: number;
  private current: object | null = null;
  private baseline: object | null = null;
  private settings: object | null = null;
  private offers: object | null = null;
  private budget: number | null = null;
  private versions: object | null = null;
  private destination = '';
  private view = '';
  private latestWrite: object | null = null;
  constructor(
    readonly session: SessionController,
    private storage: StoragePort | null,
    private now = Date.now,
  ) {
    if (storage) {
      try {
        const text = storage.getItem(RECOVERY_KEY);
        if (text !== null) {
          const read = readRecovery(text, now());
          if (read.ok) session.restore(read.value);
          else {
            storage.removeItem(RECOVERY_KEY);
            if (read.code === 'expired') session.expiredRecovery();
            else
              session.notify(
                'The saved room could not be recovered. Start fresh or import a downloaded project.',
              );
          }
        }
      } catch {
        this.failed = true;
      }
    } else this.failed = true;
    this.generation = session.getSnapshot().generation;
    this.unsubscribe = session.subscribe(() => this.changed());
    session.setPersistence(this.failed ? 'memory-only' : 'checking');
    this.changed();
  }
  private cancelTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
  private clear() {
    this.cancelTimer();
    this.dirty = false;
    this.forgetAccepted();
    try {
      this.storage?.removeItem(RECOVERY_KEY);
    } catch {
      this.failed = true;
      this.session.setPersistence('memory-only');
    }
  }
  private forgetAccepted() {
    this.current =
      this.baseline =
      this.settings =
      this.offers =
      this.versions =
        null;
    this.budget = null;
    this.destination = this.view = '';
  }
  private changed() {
    if (!this.live) return;
    const state = this.session.getSnapshot();
    if (state.generation !== this.generation) {
      this.generation = state.generation;
      this.clear();
    }
    if (state.phase !== 'editor' || !state.workspace) {
      if (
        state.phase === 'expired' ||
        state.phase === 'disposed' ||
        state.phase === 'entry'
      )
        this.clear();
      return;
    }
    if (this.failed) {
      this.session.setPersistence('memory-only');
      return;
    }
    if (
      this.current === state.workspace.current &&
      this.baseline === state.workspace.baseline &&
      this.settings === (state.cost?.settings ?? null) &&
      this.offers === (state.cost?.offers ?? null) &&
      this.budget === (state.cost?.budgetMinor ?? null) &&
      this.versions === state.estimateVersions &&
      this.destination === state.destination &&
      this.view === state.presentation.roomView
    )
      return;
    this.current = state.workspace.current;
    this.baseline = state.workspace.baseline;
    this.settings = state.cost?.settings ?? null;
    this.offers = state.cost?.offers ?? null;
    this.budget = state.cost?.budgetMinor ?? null;
    this.versions = state.estimateVersions;
    this.destination = state.destination;
    this.view = state.presentation.roomView;
    this.dirty = true;
    this.cancelTimer();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.flush();
    }, 250);
  }
  flush(): boolean {
    this.cancelTimer();
    if (
      !this.live ||
      this.failed ||
      !this.storage ||
      !this.session.checkExpiry()
    )
      return false;
    if (!this.dirty) return true;
    const state = this.session.getSnapshot(),
      record = recoveryOf(state);
    if (!record || state.expiresAt <= this.now()) {
      this.clear();
      if (state.phase === 'editor' && state.expiresAt > this.now()) {
        this.failed = true;
        this.session.setPersistence('memory-only');
        this.session.notify(projectMessages['too-large']);
      }
      return false;
    }
    const text = JSON.stringify(record);
    if (new TextEncoder().encode(text).byteLength > POLICY.projectBytes) {
      this.failed = true;
      this.clear();
      this.session.setPersistence('memory-only');
      this.session.notify(projectMessages['too-large']);
      return false;
    }
    const generation = state.generation,
      workspaceId = state.workspace!.workspaceId,
      write = {};
    this.latestWrite = write;
    this.dirty = false;
    try {
      this.storage.setItem(RECOVERY_KEY, text);
      const latest = this.session.getSnapshot();
      if (this.latestWrite !== write) return false;
      if (
        latest.generation !== generation ||
        latest.workspace?.workspaceId !== workspaceId ||
        latest.workspace?.current !== state.workspace?.current ||
        latest.cost?.settings !== state.cost?.settings ||
        latest.cost?.offers !== state.cost?.offers ||
        latest.cost?.budgetMinor !== state.cost?.budgetMinor ||
        latest.estimateVersions !== state.estimateVersions ||
        latest.destination !== state.destination ||
        latest.phase !== 'editor' ||
        latest.expiresAt <= this.now()
      ) {
        // Never erase a newer record written during an injected reentrant storage callback.
        if (
          this.latestWrite === write &&
          this.storage.getItem(RECOVERY_KEY) === text
        )
          this.storage.removeItem(RECOVERY_KEY);
        return false;
      }
      this.session.setPersistence('saved');
      return true;
    } catch {
      if (
        this.latestWrite !== write ||
        this.session.getSnapshot().generation !== generation ||
        this.session.getSnapshot().workspace?.workspaceId !== workspaceId
      )
        return false;
      this.failed = true;
      try {
        this.storage.removeItem(RECOVERY_KEY);
      } catch {
        /* Browser may also deny removal; expiry remains fixed. */
      }
      this.session.setPersistence('memory-only');
      return false;
    }
  }
  dispose() {
    if (!this.live) return;
    this.live = false;
    this.cancelTimer();
    this.unsubscribe();
    this.forgetAccepted();
  }
}
