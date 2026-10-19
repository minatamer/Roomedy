# RM-015AC — Temporarily hide Before/Current

20 October2026. Clean parent6db513e, AB committed. Direct owner: “before/current feels like a dead feature, HIDE IT only for now, dont delete it yet.” Existing scoped execute/validate/fix/revalidate/local checkpoint authority persists. Actual visual acceptance pending; Q held, guide paused, RM-016 Planned. No paid/live/new service/port/dependency/delegation/push/deploy.

## Exact allocation before source edits

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ROOMEDY.md`
4. `docs/tickets/README.md`
5. `docs/tickets/RM-015AC-temporarily-hide-room-comparison.md`
6. `docs/commit-plans/RM-015AC.md`
7. `docs/validation/RM-015AC.md`
8. `docs/design/layout.md`
9. `docs/design/visual-review.md`
10. `apps/frontend/src/features/room-editor/editor.tsx`
11. `apps/frontend/src/features/room-editor/editor.module.css`
12. `apps/frontend/src/features/assistant/tour.tsx`
13. `docs/tickets/RM-015AB-fill-the-editor-working-height.md`
14. `docs/validation/RM-015AB.md`

## Implementation and acceptance

1. Hide only the editor comparison group with native hidden plus a scoped display rule; leave full buttons/handlers/styles, controller, baseline, import/export/recovery and comparison tests intact. No new product setting, flag infrastructure or feature deletion. Current is the visible editable room; normalize a Before state retained through hot reload using the existing presentation command, preserving semantics/history. Fresh/restored entry already defaults Current. Guard normalization so ordinary previews do not trigger comparison messages.
2. Retarget the existing third tour step to the actual Undo button, remove its mention of hidden controls and preserve proposal Apply/Cancel/Undo guidance, finite target readiness and all Start/Skip/Back/Next/Done behavior. Keep the hidden comparison target annotation for later restoration, but the active tour must never target it.
3. Preserve full editor height,2D/3D switching, selected inspector, real commands/Undo, proposal/lifecycle notices, export baseline and warm responsive layout. Native hidden controls have no box/tab/AX presence at desktop/phone; no blank toolbar reservation or invisible tour wait.
4. Check native fresh/tour/2D/3D/edit/Undo and relevant responsive sizes. No CSS/static label mirror tests; retain existing meaningful session/tour checks via the established settled root gate. Verify exact current runtime inputs/build identity, all14paths in read-only validation, independently fix/revalidate until clean, then exact authorized local commit. Actual owner/physical/GPU/Linux/hosted/live limits separate.
5. Record AB6db513e as committed; keep one canonical progress record through its helper. This temporarily supersedes visible Before/Current in blueprint§9.6 and W tour target only; underlying capability remains implemented.
