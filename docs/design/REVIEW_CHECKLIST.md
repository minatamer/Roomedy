# Roomedy feature and visual review checklist

Prepared **17 October 2026**; every item below is **unperformed**. This is a reusable acceptance aid, not a visual pass or instruction to start implementation.  
Read [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [blueprint](../ROOMEDY.md) and the [owning ticket](../tickets/README.md).

## Use during each feature

Before edits, identify the requested task, affected component/states, existing authority and relevant lesson IDs. Record the actual changed files and intended checks. Choose routine details within selected scope; raise a material product change rather than adding it silently.

- [ ] Every added label/control/card/setting has a useful documented task; no developer CTA, filler slogan, duplicate status row or unsupported capability appears.
- [ ] Removed copy is absent in all variants of the owning flow, including loading/error/restored states; necessary approximation, transfer and validation information stays concise and contextual.
- [ ] Primary content and action fit the tested phone/tablet/short-laptop layout. Long panels have reachable actions; no clipped control, accidental dead column or unnecessary nested scrollbar.
- [ ] Roomedy platform palette/type/mark stay consistent while room finishes remain independent. Font loading/refresh causes no unintended lettering, wrapping or layout change.
- [ ] Padding, labels, units, primary action alignment, hover/focus borders, touch targets and selected/disabled/error states remain coherent with variable content.
- [ ] Dialog/panel opening, scroll, outside-click/Escape and focus restoration work without losing unsaved data. Optional chat expansion does not keep shrinking the room.
- [ ] Motion runs continuously and can complete/interruption-reverse safely. Related preview/progress/panel geometry animates together; ordinary entrances have no arbitrary delay.
- [ ] Loading uses honest stages and keeps useful work visible; no fabricated percentage, frozen spinner or unexplained full-page interruption.
- [ ] Chat has accessible Send, Enter/Shift+Enter/composition-safe behavior, a reachable composer and no scrollbar/icon overlap. Object/issue cards focus the correct actual room item.
- [ ] Every visible control changes real canonical state or gives a truthful unavailable result; no purely cosmetic selected state or invented confirmed measurement.
- [ ] Relevant views and loading/empty/error/restored states were actually inspected with the permitted tools; unperformed browser/physical checks stay explicit.

## Required room journeys and states

| Journey/state | What must be inspected in the actual app |
| --- | --- |
| Landing and entry | First viewport CTA; labelled scripted example; sample versus own-room choice is obvious; no unsolicited settings or price/budget claims |
| Authored sample | Immediate useful manual room without recognition or hidden provider request; coherent supported furniture/locks |
| Personal photo selection | Previews/file checks only; concise guidance inside upload; add/remove; explicit **Draft my room** action |
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

## Efficiency, safety and completion

- [ ] Use hot reload/scoped restart for iteration and preserve configured manual runtime mode. Tests separately force fake/paid-off before imports and cannot spend.
- [ ] Focused regressions cover actual behavior/races; applicable full gates run at the settled ticket/batch. No redundant full build for every cosmetic edit or inherited test waiver.
- [ ] Deterministic proof tests use controlled fresh/stale fixtures; strict release proof still rejects mismatched exact inputs.
- [ ] Private useful diagnostics remain; public UI/browser console/export/storage contain no raw photos, provider errors, secrets or room/chat payloads.
- [ ] Quality/security changes are proportionate, preserve functionality and finite controls, and introduce no speculative service/framework.
- [ ] Evidence names actual mode/corpus/viewport/input identity, commands/results and limitations. Fake, real-provider, Linux, hosted and owner evidence remain separate.
- [ ] The settled diff is reviewed read-only; actionable findings are independently confirmed/fixed/revalidated. Manual visual/security decisions remain with the owner at their named checkpoints.

Record real results in the owning `docs/validation/RM-###.md` when work is authorized. This checklist does not require irrelevant tests for every small edit, authorize a browser-policy workaround, supply paid/Git/cloud permission or replace the owner's actual visual review.
