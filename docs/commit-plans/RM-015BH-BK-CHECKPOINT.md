# RM-015BH–BK atomic checkpoint —21 October2026

Latest direct owner instruction: “ok perfect” and “lets do file level commit plan and you can stage and commit this time”. This explicitly authorizes planning, staging and one local commit of the completed BH–BK work. Prior no-staging/no-commit statements are implementation-stage history, superseded only for this checkpoint. No push/deploy, paid/live call, env change, new dependency/service/port, delegation or unrelated feature work.

Base: `aacd65e0a30523a9e2422175beebb97b7bf86845` on the existing `main` branch. One atomic commit is appropriate because BH–BK share admission/contracts, assistant/controller and canonical documentation owners. Splitting current files by ticket would leave overlapping integration changes in intermediate commits. Intended subject: `RM-015BH-BK prepare AI flows and editable photo furniture`.

Exact **85 paths**, allocated before checkpoint documentation edits and staging.83 existing feature files plus this plan and one batch receipt. Each row is a complete file allocation; use explicit paths rather than `git add .`.

| Path | Commit purpose |
| --- | --- |
| `AGENTS.md` | Record this exact owner-authorized checkpoint and preserve remaining gates. |
| `apps/backend/.env.example` | Document the three backend credentials and remove obsolete operator fields. |
| `apps/backend/README.md` | Describe pinned model, local setup and real verification requirements. |
| `apps/backend/src/assistant/assistant.ts` | Generate and validate contextual quick replies in the existing provider answer. |
| `apps/backend/src/assistant/fake.ts` | Simulate the same contextual response contract in fake mode. |
| `apps/backend/src/config/runtime-config.ts` | Parse Turnstile configuration and key-only pinned-model readiness. |
| `apps/backend/src/providers/model.ts` | Pin the owner-selected shared photo/Medy model in code. |
| `apps/backend/src/providers/responses.ts` | Use the shared model default without an operator model setting. |
| `apps/backend/src/runtime/create-runtime.ts` | Compose the configured verifier and preserve runtime readiness gates. |
| `apps/backend/src/runtime/operations.ts` | Bind verification to actual operation inputs and existing admission authority. |
| `apps/backend/src/security/turnstile.ts` | Bound Siteverify I/O and check hostname, action and input binding. |
| `apps/backend/src/server.ts` | Load normal environment and compose real provider/verifier only when configured. |
| `apps/frontend/.env.example` | Keep only frontend-local setup and point credentials to the backend. |
| `apps/frontend/README.md` | Document local setup, pinned provider and shared lazy verification. |
| `apps/frontend/src/app/layout.tsx` | Mount the single transient verification host. |
| `apps/frontend/src/features/assistant/assistant.module.css` | Theme typing, chat and composer-adjacent quick replies with warm glass. |
| `apps/frontend/src/features/assistant/assistant.tsx` | Render latest-only choices above the composer after text reveal. |
| `apps/frontend/src/features/assistant/client.ts` | Use the shared verified admission handshake. |
| `apps/frontend/src/features/assistant/controller.ts` | Own reveal/guidance/reply identity and existing revision/lifecycle fences. |
| `apps/frontend/src/features/assistant/guidance.ts` | Provide a small progressive welcome and contextual local follow-ups. |
| `apps/frontend/src/features/assistant/message-reveal.ts` | Compute finite word reveal without changing accessible message content. |
| `apps/frontend/src/features/assistant/revealed-text.tsx` | Render finite reveal and report completion for the latest choices. |
| `apps/frontend/src/features/assistant/tour.tsx` | Report actual tour participation/completion to welcome guidance. |
| `apps/frontend/src/features/design-export/scene.ts` | Export selected prepared finishes, lamp shades and TV cases consistently. |
| `apps/frontend/src/features/room-editor/editor.tsx` | Connect existing editor/tour ownership to Medy welcome lifetime. |
| `apps/frontend/src/features/room-editor/furniture-size-form.tsx` | Expose custom owned estimates even when a fixed asset has no presets. |
| `apps/frontend/src/features/room-intake/draft.ts` | Leave fresh photo assumptions unlocked while preserving prior edits. |
| `apps/frontend/src/features/room-intake/recognition-client.ts` | Share admission/verification with photo processing. |
| `apps/frontend/src/features/room-view/representations/definitions.ts` | Make TV case material follow selected finish while preserving its screen. |
| `apps/frontend/src/features/room-view/scene.tsx` | Retarget instance finish with finite motion and preserve opening nodes. |
| `apps/frontend/src/features/room-view/surfaces.ts` | Own prepared material colour/texture targets and bounded disposal. |
| `apps/frontend/src/features/session/admission-client.ts` | Share one bounded challenge/proof/admission handshake across AI flows. |
| `apps/frontend/src/features/verification/state.ts` | Own one transient prompt with cancellation and stale-callback fences. |
| `apps/frontend/src/features/verification/turnstile.ts` | Load/render the vendor widget lazily with quiet interaction-only behavior. |
| `apps/frontend/src/features/verification/verification.module.css` | Fit the compact verification dialog to the website and narrow/short screens. |
| `apps/frontend/src/features/verification/verification.tsx` | Present accessible interaction/cancel/focus handling only when needed. |
| `docs/README.md` | Index the checkpoint and its current feature evidence. |
| `docs/ROOMEDY.md` | Record scoped owner authorization in the canonical progress context. |
| `docs/commit-plans/RM-015BH-BK-CHECKPOINT.md` | Own the exact85-path atomic commit allocation and exclusions. |
| `docs/commit-plans/RM-015BH.md` | RM-015BH implementation allocation. |
| `docs/commit-plans/RM-015BI.md` | RM-015BI implementation allocation. |
| `docs/commit-plans/RM-015BJ.md` | RM-015BJ implementation allocation. |
| `docs/commit-plans/RM-015BK.md` | RM-015BK implementation allocation. |
| `docs/design/catalogue.md` | Document full palette, editable photo settings and truthful size fallback. |
| `docs/design/layout.md` | Document composer-adjacent quick replies and shared chat presentation. |
| `docs/engineering/assistant.md` | Document finite welcome and independently validated contextual replies. |
| `docs/engineering/image-intake.md` | Document unlocked photo assumptions and preserved deliberate corrections. |
| `docs/engineering/provider-safety.md` | Document real Turnstile composition and pinned-model setup. |
| `docs/evaluation/README.md` | Align explicit paid evaluation requirements with pinned runtime configuration. |
| `docs/references/LESSONS_FROM_VISUAL_FEEDBACK.md` | Retain the owner lesson that photo inference never removes editing controls. |
| `docs/tickets/README.md` | Index the scoped checkpoint without advancing RM-016. |
| `docs/tickets/RM-015BH-prepare-live-mode-and-turnstile.md` | RM-015BH feature acceptance and scope. |
| `docs/tickets/RM-015BI-simplify-medys-first-conversation.md` | RM-015BI feature acceptance and scope. |
| `docs/tickets/RM-015BJ-contextual-quick-replies.md` | RM-015BJ feature acceptance and scope. |
| `docs/tickets/RM-015BK-keep-photo-furniture-editable.md` | RM-015BK feature acceptance and scope. |
| `docs/validation/RM-015BH-BK-CHECKPOINT.md` | Record settled batch checks, source identity and scope limitations. |
| `docs/validation/RM-015BH.md` | RM-015BH actual checks and remaining limits. |
| `docs/validation/RM-015BI.md` | RM-015BI actual checks and remaining limits. |
| `docs/validation/RM-015BJ.md` | RM-015BJ actual checks and remaining limits. |
| `docs/validation/RM-015BK.md` | RM-015BK actual checks and remaining limits. |
| `packages/contracts/src/api.ts` | Expose verification information through the existing admission response. |
| `packages/contracts/src/assistant.ts` | Bound raw quick reply label/request pairs in the strict response format. |
| `packages/contracts/src/operations.ts` | Define bounded admission proof/input challenge data. |
| `packages/spatial/src/catalogue.ts` | Offer all six finishes while keeping existing default ordering. |
| `packages/spatial/src/index.ts` | Export the pure shared contextual reply validators. |
| `packages/spatial/src/quick-replies.ts` | Validate/deduplicate/stamp harmless reply choices against current context. |
| `scripts/evaluate-roomedy.mjs` | Use pinned model and include its source in explicit evaluation identity. |
| `scripts/evaluation/options.ts` | Remove obsolete environment gates while retaining explicit evaluation policy. |
| `scripts/isolated-mode.ts` | Clear Turnstile credentials before offline tests. |
| `scripts/release/probe.mjs` | Remove the obsolete policy flag without breaking Docker argument order. |
| `scripts/run-tests.mjs` | Isolate verification credentials and deny paid/external test dispatch. |
| `test/admission.test.ts` | Challenge/proof handshake and existing grant/replay boundaries. |
| `test/assistant-guidance.test.ts` | Progressive welcome, bounded reveal, tour completion and lifecycle. |
| `test/assistant-intent.test.ts` | Allow the now-supported chair finish without changing command scope. |
| `test/assistant-quick-replies.test.ts` | Strict real/fake wire parity, contextual choices, stale identity and Apply/Undo. |
| `test/catalogue.test.ts` | Full supported palette with unchanged identity, geometry and manual defaults. |
| `test/draft-review.test.ts` | Unlocked fresh draft defaults while retaining explicit reviewed protections. |
| `test/evaluation.test.ts` | Pinned-model policy matching and explicit paid evaluation opt-in. |
| `test/photo-furniture-editing.test.ts` | Photo edits/reprocessing/import/Undo and actual prepared material/export parity. |
| `test/photo-to-studio.test.ts` | Unlocked inferred furniture through complete adoption/baseline/lifetime flow. |
| `test/provider.test.ts` | Pinned default model and bounded actual outgoing structured requests. |
| `test/recognition.test.ts` | Fake admitted photo interpretation without a real verifier or paid dispatch. |
| `test/runtime.test.ts` | Key-only pinned-model readiness and real verification composition. |
| `test/turnstile.test.ts` | Bound vendor validation, contextual mismatch, expiry and failure behavior. |
| `test/verification.test.ts` | Shared frontend handshake, cancellation, timeout and stale widget callbacks. |

## Exclusions and verification

Leave `apps/frontend/next-env.d.ts` unstaged: Next changed only generated imports to its current dev output. Preserve the running app and that working-tree file. Ignored `apps/backend/.env.local`, `apps/frontend/.env.local`, `.release/` runtime/evidence, build outputs, dependencies and logs are excluded. No real credential is to enter the index; example credential fields are blank.

Run the settled full isolated unit suite and lint, inspect exact source identity against prior feature receipts, then format/type/architecture/asset checks appropriate to the staged paths. No production app build or new browser/live-quality claim is needed for this Git checkpoint. Record actual settled evidence in the batch receipt. Update canonical progress with scoped commit authority while retaining09-visual-review awaiting_owner, Q held, guide paused and RM-016 Planned. “Perfect” accepts the requested correction; it does not silently approve all historical visuals or funded model quality.

Before commit, compare the staged path set exactly with all85 rows; inspect staged whitespace, deletions, generated/local/credential exclusions and working-tree identity. Commit only that reviewed index, then verify the commit path set and the sole expected unstaged generated file. No Git action on another repository.
