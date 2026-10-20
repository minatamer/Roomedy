# RM-015AZ — Header groups and Project motion

20October2026, clean parent df3fd48; [ticket](../tickets/RM-015AZ-align-header-controls-and-animate-project.md), [13-path allocation](../commit-plans/RM-015AZ.md). Owner swaps tabs with file/history controls, Project first, and requests smooth dropdown motion. Actual owner visual approval remains pending.

## Implementation

Actual DOM order is brand→Project→Undo→Furniture/Room/Medy. Preserve auto header/grid/workspace sizing, right-column tab state and the sparkle; narrow header retains natural second-row tabs. Explicit Undo label class replaces first-child hiding so moving Project first keeps the44px icon-only mobile Undo. Desktop popup anchors left at its new Project location; narrow popup anchors to the combined actions group's right edge, with native width/max-height/overflow preserved.

Small adjacent pure TS presentation owner uses one WAAPI animation: opacity/translateY(-10px)/scale(.97) to visible over300ms, close220ms, existing smooth easing. It reads current computed pose before cancellation, fences stale finish/disposal and ignores repeated destinations. Native details stays open during exit paint; panel becomes inert and summary expansion changes immediately. Focus leaves panel before inert; settled native state/ARIA overrides are retired and unavailable-animation native fallback stays usable. No timer/frame loop/canonical history/storage/provider work. Summary, outside click, Escape and existing Medy import call the same owner. Only dropdown's old CSS entrance is removed; modal projectIn remains.

## Focused verification and native observations

Seven meaningful motion regressions plus20 existing project lifecycle tests pass27/2 files, latest .release/AZ-focused-final.log. Covered finite completion/exit inert, focus-before-inert, visible-pose reversal/stale finishes, same-target deduplication/toggle intent, disposal/no resurrection, unavailable-animation fallback and adopting native already-open details. No CSS/static-label mirror tests or new dependency/test setting.

Native fake-ready disposable furnished room on sole4320/private4321; user original untouched. Candidate header at1280×720: Project92.06×44 at230/12, Undo90.69×44 at330.06/12; right tabs Furniture1038.72/12, Room1118.75/12, Medy1184.09/12, all44px. Actual DOM/native AX order matches; settled closed native AX reports collapsed Project, disabled Undo and Room tools without hidden menu actions.

Actual early open opacity.212271/scale.976368/Y-7.877; keyboard Enter closing opacity.715773 with native open still true, destination false and inert true. Immediate Enter reverses to destination true/inert false at opacity.461122; later menu remains open. Repeated mouse/keyboard toggles settle correctly. Escape makes closing panel inert immediately; Tab moves straight to Undo while exit still paints. DOM-role queries can still find painting inert nodes; native keyboard behavior and settled native AX are the inspected claims, not an asserted intermediate AX snapshot. Space activation also opens/interrupts, with actual early popup310.9px versus settled320px, proving transform progression without claiming a frame-rate budget.

Outside Room click changes right panel, Medy click shows actual assistant; exit settles native open=false. Furniture selection→Delete bed→moved Undo restores the bed. Project→Export opens the existing four-format dialog; Close returns Project focus with dropdown closed. No real file imported/reset. Medy import wiring is source-reviewed (synchronous setMenuOpen(true), then native input.click); no native chooser selection/round trip was performed.

390×844: document375/375, header116px, brand16..131, Project237.28..309 then Undo315..359; second-row tabs16..128.33,131.33..243.67,246.67..359, each44px. Popup39..359/top62/bottom302.56. Screenshot RM-015AZ-phone-menu.png inspected.320×568: document305/305, brand16..131, Project167.28..239 then Undo245..289, tabs89×44; popup1..289/top62/bottom302.56, no overlap/horizontal overflow.

1280×600: header68px; settled popup230..550/top64/bottom304.56, opacity1; room and right card start at68 and fill remaining height. Screenshot RM-015AZ-short-open.png inspected. Viewport reset to1280×720 and actual closed/open screenshots RM-015AZ-header-closed.png/RM-015AZ-header-project-open.png inspected. Browser error entries empty; test tab closed before settled gate. These images precede the focus-only guard correction below; header/render/animation bytes are unchanged by it, with final-source confirmation after the gate.

## Read-only finding and disposition

Pass1 identified one Medium integration issue: native details.open intentionally remains true during exit paint, so the retained import-confirmation focus return could mistake closing controls for active ones. Independently traced the asynchronous close/import/cancel path; corrected the existing condition to require panel.inert===false before focusing Import, otherwise Summary. This changes only focus destination, not import/confirmation authority or observed rendering/motion. Motion regression also asserts focus occurs before inert changes.27 focused tests pass after the fix. No new file allocation needed.

The in-progress first root run was interrupted through its own session when this finding required changed source; no passing full gate/build is claimed for it. Scoped read-only elevated process check found no remaining Roomedy Vitest/run-tests workers; app services were not stopped. First input a3e82f63fa5140cc2c32a66e5bf41ed5b1c60bf865e2e70bf6055e7dd3ba156e is superseded. Settled five-owner snapshot .release/AZ-source-review-final.json has combined SHA2565990d96d8adc694e0bfc894e091caee5c7370be241e65ce6f94cf032be4b275a.

Read-only pass2 reviews all5 executable/style/test plus8 allocated documentation owners against df3fd48: **Meets ticket; no remaining actionable findings**. Focus integration finding resolved; one native/motion owner, no duplicate semantic authority, native fallback/focus/keyboard and viewport geometry, clean teardown and bounded work covered. No source/index mutation or additional test invocation during the pass; final gate runs independently. Final gate/current identity and final-source native confirmation follow below.

These are actual Windows/IAB/emulated layout/keyboard/click/motion-state and local fake edit observations, not physical touch/AT/full-tour/full-export/new frame/paint/native-heap benchmark, Linux/hosted or live-provider evidence. Closed native AX is inspected; no blanket accessibility or performance conformance. Q held, guide paused, RM-016 Planned; actual owner approval pending.

## Final settled gate and native confirmation

Final telemetry-disabled pnpm check passes format, lint, all types,7 executable boundaries, exact catalogue/material assets,836 tests/56 files and both builds. Log .release/local-apps/run-20261020-ab0cdbf3/AZ-check-complete.log.269 inputs/3,374,899bytes; before/after inventories match exactly and production BUILD_ID equals05f5845057dfc46607eb79fb6d271d228bbc188be412730da8050902506d739c. All5 reviewed executable/test hashes remain unchanged. Production artifact stays distinct from running hot reload.

A fresh final-source native room after the passed gate confirms ready3D, the same header ordering and Enter→Escape→Enter reversal, latest target open/inert false. Closed/open screenshot paths above are refreshed with final source; settled open state and cleanup recorded before checkpoint. The focus-only guard is source/regression-covered; no native import-file chooser/confirmation race is claimed.

Final13-path read-only closeout remains Meets ticket, no actionable findings, with the focus-return finding resolved. Only exact allocated paths enter the local checkpoint; index initially empty and local links checked. Build-state helper returns actual visual review to awaiting_owner without approval. Q held, guide paused and RM-016 Planned; no paid/live/config/delegation/new dependency/service/port/push/deploy.

Final-source native open settles at opacity1, inert false,320×240.56px at230/64; stale close does not collapse the reopened menu. Refreshed final-source screenshots inspected, captured browser errors empty, temporary tab closed and default viewport retained. Final native confirmation changes no executable bytes.

## Room-tool design follow-up — 20 October2026

Clean parentec6c287. Owner asks for Furniture/Room/Medy to fit the page better. [Exact11-path allocation](../commit-plans/RM-015AZ.md#room-tool-design-follow-up-allocation--20-october2026). The existing floating text/individual selected button becomes one warm oat capsule, decorative original furniture/room outlines plus existing Medy sparkle, and one finite260ms translated cocoa selected surface. Equal44px buttons, cream/ink text, bounded hover and inset focus. No blur/dependency/timer/frame loop or new canonical state. Desktop vertical padding balances the54px capsule so the bounded header remains68px.

A small pure activeRoomTool projection follows the actual shown panel. Furniture inventory/catalogue/selected furniture belong to Furniture; Room or selected door/window/obstacle inspector belong to Room; assistant belongs to Medy. It uses displayed current/candidate/Before semantics for selected IDs, returns no parent for empty/unknown inspector or hidden Checks, and never changes the controller. Existing clicks/focus and selected-ID behavior remain. Two meaningful real-session context regressions cover both2D/3D, catalogue, furniture/door/window inspectors, explicit Medy/Room, hidden Checks, selection clearing and reset.

Scoped formatter/ESLint, frontend types and test types pass.47tests/2files pass (session and project-menu-motion; .release/AZ-tools-focused.log, .release/AZ-tools-types.log). No new full suite/build/source identity claim for this scoped presentation revision. The previous925-test/root/build gate remains historical, not a current-CSS production identity.

Actual native IAB tab63 on sole4320/private4321:1280×720 and1280×600 headers remain68px; group325.59375×54px, three102.53125×44px buttons.768×1024 has280×54px group/87.33×44px targets, header68px and zero horizontal overflow.320×568 has273×54px group/85×44px targets,126px natural two-row header and zero horizontal overflow;390×844 has343×54px group/108.33×44px targets. All labels/icons fit without clipping; Desktop/short/320px3D and tablet/390px2D retain the same active parent.

Actual Furniture→bed inspector remains Furniture; Furniture→Add a piece remains Furniture; Room→Door inspector remains Room; Enter opens Medy, Space opens Room and keyboard Tab shows the inset focus ring. Changes slide the selected surface and preserve the right panel. Existing Project expands with visible Export/Import/Start a new room inside tablet bounds, Escape closes/returns to Project, and Project/Undo remain reachable. No actual file/reset/export operation was performed. Short Medy keeps its composer reachable; phone flow remains natural. Native screenshots inspected inline and saved as RM-015AZ-room-tools-final.png, RM-015AZ-room-tools-tablet.png, RM-015AZ-room-tools-320.png and RM-015AZ-room-tools-390.png in this task’s visualization folder. Tab63 closed and viewport reset. These emulated views do not establish physical-device/assistive/production-frame evidence.

Read-only review covers all11allocated paths, shared selection/panel ownership, decorative icon/hidden-control semantics, CSS width/translation/focus, responsive geometry and regressions; no actionable findings. Exact local checkpoint under standing authority. Actual owner visual approval pending, Q held, guide goal paused, RM-016 Planned; no paid/live/key/config/delegation/new dependency/service/port/push/deploy.

## Capsule alignment follow-up — 20 October2026

Clean parent28ee89f. Owner requests corrected padding and dynamic width alignment with the properties card. [Exact eight paths](../commit-plans/RM-015AZ.md#capsule-alignment-follow-up-allocation--20-october2026). Lessons L-02/03/04/06 and the feature review checklist govern this scoped existing-control correction.

### Diagnosis, correction and checks

At1280×720, capsule bounds934.40625–1260px/325.59375px width differed from card934.40625–1280px/345.59375px width. Labels were2.296875px above the center of their44px buttons. The existing independent width deduction and inline-flex label baseline caused the reported mismatch.

The studio now owns one responsive `--properties-width` used by both header and workspace columns. Header removes its trailing inset; capsule fills that column. Tablet retains its existing left inset without reintroducing a trailing one. Natural narrow header puts the capsule in the full-width second row, with brand/actions retaining16px insets. Buttons use explicit flex centering; existing8px/phone9px6px padding,44px targets, equal slots,4px selected-surface inset and260ms sliding motion remain.

Prettier on the one allocated CSS file and `git diff --check` pass. No JavaScript, commands, selection state, provider/configuration, dependencies or services changed; no new unit/CSS mirror tests or repeated full suite/build/type generation for CSS-only work. Previous root/build identities remain historical.

### Actual native geometry and interaction

Existing hot-reloaded4320, temporary tabs65/66, furnished manual room. Original user tab untouched; both temporary tabs closed and viewport reset. Measurements below are actual rendered DOM bounds, not stylesheet expectations. Every measured button stays44px high; icon/label center error is0px vertically and at most0.0078125px horizontally from pixel rounding.

| Viewport | Capsule/card left–right and width | Header | Root client/scroll width |
| --- | --- | --- | --- |
|1920×1080|1500–1920; both420px|68px|1920/1920|
|1280×720|934.40625–1280; both345.59375px|68px|1280/1280|
|1280×600|934.40625–1280; both345.59375px|68px|1280/1280|
|1024×768|724–1024; both300px|68px|1024/1024|
|768×1024|468–768; both300px|68px|768/768|
|390×844|0–375; both375px|126px|375/375|
|320×568|0–305; both305px|126px|305/305|

- Actual Furniture→Room→Medy switching works, including Enter/Space; selected capsule surface follows the same existing panel owner. At1280 its settled selected-surface width109.188px matches its button, with4px top/bottom inset. Native Tab shows the existing inset focus ring.
- Desktop/short/wide3D and tablet/phone2D observed; source/layout sizing is shared across both. Phone Project popup opens visibly inside the viewport, and Escape closes it with focus returned to Project. No file/reset/export action taken.
- Complete final preview files under `C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/`: `RM-015AZ-capsule-align-desktop.png`, `RM-015AZ-capsule-align-tablet.png`, `RM-015AZ-capsule-align-phone.png`, `RM-015AZ-capsule-align-320.png`. Desktop uses full-page capture; the other final artifacts use explicit full-viewport clips to avoid delta strips. Final phone proof also shows3D. No screenshot-editing/compositing used.

### Read-only review and gate

Scoped CSS and all eight allocated documentation paths reviewed against the latest owner request, actual geometry, mobile header insets, hidden controls, shared2D/3D layout, selected/focus styles and existing breakpoints. **Meets follow-up; no actionable findings.** Actual owner visual approval remains pending. No fresh production, hosted, live-provider, physical-device/GPU or security audit claim. Q held, guide paused, RM-016 Planned; exact authorized local checkpoint only, no paid/live/config/delegation/new ports/push/deploy.
