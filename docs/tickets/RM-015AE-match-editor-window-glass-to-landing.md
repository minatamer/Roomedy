# RM-015AE — Match editor window glass to the landing

Status: **Locally validated; exact batch checkpoint prepared; owner visual acceptance pending**, follows implemented AD (now validated in the settled batch). Direct owner: “the window texture isnt the same as the better one in the landing, fix that to match”. Read the entire [16-path plan](../commit-plans/RM-015AE.md), [original glass ticket N](RM-015N-refine-landing-glass-and-scroll-navigation.md), [room view](../design/room-view.md), [checklist](../design/REVIEW_CHECKLIST.md), [lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) and [receipt](../validation/RM-015AE.md).

- [x] One shared local glass/daylight factory preserves the selected landing appearance and supplies main-editor windows through their existing oriented groups. Native north-wall selection inspected; all-wall movement follows the existing geometry/handlers and was not re-exercised in this round.
- [x] One finite prepared reflection resource per scene, bounded transmission resolution, explicit disposal and existing demand rendering. Aperture, trim, window movement, command/Undo, camera and room data remain independent.
- [x] Export scene/PDF implementation uses the same appearance; GLB retains physical parameters and OBJ accepts the Basic daylight material for its diffuse fallback. Native GLB/OBJ/PDF exports succeeded; structural model checks and all four PDF pages were inspected in the settled batch.
- [x] Actual hot-reloaded visual result and captured browser errors recorded in the receipt; settled tests/final builds/read-only checkpoint validation passed after the queued edits finished.
- [ ] Actual owner visual acceptance remains pending.

No live/paid/new dependencies/services/ports/delegation/push/deploy. Q lighting held, guide paused, RM-016 Planned. AD shares only allocated owners; one atomic validated batch checkpoint is prepared.

Settled evidence and explicit remaining limits: [AD–AI batch receipt](../validation/RM-015AD-AI.md).
