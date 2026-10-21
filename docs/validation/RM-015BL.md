# RM-015BL live review —21 October2026

**Test/fix/retest and public-sample follow-up complete; owner visual approval pending.** [Ticket](../tickets/RM-015BL-verify-real-photo-and-medy-flows.md), [exact36-path allocation](../commit-plans/RM-015BL.md). Owner explicitly authorizes real-mode restart, paid sample-photo/Medy testing, confirmed repairs and economical retests. No env/key edits or Git/publication changes; base15682de. Fake-mode evidence is not substituted for this task.

## Verified restart

Read installed restart/kill/run skills and lifecycle reference. Verified both old supervisor identities using live creation timestamps, their current descendants and port owners. Stopped frontend20708 and backend12928 in reverse dependency order; all16 observed processes were absent,4320/4321 free through two stabilization checks. Normal `pnpm dev:backend`, then `pnpm dev:frontend`, hidden durable launchers, unchanged owner-managed env loading.

New backend supervisor3696/listener24104 and frontend24624/listener16048 initially reported live-ready, public mode live, recognition/assistant true and simulation false. Backend watcher may replace its worker during the allocated repairs; refresh its record at final handoff. Correct frontend readiness is `/api/roomedy/v1/ready`; an initial incorrect `/api/ready` probe was corrected without launching another app. Both actual services were healthy.

Content-safe absolute logs:

- `C:/Users/minat/AppData/Local/Temp/roomedy-local-runtime/backend.BL.stdout.log`
- `C:/Users/minat/AppData/Local/Temp/roomedy-local-runtime/backend.BL.stderr.log`
- `C:/Users/minat/AppData/Local/Temp/roomedy-local-runtime/frontend.BL.stdout.log`
- `C:/Users/minat/AppData/Local/Temp/roomedy-local-runtime/frontend.BL.stderr.log`

Old browser tab4 became an internal connection-error page during restart and browser policy blocked acting in that page. After the owner directed a fresh opening, normal HTTP tab6 opened successfully for photos; tab7 is a separate authored manual room with the same live backend for assistant diagnosis. No blocked internal page was manipulated. Prepared photos/current canonical rooms were preserved.

## Actual baseline and first batch

Uploaded all four public authored WebPs through the normal Choose photos file chooser in tab6. Preparation completed; Continue disclosed provider transfer. Expected evidence is one ivory bed, one ivory two-drawer bedside cabinet, oak floor/pale walls, visible window and entrance across opposite views. These are generated unmeasured examples; no exact metric/occluded-hinge ground truth.

1. Initial four-photo request passed real verification/admission, then failed malformed at provider stage in92ms. Offline reproduction proves the actual builder emits nine content parts but the adapter allowed eight. Provider start throws before metered dispatch increments. Four/six-photo injected regressions failed before repair and pass afterward; seventh image still rejects. No blind photo retry at this stage.
2. In tab7, “Hi Medy ... Can we talk ... without moving anything yet?” produced an inappropriate “Which exact piece should stay in place?” local clarification. No provider dispatch for this turn. Greeting removal/curly-apostrophe normalization and explicit talk/chat classification now preserve conversation with no edit scope; scoped greeted movement still retains exclusions. Four failing routing cases turned green.
3. One greeting/overwhelmed request entered the tool path and failed malformed after4999ms. A distinct anchored question isolated the no-tool conversation path and also failed malformed after5128ms. Real response payloads were not logged or retained. The official current Responses reference includes optional reasoning content and direct synchronous function metadata that the old decoder rejected. Bounded typed support and fixed-enum rejection-stage diagnostics were added without loosening tool names, commands, encrypted continuation, byte/count/deadline or unknown-field checks. No model/config/effort change.

First batch:146 tests/7 files passed. Backend/test types and scoped lint passed after typing the executable logger against the existing fixed Diagnostic shape, including its existing shutdown-forced code. No paid request was made while source repairs were in progress.

## First live photo retest and follow-up

One targeted four-photo Continue now passed real provider decoding and reached hypothesis validation, then failed malformed after38225ms. Thus the transport repair is exercised by the actual image call; recognition/evidence quality is not yet passing. No partial draft was admitted and all photos stayed available. No response payload was retained.

The follow-up keeps all strict parser rejection conditions and adds optional fixed reason/known-field diagnostics, never values, arbitrary key names, labels, photos or model text. Recognition prompt5 explicitly explains globally unique cross-photo refs, single group membership, independent unknown/evidence consistency and integer/fraction constraints already required by local validation. It does not confirm measurements or turn catalogue sizes into observed facts.

Offline follow-up run:196 tests passed with one new fixture-name error; corrected the test to existing authored fixtures, then its four targeted cases and test types passed. The prior schema/source/association/provenance cases remain unchanged. A final settled scope will be recorded after the live follow-up; no197-test/full-root success is inferred here.

Ignored native evidence so far: `.release/validation/RM-015BL/initial-photo-failure.jpg`, `initial-medy-failure.jpg`. Public official Markdown reference is cached only in this ignored evidence directory. Primary sources: [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning), [stateless continuation example](https://developers.openai.com/cookbook/examples/responses_api/reasoning_items), [Responses reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

## Successful live photo adoption and useful preview

The next targeted four-photo request succeeds in35557ms/one provider round, with11 bounded cross-photo observations. Normal studio adoption deduplicates them into exactly one Simple bed and one Bedside drawers. Ivory furniture, pale estimated wall colour/smooth paint and estimated oak-coloured plank floor match the examples. Room/furniture dimensions remain unknown; window wall is estimated east, aperture measurements unknown. A closed door remains an unassigned transient note rather than an invented doorway pose. Photos remain transient; normal recovery preserves accepted semantics through source reloads.

The initial accepted3D room showed tiny markers for unknown-size furniture. Both editor views now use one presentation-only helper: preserve known axes and use the selected catalogue's nominal size only for missing axes. Procedural3D and dashed/question-marked2D footprints give a useful rough preview with a visible illustrative-size notice. Properties, commands, fit checks, articulation, saved data and exports retain unknowns; no measurement is confirmed. Unknown catalogue/elevation stays unavailable. No further photo call was needed for this repair.

Native2D selection shows every bed preset and all six finishes. Changing ivory to sage succeeds despite unknown measurements, visibly changes2D/3D and selected bounds, and one Undo restores ivory. The photo route does not lock furniture or reduce finish choices.

## Actual Medy conversation, shortcuts and proposals

| Actual request/path | Result and provider work |
| --- | --- |
| Greeting, feeling overwhelmed, talk before moving | Friendly advice, no edits;5883ms/one round. Offers Visual clutter / Getting around / Work and rest. |
| Select Visual clutter | Discusses grouping shelf items and using wardrobe doors;4818ms/one round. Replaces choices with Start with the shelf / Start with the wardrobe. |
| Ask what is known about the photo room and what to measure | Names bed/drawers/east-wall window; unknown dimensions versus estimated pose/finishes and mostly unassessed fit/access;5849ms/one round. Offers Room dimensions / Furniture sizes. No fabricated measurements or edits. |
| Warm/calm finish-only preview, keep positions/sizes | Completes in10837ms/three rounds. Bounded chair/wall finish preview; actual Apply and one Undo succeed. SVG centres and width/depth labels remain identical. |
| Open-space layout with bed/wardrobe fixed, sizes/inventory/finishes unchanged | Initially requests special wording locally. Bounded explicit fixed-position grammar repaired/red-to-green offline. A stale client module is refreshed before the real request; first actual sequence then fails safely in7723ms/two rounds. No mutation. |
| Same constrained layout after tool simplification | Completes in4600ms/two rounds. Chair centre3200,1700→3200,1635; shelf2200,3900→2100,4625/front north. Bed1000,1600, wardrobe3850,3200 and desk3200,1000 stay fixed. Five furniture sizes/inventory and finishes unchanged. Computed free centre3.68→3.72m² is described as modeled. Same proposal inspected in2D/3D; Cancel restores all original centres without history/Undo entry. |

Search already prepares a validated proposal in find_arrangements. Prompt8 and tool description now say to finish after that computed output; unnecessary model-authored prepare_edits is removed from offered search tools. Internal strict preparation and visitor compiler remain. The exact sample/local-candidate offline integration proves the result and reduced tool surface. Old rejected tool input was not retained, so no assertion about its payload. New fixed failure-stage/whitelisted-tool diagnostics contain no arguments, prose or payload; a canary regression verifies arbitrary names/text never enter logs.

Cancel initially left Review this preview after discarding the proposal. The controller now appends one truthful cancellation receipt for a matching settled assistant proposal, retiring old choices through latest-message identity. Pending cancellation/stale IDs remain fenced. A local compiled sage-finish preview in the live app followed by Cancel shows “Preview cancelled. Your room is unchanged.” plus help/check shortcuts, without a provider call. Offline lifecycle tests prove old choices and stale Cancel cannot execute.

Actual1280×800,390×844 and1280×560 observations cover the composer/reply shelf. Phone replies sit directly above the textarea (replies bottom661.625, textarea top674.625), within viewport width, with bounded history/44px actions. Short screens retain natural vertical scrolling. Managed verification passes automatically without repeated widget display; no agent CAPTCHA solution or security bypass. Viewport overrides reset afterward.

## Settled validation and handoff

After the initial real-mode repairs, before the public-sample follow-up: **998 tests/63 files pass**; root lint/format, frontend/backend/test types, application/transitive boundaries plus seven negative boundary tests and exact local asset/licence/hash/budget checks pass. Earlier scoped runs and corrected new fixture/type expectations are intermediate evidence covered by the final suite. Git diff whitespace check passes. No new production-build/BUILD_ID claim.

Safe logs show11 operations: one local92ms pre-dispatch photo rejection, and10 real operations totaling14 provider rounds. Local clarifications/manual controls/rendering/Cancel/Undo add no provider calls. No automatic retry, exact monetary cost, token total or account balance claim. Paid retries followed allocated fixes/offline regressions.

Final verified owners: frontend24624/listener16048 on4320; backend3696/current watcher listener15628 on4321. Ignored records refreshed from live creation identity/descendant ownership. Direct and frontend-bridge readiness are ok/live-ready, mode live with recognition/assistant enabled. Services remain running under normal owner-managed env. No credentials inspected/printed/edited; no new port/service/dependency/delegation/staging/commit/push/deploy.

Ignored evidence: final-unit-settled.log; photo-studio-repaired-3d.jpg; photo-studio-repaired-2d.jpg; medy-friendly-live.jpg; medy-photo-uncertainty.jpg; medy-live-finish-preview.jpg; medy-live-layout-3d.jpg; medy-live-layout-phone.jpg; medy-cancel-repaired.jpg; medy-short-final.jpg; photo-and-medy-final.jpg, all under `.release/validation/RM-015BL/`. Tested photo and manual assistant tabs are retained. Final public config explicitly confirms capabilities.simulation=false. All32 changed paths occur in the allocation; the index is empty and generated next-env.d.ts remains excluded/preserved.

This is a bounded successful live sample review, not a measured scan/general model benchmark. Exact dimensions, window aperture and doorway pose still need visitor measurements/corrections; illustrative furniture does not establish fit or replace unknown export dimensions. Future model responses remain strictly validated. Owner visual approval independent; Q held, guide paused, RM-016 Planned.


## Public samples in real mode — owner follow-up

Latest owner explicitly wants demo visitors to try sample photos immediately in real mode. The gallery and local loader no longer depend on fake mode or config arrival. Shared public count limits still prevent adding four examples to a selection that exceeds six. Existing codec/abort/session protections remain. The obsolete gallery-mode single-column selector is removed, retaining the original responsive two-card design.

Native live tab8 at /demo?start=photos shows the four-image gallery and enabled Use example photos before selection. Selecting it prepares all four ordinary WebP inputs; Continue becomes enabled, the live provider-transfer disclosure appears, and another four-photo selection is correctly disabled. No recognition request is automatic; Continue still uses normal configured capability, Turnstile/admission and real provider processing. No simulated live result or security bypass. This source change does not require repeating the already verified paid recognition path.

Current checks:16 existing example-loader/automatic-purpose tests pass across two files; frontend types, scoped lint and source formatting pass. No new tests that mirror visibility markup, no new paid requests and no fresh full-root998/build claim. The earlier full suite belongs to the preceding checkpoint above. Evidence: .release/validation/RM-015BL/live-samples-visible.jpg and live-samples-prepared.jpg. The prepared sample tab is retained for the owner.

Exact current allocation36 paths; index remains empty and generated Next declaration excluded. This explicitly supersedes historical fake-only sample visibility while keeping normal mode-specific processing behavior.


## No header divider — owner follow-up

The screenshot's thin full-width header rule came from intake .header border-bottom:1px solid #dfd4c5. Removed that declaration at its owner, preserving transparent background, spacing and control borders/focus. No behavior/config/provider change. The owner explicitly requires all site navigation headers to remain divider-free; this is recorded in AGENTS and feedback lessons for future work. Shared intake styling covers photos, processing and retained review surfaces; landing, entry and editor headers already have no separator.

Actual browser checks: desktop prepared-photo intake,390×844 fresh intake, source entry, editor and landing headers all report bottom border0px/none and box-shadow none. Intake and landing have no before/after separator pseudo-elements. Native desktop screenshot confirms the full-width divider is gone; phone viewport override reset and audit tab closed. Evidence: .release/validation/RM-015BL/no-header-divider-desktop.jpg and no-header-divider-phone.jpg. The prepared live sample tab remains available.

Scoped CSS formatting and Git whitespace checks pass. This one-line visual correction adds no tests mirroring CSS, no paid request and no fresh full-root/build claim. Exact36-path allocation and empty index remain.

## Separate photo placement and initial Medy — owner follow-up

Owner reports interpenetrating bed/bedside furniture, requests near-wall placement as in the samples and explicitly selects Medy as the initial tab. Exact allocation expands to42 paths before changes. Initial photo acceptance now reconciles fresh estimated centres against illustrated furniture envelopes, in descending footprint order, with50mm separation, bounded frame/feature checks and direct observed back-wall anchors. It preserves sizes, finishes, facing, intentional/locked poses and the one accepted baseline. Only adjusted poses become planned/photo-layout-plan; nominal proxy sizes/frame never become measurement facts or escape into exports. Impossible/unassessable repair remains unchanged with review copy. Recognition prompt6 explains footprint-centre and observed back-wall semantics. Initial presentation selects assistant; photo notes no longer force the Room tab.

First settled offline checkpoint:126 scoped tests/five files, frontend/backend/test types, scoped lint, root formatting and boundaries/seven negative cases pass. A full isolated run then passes1013 tests/64 files. No production build/BUILD_ID claim.

The first actual four-example real-mode flow succeeds in31149ms/one provider round with11 observations. Medy is pressed initially before any panel click.2D/3D show no furniture intersection: bed centre1722,1100 with illustrative1600×2100 footprint; drawers2898,1200 with450×400 footprint leave151mm lateral gap. Bed back edge is50mm from north wall, but drawers remain1000mm away. That remaining wall relationship fails the owner's near-wall expectation and is not marked complete. Evidence: placement-first-live-2d.jpg.

Before a further live call, add a bounded bedside planning relationship within the same owners. Only a bedside-specific item co-visible with one adjacent head-side bed, with consistent observed facing and no conflicting wall, can follow that bed's directly observed back wall. Separate views/detail-only sources, conflicting/unknown facing, foot-end/distant pieces, multiple plausible beds and deliberate bed poses do not infer this relationship. Raw wall/measurement evidence stays unchanged. All four orientations and these exclusions plus the full photo acceptance path are covered offline. Current139 scoped tests/five files pass:136 passed in the first run, three HTTP cases were blocked only by sandbox loopback EACCES; the recognition file's28 cases all pass with local test sockets allowed. Frontend/test types, scoped lint and whitespace checks pass. Test runtime clears credentials and disables paid dispatch.

The targeted final real sample flow succeeds in33131ms/one provider round through the ordinary four-example loader, explicit Continue, managed Turnstile and real recognition. No verification interaction/bypass or automatic retry. Initial studio navigation shows Medy pressed before any tab click; only Skip tour is selected. After the greeting finishes, the usual three contextual welcome replies remain above the composer. Actual2D SVG centres are bed1974,1100 and drawers3192,250. At their illustrated1600×2100 and450×400 envelopes, both north/back edges are50mm from the wall, with193mm lateral gap and no positive intersection. Actual3D confirms the same separate, wall-backed pieces. Room/furniture dimensions remain explicitly unknown; this is a starting plan, not measured fit. Evidence: placement-final-live-2d.jpg and placement-final-live-3d.jpg. Final3D/Medy tab retained.

Safe-log reconciliation finds three successful sample operations after the earlier10-real-operation checkpoint:31826,31149 and33131ms, each one provider round. The31826ms intermediate completion is counted without inventing a missing visual assertion; the first/final native wall observations above are the retained evidence. Across BL the log has14 finished operations: one92ms local pre-dispatch rejection and13 real operations totaling17 provider rounds. No exact money/token/account-balance claim. The new bedside fallback is covered by139 scoped tests; the1013-test full suite precedes that final refinement and is historical. No fresh full-root/build claim. Exact42 allocated paths remain uncommitted; generated Next declaration stays excluded and index empty.

Final guards for unavailable display envelopes are conservative; all26 placement cases pass again after that guard, with scoped lint/format clean. Runtime ownership refreshed after normal watcher reloads: backend supervisor3696/listener17016 on4321, frontend24624/listener16048 on4320. Both direct/bridge readiness report ok; public config reports live, recognition/assistant enabled and simulation=false. No extra service or port was introduced; existing watchers own normal reloads. Final accepted sample stays open in3D/Medy; earlier prepared examples and manual assistant test tabs are retained. Owner visual approval remains pending independently. Final root formatting passes, all42 changed paths occur in the allocation and the index remains empty.

## Owner acceptance and authorized local checkpoint —21 October2026

After viewing the final sample/default-Medy result, the owner says "i think that was the only issue i had", requests a "file level commit" and explicitly approves staging/committing before quality/security. This is the actual visual checkpoint acceptance for the current BL scope; earlier pending statements in this historical receipt are superseded. Physical/hosted/Linux and exact-scan claims are not inferred. The owner also authorizes later quality/selected-remediation commits after execute/validate loops while explicitly retaining build's security process. No security findings exist or are selected yet, and filled-prompt preapproval was not supplied.

The consolidated atomic allocation lists all42 exact paths and excludes env/runtime/log/build/native/generated files. Current `pnpm check` succeeds:1026 tests/64 files in86.04s, seven negative boundary checks, application/transitive boundaries, exact local assets/licences/hashes, root formatting/lint, all types and shared/backend/frontend production builds. Log: commit-settled-check.log. No extra paid request is made. This settled full gate supersedes the earlier1013/139 scope limits for these unchanged source bytes; exact Linux image/BUILD_ID release proof remains a later release owner.

Read-only validation pass1, combined unstaged BL diff/new files against the complete ticket: **Meets ticket; no actionable findings.** Covered: actual image/wire/provider admission and conservative hypothesis handling; shared editor illustrations remain distinct from canonical measurements/exports; friendly discussion/contextual shortcuts and bounded proposal/cancellation authority; public samples/header correction; planned near-wall/nonoverlap sample adoption with one baseline; initial Medy and preserved later tab choices. Existing locks/provenance/expiry/Undo and finite diagnostic/request/output boundaries remain. Native actual sample2D/3D and real Medy evidence above is retained; tests do not imply a general model benchmark or hosted/physical acceptance. Review was read-only; no source edits were made during it.

Pre-stage checks find exactly42 allocated paths, an empty index, clean whitespace and no credential/private-key candidates in the exact commit inputs using bounded pattern checks. No env file is read. The ignored reviewed-input manifest binds path/SHA256/Git blob for explicit staging and index comparison. Final staged diff/secret/generated exclusions must be checked before the local commit. Quality starts separately at its full filled-prompt checkpoint; audit-only security will retain its manual findings review.

Final staged review catches the helper's evidence-replacement behavior during visual approval. Restore all107 prior visual evidence entries alongside the new BL entry using the helper's validated SHA-checked persistence seam; preserve the new actual approval and every prior review unchanged. This is a bookkeeping repair only, with the complete historical evidence retained before commit. Source bytes remain identical to the reviewed/passing gate. The exact42 staged paths/blobs, generated/env exclusions, credential-pattern scan and whitespace checks pass; no new actionable local finding remains.
