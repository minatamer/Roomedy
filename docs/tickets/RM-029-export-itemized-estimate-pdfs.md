# RM-029 — Export itemized estimate PDFs

Status: **Planned — authorized fake-mode execution**. Dependencies: [RM-028](RM-028-preserve-estimate-versions-and-recovery.md).

## Authority and outcome

26 October 2026: owner explicitly authorizes all necessary CPQ tickets and a sequential execute → read-only validate → independently confirm/fix → revalidate → exact-file local staging/commit loop. Use recommended assumptions and record material decisions. All testing stays fake/paid-off until the owner returns; final manual/visual acceptance is separate. No delegation, paid/live call, owner-env edit, unrelated process mutation, push or deployment.

Generate a branded estimate and shopping/work plan from one selected saved snapshot with financial detail that matches the full-page workspace.

## Precision references — read fully for this scope

- [Roomedy Extension for CPQ.md#12-the-pdf-and-purchasingwork-plan](../Roomedy%20Extension%20for%20CPQ.md#12-the-pdf-and-purchasingwork-plan)
- [references/design-export-2026-10-19.md](../references/design-export-2026-10-19.md)
- [engineering/guest-lifecycle.md](../engineering/guest-lifecycle.md)
- [Repository instructions](../../AGENTS.md), [CPQ queue](README.md#cpq-extension--26-october-2026), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).
- Read applicable nested AGENTS.md and installed framework documentation before source changes.

## Scope

- Reuse existing PDF tooling to lay out selectable itemized text/tables, totals, repeated headers and safe clickable supplier links.
- Include selected-version 3D/plan captures, quantities/pack counts/rates/tax, services/allowances/unpriced items, sources/dates and concise work steps.
- Freeze export input before asynchronous capture; cancellation/deadlines/reset/expiry fence obsolete work and release buffers/resources.
- Support long product names/multi-page line tables with bounded output and keep visual-only design export available.

## Acceptance

- [ ] All numbers and visuals come from the selected snapshot and remain unchanged after later design/price edits.
- [ ] Actual rendered pages are readable, links are functional and missing costs cannot be mistaken for a complete quote.
- [ ] Export/reopening uses no source refresh or provider call and does not alter saved versions.
- [ ] PDF export is output-only and no document-intake feature is introduced.

## Execution and verification

Before edits, inspect real dependencies/Git state and write `docs/commit-plans/RM-029.md` with exact owned paths. Keep one ticket active, use current pinned dependencies and existing domain/state/material ownership. Update the allocation before expanding paths. Preserve other apps, all finite bounds, private logs, accurate measurement evidence, shared command/Undo authority and existing exports.

- PDF content/totals/link/cancellation/bounds regressions and actual rendered page inspection.
- Fake download and workspace comparison plus root gate; record font/language limitations honestly.

After required checks pass, review the entire settled diff read-only against every acceptance item. Confirm any finding independently before fixing. Revalidate until no actionable local findings remain; record each pass and actual checks in `docs/validation/RM-029.md`. Stage only exact owned paths, inspect staged content for secrets/generated/unrelated files, then make a cohesive `RM-029: ...` local commit. Update the queue/canonical progress with evidence before selecting the next ticket.

## Boundaries and handoff

Explicit non-goal for this packet: no official merchant/contractor commitment or purchase execution. Drawing/document intake is permanently excluded from the extension. Keep output estimate PDF support in its owning packet. First-party sample prices and fake research remain visibly authored; no fixture proves real stock, local price, fit, installer availability or commercial acceptance.

Use only owned Roomedy ports 4320/4321 after verifying full process/listener ownership. Never kill by executable name or port alone, start alternate review services, or change the owner's ignored environment. Existing live Roomedy processes must not be driven by fake tests; if a runtime change is needed, follow the restart/run skills with explicit process overrides and keep environment files unchanged. Test children must force fake/paid-off and deny network independently before application imports.
