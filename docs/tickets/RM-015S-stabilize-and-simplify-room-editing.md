# RM-015S — Stabilize and simplify room editing

Status: **Implemented/locally verified; read-only pass1 clean, actual visual approval pending**. Dependency R committed5d4a3c3. [Exact39-path plan](../commit-plans/RM-015S.md), [current blueprint](../ROOMEDY.md), [layout](../design/layout.md), [room view](../design/room-view.md), [motion](../design/motion.md), [checklist](../design/REVIEW_CHECKLIST.md), [E manipulation contract](RM-015E-edit-furniture-directly-in-3d.md), [current evidence](../validation/RM-015S.md).

Latest owner requests: outward furniture dragging should mean farthest feasible edge/corner; frame must not shrink on moves; remove under-frame check summary/routine Move piece message and navbar Your room /2D plan; simply2D/3D labels; real3D dragging currently fails even with mode selected; position/rotation default unlocked, dimensions default locked; basic/Advanced furniture inspector with coherent warm typography/colours including empty states; transparent studio navbar; matching Export/Import on one row with divider before Reset. These are selected corrections, not approval of the result. Existing exact local execute/validate/commit authority persists; no delegation/paid/live/deploy/push/reset-credit or new app listener.

## Acceptance

- [x] Same bounded footprint-aware edge/corner placement in2D/3D preview and captured release, Snap on/off/odd sizes/rotations, one command/Undo; shared collisions, locks, provenance, read-only and lifecycle fencing retained.
- [x] Reproduced3D drag failure fixed through the actual event path and verified with native pointer movement on representative partial/furnished rooms; no bypass or fake success.
- [x] Constant frame/viewBox/canvas geometry across select/move/commit/Undo; remove requested redundant visual rows/label, keep real contextual failures/accessible announcements, transparent navbar and simple2D/3D names.
- [x] Basic/Advanced furniture controls preserve real state/field units/errors/focus/drafts/locks; coherent warm typography/surfaces across empty/selected/unknown/locked/error/narrow states.
- [x] New initial/added/drafted/proposed furniture default locks false/false/true, while explicit/restored/imported locks and strict command rules remain authoritative; relevant fake assistance/search rechecked.
- [x] Project Export/Import matched row/divider/Reset, usable file focus/limits/busy/errors/confirmation/privacy/cleanup preserved.
- [x] Current meaningful focused and settled gates, exact input/build identity, actual size/state/interaction evidence and clean full-scope read-only validation; exact local checkpoint prepared.
- [ ] Actual owner visual approval — stays unchecked. T photo/manual+example photos, U window drag and V door-relative Corner remain next selected corrections; Q held, guide paused and RM-016 Planned. External/device/physical/native/paint/live outcomes separate.
