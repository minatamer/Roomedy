# RM-015AQ — Furniture facing evidence

20 October 2026. Parent `b617f1a`, clean worktree/index at allocation. [22-path plan](../commit-plans/RM-015AQ.md), [ticket](../tickets/RM-015AQ-place-furniture-with-usable-facing.md). Owner requests sensible initial furniture direction and AI planning that accounts for the front. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

## Result and authority

The authored sample/partial wardrobe is now centre3850/3200,quarter-turn1: local1200×600 footprint becomes world X3550–4150,Z2600–3800, with50mm east gap and front west. Other starter poses already have usable configured access. Independent corner literals were recalculated by hand, with no call to implementation geometry in their expected values. Existing arrows/model front convention is unchanged.

One pure helper compares four new-piece quarter-turns by footprint containment/solid overlap, configured front/pull-out obstruction, then wall-backing or chair-to-desk facing. It does not certify fit or replace command checks for doors/windows/obstacles/unknowns. New catalogue previews use it until an explicit R/Rotate choice; numeric new Add shares it. Replacement orientation and accepted/imported/recovered poses remain intact. Starting locks, per-value uncertainty, planned provenance, canonical command/Undo and final validation remain. No new setting, schema, hard rule, stored migration or accepted-room autorotation.

Shared browser/backend search keeps all existing scoped/hard/bounded validation. Computed front-access warnings involving targets and known target back-wall gaps now inform selection before decorative preferences, with window/pair goals and separate chair semantics. Wall anchors already face inward. Scope targets/additions/replacements determine the preference; unrelated pieces never gain move authority. Search order/work/deadline bounds and wire facts remain. Assistant prompt is grounded-room-3; recognition is room-observations-4, defining front/quarter-turn semantics and instructing visible evidence only with hidden facing null/unknown. Recognition does not redesign an observed room. No real-provider behavior is claimed.

## Checks and iteration

Focused final six-file orientation/catalogue/search/scope/recognition/assistant-tool run:97 tests passed. Dependent spatial/catalogue tests:40 passed. Frontend/backend typechecks and scoped lint passed. New regressions cover four wall directions, body obstruction before wall preference, functional access, desk-facing chair/pull-out, unknowns/locks, fresh sample geometry, target-scoped deterministic AI wardrobe/shelf placement, fixed rotation and new-piece explicit-rotation ownership in both views.

Read-only pass1 identified the need to rank solid overlap before wall proximity in the new helper; added that preference and an independent regression. The new check exposed an earlier access-test fixture whose supposedly clear alternate body actually overlapped its obstacle. Moved that synthetic obstacle outside the independently derived alternate footprint, retaining the expected clear direction and an explicit independent coordinate control. Final97-test run passed. Separately allocated path22 before changing the existing sample corner oracle to the new hand-derived rectangle.

One settled telemetry-disabled `pnpm check` passed format/lint/types, executable boundaries including7 boundary tests, catalogue assets,646 tests across48 files, shared/backend builds and the frontend production build. Final input inventory and `.next/BUILD_ID` match232 inputs,2,167,159bytes and `d3043747df39ced0246bce6e1aff6acd0e07400cfa67b5ec73f5aae07736b702`. Logs/inventories are ignored under `.release/local-apps/run-20261020-ab0cdbf3/RM-015AQ-*`. Production artifacts remain distinct from hot reload.

## Actual native observations

Used only existing hot reload http://127.0.0.1:4320/private4321, whose config returned mode fake and readiness HTTP200. Normal backend watcher handled code updates; no environment/service/port change. Temporary test tabs were separate from the user's original tab.

- Fresh furnished and partial rooms,1440×900: selected wardrobe front extends west into the room in3D;2D DOM shows translate3850/3200 and rotate90. Bed/desk/chair/shelf configured access remains clear in deterministic geometry checks. The wardrobe is visibly near the east edge, with its local front matching both representations.
- Empty room → Assistant → Furnish with essentials produced a real fake-mode four-piece preview. Apply succeeded;2D wardrobe showed translate3900/4200,rotate90, back on the east edge/front west. One Undo removed the complete addition batch. This demonstrates shared fake integration, not live model quality or exhaustive search completeness.
- Catalogue keyboard placement near the east wall committed a wardrobe at3800/2400,rotate90. Explicit R followed by further keyboard movement committed rotate180 at3600/2400, proving the visitor choice stops suggestions. Undo worked. Advanced numeric Add at3850/2400 also committed rotate90.
- Moved the added piece to2050/2400, deliberately rotated it to0 and reloaded. Recovery retained translate2050/2400,rotate0 instead of applying the hint again. No new welcome replay; expiry remained the original fixed lifetime.
- Inspected partial-room3D at1280×600 and plan/3D at390×844, with the selected inward arrow, reachable controls/properties and zero positive horizontal overflow.1440px furnished/partial plan/3D and fake proposal screenshots are also retained. All three tab error queries returned empty arrays.

Artifacts are local under `C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623`: `RM-015AQ-furnished-2d.png`, `RM-015AQ-furnished-3d.png`, `RM-015AQ-partial-2d.png`, `RM-015AQ-partial-3d.png`, `RM-015AQ-ai-plan.png`, `RM-015AQ-short-3d.png`, `RM-015AQ-phone-2d.png` and `RM-015AQ-phone-3d.png`. These are current app observations; desktop viewport emulation does not establish physical touch/GPU/paint performance. Actual pointer-drag, a full nine-size product matrix, real photographs/live recognition quality, Linux/hosted/provider/physical evidence and new export downloads were not performed for this ticket. Existing export/recovery semantics remain under their owners.

## Final review and checkpoint

Final22-path read-only pass2 is clean, with no remaining actionable findings. Twelve executable/test paths have review digest `d4c6803df6ed734d4a0874b1cf76eb977c896a57cd0d82f0f00bdd1196705fe3`;628 local Markdown file links resolve, missing0. Exact allocation matches changed/untracked paths; initial index empty, `git diff --check` clean and final source inventory/BUILD_ID unchanged. Exact22-path local ticket checkpoint prepared under standing authority. Actual owner visual approval remains pending, Q held, guide paused and RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.
