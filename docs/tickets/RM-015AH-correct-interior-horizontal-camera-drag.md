# RM-015AH — Correct interior horizontal camera dragging

Status: **Locally validated; exact batch checkpoint prepared; owner visual acceptance pending**. Owner reports inverted sideways controls in Corner and explicitly clarifies “Dragging left/right”. Read the [10-path plan](../commit-plans/RM-015AH.md), [V Corner rule](RM-015V-frame-the-corner-opposite-the-doorway.md), [room view](../design/room-view.md), [motion](../design/motion.md), [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [checklist](../design/REVIEW_CHECKLIST.md) and [receipt](../validation/RM-015AH.md).

- [x] Interior horizontal dragging moves the room with the pointer, matching its existing vertical grab convention. Shared Corner/Doorway/Work area path corrected; Corner actually exercised.
- [x] Local-axis camera semantics, finite smooth retargeting, pinch/zoom, pointer capture/cleanup, editing guards and safety bounds retained in source; direction buttons/keyboard and canonical room stay independent.
- [x] Actual Corner left/right drag outcome and captured browser errors recorded. Settled batch gates passed and exact local checkpoint is prepared; full native input/view matrix and actual owner visual approval remain pending.

AD–AG shared batch ownership preserved; Q held, guide paused, RM-016 Planned. No paid/live/new dependency/service/port/delegation/push/deploy.

Settled evidence and explicit remaining limits: [AD–AI batch receipt](../validation/RM-015AD-AI.md).
