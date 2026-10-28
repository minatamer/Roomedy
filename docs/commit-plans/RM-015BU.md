# RM-015BU exact local allocation

Preserve112 prior dirty paths and empty index. Allocate before source edits:

1. `apps/frontend/src/features/assistant/assistant.tsx` — busy row uses shared Thinking component, no busy Cancel CTA.
2. `apps/frontend/src/features/assistant/assistant.module.css` — refined continuous spinner/status, retiring old progress styles.
3. New `apps/frontend/src/features/assistant/thinking-status.tsx` — accessible decorative status component.
4. `apps/frontend/src/app/globals.css` — reusable native warm scrollbar utility.
5. `apps/frontend/src/app/layout.tsx` — opt the app root into that utility.
6. `apps/frontend/src/features/room-editor/view-controls.module.css` — retire competing local scrollbar width.
7. `apps/frontend/src/features/room-intake/intake.module.css` — retire competing local scrollbar width/colour.
8. `docs/tickets/RM-015BU-refine-thinking-and-shared-scrollbars.md`.
9. This allocation.
10. `docs/validation/RM-015BU.md`.
11. `AGENTS.md`.
12. `docs/README.md`.
13. `docs/ROOMEDY.md` — helper-managed amendment to existing VISUAL_CHAT_REFINEMENT context; retain all64 keys/phases.
14. `docs/tickets/README.md`.
15. `docs/design/layout.md`.
16. `docs/engineering/assistant.md`.
17. `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md`.

A temporary `apps/frontend/src/app/review-thinking/page.tsx` may render the actual status and long labelled sample content for isolated visual QA. Remove it before final checks. Test snapshots/screenshots/logs/backups stay ignored or in task output. No controller/provider/command/config/data/asset/dependency changes or new paid test.

Final accounting:17allocated paths overlap9previous changes and add8new dirty paths,120total with empty index. All112prior dirty paths remain. Temporary fixture removed before the settled root gate; generated next-env.d.ts unchanged. Seven source hashes are fixed in ignored runtime evidence. No staging/commit/push/hosted action.
