# RM-015V — Frame the corner opposite the doorway

Status: **Planned; direct owner correction before joint visual acceptance**. Depends on RM-015U; Q lighting held and RM-016 Planned. Current authority: latest direct owner feedback in this chat, existing plan→execute→read-only validate→independently fix/revalidate→exact local commit loop. Not an actual result approval or paid/live/delegation/deploy/push/new-port authority.

## Thorough implementation plan

The owner defines Corner as the corner diagonally opposite the corner nearest the doorway. Reuse the same relevant doorway/entry selection as Doorway view, compute nearest endpoint corner from its recorded wall/offset/width with deterministic tie handling, then select the diagonally opposite in-room eye-level corner and aim into the room. Read existing safe camera/collision/path authority and exact allocation first. Preserve safe padding/obstacle/furniture/height/unknown checks, bounded deterministic search/overhead fallback and continuous travel from displayed pose; do not replace invalid geometry with invented door confirmation. If the exact corner is occupied, choose the nearest valid pose in that intended opposite-corner area through existing policy; explicit unavailable behavior when no relevant safe pose exists. Cover each doorway wall, both ends/tie, unknown/multiple/overlapping/blocked door cases, dimension changes and physical room aspect; actual forward/reverse/retarget/resize and partial/furnished2D→3D views. No room commands, lock/data mutation or extra renderer/animation setting. Meaningful pure and actual camera checks, finite resource/timing evidence, applicable root/exact builds, clean full-scope validation and local checkpoint; actual owner/GPU/native/paint/live acceptance distinct.

## Acceptance

- [ ] Selected complete behavior and owning states implemented through existing shared authority, preserving finite bounds, truthful provenance and useful failure paths.
- [ ] Current responsive/interaction and meaningful deterministic evidence recorded, with exact local root/build/source gate.
- [ ] Full allocated-scope read-only validation clean after independently checked findings; exact authorized local checkpoint.
- [ ] Actual owner visual acceptance — remains pending; external/device/native/paint/Linux/hosted/live limitations explicit.

Precision: [blueprint](../ROOMEDY.md), [layout](../design/layout.md), [room view](../design/room-view.md), [motion](../design/motion.md), [checklist](../design/REVIEW_CHECKLIST.md), [feedback](../references/LESSONS_FROM_VISUAL_FEEDBACK.md). Allocate and document exact code/test/evidence owners before any implementation edit.
