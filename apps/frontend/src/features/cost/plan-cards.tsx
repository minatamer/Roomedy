import type { RoomEstimate } from '@roomedy/contracts/estimates';
import { useEffect, useRef } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import { pricingState, money, targetKey } from './state';
import { budgetOptions, budgetSummary } from './budget';
import { costLineChanges } from './planning';
import { roomWorkPlan } from './work-plan';
import styles from './workspace.module.css';
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
          <p>
            {preview.after.unpricedCount} unresolved lines · allowances{' '}
            {money(preview.after.allowanceMinor, estimate.locality.currency)}.{' '}
            {preview.pricing.budgetMinor !== null &&
              budgetSummary(preview.after, preview.pricing.budgetMinor)}
          </p>
          <ul>
            {preview.tradeoffs.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <details>
            <summary>Review removed and added cost lines</summary>
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
          <h3>Ways to approach your budget</h3>
          <p>{budgetSummary(estimate, budget)}</p>
          {options.length ? (
            options.map((option) => (
              <article key={option.label}>
                <h4>{option.label}</h4>
                <strong>
                  {money(
                    option.estimate.knownTotalMinor,
                    estimate.locality.currency,
                  )}{' '}
                  known costs
                </strong>
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
              No lower-cost compatible option is available among the recorded
              products and reuse choices. Research another product or review
              explicit scope; this does not prove that no other option exists.
            </p>
          )}
        </section>
      )}
      {plan && (
        <section aria-label="Room work and shopping plan">
          <h3>Your room work plan</h3>
          <p>
            A suggested sequence with checks before ordering. Confirm timing and
            methods with the actual manufacturers and tradespeople.
          </p>
          <ol>
            {plan.steps.map((step) => (
              <li key={step.title}>
                <h4>{step.title}</h4>
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
