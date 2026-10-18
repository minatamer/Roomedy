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
    pages = Math.max(1, Math.ceil(checks.issues.length / 20));
  const current = Math.min(page, pages - 1);
  const name = (id: string) =>
    room.furniture.find((f) => f.id === id)?.label ??
    room.room.features.find((f) => f.id === id)?.kind ??
    'Room';
  return (
    <>
      <div className={styles.panelTitle}>
        <p className={styles.eyebrow}>Computed from this room</p>
        <h2 tabIndex={-1}>Room checks</h2>
      </div>
      <p className={styles.hint}>
        These checks use the recorded measurements and mechanisms. They do not
        certify a real room.
      </p>
      <ul className={styles.coverage}>
        {checks.coverage.map((c) => (
          <li key={c.rule}>
            <span>{c.rule.replaceAll('-', ' ')}</span>
            <strong>{c.status.replaceAll('-', ' ')}</strong>
          </li>
        ))}
      </ul>
      <ul className={styles.issues}>
        {checks.issues.slice(current * 20, current * 20 + 20).map((issue) => (
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
                {issue.severity === 'hard'
                  ? 'Needs space'
                  : issue.severity === 'unassessed'
                    ? 'Not checked'
                    : 'Review'}
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
