# RM-015P — Restore smooth landing scrolling

Status: **Implemented and locally verified; actual owner smoothness/visual review pending**. Dependency O committedbfcaa6f. Latest owner priority before lighting; actual result acceptance pending.

## Owner scope and precision references

Owner reports very laggy scrolling after photographic background additions and says tackle that first. Preserve selected warm photography, liked text style and all room/control motion while reducing actual rendering/update cost; do not substitute prior callback samples for their experience. [Exact20-path plan](../commit-plans/RM-015P.md), [blueprint §4](../ROOMEDY.md#4-landing-and-guest-entry), [lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [layout](../design/layout.md), [motion](../design/motion.md), [performance](../design/performance.md), [checklist](../design/REVIEW_CHECKLIST.md), [O evidence](../validation/RM-015O.md), [P evidence](../validation/RM-015P.md).

## Acceptance

- [x] Warm licensed photography/text treatment and full room/control motion retained; no animation suppression, new lighting or unrelated feature.
- [x] Active photo source pixels at most half O and chosen encoded bytes reduced by at least49% (39byte desktop precision disposition in plan); remove redundant filtered/masked/crossfading viewport layer and retired runtime files, without degrading retained image/3D quality or adding dependencies/services.
- [x] One bounded passive measurement batches reads before writes, caches stable references/unchanged styles, scopes parallax to its leaf and retains cleanup/reverse behavior.
- [x] Center the existing Explore the room arrow/label group above chapter shading, with stronger contrast and safe normal flow; apply owner-requested small header-only frosted CTA; retain real readiness, shorten reveal fade and deprioritize decorative image fetch.
- [x] Owner-selected readiness-driven hero/cue fade: actual ready or graphics failure reveals, keyboard focus/no-JS keep useful content, no arbitrary timer/new loop or competing poster.
- [x] Actual baseline/final startup/scroll/rapid/section/entryBack and nine-size/short/source-boundary image/canvas/action geometry evidence, with honest callback-vs-compositing limits and no universal device claim.
- [x] Focused/root/build/exact runtime identity/docs and whole-ticket read-only validation pass; exact owned local checkpoint prepared.
- [ ] Actual owner performance/visual acceptance — remains unchecked until given; guide goal paused, lighting Q and RM-016 Planned.
