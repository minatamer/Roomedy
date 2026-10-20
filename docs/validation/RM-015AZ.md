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
