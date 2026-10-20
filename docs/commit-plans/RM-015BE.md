# RM-015BE — Label doors and adapt plan text

20October2026; clean parent1ebdad3. Owner wants Door/Bathroom Door on2D openings, ordinary Door when purpose is absent, and adaptive object typography including size/word wrapping with edge cases reviewed.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BE-label-doors-and-adapt-plan-text.md`
6. `docs/commit-plans/RM-015BE.md`
7. `docs/validation/RM-015BE.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/plan-view/plan-view.tsx`
10. `apps/frontend/src/features/plan-view/adapter.ts`
11. `apps/frontend/src/features/room-editor/editor.module.css`
12. `test/plan.test.ts`

## Implementation and verification

1. Pure bounded display helpers fit one/two whole-word lines, horizontal or sideways, to physical displayed space. Prefer readable horizontal text when comparable; preserve whole-word wardrobe rotation. Reserve front-arrow space, vary font size, and use nearby horizontal halo captions for thin/tiny/unknown pieces or TVs rather than microscopic/overflowing text. Four deterministic caption candidates clamp to the displayed room and prefer less footprint/door-label overlap. No canonical geometry, checks, provenance, catalogue, export or3D changes.
2. Door names use purpose bathroom only for Bathroom Door, otherwise Door. Place inside the room near the actual known opening on all four walls/mechanisms; wrap Bathroom Door as needed. Missing pose/width remains unplaced rather than inventing an opening. Labels sit above pieces with a restrained halo and forward pointer selection to the same existing door owner, without duplicate keyboard controls. Keep door protection and window editing.
3. One shared SVG text renderer serves fitted furniture/doors, whole-word lines, finish contrast, caption halo and finite180ms transform/type transitions. Preserve elevated-label coverage, actual selection/accessible names, commands/Undo and room/frame sizing. No per-frame semantic writes or added controls/settings/dependencies.
4. Meaningful helper regressions: purpose fallback, four walls/mechanisms/unknowns, narrow/square/rotated/multi-word furniture, thin mirror/TV/small cabinet captions, dark finish behavior, near-wall/corner candidates and all catalogue defaults/presets; finite/nonmutation and fit/clamp assertions. Native fresh2D door/purpose/word-wrap/small pieces/rotation/Undo plus short/phone/zoom observations. No CSS mirror tests.
5. Read-only review/fix/revalidate, close test tabs then settled root/both-build/exact-input gate and exact authorized local commit. Actual owner approval pending; Q held, guide goal paused, RM-016 Planned. No paid/live/config/delegation/new services/ports/push/deploy.


## Settled review correction

Read-only/native preview review found old-position text/outlines crossing the proposed wardrobe name and a potential new door caption. Keep previous outlines behind current room geometry, omit their annotation when it crosses a proposed footprint/door name, and paint door captions after preview/check/drag layers. New door-caption pointer forwarding is disabled during catalogue placement. Add a meaningful annotation-overlap regression; retain ghost outlines and preview semantics. Initial settled run was interrupted before edits, with no orphan test worker found; final source gets a fresh full gate.

## Dimension copy follow-up allocation —20 October2026

Owner removes the word confirmed from the two2D room dimension labels after74764b4. Suppress only the confirmed suffix; retain numeric values/mm, unknown wording and other uncertainty statuses. Shared renderer covers accepted/preview/restored views. No measurement state, provenance, controls, commands,3D or export change. Exact current follow-up allocation before source edits:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BE-label-doors-and-adapt-plan-text.md`
6. `docs/commit-plans/RM-015BE.md`
7. `docs/validation/RM-015BE.md`
8. `apps/frontend/src/features/plan-view/plan-view.tsx`

Use scoped format/lint/frontend types and actual desktop/phone text inspection. No static-copy mirror test or repeated full suite/build for two presentation-only suffixes; previous root/build identity remains historical. Read-only review then exact local checkpoint; actual owner approval pending, Q held, guide paused, RM-016 Planned. No paid/live/config/delegation/new services/ports/push/deploy.

## Window labels follow-up allocation —20 October2026

Clean parent1e9176d. Owner extends2D opening names to windows. Share the opening-caption owner with doors, use Window parallel to its wall, preserve readable small-window captions within the room, missing geometry and all selection/drag/Undo authority. Caption follows the displayed window preview; disable caption interpolation during direct dragging. Include window names in existing bounded caption/previous-position overlap preferences. No canonical facts,3D/export, extra controls or services. Exact allocation before source edits:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015BE-label-doors-and-adapt-plan-text.md`
6. `docs/commit-plans/RM-015BE.md`
7. `docs/validation/RM-015BE.md`
8. `docs/design/layout.md`
9. `apps/frontend/src/features/plan-view/plan-view.tsx`
10. `apps/frontend/src/features/plan-view/adapter.ts`
11. `test/plan.test.ts`

Verify meaningful four-wall/small-window/unknown/nonmutation regressions; scoped format/lint/frontend/test types, actual2D label selection/window move/Undo and narrow fit. Read-only review then exact local checkpoint. Prior full-root/build evidence stays historical; no unnecessary whole-stack restart/build. Actual visual approval pending, Q held, guide paused, RM-016 Planned; no paid/live/config/delegation/new dependency/service/port/push/deploy.

Native review reproduced a side-wall Window caption crossing Wardrobe. Correct within this allocation: preserve the inner position when clear; if any physical furniture footprint covers the caption, put it in the existing outer frame margin instead, away from dimension annotations. Keep its along-wall clamp and orientation, without moving room facts or adding a control. Four-wall regressions cover the fallback. This refines the earlier within-room preference after actual evidence.
