# RM-015AP — Align the studio and share view controls

20 October 2026. Parent `58cbc18`, clean worktree/index. Owner requests Design Studio at the left of the Furniture/Room/Assistant row, removal of Add piece from that row and the old canvas headings, an in-frame bottom-right count/view switch, aligned frame/left controls/right card, and consistent 2D/3D controls except camera angles.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AP-align-the-studio-and-share-view-controls.md`
6. `docs/commit-plans/RM-015AP.md`
7. `docs/validation/RM-015AP.md`
8. `docs/reviews/2026-10-20-visual-feedback-checklist.md`
9. `apps/frontend/src/features/room-editor/editor.tsx`
10. `apps/frontend/src/features/room-editor/editor.module.css`
11. `apps/frontend/src/features/room-editor/view-controls.tsx`
12. `apps/frontend/src/features/room-editor/view-controls.module.css`
13. `apps/frontend/src/features/room-view/cutaway.tsx`
14. `apps/frontend/src/features/room-view/room-view.module.css`
15. `apps/frontend/src/features/room-view/use-floor-edit.ts`
16. `apps/frontend/src/features/room-view/manipulation.ts`
17. `apps/frontend/src/features/plan-view/plan-view.tsx`
18. `test/session.test.ts`

## Implementation and verification

Retain the focused main h1 as a serif Design Studio title in the tool row. Keep catalogue entry through Furniture/Add a piece, replacement and Work area. Retain hidden comparison semantics. Use one shared editing/navigation toolbar with Explore/Arrange, zoom out/in/Fit room, both quarter-turn directions, Delete and Snap; camera viewpoint/orbit/plan-pan differences remain contextual. A parent-owned interaction mode survives view switches. Plan Explore permits inspection/navigation but blocks furniture/window edits, including keyboard gestures; mode changes retire active gestures. Existing canonical command, locks, lifecycle, Undo, bounds and motion authorities remain.

Share actual-column rail layout and in-frame view/count controls in both rendered views, including loading/failure fallback. Remove the heading-row height and align content top with the right card. Preserve useful full height, narrow natural flow, accessible focus and reachable actions without overlay collisions.

Use focused session/room-view checks for rotation direction/locks/stale state, native browser observations of both views/modes/rotation/Delete/Undo/Snap/zoom/Fit/catalogue/focus and desktop/short/tablet/phone boundaries, then one settled telemetry-disabled root gate/both builds/current source identity. Review all allocated paths read-only, independently fix/revalidate findings, stage exact paths and commit under standing authority. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.

## 3D entrance scrollbar follow-up allocation — 20 October2026

Clean parent `dbed407`. Owner: “when i swithc to 3d a weird vertical scroll bar appears then disppears, fix that”. Actual1280×720 IAB sampling reproduces the room column's594px client height briefly acquiring599px scroll height while the entire3D viewport translates5px downward, then returning to594px. This is presentation overflow during the300ms entrance, not excess room content. Preserve deliberate motion and genuine panel/rail/lifecycle scrolling.

Exact paths allocated before source edits:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AP-align-the-studio-and-share-view-controls.md`
5. `docs/commit-plans/RM-015AP.md`
6. `docs/validation/RM-015AP.md`
7. `docs/design/layout.md`
8. `apps/frontend/src/features/room-view/cutaway.tsx`
9. `apps/frontend/src/features/room-view/room-view.module.css`

Move the existing opacity/5px entrance to the Canvas host inside the already clipped viewport; keep the outer frame and in-frame controls stationary. Preserve the300ms easing, loading spinner, lazy boundary/graphics fallback, camera and command/lifecycle authority. Do not globally hide scrollbars or suppress animation. Verify native switching with bounded during-transition DOM samples at desktop/short/tablet/narrow sizes, active inner motion with stable frame/column bounds, reachable genuine overflow and selected-piece/Undo behavior. No static CSS mirror tests. After source settles, run the established root/both-build/current identity gate, review the full nine-path diff read-only, resolve/revalidate any findings and save the exact authorized local checkpoint. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No new dependency/service/port, paid/live, delegation, push or deploy.
