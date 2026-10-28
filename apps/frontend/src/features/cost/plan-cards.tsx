import type { RoomEstimate } from '@roomedy/contracts/estimates';
import { useEffect, useRef } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { pricingState, money, targetKey } from './state';
import { budgetOptions, budgetSummary } from './budget';
import { costLineChanges } from './planning';
import { roomWorkPlan } from './work-plan';
import styles from './workspace.module.css';
import { ChatIcon } from './chat-visuals';
export function PlanCards({
  controller,
  state,
  estimate,
  budget,
  work,
  inspect,
  onPreview,
  onResolved,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  estimate: RoomEstimate;
  budget: number | null;
  work: boolean;
  inspect: (key: string | null) => void;
  onPreview: (key: string | null) => void;
  onResolved: () => void;
}) {
  const draft = state.cost!,
    room = state.workspace!.current,
    preview = state.costProposal;
  const options =
    budget === null ? [] : budgetOptions(room, pricingState(draft), budget);
  const plan = work ? roomWorkPlan(room, pricingState(draft), estimate) : null;
  const changes = preview
    ? costLineChanges(preview.before, preview.after)
    : null;
  const previewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (preview) previewHeading.current?.focus();
  }, [preview]);
  const lineList = (lines: RoomEstimate['lines']) => (
    <ul>
      {lines.map((line) => (
        <li key={line.id}>
          {line.label} ·{' '}
          {line.amountMinor === null
            ? 'Unresolved'
            : money(line.amountMinor, estimate.locality.currency)}
          <small>{line.rule}</small>
          {line.targets
            .filter((t) => t.kind !== 'room')
            .slice(0, 1)
            .map((t) => (
              <button key={targetKey(t)} onClick={() => inspect(targetKey(t))}>
                Show part in 3D ↗
              </button>
            ))}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={styles.planCards}>
      {preview && (
        <article className={styles.proposal} aria-label="Cost proposal preview">
          <p className={styles.eyebrow}>Preview · not applied</p>
          <h3 ref={previewHeading} tabIndex={-1}>
            {preview.label}
          </h3>
          <div className={styles.pricePair}>
            <p>
              Current known costs
              <strong>
                {money(
                  preview.before.knownTotalMinor,
                  estimate.locality.currency,
                )}
              </strong>
            </p>
            <p>
              Proposed known costs
              <strong>
                {money(
                  preview.after.knownTotalMinor,
                  estimate.locality.currency,
                )}
              </strong>
            </p>
          </div>
          <div className={styles.factChips}>
            <span>{preview.after.unpricedCount} unresolved lines</span>
            <span>
              Allowances{' '}
              {money(preview.after.allowanceMinor, estimate.locality.currency)}
            </span>
          </div>
          <ul>
            {preview.tradeoffs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <details>
            <summary>Review removed and added cost lines</summary>
            {preview.pricing.budgetMinor !== null && (
              <p>{budgetSummary(preview.after, preview.pricing.budgetMinor)}</p>
            )}
            <h4>Removed</h4>
            {lineList(changes!.removed)}
            <h4>Added</h4>
            {lineList(changes!.added)}
          </details>
          <div className={styles.actions}>
            <button
              className={styles.primary}
              onClick={() => {
                const result = controller.applyCostProposal();
                if (!result.ok)
                  controller.notify(
                    `Preview could not apply (${result.code}). Review the current design and estimate.`,
                  );
                else onResolved();
              }}
            >
              Apply design &amp; estimate
            </button>
            <button
              onClick={() => {
                controller.cancelPreview();
                onResolved();
              }}
            >
              Cancel preview
            </button>
          </div>
        </article>
      )}
      {budget !== null && !preview && (
        <section aria-label="Budget alternatives">
          <h3>
            <ChatIcon kind="budget" /> Budget options
          </h3>
          <div className={styles.pricePair}>
            <p>
              Known costs
              <strong>
                {money(estimate.knownTotalMinor, estimate.locality.currency)}
              </strong>
            </p>
            <p>
              Your budget
              <strong>{money(budget, estimate.locality.currency)}</strong>
            </p>
          </div>
          <div className={styles.factChips}>
            <span>
              {estimate.unpricedCount
                ? `${estimate.unpricedCount} unresolved · full budget unverified`
                : 'All lines priced · planning estimate'}
            </span>
            <span>
              Allowances{' '}
              {money(estimate.allowanceMinor, estimate.locality.currency)}
            </span>
          </div>
          <details>
            <summary>Budget assumptions</summary>
            <p>{budgetSummary(estimate, budget)}</p>
          </details>
          {options.length ? (
            options.map((option) => (
              <article key={option.label}>
                <h4>{option.label}</h4>
                <div
                  className={styles.budgetBars}
                  aria-label="Known cost comparison"
                >
                  <div>
                    <span>Current</span>
                    <div className={styles.amountTrack}>
                      <span style={{ width: '100%' }} />
                    </div>
                    <strong>
                      {money(
                        estimate.knownTotalMinor,
                        estimate.locality.currency,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>This option</span>
                    <div className={styles.amountTrack}>
                      <span
                        style={{
                          width: `${(option.estimate.knownTotalMinor / Math.max(1, estimate.knownTotalMinor)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {money(
                        option.estimate.knownTotalMinor,
                        estimate.locality.currency,
                      )}
                    </strong>
                  </div>
                </div>
                <p>
                  {money(
                    estimate.knownTotalMinor - option.estimate.knownTotalMinor,
                    estimate.locality.currency,
                  )}{' '}
                  lower known cost · {option.estimate.unpricedCount} unresolved
                  lines
                </p>
                <p>{option.tradeoffs[0]}</p>
                <button
                  disabled={!!state.candidate}
                  onClick={() => {
                    const result = controller.prepareCostProposal(
                      option.pricing,
                      option.label,
                      option.tradeoffs,
                      draft.revision,
                    );
                    if (!result.ok)
                      controller.notify(
                        `Review the current estimate (${result.code}).`,
                      );
                    else {
                      const changed = costLineChanges(
                        estimate,
                        option.estimate,
                      );
                      onPreview(
                        changed.added
                          .flatMap((l) => l.targets)
                          .map(targetKey)
                          .find((key) => key !== null) ?? null,
                      );
                    }
                  }}
                >
                  Preview this option
                </button>
              </article>
            ))
          ) : (
            <p>
              No cheaper match in your recorded options. Find another product to
              compare.
            </p>
          )}
        </section>
      )}
      {plan && (
        <section aria-label="Room work and shopping plan">
          <h3>
            <ChatIcon kind="work" /> Your work plan
          </h3>
          <p className={styles.note}>
            Suggested order · confirm methods and timing with your installer.
          </p>
          <ol className={styles.workSteps}>
            {plan.steps.map((step, index) => (
              <li key={step.title}>
                <details open={index === 0}>
                  <summary>
                    <span className={styles.stepNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {step.title}
                  </summary>
                  <p>{step.detail}</p>
                  <div className={styles.quick}>
                    {step.targets.map((key) => (
                      <button key={key} onClick={() => inspect(key)}>
                        Show{' '}
                        {key.startsWith('surface:')
                          ? key.slice(8)
                          : (room.furniture.find((p) => p.id === key)?.label ??
                            'part')}{' '}
                        in 3D ↗
                      </button>
                    ))}
                  </div>
                  {step.sources.map((s) => (
                    <p key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label} · product source ↗
                      </a>
                    </p>
                  ))}
                </details>
              </li>
            ))}
          </ol>
          <details>
            <summary>Shopping quantities from this estimate</summary>
            <ul>
              {plan.shopping.map((item, i) => (
                <li key={i}>
                  {item.label}:{' '}
                  {item.quantity.numerator /
                    item.quantity.denominator /
                    (item.quantity.unit === 'ml' || item.quantity.unit === 'mm'
                      ? 1000
                      : item.quantity.unit === 'mm2'
                        ? 1e6
                        : 1)}{' '}
                  {item.quantity.unit === 'ml'
                    ? 'L'
                    : item.quantity.unit === 'mm2'
                      ? 'm²'
                      : item.quantity.unit === 'mm'
                        ? 'm'
                        : item.quantity.unit}
                  {item.packs.length
                    ? ` · ${item.packs
                        .map((p) => {
                          const offer = draft.offers.find(
                            (o) =>
                              o.id === p.id ||
                              ('packs' in o &&
                                o.packs.some((pack) => pack.id === p.id)),
                          );
                          const can =
                            offer && 'packs' in offer
                              ? offer.packs.find((pack) => pack.id === p.id)
                              : null;
                          return `${p.count} × ${can ? `${can.volumeMl / 1000} L can` : (offer?.label ?? p.id)}`;
                        })
                        .join(', ')}`
                    : ''}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
