# RM-005 — Deliver the canonical session and precision 2D editor

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Editable room**  
Depends on: [RM-003](RM-003-build-spatial-checks-commands-and-undo.md), [RM-004](RM-004-build-brand-landing-and-guest-entry.md)  
Suggested commit: `RM-005: deliver canonical session and precision 2d editor`  
Authority: [blueprint §§7–9](../ROOMEDY.md#7-workspace-and-manual-editing), [§17.3](../ROOMEDY.md#173-resource-ownership), [§20](../ROOMEDY.md#20-failure-and-recovery)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-02, L-03, L-06, L-07, L-15, L-17) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Make an authored room genuinely editable through an SVG plan, inventory and inspector controlled by one session authority. A visitor can select a piece, drag/snap/nudge it, rotate by quarter-turns, edit dimensions where permitted, add/remove supported furniture and change finishes. All accepted edits use RM-003 commands and update the room once.

The session controller also establishes the identity, baseline and asynchronous cleanup rules needed by later photos, workers and assistant effects. Do not postpone basic cancellation/expiry fencing until the lifecycle ticket. Full storage/export/comparison UI belongs to RM-012, but baseline capture and generation checks start here. This main-editor precision plan is distinct from RM-007's rough initial-review sketch.

## Dependency evidence and proposed ownership

Require actual passing spatial command/corpus evidence and usable entry routes. Reuse their catalogue and design foundations.

| Area | Responsibility |
| --- | --- |
| `features/session/{state,controller,effects}` | Sole accepted-room authority, identity/revision/operation fences and resource registry |
| `features/room-editor/` | Editor composition, inventory, inspector, goal/finish controls and command dispatch |
| `features/plan-view/` | SVG projection, view transforms, footprints/openings, interactions and check overlays |
| Shared spatial public commands/contracts | Only justified interface refinements; no view-specific geometry fork |
| Session/plan integration checks and design notes | Real gesture/keyboard behavior and lifecycle race cases |

## Implementation plan

1. Define explicit entry/intake/editor states without duplicating the room in components. On sample opening or accepted draft entry, capture a bounded immutable starting baseline alongside current semantics. Keep selection/camera/panels separate from physical room data.
2. Create workspace ID, monotonic generation, operation IDs, created-at and fixed two-hour expiry. Inject clock/IDs in tests. Enforce expiry at action entry as well as timer wake-up; lifecycle UI/storage is completed later. Register aborts, worker handles, photo resources and deferred writes under the owning generation.
3. Render the plan from center-pose millimetres through one documented SVG adapter. Show room outline, wall openings, furniture labels/fronts, dimensions and selected check regions. Pan/zoom and view transforms must not alter semantic coordinates.
4. Implement select, pointer capture, drag ghost, snap policy and a single validated drop. Transient movement creates no persisted revision/history until accepted; invalid drop shows the relevant issue and preserves current room. Cancelled pointer gestures leave no half-committed change.
5. Add numeric position/size controls, quarter-turn rotation and keyboard nudges as accessible alternatives. Distinguish display conversion/rounding from integer geometry. Retained dimension, position and rotation locks remain independent and visibly explained.
6. Add catalogue/inventory cards for **Keep**, **May replace** and removal from the plan. Explicit replacement respects actual physical dimensions; resizing owned furniture is not a hidden replacement. Confirm measurement changes with per-value source rather than converting every visible estimate to confirmed.
7. Wire one command dispatcher and common receipts/Undo. Manual changes invalidate any pending proposal/AI/search result before commit. New semantic goals invalidate operations that captured the old goal; camera/selection inspection does not spuriously change room revision.
8. Provide reusable candidate preview inputs distinct from accepted room data for RM-011. Every async completion checks workspace identity, generation, input revision and operation ID even after abort. Reset must fence late completion before releasing resources or creating a new workspace.
9. Surface unsupported/unknown checks with focusable object/issue cards. A baseline conflict remains disclosed after an unrelated finish change. Never display a global fit pass when a required dimension/mechanism is unknown.
10. Build responsive editor composition with focus-safe panels and concise goal/finish cards. Wire only supported controls; no direct 3D drag, extra layout comparison or price/budget flow. Sample/manual interaction works when AI is unavailable and costs zero calls.

## Prevention requirements from prior feedback

Keep room area useful when panels open, with consistent action placement and comfortable field/border padding. Label units and missing/invalid fields beside the actual control with a focus target. Inspect selected/excluded/blocked/unknown states as well as the happy path. Conditional chat expansion must preserve usable underlying room geometry; do not add a new expansion feature solely from the reference.

## Approved plan refinements — 17 October 2026

**One controller consumes refined physical authority.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Consume PR-01–PR-05 through the existing dispatcher: half-millimetre centre placement, true owned dimensions independent of representation range, complete feature corrections and finite replay retirement. Display unit conversion must preserve the exact semantic pose. A drag records a deliberate planned position and never certifies the original photographed position. Preserve source/review status for every physical fact used by checks and show relevant unassessed/approximate coverage without filler controls. Capture actual short-laptop/narrow states against the internal RM-004/005 visual baseline.

## Acceptance criteria

- [ ] One controller owns accepted room, baseline, revision, history and effect invalidation; views have no competing scene store.
- [ ] SVG footprints, opening positions and display measurements agree with independent geometry fixtures.
- [ ] Drag/snap/drop, rotate, numeric edit and keyboard nudge execute the shared validated command path.
- [ ] One completed drag creates one history entry; cancel/invalid drop creates none.
- [ ] Ownership, independent locks and explicit measurement provenance are editable through the intended trusted controls.
- [ ] Pending work becomes stale on semantic edits/reset/expiry/new operation, and late results cannot restore it.
- [ ] Baseline capture occurs at sample/accepted-draft editor entry and survives edits/Undo.
- [ ] Manual/sample operation remains useful without AI and records zero provider dispatches.
- [ ] Relevant phone/tablet/short-laptop panel and field-error states keep the room and next action usable without clipped controls, accidental empty columns or overlapping scroll regions.

### Additional approved acceptance — all unperformed

- [ ] Numeric/drag/snap/keyboard/Undo preserve half-millimetre centres and odd-size exact contact; planned pose never authenticates photographed placement.
- [ ] Feature corrections and out-of-representation owned measurement corrections use shared authority and retain honest geometry/representation limitations.
- [ ] Long bounded editing/replayed/no-op sessions remain usable and preserve stale-command rejection; feature states meet the recorded internal visual baseline.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| SVG scaled/panned then dragged or nudged | Known semantic coordinates after the interaction, including all quarter-turns |
| Pointer cancel, outside drop, locked item | No accidental revision/history change; accessible feedback |
| Numeric correction reveals existing overlap | Corrected value retained and new issue disclosed |
| Drag/Undo mixed with catalogue add/finish change | Shared whole-change history and immutable starting baseline |
| Pending fake request/worker completes after manual move/reset/expiry | Abort attempted and stale completion ignored independently |
| Camera/selection change during preparation | Geometry unchanged and valid request not rejected solely for inspection |
| Sleeping expiry timer then next action | Action rejects expired identity before mutation/work |

## Handoff and limits

Document controller interfaces, resource ownership and actual tested gestures. RM-006 consumes readonly room/selection/candidate projections; RM-007 uses the same review command authority; RM-011 adds proposals and RM-012 completes durable projection/compare. No storage, 3D, AI accuracy or final visual proof is claimed from this packet. Follow the index's future file allocation and settled validation rules.
