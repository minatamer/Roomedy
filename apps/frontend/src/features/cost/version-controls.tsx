import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { RoomEstimate } from '@roomedy/contracts/estimates';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { versionChanges } from './versions';
import { pricingState, money } from './state';
import styles from './workspace.module.css';
export function VersionControls({
  controller,
  state,
  estimate,
  selectedId,
  onView,
  onDesign,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  estimate: RoomEstimate;
  selectedId: string | null;
  onView: (id: string | null) => void;
  onDesign: () => void;
}) {
  const [label, setLabel] = useState(''),
    [message, setMessage] = useState(''),
    [compareId, setCompareId] = useState('');
  const [decision, setDecision] = useState<{
    id: string;
    revision: number;
    workspace: string;
  } | null>(null);
  const decisionHeading = useRef<HTMLHeadingElement>(null),
    draftButtons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    if (decision) decisionHeading.current?.focus();
  }, [decision]);
  const closeDecision = () => {
    const id = decision?.id;
    setDecision(null);
    if (id) draftButtons.current.get(id)?.focus({ preventScroll: true });
  };
  const selected = state.estimateVersions.find((v) => v.id === selectedId),
    compare =
      state.estimateVersions.find(
        (v) => v.id === compareId && v.estimate.locality.currency === 'USD',
      ) ??
      state.estimateVersions.find(
        (v) => v.estimate.locality.currency === 'USD',
      );
  const changes = compare
    ? versionChanges(compare, {
        room: state.workspace!.current,
        pricing: pricingState(state.cost!),
        estimate,
      })
    : null;
  const save = (event: FormEvent) => {
    event.preventDefault();
    const result = controller.saveEstimate(
      label.trim() || `Version ${state.estimateVersions.length + 1}`,
    );
    setMessage(
      result.ok
        ? 'Saved in this session. Download the project to keep an editable copy.'
        : result.reason,
    );
    if (result.ok) {
      setLabel('');
      onView(result.id);
    }
  };
  return (
    <section className={styles.versions} aria-label="Estimate versions">
      {selected && (
        <div className={styles.savedBanner}>
          <p className={styles.eyebrow}>Saved planning estimate · read only</p>
          <h2>{selected.label}</h2>
          <p>
            {new Date(selected.savedAt).toLocaleString('en-GB')} ·{' '}
            {selected.estimate.unpricedCount} unresolved lines. Later edits and
            research do not change this record.
          </p>
          <button
            onClick={() => {
              setDecision(null);
              onView(null);
            }}
          >
            Return to current draft
          </button>
        </div>
      )}
      <details>
        <summary>Saved estimates · {state.estimateVersions.length}</summary>
        <details>
          <summary>About saved estimates</summary>
          <p>
            A frozen planning snapshot, not a supplier quote or order. Versions
            expire with this two-hour session; export the project to keep them.
          </p>
        </details>
        {!selected && (
          <form onSubmit={save} className={styles.form}>
            <label>
              Version name · optional
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
                placeholder={`Version ${state.estimateVersions.length + 1}`}
              />
            </label>
            <p>
              {state.cost && estimate.unpricedCount
                ? `${estimate.unpricedCount} unresolved lines and all allowances will stay visible in this saved estimate.`
                : 'Sample prices and allowances still need confirmation before ordering.'}
            </p>
            <button
              disabled={!!state.candidate || state.estimateVersions.length >= 4}
              type="submit"
            >
              Approve &amp; save planning estimate
            </button>
          </form>
        )}
        {state.estimateVersions.map((version) => (
          <div key={version.id} className={styles.versionRow}>
            <div>
              <strong>{version.label}</strong>
              <small>
                {version.estimate.locality.currency !== 'USD'
                  ? 'Archived currency'
                  : `${money(
                      version.estimate.knownTotalMinor,
                      version.estimate.locality.currency,
                    )} known`}{' '}
                · {version.estimate.unpricedCount} unresolved ·{' '}
                {new Date(version.savedAt).toLocaleDateString('en-GB')}
              </small>
            </div>
            <button
              disabled={!!state.candidate || selectedId === version.id}
              aria-label={`View ${version.label} in 3D and estimate`}
              onClick={() => {
                setDecision(null);
                onView(version.id);
              }}
            >
              View saved 3D &amp; estimate
            </button>
            <button
              disabled={!!state.candidate}
              ref={(element) => {
                if (element) draftButtons.current.set(version.id, element);
                else draftButtons.current.delete(version.id);
              }}
              aria-label={`New draft from ${version.label}`}
              onClick={() =>
                setDecision({
                  id: version.id,
                  revision: state.cost!.revision,
                  workspace: state.workspace!.workspaceId,
                })
              }
            >
              New draft from this version
            </button>
          </div>
        ))}
        {decision && (
          <div
            className={styles.proposal}
            role="group"
            aria-label="Confirm new estimate draft"
          >
            <h3 ref={decisionHeading} tabIndex={-1}>
              Start a draft from{' '}
              {state.estimateVersions.find((v) => v.id === decision.id)?.label}?
            </h3>
            <p>
              This starts from the selected saved version and clears current
              Undo. Save the current draft first if you want to keep it. Saved
              versions, the starting Before layout and original expiry stay
              unchanged.
            </p>
            <div className={styles.actions}>
              <button onClick={closeDecision}>Cancel</button>
              <button
                onClick={() => {
                  const current = controller.getSnapshot();
                  if (
                    current.workspace?.workspaceId !== decision.workspace ||
                    current.cost?.revision !== decision.revision ||
                    !controller.draftFromEstimate(decision.id)
                  )
                    setMessage(
                      'The draft changed. Review the version again before replacing it.',
                    );
                  else {
                    onView(null);
                    setMessage(
                      'A new editable draft is ready. Saved versions are unchanged.',
                    );
                  }
                  closeDecision();
                }}
              >
                Start new draft
              </button>
            </div>
          </div>
        )}
        {compare && changes && compare.estimate.locality.currency === 'USD' && (
          <details>
            <summary>Compare saved version with current draft</summary>
            <label>
              Saved version
              <select
                value={compare.id}
                onChange={(e) => setCompareId(e.target.value)}
              >
                {state.estimateVersions
                  .filter((v) => v.estimate.locality.currency === 'USD')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Saved{' '}
              {money(
                compare.estimate.knownTotalMinor,
                compare.estimate.locality.currency,
              )}{' '}
              · current{' '}
              {money(estimate.knownTotalMinor, estimate.locality.currency)}{' '}
              known costs.{' '}
              {changes.differenceMinor === null
                ? 'Different currencies; no converted saving is claimed.'
                : `${money(changes.differenceMinor, estimate.locality.currency)} difference.`}{' '}
              Current unresolved: {estimate.unpricedCount}; saved unresolved:{' '}
              {compare.estimate.unpricedCount}.
            </p>
            <ul>
              {changes.reasons.length ? (
                changes.reasons.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li>
                  The design, financial inputs and calculated lines match.
                </li>
              )}
            </ul>
            {(['removed', 'added'] as const).map((kind) => (
              <details key={kind}>
                <summary>
                  {kind === 'removed'
                    ? 'Saved lines removed or changed'
                    : 'Current lines added or changed'}{' '}
                  · {changes[kind].length}
                </summary>
                <ul>
                  {changes[kind].map((line) => (
                    <li key={line.id}>
                      {line.label} ·{' '}
                      {line.amountMinor === null
                        ? 'Unresolved'
                        : money(
                            line.amountMinor,
                            kind === 'removed'
                              ? compare.estimate.locality.currency
                              : estimate.locality.currency,
                          )}
                      <small>{line.rule}</small>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </details>
        )}
        <p>
          Up to four versions, within the project size limit. This is tab
          recovery, not a permanent library or an issuer-signed record.
        </p>
        <button onClick={onDesign}>
          Open Design for project download or import ↗
        </button>
        <p role="status">{message}</p>
      </details>
    </section>
  );
}
