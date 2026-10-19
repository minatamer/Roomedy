# RM-015G — Complete sample assistant parity

Status: **Implemented locally — external evidence pending**
Planning date: **19 October 2026**
Owner todo: **7/10 — Useful fake/sample flow** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015F](RM-015F-deliver-conversational-design-assistance.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Sample mode supports complete coherent conversations across empty/partial/furnished rooms, using the same semantic preparation/tools/geometry/preview/Apply/Undo contracts as the real adapter.
2. Authored offline interpretation handles the documented design stories and follow-ups, produces meaningful computed changes or specific grounded alternatives, and does not return canned success for an unrelated room.
3. Keep real-provider unavailability honest without repeated product-mode banners. Compare fake and injected-live protocol outcomes for equivalent supported intent; do not claim live interpretation was tested.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/backend/src/assistant/fake.ts`
- `apps/backend/src/assistant/tools.ts`
- `apps/frontend/src/features/assistant/controller.ts`
- `test/fixtures/assistant.ts`
- `test/assistant-tools.test.ts`
- `test/assistant-lifecycle.test.ts`
- `docs/evaluation/README.md`
- `docs/commit-plans/RM-015G.md`, `docs/validation/RM-015G.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] Sample mode supports complete coherent conversations across empty/partial/furnished rooms, using the same semantic preparation/tools/geometry/preview/Apply/Undo contracts as the real adapter.
- [x] Authored offline interpretation handles the documented design stories and follow-ups, produces meaningful computed changes or specific grounded alternatives, and does not return canned success for an unrelated room.
- [x] Keep real-provider unavailability honest without repeated product-mode banners. Compare fake and injected-live protocol outcomes for equivalent supported intent; do not claim live interpretation was tested.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- End-to-end sample furnish, work-area move, less-cramped rearrangement, style follow-up, reference correction, Cancel/retry/Apply/Undo.
- Count zero metered dispatches; bounded lifecycle/protocol parity and actual browser sample chat; settled pnpm check.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015G.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015H.

## Refined plan before implementation

[Exact allocation (extended to17 paths) and sample/protocol plan](../commit-plans/RM-015G.md) builds on F’s clean committed outcome. Actual fixture baseline already finds valid empty/partial/work candidates within existing bounds; retain the optimizer/fixtures and add authored context-aware interpretation, state-aware choices, useful grounded no-candidate alternatives, concise mode presentation and complete current sample/real-adapter fixture evidence. Historical evaluation misses remain dated evidence, not silently replaced.

## Local completion

[Current sample stories, injected protocol parity, confirmed/fixed findings and clean pass2](../validation/RM-015G.md) record399-test/root/build gate, actual desktop/phone timed-worker conversations and unchanged measurement/command/runtime bounds. Actual live/physical/owner acceptance stays separate. Next is H’s complete product-copy cleanup.
