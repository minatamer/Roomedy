# RM-015BG — Place and move doors

Status: Locally implemented and validated aftere60a444; exact local checkpoint ready. Actual owner visual approval remains pending.

Owner: “when the user clicks on bathroom door, it should automatically be placed in the first place that makes sense aka no furnite blocking it and not ontop of a window or another door. doors should be moveable aswell just like windows”.

[Exact allocation](../commit-plans/RM-015BG.md), [room view](../design/room-view.md), [layout](../design/layout.md), [window precedent](RM-015U-drag-windows-along-their-walls.md), [feedback](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [review checklist](../design/REVIEW_CHECKLIST.md).

- [x] Bathroom-door Add chooses the first deterministic clear wall interval, using current furniture, obstacles and existing openings; no provider request or additional room. No feasible/assessable position gives a useful notice and preserves the room.
- [x] Doors slide along their recorded wall in2D/3D using the window gesture/keyboard/finite motion owner. Planned offset only, one Undo, preserved independent evidence, read-only/stale/cancellation fences. Doors remain protected from deletion.
- [x] Shared placement guard is rechecked on final door pose additions/changes, including numeric/Medy edits and atomic batches. No unrelated existing data is silently relocated. Fake/manual/Medy parity; no paid/live/config/service/port/delegation/push/deploy.
- [x] Meaningful focused/root/build checks, actual desktop/short/narrow interaction evidence, clean read-only revision and exact local checkpoint. Actual owner approval pending; Q held, guide paused, RM-016 Planned.

Final925tests/58files,7boundaries and both builds pass with exact272-input/BUILD_ID identity; actual native feature observations and clean read-only revision are in the [receipt](../validation/RM-015BG.md). This does not supply actual owner visual approval.
