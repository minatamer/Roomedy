# RM-015BC — Remove chat keyboard hint

20October2026; clean parent79d7763. Latest owner removes the composer keyboard-help line shown in their screenshot.

## Exact allocation before edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BC-remove-chat-keyboard-hint.md`
6. `docs/commit-plans/RM-015BC.md`
7. `docs/validation/RM-015BC.md`
8. `apps/frontend/src/features/assistant/assistant.tsx`
9. `apps/frontend/src/features/assistant/assistant.module.css`

Remove only the composer hint, discard its unused CSS and keep Send at the trailing edge. Keep textarea, Send, Enter/Shift+Enter/composition handlers and history unchanged. Shared component covers every chat state/view/width. No replacement text/control. Verify allocated formatting/lint/frontend types, native desktop/phone removal, Shift+Enter/newline and Enter send. No new test or full suite/build for this copy-only edit; BB847-test/both-build evidence stays historical. Read-only review then exact authorized local checkpoint. Owner visual approval pending; Q held, guide paused, RM-016 Planned; no paid/live/config/delegation/new ports/push/deploy.
