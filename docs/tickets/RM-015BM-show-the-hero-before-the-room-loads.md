# RM-015BM — Show the hero before the room loads

Status: **Owner approved; exact ten-path checkpoint authorized**. Base0594f1a. Direct owner feedback21October2026 supersedes P's earlier instruction to hide hero text until graphics readiness. Latest “looks good” accepts the final initial fade/slide/house reveal and explicitly authorizes the [file-level checkpoint](../commit-plans/RM-015BM.md#approved-atomic-checkpoint--21-october2026), then deployment with paid mode on. Earlier local-only/no-Git notices are the prior review boundary, not current authority.

## Selected scope and authority

Owner: “title loads immediately centered, and smoothly goes to the left to its current positions when3d loads, in this case3d would fade in … do it locally first let me review it.” Follow-up: “fade in the text initially still tho cuz that looked good.” Begin the short text fade immediately, independently of3D readiness. Keep the existing title, paragraph, CTA, photograph, responsive final composition and actual prepared3D house/choreography. Public deployment remains the accepted8472b3db candidate; this correction is local only, with no staging/commit/deploy/paid call/configuration change.

Precision references: [allocation](../commit-plans/RM-015BM.md), [evidence](../validation/RM-015BM.md), [P](RM-015P-restore-smooth-landing-scrolling.md), [motion](../design/motion.md), [latest feedback](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), blueprint§4. Baseline Landing renders semantic hero copy on the server, ScrollRoom owns actual GPU ready/failure, and P's former CSS hides copy/cue while loading. BM replaces only that presentation gate and reveal timing. Reuse these owners; no timer, duplicate readiness state, new wrapper/controller/dependency, render suppression, rejected poster or new port.

## Acceptance and checks

- [x] First HTML/CSS paint starts the centered hero copy's short fade immediately, with active CTA/cue and no wait for3D, hydration or an arbitrary delay.
- [x] Actual ready signal moves the existing copy to its current left position while the prepared house fades in; retain independent scroll parallax and bounded scene choreography.
- [x] Narrow/short sizes keep copy/actions within the viewport and preserve the existing final composition; resizing, scroll/section navigation and entry/Back remain usable.
- [x] Graphics failure and no-JS retain readable usable content by default CSS/server markup and unchanged tested preparation/failure owners; no forced native fault/no-JS browser run is claimed. No recurring loading prose, hidden focus target, new motion loop, header divider or backend/provider change.
- [x] Existing focused landing checks, settled applicable root checks and actual local desktop/narrow/short/loading/ready observations are recorded; whole-diff read-only validation is clean.
- [x] Actual owner visual review — direct “looks good” after the360ms fade follow-up; exact staging/local commit and subsequent paid-mode deployment explicitly requested. No approval is inferred from tests/screenshots.

## Implementation

Remove the loading-opacity gate. Keep hero copy in its final normal-flow layout and translate its existing box horizontally to the viewport center before readiness. Animate only that horizontal offset independently of the existing scroll transform; use the real ready selector for the final zero offset and matching finite canvas fade. The hero's content container supplies its actual usable width after existing responsive gutters and the scrollbar. When a narrow layout already fills that width, its offset is naturally zero. Loading/failure/no-JS never hide semantic content or actions.

Check the actual browser on the sole local4320 URL. Use the normal owner-selected local environment without reading or editing secret values. Startup, if needed, follows run ownership/readiness rules. Landing review requires no provider request. Existing pinned readiness/preparation/motion tests cover unchanged GPU/cleanup constraints; do not add CSS mirror tests. Record real first-paint evidence separately from settled screenshots and do not claim hosted performance for a local correction.
