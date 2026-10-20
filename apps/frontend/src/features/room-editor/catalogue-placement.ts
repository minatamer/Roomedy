import type { CatalogueEntry } from '@roomedy/contracts/catalogue';
import type { Furniture } from '@roomedy/contracts/room';
import { DEFAULT_FURNITURE_LOCKS } from '@roomedy/contracts/room';
import { POLICY } from '@roomedy/contracts/policy';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { CommandFailure } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import { snapPosition } from '../plan-view/adapter';
import { beginRoomEdit } from '../room-view/manipulation';
import type { FloorPoint } from '../room-view/manipulation';
import { failureMessage } from './messages';

export function catalogueFurniture(
  entry: CatalogueEntry,
  size: { width: number; depth: number; height?: number },
  pose: Pick<Furniture['pose'], 'centerX' | 'centerZ' | 'quarterTurns'>,
  id: string = crypto.randomUUID(),
): Furniture {
  const estimated = (value: number) => ({
    value,
    status: 'estimated' as const,
    sourceId: 'visitor-estimate',
  });
  return {
    id,
    label: entry.label,
    catalogueId: entry.id,
    catalogueVersion: entry.version,
    dimensions: {
      width: estimated(size.width),
      depth: estimated(size.depth),
      height: estimated(size.height ?? entry.size.height.default),
    },
    pose: {
      ...pose,
      provenance: { status: 'planned', sourceId: 'visitor-plan' },
    },
    ownership: 'proposed',
    preference: 'flexible',
    locks: { ...DEFAULT_FURNITURE_LOCKS },
    finish: entry.finishes[0]!,
  };
}
export interface CataloguePlacementSnapshot {
  entry: CatalogueEntry;
  item: Furniture;
  inside: boolean;
  valid: boolean;
  error: string;
}
export interface PlacementTarget {
  element: SVGSVGElement | HTMLCanvasElement;
  point: (client: { x: number; y: number }) => FloorPoint | null;
}
/** Only an uncommitted piece/pose. SessionController remains the room/command authority. */
export class CataloguePlacement {
  private state: CataloguePlacementSnapshot | null = null;
  private edit: ReturnType<typeof beginRoomEdit> = null;
  private failure: CommandFailure | null = null;
  private target: PlacementTarget | null = null;
  private lastPose = '';
  private readonly listeners = new Set<() => void>();
  constructor(
    readonly session: SessionController,
    private readonly id: () => string = () => crypto.randomUUID(),
  ) {}
  getSnapshot = () => this.state;
  getEntry = () => this.state?.entry ?? null;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(value: CataloguePlacementSnapshot | null) {
    if (value === this.state) return;
    this.state = value;
    for (const listener of this.listeners) listener();
  }
  private retire = () => {
    this.edit = null;
    this.failure = null;
    this.lastPose = '';
    this.publish(null);
  };
  cancel = () => {
    const edit = this.edit;
    this.edit = null;
    edit?.cancel();
    this.retire();
  };
  registerTarget(target: PlacementTarget) {
    this.target = target;
    return () => {
      if (this.target === target) {
        this.target = null;
        this.cancel();
      }
    };
  }
  locate(client: { x: number; y: number }) {
    const target = this.target;
    if (!target?.element.isConnected) return null;
    const rect = target.element.getBoundingClientRect();
    return rect.width > 0 &&
      rect.height > 0 &&
      client.x >= rect.left &&
      client.x <= rect.right &&
      client.y >= rect.top &&
      client.y <= rect.bottom
      ? target.point(client)
      : null;
  }
  focusTarget() {
    const target = this.target;
    target?.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => {
      if (this.target === target && this.state)
        target?.element.focus({ preventScroll: true });
    });
  }
  ready() {
    return !!this.target?.element.isConnected;
  }
  targetElement() {
    return this.target?.element ?? null;
  }
  start(entry: CatalogueEntry, inside = true) {
    this.cancel();
    const snapshot = this.session.getSnapshot(),
      canonical = findCatalogueEntry(entry.id, entry.version);
    if (!canonical || snapshot.candidate) return false;
    const edit = beginRoomEdit(
      this.session,
      snapshot.presentation.selectedId,
      this.retire,
    );
    if (!edit) return false;
    this.edit = edit;
    const item = catalogueFurniture(
      canonical,
      {
        width: canonical.size.width.default,
        depth: canonical.size.depth.default,
      },
      {
        centerX: (edit.room.room.width.value ?? 4200) / 2,
        centerZ: (edit.room.room.depth.value ?? 4800) / 2,
        quarterTurns: 0,
      },
      this.id(),
    );
    this.publish({
      entry: canonical,
      item,
      inside: false,
      valid: false,
      error: '',
    });
    this.move({ x: item.pose.centerX, z: item.pose.centerZ }, inside);
    return true;
  }
  move(
    point: FloorPoint | null,
    inside = true,
    snap = this.session.getSnapshot().presentation.snap,
  ) {
    const state = this.state,
      edit = this.edit;
    if (!state || !edit?.current()) {
      this.cancel();
      return;
    }
    if (
      !point ||
      ![point.x, point.z].every(
        (n) => Number.isFinite(n) && Math.abs(n) <= POLICY.coordinateAbsMm,
      )
    ) {
      this.lastPose = '';
      if (state.inside) this.publish({ ...state, inside: false });
      return;
    }
    const snapped = snapPosition(edit.room, state.item, point, snap);
    const key = `${snapped.x}:${snapped.z}:${state.item.pose.quarterTurns}:${inside}`;
    if (key === this.lastPose) return;
    this.lastPose = key;
    const item = {
      ...state.item,
      pose: { ...state.item.pose, centerX: snapped.x, centerZ: snapped.z },
    };
    const result = this.session.previewVisitor([
      { type: 'add', furniture: item },
    ]);
    this.failure = result.ok ? null : result;
    this.publish({
      ...state,
      item,
      inside,
      valid: result.ok,
      error: result.ok ? '' : failureMessage(result, edit.room),
    });
  }
  rotate() {
    const state = this.state;
    if (!state) return;
    this.publish({
      ...state,
      item: {
        ...state.item,
        pose: {
          ...state.item.pose,
          quarterTurns: ((state.item.pose.quarterTurns + 1) % 4) as
            0 | 1 | 2 | 3,
        },
      },
    });
    this.move({ x: state.item.pose.centerX, z: state.item.pose.centerZ });
  }
  commit(): ReturnType<SessionController['dispatch']> {
    const state = this.state,
      edit = this.edit;
    if (!state || !edit?.current()) {
      this.cancel();
      return { ok: false, code: 'stale' };
    }
    if (!state.inside) {
      this.cancel();
      return { ok: false, code: 'invalid-input' };
    }
    if (!state.valid)
      return this.failure ?? { ok: false, code: 'invalid-input' };
    if (!edit.finish()) return { ok: false, code: 'stale' };
    const result = this.session.dispatch(
      [{ type: 'add', furniture: state.item }],
      'Add piece',
    );
    if (result.ok) {
      this.session.select(state.item.id);
      this.session.setPanel('inspector');
    } else
      this.session.notify(
        failureMessage(result, this.session.getSnapshot().workspace?.current),
      );
    return result;
  }
  dispose() {
    this.cancel();
    this.target = null;
    this.listeners.clear();
  }
}
