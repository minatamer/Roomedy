# RM-006 — Deliver the synchronized 3D cutaway

Status: **Complete locally; exact authorized commit pending**
Planning date: **17 October 2026**  
Milestone: **Editable room**  
Depends on: [RM-005](RM-005-deliver-canonical-session-and-precision-2d-editor.md)  
Suggested commit: `RM-006: deliver synchronized stylized 3d cutaway`  
Authority: [blueprint §§7–8](../ROOMEDY.md#7-workspace-and-manual-editing), [§13](../ROOMEDY.md#13-furniture-and-asset-pipeline), [§14.4](../ROOMEDY.md#144-rendering-and-work-ownership)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-03–L-05, L-08, L-17) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Render a polished stylized room cutaway in the **main editor** using React Three Fiber/Three and selected Drei helpers. It shows the exact current room, selection, candidate and baseline snapshots supplied by the canonical controller. The 2D plan remains the precision editing surface; 3D provides orbit, zoom, reset, selection and inspection.

There is no 3D initial-review preview, direct 3D furniture dragging or separate 3D room model. Photos produce a rough 2D sketch first. Renderable furniture resembles supported categories at reviewed sizes; mesh detail cannot redefine fit. The selected warm visual direction needs convincing materials, lighting, framing and deliberate transitions, with actual owner review reserved for RM-015. The website uses the latest beige/brown/earth/wood direction; studio chrome may use black/white neutrals. Neither changes canonical room/furniture finishes.

## Dependency evidence and proposed ownership

Confirm the real controller/selection interfaces, coordinate corpus and RM-002 asset manifest. Rendering bugs are fixed at adapters/assets, not by altering canonical sizes.

| Area | Responsibility |
| --- | --- |
| `features/room-view/` | R3F scene, room shell, representations, camera, picking and candidate overlays |
| `features/room-editor/` | Plan/cutaway toggle and shared selection/inspection composition |
| `features/session/` read projections | Readonly snapshot/camera interfaces; no new room authority |
| `public/catalogue/` and representation metadata | Only necessary corrections to prepared owned assets |
| `docs/design/room-view.md` and view checks | Visual/resource budget, coordinate mapping and tested limitations |

## Implementation plan

1. Lazy-load the cutaway only after main-editor entry. Initial review and landing must not initialize its canvas, GPU context or heavy scene dependencies. Provide useful 2D/manual operation if WebGL is unavailable.
2. Build room floor/cutaway walls and supported windows/doors/obstacles from semantic dimensions. Convert millimetres to metres once at the adapter. Apply the documented X/Z/Y convention, center pose, front direction and mesh transform exactly.
3. Place procedural/fixed representations from the versioned catalogue. Share materials/geometries safely; preserve floor contact and reviewed dimensions. Missing assets use a truthful supported fallback and visible approximation where necessary.
4. Create warm stylized materials, controlled shadows, lighting and camera composition suitable for the small bedroom/workspace. Keep selected furniture legible and maintain deliberate motion without an off switch or OS suppression.
5. Implement bounded orbit/zoom/reset and object picking tied to shared stable IDs. Selecting a piece in either view updates the same inventory/inspector. View/camera changes are presentation effects, not semantic commands/history/provider work.
6. Accept readonly preview and Before/Current snapshot inputs from the same renderer. Candidate ghosts/check regions are distinguishable from accepted objects and do not mutate current data. Never create two independently editable scene graphs to support comparison.
7. Show relevant issue regions/selection without claiming unsupported exact clearance visualization. Preserve approximate/unassessed labels in adjacent accessible UI. Screen-reader/numeric/keyboard alternatives remain available through the plan/inspector.
8. Define cache/ownership/disposal policy for assets, materials, subscriptions and canvas lifecycle. Reset/route exit releases owned resources without disposing an asset still shared by another live view. Handle context loss and loading failure safely.
9. Measure representative frame/interaction/loading/memory observations and keep the scene within provisional asset budgets. An idle on-demand render optimization may be used only if controls and active motion invalidate until complete. RM-015 finalizes device evidence and tuned limits.

## Prevention requirements from prior feedback

Rendering is one view of the current room, not another scene authority. Preserve coherent frame/selection/ghost motion while assets load; loading and failure do not unnecessarily replace the useful plan. Inspect actual asset size/placement and active motion, not just declared animation styles or saved screenshot existence.

## Approved plan refinements — 17 October 2026

**Coordinate, evidence and representation fidelity.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Consume revised half-millimetre centres exactly at the metre adapter. Depict an owned object's true bounded physical size through an eligible procedural model or explicitly limited semantic placeholder when a detailed fixed asset cannot represent it. Never change fit dimensions to suit a mesh. Read per-fact evidence/assessment coverage from the same document; a guessed original pose does not become confirmed because the rendering is precise. Use the internal visual baseline and separately measured orbit/transition frames; INP alone does not establish continuous canvas smoothness.

## Acceptance criteria

- [x] Cutaway loads only in the main editor; initial review has no 3D control/canvas.
- [x] Room and furniture positions/sizes/fronts agree with plan and independent canonical fixtures.
- [x] Orbit/zoom/reset/selection work without changing room revision or generating provider calls.
- [x] Manual commands, Undo and later previews can update both views from the same snapshot authority.
- [x] Supported asset sizes remain physical truth; missing/approximate representations are honest.
- [x] Warm stylized materials/lighting and deliberate motion are implemented with bounded scene resources.
- [x] WebGL/context/asset failures preserve useful 2D/manual behavior and safe copy.
- [x] Resource cleanup respects shared ownership on reset, view changes and unmount.
- [x] Actual tested loading/selection/view-switch/failure states preserve useful 2D work and coherent motion without introducing a 3D intake preview or extra render settings.

### Additional approved acceptance — implementation and evidence

- [x] Odd-size/half-millimetre poses and true owned sizes outside detailed representation ranges remain aligned in plan, cutaway and checks without silent stretching.
- [x] Actual loading/orbit/Apply/Undo/view-switch frames and resource behavior are measured separately from discrete-action latency, with relevant uncertainty accessible.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Known rotated desk beside a wall/window | Independent coordinates, apparent dimensions and floor contact in actual renderer |
| Select in plan then cutaway, and reverse | Same stable ID and inspector; no revision/history change |
| Manual move/finish/Undo | Synchronized current snapshots and correct asset placement |
| Candidate and readonly baseline input | Distinct visual state with no canonical mutation |
| Repeated editor entry/reset/view switching | No retained subscriptions/owned GPU resource growth attributable to leaks |
| Unsupported WebGL/context loss/missing asset | Useful 2D fallback and bounded safe error behavior |

## Handoff and limits

Record actual rendered/browser/device evidence separately from unit adapter tests. RM-011 completes assistant candidate display and RM-012 comparison controls; RM-015 owns full performance/owner acceptance. No initial 3D review, photorealistic export, exact-photo reconstruction or direct 3D dragging is added. Follow the index's future execution and evidence rules.

## Execution evidence — 18 October 2026

See [RM-006 receipt](../validation/RM-006.md), [renderer design](../design/room-view.md) and [exact allocation](../commit-plans/RM-006.md). Core local behavior is implemented and browser-checked. Source-reviewed WebGL/context fallback remains without actual fault injection; physical-device/maximum-room/production proof and final owner visual acceptance remain explicitly open. Acceptance boxes record implemented local behavior; they do not claim the explicitly unperformed fault/device/owner checks. The final settled gate and read-only pass have completed without remaining actionable findings.
