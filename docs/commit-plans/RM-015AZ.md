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

## Room-tool design follow-up allocation — 20 October2026

Clean parentec6c287. Owner screenshot requests a better Furniture/Room/Medy design that fits the page: “feels like these designs can be better to fit our page, figure something for them and do it”. Use one warm oat capsule with three equal targets, small decorative furniture/room/Medy icons and a finite sliding cocoa selected surface. Preserve the right-panel header position, Project→Undo ordering, actual panel/selection authority and existing Medy spelling/sparkle.

Exact eleven paths allocated before source edits:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AZ-align-header-controls-and-animate-project.md`
5. `docs/commit-plans/RM-015AZ.md`
6. `docs/validation/RM-015AZ.md`
7. `docs/design/layout.md`
8. `apps/frontend/src/features/room-editor/editor.module.css`
9. `apps/frontend/src/features/room-editor/editor.tsx`
10. `apps/frontend/src/features/room-editor/selection-actions.ts`
11. `test/session.test.ts`

1. Group existing buttons in one oat translucent capsule, thin highlight/border and restrained shadow; no extra backdrop blur. Three equal44px buttons, legible ink/cream labels, unobstructed focus and modest hover. One CSS pseudo-element slides/reverses between selected positions; no new state, timer, frame loop, dependency or network. Small original inline furniture/room outlines and existing Medy sparkle are decorative. Match panel-side width and retain a full-width narrow second row. Adjust desktop padding so the bounded header remains68px and preserves workspace height.
2. Derive the active parent tool from actual panel context. Inventory/catalogue/furniture inspector belong to Furniture; room/feature inspector belong to Room; the conversation belongs to Medy. Hidden Checks or empty/unknown inspector does not invent a selected tool. Use displayed current/candidate/Before facts to classify actual selected objects; this changes presentation only. Button clicks retain existing open/focus behavior and labels/pressed semantics.
3. Meaningful session tests cover real selection/panel context in2D/3D, catalogue and unavailable selection without mirroring CSS. Scoped format/lint/frontend/test types plus focused session/project-menu regressions. Native desktop/short/tablet/320px phone and390px phone contexts, keyboard/focus, inspector/catalogue parent state, all visible panels and Project/Undo reachability. Inspect actual geometry/readability/motion; no full-suite/build claim for the scoped presentation revision. Review/fix/revalidate all11paths and save exact authorized local checkpoint. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned; no paid/live/delegation/new services/ports/dependencies/push/deploy.
