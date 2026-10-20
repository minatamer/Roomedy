# RM-015BF — Window sizes and paired balcony doors

20October2026, clean parent92fe7b6. Latest direct owner request authorizes useful window sizes and paired large glass balcony doors at the room boundary, with size choices. No balcony exterior. Selected ticket owns implementation; actual visual approval remains pending.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BF-window-size-presets-and-balcony-doors.md`
6. `docs/commit-plans/RM-015BF.md`
7. `docs/validation/RM-015BF.md`
8. `docs/references/window-balcony-sizes-2026-10-20.md`
9. `docs/design/layout.md`
10. `docs/design/room-view.md`
11. `docs/engineering/assistant.md`
12. `packages/contracts/src/room.ts`
13. `packages/spatial/src/opening-sizes.ts`
14. `packages/spatial/src/index.ts`
15. `packages/spatial/src/elevation.ts`
16. `packages/spatial/src/medy-language.ts`
17. `packages/spatial/src/medy-edits.ts`
18. `apps/frontend/src/features/room-editor/room-panel.tsx`
19. `apps/frontend/src/features/room-editor/inspector.tsx`
20. `apps/frontend/src/features/plan-view/adapter.ts`
21. `apps/frontend/src/features/room-view/opening-parts.ts`
22. `apps/frontend/src/features/room-view/articulation.ts`
23. `apps/frontend/src/features/room-view/scene.tsx`
24. `apps/frontend/src/features/design-export/scene.ts`
25. `apps/backend/src/assistant/assistant.ts`
26. `test/opening-sizes.test.ts`
27. `test/design-export.test.ts`
28. `apps/frontend/src/features/plan-view/plan-view.tsx`

## Implementation and verification

1. Extend optional door purpose with balcony, retaining old/missing room/bathroom documents. This selected balcony type means two framed glass panels. Add balcony doors through Room with estimated1800×2100mm dimensions, zero sill and planned sliding mechanism; wall stays unknown until corrected. Doors remain protected. No schema/runtime authority from saved data and no outside room.
2. One pure bounded registry serves window Small600×900, Medium1200×1200, Wide1800×1200, Large2400×1500mm and balcony Compact1800×2100, Standard2400×2100, Wide3000×2100, Tall2400×2400mm. These are rounded illustrative planning choices informed by primary manufacturer ranges, not universal construction standards. Presets edit width/height only, with changed axes estimated and unchanged evidence preserved; custom numeric controls remain. Same feature update/Undo path and existing final constraints.
3. Shared pure paired-panel geometry serves editor/export; reuse glass/material lifecycle and actual wall apertures. Sliding moves one pane behind the other within the opening. Known hinged mechanisms pivot opposite panels; retain existing hinge-readiness and conservative inward-envelope rules. No renderer-only semantic writes. Labels distinguish Balcony Doors; no separate exterior scene. Existing window/door geometry stays unchanged.
4. Medy resolves balcony/patio identities and explicit additions, sizes, preset changes and purpose edits through its existing visitor compiler. Models never supply authority. Update only capability examples/prompt revision; no live/key/model/config changes. Fake mode uses the same compiler.
5. Meaningful preset/schema/provenance/nonmutation/command/Undo/protected-door/old-import/Medy and panel/motion/export regressions. Scoped checks during iteration; native window presets and balcony add/size/2D/3D/open/close/reversal/Undo/short/narrow/export as relevant. Independently confirm/fix read-only findings, settle exact bytes then full established check components/both builds/input identity and exact local commit. Actual owner visual approval pending, Q held, guide paused, RM-016 Planned; no paid/live/delegation/new service/port/dependency/push/deploy.

Read-only refinements within this allocation: distinguish an opening identity (balcony doors) from an explicit destination edit; retain ambiguity for multiple doors. Numeric wide/tall adjectives remain existing exact supplied-dimension edits, while named presets stay estimates. Conflicting/multiple preset names ask instead of partially changing values. Sliding doors hide the irrelevant hinge form; known hinged mechanisms retain the original readiness and conservative envelope. No new service/dependency or wider command grant.
