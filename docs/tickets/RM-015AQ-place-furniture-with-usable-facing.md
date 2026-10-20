# RM-015AQ — Place furniture with usable facing

Status: **Locally implemented and validated; actual owner visual approval pending**, follows `b617f1a`. Owner: “the furnite should initaklly be placed where the arrow points make sense … why is my wardrobe by default pointing at the wall … this is something that the ai should take into account”. [Exact plan](../commit-plans/RM-015AQ.md), [spatial authority](../engineering/spatial-rules.md), [search](../engineering/layout-search.md), [blueprint](../ROOMEDY.md#10-geometry-and-layout-generation), [checklist](../design/REVIEW_CHECKLIST.md), [lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md).

- [x] Fresh starter wardrobe has its back near a wall and front/access into usable room space. Other authored pieces retain sensible access;2D/3D arrows and rendered front agree.
- [x] New catalogue/numeric additions suggest sensible facing through bounded shared geometry; explicit rotation/replacement and all existing room poses/locks remain intact.
- [x] Shared fake/live assistant planning considers functional front access and back-wall placement within its exact authorized targets. Existing hard validation, bounds, planned provenance and Apply/Undo remain. Photo understanding distinguishes observed facing from a proposed improvement and leaves hidden facing unknown.
- [x] Meaningful geometry/search/placement regressions, actual browser/short/phone/recovery/proposal checks, settled root/build/current identity, read-only review and exact checkpoint. Actual owner visual approval pending; Q held, guide paused, RM-016 Planned.
