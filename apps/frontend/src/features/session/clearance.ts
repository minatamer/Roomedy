import type { CheckFacts, RoomDocument } from '@roomedy/contracts/room';
import type { SpatialIssue } from '@roomedy/contracts/issues';

const accessConflict = (issue: SpatialIssue) =>
  issue.rule === 'front-access' &&
  issue.code === 'access' &&
  issue.severity !== 'unassessed' &&
  issue.region !== null;
const signature = (issue: SpatialIssue) =>
  JSON.stringify([issue.region, issue.confidence, issue.severity]);

/** Presentation only: existing evaluated facts own all clearance/geometry decisions. */
export function clearanceNotice(
  room: RoomDocument,
  checks: CheckFacts,
  selectedId: string | null,
  previous?: CheckFacts | null,
): string | null {
  const old = new Map(
    previous?.issues.filter(accessConflict).map((i) => [i.id, signature(i)]),
  );
  const issues = checks.issues.filter(
    (i) => accessConflict(i) && (!previous || old.get(i.id) !== signature(i)),
  );
  const issue =
    issues.find((i) => selectedId && i.objectIds.includes(selectedId)) ??
    (previous ? issues[0] : undefined);
  if (!issue) return null;
  const names = issue.objectIds.map((id) =>
    room.furniture.find((f) => f.id === id)?.label.slice(0, 60),
  );
  if (!names.length || names.some((name) => !name)) return null;
  const space =
    names.length === 2
      ? `between ${names[0]} and ${names[1]}`
      : `around ${names[0]}`;
  return (
    issue.confidence === 'unassessed'
      ? `Check access space ${space}. Some measurements are missing.`
      : `${issue.confidence === 'approximate' ? 'Estimated clearance: ' : ''}Leave more space ${space} for access.`
  ).slice(0, 240);
}
