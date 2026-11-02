# RM-093 — downward ceiling-light selection arrows

2 November 2026 · direct owner screenshot correction · clean base `3fc473c`.

The 3D selected-fixture arrow currently indicates horizontal furniture facing even for a downward ceiling light. For all three supported ceiling models, place the same selection arrow just below the fixture center and point it vertically down along the existing beam. Keep the direction invariant under fixture quarter-turns, Day/Night and camera changes. Preserve ordinary floor furniture's horizontal marker, marker style/length/raycast/disposal, selection/inspection ownership, actual illumination, canonical geometry/rotation/history, plan and exports.

A small presentation-only change in the existing selected marker is sufficient. No light aiming controls, model changes, new loop/dependency or broad refactor. Verify actual pendant/flush/track selection, quarter-turn and non-ceiling comparison in the in-app editor, scoped format/lint, existing lighting/room-view checks and frontend build. No new static marker/CSS mirror test or repeated full/backend/security audit. Prior RM-0911798-test evidence stays dated.

[Allocation](../commit-plans/RM-093.md), [receipt](../validation/RM-093.md). Existing exact ticket checkpoint authority applies. Preserve paid-ready services/env; no Send/provider/env/restart/dependency/delegation/Chrome/image/cloud/push/deployment. Owner aesthetic acceptance remains separate.
