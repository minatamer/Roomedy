# RM-028 — Preserve estimate versions and recovery

Status: **Complete locally — settled fake gate passed; owner acceptance pending**. Dependencies: [RM-027](RM-027-deliver-reviewed-budget-and-work-plans.md).

## Authority and outcome

26 October 2026: owner explicitly authorizes all necessary CPQ tickets and a sequential execute → read-only validate → independently confirm/fix → revalidate → exact-file local staging/commit loop. Use recommended assumptions and record material decisions. All testing stays fake/paid-off until the owner returns; final manual/visual acceptance is separate. No delegation, paid/live call, owner-env edit, unrelated process mutation, push or deployment.

Preserve reviewed estimate snapshots independently from editable drafts and future price refresh while extending bounded guest project recovery/export/import.

## Precision references — read fully for this scope

- [Roomedy Extension for CPQ.md#11-saved-versions-and-approval](../Roomedy%20Extension%20for%20CPQ.md#11-saved-versions-and-approval)
- [engineering/guest-lifecycle.md](../engineering/guest-lifecycle.md)
- [engineering/session-and-plan.md](../engineering/session-and-plan.md)
- [Repository instructions](../../AGENTS.md), [CPQ queue](README.md#cpq-extension--26-october-2026), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).
- Read applicable nested AGENTS.md and installed framework documentation before source changes.

## Scope

- Save immutable room/estimate/rule/offer/evidence/scope snapshots with version IDs/timestamps and explicit consumer planning approval.
- Create new drafts/versions and meaningful diffs for quantity, scope, product, rate, tax and logistics changes.
- Migrate the versioned project schema with strict bounds, backward-compatible old imports and fixed two-hour recovery; no raw photos/chat/tokens or active operations.
- Preserve revisions, stale cancellation, expiry/reset/import ownership and coherent Undo; storage failures keep usable in-memory work.

## Acceptance

- [x] Editing/refreshing v2 never changes v1 totals/evidence/design; snapshot references are detached and export selects one exact version.
- [x] Project roundtrip and old-project imports work; malformed/oversized/unsupported versions reject before replacing current work.
- [x] Local storage/expiry failures are truthful and no permanent library, issuer signature or tamper-proof claim appears.

## Execution and verification

Before edits, inspect real dependencies/Git state and write `docs/commit-plans/RM-028.md` with exact owned paths. Keep one ticket active, use current pinned dependencies and existing domain/state/material ownership. Update the allocation before expanding paths. Preserve other apps, all finite bounds, private logs, accurate measurement evidence, shared command/Undo authority and existing exports.

- Snapshot immutability/diff/recovery/migration/import/late-write/size-bound regressions.
- Fake save/compare/reload/download/import flow plus root gate.

After required checks pass, review the entire settled diff read-only against every acceptance item. Confirm any finding independently before fixing. Revalidate until no actionable local findings remain; record each pass and actual checks in `docs/validation/RM-028.md`. Stage only exact owned paths, inspect staged content for secrets/generated/unrelated files, then make a cohesive `RM-028: ...` local commit. Update the queue/canonical progress with evidence before selecting the next ticket.

## Boundaries and handoff

Explicit non-goal for this packet: no accounts, database or commercial e-signing. Drawing/document intake is permanently excluded from the extension. Keep output estimate PDF support in its owning packet. First-party sample prices and fake research remain visibly authored; no fixture proves real stock, local price, fit, installer availability or commercial acceptance.

Use only owned Roomedy ports 4320/4321 after verifying full process/listener ownership. Never kill by executable name or port alone, start alternate review services, or change the owner's ignored environment. Existing live Roomedy processes must not be driven by fake tests; if a runtime change is needed, follow the restart/run skills with explicit process overrides and keep environment files unchanged. Test children must force fake/paid-off and deny network independently before application imports.

Actual results and review limitations: [RM-028 validation](../validation/RM-028.md); exact [file allocation](../commit-plans/RM-028.md).
