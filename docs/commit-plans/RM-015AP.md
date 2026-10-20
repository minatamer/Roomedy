# RM-015AP — Align the studio and share view controls

## Animated view toggle follow-up allocation — 20 October2026

Clean parent `c284266`. Latest owner selects one animated exclusive2D/3D control and removes the piece count. This supersedes AP's earlier count/two-button presentation. Preserve the existing bottom-right frame position and canonical room-view owner, including MEDY changes, loading and unavailable graphics.

Exact twelve paths allocated before source edits:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AP-align-the-studio-and-share-view-controls.md`
6. `docs/commit-plans/RM-015AP.md`
7. `docs/validation/RM-015AP.md`
8. `apps/frontend/src/features/room-editor/editor.tsx`
9. `apps/frontend/src/features/room-editor/view-controls.tsx`
10. `apps/frontend/src/features/room-editor/view-controls.module.css`
11. `apps/frontend/src/features/plan-view/plan-view.tsx`
12. `apps/frontend/src/features/room-view/cutaway.tsx`

Use one warm rounded track with a sliding selected thumb and two labelled exclusive buttons,44px targets and visible keyboard focus. Keep the control mounted in the shared stage while the underlying view/loading/graphics content changes, allowing continuous reversible CSS motion and retained focus. Remove the count and obsolete per-view control props. No duplicate view state, new timer, command, dependency or service. Verify both directions, quick reversal, keyboard, MEDY-driven view changes, desktop/short/tablet/phone bounds and absence of count. Use existing checks plus one settled root gate; no static CSS/label tests. Review the complete settled diff read-only, fix/revalidate any findings, and save the exact authorized local checkpoint. Actual owner approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/new ports/push/deploy.

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

## Single header and dynamic working height follow-up allocation — 20 October2026

Clean parent `2bd448f`. Latest owner removes the visible Design Studio title and asks to raise everything into the top bar, with cards dynamically fitting the newly available working height. This supersedes the original AP title/separate tool-row layout, not the shared controls, aligned frames or command behavior. Move Furniture/Room/Assistant into the existing brand/Undo/Project header; the room, left tools and right panel begin directly beneath it. Use actual grid allocation rather than visual translation or a reserved empty row. Narrow headers may wrap the navigation into a natural second row while keeping every control reachable.

Exact paths allocated before source edits:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AP-align-the-studio-and-share-view-controls.md`
6. `docs/commit-plans/RM-015AP.md`
7. `docs/validation/RM-015AP.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/room-editor/editor.tsx`
10. `apps/frontend/src/features/room-editor/editor.module.css`
11. `apps/frontend/src/features/assistant/assistant.module.css`

Retain an accessible visually hidden Room editor h1 and the existing focus ref for welcome/Undo/Delete/palette/Back-to-room focus returns. Preserve hidden Checks/comparison, tour targets/lifecycle, menu positioning, panel state and semantics. The studio grid measures the header's actual auto height and gives the remaining bounded viewport to the workspace; natural phone/short flow remains. Both2D/3D frames and right cards stretch together. Bounded Assistant uses its actual panel content height via a size container, independent of the animated motion shell, replacing the effective fixed viewport subtraction without creating observer feedback. Existing finite narrow chat and composer behavior remain. Preserve the preceding3D entrance overflow fix and active motion.

Inspect actual before/after1280×720 geometry;2D/3D, inventory/catalogue/selected/Advanced/Room/Assistant, Project open/close, selection/edit/Undo, hidden-heading focus, fresh tour Skip/target travel and narrow return/composer. Check responsive viewport/actual-column boundaries and short-height/narrow scrolling, no overlaps or horizontal overflow, frames/card alignment and fit after resize. Use no static label/CSS mirror tests. Run one settled telemetry-disabled root/both-build/current-input gate, full eleven-path read-only validation, independent correction/revalidation as needed and exact authorized local checkpoint. Actual owner approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/dependency/service/port/push/deploy.

## Top-right view toggle follow-up allocation — 20 October2026

Clean parent0db0786. Latest owner screenshot/request: “top right corner for this is more intuittive”, pointing from the2D/3D toggle to the top right of the room frame. This explicitly supersedes the earlier bottom-right placement. Reuse the one shared mounted frame control in both views/loading/failure states; preserve the animated thumb, labels,44px targets, focus and canonical view selection.

Exact initial eight paths allocated before the CSS edit:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AP-align-the-studio-and-share-view-controls.md`
5. `docs/commit-plans/RM-015AP.md`
6. `docs/validation/RM-015AP.md`
7. `docs/design/layout.md`
8. `apps/frontend/src/features/room-editor/view-controls.module.css`

Change only the shared frameControls vertical anchor from bottom12px to top12px, retaining right12px. Check actual desktop/short/tablet/phone2D/3D, switch/keyboard/focus and top/right bounds; no new per-view CSS, control, state or tests mirroring CSS. Scoped CSS formatting and native observations are appropriate to this reversible positioning correction; previous925-test/build proof remains historical, with no fresh full-suite/build identity claim. Review all eight paths read-only, fix/revalidate any findings and save the exact authorized local checkpoint. Actual visual approval pending; Q held, guide paused, RM-016 Planned; no paid/live/delegation/new ports/push/deploy.

Before the responsive correction, allocate one additional path to this follow-up:

9. `apps/frontend/src/features/room-editor/editor.tsx`

Actual768px tablet inspection finds the shared viewStage includes the wrapped toolbar above the frame, so top12px on that outer stage overlaps tools. Replace the loose overlay anchor with shared CSS grid/subgrid rows: toolbar then frame, with the single mounted toggle over the frame cell; at the existing rail breakpoint it overlays the right frame column. Keep frame geometry, no JS measurements/timers, and preserve44px targets and animation. Wrap the two existing lazy/error plan fallbacks in the same stage owner so their status/plan use the same rows. This supersedes the initial one-line-only implementation plan. Add scoped frontend lint/type checks for the fallback markup; no full-suite/build claim for this reversible layout correction.
