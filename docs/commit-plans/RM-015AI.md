# RM-015AI — Simplify the editor tool navigation

20 October2026. HEAD42b400a; AD–AH64-path batch unstaged. Owner selects removing Quick tour from this tool row, both surrounding horizontal lines and temporarily hiding Checks. Owner then says they are sleeping: no questions, take recommended decisions. Earlier testing instruction was to defer until queued tasks finish; complete this last selected cleanup first, then one settled final pass. Existing local checkpoint authority applies after validation; actual owner visual approval remains pending. No paid/live/new dependency/service/port/delegation/push/deploy.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AI-simplify-editor-tool-navigation.md`
6. `docs/commit-plans/RM-015AI.md`
7. `docs/validation/RM-015AI.md`
8. `docs/design/layout.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/src/features/room-editor/editor.tsx`
11. `apps/frontend/src/features/room-editor/editor.module.css`
12. `apps/frontend/src/features/assistant/tour.tsx`

## Implementation and evidence

Natively hide the Checks tab button, preserving its definition, evaluator/panel and the assistant's contextual issue navigation. This hides a navigation entry, not safety checks or useful issue details. Do not normalize every contextual Checks panel away. Remove the header bottom border and tool-row bottom border only, retaining selected-button treatment and transparent warm chrome.

Add a scoped optional hideReplay prop to the existing tour owner and enable it in this editor. The hidden native replay button occupies no row/focus/AX space; keep the tour component mounted in its existing tree to preserve current lifecycle/state instead of recreating an automatic welcome on panel moves. Default welcome/Start/Skip stays as previously requested. On close, when no visible opener/replay exists, return focus to the existing focusable room heading after restoring inert state. Keep the replay implementation for future deliberate placement, with default behavior intact elsewhere. Add a scoped hidden display rule so responsive button styling cannot override native hiding.

Inspect actual fresh welcome/Skip, focus return, exactly four row actions, both computed borders, warm background continuity and narrow controls. Finish all selected queued UI edits before final automated tests/build/checkpoint; do not continue the held Q/paused guide/RM-016 or infer owner visual acceptance. Record settled-batch verification separately from earlier pre-deferral evidence and update canonical progress via helper only.


Settled checkpoint allocation refinement before batch evidence creation: `docs/commit-plans/RM-015AD-AI-CHECKPOINT.md` and `docs/validation/RM-015AD-AI.md` join the existing packet union. The [exact70-path batch plan](RM-015AD-AI-CHECKPOINT.md) owns final reconciliation of the six already allocated ticket/receipt sets, root/source proof, full read-only review and one atomic local checkpoint after this final queued cleanup. No unrelated source owner is added.
