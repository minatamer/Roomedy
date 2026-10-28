# RM-015BN–BY and CPQ atomic checkpoint —29 October2026

Direct owner instruction: “file commit plan and stage and commit will review everything tomorrow when i have time”, followed by “continue”. This authorizes the file-level plan, exact staging and one local commit before the owner's visual review. Earlier no-Git notices remain historical implementation holds and are superseded only for this checkpoint. Visual/manual review remains pending for30October2026; actual photo appearance quality still requires a human Cloudflare check. No push, deployment, provider call, env edit, app restart, new dependency/service/port or delegation is authorized or needed.

Base: `ff110547293f7937ef2f3a39fd66f984e52ac1b4`, existing `main` branch. The interrupted request left an empty index and no new commit. One atomic commit preserves the final integrated state: BN–BY and RM-031/RM-032 share scene/material, session/assistant, CPQ/USD and documentation files; a file-by-ticket split would create incomplete intermediate integration states. Intended subject: `RM-015BN-BY: checkpoint landing, CPQ and appearance refinements`.

Exact **189 paths**: all187 completed dirty files plus this plan and its checkpoint receipt.123 application/config/contract/spatial/test paths retain their tested bytes; this task changes checkpoint documentation only. Every path is individually enumerated below. Stage with a NUL-delimited exact pathspec; never use a directory wildcard or git add all.

| Path | Commit purpose / owning scope |
| --- | --- |
| `AGENTS.md` | Checkpoint authority, progress and pending owner review; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS, RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY, RM-031, RM-032. |
| `apps/backend/src/assistant/assistant.ts` | Medy advice, tools and safe request flow; RM-015BV, RM-015BW, RM-015BX, RM-015BY. |
| `apps/backend/src/assistant/tools.ts` | Medy advice, tools and safe request flow; RM-015BV. |
| `apps/backend/src/recognition/fixtures.ts` | Photo colour/pattern estimates and strict fixture parity; RM-015BY. |
| `apps/backend/src/recognition/recognize.ts` | Photo colour/pattern estimates and strict fixture parity; RM-015BY. |
| `apps/backend/src/runtime/create-runtime.ts` | Bounded content-free diagnostics; RM-031. |
| `apps/backend/src/server.ts` | Compose sourcing diagnostics with normal runtime; RM-031. |
| `apps/backend/src/sourcing/exchange-rates.ts` | USD sourcing, FX and evidence normalization; RM-031. |
| `apps/backend/src/sourcing/fake.ts` | USD sourcing, FX and evidence normalization; RM-015BQ. |
| `apps/backend/src/sourcing/sourcing.ts` | USD sourcing, FX and evidence normalization; RM-031. |
| `apps/frontend/next.config.ts` | Versioned public-material HTTP cache policy; RM-015BO. |
| `apps/frontend/src/app/globals.css` | Shared scrollbar/body surface presentation; RM-015BU. |
| `apps/frontend/src/app/layout.tsx` | Shared scrollbar/body surface presentation; RM-015BU. |
| `apps/frontend/src/features/assistant/assistant.module.css` | Visual concise Medy, supported choices and actual material previews; RM-015BT, RM-015BU, RM-032. |
| `apps/frontend/src/features/assistant/assistant.tsx` | Visual concise Medy, supported choices and actual material previews; RM-015BU, RM-015BV, RM-015BX, RM-015BY, RM-032. |
| `apps/frontend/src/features/assistant/chat-icon.tsx` | Visual concise Medy, supported choices and actual material previews; RM-032. |
| `apps/frontend/src/features/assistant/controller.ts` | Visual concise Medy, supported choices and actual material previews; RM-015BW, RM-015BX. |
| `apps/frontend/src/features/assistant/guidance.ts` | Visual concise Medy, supported choices and actual material previews; RM-015BX, RM-032. |
| `apps/frontend/src/features/assistant/surface-preview.tsx` | Visual concise Medy, supported choices and actual material previews; RM-032. |
| `apps/frontend/src/features/assistant/thinking-status.tsx` | Visual concise Medy, supported choices and actual material previews; RM-015BU. |
| `apps/frontend/src/features/cost/attach-offer.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031. |
| `apps/frontend/src/features/cost/brief.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031. |
| `apps/frontend/src/features/cost/chat-visuals.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-032. |
| `apps/frontend/src/features/cost/client.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031. |
| `apps/frontend/src/features/cost/estimate-pdf-controls.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031, RM-032. |
| `apps/frontend/src/features/cost/estimate-pdf.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031. |
| `apps/frontend/src/features/cost/plan-cards.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-032. |
| `apps/frontend/src/features/cost/planning.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-015BQ. |
| `apps/frontend/src/features/cost/research.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031, RM-032. |
| `apps/frontend/src/features/cost/scope-controls.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031. |
| `apps/frontend/src/features/cost/source-card.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-032. |
| `apps/frontend/src/features/cost/state.ts` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-032. |
| `apps/frontend/src/features/cost/version-controls.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031, RM-032. |
| `apps/frontend/src/features/cost/workspace.module.css` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-015BT, RM-031, RM-032. |
| `apps/frontend/src/features/cost/workspace.tsx` | Visual CPQ conversation, USD estimates/sourcing/PDF and reviewed state; RM-031, RM-032. |
| `apps/frontend/src/features/design-export/portfolio.ts` | Matching material colours/patterns in portfolio and3D export; RM-015BY. |
| `apps/frontend/src/features/design-export/scene.ts` | Matching material colours/patterns in portfolio and3D export; RM-015BY. |
| `apps/frontend/src/features/landing/finish-materials.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BP. |
| `apps/frontend/src/features/landing/finish-motion.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BP. |
| `apps/frontend/src/features/landing/finish-scene.tsx` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BP. |
| `apps/frontend/src/features/landing/furniture-batches.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BO. |
| `apps/frontend/src/features/landing/furniture-scene.tsx` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BO, RM-015BP, RM-015BS. |
| `apps/frontend/src/features/landing/house-loader.tsx` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BS. |
| `apps/frontend/src/features/landing/landing.module.css` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BS. |
| `apps/frontend/src/features/landing/landing.tsx` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BN, RM-015BP, RM-015BQ. |
| `apps/frontend/src/features/landing/prepare-scene.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BO. |
| `apps/frontend/src/features/landing/scroll-motion.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BO, RM-015BP, RM-015BR, RM-015BS. |
| `apps/frontend/src/features/landing/scroll-room.tsx` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS. |
| `apps/frontend/src/features/landing/story-estimate.ts` | Progressive3D landing, CPQ finishing story and loading presentation; RM-015BP, RM-015BQ. |
| `apps/frontend/src/features/plan-view/plan-view.tsx` | Canonical2D colours for furniture/openings; RM-015BY. |
| `apps/frontend/src/features/room-editor/checks-panel.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BV. |
| `apps/frontend/src/features/room-editor/colour-picker.module.css` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/colour-picker.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/editor-entry.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BX. |
| `apps/frontend/src/features/room-editor/editor.module.css` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BT, RM-015BY. |
| `apps/frontend/src/features/room-editor/furniture-material-controls.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BX, RM-015BY. |
| `apps/frontend/src/features/room-editor/inspector.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/messages.ts` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BV. |
| `apps/frontend/src/features/room-editor/opening-material-controls.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/preview-change-list.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/surface-controls.tsx` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BY. |
| `apps/frontend/src/features/room-editor/view-controls.module.css` | Warm studio controls, planning presentation and RGB/pattern editing; RM-015BT, RM-015BU. |
| `apps/frontend/src/features/room-intake/draft.ts` | Preserve supported source-bound photo appearance; RM-015BY. |
| `apps/frontend/src/features/room-intake/intake.module.css` | Preserve supported source-bound photo appearance; RM-015BU. |
| `apps/frontend/src/features/room-intake/photo-appearance.ts` | Preserve supported source-bound photo appearance; RM-015BY. |
| `apps/frontend/src/features/room-view/room-view.module.css` | Shared finite appearance/render/cache/resource ownership; RM-015BT. |
| `apps/frontend/src/features/room-view/scene.tsx` | Shared finite appearance/render/cache/resource ownership; RM-015BY. |
| `apps/frontend/src/features/room-view/surface-assets.ts` | Shared finite appearance/render/cache/resource ownership; RM-015BO. |
| `apps/frontend/src/features/room-view/surfaces.ts` | Shared finite appearance/render/cache/resource ownership; RM-015BO, RM-015BY. |
| `apps/frontend/src/features/session/clearance.ts` | Plain fresh-manual defaults and retained shared session authority; RM-015BV. |
| `apps/frontend/src/features/session/controller.ts` | Plain fresh-manual defaults and retained shared session authority; RM-032. |
| `apps/frontend/src/features/session/entry/entry-room-preview.tsx` | Plain fresh-manual defaults and retained shared session authority; RM-015BX, RM-015BY. |
| `apps/frontend/src/features/session/entry/manual-room.ts` | Plain fresh-manual defaults and retained shared session authority; RM-015BX. |
| `apps/frontend/src/styles/tokens.css` | Shared warm theme tokens; RM-015BT. |
| `docs/README.md` | Checkpoint authority, progress and pending owner review; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS, RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY, RM-031, RM-032. |
| `docs/ROOMEDY.md` | Checkpoint authority, progress and pending owner review; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS, RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY, RM-031, RM-032. |
| `docs/Roomedy Extension for CPQ.md` | Current policies, primary references and review handoff; RM-015BQ. |
| `docs/commit-plans/RM-015BN-BY-CPQ-CHECKPOINT.md` | Exact batch allocation and verification receipt; RM-015BN. |
| `docs/commit-plans/RM-015BN.md` | Original per-ticket exact allocation; RM-015BN. |
| `docs/commit-plans/RM-015BO.md` | Original per-ticket exact allocation; RM-015BO. |
| `docs/commit-plans/RM-015BP.md` | Original per-ticket exact allocation; RM-015BP. |
| `docs/commit-plans/RM-015BQ.md` | Original per-ticket exact allocation; RM-015BQ. |
| `docs/commit-plans/RM-015BR.md` | Original per-ticket exact allocation; RM-015BR. |
| `docs/commit-plans/RM-015BS.md` | Original per-ticket exact allocation; RM-015BS. |
| `docs/commit-plans/RM-015BT.md` | Original per-ticket exact allocation; RM-015BT. |
| `docs/commit-plans/RM-015BU.md` | Original per-ticket exact allocation; RM-015BU. |
| `docs/commit-plans/RM-015BV.md` | Original per-ticket exact allocation; RM-015BV. |
| `docs/commit-plans/RM-015BW.md` | Original per-ticket exact allocation; RM-015BW. |
| `docs/commit-plans/RM-015BX.md` | Original per-ticket exact allocation; RM-015BX. |
| `docs/commit-plans/RM-015BY.md` | Original per-ticket exact allocation; RM-015BY. |
| `docs/commit-plans/RM-031.md` | Original per-ticket exact allocation; RM-031. |
| `docs/commit-plans/RM-032.md` | Original per-ticket exact allocation; RM-032. |
| `docs/design/REVIEW_CHECKLIST.md` | Current policies, primary references and review handoff; RM-015BP, RM-015BR, RM-031. |
| `docs/design/catalogue.md` | Current policies, primary references and review handoff; RM-015BX, RM-015BY. |
| `docs/design/layout.md` | Current policies, primary references and review handoff; RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX. |
| `docs/design/motion.md` | Current policies, primary references and review handoff; RM-015BO, RM-015BP, RM-015BR, RM-015BS. |
| `docs/design/performance.md` | Current policies, primary references and review handoff; RM-015BO, RM-015BP, RM-015BS. |
| `docs/design/plan-and-cost.md` | Current policies, primary references and review handoff; RM-015BQ, RM-031, RM-032. |
| `docs/design/visual-direction.md` | Current policies, primary references and review handoff; RM-015BT. |
| `docs/engineering/assistant.md` | Current policies, primary references and review handoff; RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY. |
| `docs/engineering/estimate-pdf.md` | Current policies, primary references and review handoff; RM-031. |
| `docs/engineering/estimates.md` | Current policies, primary references and review handoff; RM-015BQ, RM-031. |
| `docs/engineering/provider-safety.md` | Current policies, primary references and review handoff; RM-031. |
| `docs/engineering/sourcing.md` | Current policies, primary references and review handoff; RM-015BQ, RM-031. |
| `docs/engineering/spatial-rules.md` | Current policies, primary references and review handoff; RM-015BV. |
| `docs/operations/CPQ_LOCAL_HANDOFF.md` | Current policies, primary references and review handoff; RM-015BQ, RM-031. |
| `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md` | Current policies, primary references and review handoff; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS, RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY, RM-031, RM-032. |
| `docs/references/landing-performance-audit-2026-10-28.md` | Current policies, primary references and review handoff; RM-015BO. |
| `docs/references/usd-equivalents-2026-10-28.md` | Current policies, primary references and review handoff; RM-031. |
| `docs/tickets/README.md` | Checkpoint authority, progress and pending owner review; RM-015BN, RM-015BO, RM-015BP, RM-015BQ, RM-015BR, RM-015BS, RM-015BT, RM-015BU, RM-015BV, RM-015BW, RM-015BX, RM-015BY, RM-031, RM-032. |
| `docs/tickets/RM-015BN-use-device-aware-scroll-cues.md` | Owner-selected ticket scope and acceptance; RM-015BN. |
| `docs/tickets/RM-015BO-speed-up-the-landing-room.md` | Owner-selected ticket scope and acceptance; RM-015BO. |
| `docs/tickets/RM-015BP-show-the-cpq-scroll-story.md` | Owner-selected ticket scope and acceptance; RM-015BP. |
| `docs/tickets/RM-015BQ-use-usd-throughout-the-demo.md` | Owner-selected ticket scope and acceptance; RM-015BQ. |
| `docs/tickets/RM-015BR-raise-the-walls-at-the-end.md` | Owner-selected ticket scope and acceptance; RM-015BR. |
| `docs/tickets/RM-015BS-restore-landing-scale-and-add-house-loader.md` | Owner-selected ticket scope and acceptance; RM-015BS. |
| `docs/tickets/RM-015BT-unify-studio-beige-surfaces.md` | Owner-selected ticket scope and acceptance; RM-015BT. |
| `docs/tickets/RM-015BU-refine-thinking-and-shared-scrollbars.md` | Owner-selected ticket scope and acceptance; RM-015BU. |
| `docs/tickets/RM-015BV-continue-ai-with-planning-estimates.md` | Owner-selected ticket scope and acceptance; RM-015BV. |
| `docs/tickets/RM-015BW-make-medy-proactive-and-offer-useful-choices.md` | Owner-selected ticket scope and acceptance; RM-015BW. |
| `docs/tickets/RM-015BX-start-manual-rooms-plain-and-suggest-materials.md` | Owner-selected ticket scope and acceptance; RM-015BX. |
| `docs/tickets/RM-015BY-capture-photo-appearance-and-edit-rgb-patterns.md` | Owner-selected ticket scope and acceptance; RM-015BY. |
| `docs/tickets/RM-031-review-live-cpq-and-usd-sourcing.md` | Owner-selected ticket scope and acceptance; RM-031. |
| `docs/tickets/RM-032-make-cost-and-medy-chat-visual.md` | Owner-selected ticket scope and acceptance; RM-032. |
| `docs/validation/RM-015BN-BY-CPQ-CHECKPOINT.md` | Exact batch allocation and verification receipt; RM-015BN. |
| `docs/validation/RM-015BN.md` | Recorded per-ticket checks, fixes and limits; RM-015BN. |
| `docs/validation/RM-015BO.md` | Recorded per-ticket checks, fixes and limits; RM-015BO. |
| `docs/validation/RM-015BP.md` | Recorded per-ticket checks, fixes and limits; RM-015BP. |
| `docs/validation/RM-015BQ.md` | Recorded per-ticket checks, fixes and limits; RM-015BQ. |
| `docs/validation/RM-015BR.md` | Recorded per-ticket checks, fixes and limits; RM-015BR. |
| `docs/validation/RM-015BS.md` | Recorded per-ticket checks, fixes and limits; RM-015BS. |
| `docs/validation/RM-015BT.md` | Recorded per-ticket checks, fixes and limits; RM-015BT. |
| `docs/validation/RM-015BU.md` | Recorded per-ticket checks, fixes and limits; RM-015BU. |
| `docs/validation/RM-015BV.md` | Recorded per-ticket checks, fixes and limits; RM-015BV. |
| `docs/validation/RM-015BW.md` | Recorded per-ticket checks, fixes and limits; RM-015BW. |
| `docs/validation/RM-015BX.md` | Recorded per-ticket checks, fixes and limits; RM-015BX. |
| `docs/validation/RM-015BY.md` | Recorded per-ticket checks, fixes and limits; RM-015BY. |
| `docs/validation/RM-031.md` | Recorded per-ticket checks, fixes and limits; RM-031. |
| `docs/validation/RM-032.md` | Recorded per-ticket checks, fixes and limits; RM-032. |
| `packages/contracts/src/assistant.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BV. |
| `packages/contracts/src/commands.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BY. |
| `packages/contracts/src/estimates.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BQ, RM-031. |
| `packages/contracts/src/furniture-materials.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BX, RM-015BY. |
| `packages/contracts/src/intake.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BY. |
| `packages/contracts/src/room.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BY. |
| `packages/contracts/src/sourcing.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-031. |
| `packages/contracts/src/surfaces.ts` | Strict compatible appearance/assistant/USD/sourcing contracts; RM-015BY. |
| `packages/spatial/src/assistant.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV. |
| `packages/spatial/src/commands.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BY. |
| `packages/spatial/src/design-opportunities.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BW, RM-015BX. |
| `packages/spatial/src/estimate-catalogue.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BQ. |
| `packages/spatial/src/estimate-fx.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-031. |
| `packages/spatial/src/estimates.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-031. |
| `packages/spatial/src/index.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV, RM-015BW, RM-015BX, RM-031. |
| `packages/spatial/src/medy-edits.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BX, RM-015BY. |
| `packages/spatial/src/medy.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV, RM-015BW, RM-015BX. |
| `packages/spatial/src/planning.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV. |
| `packages/spatial/src/quick-replies.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV, RM-015BW, RM-015BX, RM-015BY. |
| `packages/spatial/src/search/engine.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV. |
| `packages/spatial/src/search/facts.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV. |
| `packages/spatial/src/search/scope.ts` | Pure bounded planning, Medy/material choices and USD calculations; RM-015BV. |
| `test/assistant-intent.test.ts` | Regression coverage for the allocated behavior; RM-015BV. |
| `test/assistant-quick-replies.test.ts` | Regression coverage for the allocated behavior; RM-015BV, RM-015BW, RM-015BX. |
| `test/assistant-tools.test.ts` | Regression coverage for the allocated behavior; RM-015BV. |
| `test/clearance-notices.test.ts` | Regression coverage for the allocated behavior; RM-015BV. |
| `test/cost-chat-visuals.test.ts` | Regression coverage for the allocated behavior; RM-032. |
| `test/cost-planning.test.ts` | Regression coverage for the allocated behavior; RM-015BQ. |
| `test/cost-workspace.test.ts` | Regression coverage for the allocated behavior; RM-015BQ. |
| `test/design-opportunities.test.ts` | Regression coverage for the allocated behavior; RM-015BW. |
| `test/estimate-fx.test.ts` | Regression coverage for the allocated behavior; RM-031. |
| `test/estimate-pdf.test.ts` | Regression coverage for the allocated behavior; RM-015BQ, RM-031. |
| `test/estimate-versions.test.ts` | Regression coverage for the allocated behavior; RM-015BQ, RM-031. |
| `test/estimates.test.ts` | Regression coverage for the allocated behavior; RM-015BQ. |
| `test/exchange-rates.test.ts` | Regression coverage for the allocated behavior; RM-031. |
| `test/furniture-materials.test.ts` | Regression coverage for the allocated behavior; RM-015BX, RM-015BY. |
| `test/landing-batches.test.ts` | Regression coverage for the allocated behavior; RM-015BO. |
| `test/landing-finishes.test.ts` | Regression coverage for the allocated behavior; RM-015BP. |
| `test/landing-motion.test.ts` | Regression coverage for the allocated behavior; RM-015BO, RM-015BP, RM-015BR, RM-015BS. |
| `test/landing-preparation.test.ts` | Regression coverage for the allocated behavior; RM-015BO. |
| `test/landing-story.test.ts` | Regression coverage for the allocated behavior; RM-015BP, RM-015BQ. |
| `test/layout-search.test.ts` | Regression coverage for the allocated behavior; RM-015BV. |
| `test/manual-materials.test.ts` | Regression coverage for the allocated behavior; RM-015BX. |
| `test/medy-parity.test.ts` | Regression coverage for the allocated behavior; RM-015BW, RM-015BX. |
| `test/photo-appearance.test.ts` | Regression coverage for the allocated behavior; RM-015BY. |
| `test/photo-furniture-editing.test.ts` | Regression coverage for the allocated behavior; RM-015BY. |
| `test/planning.test.ts` | Regression coverage for the allocated behavior; RM-015BV. |
| `test/rgb-materials.test.ts` | Regression coverage for the allocated behavior; RM-015BY. |
| `test/sourcing.test.ts` | Regression coverage for the allocated behavior; RM-015BQ, RM-031. |
| `test/surface-assets.test.ts` | Regression coverage for the allocated behavior; RM-015BO. |

## Exclusions and verification

Exclude and preserve ignored owner env files, credentials, `.release/` runtime/evidence and checkpoint manifests, dependencies, build/cache outputs, logs, generated `apps/frontend/next-env.d.ts`, screenshots and Desktop/task-output galleries. No deleted file or temporary review route belongs to this checkpoint. No extra app or financial/material behavior edit.

The final feature gate already passed1303tests/83files, format/lint/types,7boundary probes, exact assets and both production builds. At this checkpoint, all32final BY source/test hashes and145prior nonallocated hashes still match; together they prove every current application/config/test input is unchanged. Reuse that settled gate rather than rebuilding unchanged code and disturbing the running app. Perform fresh checkpoint documentation formatting, whitespace, source identity, credential-pattern and exact staged-scope/blob checks. No new paid/browser/visual-quality claim.

Before committing, require exactly these189 index paths, normal Git-attribute blob identity, no unstaged or unexpected path, no generated/local/credential artifact and unchanged base HEAD. Commit only that reviewed index, then verify the commit's exact path set, parent and a clean worktree. Git owns the resulting commit/tree identity; report its hash after success without embedding a self-referential hash in these files. Keep the owner's30October visual review and live-photo human-verification limit pending.
