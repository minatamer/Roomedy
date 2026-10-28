import { featureLabel } from '@roomedy/spatial';
import { useState } from 'react';
import type { CheckFacts, RoomDocument } from '@roomedy/contracts/room';
import type { SessionController } from '../session/controller';
import { issueText } from './messages';
import { focusProperties } from './focus';
import styles from './editor.module.css';
export function ChecksPanel({
  controller,
  checks,
  room,
}: {
  controller: SessionController;
  checks: CheckFacts;
  room: RoomDocument;
}) {
  const [page, setPage] = useState(0),
    issues = checks.issues.filter((issue) => issue.severity !== 'unassessed'),
    pages = Math.max(1, Math.ceil(issues.length / 20));
  const current = Math.min(page, pages - 1);
  const name = (id: string) =>
    room.furniture.find((f) => f.id === id)?.label ??
    (() => {
      const feature = room.room.features.find((f) => f.id === id);
      return feature ? featureLabel(feature) : undefined;
    })() ??
    'Room';
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>Computed from this room</p>
        <h2 tabIndex={-1}>Room checks</h2>
      </div>
      {!issues.length && <p className={styles.hint}>No layout conflicts.</p>}
      <ul className={styles.issues}>
        {issues.slice(current * 20, current * 20 + 20).map((issue) => (
          <li key={issue.id}>
            <button
              onClick={() => {
                const target = issue.objectIds.find(
                  (id) =>
                    room.furniture.some((f) => f.id === id) ||
                    room.room.features.some((f) => f.id === id),
                );
                if (target) controller.select(target);
                else controller.setPanel('room');
                focusProperties(controller, target);
              }}
            >
              <span className={styles.issueSeverity}>
                {issue.severity === 'hard' ? 'Needs space' : 'Review'}
              </span>
              <strong>{issueText(issue)}</strong>
              <span>{issue.objectIds.map(name).join(' · ') || 'Room'}</span>
              <span>
                {issue.confidence}. {issue.limitation?.replaceAll('-', ' ')}
                {issue.deficitMm === null
                  ? ''
                  : ` · ${issue.deficitMm} mm deficit`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className={styles.actionRow}>
          <button disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
