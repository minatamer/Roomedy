# RM-015AW — Enable selected deletion and protect doors

Status: **Locally implemented and validated; actual owner visual approval pending**, follows db878bd. Latest owner explicitly allows selected furniture (including owned/Keep/locked beds) and windows to be deleted; doors alone stay protected. Read the full [allocation](../commit-plans/RM-015AW.md), [existing AN authority](RM-015AN-simplify-selected-furniture-controls.md), [layout](../design/layout.md), [checklist](../design/REVIEW_CHECKLIST.md) and [feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] Shared room-side Delete works for selected furniture/windows in Explore and Arrange,2D/3D, independent of piece locks/ownership/preference; no confirmation or minimum piece count.
- [x] One command/Undo preserves baseline/other objects; unrelated pre-existing hard issues do not veto pure explicit visitor deletion. Other edit/assistant/new-conflict/lifecycle policies remain.
- [x] Doors (including bathroom-purpose) cannot be removed through inspector, room-side controls, MEDY or shared command batches; window removal remains available. No new door requirement on rooms/import/reset/Undo.
- [x] Meaningful focused regressions and actual desktop/short/narrow current-app observations, read-only validation, settled root/both builds/current identity and exact local checkpoint. Actual visual approval pending, Q held, guide paused, RM-016 Planned.
