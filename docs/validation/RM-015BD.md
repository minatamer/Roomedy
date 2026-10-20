# RM-015BD — Inset chat Send

20October2026; clean parent85cf8ff. [Ticket](../tickets/RM-015BD-inset-the-chat-send-button.md), [ten-path allocation](../commit-plans/RM-015BD.md). Owner requests the liked Retailor inset composer design. Actual owner visual approval remains pending.

## Actual Retailor comparison and implementation

Read-only reference: C:/Users/minat/Work/Retailor/apps/frontend/src/features/assistants/conversation-panel.tsx ConversationComposer, tailor.module.css composerBox/sendButton, and components/ui/icon.tsx arrow. Actual reference has one14px rounded border, borderless textarea,44px reserved bottom area, absolute bottom-right44px action with6px inset visual/16px up arrow and focus-within ring. No Retailor edits/service launches or borrowed runtime authority.

Roomedy adopts that layout, using existing warm surface/border, cocoa action/white stroke and darker finite180ms hover. Same submit button moves inside a shared composerBox beside the textarea; arrow SVG replaces visible Send text but retains Send message aria-label/title.44px target/32px rounded visual,3px field focus ring and existing button focus remain. Textarea is block/borderless with unchanged rows, bounds, ref, draft, keyboard/Enter/Shift+Enter/IME guards and scrolling. Reserved footer is outside textarea, so text/scrollbar cannot lie under action. No visible label/divider/help copy returns, no import of Retailor tokens/busy logic or new dependency. Existing separate busy Cancel request/controller/history/schema/provider/room behavior remain.

## Scoped checks and native observations

Allocated Prettier formatting, ESLint zero warnings and frontend type generation/typecheck pass (.release/BD-inset-types.log). Read-only pass1 inspects all ten allocated paths and neighboring Send/focus/controller authority: Meets ticket, no actionable findings. No static-label/style mirror test or repeated full suite/build for this presentation-only correction; prior BB847-test/both-build proof remains historical and current hot reload differs from that production artifact. No fresh full-root/build/source identity claim.

Fresh fake-ready disposable room tab53 on sole4320/private4321; existing user room untouched. At1280×720, actual parent border1px/input border0px, focus-within outline3px and transparent action background/white glyph. Parent124.5px high; textarea78.5px;44×44 action sits fully inside. Empty welcome stays scrollable/reachable. After actual Shift+Enter, textarea has newline; Enter sends hi/local greeting and clears input; blank input disables the same action. Keyboard Tab moves from textarea to Send message with3px button focus. Actual arrow click sends hello/local greeting.

Long18-line input has scrollHeight722/clientHeight79. Native wheel scroll yields actual scrollTop100; field bottom and button top both659px, proving the reserved footer separates scrolling text and action. The initial Control+End observation did not move scrollTop; no keyboard-scroll claim is made. Short1280×600 composer bottom584/action bottom583 stay reachable. Phone390×844 composer335px wide at20..355,44px button308..352, field bottom=button top766.625; document width375 fits viewport. Narrow320×568 composer265px wide20..285, button238..282 and bottom535.08 fits viewport; document width305 fits and actual arrow click sends hi. Both enabled/disabled states observed. Finite hover is source-reviewed, no unavailable native-hover/IME/performance/full-device/blanket accessibility claim.

Desktop/phone screenshots visually inspected. No captured browser errors; viewport reset and tab53 closed. Screenshots in C:/Users/minat/.codex/visualizations/2026/10/20/01a15835-0bd9-7d20-9601-faf2b8383623/: RM-015BD-inset-send.png, RM-015BD-short-inset-send.png, RM-015BD-phone-inset-send.png.

Exact allocated paths only enter the authorized local checkpoint. Build-state helper returns visual review to awaiting_owner; actual owner approval pending. Q held, guide goal paused, RM-016 Planned. No paid/live/config/delegation/new dependency/service/port/push/deploy.
