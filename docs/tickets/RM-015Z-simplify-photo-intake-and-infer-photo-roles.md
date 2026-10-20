# RM-015Z — Simplify photo intake and infer photo roles

Status: **Locally verified; read-only pass1 clean, committed59dae0a, owner visual acceptance pending**, follows Y27b0130. Q held, guide paused, RM-016 Planned and actual visual approval pending.

Read the full [27-path implementation/acceptance plan](../commit-plans/RM-015Z.md), [blueprint sections5.6/6](../ROOMEDY.md#56-how-photos-become-an-editable-room), [image intake](../engineering/image-intake.md), [recognition authority](../engineering/room-recognition.md), [layout](../design/layout.md), [feature checklist](../design/REVIEW_CHECKLIST.md) and [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] Remove screenshot-marked redundant content and all visitor photo-type selection; retain the useful animated guide/gallery/viewer/errors.
- [x] Balanced responsive cards; real photo draft action beside selected uploads, no disabled duplicate in example card.
- [x] Automatic room/furniture/unknown source understanding through bounded real/fake schema, prompt, manifest and correction-safe review; unknown/detail sources never establish room scale.
- [x] Meaningful mixed/detail/unknown/correction/lifecycle regressions, native responsive/fake journey, settled root/exact build.
- [x] Read-only validation clean with no actionable findings; exact authorized local checkpoint prepared. Actual owner/live/physical acceptance remains separate.

20 October follow-up: the selected-photo action is now **Continue ↗**, reusing the landing's global `button primary` classes. The explicit draft action and its existing visibility, availability and busy guards remain. [Scoped allocation](../commit-plans/RM-015Z.md#continue-cta-follow-up-allocation--20-october-2026) and [actual verification](../validation/RM-015Z.md#continue-cta-follow-up--20-october-2026) distinguish this hot-reload correction from the historical production gate; owner visual acceptance remains pending.
