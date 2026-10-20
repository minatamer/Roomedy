import type { OperationIdentity } from '@roomedy/contracts/commands';
import type { CheckFacts, RoomDocument } from '@roomedy/contracts/room';
import type { CommandWorkspace } from '@roomedy/spatial';

export type SessionPhase =
  'entry' | 'intake' | 'editor' | 'expired' | 'disposed';
export type Panel =
  'inventory' | 'inspector' | 'catalogue' | 'room' | 'checks' | 'assistant';
export interface Presentation {
  readonly selectedId: string | null;
  readonly panel: Panel;
  readonly zoom: number;
  readonly panX: number;
  readonly panZ: number;
  readonly snap: boolean;
  readonly roomView: 'plan' | 'cutaway';
}
/** A renderer projection is never an independently editable room. */
export interface CandidateProjection {
  readonly identity: OperationIdentity;
  readonly source?: 'visitor' | 'assistant';
  readonly label?: string;
  readonly room: RoomDocument;
  readonly checks: CheckFacts;
}
/** Transient photo interpretation context; never project/recovery data or geometry evidence. */
export interface PhotoNotes {
  readonly outline: 'rectangle' | 'unknown' | 'unsupported';
  readonly unplaced: readonly string[];
  readonly simulated: boolean;
}
export interface SessionSnapshot {
  readonly phase: SessionPhase;
  readonly generation: number;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly workspace: CommandWorkspace | null;
  readonly checks: CheckFacts | null;
  readonly presentation: Presentation;
  readonly pending: OperationIdentity | null;
  readonly candidate: CandidateProjection | null;
  readonly message: string;
  readonly messageKind: 'notice' | 'confirmation';
  readonly undoLabel: string | null;
  readonly comparison: 'current' | 'before';
  readonly persistence: 'checking' | 'saved' | 'memory-only';
  readonly recovered: boolean;
  readonly imported: boolean;
  readonly expiresSoon: boolean;
  readonly clientLoadFailure: boolean;
  readonly photoNotes: PhotoNotes | null;
}
export const initialPresentation = (
  roomView: Presentation['roomView'] = 'cutaway',
): Presentation => ({
  selectedId: null,
  panel: 'inventory',
  zoom: 1,
  panX: 0,
  panZ: 0,
  snap: true,
  roomView,
});
/** Display-only framing; these bounds never become room measurements or check evidence. */
export interface RoomFrame {
  width: number;
  depth: number;
  height: number;
}
export function comparisonFrame(
  workspace: Pick<CommandWorkspace, 'current' | 'baseline'>,
): RoomFrame {
  const defaults = { width: 4200, depth: 4800, height: 2600 };
  const edge = (axis: keyof RoomFrame) =>
    Math.max(
      workspace.current.room[axis].value ?? defaults[axis],
      workspace.baseline.room[axis].value ?? defaults[axis],
    );
  return { width: edge('width'), depth: edge('depth'), height: edge('height') };
}

/** History can retire; compare canonical semantics, excluding the revision counter. */
export function hasBaselineChanges(
  workspace: CommandWorkspace | null,
): boolean {
  return (
    !!workspace &&
    JSON.stringify({ ...workspace.current, roomRevision: 0 }) !==
      JSON.stringify({ ...workspace.baseline, roomRevision: 0 })
  );
}
