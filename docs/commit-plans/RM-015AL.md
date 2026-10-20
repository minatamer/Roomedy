# RM-015AL — Default the main editor to 3D

20 October 2026. Parent b14a407; clean worktree/index before allocation. Latest owner: “make the 3d view the default one not the 2d”. Apply to fresh main-editor rooms and explicit new-room/reset/accepted-photo entry. Preserve explicit saved view on recovery, the current selected view during project import, manual2D switching, rough2D photo correction and existing graphics/loading fallback. No new setting, renderer, provider/dependency/service/port or forced preference migration. Existing local execute/validate/checkpoint authority applies; actual result approval remains pending, Q held, guide paused, RM-016 Planned. No questions/delegation/paid/live/push/deploy.

## Exact allocation before edits

1. `apps/frontend/src/features/session/state.ts`
2. `apps/frontend/src/features/session/controller.ts`
3. `test/project-lifecycle.test.ts`
4. `test/window-edit.test.ts`
5. `docs/commit-plans/RM-015AL.md`
6. `docs/tickets/RM-015AL-open-editor-in-3d.md`
7. `docs/validation/RM-015AL.md`
8. `docs/ROOMEDY.md`
9. `docs/README.md`
10. `docs/tickets/README.md`
11. `docs/design/room-view.md`
12. `docs/design/layout.md`

One initialPresentation factory defaults to cutaway and accepts an explicit view; replaceRoom uses it rather than hard-coding plan. Constructor/acceptance/reset therefore agree, while recovery/import pass their existing explicit view. Add meaningful lifecycle/recovery coverage; make the window-edit fixture's intended2D starting view explicit so its view-switch retirement test still switches. Preserve canonical semantics, UI switching, same command/gesture/tour/retention lifetimes and lazy graphics preparation/fallback.

Finish source edits before focused session/project/persistence/window/tour/catalogue checks. Check actual fresh manual room default3D, native2D/3D switching and recovered2D refresh plus photo rough2D→accepted3D if available on fake mode. Run applicable format/lint/types/build and settled root/current-source gate, then a full12-path read-only review. Record actual proof separately from physical/GPU/Linux/hosted/live/owner acceptance; stage/commit only these exact files after validation.
