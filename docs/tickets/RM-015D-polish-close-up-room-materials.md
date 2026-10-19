# RM-015D — Polish close-up room materials

Status: **Planned**
Planning date: **19 October 2026**
Owner todo: **4/10 — Interior visual quality** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015C](RM-015C-add-smooth-interior-camera-exploration.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Furniture geometry, edge detail, floor/wall surfaces, coherent material variation and lighting/shadows hold up at interior camera distance, retaining warm stylized character.
2. Any generated local material textures are small, owned and disposed; no purchased assets or arbitrary remote downloads. Improve procedural shapes without stretching fixed assets or changing physical truth.
3. View interiors from all preset angles for exposed backs, gaps, intersections, shadow artifacts and aliasing. Preserve same-size graceful asset fallback and finite resource budgets.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/room-view/scene.tsx`
- `apps/frontend/src/features/room-view/representations/definitions.ts`
- `apps/frontend/src/features/room-view/assets.ts`
- `docs/design/catalogue.md`
- `docs/design/room-view.md`
- `test/room-view.test.ts`
- `docs/commit-plans/RM-015D.md`, `docs/validation/RM-015D.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [ ] Furniture geometry, edge detail, floor/wall surfaces, coherent material variation and lighting/shadows hold up at interior camera distance, retaining warm stylized character.
- [ ] Any generated local material textures are small, owned and disposed; no purchased assets or arbitrary remote downloads. Improve procedural shapes without stretching fixed assets or changing physical truth.
- [ ] View interiors from all preset angles for exposed backs, gaps, intersections, shadow artifacts and aliasing. Preserve same-size graceful asset fallback and finite resource budgets.
- [ ] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [ ] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Compare overview and eye-level in empty/partial/furnished samples, palette changes, fallback and repeated view switches.
- Named active-frame/resource observations for representative and near-limit scenes; physical GPU/heap remains separately pending. Settled pnpm check.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015D.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015E.
