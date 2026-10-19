# RM-015AG — Clear plan direction arrows and add rotation controls

20 October2026. HEAD42b400a; AD/AE/AF58-path batch remains unstaged with final gates deferred. Latest direct owner selects removing the dot/arrow overlap and adding2D rotation controls. Use existing main-editor plan and command authority. No delegation, paid/live, dependencies, services/ports, push/deploy or premature batch commit.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AG-clarify-plan-direction-and-add-rotation.md`
6. `docs/commit-plans/RM-015AG.md`
7. `docs/validation/RM-015AG.md`
8. `docs/design/layout.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/src/features/plan-view/plan-view.tsx`
11. `apps/frontend/src/features/room-editor/editor.tsx`
12. `apps/frontend/src/features/room-editor/editor.module.css`

## Implementation and evidence

Remove the selected centre dot instead of placing another overlay over a short furniture footprint. Existing bold selected outline/aria-pressed/focus identify selection; retain the orientation arrow with the actual rotating footprint. Add two compact labelled90° buttons to the existing2D left toolbar. Button handlers read the current selected furniture and dispatch the existing rotate command; no camera rotation, geometry/placement bypass, independent room authority or extra product status row. Respect read-only/candidate, selection, rotation lock and final spatial checks. Keep inspector/3D rotation intact; one Undo restores the whole change.

Use a small local footprint component to preserve the shortest displayed quarter-turn through wraparound/reversal, with existing180ms CSS motion and no canonical/per-frame state writes. The centre label remains upright. Keep controls at44px, matched two-button group on wide rail and ordinary wrapping on narrow layouts; do not reduce frame height or restore removed bottom copy. Observe actual native wardrobe rotation both ways, arrow visibility at the formerly obscured orientation, Undo, disabled state and a phone layout through hot reload. Record failures/unperformed evidence honestly. Routine suites/final root/build/read-only/checkpoint stay deferred under current direct owner instruction; fix observed errors and continue. Canonical progress through build-state helper only.
