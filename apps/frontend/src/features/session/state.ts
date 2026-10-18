import type { OperationIdentity } from '@roomedy/contracts/commands';
import type { CheckFacts, RoomDocument } from '@roomedy/contracts/room';
import type { CommandWorkspace } from '@roomedy/spatial';

export type SessionPhase =
  'entry' | 'intake' | 'editor' | 'expired' | 'disposed';
export type Panel = 'inventory' | 'inspector' | 'catalogue' | 'room' | 'checks';
export interface Presentation {
  readonly selectedId: string | null;
  readonly panel: Panel;
  readonly zoom: number;
  readonly panX: number;
  readonly panZ: number;
  readonly snap: boolean;
}
/** A renderer projection is never an independently editable room. */
export interface CandidateProjection {
  readonly identity: OperationIdentity;
  readonly room: RoomDocument;
  readonly checks: CheckFacts;
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
  readonly undoLabel: string | null;
}
export const initialPresentation = (): Presentation => ({
  selectedId: null,
  panel: 'inventory',
  zoom: 1,
  panX: 0,
  panZ: 0,
  snap: true,
});

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
