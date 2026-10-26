# RM-024 — Calculate transparent room estimates

Status: **Planned — authorized fake-mode execution**. Dependencies: [RM-022](RM-022-customize-detailed-room-surfaces.md), [RM-023](RM-023-customize-detailed-furniture.md).

## Authority and outcome

26 October 2026: owner explicitly authorizes all necessary CPQ tickets and a sequential execute → read-only validate → independently confirm/fix → revalidate → exact-file local staging/commit loop. Use recommended assumptions and record material decisions. All testing stays fake/paid-off until the owner returns; final manual/visual acceptance is separate. No delegation, paid/live call, owner-env edit, unrelated process mutation, push or deployment.

Create the shared deterministic CPQ authority and a small honest authored market catalogue, independently testable before UI/live research.

## Precision references — read fully for this scope

- [Roomedy Extension for CPQ.md#9-the-deterministic-pricing-authority](../Roomedy%20Extension%20for%20CPQ.md#9-the-deterministic-pricing-authority)
- [Roomedy Extension for CPQ.md#8-local-sourcing-and-price-evidence](../Roomedy%20Extension%20for%20CPQ.md#8-local-sourcing-and-price-evidence)
- [engineering/session-and-plan.md](../engineering/session-and-plan.md)
- [Repository instructions](../../AGENTS.md), [CPQ queue](README.md#cpq-extension--26-october-2026), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).
- Read applicable nested AGENTS.md and installed framework documentation before source changes.

## Scope

- Define bounded schemas for locality, units, systems, offers/evidence, work scope, rates, line items, totals and calculation versions.
- Calculate floor net/waste/packs, per-wall opening deductions, product coats/yield/primer/cans, furniture components and reused pieces.
- Include compatible accessories, explicit preparation/installation/assembly/moving/disposal, supplier-grouped delivery, tax inclusion and allowances/unpriced lines.
- Use exact money arithmetic, clear rounding and bounded pack selection; distinguish installed from purchased quantities.
- Choose a small complete Cairo/EGP example with visibly authored sample prices, supported systems and manual rates; unknown costs never become zero.

## Acceptance

- [ ] Independent hand-calculated cases cover flooring, walls, multiple cans, variants, minimum labour and grouped delivery.
- [ ] Invalid/incompatible/mixed-currency or overflowing data rejects; missing height/openings/rates remain explicit incomplete lines.
- [ ] Output lines retain target IDs, quantities, rule/evidence references and subtotal/allowance/unpriced distinctions for 3D/UI/PDF use.
- [ ] No runtime network or mutable global authority exists in the pure calculation layer.

## Execution and verification

Before edits, inspect real dependencies/Git state and write `docs/commit-plans/RM-024.md` with exact owned paths. Keep one ticket active, use current pinned dependencies and existing domain/state/material ownership. Update the allocation before expanding paths. Preserve other apps, all finite bounds, private logs, accurate measurement evidence, shared command/Undo authority and existing exports.

- Meaningful independent quantity/money/compatibility/edge/uncertainty corpus.
- Shared/browser/backend integration types, boundaries and root gate.

After required checks pass, review the entire settled diff read-only against every acceptance item. Confirm any finding independently before fixing. Revalidate until no actionable local findings remain; record each pass and actual checks in `docs/validation/RM-024.md`. Stage only exact owned paths, inspect staged content for secrets/generated/unrelated files, then make a cohesive `RM-024: ...` local commit. Update the queue/canonical progress with evidence before selecting the next ticket.

## Boundaries and handoff

Explicit non-goal for this packet: no AI-generated arithmetic or real-price assertion. Drawing/document intake is permanently excluded from the extension. Keep output estimate PDF support in its owning packet. First-party sample prices and fake research remain visibly authored; no fixture proves real stock, local price, fit, installer availability or commercial acceptance.

Use only owned Roomedy ports 4320/4321 after verifying full process/listener ownership. Never kill by executable name or port alone, start alternate review services, or change the owner's ignored environment. Existing live Roomedy processes must not be driven by fake tests; if a runtime change is needed, follow the restart/run skills with explicit process overrides and keep environment files unchanged. Test children must force fake/paid-off and deny network independently before application imports.
