# RM-015 — Consolidated visual-review checkpoint

20 October 2026. Input HEAD `65048e2`. The owner explicitly asks for a file-level commit plan, authorizes staging/committing and will review the visual feedback later. Actual Git inspection found no staged, unstaged or untracked files: the implementation is already committed. Do not fabricate another application diff or restage historical source. Save this consolidation/checklist as a documentation-only local checkpoint under the new explicit approval.

## Exact allocation before edits

1. `docs/commit-plans/RM-015-VISUAL-REVIEW-CHECKPOINT.md` — record the clean input, exact new documentation scope and historical file inventory.
2. `docs/reviews/2026-10-20-visual-feedback-checklist.md` — one owner-facing checklist of delivered visual/interaction feedback, with pending work distinguished.
3. `docs/README.md` — link the consolidated review entry point and actual commit state.
4. `docs/ROOMEDY.md` — link this checkpoint; update only its canonical build-progress record through the existing helper, retaining the visual gate.
5. `docs/tickets/README.md` — link the review checklist and reconcile already committed latest refinements.

## Authority and verification

Implementation through `65048e2` is already checkpointed; b14a407 records rounded side-panel corners,618add8 catalogue dragging,25135b7 in-chat proposal decisions and575d907 shared glass. Latest executable verification remains602 tests in 46 files plus 7 boundaries/root/both builds, with source/BUILD_ID `1e94dc09455fba3db4489bc72dce787acb551c3e8ebc959ca00b8102cd1b7a58`. This documentation commit must not change those executable bytes or claim fresh browser/tests/build results.

Review all five documentation owners read-only after writing; check exact allocation, local links/fragments, unchanged executable input and whitespace. Stage only these five exact paths, inspect the staged set and create a local `RM-015` documentation checkpoint. No empty application commit, squash/reset, push/deploy, paid/live calls, new service, delegation or security artifacts. Actual owner visual approval remains pending; the owner will review later. This is no visual waiver or authority to resume Q, the paused guide goal, RM-016 or later quality/security work.

## Historical implementation file inventory

The inventory below is generated from actual Git for the feedback range `825b5af` through `65048e2` (`bfcaa6f..65048e2`). These are already committed files, included for traceability; none belongs to this new five-file staging set. Earlier A–O visual foundations and their packet plans are linked in the review checklist. Individual packet plans retain their original before-edit allocations and verification limits.

### Already committed corrections

| Commit | Checkpoint |
| --- | --- |
| `825b5af` | RM-015P: reduce landing rendering work and refine hero reveal |
| `5d4a3c3` | RM-015R: fill demo space with adaptive room previews |
| `4420f69` | RM-015S: stabilize and simplify room editing |
| `433a241` | RM-015T: separate photo intake and manual room entry |
| `630df3c` | RM-015U: slide windows along their walls in both views |
| `e0dd545` | RM-015V: frame the corner opposite the doorway |
| `9a6c6d2` | RM-015W: offer the quick tour by default with smooth transitions |
| `83f3716` | RM-015X: export 3D models and branded design portfolios |
| `27b0130` | RM-015Y: refine photo capture and responsive galleries |
| `59dae0a` | RM-015Z: simplify photo intake and infer photo roles |
| `a8f1c02` | RM-015AA: add useful furniture size presets |
| `6db513e` | RM-015AB: give the editor its full working height |
| `42b400a` | RM-015AC: temporarily hide room comparison controls |
| `133e154` | RM-015AD: checkpoint queued appearance and editor refinements |
| `575d907` | RM-015AI: reuse shared glass for Undo and Project |
| `25135b7` | RM-015AJ: keep AI proposal decisions in chat and expire notices |
| `618add8` | RM-015AK: add furniture by dragging into 2D and 3D |
| `b14a407` | RM-015AK: match side-panel corners to the room frame |
| `65048e2` | RM-015AL: open new editor rooms in 3D by default |

### Exact historical paths (211)

Git status codes below describe the aggregate committed range, not pending changes.

```text
M	AGENTS.md
M	apps/backend/src/recognition/fixtures.ts
M	apps/backend/src/recognition/recognize.ts
M	apps/frontend/package.json
M	apps/frontend/public/brand/roomedy-apple-180.png
M	apps/frontend/public/brand/roomedy-icon-192.png
M	apps/frontend/public/brand/roomedy-icon-512.png
M	apps/frontend/public/brand/roomedy-icon-96.png
M	apps/frontend/public/brand/roomedy-icon.svg
A	apps/frontend/public/examples/bedroom-corner-one.webp
A	apps/frontend/public/examples/bedroom-corner-two.webp
M	apps/frontend/public/favicon.ico
M	apps/frontend/public/landing/LICENSES.md
D	apps/frontend/public/landing/material-narrow.webp
D	apps/frontend/public/landing/material-wide.webp
A	apps/frontend/src/app/demo/demo-atmosphere.tsx
A	apps/frontend/src/app/demo/demo.module.css
M	apps/frontend/src/app/demo/page.tsx
M	apps/frontend/src/app/globals.css
M	apps/frontend/src/app/layout.tsx
M	apps/frontend/src/features/assistant/assistant.module.css
M	apps/frontend/src/features/assistant/assistant.tsx
M	apps/frontend/src/features/assistant/controller.ts
A	apps/frontend/src/features/assistant/tour-layout.ts
A	apps/frontend/src/features/assistant/tour-runtime.ts
A	apps/frontend/src/features/assistant/tour.module.css
M	apps/frontend/src/features/assistant/tour.tsx
M	apps/frontend/src/features/catalogue/finishes.ts
A	apps/frontend/src/features/design-export/capture.ts
A	apps/frontend/src/features/design-export/facts.ts
A	apps/frontend/src/features/design-export/job.ts
A	apps/frontend/src/features/design-export/obj.ts
A	apps/frontend/src/features/design-export/pdf.ts
A	apps/frontend/src/features/design-export/portfolio.ts
A	apps/frontend/src/features/design-export/scene.ts
M	apps/frontend/src/features/landing/furniture-scene.tsx
M	apps/frontend/src/features/landing/landing.module.css
M	apps/frontend/src/features/landing/landing.tsx
M	apps/frontend/src/features/landing/scroll-room.tsx
D	apps/frontend/src/features/landing/window-glass.ts
M	apps/frontend/src/features/plan-view/adapter.ts
M	apps/frontend/src/features/plan-view/plan-view.tsx
M	apps/frontend/src/features/room-editor/catalogue-panel.tsx
A	apps/frontend/src/features/room-editor/catalogue-placement-input.ts
A	apps/frontend/src/features/room-editor/catalogue-placement-ui.tsx
A	apps/frontend/src/features/room-editor/catalogue-placement.module.css
A	apps/frontend/src/features/room-editor/catalogue-placement.ts
M	apps/frontend/src/features/room-editor/editor-entry.tsx
M	apps/frontend/src/features/room-editor/editor.module.css
M	apps/frontend/src/features/room-editor/editor.tsx
A	apps/frontend/src/features/room-editor/export-dialog.tsx
A	apps/frontend/src/features/room-editor/export.module.css
A	apps/frontend/src/features/room-editor/furniture-size-form.tsx
M	apps/frontend/src/features/room-editor/inspector.tsx
A	apps/frontend/src/features/room-editor/preview-change-list.tsx
M	apps/frontend/src/features/room-editor/project-controls.tsx
M	apps/frontend/src/features/room-editor/room-panel.tsx
A	apps/frontend/src/features/room-editor/size-presets.ts
A	apps/frontend/src/features/room-editor/surface-controls.tsx
A	apps/frontend/src/features/room-intake/capture-guide.module.css
A	apps/frontend/src/features/room-intake/capture-guide.tsx
M	apps/frontend/src/features/room-intake/draft.ts
A	apps/frontend/src/features/room-intake/example-photos.ts
M	apps/frontend/src/features/room-intake/intake-entry.tsx
M	apps/frontend/src/features/room-intake/intake.module.css
M	apps/frontend/src/features/room-intake/intake.tsx
M	apps/frontend/src/features/room-intake/photo-store.ts
A	apps/frontend/src/features/room-intake/photo-viewer.module.css
A	apps/frontend/src/features/room-intake/photo-viewer.tsx
M	apps/frontend/src/features/room-intake/review-controller.ts
M	apps/frontend/src/features/room-intake/review-panel.tsx
M	apps/frontend/src/features/room-view/camera.ts
A	apps/frontend/src/features/room-view/catalogue-ghost.tsx
M	apps/frontend/src/features/room-view/cutaway.tsx
M	apps/frontend/src/features/room-view/manipulation.ts
M	apps/frontend/src/features/room-view/room-view.module.css
M	apps/frontend/src/features/room-view/scene.tsx
M	apps/frontend/src/features/room-view/surfaces.ts
M	apps/frontend/src/features/room-view/use-floor-edit.ts
A	apps/frontend/src/features/room-view/window-glass.ts
A	apps/frontend/src/features/room-view/window-manipulation.ts
M	apps/frontend/src/features/session/controller.ts
A	apps/frontend/src/features/session/entry/entry-room-preview.tsx
M	apps/frontend/src/features/session/entry/entry-state.ts
M	apps/frontend/src/features/session/entry/guest-entry.tsx
A	apps/frontend/src/features/session/entry/recovery-choice.tsx
M	apps/frontend/src/features/session/fixtures/rooms.ts
M	apps/frontend/src/features/session/state.ts
M	docs/README.md
M	docs/ROOMEDY.md
A	docs/commit-plans/RM-015AA.md
A	docs/commit-plans/RM-015AB.md
A	docs/commit-plans/RM-015AC.md
A	docs/commit-plans/RM-015AD-AI-CHECKPOINT.md
A	docs/commit-plans/RM-015AD.md
A	docs/commit-plans/RM-015AE.md
A	docs/commit-plans/RM-015AF.md
A	docs/commit-plans/RM-015AG.md
A	docs/commit-plans/RM-015AH.md
A	docs/commit-plans/RM-015AI.md
A	docs/commit-plans/RM-015AJ.md
A	docs/commit-plans/RM-015AK.md
A	docs/commit-plans/RM-015AL.md
A	docs/commit-plans/RM-015P.md
A	docs/commit-plans/RM-015R.md
A	docs/commit-plans/RM-015S.md
A	docs/commit-plans/RM-015T.md
A	docs/commit-plans/RM-015U.md
A	docs/commit-plans/RM-015V.md
A	docs/commit-plans/RM-015W.md
A	docs/commit-plans/RM-015X.md
A	docs/commit-plans/RM-015Y.md
A	docs/commit-plans/RM-015Z.md
M	docs/design/REVIEW_CHECKLIST.md
M	docs/design/catalogue.md
M	docs/design/layout.md
M	docs/design/motion.md
M	docs/design/performance.md
M	docs/design/room-view.md
M	docs/design/visual-direction.md
M	docs/design/visual-review.md
M	docs/engineering/assistant.md
M	docs/engineering/guest-lifecycle.md
M	docs/engineering/image-intake.md
M	docs/engineering/room-recognition.md
M	docs/engineering/spatial-rules.md
M	docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md
A	docs/references/design-export-2026-10-19.md
A	docs/references/furniture-sizes-2026-10-19.md
A	docs/references/photo-capture-assets-2026-10-19.md
A	docs/references/retailor-tour-2026-10-19.md
M	docs/tickets/README.md
A	docs/tickets/RM-015AA-add-useful-furniture-size-presets.md
A	docs/tickets/RM-015AB-fill-the-editor-working-height.md
A	docs/tickets/RM-015AC-temporarily-hide-room-comparison.md
A	docs/tickets/RM-015AD-pick-and-infer-wall-and-floor-surfaces.md
A	docs/tickets/RM-015AE-match-editor-window-glass-to-landing.md
A	docs/tickets/RM-015AF-enlarge-and-simplify-browser-icon.md
A	docs/tickets/RM-015AG-clarify-plan-direction-and-add-rotation.md
A	docs/tickets/RM-015AH-correct-interior-horizontal-camera-drag.md
A	docs/tickets/RM-015AI-simplify-editor-tool-navigation.md
A	docs/tickets/RM-015AJ-keep-proposal-decisions-in-chat.md
A	docs/tickets/RM-015AK-drag-furniture-from-the-catalogue.md
A	docs/tickets/RM-015AL-open-editor-in-3d.md
A	docs/tickets/RM-015P-restore-smooth-landing-scrolling.md
A	docs/tickets/RM-015Q-add-restrained-warm-room-lighting.md
A	docs/tickets/RM-015R-fill-demo-flow-with-useful-adaptive-content.md
A	docs/tickets/RM-015S-stabilize-and-simplify-room-editing.md
A	docs/tickets/RM-015T-separate-photo-and-manual-room-entry.md
A	docs/tickets/RM-015U-drag-windows-along-their-walls.md
A	docs/tickets/RM-015V-frame-the-corner-opposite-the-doorway.md
A	docs/tickets/RM-015W-start-the-quick-tour-by-default.md
A	docs/tickets/RM-015X-export-3d-models-and-design-portfolios.md
A	docs/tickets/RM-015Y-refine-photo-capture-and-responsive-cards.md
A	docs/tickets/RM-015Z-simplify-photo-intake-and-infer-photo-roles.md
A	docs/validation/RM-015AA.md
A	docs/validation/RM-015AB.md
A	docs/validation/RM-015AC.md
A	docs/validation/RM-015AD-AI.md
A	docs/validation/RM-015AD.md
A	docs/validation/RM-015AE.md
A	docs/validation/RM-015AF.md
A	docs/validation/RM-015AG.md
A	docs/validation/RM-015AH.md
A	docs/validation/RM-015AI.md
A	docs/validation/RM-015AJ.md
A	docs/validation/RM-015AK.md
A	docs/validation/RM-015AL.md
A	docs/validation/RM-015P.md
A	docs/validation/RM-015R.md
A	docs/validation/RM-015S.md
A	docs/validation/RM-015T.md
A	docs/validation/RM-015U.md
A	docs/validation/RM-015V.md
A	docs/validation/RM-015W.md
A	docs/validation/RM-015X.md
A	docs/validation/RM-015Y.md
A	docs/validation/RM-015Z.md
M	packages/contracts/package.json
M	packages/contracts/src/commands.ts
M	packages/contracts/src/intake.ts
M	packages/contracts/src/policy.ts
M	packages/contracts/src/room.ts
A	packages/contracts/src/surfaces.ts
M	packages/spatial/src/catalogue.ts
M	packages/spatial/src/commands.ts
M	packages/spatial/src/search/engine.ts
M	packages/spatial/src/search/facts.ts
M	pnpm-lock.yaml
M	test/assistant-lifecycle.test.ts
A	test/automatic-photo-purpose.test.ts
A	test/camera-corner.test.ts
A	test/catalogue-placement.test.ts
M	test/catalogue.test.ts
A	test/design-export-job.test.ts
A	test/design-export.test.ts
M	test/draft-review.test.ts
M	test/entry.test.ts
A	test/example-photos.test.ts
A	test/furniture-sizes.test.ts
M	test/integrated-journeys.test.ts
M	test/plan.test.ts
M	test/project-lifecycle.test.ts
M	test/recognition.test.ts
A	test/room-surfaces.test.ts
M	test/room-view.test.ts
M	test/search-scope.test.ts
M	test/session-persistence.test.ts
M	test/session.test.ts
A	test/tour.test.ts
A	test/window-edit.test.ts
```

## Documentation closeout

Read-only pass1 reviewed all five allocated documentation owners, the current human stage/commit authorization, checklist coverage/status, historical Git inventory and unchanged application evidence. No source edits, tests, index mutation or delegation during the pass; no actionable findings. Exact five-path scope, empty index, 480 local links/fragments, exact 211-path historical inventory and whitespace passed. Current executable digest still matches production BUILD_ID `1e94dc09455fba3db4489bc72dce787acb551c3e8ebc959ca00b8102cd1b7a58`; prior 602-test/build proof remains applicable without rerunning it for prose. Only this closeout and the helper-owned build record are reconciled after review. Exact local documentation commit prepared; actual owner visual approval remains pending.
