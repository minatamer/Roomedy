# RM-015AZ — Align header controls and animate Project

20October2026; clean parent df3fd48. Latest owner swaps Furniture/Room/Medy with Undo/Project because tabs own the right column, explicitly puts Project first, and requests smooth Project dropdown motion.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AZ-align-header-controls-and-animate-project.md`
6. `docs/commit-plans/RM-015AZ.md`
7. `docs/validation/RM-015AZ.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/room-editor/editor.tsx`
10. `apps/frontend/src/features/room-editor/editor.module.css`
11. `apps/frontend/src/features/room-editor/project-controls.tsx`
12. `apps/frontend/src/features/room-editor/project-menu-motion.ts`
13. `test/project-menu-motion.test.ts`

## Implementation and verification

1. Actual DOM/header order becomes brand, Project→Undo, Furniture/Room/Medy. Center group starts in the tabs' old location; right-aligned tabs occupy the former actions position. Preserve dynamic auto header/workspace height and natural narrow second-row tabs. Replace fragile first-child Undo-label selector with explicit label ownership; all44px targets, Medy sparkle and actual selection/Undo/project/tour authority remain.
2. Anchor desktop Project dropdown to its new left position. In narrow layout anchor to the combined actions group's right edge, keeping the same menu width/viewport bounds and natural header flow. No alternate ports, page translations or dead space.
3. One small finite WAAPI presentation owner serves summary toggle, outside click, Escape and Medy import opening. Fade/slide/soft scale on open and close; reverse from current computed visible state. Retain native details semantics/no-JS fallback, immediately exclude closing controls from focus/AX with inert and truthful summary expansion, retire old animations/callbacks on reversal/disposal. No timer, perpetual frame loop, OS motion suppression, new setting/dependency or canonical state/history write. Remove only the dropdown's obsolete CSS entrance owner; retain unrelated modal animation.
4. Meaningful controlled regressions cover open/close completion, immediate closing focus/inert, interruption/reversal/stale completion, repeated intents, teardown and unavailable-animation native fallback. Actual hot-reload desktop/short/narrow header ordering, popup bounds and visible motion; keyboard/outside/Escape, Export close-return, Medy programmatic opening where safely verifiable, and real tab/Undo behavior. Keep import/reset confirmation authority and no actual user-file/reset operation.
5. Close native test tabs before settled gate to reduce unrelated test resource contention. Read-only validate all13paths, independently fix/revalidate findings, focused tests then root/both builds/current exact identity and exact authorized local commit. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/config/delegation/new dependencies/services/ports/push/deploy.
