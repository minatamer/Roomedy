# RM-015BB — Selection-driven interaction

20October2026; clean parent484a277. [Ticket](../tickets/RM-015BB-use-selection-to-arrange.md), [17-path allocation](../commit-plans/RM-015BB.md). Owner removes Explore view/Arrange room buttons and makes selection determine interaction. Actual owner visual approval remains pending.

## Implementation and focused checks

Shared toolbar drops both buttons and the unused callback. One pure helper derives interaction from the valid displayed selected furniture/window and active editor lifecycle; Editor no longer owns a separate arranging state. Panel/view changes keep the selection; locks/read-only/proposal/graphics readiness still gate actual edits. Doors/obstacles remain inspectable with exploration available. No canonical/schema/recovery change.

Plan blank floor/background clicks clear selection while role-button descendants remain protected. Scoped Escape cancels an active furniture/window gesture first, otherwise clears selection.3D floor click and true Canvas misses clear; whole furniture/opening handlers retain propagation control and drag-distance guards. Escape has the same cancel-then-clear semantics. Existing shared gesture retirement, physical validation, selected Delete, window movement, camera/zoom, catalogue and Undo authority remain. Medy Explore clears selection, Arrange acknowledges the current selection or gives select-a-piece guidance; no hidden mode or arbitrary selection.

Four meaningful derived-state regressions cover both views, panel/view persistence, no semantic/history write, locked selections, selected-window editing, inspect-only doors/invalid IDs, delete/Undo/reselect/reset/disposal. Focused session/plan/Medy suites pass94tests/3files (.release/BB-focused.log); scoped frontend type generation/typecheck passed (.release/BB-frontend-types.log). Existing session tests cover read-only/gesture/lifecycle constraints. No CSS/static-label mirror tests, dependency or service.

## Actual native observations and correction

Fake-ready fresh authored disposable rooms on sole4320/private4321. Native desktop1280×720 has no mode row; navigation begins at the shared frame top. Inventory selection enables rotation/Delete and direct-edit canvas semantics.2D/3D keyboard wardrobe moves succeed immediately after selection, each actual Undo restores the accepted pose.3D native click selects the wardrobe, an actual selected-piece drag yields Move piece and one Undo. Empty floor clears selection; actual Escape changes the canvas back to navigation. With no selection, a native orbit drag visibly changes the camera while leaving Undo empty. Plan blank floor click and scoped Escape both clear selection and restore arrow-key-pan semantics. Selecting the north window and ArrowLeft yields Move window, then actual Undo succeeds.

A native implementation finding caught broad scene-ancestor background handling intercepting furniture clicks. Independently confirmed via repeated unchanged selection after actual mesh clicks; corrected before settled review by attaching background clear only to the floor and true Canvas misses. Retested actual wardrobe click, drag, Undo, floor clear and navigation successfully. No broad ancestor hit handler remains; shared geometry/scene contents are preserved.

Medy native Explore clears selected window without a room change; Arrange with no selection returns Select a piece in the room or furniture list, then drag it to arrange it. No provider call/key/mode/config change. Short1280×600 confirms zero mode buttons/explore state. Phone390×844 precision2D selection enables controls with no mode row; document width375 fits viewport, natural scrolling/property return remains. Phone Escape restores navigation. Fresh final-source tab50 has no captured browser errors; viewport reset, tabs49/50 closed before settled gate. Desktop/phone screenshots visually inspected. This is feature-owned native evidence, not a full matrix/physical-device/blanket accessibility or frame-performance claim. Loading/failure/proposal/restored paths retain source coverage, no separate native claim.

Screenshots in C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/: RM-015BB-selected-3d.png, RM-015BB-short-3d.png, RM-015BB-phone-plan.png.

## Read-only review and remaining gate

Pass1 inspects all17 allocated paths plus neighboring camera/gesture/controller code. Meets ticket; no actionable findings after the native background-hit correction. Selection is the only mode authority, clearing has a reachable pointer/keyboard path, selected-window/inspection/read-only/locks/Undo remain coherent, and removed CTAs are absent in the shared2D/3D toolbar. Medy response remains truthful. Required settled root/both-build/exact-source gate passed below; Q held, guide paused, RM-016 Planned. No paid/live/config/delegation/new dependency/service/port/push/deploy.


## Settled gate and closeout

Telemetry-disabled pnpm check passes format, lint, all types,7 executable boundaries, exact asset verification,847tests/56files and both builds. Log .release/local-apps/run-20261020-ab0cdbf3/BB-check.log. Exact before/after inventory matches:269inputs/3,376,783bytes. Production BUILD_ID equals input digest7f879cbbd1a7da54eb7d5ab8ff33913a3301c61b449345b25d847a8b03277664; all8 reviewed executable/test hashes remain unchanged. Production output remains distinct from running hot reload.

Final17-path read-only closeout remains Meets ticket, no actionable findings, with the native background-hit finding resolved and all local Markdown targets verified. Exact allocated paths only enter the authorized local checkpoint. Visual review returns through the build-state helper to awaiting_owner; no owner approval inferred. Q held, guide goal paused and RM-016 Planned. No paid/live/config/delegation/new dependencies/services/ports/push/deploy.
