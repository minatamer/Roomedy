# RM-015AW — Enable selected deletion and protect doors

20 October2026; clean parent db878bd. Latest owner reports disabled Delete on selected furniture, explicitly allows all furniture including beds and windows, and protects only doors. This selects a correction, not visual approval.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AW-enable-selected-deletion-and-protect-doors.md`
6. `docs/commit-plans/RM-015AW.md`
7. `docs/validation/RM-015AW.md`
8. `docs/design/layout.md`
9. `docs/design/REVIEW_CHECKLIST.md`
10. `apps/frontend/src/features/room-editor/selection-actions.ts`
11. `apps/frontend/src/features/room-editor/selection-controls.tsx`
12. `apps/frontend/src/features/room-editor/view-controls.tsx`
13. `apps/frontend/src/features/room-editor/inspector.tsx`
14. `apps/frontend/src/features/room-editor/messages.ts`
15. `packages/spatial/src/commands.ts`
16. `packages/spatial/src/medy-edits.ts`
17. `test/commands.test.ts`
18. `test/session.test.ts`
19. `test/medy-commands.test.ts`

20. `test/draft-review.test.ts`

Integration allocation before editing20: retained internal photo correction uses the same evaluator. Keep the observation-retirement regression on a deletable window and verify a rejected door removal leaves its evidence untouched. The removed visitor review page stays removed.

## Implementation and verification

1. Confirm the current Explore/Arrange gate. Remove only Delete's dependency on Arrange; keep movement, rotation and camera behavior intact. Reuse the shared room-side button in2D/3D, resolve actual current furniture/window/obstacle selection, retain candidate/read-only/expiry/loading fences and retire active3D gestures before deletion.
2. Explicit visitor Delete bypasses furniture ownership/preference/locks through the existing narrow override, preserving baseline, unchanged objects and one-command Undo. Allow pure visitor removals when an unrelated existing hard issue remains, while retaining the no-new-conflict check and all other batch/assistant authority. No confirmation, mandatory bed, minimum furniture count or automatic unlock.
3. Protect ordinary and bathroom-purpose doors at shared command evaluation, including mixed batches and attempts to convert a door to another feature kind. Remove door deletion from inspector and give MEDY a useful concise reply. Windows and other deletable features keep direct inspector removal and gain the shared room-side Delete. Do not invent a mandatory door in empty/imported rooms or change Add/Undo/reset/import authority.
4. Meaningful command/session/MEDY regressions cover locked owned Keep furniture, last bed, window, protected doors, atomic batches, unrelated conflicts, baseline and Undo/lifecycle fences. Verify actual hot-reloaded3D/2D Explore/Arrange deletion and Undo, window/door cards, short/narrow geometry and focus. No new browser keyboard shortcut is needed; existing keyboard-operable Delete remains shared.
5. Read-only validate current diff against ticket, independently confirm/fix findings, then settled root gate/both builds and exact source/BUILD_ID proof. Record actual evidence/limits and exact local checkpoint. Actual owner approval pending; Q held, guide paused, RM-016 Planned. No paid/live/key/config/delegation/dependencies/services/ports/push/deploy.
