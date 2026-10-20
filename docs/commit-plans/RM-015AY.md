# RM-015AY — Refine Medy identity and chat

20October2026; clean parent db4348b. Owner selects Medy (not uppercase MEDY), the usual AI sparkle, right-aligned visitor text and left-aligned assistant replies without bubbles. Older conversation remains scrollable.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AY-refine-medy-identity-and-chat.md`
6. `docs/commit-plans/RM-015AY.md`
7. `docs/validation/RM-015AY.md`
8. `docs/design/layout.md`
9. `docs/engineering/assistant.md`
10. `apps/frontend/src/features/assistant/assistant.tsx`
11. `apps/frontend/src/features/assistant/assistant.module.css`
12. `apps/frontend/src/features/assistant/medy-icon.tsx`
13. `apps/frontend/src/features/assistant/tour.tsx`
14. `apps/frontend/src/features/room-editor/editor.tsx`
15. `apps/frontend/src/features/room-editor/editor.module.css`
16. `apps/frontend/src/features/landing/landing.tsx`
17. `apps/frontend/src/features/landing/landing.module.css`
18. `apps/backend/src/assistant/assistant.ts`
19. `packages/spatial/src/medy.ts`

## Implementation and verification

1. Display Medy consistently in editor navigation/header/composer/accessible response names, welcome/fake replies, tour, landing example/CTA and real-provider instruction. Preserve technical identifiers, semantic task/command policy and previous historical records. Bump only the assistant prompt identity revision to track the copy change; no key/config/mode/provider authority change.
2. One small decorative aria-hidden four-point SVG sparkle is shared by assistant heading, navigation and landing identity/example. Use existing cocoa palette and useful alignment; no package/brand/media dependency or redundant text.
3. Visitor messages keep the warm bubble, fit content within a bounded percentage, align to the right and right-align text. Assistant messages are left-aligned, full useful width and plain without bubble background/border, including cards/proposals/errors/progress. Match landing's illustrative exchange. Preserve motion/markup/semantic live log and all actual actions.
4. Retain one bounded scrolling history/composer owner, existing finite context/byte policy and automatic latest-message presentation. Prevent flex children shrinking instead of overflowing; make the log keyboard-focusable with a visible focus ring. No new history store, unbounded retention, setting, custom scrollbar, polling or artificial message seed.
5. Native actual greetings/long request, long conversation scroll to old/new messages using keyboard, proposal Apply/Cancel and composer reachability on desktop/short/phone; landing name/sparkle/conversation checked. No static-label/CSS mirror tests; use existing meaningful assistant/protocol/lifecycle suites and settled root/both builds/exact identity. Read-only review all19paths, independently fix/revalidate findings, exact authorized local checkpoint. Actual owner visual approval pending, Q held, guide paused, RM-016 Planned. No paid/live/delegation/dependencies/services/ports/push/deploy.
