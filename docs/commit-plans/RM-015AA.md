# RM-015AA — Useful furniture size presets

19 October2026, clean parent 59dae0a5a586d75ad5eb63ede6372aa69fbd76ae. Direct owner: “for bed make sure they can choose popular bed sizes (single king queen etc..) try to apply this to other furtnute with known sizes, anything that can help the user”. Existing plan→execute→validate→independently fix/revalidate→exact local checkpoint authority applies. Latest explicit request selects AA before held Q/RM-016. Actual visual approval remains pending, guide paused; no paid/live/new services/ports/dependencies/delegation/push/deploy.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AA-add-useful-furniture-size-presets.md`
6. `docs/commit-plans/RM-015AA.md`
7. `docs/validation/RM-015AA.md`
8. `docs/references/furniture-sizes-2026-10-19.md`
9. `docs/design/catalogue.md`
10. `docs/design/visual-review.md`
11. `docs/engineering/spatial-rules.md`
12. `packages/contracts/src/commands.ts`
13. `packages/spatial/src/commands.ts`
14. `packages/spatial/src/catalogue.ts`
15. `apps/frontend/src/features/room-editor/size-presets.ts`
16. `apps/frontend/src/features/room-editor/furniture-size-form.tsx`
17. `apps/frontend/src/features/room-editor/inspector.tsx`
18. `apps/frontend/src/features/room-editor/catalogue-panel.tsx`
19. `apps/frontend/src/features/room-editor/editor.module.css`
20. `apps/frontend/src/features/room-intake/review-panel.tsx`
21. `apps/frontend/src/features/room-intake/draft.ts`
22. `test/furniture-sizes.test.ts`
23. `docs/tickets/RM-015Z-simplify-photo-intake-and-infer-photo-roles.md`
24. `docs/validation/RM-015Z.md`

## Plan and acceptance

1. One bounded reusable, source-backed registry of useful sizes: metric Single90×200/Double140×200/Queen160×200/King180×200cm, UK Single90×190/Double135×190/King150×200/Super king180×200cm, US Twin38×75/TwinXL38×80/Full54×75/Queen60×80/King76×80/CaliforniaKing72×84in. Show sizing system and dimensions; never treat a bed name as globally unique. Convert inches with25.4mm and nearest whole millimetre to match canonical integer dimensions. No locale/account/global size setting.
2. Mattress dimensions are not frame dimensions. Bed presets explicitly add an authored estimated100mm total width/depth allowance for planning, visible beside the chosen mattress size; editable overall width/depth and Custom remain. No invented measured frame or silently applied allowance. Preserve bed height. Expand procedural bed offered maximum to2200×2400mm solely to represent these popular large frames; nominal/default geometry and all other bounds/variants stay unchanged. Do not reprepare unchanged thumbnails/assets; verify existing geometry/asset gate.
3. Useful common planning choices for adjustable desks120×60/140×60/160×80cm (preserve height), hinged/sliding wardrobes100×60×201,150×60×201,200×60×236cm (filter actual supported catalogue), shelves40×28×202,80×28×106,80×28×202cm. Label these Common sizes with exact dimensions, not universal standards or exact branded products. No invented chair categories, dining/sofa assets or stretching fixed prepared meshes.
4. Reuse one warm, compact basic size form in accepted inspector and rough2D piece review, plus the same preset selector for Add/Replace placement before creation. Custom width/depth and available preset height remain editable with explicit mm units, whole-number bounds and field errors/focus; untouched/unknown height stays untouched. Per-item form state resets safely on selection, Undo/import/current dimensions changes. Controls work in both2D/3D via canonical semantics; no separate scene state/provider calls. Existing surface motion animates actual geometry.
5. Add only a visitor-only size-estimate command (bounded width/depth, optional height) because existing resize intentionally rejects owned pieces and measured correction would falsely confirm presets. Shared evaluator respects starting dimension locks, catalogue/fixed-variant rules and normal final spatial/no-worsening checks. It sets only changed axes estimated/visitor-estimate, preserving unchanged/omitted values and their provenance; never changes ownership/preferences/poses/other locks or confirms a measurement. No assistant schema/action-scope expansion or measurement-policy bypass. New form offers an explicit separate Unlock size action when locked; do not silently unlock/apply or change the default lock. Apply is one semantic command/Undo step; legacy ResizeForm and measured Advanced controls remain functional.
6. Review source inference cannot overwrite deliberate size estimates: record changed review-axis keys through existing correction authority. Unknown/estimated/confirmed values remain independent. Rejected presets preserve room/baseline/history and show actual safe error. Preserve Before/import/recovery/reset/expiry fencing and no raw-photo persistence.
7. Meaningful deterministic checks: primary exact size conversions/frame allowance; all offered presets supported; visitor/proposal separation, starting lock even with same-batch unlock, owned estimates without false confirmation, unchanged/omitted-axis provenance, fixed/out-of-range/malformed inputs, collision/containment rejection, Undo and review correction preservation. Native actual size selection/apply/2D↔3D/Undo, Add placement, custom/error/locked and short/narrow layouts where possible. Scoped checks during iteration, required settled root/current byte/build gate, whole24-path read-only validation and independently fix/revalidate until no actionable findings. No mirror tests or repeated full gates without new cause. Physical/GPU/live/owner evidence separate.
8. Record Z59dae0a as committed; update policies/research/receipt and canonical progress only via helper. Preserve old evidence and actual owner gate. Stage/commit exactly allocated paths only after clean review; no unrelated source or security artifacts.
