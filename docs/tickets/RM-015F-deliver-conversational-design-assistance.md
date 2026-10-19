# RM-015F — Deliver conversational design assistance

Status: **Implemented locally — external evidence pending**
Planning date: **19 October 2026**
Owner todo: **6/10 — Designer-like assistance** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015E](RM-015E-edit-furniture-directly-in-3d.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Support conversational references and follow-ups against current room, selected objects and bounded recent decisions: make it less cramped, improve work area, coordinate finishes, and revise a previous instruction.
2. Separate semantic interpretation/design advice from exact action authorization; remove the narrow keyword gate as the sole understanding path while enforcing independently captured kinds/targets/add/replace/remove scope at preparation and Apply.
3. Broader useful style/function/space suggestions explain actual tradeoffs, use supported catalogue/finishes and preserve protected/unknown measurements. Ambiguity asks one grounded question; conversation cannot self-confirm, unlock or silently broaden intent.
4. Real adapter can interpret bounded structured intent and supply constrained conversational guidance; schema-valid prose is not geometry proof. Preserve stateless serial rounds, deadlines, privacy and no paid dispatch.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `packages/contracts/src/assistant.ts`
- `packages/spatial/src/assistant.ts`
- `packages/spatial/src/search/facts.ts`
- `apps/frontend/src/features/assistant/controller.ts`
- `apps/frontend/src/features/assistant/assistant.tsx`
- `apps/backend/src/assistant/assistant.ts`
- `apps/backend/src/assistant/tools.ts`
- `test/assistant-intent.test.ts`
- `test/assistant-tools.test.ts`
- `test/assistant-lifecycle.test.ts`
- `docs/commit-plans/RM-015F.md`, `docs/validation/RM-015F.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] Support conversational references and follow-ups against current room, selected objects and bounded recent decisions: make it less cramped, improve work area, coordinate finishes, and revise a previous instruction.
- [x] Separate semantic interpretation/design advice from exact action authorization; remove the narrow keyword gate as the sole understanding path while enforcing independently captured kinds/targets/add/replace/remove scope at preparation and Apply.
- [x] Broader useful style/function/space suggestions explain actual tradeoffs, use supported catalogue/finishes and preserve protected/unknown measurements. Ambiguity asks one grounded question; conversation cannot self-confirm, unlock or silently broaden intent.
- [x] Real adapter can interpret bounded structured intent and supply constrained conversational guidance; schema-valid prose is not geometry proof. Preserve stateless serial rounds, deadlines, privacy and no paid dispatch.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Independent varied paraphrases, selected-object and follow-up requests, contradictory/negated constraints, malicious output, mixed supported batches and style-only changes.
- Verify canonical proposal in both views and whole Apply/Undo; injected real-adapter protocol fixtures, scoped adversarial tests, settled pnpm check. Actual live-model quality remains unchecked.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015F.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015G.

## Refined plan before implementation

[Exact allocation (extended to24 paths) and language/authority plan](../commit-plans/RM-015F.md) preserves the explicit compiler, adds bounded conversational resolution and a strict real-adapter design-intent clarification path. Model interpretation alone cannot prepare edits. Distinct palettes, current-fact design guidance, atomic layout/style and explicit open-space search include proposed furniture while preserving rearrange-owned semantics. F supplies foundational fake protocol handling; G owns expanded complete sample/parity evidence.

## Local completion

[Actual execution, two confirmed/fixed review findings and clean pass2](../validation/RM-015F.md) record384-test/root/build gate, injected real Responses protocol, computed desktop/phone proposals, conversational owned-finish correction and whole-change Undo. Actual live/physical/owner evidence stays separate; G is next.
