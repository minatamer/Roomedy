# RM-015AP — Align the studio and share view controls

Status: **Locally implemented and validated through the single-header correction; actual owner visual approval pending**. Original parent `58cbc18`; the latest owner removes the previously requested visible Design Studio title and raises navigation into the top bar. Original checks below retain their historical scope; the single-header acceptance below supersedes the title/separate row. [Exact plan](../commit-plans/RM-015AP.md), [blueprint](../ROOMEDY.md#7-workspace-and-manual-editing), [layout](../design/layout.md), [motion](../design/motion.md), [review checklist](../design/REVIEW_CHECKLIST.md), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] One focused Design Studio h1 in the tool row; Furniture/Room/Assistant retained and Add piece removed only from this row. Catalogue/Add/Replace remains reachable.
- [x] Count and 2D/3D switch are inside each frame bottom right; frame and left controls align with the adjacent card at useful desktop widths. Both views share the same layout and bounded height; natural narrow/short flow remains reachable.
- [x] Shared Explore/Arrange, zoom/Fit, clockwise/counterclockwise rotation, Delete and styled Snap controls, with consistent availability/order/style. Camera angles remain contextual. Explore permits inspection/navigation without plan edits; switching modes retires gestures.
- [x] Preserve shared command/lifecycle/lock/spatial/Undo/motion authority and selected direction arrow. Actual responsive/keyboard/editing evidence, focused checks, settled root/build/current identity, read-only review and exact local checkpoint recorded. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

## 3D entrance scrollbar follow-up — 20 October2026

Owner reports a vertical scrollbar that appears and disappears when switching to3D. The existing viewport entrance moves its full-height frame5px beyond the room column. [Nine-path allocation](../commit-plans/RM-015AP.md#3d-entrance-scrollbar-follow-up-allocation--20-october2026), [current evidence](../validation/RM-015AP.md#3d-entrance-scrollbar-follow-up--20-october2026).

- [x] Keep frame and view controls fixed; move the same300ms fade/5px entrance inside the clipped frame onto the Canvas host. No global scrollbar hiding, animation suppression or semantic change.
- [x] Actual during-transition desktop/short/tablet/phone samples show no false overflow while inner motion remains active. Genuine properties scrolling, keyboard editing/Undo and strict rejection remain usable. Lazy loading, spinner and graphics failure retain their existing owners.
- [x] Settled root gate passed674tests/49files,7boundaries and both builds with current233-file input identity. Full nine-path read-only review and the exact authorized local checkpoint are recorded in the receipt. Actual owner visual approval remains pending; Q held, guide paused, RM-016 Planned.

## Single header and dynamic working height follow-up — 20 October2026

Owner removes Design Studio and asks to raise everything into the top bar, with cards dynamically filling the released working height. [Eleven-path allocation](../commit-plans/RM-015AP.md#single-header-and-dynamic-working-height-follow-up-allocation--20-october2026), [evidence](../validation/RM-015AP.md#single-header-and-dynamic-working-height-follow-up--20-october2026).

- [x] Furniture/Room/Assistant share the brand/Undo/Project header; no visible title or reserved separate toolbar row. Auto header sizing allocates the remaining working height to the aligned bounded frames/left controls/right cards, with natural narrow header wrapping and page flow.
- [x] Assistant uses its actual bounded panel content height independently of the animated shell, retaining finite narrow conversation/composer behavior and real scrolling. Existing focus ref and clipped Room editor h1 keep tour/Delete/Back-to-room focus meaningful without visible filler.
- [x] Actual2D/3D responsive/short/boundary layouts, catalogue/Room/selected properties, Project/Escape, editing/Delete/Undo, tour targets/focus and phone chat reachability inspected. Command/lifecycle/motion, hidden Checks/comparison and previous entrance correction remain.
- [x] Settled674-test/root/both-build/current233-file identity, full eleven-path read-only review and exact authorized local checkpoint recorded in the receipt. Actual owner approval remains pending; Q held, guide paused, RM-016 Planned.
