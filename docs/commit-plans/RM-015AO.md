# RM-015AO — Selected3D front arrow

20October2026. Parent `2389731`, clean worktree/index. Latest owner selects a visible front-direction arrow only on selected3D furniture. Existing representations define local front+Z; Piece already owns animated displayed position/rotation. Reuse that presentation boundary, preserving2D, commands, dimensions/locks, exports and camera/gesture authority. No image asset or new dependency needed.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AO-show-selected-furniture-direction-in-3d.md`
6. `docs/commit-plans/RM-015AO.md`
7. `docs/validation/RM-015AO.md`
8. `docs/reviews/2026-10-20-visual-feedback-checklist.md`
9. `apps/frontend/src/features/room-view/scene.tsx`

## Implementation and verification

Use a small local component in scene.tsx: bounded shaft/cone, walnut with pale halo for contrast, located just beyond local front+Z near the lower front so it extends beyond the silhouette, and scaled within a fixed readable range. Render only inside the selected Piece's existing animated group, across representation kinds. Treat it as an unlit presentation overlay, without shadow/depth writes, picking/drag interception or physical bounds. React owns the finite geometry; use existing owned-material cleanup. Selection/React renders wake the existing demand canvas, parent pose interpolation carries the indicator without a separate frame loop or canonical state. No label, badge, setting, texture, extra light or export object.

Observe the actual wardrobe front from Overview and interior angles, selection switching/clearing, rotation/Undo and phone/short sizing on existing4320/private4321. Retain the2D marker and nonselected/proposal geometry. Use current room-view/session focused tests plus scoped format/lint/types; no static JSX/label/CSS mirror test for a reversible indicator. Run one required settled telemetry-disabled root gate/both builds with current inventory/BUILD_ID. Review all nine owners read-only, independently confirm/fix/revalidate findings and save the exact local checkpoint under standing authority. Actual visual approval remains pending, Q held, guide paused and RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.
