# RM-015BT exact local allocation

Preserve all103 prior dirty paths and empty index. Allocate before source edits:

1. `apps/frontend/src/styles/tokens.css` — shared warm surface/control/field/room tokens.
2. `apps/frontend/src/features/room-editor/editor.module.css` — studio controls, panels and native fields/plan frame consume those tokens.
3. `apps/frontend/src/features/room-editor/view-controls.module.css` — warm view capsule surface.
4. `apps/frontend/src/features/room-view/room-view.module.css` — shared room viewport background only.
5. `apps/frontend/src/features/assistant/assistant.module.css` — translucent glossy composer, legible text/placeholder and supporting cards.
6. `apps/frontend/src/features/cost/workspace.module.css` — matching cost composer and warm oat page base.
7. `docs/tickets/RM-015BT-unify-studio-beige-surfaces.md`.
8. This allocation.
9. `docs/validation/RM-015BT.md`.
10. `AGENTS.md`.
11. `docs/README.md`.
12. `docs/ROOMEDY.md` — normal authority prose and helper-managed amendment to the existing visual-chat context; preserve all64 context keys/phases.
13. `docs/tickets/README.md`.
14. `docs/design/visual-direction.md`.
15. `docs/design/layout.md`.
16. `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md`.

No source outside these six CSS files, generated declarations, model/scene/light/material data or controller logic. Logs, backups and screenshots are ignored/task-output artifacts. No Git mutation is selected.


Completed locally:1250 tests/78files/root/both builds, responsive visual checks and clean read-only review.16 paths overlap7 prior paths and add9, giving112 dirty paths, empty index. Final six CSS hashes are preserved; prior landing hashes remain unchanged. Owner aesthetic acceptance pending; no Git/publication selected.
