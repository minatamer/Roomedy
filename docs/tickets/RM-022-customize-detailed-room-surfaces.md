# RM-022 — Customize detailed room surfaces

Status: **Complete locally — main ac772cc and clean1059-test preview follow-up; owner visual/manual review pending**. Dependencies: [RM-021](RM-021-plan-the-cpq-extension.md), committed `4f7fb2b`.

[Exact allocation](../commit-plans/RM-022.md), [actual validation](../validation/RM-022.md).

## Authority and outcome

26 October 2026: owner explicitly authorizes all necessary CPQ tickets and a sequential execute → read-only validate → independently confirm/fix → revalidate → exact-file local staging/commit loop. Use recommended assumptions and record material decisions. All testing stays fake/paid-off until the owner returns; final manual/visual acceptance is separate. No delegation, paid/live call, owner-env edit, unrelated process mutation, push or deployment.

Make the studio floor and individual walls tactile and meaningfully customizable, with semantic material choices that later estimating can consume.

## Precision references — read fully for this scope

- [Roomedy Extension for CPQ.md#5-flooring-a-system-not-a-texture-price](../Roomedy%20Extension%20for%20CPQ.md#5-flooring-a-system-not-a-texture-price)
- [Roomedy Extension for CPQ.md#6-walls-and-paint-preparation-primer-and-finish](../Roomedy%20Extension%20for%20CPQ.md#6-walls-and-paint-preparation-primer-and-finish)
- [design/room-view.md](../design/room-view.md)
- [engineering/spatial-rules.md](../engineering/spatial-rules.md)
- [design/layout.md](../design/layout.md)
- [Repository instructions](../../AGENTS.md), [CPQ queue](README.md#cpq-extension--26-october-2026), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).
- Read applicable nested AGENTS.md and installed framework documentation before source changes.

## Scope

- Add bounded optional per-surface material detail: physical pattern size, direction and finish/sheens; preserve legacy room documents and independent measurement evidence.
- Support floor and each named wall, with useful preset cards and custom colour/scale/direction controls in the existing Room tools.
- Connect validated manual/assistant commands, finite material transitions, 2D/3D, scene capture and design exports to the same accepted surface state.
- Reuse prepared local textures and compatible material ownership; preserve window apertures, cutaway walls, current motion and Undo.

## Acceptance

- [x] Changes visibly affect the correct surface at physical scale, without changing room geometry or confirming estimated facts.
- [x] Omitted new fields retain compatible defaults; invalid scales/texture/target combinations reject atomically.
- [x] Per-wall controls and all-walls actions preserve independent choices, shared Apply/Cancel/Undo and legacy import behavior.
- [x] Meaningful schema/command/render/export tests and desktop/phone/short visual checks pass; texture failures retain correct semantic choices.

## Execution and verification

Before edits, inspect real dependencies/Git state and write `docs/commit-plans/RM-022.md` with exact owned paths. Keep one ticket active, use current pinned dependencies and existing domain/state/material ownership. Update the allocation before expanding paths. Preserve other apps, all finite bounds, private logs, accurate measurement evidence, shared command/Undo authority and existing exports.

- Focused surface contract/command/provenance/Undo and room-view/export regressions.
- Shared build, affected types, lint/format/boundaries and settled required root gate.
- Native fake scene inspection and no unintended provider dispatch; owner visual acceptance remains pending.

After required checks pass, review the entire settled diff read-only against every acceptance item. Confirm any finding independently before fixing. Revalidate until no actionable local findings remain; record each pass and actual checks in `docs/validation/RM-022.md`. Stage only exact owned paths, inspect staged content for secrets/generated/unrelated files, then make a cohesive `RM-022: ...` local commit. Update the queue/canonical progress with evidence before selecting the next ticket.

## Boundaries and handoff

Explicit non-goal for this packet: no prices or new sourcing operation. Drawing/document intake is permanently excluded from the extension. Keep output estimate PDF support in its owning packet. First-party sample prices and fake research remain visibly authored; no fixture proves real stock, local price, fit, installer availability or commercial acceptance.

Use only owned Roomedy ports 4320/4321 after verifying full process/listener ownership. Never kill by executable name or port alone, start alternate review services, or change the owner's ignored environment. Existing live Roomedy processes must not be driven by fake tests; if a runtime change is needed, follow the restart/run skills with explicit process overrides and keep environment files unchanged. Test children must force fake/paid-off and deny network independently before application imports.
