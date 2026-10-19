# RM-015B — Animate the landing room

Status: **Planned**
Planning date: **19 October 2026**
Owner todo: **2/10 — 3D-related landing hero** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015A](RM-015A-establish-motion-first-interactions.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Hero presents a convincing dimensional room reveal and coordinated furniture rearrangement; retain the real supported sample geometry and readable message/CTA.
2. Automatic introduction finishes within five seconds; user-triggered preview/Apply/Undo replay smooth movement. Scroll CTA moves smoothly and lands on its actual section.
3. Hero remains lightweight, responsive and independent of the heavy studio controller/provider. No runtime remote media/assets or invented live response.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/landing/room-story.tsx`
- `apps/frontend/src/features/landing/landing.tsx`
- `apps/frontend/src/app/globals.css`
- `docs/commit-plans/RM-015B.md`, `docs/validation/RM-015B.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [ ] Hero presents a convincing dimensional room reveal and coordinated furniture rearrangement; retain the real supported sample geometry and readable message/CTA.
- [ ] Automatic introduction finishes within five seconds; user-triggered preview/Apply/Undo replay smooth movement. Scroll CTA moves smoothly and lands on its actual section.
- [ ] Hero remains lightweight, responsive and independent of the heavy studio controller/provider. No runtime remote media/assets or invented live response.
- [ ] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [ ] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Actual automatic sequence and user replay at phone and short laptop; CTA first viewport and anchor scroll.
- Confirm cold landing does not construct a studio canvas/worker/provider; settled frontend/root gate and read-only review.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015B.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015C.
