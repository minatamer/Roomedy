# RM-062 — Animate the first landing scroll

31 October 2026. **Complete locally; owner aesthetic/physical acceptance pending.** Direct owner reports no visible 3D change between “Make room for the way you live” and “Every room has a starting point.”

The real first chapter maps to progress 0.15, while orbit previously starts at 0.28, visible furniture movement at 0.17 and finishing later. Bring the existing orbit and its coupled camera lift forward so native scroll, the section button and keyboard input visibly change the room during this first interval. Keep the exact opening and final poses, continuous bounded motion in both directions, interruption/restored-offset behavior and idle frame sleep. Preserve subsequent furniture/paint/floor/wall timing, large desktop/opposite-copy/narrow composition, actual preparation and one scene/frame owner. No perpetual idle animation or new controls/copy.

Reuse the existing landing behavioral and geometry regressions; verify actual desktop/short/tablet/phone forward, reverse, keyboard/button and settled/restored states. Run scoped format/lint/frontend types/boundaries/frontend build and a read-only validate/fix/revalidate pass. No backend/full-unit rerun or new mirror tests for this timing-only change. [Allocation](../commit-plans/RM-062.md), [receipt](../validation/RM-062.md).

Keep current services/env/other apps and the RM-058 paid-test stop. No paid/provider operation, restart, Chrome/delegation, dependency/service/port, staging/commit/push/deploy. Owner aesthetic/physical acceptance remains pending.

Completion: the existing orbit spans0–0.50, giving10.52degrees of visible first-chapter turn with its coupled camera lift.39existing landing tests/five files, scoped format/lint/frontend types/seven boundaries and frontend production build pass. Actual in-app desktop/short/tablet/phone, partial/reverse, section-button/native keyboard, ready restored-offset and idle/finale checks pass. Read-only review has no actionable findings; no new test or unrelated full/backend gate. Source change is one function's timing window.
