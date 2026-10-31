# RM-062–083 — Local review checkpoint

31 October2026. The owner explicitly requests a file-level plan, staging and multiple ticket-prefixed local commits for all current changes. Do not push, deploy or build images. This authorizes this checkpoint only and supersedes the earlier RM-062–083 no-Git notices; all other restrictions remain.

Base `e53a6122e9573261f57b86aa7fd6fd3dd94ab5e8` on existing `main`; entry index empty. Entry contains **143 substantive changed paths**. Adding this plan and its receipt gives **145 committed paths** across five commits. The generated next-env declaration has no normalized content change; preserve its working bytes and refresh index metadata only if necessary. Ignored env/runtime/build/cache/screenshot files remain excluded.

Preserve every entry implementation, test and ticket-document byte. Only AGENTS.md, docs/README.md, docs/ROOMEDY.md and docs/tickets/README.md receive checkpoint notes, in addition to these two new checkpoint documents. Use the existing branch and preserve the final interconnected source blobs. Intermediate commits are review groupings; the completed combined tree carries the existing validation evidence.

The existing public-product/synthetic-room PDF preview is included in commit04 because the current request covers all current changes. This supersedes its earlier not-selected-for-commit allocation for this checkpoint only. Preserve its exact existing bytes; do not generate images or rebuild the PDF. SHA-256: `1b89d31df72c7023edc320d3850bf947d09c09f180a344ec526bf266077f2399`.

| Order | Intended local subject | Paths |
| --- | --- | --- |
| 01 | `RM-062-083: stabilize landing motion on phones and tablets` | 16 |
| 02 | `RM-065-070: source product options and material specifications` | 13 |
| 03 | `RM-063-075: guide product choices and calculate room estimates` | 77 |
| 04 | `RM-076-081: export visual estimates with product photos and links` | 33 |
| 05 | `RM-083: record the local review checkpoint` | 6 |

Landing files stay together. Backend sourcing and material parsing stay with their tests and the RM-070 packet; the same-session chat portion of RM-070 is in the connected Estimate group. Shared pricing, geometry, selections, conversation and studio owners stay together in commit03. The complete PDF renderer, optional-photo route, visual helpers and review artifact stay together in commit04. Shared progress follows last. Each ticket packet is assigned once.

Before each normal commit, verify the exact NUL-delimited path manifest, expected add/update status, path-aware normalized blob IDs, staged whitespace and unchanged unassigned working bytes. Verify parent, tree, path and blob identities afterwards. No amend, hook bypass, configuration override or source reconstruction. The final base-to-HEAD path union must equal this plan, with clean index/worktree and preserved working bytes.

Reuse the settled receipts for RM-062–083; no new implementation/test changes, paid/provider operations, service actions, app builds or image builds are needed. RM-070 records material-page and separate-chat checks; RM-075 records automatic progression/completion checks. RM-080/081 record six-page visual PDF review and four actual app-control fake/simulated-live downloads, including photos and clickable links. RM-083 records44 landing checks, scoped code/build gates and native seven-size/partial-scroll/reverse checks. Fresh checkpoint checks cover documentation formatting, whitespace, path/credential-pattern exclusions, exact bytes and normalized Git blobs. Owner aesthetic/physical/mobile-keyboard, actual merchant/fit/live-model acceptance remain pending.

## Commit01 — RM-062-083: stabilize landing motion on phones and tablets

| Exact path | Change |
| --- | --- |
| `apps/frontend/src/features/landing/furniture-scene.tsx` | update |
| `apps/frontend/src/features/landing/landing.module.css` | update |
| `apps/frontend/src/features/landing/landing.tsx` | update |
| `apps/frontend/src/features/landing/scroll-motion.ts` | update |
| `apps/frontend/src/features/landing/scroll-room.tsx` | update |
| `docs/commit-plans/RM-062.md` | add |
| `docs/commit-plans/RM-082.md` | add |
| `docs/commit-plans/RM-083.md` | add |
| `docs/design/motion.md` | update |
| `docs/tickets/RM-062-animate-the-first-landing-scroll.md` | add |
| `docs/tickets/RM-082-fit-the-landing-room-around-compact-copy.md` | add |
| `docs/tickets/RM-083-stabilize-the-compact-landing-story.md` | add |
| `docs/validation/RM-062.md` | add |
| `docs/validation/RM-082.md` | add |
| `docs/validation/RM-083.md` | add |
| `test/landing-motion.test.ts` | update |

## Commit02 — RM-065-070: source product options and material specifications

| Exact path | Change |
| --- | --- |
| `apps/backend/src/server.ts` | update |
| `apps/backend/src/sourcing/fake.ts` | update |
| `apps/backend/src/sourcing/product-images.ts` | update |
| `apps/backend/src/sourcing/product-materials.ts` | add |
| `apps/backend/src/sourcing/sourcing.ts` | update |
| `docs/commit-plans/RM-070.md` | add |
| `docs/tickets/RM-070-source-material-specs-and-retain-separate-chats.md` | add |
| `docs/validation/RM-070.md` | add |
| `packages/contracts/src/sourcing.ts` | update |
| `test/fake-sourcing-links.test.ts` | add |
| `test/product-images.test.ts` | update |
| `test/product-materials.test.ts` | add |
| `test/sourcing.test.ts` | update |

## Commit03 — RM-063-075: guide product choices and calculate room estimates

| Exact path | Change |
| --- | --- |
| `apps/frontend/src/features/assistant/controller.ts` | update |
| `apps/frontend/src/features/cost/attach-offer.ts` | update |
| `apps/frontend/src/features/cost/chosen-products.tsx` | add |
| `apps/frontend/src/features/cost/conversation.ts` | add |
| `apps/frontend/src/features/cost/estimate-presentation.ts` | update |
| `apps/frontend/src/features/cost/estimate-review.tsx` | update |
| `apps/frontend/src/features/cost/journey-cards.tsx` | update |
| `apps/frontend/src/features/cost/journey.ts` | update |
| `apps/frontend/src/features/cost/listed-prices.ts` | add |
| `apps/frontend/src/features/cost/market-research.ts` | update |
| `apps/frontend/src/features/cost/options-prompt.tsx` | add |
| `apps/frontend/src/features/cost/planning.ts` | update |
| `apps/frontend/src/features/cost/product-carousel.tsx` | add |
| `apps/frontend/src/features/cost/product-choices.ts` | add |
| `apps/frontend/src/features/cost/research.tsx` | update |
| `apps/frontend/src/features/cost/selection-guide.ts` | add |
| `apps/frontend/src/features/cost/source-card.tsx` | update |
| `apps/frontend/src/features/cost/state.ts` | update |
| `apps/frontend/src/features/cost/versions.ts` | update |
| `apps/frontend/src/features/cost/workspace.module.css` | update |
| `apps/frontend/src/features/cost/workspace.tsx` | update |
| `apps/frontend/src/features/room-editor/editor.module.css` | update |
| `apps/frontend/src/features/room-editor/editor.tsx` | update |
| `apps/frontend/src/features/session/controller.ts` | update |
| `apps/frontend/src/features/session/project.ts` | update |
| `docs/commit-plans/RM-063.md` | add |
| `docs/commit-plans/RM-064.md` | add |
| `docs/commit-plans/RM-065.md` | add |
| `docs/commit-plans/RM-066.md` | add |
| `docs/commit-plans/RM-067.md` | add |
| `docs/commit-plans/RM-068.md` | add |
| `docs/commit-plans/RM-069.md` | add |
| `docs/commit-plans/RM-071.md` | add |
| `docs/commit-plans/RM-072.md` | add |
| `docs/commit-plans/RM-073.md` | add |
| `docs/commit-plans/RM-074.md` | add |
| `docs/commit-plans/RM-075.md` | add |
| `docs/design/plan-and-cost.md` | update |
| `docs/tickets/RM-063-keep-estimate-panel-height-and-embed-header.md` | add |
| `docs/tickets/RM-064-show-cost-breakdown-as-a-chat-reply.md` | add |
| `docs/tickets/RM-065-find-options-before-an-unpriced-breakdown.md` | add |
| `docs/tickets/RM-066-open-product-option-carousels.md` | add |
| `docs/tickets/RM-067-choose-products-and-complete-the-estimate.md` | add |
| `docs/tickets/RM-068-add-selected-listing-prices.md` | add |
| `docs/tickets/RM-069-calculate-whole-room-material-quantities.md` | add |
| `docs/tickets/RM-071-recommend-whole-room-options-in-start-card.md` | add |
| `docs/tickets/RM-072-dismiss-starting-cards-on-research.md` | add |
| `docs/tickets/RM-073-cover-walls-and-clarify-product-cards.md` | add |
| `docs/tickets/RM-074-guide-product-choices-one-at-a-time.md` | add |
| `docs/tickets/RM-075-advance-after-product-choice.md` | add |
| `docs/validation/RM-063.md` | add |
| `docs/validation/RM-064.md` | add |
| `docs/validation/RM-065.md` | add |
| `docs/validation/RM-066.md` | add |
| `docs/validation/RM-067.md` | add |
| `docs/validation/RM-068.md` | add |
| `docs/validation/RM-069.md` | add |
| `docs/validation/RM-071.md` | add |
| `docs/validation/RM-072.md` | add |
| `docs/validation/RM-073.md` | add |
| `docs/validation/RM-074.md` | add |
| `docs/validation/RM-075.md` | add |
| `packages/contracts/src/estimates.ts` | update |
| `packages/spatial/src/estimates.ts` | update |
| `packages/spatial/src/selected-takeoff.ts` | add |
| `test/assistant-lifecycle.test.ts` | update |
| `test/cost-breakdown.test.ts` | add |
| `test/cost-conversation.test.ts` | add |
| `test/cost-journey.test.ts` | update |
| `test/cost-planning.test.ts` | update |
| `test/cost-product-media.test.ts` | update |
| `test/estimate-presentation.test.ts` | update |
| `test/listed-prices.test.ts` | add |
| `test/material-takeoff.test.ts` | add |
| `test/product-carousel.test.ts` | add |
| `test/product-choices.test.ts` | add |
| `test/selection-guide.test.ts` | add |

## Commit04 — RM-076-081: export visual estimates with product photos and links

| Exact path | Change |
| --- | --- |
| `apps/frontend/src/app/api/roomedy/v1/product-photo/route.ts` | add |
| `apps/frontend/src/features/cost/estimate-pdf-capture.ts` | update |
| `apps/frontend/src/features/cost/estimate-pdf-controls.tsx` | update |
| `apps/frontend/src/features/cost/estimate-pdf.ts` | update |
| `apps/frontend/src/features/cost/product-photos.ts` | add |
| `apps/frontend/src/features/cost/quantity-visuals.ts` | add |
| `apps/frontend/src/features/cost/source-visuals.ts` | add |
| `apps/frontend/src/server/bridge.ts` | update |
| `apps/frontend/src/server/product-photo.ts` | add |
| `docs/commit-plans/RM-076.md` | add |
| `docs/commit-plans/RM-077.md` | add |
| `docs/commit-plans/RM-078.md` | add |
| `docs/commit-plans/RM-079.md` | add |
| `docs/commit-plans/RM-080.md` | add |
| `docs/commit-plans/RM-081.md` | add |
| `docs/tickets/RM-076-redesign-the-estimate-pdf.md` | add |
| `docs/tickets/RM-077-include-product-photos-in-the-estimate-pdf.md` | add |
| `docs/tickets/RM-078-make-quantity-details-visual.md` | add |
| `docs/tickets/RM-079-make-source-evidence-visual.md` | add |
| `docs/tickets/RM-080-review-the-whole-visual-pdf.md` | add |
| `docs/tickets/RM-081-verify-app-pdf-downloads-in-both-modes.md` | add |
| `docs/validation/RM-076.md` | add |
| `docs/validation/RM-077.md` | add |
| `docs/validation/RM-078.md` | add |
| `docs/validation/RM-079.md` | add |
| `docs/validation/RM-080.md` | add |
| `docs/validation/RM-081.md` | add |
| `output/pdf/roomedy-estimate-redesign-preview.pdf` | add |
| `test/estimate-pdf.test.ts` | update |
| `test/estimate-product-photos.test.ts` | add |
| `test/product-photo-route.test.ts` | add |
| `test/quantity-visuals.test.ts` | add |
| `test/source-visuals.test.ts` | add |

## Commit05 — RM-083: record the local review checkpoint

| Exact path | Change |
| --- | --- |
| `AGENTS.md` | update |
| `docs/README.md` | update |
| `docs/ROOMEDY.md` | update |
| `docs/commit-plans/RM-062-083-CHECKPOINT.md` | add |
| `docs/tickets/README.md` | update |
| `docs/validation/RM-062-083-CHECKPOINT.md` | add |
