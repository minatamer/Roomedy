# RM-015AV — Expand bedroom furniture and bathroom doors

20 October 2026; clean parent7d7d1da. Human selects mirrors, drawer shelving, TV stands and adjustable tabletop/wall TVs, useful bedroom furniture and a bathroom door in the existing single rectangular room. No bathroom room/furniture.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AV-expand-bedroom-furniture-and-bathroom-doors.md`
6. `docs/commit-plans/RM-015AV.md`
7. `docs/validation/RM-015AV.md`
8. `docs/references/bedroom-catalogue-2026-10-20.md`
9. `packages/contracts/src/catalogue.ts`
10. `packages/contracts/src/room.ts`
11. `packages/contracts/src/issues.ts`
12. `packages/contracts/src/intake.ts`
13. `packages/spatial/src/catalogue.ts`
14. `packages/spatial/src/index.ts`
15. `packages/spatial/src/elevation.ts`
16. `packages/spatial/src/checks.ts`
17. `packages/spatial/src/commands.ts`
18. `packages/spatial/src/orientation.ts`
19. `packages/spatial/src/size-presets.ts`
20. `packages/spatial/src/medy-language.ts`
21. `packages/spatial/src/medy-edits.ts`
22. `packages/spatial/src/search/engine.ts`
23. `apps/backend/src/assistant/fake.ts`
24. `apps/backend/src/assistant/tools.ts`
25. `apps/backend/src/assistant/assistant.ts`
26. `apps/frontend/src/features/catalogue/catalogue.ts`
27. `apps/frontend/src/features/room-editor/catalogue-panel.tsx`
28. `apps/frontend/src/features/room-editor/catalogue-placement.ts`
29. `apps/frontend/src/features/room-editor/room-panel.tsx`
30. `apps/frontend/src/features/room-editor/inspector.tsx`
31. `apps/frontend/src/features/room-editor/mount-controls.tsx`
32. `apps/frontend/src/features/room-editor/messages.ts`
33. `apps/frontend/src/features/room-editor/checks-panel.tsx`
34. `apps/frontend/src/features/plan-view/adapter.ts`
35. `apps/frontend/src/features/plan-view/plan.tsx`
36. `apps/frontend/src/features/room-view/adapter.ts`
37. `apps/frontend/src/features/room-view/scene.tsx`
38. `apps/frontend/src/features/room-view/surfaces.ts`
39. `apps/frontend/src/features/room-view/representations/definitions.ts`
40. `apps/frontend/src/features/design-export/scene.ts`
41. `apps/frontend/src/features/design-export/portfolio.ts`
42. `apps/frontend/public/catalogue/manifest.json`
43. `scripts/prepare_catalogue.py`
44. `scripts/prepare_catalogue_thumbnails.py`
45. `test/bedroom-catalogue.test.ts`
46. `apps/frontend/public/catalogue/thumbnails/mirror.svg`
47. `apps/frontend/public/catalogue/thumbnails/drawer-shelf.svg`
48. `apps/frontend/public/catalogue/thumbnails/chest-drawers.svg`
49. `apps/frontend/public/catalogue/thumbnails/bedside-drawers.svg`
50. `apps/frontend/public/catalogue/thumbnails/tv-stand.svg`
51. `apps/frontend/public/catalogue/thumbnails/tv-tabletop.svg`
52. `apps/frontend/public/catalogue/thumbnails/tv-wall.svg`
53. `apps/frontend/public/catalogue/thumbnails/armchair.svg`
54. `apps/frontend/public/catalogue/thumbnails/bench.svg`
55. `apps/frontend/public/catalogue/thumbnails/side-table.svg`
56. `apps/frontend/public/catalogue/thumbnails/floor-lamp.svg`

## Design and verification

Add eleven repo-native procedural entries, bounded common size presets, shared immutable catalogue thumbnails and existing materials. Reuse selected transient drawer articulation; drawers remain closed in semantic exports. Canonical optional bottomY placement retains backwards-compatible floor poses, shared planned provenance, position locks, atomic commands/Undo and vertical intersection/ceiling checks. Wall TVs attach their back to the chosen wall; floor placement helpers project them consistently in both views, numeric Add, rotation and MEDY. Basic mounting controls offer useful wall/height choices; precise height is Advanced. Tabletop TVs have explicit height above the floor. Vertical geometry is shared with exports; no renderer-only floating or invented confirmed measurements.

Door purpose is optional room/bathroom metadata; the existing door feature owns its wall, width, hinge, opening, clearance and Undo. Preserve old imports and single-room schema. New category/alias handling must reach catalogue filtering, MEDY explicit edits and provider input without expanding authority. Read-only review, meaningful shared checks, actual short/narrow/desktop placement/drawer/TV/door interactions and local exports precede one settled root/both-build/exact-byte gate and exact local checkpoint. Owner actual visual approval remains pending; Q held, guide paused, RM-016 Planned. No paid/live/key/config/delegation/new dependency/service/port/push/deploy.

Allocation extension before integration: `packages/contracts/src/assistant.ts`, `packages/spatial/src/assistant.ts`, `packages/spatial/src/design.ts` own category filtering; `apps/frontend/src/features/design-export/facts.ts` owns export labels. Existing category maps must accept the expanded bounded registry.

Allocation extension before rendering/UI: `apps/frontend/src/features/room-view/window-glass.ts` shares its bounded reflection environment with mirrors; `apps/frontend/src/features/room-view/catalogue-ghost.tsx` owns elevated placement ghosts; actual2D owner is `apps/frontend/src/features/plan-view/plan-view.tsx` (replaces the nonexistent plan.tsx allocation).

Verification allocation before updating expectations: `test/catalogue.test.ts` expands category expectations and supplies actual entry variant to existing min/max geometry checks.

Review correction allocation: `packages/spatial/src/search/scope.ts` must require move authority when a wall-TV rotation also reattaches to another wall. The shared wall-mount fact records a finite physical deficit for monotonic repair. Existing dedicated tests are extended during implementation after independently reproducing the scope mismatch; validation then restarts read-only.

Native2D correction: a tabletop TV projected onto its stand exposed overlapping centre labels and insertion-order painting. Shared pure elevation sorting/label visibility now serve editor and PDF, with neutral TV footprints, correct compact furniture names and a readable room-side wall-TV label. Existing floor-only presentation is retained.

Final chat-review allocation before edit: `apps/frontend/src/features/room-editor/preview-change-list.tsx` must describe bottom-edge elevation and bathroom purpose in actual change rows. Native MEDY height preview applied the real750 mm change but exposed an empty generic detail row because the new pose axis was missing from the summary owner. Geometry ghosts already compare full semantics.

Final naming allocation before edit: `apps/frontend/src/features/assistant/assistant.tsx` and `apps/frontend/src/features/room-editor/editor.tsx` use the shared bathroom-door label on grounded chat cards, narrow Edit-properties navigation and read-only inspection. Inspector Remove uses the same name. No authority or layout owner changes.

Read-only pass2 independently traced replacement parity: MEDY copied the old TV bottomY into a floor representation, while numeric catalogue replacement correctly uses the new entry default. Strip the old vertical pose when constructing a replacement, preserving the explicit X/Z/front and new entry mounting defaults. A shared command regression reproduces TV-to-mirror replacement. Revalidate the frozen corrected snapshot.
