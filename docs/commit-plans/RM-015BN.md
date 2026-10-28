# RM-015BN — Local scroll-cue allocation

28 October 2026, base ff11054. [Ticket](../tickets/RM-015BN-use-device-aware-scroll-cues.md). The owner explicitly requests the previously used device-aware mouse/finger design; Choreograph supplies the exact source reference. Scope is local implementation and verification, with actual owner visual approval pending.

Exact ten paths:

1. `apps/frontend/src/features/landing/landing.tsx` — replace the arrow with the reference mouse/finger outlines and concise visible instructions inside the existing section action.
2. `apps/frontend/src/features/landing/landing.module.css` — plain cocoa cue, primary-pointer media selection, finite small icon motion, retained focus/hit target/centered flow.
3. `docs/tickets/RM-015BN-use-device-aware-scroll-cues.md` — selected scope and acceptance.
4. This allocation.
5. `docs/validation/RM-015BN.md` — actual checks, browser states and read-only review.
6. `AGENTS.md` — latest local landing correction and the subsequent explicit owner rule: use the in-app browser, with no desktop Chrome testing/access prompts; unsupported emulation stays unverified without interrupting AFK work.
7. `docs/README.md` — current local review link.
8. `docs/ROOMEDY.md` — current cue authority and canonical context through the build-state helper, preserving completed phases and independent approvals.
9. `docs/tickets/README.md` — link the selected correction without reopening completed CPQ work.
10. `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md` — preserve the latest direct icon/device preference.

No new client owner, package, public asset, service/port or configuration. Exclude generated Next files, runtime/build/log/screenshot files and local env. The existing landing scene/reveal is unchanged. Nothing is staged or committed by this plan; no publication or provider work.
