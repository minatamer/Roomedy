# RM-015C — Add smooth interior camera exploration

Status: **Complete locally**
Planning date: **19 October 2026**
Owner todo: **3/10 — Interior cameras** (ordered by implementation dependencies; coverage in queue)
Depends on: [RM-015B](RM-015B-animate-the-landing-room.md)
Authority: latest direct owner instruction in this chat: “we will tackle all these before our visual feedback session together” and “for each todo you will plan it thoroughly, document it in a ticket ... then execute then validate ... fix any findings ... validate again ... continue to next todo till u finish all my todos”. The ten-item agreed list immediately precedes that instruction. This authorizes this local revision round; it does not approve its visual result.
Precision references: [current blueprint](../ROOMEDY.md#owner-requested-pre-review-expansion--19-october-2026), [review checklist](../design/REVIEW_CHECKLIST.md), [motion policy](../design/motion.md), [existing cutaway](../design/room-view.md), [assistant policy](../engineering/assistant.md), [parent evidence](../validation/RM-015.md).

## Outcome and implementation plan

1. Provide overview plus meaningful doorway/desk/corner eye-level viewpoints and bounded interior look/movement with perspective appropriate to being inside one room.
2. Camera position, target, zoom/projection framing travel visibly between requested viewpoints; orbit/zoom/reset and new input interrupt the current journey without teleporting.
3. Keep usable interior walls, avoid camera-through-floor/wall/object viewpoints, preserve camera across view switching and Before/Current; camera changes never mutate room/history or dispatch providers.

Inspect current owners before edits, preserve existing working paths, and extend the allocation before touching another owner. Reuse pinned dependencies and current component/renderer/provider patterns. Document any necessary contract change explicitly. Each acceptance item below requires actual evidence; a checkbox or candidate commit is not proof.

## Exact proposed implementation ownership

- `apps/frontend/src/features/room-view/adapter.ts`
- `apps/frontend/src/features/room-view/camera.ts`
- `apps/frontend/src/features/room-view/cutaway.tsx`
- `apps/frontend/src/features/room-view/scene.tsx`
- `apps/frontend/src/features/room-view/room-view.module.css`
- `test/room-view.test.ts`
- `docs/commit-plans/RM-015C.md`, `docs/validation/RM-015C.md`, this ticket, and canonical progress through its helper.

## Acceptance criteria

- [x] Provide overview plus meaningful doorway/desk/corner eye-level viewpoints and bounded interior look/movement with perspective appropriate to being inside one room.
- [x] Camera position, target, zoom/projection framing travel visibly between requested viewpoints; orbit/zoom/reset and new input interrupt the current journey without teleporting.
- [x] Keep usable interior walls, avoid camera-through-floor/wall/object viewpoints, preserve camera across view switching and Before/Current; camera changes never mutate room/history or dispatch providers.
- [x] Applicable focused/manual/settled checks recorded, final full-scope read-only validation reports no actionable findings.
- [x] Scope/non-goals, limits and unperformed external/owner evidence remain explicit.

## Verification

- Check fixed/unknown room dimensions, different aspect ratios, rapid repeated preset clicks, keyboard and pointer orbit/zoom/look; reset and unmount.
- Camera pose/finite bounds regression tests, actual 3D transitions at narrow/short-laptop sizes, settled pnpm check.

## Shared boundaries and non-goals

- One rectangular bedroom/workspace; initial photo review remains rough 2D only. Preserve earthy website identity and independent room finishes.
- One canonical room, shared typed commands/geometry, atomic final Apply, whole-change Undo, per-value evidence and finite input/work/history/resource limits.
- No paid/live dispatch, purchased asset, deployment, push, reset-credit use or delegation. Real-provider, physical-device, Linux and hosted evidence are separate pending claims.
- Execute one packet, run focused meaningful checks and the applicable settled repository gate, then read-only validate the complete settled scope. Independently reproduce findings, fix, revalidate until no actionable findings, then continue.

## Handoff

Record real commands/results and findings dispositions in `docs/validation/RM-015C.md`; no source changes during validation. Existing exact-path per-ticket local commit authority remains scoped to validated owned work. Next packet is RM-015D.

## Refined plan before implementation

[Exact allocation and camera algorithm](../commit-plans/RM-015C.md) defines pure finite free-viewpoint/route/step policy, perspective fitting, focused keyboard/pointer looking, interruptible finite waypoint travel, same workspace camera ref and interior wall visibility. Existing OrbitControls remains the overview interaction; no new dependency or semantic authority. Unknown/packed rooms receive no fabricated viewpoint, and an unavailable floor path may travel above the open cutaway. Focused independent regressions and actual browser checks precede the root gate and read-only review.

## Local completion

[Actual receipt and two validation passes](../validation/RM-015C.md) record the350-test settled gate, actual interior/view/comparison/browser results, both independently confirmed/resolved findings and final clean read-only pass2. Actual owner/physical/production/live/Linux/hosted evidence remains pending.
