# RM-015BA — Fit plan labels to furniture

20October2026; clean parent bc8cef3. Owner requests whole-word sideways text inside the tall narrow wardrobe, not stacked letters.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BA-fit-plan-labels-to-furniture.md`
6. `docs/commit-plans/RM-015BA.md`
7. `docs/validation/RM-015BA.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/plan-view/plan-view.tsx`
10. `apps/frontend/src/features/plan-view/adapter.ts`
11. `apps/frontend/src/features/room-editor/editor.module.css`
12. `test/plan.test.ts`

## Implementation and verification

1. Resolve the existing compact/category name once. One pure plan display helper uses the actual projected footprint and text length: retain horizontal text when it fits; rotate the whole centered word -90 degrees only when a taller footprint needs the longer axis. Keep bounded type size and a small inner margin. No writing-mode/stacked letters.
2. Apply to the owning precision2D furniture labels in selected/unselected/proposal/restored views. Keep TV captions (including wall-mounted room-side labels) horizontal, unknown-size fallback, elevation coverage, semantic accessible names, selection/arrow/footprint geometry, commands and3D untouched. Finite existing180ms timing serves text rotation/size changes without canonical writes.
3. Meaningful helper regressions cover all quarter-turns, tall/wide/bed/square/unknown/mounted footprints, fit and nonmutation. Native fake hot-reload wardrobe rotation/Undo, other label fit, short/narrow and zoom observations; no CSS/static-label mirror tests.
4. Close temporary tabs before settled root/both-build/exact-source gate. Read-only validate, independently resolve findings, revalidate, then exact authorized local commit. Owner visual approval remains pending; Q held, guide paused, RM-016 Planned. No live/paid/delegation/config/new dependency/service/port/push/deploy.
