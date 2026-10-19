# RM-015H — Remove demo commentary from product copy

Status: **Implemented locally — owner visual approval pending**
Planning date: **19 October 2026**
Owner todo: **8/10 — Concise product language** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015G](RM-015G-complete-sample-assistant-parity.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Remove recurring demo/prototype/development/simulation-warning sentences and filler from landing, assistant, intake and all relevant loading/restored/error variants. Use task-oriented entry labels such as Start designing.
2. Keep concise actionable field units/errors and essential transfer information at the relevant action; do not replace deleted filler with new filler.
3. Presentation never changes actual fake/live availability, privacy, transport, geometry or resource enforcement, and authored photo data is never silently represented as detected personal furniture.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/landing/landing.tsx`
- `apps/frontend/src/features/landing/room-story.tsx`
- `apps/frontend/src/features/assistant/assistant.tsx`
- `apps/frontend/src/features/room-intake/intake.tsx`
- `apps/frontend/src/features/session/entry/guest-entry.tsx`
- `packages/spatial/src/assistant.ts`
- `apps/backend/src/assistant/tools.ts`
- `docs/commit-plans/RM-015H.md`, `docs/validation/RM-015H.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] Remove recurring demo/prototype/development/simulation-warning sentences and filler from landing, assistant, intake and all relevant loading/restored/error variants. Use task-oriented entry labels such as Start designing.
- [x] Keep concise actionable field units/errors and essential transfer information at the relevant action; do not replace deleted filler with new filler.
- [x] Presentation never changes actual fake/live availability, privacy, transport, geometry or resource enforcement, and authored photo data is never silently represented as detected personal furniture.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Inventory all rendered copy variants; inspect landing, entry, sample chat, own-room selection/review, unknown/error/restored states at phone/short laptop.
- No static-copy mirror tests; use focused functional checks only if behavior changes, then applicable settled gate/read-only full diff.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015H.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015I.

## Refined plan before implementation

[Exact17-path allocation and branch-by-branch copy plan](../commit-plans/RM-015H.md) identifies landing/entry/intake/editor/chat removals, concise essential context and honest sample-sketch labels. Runtime/transport/privacy/geometry/measurement/motion authority stays unchanged. Existing Apply regression will count behavior rather than old technical wording; no new static-copy tests.

## Result

[Execution and clean read-only pass1](../validation/RM-015H.md):21 allocated paths,399tests/root/both builds, actual phone/short-laptop review/error/chat/recovery. No actionable findings. Exact local commit follows; I/J and actual owner visual approval remain.
