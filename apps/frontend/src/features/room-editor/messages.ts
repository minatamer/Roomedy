import type { SpatialIssue } from '@roomedy/contracts/issues';
import type { RoomDocument } from '@roomedy/contracts/room';
const failureCopy: Readonly<Record<string, string>> = Object.freeze({
  'out-of-scope':
    'This change goes beyond the requested pieces. Start a new request to include them.',
  'invalid-input': 'Check the values and units before trying again.',
  locked: 'Unlock the protected property before changing it.',
  'owned-dimensions':
    'Correct the measured size of your item, or explicitly replace it.',
  retained:
    'This piece is marked Keep. Change its preference before replacing it.',
  'unsupported-variant':
    'This proposed variant cannot represent those dimensions or finish.',
  'new-conflict':
    'This change creates a space conflict. The room is unchanged.',
  'no-improvement':
    'This change does not reduce the existing conflict. Try moving the affected pieces apart.',
  stale:
    'The room changed or expired. Review the current room before trying again.',
  capacity:
    'This room has reached its supported limit. Remove an unused piece or opening first.',
  'nothing-to-undo': 'There is no change to undo.',
  'revision-limit': 'Start a new room session to continue editing.',
});
export function failureMessage(
  failure: string | { code: string; issue?: SpatialIssue },
  room?: RoomDocument,
): string {
  const code = typeof failure === 'string' ? failure : failure.code;
  const issue = typeof failure === 'string' ? undefined : failure.issue;
  if (issue) {
    const names = issue.objectIds.map((id) =>
      (
        room?.furniture.find((f) => f.id === id)?.label ??
        room?.room.features.find((f) => f.id === id)?.kind ??
        (id === room?.roomId ? 'Room' : 'New piece')
      ).slice(0, 60),
    );
    return `${issueText(issue)}${names.length ? `: ${names.join(' + ')}` : ''}. Change not applied.`;
  }
  return Object.hasOwn(failureCopy, code)
    ? failureCopy[code]!
    : 'The change could not be applied. Your room is unchanged.';
}
export const issueText = (issue: SpatialIssue): string =>
  ({
    'outside-room': 'Outside the room boundary',
    overlap: 'Furniture footprints overlap',
    'door-swing': 'Door clearance needs space',
    access: 'Furniture access needs space',
    height: 'Height needs attention',
    window: 'Window area needs attention',
    obstacle: 'Fixed obstacle conflict',
    unassessed:
      issue.limitation === 'not-implemented'
        ? 'Entry connectivity is not checked'
        : 'A measurement or physical fact is missing',
  })[issue.code];
