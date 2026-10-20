# RM-015AQ — Sensible initial furniture facing

20 October 2026. Parent `b617f1a`; clean worktree/index. Owner says initial furniture must use the front arrow sensibly, wardrobes should face usable room space instead of a wall, and AI planning must account for this. Implementation authority is the current direct request plus the standing ticket loop; actual visual approval remains separate.

## Exact allocation before edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AQ-place-furniture-with-usable-facing.md`
6. `docs/commit-plans/RM-015AQ.md`
7. `docs/validation/RM-015AQ.md`
8. `docs/reviews/2026-10-20-visual-feedback-checklist.md`
9. `docs/engineering/layout-search.md`
10. `docs/engineering/spatial-rules.md`
11. `packages/spatial/src/orientation.ts`
12. `packages/spatial/src/index.ts`
13. `packages/spatial/src/search/facts.ts`
14. `packages/spatial/src/search/engine.ts`
15. `apps/frontend/src/features/room-editor/catalogue-placement.ts`
16. `apps/frontend/src/features/room-editor/catalogue-panel.tsx`
17. `apps/frontend/src/features/session/fixtures/rooms.ts`
18. `apps/backend/src/assistant/assistant.ts`
19. `apps/backend/src/recognition/recognize.ts`
20. `test/furniture-orientation.test.ts`
21. `test/catalogue-placement.test.ts`
22. `test/fixtures/spatial-expectations.ts`

## Selected implementation

Keep the existing local+Z front convention, displayed arrows, access bands and complete hard validation. Correct the authored starter wardrobe to sit with its back near the east wall and front west into the room; review the other authored pieces for sensible access. This changes newly created fixtures only, with no migration or automatic rewrite of recovered/imported/accepted room poses.

Use a small pure bounded orientation helper to compare four initial quarter-turns using semantic footprints, room edges and furniture use bands, then a back-wall preference for wall-backed furniture. Unknown geometry remains unknown; chairs retain their separate facing/pull-out semantics. New catalogue previews can suggest facing until the visitor explicitly rotates; explicit rotation and replacement poses remain authoritative. Numeric new Add uses the same suggestion, then the normal command validator. No automatic correction of existing pieces, confirmed values or locks.

The shared browser/backend search ranks computed functional access before decorative space goals and prefers an authorized target's back toward a wall. Preserve fixed work, search bounds, exact action scope, starting locks, complete final validation, planned provenance and Apply/Undo. Recognition and assistant instructions explicitly define quarter-turn/front semantics: recognition preserves visible observations and marks occluded facing unknown; planning keeps wardrobes/storage accessible. No real provider call or new schema/rule is needed.

Add meaningful geometry, four-wall/obstruction/unknown/chair/manual-override/lock/search regressions. Verify fresh partial/furnished2D/3D, new Add/rotation, recovery and a fake assistant proposal at existing4320/private4321, including short/phone layouts. Run focused checks during iteration and the required telemetry-disabled root/both-build/current identity gate once settled. Full allocated read-only review, independent fixes/revalidation and exact local commit under standing authority. Actual visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/new dependency/service/port/push/deploy.

Before the dependent fixture edit: allocate path22 for the independent authored sample corners. The new wardrobe centre3850/3200 and1200×600 local size at quarter-turn1 give world X3550–4150 and Z2600–3800. Update those hand-derived literals, retaining the independent oracle rather than deriving expectations with the implementation.
