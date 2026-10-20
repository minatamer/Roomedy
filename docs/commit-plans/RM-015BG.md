# RM-015BG — Clear door placement and wall movement

20October2026; clean parente60a444. The latest direct owner request selects automatic clear bathroom-door placement and same-wall door editing. Existing explicit ticket-local staging/commit authority applies after validation; actual visual approval remains pending.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BG-place-and-move-doors.md`
6. `docs/commit-plans/RM-015BG.md`
7. `docs/validation/RM-015BG.md`
8. `docs/design/room-view.md`
9. `packages/spatial/src/opening-placement.ts`
10. `packages/spatial/src/index.ts`
11. `packages/spatial/src/commands.ts`
12. `packages/spatial/src/medy-edits.ts`
13. `apps/frontend/src/features/room-editor/room-panel.tsx`
14. `apps/frontend/src/features/room-editor/selection-actions.ts`
15. `apps/frontend/src/features/room-editor/messages.ts`
16. `apps/frontend/src/features/room-view/window-manipulation.ts`
17. `apps/frontend/src/features/room-view/use-floor-edit.ts`
18. `apps/frontend/src/features/room-view/scene.tsx`
19. `apps/frontend/src/features/plan-view/plan-view.tsx`
20. `test/door-placement.test.ts`
21. `test/window-edit.test.ts`
22. `test/session.test.ts`
23. `test/medy-commands.test.ts`
24. `apps/frontend/src/features/room-view/cutaway.tsx`

Before its edit: the existing3D interaction hint is included so it names movable doors alongside windows; no new control or behavior owner.

## Implementation and verification

1. Pure bounded interval subtraction, no coordinate scan: wall order north/east/south/west, lowest clear integer offset. Door width and room bounds must be known. Reserve conservative room-side reach (at least600mm, enlarged to opening width for inward/unknown mechanisms), actual furniture footprints/vertical spans, obstacles and same-wall opening intervals. Unknown relevant obstructions do not count as clear space. Preserve facts; new bathroom wall/offset are visitor planning estimates, mechanism/hinge remain unknown unless explicitly supplied. No outside bathroom or random placement.
2. Manual bathroom Add and explicit Medy addition use the same first-fit helper. Explicit supplied wall/offset remains authoritative and goes through the same validation, rather than silently moving elsewhere. If no valid interval, leave the room intact with useful copy. Recheck changed/new known door poses at the shared final batch boundary; do not block unrelated edits to existing imperfect rooms. Keep dimension/unknown review, recording of confirmed existing doorways even when it reveals conflicts, and protected deletion semantics. These observed additions are distinct from new estimated planning placements.
3. Extend the existing historical window manipulation adapter to both opening kinds, reusing gesture retirement, displayed/canonical identity, physical whole-opening bounds, snapping, keyboard, interpolation, aperture and one command/Undo. Same-wall door previews stop at blocked intervals. Selection now arranges doors too. No per-frame semantic commands or new mode controls; unknown pose stays inspectable.
4. Test all walls, exact contact, odd/fractional obstruction edges, bounds, unknowns, blocked/all-full, deterministic search, vertical clearance, same-wall openings, new/final atomic authority and Medy parity. Door gesture command/Undo/no-op/stale/cancel/view and existing windows remain. Scoped tests during iteration; actual2D/3D pointer/keyboard/Add/Undo/rejection plus short/narrow observations. Settled unsandboxed root check, both builds and exact source identity; read-only inspect/fix/revalidate, exact ticket-local commit. Q held, guide paused, RM-016 Planned; owner visual approval remains pending.

Read-only refinement: final command tests preserve the existing observed-door measurement-review path. Automatic manual/Medy additions remain estimated and clearance-checked; explicit subsequent wall/offset moves remain guarded. Final source/test review has no actionable findings after independently verifying this correction and the encoding restoration.

Settled result:925tests/58files/root/7boundaries/both builds pass;272input/3,408,992byte identity matches production BUILD_ID and all16 reviewed source/test hashes.24-path scope and807local links pass. Native Add/drag/keyboard/rejection/Medy/Undo/short/phone observations are recorded in the receipt. Exact local checkpoint under standing authority; actual owner approval pending, Q held, guide paused, RM-016 Planned.
