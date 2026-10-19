# Roomedy feature and visual review checklist

Prepared and refined **17 October 2026**; the boxes below are an **unchecked reusable template**. Actual feature checks are recorded in their validation receipts; cumulative product/owner acceptance remains pending. This is a reusable acceptance aid under the approved fake-mode loop, not a visual pass. Adopted [review refinements](../reviews/2026-10-17-plan-review.md) supply requirements, not evidence.\
Read [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [blueprint](../ROOMEDY.md) and the [owning ticket](../tickets/README.md).

## Use during each feature

Before edits, identify the requested task, affected component/states, existing authority and relevant lesson IDs. Record the actual changed files and intended checks. Choose routine details within selected scope; raise a material product change rather than adding it silently.

- [ ] Every added label/control/card/setting has a useful documented task; no developer CTA, filler slogan, duplicate status row or unsupported capability appears.
- [ ] Removed copy is absent in all variants of the owning flow, including loading/error/restored states; necessary approximation, transfer and validation information stays concise and contextual.
- [ ] Primary content and action fit the tested phone/tablet/short-laptop layout. Long panels have reachable actions; no clipped control, accidental dead column or unnecessary nested scrollbar.
- [ ] Roomedy's website uses the selected oat/sand/beige/walnut/cocoa earthy wood palette; studio chrome may use black/white neutrals. Type/mark stay consistent and room/furniture finishes remain independent. Font loading/refresh causes no unintended lettering, wrapping or layout change.
- [ ] Padding, labels, units, primary action alignment, hover/focus borders, touch targets and selected/disabled/error states remain coherent with variable content.
- [ ] Dialog/panel opening, scroll, outside-click/Escape and focus restoration work without losing unsaved data. Optional chat expansion does not keep shrinking the room.
- [ ] Motion progresses smoothly while active and can complete/interruption-reverse safely. Automatic landing sequences settle within five seconds with stable readable text. Related preview/progress/panel geometry animates together; ordinary entrances have no arbitrary delay.
- [ ] Camera travel/orbit/zoom, visible placement/rotation, piece/floor/wall finishes and preview/Apply/Undo/Before interpolate from the displayed state. Demand frames wake for new targets and sleep only after settling. No animation-off/render-off setting or OS suppression; no frame writes canonical room/history.
- [ ] Loading uses honest stages and keeps useful work visible; no fabricated percentage, frozen spinner or unexplained full-page interruption.
- [ ] Chat has accessible Send, Enter/Shift+Enter/composition-safe behavior, a reachable composer and no scrollbar/icon overlap. Object/issue cards focus the correct actual room item.
- [ ] Every visible control changes real canonical state or gives a truthful unavailable result; no purely cosmetic selected state or invented confirmed measurement.
- [ ] Relevant views and loading/empty/error/restored states were actually inspected with the permitted tools; unperformed browser/physical checks stay explicit.

- [ ] Before stacking or reserving blank space, compare actual available width/height and existing useful tasks. Use [layout rules](layout.md): responsive adjacent tasks/cards, actual-column control rails, finite empty chat and matching focus breakpoints; no filler added to occupy space.
- [ ] Desktop→phone/short-height resize keeps optional guide Skip/Next, composer and Apply/Cancel in reachable scroll regions; inspect settled geometry after active motion.

## Required room journeys and states

| Journey/state | What must be inspected in the actual app |
| --- | --- |
| Landing and entry | First viewport CTA; owner-selected authored furniture3D scrolling journey/full-size meaningful chapters, without faux editor controls; sample versus own-room entry choice is obvious; no unsolicited settings, recurring demo commentary or price/budget claims |
| Authored sample | Immediate useful manual room without recognition or hidden provider request; coherent supported furniture/locks |
| Personal photo selection | Previews/file checks only; concise guidance inside upload; add/remove; explicit **Draft my room** or honest **Open sample sketch** action with actual transfer beside it |
| Draft review | Rough **2D only**, per-value uncertainty, source photo when available, targeted measurements and duplicate/missed-feature correction |
| Partial inference | Usable output retained for review; no restart just for a missed match; malformed/refused/timeout cases remain distinct |
| Main editor | Precision plan and synchronized cutaway use same room/selection; room remains usable beside inspector/chat |
| Ownership and checks | Independent locks, retained dimensions, unknown mechanism/height and baseline problems are visible and honest |
| Assistant | Friendly useful request → one grounded preview → Apply/Cancel → actual receipt/Undo; no raw diagnostics or fake live success |
| Comparison | Before is read-only and baseline stays fixed; active proposal resolved; same view/camera; no provider/history effect |
| Refresh/reset/import/expiry | Fixed two-hour semantic recovery; originals unavailable after refresh; no old request/write resurrection; invalid import preserves work |
| Busy/verification/provider failure | Quiet verification when supported; visible fallback when interaction is needed; finite server controls retained and manual work preserved |
| Tour, if used | Optional Start/Skip; actual target/layout/scroll readiness; card/highlight together; coherent focus and viewport changes |

## Size and interaction evidence

Use relevant cases while a feature is built; RM-015 consolidates the full matrix. Starting viewport set: **320×568, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1366×768, 1440×900 and 1920×1080**, plus orientation/keyboard-open and variable-content cases. Desktop emulation does not establish physical-device touch/GPU behavior.

- [ ] Keyboard-only core tasks, numeric alternatives to drag, focus order/visibility, meaningful field errors and non-colour issue labels work.
- [ ] Touch cues make sense on phones/tablets; no mouse-only hint or hover-only essential action.
- [ ] Screenshots are actual rendered states, inspected and named in task order with viewport/mode/candidate noted. Saving a screenshot file alone is not a pass.
- [ ] Changed panel/selection/loading behavior is checked at the width where it failed and at relevant adjacent sizes.

## Adopted physical, AI and release checks

- [ ] Owned true physical dimensions survive representation-range mismatch with an honest procedural/limited fallback; proposed variants stay strict. Half-millimetre centres, odd-size exact contact and round trips preserve geometry.
- [ ] Every relevant physical check dependency has honest evidence/coverage, including pose, wall, hinge/mechanism and room dimensions. Planned placement never authenticates the photographed position.
- [ ] Observation/entity/source/frame/scale reconciliation preserves reviewed corrections through similar pieces, conflicting photos, merge/split, order/removal and later dimensions; initial review remains 2D only.
- [ ] The next guided question addresses a relevant missing dependency. Targeted assistant action scope preserves unrelated unlocked furniture/finishes and is enforced again on Apply.
- [ ] Long/no-op/replayed editing stays bounded and usable; fixed-work search is reproducible, deadlines report visited work and backend scheduling preserves health/cancellation.
- [ ] Predeclared held-out room/object cases report exact counts, correction effort and failures; authority/false-confirmation/stale/fake/dispatch invariants have zero tolerated failures in the tested corpus.
- [ ] Provider schema projection, strict serial/stateless request flags, input-bound boot/process grants and disconnect-independent deadlines have actual fake boundary evidence; external retention/funded/scaling limits remain explicit.
- [ ] Actual feature screenshots match the internal visual baseline. Named performance scenarios have practical thresholds, device/build/count/cold-warm/repetition context and separate discrete-action versus continuous-frame results.
- [ ] Keyboard/focus/zoom/touch/motion and the selected fixed-expiry timing limitation have criterion-level dispositions; warning/export and a passing screenshot do not establish blanket WCAG conformance.
- [ ] Local two-build stale-client/chunk/worker/schema/rollback cases distinguish recoverable accepted semantics from transient photos/drafts; proof includes verified immutable action/base-image/platform/tool identities.
- [ ] O-01 remains a deferred comparison seam without model download/GPU/benchmark execution; O-02 precision follows measured false rejection and O-03 relevant questioning uses existing bounded dependencies.

## Efficiency, safety and completion

- [ ] Use hot reload/scoped restart for iteration and preserve configured manual runtime mode. Tests separately force fake/paid-off before imports and cannot spend.
- [ ] Focused regressions cover actual behavior/races; applicable full gates run at the settled ticket/batch. No redundant full build for every cosmetic edit or inherited test waiver.
- [ ] Deterministic proof tests use controlled fresh/stale fixtures; strict release proof still rejects mismatched exact inputs.
- [ ] Active-page photo/room/chat display remains allowed and useful; allow-listed current/baseline semantic recovery/export remains allowed. Original photos/chat/provider payloads/credentials/grants stay out of recovery/export, and private input content/raw failures stay out of diagnostic logs, public diagnostic envelopes, URLs and application browser-console logging.
- [ ] Quality/security changes are proportionate, preserve functionality and finite controls, and introduce no speculative service/framework.
- [ ] Evidence names actual mode/corpus/viewport/input identity, commands/results and limitations. Fake, real-provider, Linux, hosted and owner evidence remain separate.
- [ ] The settled diff is reviewed read-only; actionable findings are independently confirmed/fixed/revalidated. Manual visual/security decisions remain with the owner at their named checkpoints.

Record real results in the owning `docs/validation/RM-###.md` during authorized work. This checklist does not require irrelevant tests for every small edit, authorize a browser-policy workaround, supply paid/Git/cloud permission or replace the owner's actual visual review.


Landing-specific L checks: normal forward/back/anchor/keyboard scrolling, continuous room/camera/wall transitions, no sticky text occlusion, bounded scene/cleanup and usable poster/content without graphics. Preserve mark/palette/dot; center footer without domain. Verify opaque beige icon pixels, stable served PNG/ICO/SVG/Apple paths and actual root head declarations. Source any statistic with correct population/context; no fabricated software-adoption, savings or Google-indexing claims.

Current M full-room checks: canvas bounds cover the viewport at hero/workflow/value/final CTA/footer, including phones; text/actions remain readable and reachable inside that scene. Prepare upload/shader/shadow work plus exact initial pose before the visible entrance. Check cancellation/failure/unmount fencing and≤2million backing pixels separately from full CSS coverage. Compare three named initial entrances against reproduced baseline; record callback/frame limits honestly. Framework hash→entry→Back restores actual landing state; no split miniature, arbitrary delay or animation suppression.

M continued visual checks: furniture must visibly move/rotate with scroll, stay grounded and clear the room/other pieces across intermediate poses, finish with a purposeful window/work/rest arrangement and reverse continuously. Keep the owner-liked warm translucent card backgrounds and internal rules; inspect the outer shading blend between opposite-side chapters and at the footer instead of removing their style.
