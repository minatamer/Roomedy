# RM-015E — Edit furniture directly in 3D

Status: **Implemented locally — external evidence pending**
Planning date: **19 October 2026**
Owner todo: **5/10 — 3D floor-plane editing** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015D](RM-015D-polish-close-up-room-materials.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. A clear manipulation interaction selects and drags eligible furniture on the floor X/Z plane and rotates using supported quarter-turns; camera gestures remain available and distinct.
2. Transient dragging shows immediate motion; release commits exactly one shared validated visitor command and Undo entry. Locks, geometry conflicts, read-only Before/preview and expiry fence changes.
3. Cancellation, rejected drops and capture loss restore accepted pose smoothly; no free vertical placement, arbitrary-angle schema change, duplicate geometry/state authority or per-frame history.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/room-view/cutaway.tsx`
- `apps/frontend/src/features/room-view/scene.tsx`
- `apps/frontend/src/features/room-view/manipulation.ts`
- `apps/frontend/src/features/room-view/use-floor-edit.ts`
- `apps/frontend/src/features/room-view/room-view.module.css`
- `apps/frontend/src/features/room-editor/editor.tsx`
- `docs/design/room-view.md`
- `docs/README.md`
- `test/room-view.test.ts`
- `test/session.test.ts`
- `docs/commit-plans/RM-015E.md`, `docs/validation/RM-015E.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] A clear manipulation interaction selects and drags eligible furniture on the floor X/Z plane and rotates using supported quarter-turns; camera gestures remain available and distinct.
- [x] Transient dragging shows immediate motion; release commits exactly one shared validated visitor command and Undo entry. Locks, geometry conflicts, read-only Before/preview and expiry fence changes.
- [x] Cancellation, rejected drops and capture loss restore accepted pose smoothly; no free vertical placement, arbitrary-angle schema change, duplicate geometry/state authority or per-frame history.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Drag/rotate then switch 2D/3D, Apply/Undo, locked object, conflict rejection, pointer cancel, expiry/unmount, narrow controls.
- Independent floor-ray/snap/commit tests plus current browser pointer operation and settled pnpm check.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015E.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015F.

## Refined implementation plan

[Exact allocation (extended to14 paths)](../commit-plans/RM-015E.md) defines explicit Explore/Move controls, floor-ray/mm/shared snap conversion, one owned finite transaction, display-only pose refs, synchronous lifecycle fencing and one existing shared command on release. Existing controller/adapter ownership needs no change; numeric/2D alternatives and deliberate motion remain.

## Local completion

[Execution and clean read-only pass1](../validation/RM-015E.md) record the360-test/root/build gate, actual desktop/phone drag/rotation/Undo/rejection/lock/preview checks and explicit physical/owner limitations. Next is F; actual visual approval remains pending.
