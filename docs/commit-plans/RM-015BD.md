# RM-015BD — Inset the chat Send button

20October2026; clean parent85cf8ff. Owner requests the Retailor composer design: Send inside the chatbox.

## Exact allocation before edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BD-inset-the-chat-send-button.md`
6. `docs/commit-plans/RM-015BD.md`
7. `docs/validation/RM-015BD.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/assistant/assistant.tsx`
10. `apps/frontend/src/features/assistant/assistant.module.css`

## Source and implementation

Read Retailor read-only: apps/frontend/src/features/assistants/conversation-panel.tsx (ConversationComposer), tailor.module.css (composerBox/sendButton), components/ui/icon.tsx (arrow path). Use its single rounded wrapper, borderless input, reserved44px bottom action space and44px bottom-right arrow target with32px inset visual. Adapt to existing Roomedy warm surfaces/cocoa; do not import Retailor colour tokens, copy, busy/cancel/controller behavior or any new dependency.

Wrap the existing textarea and same submit button in one composerBox; preserve accessible Ask Medy/Send message names, draft bounds, input ref/focus, Enter/Shift+Enter/IME handlers, disabled behavior, conversation/history/room authority and separate busy cancel. No visible label, keyboard hint or divider returns. Shared focus-within ring covers the field; button retains keyboard focus, finite hover and44px target. Reserve footer space so multiline scroll/text never hides under the action.

Focused allocated format/lint/frontend types; actual desktop/short/phone field/button containment, long multiline scroll, keyboard/Send and focus checks. No mirror test or repeated full suite/build for this presentation-only change; last full BB proof remains historical. Read-only review then exact authorized local checkpoint. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned. No paid/live/config/delegation/new dependencies/services/ports/push/deploy.
