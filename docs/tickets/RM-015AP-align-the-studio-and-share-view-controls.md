# RM-015AP — Align the studio and share view controls

Status: **Locally implemented and validated; actual owner visual approval pending**, follows committed `58cbc18`. Latest owner requests “Design Studio” in a different typography at the left of the Furniture/Room/Assistant row, removal of Add piece and the old canvas headings, count/2D/3D inside the frame bottom right, aligned frame/left CTAs/right card, and consistent controls except camera angles. [Exact plan](../commit-plans/RM-015AP.md), [blueprint](../ROOMEDY.md#7-workspace-and-manual-editing), [layout](../design/layout.md), [motion](../design/motion.md), [review checklist](../design/REVIEW_CHECKLIST.md), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] One focused Design Studio h1 in the tool row; Furniture/Room/Assistant retained and Add piece removed only from this row. Catalogue/Add/Replace remains reachable.
- [x] Count and 2D/3D switch are inside each frame bottom right; frame and left controls align with the adjacent card at useful desktop widths. Both views share the same layout and bounded height; natural narrow/short flow remains reachable.
- [x] Shared Explore/Arrange, zoom/Fit, clockwise/counterclockwise rotation, Delete and styled Snap controls, with consistent availability/order/style. Camera angles remain contextual. Explore permits inspection/navigation without plan edits; switching modes retires gestures.
- [x] Preserve shared command/lifecycle/lock/spatial/Undo/motion authority and selected direction arrow. Actual responsive/keyboard/editing evidence, focused checks, settled root/build/current identity, read-only review and exact local checkpoint recorded. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

## 3D entrance scrollbar follow-up — 20 October2026

Owner reports a vertical scrollbar that appears and disappears when switching to3D. The existing viewport entrance moves its full-height frame5px beyond the room column. [Nine-path allocation](../commit-plans/RM-015AP.md#3d-entrance-scrollbar-follow-up-allocation--20-october2026), [current evidence](../validation/RM-015AP.md#3d-entrance-scrollbar-follow-up--20-october2026).

- [x] Keep frame and view controls fixed; move the same300ms fade/5px entrance inside the clipped frame onto the Canvas host. No global scrollbar hiding, animation suppression or semantic change.
- [x] Actual during-transition desktop/short/tablet/phone samples show no false overflow while inner motion remains active. Genuine properties scrolling, keyboard editing/Undo and strict rejection remain usable. Lazy loading, spinner and graphics failure retain their existing owners.
- [x] Settled root gate passed674tests/49files,7boundaries and both builds with current233-file input identity. Full nine-path read-only review and the exact authorized local checkpoint are recorded in the receipt. Actual owner visual approval remains pending; Q held, guide paused, RM-016 Planned.
