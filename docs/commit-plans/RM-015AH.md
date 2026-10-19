# RM-015AH — Correct interior horizontal camera dragging

20 October2026. HEAD42b400a; AD–AG61-path batch remains unstaged with final gates deferred by owner. Current owner reports inverted sideways controls in Corner and, when asked, explicitly identifies “Dragging left/right”. Correct the existing interior pointer owner, not unrelated look/strafe commands. No new authority, paid/live/dependency/service/port/delegation/push/deploy or premature commit.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AH-correct-interior-horizontal-camera-drag.md`
6. `docs/commit-plans/RM-015AH.md`
7. `docs/validation/RM-015AH.md`
8. `docs/design/room-view.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/src/features/room-view/scene.tsx`

## Implementation and evidence

Interior pointer X currently subtracts fromatan2(direction.x,direction.z), turning the camera toward a right drag so the room moves left. Its vertical pointer path already makes the room follow the drag. Change only horizontal pointer yaw accumulation to adddeltaX×0.004, making content follow the grab in Corner/Doorway/Work area through their shared owner. Keep sensitivity, pitch/clamps,160ms retargeting from the displayed pose, input capture/cancellation, editing mode, pinch and all camera/room safety semantics. Existing Look left/right button/Arrow and A/D movement signs are already camera-relative and stay intact. Overview remains owned by OrbitControls.

Use an isolated existing4320 tab to inspect actual Corner right/left drags and camera DOM diagnostics, verifying fixed eye position and opposite yaw changes/content displacement. Inspect that intended rotation begins at the displayed pose, settles and produces no browser error; save a native screenshot. Record which controls/views were actually exercised. No routine automated suites/type/lint/root/full builds now under latest queued-edit deferral; source/whitespace/allocation housekeeping is not a final validation pass. Actual full motion/device/input matrix, exact batch gates/checkpoint and owner visual acceptance remain pending. Canonical progress through build-state helper.
