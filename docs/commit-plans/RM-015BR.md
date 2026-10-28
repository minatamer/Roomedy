# RM-015BR — Finished-room wall reveal allocation

28 October 2026. Direct owner selects lowered walls at the start and an upright finished room at the end. Exact13 paths allocated before implementation; preserve all56 owned BN/BO/BP/BQ paths.

1. `apps/frontend/src/features/landing/scroll-motion.ts` — reverse wall articulation independently of camera framing, with any necessary bounded initial framing correction.
2. `apps/frontend/src/features/landing/scroll-room.tsx` — accessible scene description includes lowered start/upright completion.
3. `test/landing-motion.test.ts` — endpoint/late-rise/continuous reverse/framing regressions, preserving furniture/buffer tests.
4. `docs/tickets/RM-015BR-raise-the-walls-at-the-end.md`.
5. This allocation.
6. `docs/validation/RM-015BR.md` — actual motion/visual/check results and limitations.
7. `AGENTS.md` — latest owner wall-direction instruction.
8. `docs/README.md` — current local correction.
9. `docs/ROOMEDY.md` — current authority/helper-managed canonical context, preserving dated earlier motion evidence.
10. `docs/tickets/README.md` — selected correction without reopening CPQ.
11. `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md` — direct finished-room preference.
12. `docs/design/motion.md` — current lowered-start/late-rise ownership and independent camera progression.
13. `docs/design/REVIEW_CHECKLIST.md` — current wall-direction acceptance, preserving USD/plain table and finishing checks.

No asset/render-resource/controller/provider/backend/config/schema change or Git action. Use hot reload/current fake services. Runtime/build/generated/log/screenshot artifacts remain excluded. Actual visual acceptance belongs to the owner, independently of local checks.
