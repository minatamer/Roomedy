# RM-015AX — Distinguish Export with beige

20October2026; clean parent6d8a471. Owner asks for Export in a beige class to distinguish it from Import. No behavior/label/layout change is requested.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AX-distinguish-export-with-beige.md`
6. `docs/commit-plans/RM-015AX.md`
7. `docs/validation/RM-015AX.md`
8. `apps/frontend/src/features/room-editor/project-controls.tsx`
9. `apps/frontend/src/features/room-editor/editor.module.css`

## Implementation and verification

Reuse the editor's existing CSS-module button ownership and beige#e7ddcc/cocoa tokens. Add one reusable .beige class with an intentional warmer hover/border, composed after normal button rules; apply only to Project menu Export. Keep Import's neutral outline and Start a new room's brown treatment. Existing focus ring,44px minimum, disabled opacity,200ms interaction motion, menu sizing and all export/import/reset authority remain.

Read installed Next CSS-module/cascade guidance, current layout/checklist and feedback lessons. Verify actual normal/hover/focus, Export dialog open/close and Import/New-room states; inspect desktop, short and phone menu fit without changing user data. No CSS/static-label mirror tests for this reversible presentation change. Run scoped format and the required settled root/both-build gate, exact source/BUILD_ID identity and read-only review, then exact authorized local checkpoint. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/delegation/dependencies/services/ports/push/deploy.
