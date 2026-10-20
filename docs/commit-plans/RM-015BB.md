# RM-015BB — Use selection to arrange

20October2026; clean parent484a277. Owner removes Explore view/Arrange room buttons: selected furniture means arranging, no selected furniture means exploring.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BB-use-selection-to-arrange.md`
6. `docs/commit-plans/RM-015BB.md`
7. `docs/validation/RM-015BB.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/room-editor/editor.tsx`
10. `apps/frontend/src/features/room-editor/view-controls.tsx`
11. `apps/frontend/src/features/room-editor/selection-actions.ts`
12. `apps/frontend/src/features/room-view/cutaway.tsx`
13. `apps/frontend/src/features/room-view/scene.tsx`
14. `apps/frontend/src/features/room-view/use-floor-edit.ts`
15. `apps/frontend/src/features/plan-view/plan-view.tsx`
16. `test/session.test.ts`
17. `docs/references/medy-capabilities-2026-10-20.md`

## Implementation and verification

1. Delete the two shared toolbar controls and their unused callback props. Derive interaction from the actual selected furniture, preserving selected-window wall editing. Doors/obstacles remain inspectable without blocking navigation. No independent interaction state or saved mode; selection through plan/3D/inventory/chat/restoration uses the same derived owner.
2. Empty plan space, floor/walls/empty3D clicks and scoped Escape clear selection and restore navigation. Escape during a live move first cancels it; a later Escape clears. Keep features/pieces from propagating accidental clear, protect orbit drags from click-clear and preserve active gesture retirement, read-only/locks/validation/Undo, catalogue placement and loading/failure fallback. No automatic furniture deletion or random selection.
3. Existing Medy Explore request clears selection; Arrange works with the selection or gives concise select-a-piece guidance. No hidden mode or invented success. Keep camera/zoom/tour/file owners unchanged. Update the capability audit for current behavior.
4. Meaningful session-derived interaction regressions cover selection/clear, view/panel persistence, delete/Undo, invalid IDs, protected features, read-only preview and lifecycle. Native hot-reload2D/3D selection, nudge/drag/rotation/Undo, empty-space/Escape navigation and phone/short no-control-row observations. No CSS/static-label mirror tests.
5. Read-only validate exact allocation, independently resolve/revalidate findings, close test tabs then settled root/both-build/exact-input gate and exact authorized local commit. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No live/paid/config/delegation/new dependencies/services/ports/push/deploy.
