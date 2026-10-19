# RM-015I — Make active motion a permanent rule

Status: **Planned**
Planning date: **19 October 2026**
Owner todo: **9/10 — Permanent animation priority** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015H](RM-015H-remove-demo-commentary-from-product-copy.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Record owner priority and recurring no-demo-commentary rule in current authority, superseding earlier presentation wording; exact room/command and rough-2D-first boundaries remain.
2. Document active motion across camera travel, visible rotation, object placement, panels, hero, scroll and loading; disallow animation-off/render-off settings and OS suppression.
3. Inspect actual implementation for any disabling setting, CSS media query or render invalidation path that freezes active transitions; fix only reproduced omissions within its owning ticket allocation.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `AGENTS.md`
- `docs/ROOMEDY.md`
- `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md`
- `docs/design/REVIEW_CHECKLIST.md`
- `docs/design/motion.md`
- `docs/commit-plans/RM-015I.md`, `docs/validation/RM-015I.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [ ] Record owner priority and recurring no-demo-commentary rule in current authority, superseding earlier presentation wording; exact room/command and rough-2D-first boundaries remain.
- [ ] Document active motion across camera travel, visible rotation, object placement, panels, hero, scroll and loading; disallow animation-off/render-off settings and OS suppression.
- [ ] Inspect actual implementation for any disabling setting, CSS media query or render invalidation path that freezes active transitions; fix only reproduced omissions within its owning ticket allocation.
- [ ] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [ ] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Source reachability/motion-control review, current UX motion inventory, local Markdown link and whitespace checks.
- Documentation-only changes use source checks; implementation fixes require scoped behavioral verification and applicable established gates.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015I.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015J.
