# RM-015BC — Composer hint removal

20October2026; clean parent79d7763. [Ticket](../tickets/RM-015BC-remove-chat-keyboard-hint.md), [nine-path allocation](../commit-plans/RM-015BC.md). Owner removes only the shown keyboard-help line beneath the composer.

Removed the shared small text and its unused CSS. The existing Send row now aligns its sole button to the trailing edge. No replacement copy/setting, textarea/Send handler, composition guard, history/controller/provider/schema or other surface changes.

Allocated Prettier formatting, ESLint with zero warnings and frontend type generation/typecheck pass (.release/BC-frontend-types.log). Read-only pass1 inspected all nine paths and the unchanged neighboring keyboard/send owner: Meets ticket, no actionable findings. No new static-label/CSS test or unnecessary suite/build for this copy-only correction. BB847-test/56file/seven-boundary/both-build proof remains historical; current two-file hot reload differs from its production artifact. No fresh full-root/production identity claim.

Actual native fake-ready fresh sample on sole4320/private4321: desktop1280×720 composer omits the hint and retains trailing Send. Shift+Enter produces actual textarea value hi\n without sending; subsequent Enter sends hi and receives the local greeting, then clears the input. Phone390×844 has no hint and retains a44px Send button at the row right edge x355; normal document scrolling reaches the composer. Actual Send click delivers hello and gets the local greeting. Both screenshots visually inspected; no captured browser errors. Temporary viewport reset and tab51 closed. Composition guard is source-unchanged, no native IME claim; no blanket accessibility/full responsive/performance claim.

Screenshots: C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/RM-015BC-medy-composer.png and RM-015BC-phone-composer.png. Only exact allocated paths enter the authorized local checkpoint. Build-state helper returns visual review to awaiting_owner; actual owner approval pending. Q held, guide goal paused, RM-016 Planned. No paid/live/config/delegation/new dependency/service/port/push/deploy.
