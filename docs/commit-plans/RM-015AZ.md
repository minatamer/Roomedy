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

## Capsule alignment follow-up allocation — 20 October2026

Clean parent28ee89f. Owner: “padding is off in these buttons and make it so that it allings with the width of the card bellow it dynamically”, with the Furniture/Room/Medy capsule screenshot. Scope is this existing header group and its owning responsive grid; preserve selected styling, sliding animation, real tab/selection authority, header/workspace height and Project/Undo.

Exact eight paths allocated before source edits:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AZ-align-header-controls-and-animate-project.md`
5. `docs/commit-plans/RM-015AZ.md`
6. `docs/validation/RM-015AZ.md`
7. `docs/design/layout.md`
8. `apps/frontend/src/features/room-editor/editor.module.css`

Use one shared responsive properties width for workspace and header column, removing the current20px capsule deduction/header-right inset. Capsule fills that column; narrow full-width capsule follows the existing full-width card while brand/actions retain their inset. Center every icon/label group explicitly inside equal44px targets, with consistent internal padding and matching selected-surface inset. No JS measuring, new state, extra controls, blur, dependencies or provider/config change.

Check scoped formatting and native actual capsule/card left/right/width equality across wide/desktop/short/tablet/narrow states, all three selected positions, icon/label centering, focus and no horizontal overflow. Preserve existing Project/Undo, bounded/natural layout and2D/3D. No CSS mirror tests or repeated full builds for this reversible CSS correction. Read-only review, exact authorized local checkpoint; actual owner approval pending, Q held, guide paused, RM-016 Planned.

## Mobile action padding follow-up allocation — 21 October2026

Clean parent2ddea2d. Owner requests dynamic padding fixes for the top-right mobile Project/Undo buttons. Native390px baseline reproduces Project text5.5px above center and Undo arrow2.953125px left of center inside44px buttons. Both inherit mobile glass padding10px14px; native summary line formatting and left-start icon layout waste the available control height/width.

Exact eight paths allocated before source edits:

1. `docs/README.md`
2. `docs/ROOMEDY.md`
3. `docs/tickets/README.md`
4. `docs/tickets/RM-015AZ-align-header-controls-and-animate-project.md`
5. `docs/commit-plans/RM-015AZ.md`
6. `docs/validation/RM-015AZ.md`
7. `docs/design/layout.md`
8. `apps/frontend/src/features/room-editor/editor.module.css`

Scope the correction to the existing natural/narrow header breakpoint. Share a fluid12–20px inset between brand and actions, fluid6–10px action gap,44px Project height with centered line content and fluid horizontal padding, and a centered44px-square Undo icon. Keep native Project marker/details/motion, labels and actual command/focus authority. Full-width room-tool capsule/card alignment and desktop styling remain. No new wrapper/control/JS/state/assets/dependencies/config/provider changes.

Scoped formatting and actual320/390/430px portrait,600×390 landscape,768×600 short layout and1280px desktop observations. Verify equal heights, centered contents, matching gutters, no overflow, clean capsule/card alignment and native Project/Escape/focus; actual Undo where a reversible edit supplies history. No CSS mirror tests or repeated full builds for this reversible CSS correction. Read-only review/exact authorized local checkpoint; actual owner approval pending, Q held, guide paused, RM-016 Planned.
