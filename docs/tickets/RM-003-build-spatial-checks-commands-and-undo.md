# RM-003 — Build spatial checks, atomic commands and Undo

Status: **In progress**  
Planning date: **17 October 2026**  
Milestone: **Foundation**  
Depends on: [RM-001](RM-001-initialize-workspace-contracts-and-safe-runtime.md), [RM-002](RM-002-prepare-catalogue-assets-and-room-fixtures.md)  
Suggested commit: `RM-003: build spatial checks atomic commands and undo`  
Authority: [blueprint §§8–10](../ROOMEDY.md#8-room-document-and-coordinate-contract), [geometry corpus §24.3](../ROOMEDY.md#243-geometry-and-command-corpus)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-13, L-15, L-19, L-21) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Implement the pure authority used by manual controls, review corrections, local search and backend assistant validation. It transforms bounded room data through typed commands and produces computed issue facts. No React, SVG, Three, environment, storage, network or worker API belongs inside `packages/spatial`.

Support integer-mm physical dimensions, bounded half-millimetre centres and quarter-turn poses. Structural validity is separate from arrangement quality: a real room may already contain conflicts. Preserve that description while rejecting new hard blockers. Unknown inputs produce unassessed or approximate results. A model cannot resize a retained bed, mark an estimate confirmed or unlock-and-move a protected object by including an extra action.

## Dependency evidence and proposed ownership

Confirm actual catalogue/front/mechanism definitions and policy. Own pure algorithms; frontend effects and rendering arrive later.

| Area | Responsibility |
| --- | --- |
| `packages/spatial/src/{coordinates,footprints,checks}` | Transforms, containment/overlap, modeled access and issue facts |
| `packages/spatial/src/{commands,proposals,history}` | Atomic evaluation, permissions, receipts and bounded whole-change Undo |
| `packages/contracts/src/{commands,issues}` | Public typed actions/issues and trusted-origin interface refinement |
| `packages/spatial` tests and independent fixture corpus | Hand-derived geometry and command/state invariants |
| `docs/engineering/spatial-rules.md` | Exact tolerances, mechanisms, repair predicate and unassessed limitations |

## Implementation plan

1. Implement center-to-corners, local front, wall interval and quarter-turn adapters. State positive axes and exact half-millimetre centre representation; display rounding never changes geometry. Geometry uses semantic dimensions; render bounds never enter rules.
2. Define explicit contact/tolerance policy for positive-area collision versus touching edges and functional clearance. Test thresholds exactly and one millimetre either side. Build issue identities from rule and involved objects/regions, not array order or total issue count.
3. Implement containment and supported solid/height collision checks. Define a conservative desk/chair relationship policy; only allow tucked-under overlap when the represented geometry supports it. Unknown height cannot create a false exception.
4. Model door swing, wardrobe access, chair pull-out and height/window/obstacle checks for the supported mechanisms. Prefer explicit conservative approximations with visible limitations over unsupported exactness. Entry-path connectivity is passed only if the actual bounded connectivity algorithm exists; otherwise its diagnostic remains unassessed with a precise reason.
5. Implement allow-listed add/move/rotate/remove/replace/resize/finish/lock/measurement commands with trusted application origin. Visitor controls may confirm a measurement or explicitly change locks; model data may only request such visitor action. Validate catalogue permissions, ownership and starting-state locks before evaluating the complete batch.
6. Evaluate final batches atomically so a coordinated swap is allowed if its final state is valid. Reject an invalid action, duplicate ID, unsupported variant or lock bypass without any partial change. A replacement is explicit, not a hidden resize of owned furniture.
7. Specify the deterministic baseline repair rule: introduce no new hard issue identities/regions and do not worsen remaining hard conflicts; repairs must improve at least one relevant conflict. Independent appearance-only changes can preserve disclosed baseline issues. Explicit visitor measurement correction may reveal issues and must preserve the corrected fact with warnings, rather than falsify the measurement to satisfy a layout rule. Test each command class separately.
8. Build proposal facts/diff and re-evaluation for Apply. Bind command receipt to room identity, expected revision, versions and exact payload. Duplicate Apply returns the existing receipt/safe already-applied result, never duplicate items; mismatched payload with reused ID rejects.
9. Implement one bounded history entry per accepted instruction or completed drag. Undo restores previous semantics as a new increasing revision, recomputes issues and preserves the immutable baseline. Count/byte budgets prune oldest entries deterministically. No Redo, photo restore, conversation rewind or provider effect.
10. Return structured codes, measured facts, dependent inputs and provenance status. No invented overall room score, certification or provider-written distance becomes a geometric fact.

## Prevention requirements from prior feedback

Keep structural validity, measurement uncertainty and arrangement blockers separate. A partial recognition hypothesis is not a reason to weaken geometric acceptance or demand invented dimensions. Focus tests on independent physical facts and command behavior; do not reorganize the pure engine or split its authority merely for a line-count target.

## Approved plan refinements — 17 October 2026

**Foundation contracts adopted before sign-off.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-01–PR-05 before completing this packet. Physical dimensions of an owned real item are bounded semantic truth, separate from catalogue representation eligibility; a correction outside the model range remains accepted with a procedural/limited placeholder representation. Offered new/replacement variants stay constrained. Track bounded source/review evidence for pose, front/rotation, wall association, hinge/mechanism and all numeric dependencies, including room dimensions; deliberate planned positions are distinct from measured photographed positions. Unknown/unsupported rules never become passes merely because no issue was emitted.

Use bounded half-millimetre centres and integer physical dimensions; doubled-integer arithmetic may express them internally. Define exact wire/round-trip behavior without hiding odd-size exact-fit failures behind an epsilon. Add bounded trusted visitor commands for feature add/remove/wall/hinge/mechanism corrections, with unambiguous typed targets or cross-kind ID uniqueness. Truthful physical corrections can reveal conflicts; model hypotheses cannot self-confirm or renovate the room.

Replace permanent receipt-capacity lockout with a bounded replay window and safe retirement protocol. Retired commands reject as stale; recent duplicates remain idempotent after Undo. Never evict an ID while allowing its old action to execute again. Keep this local registry separate from metered admission. Measure the conservative door envelope on independent cases; retain its disclosed limitation unless demonstrated false rejection justifies the bounded analytic sector under O-02.

## Acceptance criteria

- [ ] Coordinates and quarter-turn corners agree with independent expected values in all orientations.
- [ ] Supported collision/access/height rules return exact facts and honest approximate/unassessed states.
- [ ] Final coordinated batches validate atomically; any invalid action leaves the original room unchanged.
- [ ] Starting locks, retained dimensions and confirmation permissions resist model unlock/resize/confirmation bypasses.
- [ ] Baseline repair compares issue identities and severity/geometry, not only issue count.
- [ ] Measurement corrections retain new true values even when they expose a conflict.
- [ ] Apply is revision/version/payload-bound and idempotent; stale/replayed mismatches reject safely.
- [ ] Whole-change Undo increases revision and obeys both history budgets without effects or baseline mutation.
- [ ] Usable uncertain inputs receive explicit unassessed facts while structurally invalid data and new hard arrangement blockers still reject through the correct boundary.

### Additional approved acceptance — all unperformed

- [ ] Owned fixed/procedural items retain bounded corrected physical sizes outside representation ranges; offered unsupported new/replacement variants reject and original IDs/ownership remain intact.
- [ ] Confirmed dimensions with guessed pose/wall/hinge facts cannot create a confirmed assessment; each rule reports its actual dependency/coverage status.
- [ ] Odd/even dimensions at all quarter-turns support exact contact with half-millimetre centres, including command and JSON round trips.
- [ ] Trusted feature add/remove/wall/hinge/mechanism corrections and Undo use this evaluator; cross-kind ID ambiguity and model confirmation/renovation attempts reject.
- [ ] More than 256 actions and repeated no-ops remain usable under finite replay memory; retired/mismatched commands reject and duplicate Apply after Undo never reapplies.
- [ ] Independent door cases record conservative false rejection; a precision-sector change occurs only if justified and independently tested.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Rotated 1200×600 footprint at a known center | Independently calculated corners and extents, not another call to the same helper |
| Edge touch / 1 mm overlap / 1 mm clearance boundary | Exact expected classifications under the documented policy |
| Door hinge sides, wardrobe mechanisms, desk/chair relation, unknown sill | Supported mechanism facts and explicit unassessed cases |
| Two-object swap; one invalid action in a larger batch | Valid final swap and zero partial mutation on rejection |
| Unlock+move; owned resize; fake confirmed value; ID reuse | Protected state and origin enforcement |
| Same-count but different/worsened baseline blocker | Repair rejects despite unchanged total count |
| Apply twice; Undo after batch; history byte overflow | One receipt/change, increasing revision and deterministic pruning |

## Handoff and limits

Publish exact supported rule/mechanism policy and independent expected fixtures. RM-005 supplies effectful session ownership, RM-009 bounded search and RM-011 assistant integration. No solver success, real-room accuracy, UI rendering or external safety certification is established here. Follow the index's future execute/validate evidence requirements; all criteria are unperformed at planning time.
