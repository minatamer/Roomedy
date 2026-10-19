# RM-015A — Establish motion-first interactions

Status: **Complete locally — actual joint visual/physical evidence pending**
Planning date: **19 October 2026**
Owner todo: **1/10 — Existing UI motion** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015 current local checkpoint](RM-015-verify-responsive-accessible-and-performant-experience.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Inventory, catalogue, inspector, room, checks and assistant changes receive coordinated entrance and real height/layout transitions without recreating the session or losing drafts.
2. Entry/review state transitions, preview actions, messages, selection and loading have deliberate bounded motion. Existing smooth scrolling, plan/cutaway interpolation and active spinners remain.
3. Motion can be interrupted or reversed; owned animations/observers are cancelled on unmount. No repeated animation on typing or per-frame semantic updates.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/room-editor/use-surface-motion.ts`
- `apps/frontend/src/features/room-editor/editor.tsx`
- `apps/frontend/src/features/room-editor/editor.module.css`
- `apps/frontend/src/features/session/entry/guest-entry.tsx`
- `apps/frontend/src/features/room-intake/intake.tsx`
- `apps/frontend/src/features/assistant/assistant.module.css`
- `apps/frontend/src/app/globals.css`
- `docs/commit-plans/RM-015A.md`, `docs/validation/RM-015A.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] Inventory, catalogue, inspector, room, checks and assistant changes receive coordinated entrance and real height/layout transitions without recreating the session or losing drafts.
- [x] Entry/review state transitions, preview actions, messages, selection and loading have deliberate bounded motion. Existing smooth scrolling, plan/cutaway interpolation and active spinners remain.
- [x] Motion can be interrupted or reversed; owned animations/observers are cancelled on unmount. No repeated animation on typing or per-frame semantic updates.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Inventory -> inspector -> chat with draft retained; preview Apply/Cancel/Undo; source/condition/back; intake review/error.
- Inspect 1280x720 and 390x844 actual surfaces and active transition intervals. Run focused session/lifecycle checks and settled pnpm check.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015A.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015B.

## Actual local outcome

[Receipt](../validation/RM-015A.md): seven source paths, native panel/entry/review/assistant motion and frame observations, actual fake preview/Apply/Undo, narrow composer/field errors, settled346-test/seven-boundary/root/build gate and clean read-only pass1. No new dependency or domain/provider rule changes. B–J remain future implementation, with actual visual review after J.
