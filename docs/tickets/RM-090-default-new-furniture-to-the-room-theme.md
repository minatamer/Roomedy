# RM-090 — Default new furniture to the chosen room theme

**Complete locally:** 31 new behavioral cases, settled split1,768-test/112-file coverage, all code gates/both builds and actual manual keyboard/coordinate checks pass. Twenty-one-path final allocation includes backend direct edits. Read-only pass2 has no actionable findings; owner updated real-model/physical acceptance remains pending.

2 November 2026 · direct owner implementation request · base `779e68d`, clean entry. Once a theme is chosen, subsequent manual and AI furniture additions should use that theme's supported furniture preset by default. Explicit requested finishes/materials remain overrides. Existing furniture must not be restyled again merely because a piece is added.

Record an optional bounded theme identity in accepted room appearance when the existing theme command is applied. Preview/Cancel/Undo retain the existing transaction boundary. Persist through normal project/recovery/import and retain the chosen default after individual wall/floor customisation. For older rooms without the new field, reuse the existing exact wall/floor preset match already shown by the UI; do not infer a theme from generic style hints or approximate colours.

Use one shared pure appearance helper for manual catalogue ghosts/commits, exact Medy catalogue additions/replacements and AI search additions/replacements/validation. Default finish, supported body/soft/hardware and independent bed bedding parts must match the existing theme preset. Keep entry role/size compatibility, physical/provenance/ID/scope/financial authority and explicit override precedence. The displayed theme/guide should use the same canonical selection.

Acceptance: reproduce default loss before editing; parameterize all five themes; verify manual ghost/commit/Undo and AI search/strict candidate validation; test explicit finish override, Cancel/theme Undo/theme switching, persistence/recovery, legacy exact match and untouched unthemed defaults, retained furniture/openings/geometry, and no passive provider request. Add meaningful offline regressions and run one settled canonical gate, then read-only validate/confirm/fix/revalidate and exact local checkpoint. Actual live-model/owner acceptance remains separate.

[Allocation](../commit-plans/RM-090.md), [receipt](../validation/RM-090.md). Existing local ticket-commit authority applies. Preserve normal paid-ready services/env. No paid/provider or browser Send test, env read/change, restart, dependency, delegation, image build, cloud mutation, push or deployment.
