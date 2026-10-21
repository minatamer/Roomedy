# RM-015BJ — Contextual quick replies above the composer

Status: **Locally implemented and validated; actual owner visual approval pending**, owner-selected21 October2026. Builds on the unstaged BH/BI work. Owner asks to place the choices immediately above the text box, clearly as fast replies, and have AI-generated choices follow the latest assistant reply. Simulate in fake mode and implement real mode for later funded testing.

Read [allocation](../commit-plans/RM-015BJ.md), [assistant policy](../engineering/assistant.md), [layout](../design/layout.md), [motion](../design/motion.md), [review checklist](../design/REVIEW_CHECKLIST.md) and [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] One bounded shelf directly above the composer, outside scrolling history, showing at most three relevant quick replies for the latest response only. Preserve warm glass theme, first-visible text reveal, conditional tour, reachable composer, touch/keyboard/short/phone layout and actual cards/Apply/Cancel controls.
- [x] The existing real conversation response generates concise visitor reply label/request pairs alongside its answer using the strict structured format. No additional provider call. Validate/deduplicate/bound choices, bind current revision/selection, reject unsupported/injected/unsafe requests, and execute nothing until the visitor selects a reply and the existing submit/compiler/admission path runs again.
- [x] Fake provider supplies context-sensitive replies through the same contract. Application-authored local/control/proposal/receipt/failure replies use appropriate deterministic follow-ups. Older/busy/stale/Before/retired choices cannot trigger; no invented Apply/Undo/measurement authority or new storage/config/model/dependency/service/port.
- [x] Meaningful strict-wire/fake parity, malformed suggestions, new-message/revision/cancellation and actual preview/Apply/Undo tests; scoped checks/types/build shared packages and native fake desktop/phone/short evidence. Read-only review, honest receipt and progress update. No paid calls or Git actions; actual owner visual approval and funded model quality pending, Q held, guide paused, RM-016 Planned.

- [ ] Actual owner visual approval and funded real-model quality remain for later testing. No paid call or such approval is claimed. [Evidence](../validation/RM-015BJ.md).
