# RM-015AB evidence

20 October2026. Parent AA/a8f1c02, clean index/worktree before allocation. [Plan](../commit-plans/RM-015AB.md) and [ticket](../tickets/RM-015AB-fill-the-editor-working-height.md). Actual owner acceptance pending; Q held, guide paused and RM-016 Planned.

## Baseline

Existing sole hot-reloaded4320/private4321, isolated native browser tab15,1280×720 manual partial accepted room, skipped tour then3D. Canvas y202.421875–610.5 (408.078125px high), wrap bottom671; footer y683–720. Hint y615.5–630.5 and approximation y642.5–659 reserve60.5px; column bottom padding12px. Screenshot inspected. This is current source behavior, distinct from the owner's older screenshot and prior S evidence.

## Implemented and actual native checks

Four frontend files only: clipped accessible surface descriptions replace visible plan/cutaway captions and approximation rows; actual asset loading/failure overlays live inside the viewport. One3D grid row fills both frame and left rail, and bounded-layout bottom padding is removed.2D uses the same available column height. Camera, scene, controller, locks, checks, gesture/Undo, preview, footer and motion authority remain unchanged.

Actual1280×720 final canvas and left rail both y202.421875–683,480.578125px high; footer still y683–720. Canvas gains72.5px versus the inspected baseline, without changing width669.40625px.2D SVG has identical height/bottom. Confirmed after camera Corner→Overview, selected bed, Arrange room, native focused-canvas ArrowRight move, command Undo and Before→Current. Regular Move piece confirmation is clipped to1px, not a row. A deliberate bed90° rotation at the room edge visibly reports “Outside the room boundary: Simple bed. Change not applied.” in the existing40px overlay; canvas stays480.578125px. Checks still shows height/entry-connectivity and missing-value issues. Initial3D lazy loading/fallback and real model-failure branches remain by source; no context-loss/asset-failure injection was performed.

Native13-size matrix for both2D/3D:320×568,390×844,430×932,768×1024,899×800,900×600,1024×768,1280×720,1366×768,1440×900,1920×1080,667×375,1024×600. All26 final geometry observations have0 horizontal document overflow. On bounded layouts,2D and3D frame bottoms equal footer tops:987,563,731,683,731,863,1043,563 respectively for768/900/1024/1280/1366/1440/1920/1024-short. Where actual room width supports the190px side rail, it reaches that same bottom. At narrower actual room columns controls wrap above the frame; phone/short landscape retain natural document flow and accessible scrolling. No inspector-over-canvas overlap.3D rail measurements waited for the existing animated height style to clear; preliminary in-flight canvas/rail measurements were not counted as settled evidence. Actual final1280 canvas/rail bounds and44px minimum camera/viewpoint target verified again; description IDs resolve and clip-path is inset(50%). Native tab error log returned no errors at that check, not a claim about every historical console.

Actual screenshots saved and inspected in this task's visualization directory: RM-015AB-full-height.png (1280×7203D), RM-015AB-2D.png (1280×720 plan) and RM-015AB-phone.png (390×844 natural flow). RM-015AB-responsive.json retains26 final DOM geometry observations. Owner's existing tabs/data were left alone; isolated QA tab15 is retired at handoff and temporary viewport override reset.

No CSS/static-label mirror tests were added for this reversible layout change. Final root/current-byte/build gate is recorded below; read-only validation follows. No physical touch/GPU-frame/native-heap/assistive-device/production-browser/Linux/hosted/live-provider evidence or actual owner acceptance claimed; existing semantics/failure/expiry tests do not establish those external results.


## Settled root and exact artifact

NEXT_TELEMETRY_DISABLED=1 and ROOMEDY_RELEASE_ID=2d590b7ce6e856fa1bcb0a0aa976bd820d602b432567910cef3bd166d8d9e996, required pnpm check exit0: formatting/lint/types, seven executable boundary checks, exact catalogue assets,555tests/44files and both builds passed. Log .release/RM-015AB-check.log. Input inventory .release/RM-015AB-inputs-final.json has214 files/1,816,197bytes, inputDigest and actual frontend production BUILD_ID both2d590b7ce6e856fa1bcb0a0aa976bd820d602b432567910cef3bd166d8d9e996. Native observations used current hot-reloaded4320, distinct from this production build artifact; no extra production service or production-browser claim.

## Read-only validation and checkpoint

Read-only pass1 reviewed all16allocated paths against a8f1c025f4d8e8a829c63360610cb3cc79e25f9c, settled snapshot SHA2561d1a3ca31e5436aa8f36c1614a79205cae7cfa02c41d6406bee109b656a6b136, empty index. No file/index mutation, delegation or suite during the pass. Current214runtime path/byte/hash values matched the exact production BUILD_ID; allocation, local links (including URL-encoded paths) and diff whitespace checks passed. A first ad hoc link check omitted URL decoding and rejected an existing encoded filename; corrected read-only checker passed, no product finding or source correction.

TL;DR:

- Covered removing visible under-frame copy and reclaiming full bounded2D/3D frame/left-rail height, with natural narrow flow.
- Covered accessible descriptions, retained Checks/properties/real failures/loading/lifecycle/preview actions, unchanged state/motion and actual responsive/edit/Undo/rejection evidence.
- Actual owner visual, physical/assistive/GPU, production-browser/Linux/hosted/live proof stays unverified as listed above.

Verdict: **Meets ticket — No actionable findings.** Inspected complete plan/ticket/current diff, full changed frontend owners and neighbouring fallback/status/motion/Checks behavior, all updated documentation and actual evidence/root artifacts. No renderer/state/authority change, new dependency/request/frame loop, dead caption CSS, new filler or unrelated source found. No source finding needed correction or another root run. Final ticket/progress/checkpoint metadata is recorded afterward without changing runtime bytes. Exact16-path local staging/commit is authorized; actual owner visual acceptance remains pending, Q held, guide paused and RM-016 Planned. Deviations: none.


20 October checkpoint reconciliation: AB exact16-path checkpoint committed6db513e. Actual owner acceptance remains pending; the next request temporarily hiding comparison is owned by AC.
