# RM-015BN — Use device-aware landing scroll cues

Status: **Locally implemented; scoped checks pass; actual owner visual/touch review pending.** Base ff11054, 28 October 2026. The owner rejects the circular-arrow Explore the room control and requests the mouse/finger icons used in another repository, according to the device. The actual match is Choreograph's `apps/frontend/components/hero-scroll-cue.tsx` and `apps/frontend/app/landing-hero.css`; Retailor also uses the same finger outline.

Read the [exact allocation](../commit-plans/RM-015BN.md), [receipt](../validation/RM-015BN.md), [landing authority](../ROOMEDY.md#41-first-viewport), [feedback](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [motion policy](../design/motion.md) and [review checklist](../design/REVIEW_CHECKLIST.md). Latest direct feedback supersedes the earlier circular-arrow choice only.

- Replace the arrow/circle with the reference's outlined mouse and swiping finger in Roomedy cocoa. Show mouse/Scroll to explore by default and finger/Swipe up to explore for a coarse primary pointer. A small mouse-driven window must retain its mouse cue; a touch tablet must get the finger regardless of width.
- Preserve the centered normal-flow control, at least 44px hit target, readable label, keyboard focus/activation and the existing finite interruptible section journey/clean URL.
- Keep a gentle finite icon demonstration, settled within five seconds; no new JavaScript, device sniffing, dependency, timer or frame loop. Do not copy Choreograph's delayed admission, perpetual animation or page theme.
- Reuse the healthy local fake-mode 4320/4321 stack and hot reload. Verify desktop, short laptop, phone/tablet layout, the applicable media branch, keyboard and actual section navigation. Desktop emulation is not physical touch evidence.
- Check the two runtime files with scoped formatting/lint/types and existing section-scroll regressions; perform a read-only diff review. Record actual evidence and retain owner visual approval as pending.

No 3D readiness/reveal, CPQ, provider, configuration, service or hosted release change. No staging, commit, push or deployment is selected by this local visual request.

Owner follow-up explicitly requires in-app-browser-only testing without desktop Chrome permission prompts. Record touch emulation as unverified where unsupported, finish available checks and continue without interrupting AFK work. See the permanent rule in AGENTS.md and the actual receipt.
