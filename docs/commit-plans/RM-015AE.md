# RM-015AE — Match editor window glass to the landing

20 October2026. Parent HEAD42b400a; AD39-path implementation remains unstaged with final batch gates deferred. Owner directly requests matching the editor's glass to the existing better landing glass. Preserve current AD surfaces and all earlier interactions. Latest test deferral applies: fix observed errors and continue hot reload, no routine suites/root gate now. Actual visual approval pending; Q held, guide paused, RM-016 Planned.

## Exact allocation before edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AE-match-editor-window-glass-to-landing.md`
6. `docs/commit-plans/RM-015AE.md`
7. `docs/validation/RM-015AE.md`
8. `docs/design/room-view.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/src/features/room-view/window-glass.ts`
11. `apps/frontend/src/features/landing/window-glass.ts`
12. `apps/frontend/src/features/landing/furniture-scene.tsx`
13. `apps/frontend/src/features/room-view/scene.tsx`
14. `apps/frontend/src/features/design-export/scene.ts`
15. `apps/frontend/src/features/design-export/capture.ts`
16. `apps/frontend/src/features/design-export/obj.ts`

## Implementation and evidence

Move the existing landing factory into room-view and update its import; preserve its256px authored daylight, physical glass coefficients and128px prepared RoomEnvironment reflection. Main editor owns one factory per mounted canvas (shared by all windows), prepares before the initial ready frames, caps transmission buffer scale at the landing's0.35 and retires every material/texture/render target. No HDR download, per-window environment, extra frame loop, light or postprocessing. Use existing aperture and oriented window groups; place the daylight just outside and glass inside, with selected trim rather than recolouring the pane opaque. Pointer selection/same-wall dragging and canonical window dimensions remain unchanged.

Carry this presentation into the existing export projection, prepare its reflection only for PDF WebGL capture and retire resources with that projection. GLB receives physical glass and daylight; OBJ accepts the existing Basic daylight material as diffuse fallback, preserving documented PBR limitations. No export UI/format/schema expansion. Inspect the actual hot-reloaded editor and landing, check for observed WebGL/runtime errors, save the result and document narrow/geometry/resource limits honestly. Do not run routine automated tests/full builds until the queued-edit batch settles; final exact input/root/read-only validation and local checkpoint remain pending. Canonical progress updates use the build-state helper. No stage/commit of either unfinished batch packet now.
