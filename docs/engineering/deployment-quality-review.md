# Current deployment quality review

2 November 2026 · RM-084 · base `ae8d9e9917114f67d0cf575013de189a737dce14`. Functionality is the primary constraint. The owner has finished the requested visual/UX feedback round and now delegates justified quality and security work in AFK mode, including local commits, with **no paid tests**. The running configuration/services are preserved.

## Baseline and method

The entry index/worktree was clean. A sanitized tracked inventory covers **458 first-party code/test/script/config files, 3,994,162 bytes**, aggregate SHA-256 `98d3da78b7288dc5814e23918165de16b2f7d155f2d79f69bb1eca6ae862cca6`. Ignored detailed inventory: `.release/runtime/rm084-inventory.json`. Dependency/generated/public binary trees and secrets are excluded. This is source-review identity, not Linux/image proof.

Existing exact checkpoint receipts cover landing, sourcing/materials, connected Estimate and visual PDF behavior. The current test launcher sets fake/paid-off and blank credentials before spawning Vitest; setup denies external fetch/HTTP/socket transport before imports. Never aim tests at the running paid app. Installed Node24.19.0 and pnpm11.25.0 are available without installation. The host default Node24.22.1 is not used for the canonical checks.

Use TypeScript syntax/export/reference inspection, actual import/route/package/worker reachability and proportionate source review. Textual unused-export candidates require independent verification: `advanceGuide`, asset disposal, texture assignment, window bounds, draft placement, drawing and seeded ordering all have real in-file consumers and must remain. Next default page/layout exports are framework entries. Duplicate IPv4 address policy in the two server applications is retained as a small independent trust-boundary check; do not introduce Node dependencies into browser-safe contracts or cross-app imports merely to save lines.

## Concrete corrections and risks

| ID | Evidence and consequence | Smallest correction and invariant proof |
| --- | --- | --- |
| Q84-01 | `review-panel.tsx` and `rough-sketch.tsx` export UI with no imports/re-exports/dynamic route references. RM-015AM superseded the separate initial review page; current Intake shows photo selection/processing and hands off to the studio. Keeping the obsolete editing screen and its CSS obscures which path owns corrections. | Remove only the two unreachable components and exclusively unused intake CSS rules. Keep `review-controller.ts`, draft/photo/recognition/adoption and all studio inspectors exact. Prove remaining live CSS selectors/declarations/order unchanged and exercise existing intake/draft/recognition/processing tests. |
| Q84-02 | `OfferVisual`, `ResearchProgress` and `filterCatalogue` have no internal or external callers. Current Research owns its real pending indicator; SourceCard owns product facts; real catalogue consumers use thumbnail URLs and shared spatial lookup. | Delete these unused declarations and OfferVisual-only CSS. Retain actual pending styles, ChatIcon, CostLineCards and catalogue lookup. Run existing cost research/guide/source/card/breakdown and catalogue checks. No new mirror tests. |
| Q84-03 | Research repeats the exact generation/workspace/room/cost predicate already owned by `entryIsCurrent` in selection-guide. | Call the existing pure predicate with the same current snapshot. No new helper or altered timing; existing stale/return/choice/automatic-guide tests cover it. |

Changes are confined to those owners, allocated before edits. No active layout redesign, business-rule optimization, speculative package update or diagnostic removal is justified. Large session/scene/PDF modules remain under their established authority; splitting them is not an audit goal.

## Coverage and dispositions

| Reviewed area | Current evidence and disposition |
| --- | --- |
| Contracts/spatial | Strict compiler options include unused locals/parameters; public package exports and executable boundaries remain. Exact BigInt monetary rounding, grouped wall quantities and selected-takeoff owners are preserved. Repeated validation at import/provider/Apply/version boundaries protects different trust decisions; retain it. |
| Backend | Inert factories, one env/listen entry, shared admission and unresolved-provider settlement are retained. HTTP uses fixed endpoints, bounded bodies, safe public errors and fixed private diagnostic events. No log removal or transport rewrite. |
| Frontend server | Fixed bridge routing/release fencing, finite response streams, service identity and selected-photo transport remain separate from client imports. Two tiny IPv4 checks are intentional independent app boundaries, not a reason for a cross-app abstraction. |
| Intake/session/assistant | Current Intake imports neither deleted review UI. Draft/controller/photo/processing remain active; single accepted baseline, proposal/history and fixed two-hour recovery ownership stay exact. Retain transient Estimate conversation outside Design context/project/recovery. |
| Scene/landing/export | Real lazy Next/Fiber entries, search worker, per-scene asset/material disposal and demand wakes/sleep are reachable. Snapshot export has one controller-owned admission/lifecycle path; optional media remains bounded. None is deleted or split for size. Landing choreography/framing is unchanged. |
| Cost | SourceCard/carousel and Research own current options/pending views. Manual/automatic product preparation, current-pass completion, accepted listing/offer authority, whole-wall groups, takeoff and immutable PDF versions stay exact. Only equivalent freshness reuse changes executable reachable code. |
| Scripts/config/tests/release | Existing bootstrap clears credentials and denies external transports. CI uses pinned identities and verified tools; release collection rejects symlinks/non-LF inputs and strict proof rejects stale digests/images. No installation, script behavior or release acceptance change. |

Security-sensitive observations are carried to RM-085 without remediation under a quality label. No additional actionable quality correction was established in this proportionate review; low-confidence unused-export candidates were independently resolved rather than removed.

Focused checks use existing independent behavioral fixtures. Run the settled canonical root gate once after edits, preserving assertions and honestly reporting the known release-copy wall-clock timeout if it recurs. Perform the final diff review without editing; independently confirm any finding before correction/revalidation. Source-only deletions do not justify a new paid/browser flow or repeated PDF rebuild. Current actual interaction evidence remains dated; owner final paid tests and current Linux/hosted acceptance remain pending.

## Results

Q84-01–03 are complete: **1,480 net source lines removed**, seven source paths, no new dependency, test or runtime authority. All **451 unallocated first-party inventory files remain byte-exact**. CSS semantic comparison passes. **142 affected tests/11 files** pass, followed by **1,711 tests/111 files** and all canonical format/lint/types/seven-boundary/assets/build components. The root attempt required a split unit/build continuation because sandbox loopback failed; the complete unchanged default unit suite passes outside that restriction, without timeout/assertion changes. See [actual receipt](../validation/RM-084.md).

Read-only validate pass1: **Meets ticket; no actionable findings**. Deleted components have no framework/worker/dynamic/public consumers, active styles and pending views remain, and freshness comparison uses the same snapshot. No broader refactor or further test run is justified after these checks. Stage/commit only the exact allocated snapshot, then audit security on that committed source.

Future edits must retain the import/worker/framework reachability checks before deletion, shared domain and lifecycle authority, current finite budgets, explicit visitor choices and private fixed diagnostics. Do not re-add the superseded review page or duplicate freshness logic. New functionality requires its owning tests rather than reintroducing unused UI.
