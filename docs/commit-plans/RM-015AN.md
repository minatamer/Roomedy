# RM-015AN — Selected furniture control simplification

20October2026, parent `80f307e`, clean worktree/index. Owner requests size preset and piece finish in the basic card, numeric controls only in Advanced, rotation on the left, Delete beside Rotate, no right-card Replace/Remove, less ownership/preference/estimate/unlock clutter and Snap styled like the other buttons as a toggle. This selects implementation, not actual visual approval.

## Exact allocation before code edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AN-simplify-selected-furniture-controls.md`
6. `docs/commit-plans/RM-015AN.md`
7. `docs/validation/RM-015AN.md`
8. `docs/design/layout.md`
9. `docs/design/REVIEW_CHECKLIST.md`
10. `docs/reviews/2026-10-20-visual-feedback-checklist.md`
11. `apps/frontend/src/features/room-editor/inspector.tsx`
12. `apps/frontend/src/features/room-editor/furniture-size-form.tsx`
13. `apps/frontend/src/features/room-editor/size-presets.ts`
14. `apps/frontend/src/features/room-editor/editor.tsx`
15. `apps/frontend/src/features/room-editor/editor.module.css`
16. `apps/frontend/src/features/room-view/cutaway.tsx`
17. `apps/frontend/src/features/room-view/room-view.module.css`
18. `apps/frontend/src/features/room-editor/catalogue-panel.tsx`
19. `apps/frontend/src/features/room-editor/selection-controls.tsx`
20. `apps/frontend/src/features/room-editor/selection-controls.module.css`
21. `packages/contracts/src/commands.ts`
22. `packages/spatial/src/commands.ts`
23. `test/commands.test.ts`
24. `test/furniture-sizes.test.ts`
25. `test/session.test.ts`
26. `apps/frontend/src/features/room-intake/review-panel.tsx`
27. `apps/frontend/src/features/room-editor/selection-actions.ts`

Integration allocation, before editing26: the retained internal review renderer is also a FurnitureSizeForm consumer. Update its composition to the shared preset/Advanced presentation so types and the internal correction seam remain coherent; it does not restore the removed visitor page.

Integration allocation, before editing27: root test types deliberately exclude JSX. Keep the selection-action handler in a small adjacent TS module used by the real shared control and behavior tests; do not expand test compiler scope or couple session tests to JSX/CSS. Source/UI behavior is unchanged by this separation.

## Implementation and verification

1. Separate the existing shared size fields into preset/numeric presentations while retaining one form-state owner. Compact inspector preset names distinguish region/group without numeric dimensions; full labelled dimensions/frame allowance remain Advanced and in the existing catalogue form. Basic preset Apply appears only for a changed choice. Fixed variants show an honest standard/custom preset without unsupported resizing. Finish remains basic. Move dimension summary, exact estimated/measured fields, ownership/preference and independent locks inside collapsed Advanced. Delete duplicate inspector rotation and right-card replacement/removal controls.
2. Avoid making the simplified UI unusable behind default dimensions locks. Add an optional literal-true override only to visitor size-estimate/removal actions, supplied by the explicit Apply/Delete controls. Pure evaluation requires visitor authority for an override, leaves lock values unchanged, preserves per-axis provenance and catalogue/final geometry checks, and produces one normal command/Undo. Existing actions without override retain starting-lock behavior, including same-batch unlock rejection. Assistant schema/actions cannot carry overrides; no provider/assistant expansion or persistent-room schema change.
3. Reuse one selected-furniture Delete component in2D/3D arrangement tools beside Rotate. Resolve current selection on invocation, fence editability/candidate/read-only/expiry, cancel current floor interaction before3D deletion, then dispatch one explicit removal. After success preserve useful focus and clear stale selection through normal controller authority. Empty/feature selections cannot delete furniture. Keep movement/rotation protections unchanged.
4. Replace checkbox Snap with one shared44px button switch, visible checked/unchecked thumb and accessible role/keyboard/focus. Same snap state and grid behavior persist between views; cancel a current3D gesture before changing it. No new setting/schema/storage key.
5. Preserve Replace through the catalogue's existing replacement task, reached contextually for the selected piece without changing Add's default behavior. Existing lock requirements remain there; no inspector Replace/Remove CTA. Preserve view/camera/scene/material motion, all existing measurements/corrections, lifecycle, assistant restrictions and exports.
6. Run focused command/sizing/session regressions for deliberate protected edits/deletion, untouched axes/locks/baseline, single Undo, strict assistant/no-override behavior and final spatial rejection. Use hot reload on4320/private4321 for actual default/Advanced/preset/finish/rotation/Delete/Undo/Snap/selection and desktop/phone/short states. No source-mirror label/CSS tests. At the settled revision run the required telemetry-disabled root gate/both builds with exact current inventory/BUILD_ID. Review all27paths read-only, independently confirm/fix/revalidate findings, record actual evidence/limits and local ticket checkpoint. Keep actual visual gate pending; Q held, guide paused, RM-016 Planned. No new dependency/service/port/delegation/paid/live/push/deploy.
