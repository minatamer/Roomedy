# RM-015BA — Plan label fit

20October2026; clean parent bc8cef3. [Ticket](../tickets/RM-015BA-fit-plan-labels-to-furniture.md), [12-path allocation](../commit-plans/RM-015BA.md). Owner requests a sideways whole word inside the tall narrow wardrobe, not stacked letters. Actual owner visual approval remains pending.

## Implementation and focused verification

One plan adapter uses the actual projected footprint and resolved compact/category name. Whole text rotates -90 degrees only if the tall footprint needs its longer axis; short Bed/Desk names remain horizontal even if furniture rotates. Type is capped at the existing185mm/TV135mm with inner space and cross-axis fit. TV captions preserve horizontal orientation/type because the intentionally thin footprint cannot contain them; wall-mounted room-side offsets remain unchanged. Unknown dimensions preserve the existing circular marker/name/question mark. Shared elevation label coverage, pointer/keyboard/accessible names, front chevrons, selected outline and physical/command/3D authority remain unchanged. Label rotation/type size use existing180ms finite CSS timing; no frame/canonical/history work.

Seven meaningful layout regressions cover four wardrobe turns/nonmutation, short names on tall/rotated beds, narrow shelf, square cabinet/shallow bounds, both TV placements and unknown fallback. Latest focused plan/catalogue suites pass39tests/2files in .release/BA-focused-final.log. No CSS/static-label mirror test or added dependency.

## Actual native observations

Disposable fresh manual furnished room on sole hot-reload4320/private4321, fake-ready; existing user tab untouched. At1280×720 the selected wardrobe label rotates -90 and occupies23×97.69px inside67.45×134.90px; Bed/Desk/Chair remain horizontal, narrow Shelf sideways. Word is readable as a whole. Existing physical front and selected outline remain visible. Initial left nudges/rotation near the wall correctly reject access/boundary conflicts without changes. Move down300mm/left300mm through ordinary keyboard edits then clockwise rotation succeeds: wider wardrobe gets rotate(0), Rotate piece receipt. One actual Undo restores rotate(-90), Last change undone. Zoom in and Fit room preserve orientation and selection. No validation rule or lock change.

Short1280×600: label19×80.09px inside55.03×110.07px. Phone390×844: label14×57.70px inside39.58×79.15px; document width375px fits viewport. Narrow320×568: label11×46.56px inside31.5×63px, document width305px fits viewport; normal document scrolling remains. No captured browser errors. Temporary viewport reset and test tab47 closed before settled gate. These are actual feature-owned observations, not a full-device/physical/accessibility/motion performance certification; proposal/restored/unknown/TV paths have source/helper coverage, no separate native fixture claim.

Screenshots in C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/: RM-015BA-wardrobe-plan.png (final-source fresh selected narrow wardrobe), RM-015BA-wide-wardrobe.png, RM-015BA-short-plan.png, RM-015BA-phone-plan.png. Desktop and phone images visually inspected.

## Read-only review and remaining gate

Pass1 reviews the exact12 allocated paths, helper caller and neighboring footprint/elevation/rotation authority. Meets ticket; no actionable findings. Covered whole-word orientation, no unnecessary short-name rotation, physical/semantic separation, caption/unknown fallback and native rotation/Undo/zoom/responsive observations. No schema/provider/storage/3D alteration. TV captions were explicitly preserved during implementation before this settled review. Required full root/both-build/exact-byte gate passed below; Q held, guide paused, RM-016 Planned. No paid/live/config/delegation/new services/ports/push/deploy.


## Settled gate and closeout

Telemetry-disabled pnpm check passes format, lint, all types,7 executable boundaries, exact asset verification,843 tests/56files and both builds. Log: .release/local-apps/run-20261020-ab0cdbf3/BA-check.log. Exact before/after inventories agree:269 inputs/3,375,839bytes; production BUILD_ID equals input digest7ca02f50dba906db4336e9158ddb338cacf2a89a510e78808137f1e4743b5def. All4 reviewed executable/test hashes remain unchanged. Production artifact remains distinct from hot reload.

After the gate, fresh native tab48 confirms actual default1280×720, fresh authored room, skipped welcome, precision2D and selected wardrobe rotate(-90). Final desktop screenshot refreshed and visually inspected; temporary tab closed. No user-room mutation. Final12-path read-only closeout: Meets ticket, no actionable findings; all local Markdown targets resolve. Only allocated paths enter the authorized local Git checkpoint. Build-state helper returns visual review to awaiting_owner, with no owner approval inferred. Q held, guide goal paused, RM-016 Planned. No paid/live/config/delegation/new dependency/service/port/push/deploy.
