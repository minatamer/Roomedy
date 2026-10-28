# RM-015BU — Refine Thinking and shared scrollbars

Status: Complete locally,28 October2026; actual owner aesthetic acceptance pending. Direct owner requests replacing Medy's busy row with “Thinking” and a better continuously spinning indicator, removing its Cancel CTA, and making scrollbars much thinner through a shared warm/glass class. Preserve all112 prior dirty paths and current real-mode services. No provider/env/Git/hosted action.

Read [allocation](../commit-plans/RM-015BU.md), [receipt](../validation/RM-015BU.md), current assistant/layout authority and owner feedback. Latest explicit owner request supersedes the earlier visible busy-cancel CTA requirement only; underlying cancellation/expiry/disposal/stale-write safeguards remain.

## Acceptance

- One compact accessible Thinking status with a decorative continuously rotating warm spinner only while busy. Remove the Cancel request CTA from that row, retaining actual proposal Apply/Cancel and all controller lifecycle cancellation behavior. No new loading delay, JS timer/frame owner or provider call.
- Provide one reusable global `roomedy-scroll` utility and apply it at the application root. Use a4px rounded warm translucent thumb/clear track in engines supporting scrollbar pseudo-elements, with native thin/coloured fallback. Remove competing local width/colour rules. Keep native wheel/touch/keyboard/drag behavior, visible thumbs and stable existing gutters; no custom scroll implementation.
- Verify actual shared scrollbar styling/keyboard scrolling, desktop/phone/short status appearance, root integration and existing lifecycle regressions. A clearly labelled temporary isolated component fixture may exercise persistent pending/long content without contacting an AI provider; remove it before the final gate. No static-label/CSS mirror tests. Actual physical/browser-matrix/owner aesthetic acceptance stays separate.
- Reuse4320/4321 and in-app browser; no restart, new dependency/port, env change, Chrome, delegation, staging/commit/push/deployment. Save concrete screenshots and document checks/limits.
