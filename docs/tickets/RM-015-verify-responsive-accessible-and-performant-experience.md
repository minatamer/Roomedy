# RM-015 — Verify the responsive, accessible and performant experience

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Performance and frontend visual review**  
Depends on: [RM-014](RM-014-prepare-linux-images-and-release-runbooks.md)  
Suggested commit: `RM-015: verify responsive interaction and measured performance`  
Authority: [blueprint §§7, 19–20](../ROOMEDY.md#19-visual-direction-and-accessibility), [§24](../ROOMEDY.md#24-testing-and-acceptance-evidence)  
Queue and execution rules: [ticket index](README.md)    
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01–L-17, L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)
Additional gate: **Present the actual frontend and stop for owner visual approval, requested revisions or explicit waiver/defer.**

## Outcome and standalone context

Finish a complete, usable Roomedy experience across phones, tablets and laptops, with deliberate motion and measured performance under finite bounds. Exercise the actual landing, rough 2D review and main-editor plan/cutaway/assistant/lifecycle. This ticket owns the build's performance investigation and frontend visual checkpoint; do not duplicate a second generic polish pass later.

Automated layout or synthetic tests do not establish actual visual quality or physical-device GPU behavior. Obtain the owner's decision on real available frontend/screenshots, with tested mode and limitations clear. A missing provider key does not justify skipping visual review of the sample/manual/fake-labelled experience.

## Dependency evidence and proposed ownership

Use the actual complete product and packaged candidate where available. Performance fixes go to their existing owning modules.

| Area | Responsibility |
| --- | --- |
| Landing/intake/editor/plan/cutaway/assistant features | Reproduced layout, interaction and motion corrections |
| Controller/worker/spatial/provider policy owners | Measured bottleneck fixes and single-policy refinement |
| Browser/product matrix and measurement helpers | Bounded repeatable scenarios and actual evidence |
| `docs/design/visual-review.md`, performance report | Screenshots, observed timings/resources, device limits and owner decision |
| Release proof inputs | Notify RM-019 of changes requiring refreshed packaging/runtime evidence |

## Implementation plan

1. Create a matrix spanning 320×568, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900 and 1920×1080, plus orientation/short-height cases. Record actual browser/OS/device/mode. Physical touch/GPU/assistive checks stay separate from desktop viewport simulation.
2. Verify first-viewport header/hero/visual/CTA, progressive entry, mobile panels, inventory/inspector, assistant keyboard opening and safe focus return. Prevent accidental page overflow, inaccessible clipped controls and chat/panel layouts that hide the selected room or Apply/Cancel actions.
3. Exercise all three room conditions and rough-review-to-editor progression. Initial review remains visibly a rough 2D sketch with no 3D control. In the main editor check plan/cutaway switching, camera/selection, precision controls, previews/check overlays, Before/Current and lifecycle notices.
4. Verify keyboard-only paths, numeric alternatives to drag, focus visibility/order, labels, live status announcements, dialogs/menus, contrast and non-color issue meaning. Keep motion present; improve clarity/readability without introducing animation-off/render-off controls or OS suppression.
5. Measure landing/editor bundle split, image decode/preparation peak memory, search work/elapsed/cancellation, drag responsiveness, frame/loading observations, history/project byte growth and repeated reset/view-switch resource behavior. Use representative small and near-limit rooms/photos and actual device observations where available.
6. Investigate bounded concurrency: worker versus pointer/render work, one AI operation/proposal per workspace, shared recognition/chat slots, simultaneous bridge/parser/provider copies and cancellation accounting. Fix structural waste or leaks with scoped regressions; never raise a limit just to hide an unbounded path.
7. Select/finalize numeric engineering policy from the measured evidence and one shared module. Document residual provisional/unmeasured values honestly. Preserve fixed two-hour lifetime and selected product scope. Model/account/cloud capacity cannot be inferred from a local benchmark.
8. Recheck relevant image/asset quality, stylized furniture, lighting/camera, sketch-to-studio motion, ghosts/change explanations and unsupported/failure/empty states. No fake live label or fit pass may be introduced for presentation convenience.
9. Present actual runnable frontend/available screenshots with mode, tested viewports and pending physical/live evidence. Ask the owner to approve as-is, request specific revisions or explicitly waive/defer. Only requested revision scope runs; after changes, re-present for the visual decision. Record trusted human wording and reviewed candidate identity.

## Prevention requirements from prior feedback

Consolidate evidence already gathered in the owning feature tickets; this is not the first time their controls/loading/error/mobile states are inspected. Add 1366x768 to the short-laptop matrix. Cover font cold-load/refresh, action reachability, composer/scrollbars, panel geometry, touch cues and all copy variants. Present only real available frontend evidence and its exact limitations.

## Approved plan refinements — 17 October 2026

**Measured failure thresholds and criterion-level accessibility.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-13/PR-14. Use the actual per-feature internal visual baseline and inspected short-laptop/narrow states; no new automatic owner gate is introduced. Before marking this packet passed, define practical measured budgets with browser/device or throttle, build mode, room/photo counts, cold/warm state and repetitions. Track discrete action latency separately from drag/orbit frame behavior, image-decode peak, search/abort latency and Apply/Undo motion; finiteness alone is insufficient. INP context is not a canvas-frame metric or a claimed Roomedy field result.

Keep active designed motion smooth. Automatic landing sequences settle within five seconds with stable readable content. Record criterion-level keyboard/focus/zoom/touch/motion checks and the selected non-extensible two-hour expiry's timing-adjustability limitation; warning/export alone is no blanket WCAG pass. Preserve expiry/motion product choices and the actual owner visual stop.

## Required local acceptance

- [ ] Complete product matrix records actual rendered interaction evidence and exact unperformed cases.
- [ ] Landing/entry/review/editor/assistant/lifecycle controls remain usable at tested sizes and orientations.
- [ ] Keyboard/numeric/focus/status/contrast checks support the core tasks without relying on pointer or color alone.
- [ ] Intended motion is preserved and rough initial review contains no 3D preview.
- [ ] Measured decode/search/render/storage/concurrency behavior is finite with reproduced defects corrected.
- [ ] Central policy reflects measured chosen values and explicitly retained uncertainty; no competing limits exist.
- [ ] Required settled checks and read-only validation pass for the scoped changes.
- [ ] Feature evidence plus cumulative review covers the recurring failure states and 1366x768 layout, with actual inspected screenshots and no unsupported visual/physical acceptance.

### Additional approved acceptance — all unperformed

- [ ] Named repeatable performance scenarios have practical thresholds and actual results for discrete actions, continuous frames, decode peak, search/abort and Apply/Undo; failures receive owning fixes.
- [ ] The internal feature visual baseline and current inspected states are reconciled without substituting for the actual owner review.
- [ ] Automatic landing motion settles appropriately, active interactions remain smooth, and criterion-level accessibility/expiry limitations are stated without blanket conformance.

## Manual/external acceptance — never inferred from automation

- [ ] Owner reviews the actual frontend/candidate and gives visual approval or an explicit scoped waiver/defer.
- [ ] Requested visual revisions, if any, are validated and returned for final owner review.
- [ ] Named physical-device/touch/GPU/assistive cases are performed, or explicitly remain pending/deferred with release implications.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Phone with keyboard and assistant/inspector panel open | Visible focused input and reachable preview controls without broken scroll |
| Near-limit photos and room with repeated resets | Actual bounded memory/work observations and cleanup |
| Active orbit/transition under idle rendering optimization | Intended frames continue until completion; controls never freeze |
| Search plus dragging and late cancellation | Responsive interaction and no stale candidate |
| Owner presentation | Exact candidate/screenshots/mode and trusted human decision, not a model's aesthetic verdict |

## Handoff and limits

RM-016 starts after the actual visual decision or explicit waiver/defer, not after an agent checks its own visual box. Keep physical/live/hosted evidence distinct. No testing tool restriction may be bypassed with an alternate renderer; record blocked checks and use permitted evidence. Follow the index's future execution/Git rules.
