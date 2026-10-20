# RM-015BC — Remove chat keyboard hint

Status: **Locally implemented and validated; actual owner visual approval pending**, follows79d7763. Owner removes Enter to send / Shift+Enter for a new line beneath the chat composer. Read [allocation](../commit-plans/RM-015BC.md), [review checklist](../design/REVIEW_CHECKLIST.md) and [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] Remove the shared hint and unused style; keep Send aligned right.
- [x] Preserve keyboard/composition/send/history behavior; native desktop/phone and focused source checks.
- [x] Clean read-only review/exact local checkpoint; actual owner visual approval pending.

Follow-up after4e54007: owner also removes the composer divider and visible Ask Medy label.

- [x] Remove shared top border/visible label/unused style; retain Ask Medy accessible textbox name, Send and keyboard handling. Scoped format/lint/frontend types and actual desktop/phone Send checks pass; actual owner approval pending.
