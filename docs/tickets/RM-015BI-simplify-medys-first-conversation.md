# RM-015BI — Simplify Medy’s first conversation

Status: **Locally implemented and validated; owner visual approval pending**, owner-selected21 October2026. Supersedes the initial open goals/finishes disclosure in AT/AY. Existing BH changes remain separate and unstaged.

Read [allocation](../commit-plans/RM-015BI.md), [assistant authority](../engineering/assistant.md), [layout](../design/layout.md), [motion](../design/motion.md), [review checklist](../design/REVIEW_CHECKLIST.md) and [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] First visible welcome writes out using Retailor’s actual staggered word reveal. Accessible text is announced whole; finite motion, stable wrapping, no replay on routine updates/panel changes, no work after retirement. A tour covering Medy defers its first reveal.
- [x] At most three initial choices: Show me around if tour not completed, Help me find a direction, Let’s talk. Remove permanent goals/finishes disclosure. Direction reveals layout/finish paths in the next reply, with at most three relevant follow-up choices. Conversation remains open to free text.
- [x] Same app-owned onboarding/reveal for fake and real modes. Leaf choices use existing shared submit/search/preview/Apply/Undo authority; no provider-authored navigation authority or new provider protocol. Stale/busy/Before/lifecycle actions remain fenced. No new persistence, dependencies, services, ports or paid calls.
- [x] Latest owner follow-up rejects the generic white rectangular CTA cards. Use the website’s existing warm glass/oat/cocoa language, coherent rounded shapes, responsive readable labels and deliberate hover/focus/disabled states for initial and subsequent choices.
- [x] Meaningful bounded-history/reveal/stale-choice regressions; scoped lint/format/types and actual fake desktop/short/phone review, tour completion, re-entry and one actual fake-browser preview flow. Read-only final review and honest receipt. Actual owner visual approval and funded live quality remain pending; Q held, guide paused, RM-016 Planned.

Read-only Retailor reference: `apps/frontend/src/features/assistants/tailor.tsx` PromptText and `tailor.module.css` promptWord: whole accessible text, visual whitespace-preserving word spans,180ms fade with22ms token stagger. Adapt to Roomedy’s finite bounded history and controller lifetime.

- [ ] Actual owner visual approval and funded provider-quality evidence remain external. A new native fresh-room reset check was rejected by automatic approval review; existing room preserved. See [receipt](../validation/RM-015BI.md).
