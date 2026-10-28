# RM-015BV exact local allocation

Preserve120prior dirty paths and the empty index. Allocate before source edits:

1. `packages/spatial/src/planning.ts`.
2. `packages/spatial/src/index.ts`.
3. `packages/spatial/src/search/engine.ts`.
4. `packages/spatial/src/search/facts.ts`.
5. `packages/spatial/src/search/scope.ts`.
6. `packages/spatial/src/assistant.ts`.
7. `packages/spatial/src/medy.ts`.
8. `packages/contracts/src/assistant.ts`.
9. `apps/backend/src/assistant/assistant.ts`.
10. `apps/backend/src/assistant/tools.ts`.
11. `apps/frontend/src/features/assistant/assistant.tsx`.
12. `apps/frontend/src/features/room-editor/checks-panel.tsx`.
13. `apps/frontend/src/features/room-editor/messages.ts`.
14. `test/planning.test.ts`.
15. `test/layout-search.test.ts`.
16. `test/assistant-intent.test.ts`.
17. `test/assistant-tools.test.ts`.
18. `docs/tickets/RM-015BV-continue-ai-with-planning-estimates.md`.
19. `docs/commit-plans/RM-015BV.md`.
20. `docs/validation/RM-015BV.md`.
21. `AGENTS.md`.
22. `docs/README.md`.
23. `docs/ROOMEDY.md`.
24. `docs/tickets/README.md`.
25. `docs/engineering/assistant.md`.
26. `docs/engineering/spatial-rules.md`.
27. `docs/design/layout.md`.
28. `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md`.
29. `apps/frontend/src/features/session/clearance.ts` — remove the residual missing-measurement wording from genuine access notices.
30. `test/clearance-notices.test.ts` — keep real access guidance while removing the missing-input nag.
31. `packages/spatial/src/quick-replies.ts` — remove authored measurement follow-ups and reject physical-fact prompts in generated suggestions.
32. `test/assistant-quick-replies.test.ts` — exercise omitted measurement prompts and valid design follow-ups.

A temporary labelled `apps/frontend/src/app/review-planning/page.tsx` may render actual assistant/check components using deterministic offline response fixtures. Remove it before the settled root gate. Ignored runtime hashes and task-output screenshots/reports are evidence only. No staged/local commit or publication is selected.

Final accounting:32allocated paths (21source/test and11documentation),9overlap prior changes and23new dirty paths,143total. All120prior dirty paths remain with byte-identical content outside allocation. Index empty; no Git/publication action. Temporary fixture removed before both root gates. Final21source/test hashes stay fixed after the1259-test/79-file gate and both builds. Verified frontend-only refresh is necessary to load the built shared package; no env/cache/source mutation is used for restart.
