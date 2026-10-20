# RM-015AR — Explain furniture access conflicts with toasts

20 October2026, clean parent0ee0f1b. Owner asks what the dashed box over a wardrobe means and requests a toast if it indicates the bed is too close. Source diagnosis: PlanView draws the evaluator's overlap region; the screenshot's brown strip is a warning where the bed's600mm front access band intersects the wardrobe. Object IDs in facts are sorted, so presentation must not infer which object's front it represents from their order. The spatial check remains authoritative. Existing direct-feedback implementation/read-only validation/independent fixes/revalidation/exact local checkpoint authority applies. Actual visual approval remains pending; Q held, guide paused, RM-016 Planned. No paid/live/new services/ports/dependencies/delegation/push/deploy.

## Exact allocation before source edits

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AR-explain-furniture-clearance-with-toasts.md`
5. `docs/commit-plans/RM-015AR.md`
6. `docs/validation/RM-015AR.md`
7. `docs/design/layout.md`
8. `docs/design/room-view.md`
9. `apps/frontend/src/features/session/controller.ts`
10. `apps/frontend/src/features/session/state.ts`
11. `apps/frontend/src/features/session/clearance.ts`
12. `apps/frontend/src/features/plan-view/plan-view.tsx`
13. `apps/frontend/src/features/room-view/scene.tsx`
14. `test/clearance-notices.test.ts`
15. `apps/frontend/src/features/room-editor/editor.module.css`

## Implementation and precision plan

1. Replace only unexplained front-access region overlays in2D/3D with named, actionable access toasts. Other issue geometry, Checks/assistant facts, physical footprint/direction/selection and strict spatial/command constraints remain. No clearance recalculation or guessed distance in the renderer. Bed access is a planning space, not proof of wardrobe door interference; pair copy describes access between the named pieces without assigning a direction from sorted IDs.
2. One pure bounded presentation helper consumes existing room/check facts. Filter actual front-access/access regions, retain approximate/incomplete evidence wording, handle one-object room-boundary access and two-object conflicts, bound labels/output and prefer the selected object. Compare stable issue ID plus region/confidence/severity against prior facts so finish/panel/camera/normal rerenders do not repeatedly warn; changed access after an accepted move/rotation/resize/Add/Apply/Undo is actionable. Multiple issues yield one bounded toast; underlying facts remain complete.
3. Integrate through the shared session selection/commit/Undo paths, not a per-view effect. Selecting an affected piece in accepted Current displays its access notice; unrelated/deselection clears only an existing access notice. Do not replace pending/proposal/load-failure/Before messages with selection feedback. Successful real changes announce new/changed access facts, resolved conflicts return to normal confirmation, rejected commands retain their existing failure path. Add a transient message-kind distinction only; reuse the existing single4s timer/late-callback/reset/import/expiry/dispose fencing and live region, without persistent metadata or new controls.
4. Meaningful real-controller and evaluator tests cover exact bed/wardrobe conflict, selection of either, one-object boundary, estimated/unknown data, long names, absent region/other rules, no repeat for camera/panel/finish/no-op, changed/new/resolved issues, rejected hard changes, Undo and lifecycle/timer cleanup. Native fake-mode JSON import of a controlled close-bed/wardrobe sample uses real UI; observe selection/edit/4s expiry, corrected2D markers,3D consistency, short/phone toast/frame fit and original-tab preservation. No DOM/canonical-state injection or test-only route.
5. Read applicable local guides; scoped formatting/focused checks during iteration, one settled root/both-build/current-inventory gate after fixes, whole15-path read-only validation, independent verification/fixes/revalidation until clean and exact authorized local checkpoint. Keep source/build/native/owner/external evidence distinct. Update the single build record through its helper; actual visual acceptance stays pending.

Before the first CSS edit, allocate path15: actual390×844 phone capture showed the reused toast overlapping the2D/3D switch (toast y650.625–708.625, switch y651.625–695.625). Put notices above the in-frame view controls where controls wrap above the room: use actual-column container sizing plus the same stacked-layout media rule, including the selected-piece return row. Keep wide side-rail toast placement, existing motion/timer/alert semantics and pointer behavior. Inspect settled phone/short/tablet bounds and re-run the settled current-source gate after this observed fix.
