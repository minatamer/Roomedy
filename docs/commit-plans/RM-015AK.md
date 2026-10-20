# RM-015AK — Drag furniture into both room views

20 October2026. Parent25135b7 committed; clean index/worktree before allocation. Latest owner says Work area should relate to adding a desk, coordinate-based Add is almost impossible for most users, and drag/drop must be the main way to add furniture in both2D and3D. This explicitly selects the new add interaction, without owner result approval. Existing fake-mode execute/validate/exact local checkpoint authority applies. No questions while owner sleeps; no delegation, paid/live, new dependency/service/port, push/deploy. Q held, guide paused, RM-016 Planned.

## Exact allocation before edits

1. `apps/frontend/src/features/room-editor/catalogue-panel.tsx`
2. `apps/frontend/src/features/room-editor/catalogue-placement.ts`
3. `apps/frontend/src/features/room-editor/catalogue-placement-input.ts`
4. `apps/frontend/src/features/room-editor/catalogue-placement.module.css`
5. `apps/frontend/src/features/room-editor/catalogue-placement-ui.tsx`
6. `apps/frontend/src/features/plan-view/plan-view.tsx`
7. `apps/frontend/src/features/room-view/catalogue-ghost.tsx`
8. `apps/frontend/src/features/room-view/manipulation.ts`
9. `apps/frontend/src/features/room-view/cutaway.tsx`
10. `apps/frontend/src/features/room-view/scene.tsx`
11. `apps/frontend/src/features/room-editor/editor.tsx`
12. `apps/frontend/src/features/room-editor/editor.module.css`
13. `test/catalogue-placement.test.ts`
14. `docs/tickets/RM-015AK-drag-furniture-from-the-catalogue.md`
15. `docs/commit-plans/RM-015AK.md`
16. `docs/validation/RM-015AK.md`
17. `docs/ROOMEDY.md`
18. `docs/README.md`
19. `docs/tickets/README.md`
20. `docs/design/layout.md`
21. `docs/design/room-view.md`

## Panel-corner follow-up allocation — 20 October 2026

Parent618add8, clean tree before this allocation. Latest screenshot asks the catalogue's outer panel to have rounded corners matching the2D/3D frame. This is a presentation-only follow-up, not result approval. Exact owners before editing:

1. `apps/frontend/src/features/room-editor/editor.module.css`
2. `docs/commit-plans/RM-015AK.md`
3. `docs/tickets/RM-015AK-drag-furniture-from-the-catalogue.md`
4. `docs/validation/RM-015AK.md`
5. `docs/ROOMEDY.md`
6. `docs/README.md`
7. `docs/tickets/README.md`
8. `docs/design/layout.md`

Apply the existing18px room-frame radius to the shared outer properties panel, preserving its contents, dimensions, scroll ownership, focus, motion and narrow natural flow. Inspect actual catalogue/inspector/chat and scrolling desktop/short/phone states; scoped CSS formatting and a full eight-path read-only review suffice for this reversible radius correction. Do not add mirrored CSS tests or repeat599tests/backend/full builds without cause. Record current hot-reload source separately from the prior production artifact. Existing exact local commit authority applies; actual visual gate remains pending, Q held, guide paused, RM-016 Planned. No new service/port/dependency, paid/live/delegation/push/deploy.

## Precision design and implementation

Read existing catalogue Add/Replace, S/AB/AA room-edit/height/size authority, room-view/layout/motion, and lessons L-02/L-03/L-06–L-08/L-15–L-20. One ephemeral catalogue-placement owner holds a new proposed piece/pose and validates through the existing shared visitor preview/dispatch authority. Reuse beginRoomEdit lifetime fencing (allow an unchanged null selected ID for adding), existing snap/clamp/physical dimensions, strict catalogue defaults/size evidence/locks and one Add/Undo. Pointer frames never mutate canonical room/history, persisted state or provider scope. Cancellation/revision/view/selection/reset/import/expiry/unmount fences invalid work. Invalid/overlapping/unassessed-hard placements never bypass final validation.

Catalogue cards are the primary drag source. Pointer capture and one coalesced animation-frame update map screen coordinates through the actual SVG viewBox or actual3D camera ray→floor; show a bounded translucent footprint/box with valid/blocked feedback, retain catalogue context, commit once on a valid drop. Releasing outside the drawing cancels; invalid inside drop stays available to reposition. Escape/capture loss/second pointer cancels without an Add. Rotate and snap retain integer dimensions/half-mm centre rules. No fixed mesh scaling or duplicate geometry engine.

Select-and-click placement plus arrow/Enter/R/Escape keyboard support provides the same authority without required coordinates. Touch scrolling stays usable; a dedicated grip inside each card enables captured dragging, while tapping the card arms placement and brings the room into view. Keep exact position/size fields in a collapsed Advanced path and preserve explicit replacement behavior. No native HTML external drop payload, new framework, continuous idle loop or full-room rerender per pointer frame. Real drag preview consumers subscribe locally;3D ghost is one bounded box without new textures/shadows/provider work.

Work area remains a desk-centred view after a desk exists. With no desk, it opens desk-filtered Add furniture instead of a dead disabled button. Preserve unavailable blocked-camera explanations, actual smooth camera travel and current safe bounds. Preparing a3D addition uses Overview; leaving a removed desk's Work area returns safely to Overview. Initial photo review stays rough2D only.

## Verification and checkpoint

Finish both views/entry paths before routine suites. Controlled new gesture tests cover proposed evidence/default locks, preview without commit, valid add/one Undo, invalid/outside cancellation, rotation/clamp, both room views, and revision/selection/view/reset/import/expiry/disposal retirement. Existing session/room-view suites protect moving/window/camera behavior. Actual native drag from catalogue into2D and3D, invalid/retry/Cancel/Undo, Work area no-desk→desk view, keyboard/click fallback, frame stability, short/phone controls and errors must be inspected. Physical touch/performance/GPU/live/Linux/hosted/full-matrix results remain distinct. Run focused checks during implementation, then one settled root/build/current-source gate and a full21-path read-only review; independently fix/recheck findings. Stage only these exact owners and make a ticket-prefixed local checkpoint after validation; actual owner visual approval remains pending.
