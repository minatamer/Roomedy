# RM-015AD — Pick and infer wall and floor surfaces

20 October2026. Clean parent42b400a, AC committed. Direct owner: “the wall colors and texture should be allowed to be picked, as also the ai in the picture analysis may be able to capture that stuff and replicate it in the 3d model. same as floor”. Existing execute/read-only validate/independently fix/revalidate/exact local checkpoint authority applies; actual visual approval pending, Q held, guide paused, RM-016 Planned. No paid/live/new service/port/dependency/delegation/push/deploy.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AD-pick-and-infer-wall-and-floor-surfaces.md`
6. `docs/commit-plans/RM-015AD.md`
7. `docs/validation/RM-015AD.md`
8. `docs/design/layout.md`
9. `docs/design/room-view.md`
10. `docs/design/visual-review.md`
11. `docs/engineering/spatial-rules.md`
12. `packages/contracts/package.json`
13. `packages/contracts/src/surfaces.ts`
14. `packages/contracts/src/room.ts`
15. `packages/contracts/src/commands.ts`
16. `packages/contracts/src/intake.ts`
17. `packages/spatial/src/commands.ts`
18. `apps/frontend/src/features/catalogue/finishes.ts`
19. `apps/frontend/src/features/room-editor/surface-controls.tsx`
20. `apps/frontend/src/features/room-editor/room-panel.tsx`
21. `apps/frontend/src/features/room-editor/editor.module.css`
22. `apps/frontend/src/features/room-intake/review-panel.tsx`
23. `apps/frontend/src/features/room-intake/draft.ts`
24. `apps/frontend/src/features/room-view/scene.tsx`
25. `apps/frontend/src/features/room-view/surfaces.ts`
26. `apps/frontend/src/features/design-export/scene.ts`
27. `apps/frontend/src/features/design-export/portfolio.ts`
28. `apps/frontend/src/features/plan-view/plan-view.tsx`
29. `apps/backend/src/recognition/recognize.ts`
30. `apps/backend/src/recognition/fixtures.ts`
31. `test/room-surfaces.test.ts`
32. `test/room-view.test.ts`
33. `test/recognition.test.ts`
34. `docs/tickets/RM-015AC-temporarily-hide-room-comparison.md`
35. `docs/validation/RM-015AC.md`

36. `apps/frontend/src/features/assistant/controller.ts`
37. `packages/spatial/src/search/facts.ts`

Allocation refinement before these two source edits: actual existing assistant no-op detection and computed changed-room facts inspect only legacy finish enums. Custom colours can otherwise mask a same-named palette request. Extend those two existing comparisons to resolved surface appearance; no assistant action/schema expansion.

38. `apps/frontend/src/features/room-editor/editor.tsx`

Allocation refinement before editor.tsx edit: its existing read-only Room summary prints legacy finish names during preview, so it must show the selected colour/texture too.

39. `test/automatic-photo-purpose.test.ts`

Allocation refinement before this test edit: test type checking exposed a generic room-value filter whose inferred narrowing no longer covers optional surface fields. Explicitly check the same three dimension facts; keep separate new appearance-source tests.

## Implementation and acceptance

1. One small browser-safe surface contract/helper owns bounded six-digit hex colour, supported textures, per-value unknown/photo-estimated/visitor-planned evidence and legacy fallback. Optional room surface overrides preserve existing schema1 imports/recovery/default images; no global furniture-finish enum expansion. Walls remain one room-wide finish, floor one finish. Defaults preserve legacy wood floor/plaster walls. Supported floor planks/tile/concrete/carpet and wall smooth/plaster/wood/linen are illustrative authored materials, not exact physical reconstruction.
2. Near the top of Room, show separate Walls and Floor colour controls (existing palette plus native custom colour) and labelled texture choices with compact visual preview. Each Apply sends one validated visitor surface command; changed fields only get planned provenance, unchanged/other-surface/geometry/ownership/locks remain. One Undo. Reuse same controls in rough2D room review for correcting photo estimates; no initial3D preview. Clear field errors, no giant cards or filler. Retain existing palette previews, assistant scope and current hidden comparison.
3. Independent colour and texture affect actual main3D walls/floor,2D colour and design-export scene/PDF finish labels/swatches. Reuse finite procedural maps: existing grain/plaster/cloth plus bounded local smooth/tile/concrete, no external texture/photo-as-wall upload or extra lights/postprocessing. Owned textures/shaders retire; total surface RGBA budget below2MiB. Preserve continuous colour motion; finite texture blending in existing demand-frame owner, two colour samplers plus existing bump sampling and one latest pending target during a transition, no React/canonical writes per frame. Export uses settled semantic target, not presentation animation.
4. Recognition strict schema/prompt can return optional wall/floor colour and texture hypotheses, with each unknown or estimated and a supplied source ID; only room-purpose images support room appearance. Unclear lighting/material stays unknown, no exact match/confirmed claim, no raw photo textures stored. Bounded schema/source validation rejects bad colours/unsupported or mismatched surface textures/foreign IDs, downgrades non-room evidence. Fake example route authors matching approximate surfaces through the same decode/request/draft path; it never claims pixel inference.
5. Draft reconciliation carries useful source estimates into accepted room without inventing scale/frame evidence. Visitor per-value corrections survive another response; changed/removed/reclassified photo sources retire only their unreviewed appearance facts. Include source/evidence beside controls, unchanged fields retain provenance. Optional project fields round-trip bounded JSON, existing imports default correctly, all model/PDF exports reflect selected appearance; baseline/current/recovery/lifecycle fences unchanged. Old room-finish/palette actions intentionally update colour overrides while preserving texture and preventing stale custom colour from masking selected palettes.
6. Meaningful deterministic cases cover schema/legacy defaults, command/Undo/no-op/spatial invariants and independent evidence, old palette compatibility, parser role/source/unknown/bounds, review correction/removal/reclassification, fake request/provider projection, map counts/disposal/blend/retarget and export target/round-trip. Native actual Room/review controls/2D/3D/Undo/errors/custom colours, photo fake flow, responsive short/narrow states, local export appearance checks where available. Required settled root/exact input/build gate, full39-path read-only validation and independently fix/revalidate until clean; exact authorized local checkpoint after. No mirror tests, paid/live recognition accuracy claim or physical/GPU/Linux/hosted/owner acceptance inference.
7. Update AC42b400a commit and current policies/evidence. Canonical progress only via build-state helper. Preserve Q held, guide paused, RM-016 Planned and actual owner visual gate.


## Latest owner verification steering

During AD, the owner said: “try to skip tests btw till u finish all queued tasks i have for u” and “unless u find error ofc then u fix that for sure then keep going”. Defer routine automated suites/root gates during the current queued visual-edit batch; fix observed errors and continue implementation/hot-reload visual checks. Earlier68focused tests and the already-running type check are historical pre-deferral evidence, not final current-byte verification. Keep authored regressions for the later settled batch. Do not claim a final root/build/acceptance pass while it is deferred.
