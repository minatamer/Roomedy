# Roomedy quality audit and execution plan

21 October2026. RM-016, base65f6faa. [Allocation](../commit-plans/RM-016.md), [ticket](../tickets/RM-016-audit-and-improve-code-quality.md), [receipt](../validation/RM-016.md). Functionality and truthful evidence take priority over line count. Security findings are a later audit-only phase; no future SEC finding is selected here.

## Baseline and coverage

Current accepted BL checkpoint passes1026 tests/64 files and all pnpm check components, including both production builds. The current editor/photo/Medy native evidence is in BL; do not repeat paid calls or redesign accepted screens for a quality pass. A sanitized319-file first-party inventory covers2,555,916bytes, digest7c25ba9db8f4d658197474f0017f32958465757fa822a491400f39f09dbf29bf, excluding public binaries, generated/dependency trees, env and Git data. Separate runtime input inventory:285files/3,472,050bytes, digest553ad676936081f6b769e36eb62be2e746426b12de28666c8ff8b03d6d984ffd. Ignored manifests are under .release/RM016. Neither is Linux runtime proof.

| First-party area | Proportionate inspection and retained owner |
| --- | --- |
| Contracts/spatial | Closed schemas/policy, physical truth versus representation, coordinates/evidence, commands/history/proposals, request-local scope and incremental search; independent geometry/command/search corpora remain |
| Backend | Inert factories/startup env owner, bounded HTTP parsing/admission, provider transport/result versus settlement, serial tools/search and safe fixed diagnostic codes; preserve logs and capacity/deadline ownership |
| Frontend server | Fixed GET/POST routes, shared schema bounds, release fencing, server-only fixed audience identity and safe response envelopes; no client-selected target/credentials |
| Session/intake/assistant | Canonical controller, lifecycle/resource registry, per-tab recovery projection, one-baseline photo adoption, serial native preparation, worker retirement, preview identity, contextual replies and explicit commands |
| Rendering/export/landing | Shared representations/coordinates/materials, finite demand motion, instance asset disposal, snapshot-only bounded exports and lifecycle retirement; no second renderer/state authority introduced |
| Scripts/evaluation/CI/release | Offline bootstrap, finite evaluation budgets, exact input/image proof, public-only retention, frozen tooling and owned process/container cleanup; defects below belong here |
| Tests/config/assets |319-file inventory includes actual source/test/config/scripts; existing64 test files exercise integration/lifecycle and adversarial limits. Boundary and exact asset/hash gates stay required; no static text/CSS mirror tests |

No raw diagnostic console calls were found in frontend/shared TypeScript. Existing backend startup emits typed private structured events; standalone operator scripts retain source-controlled errors. No blanket log removal is warranted. Source reachability includes framework routes, lazy cutaway/export modules, search worker and CSS; an apparently unimported entrypoint is not dead code.

## Concrete findings and correction order

### Q-01 — Current documentation contradicts completed work

README still says fake-only, no paid calls, owner visual approval pending and no Linux engine. RM-006 still says its commit is pending; RM-015's top status predates the accepted A–BL rounds. This sends future work toward obsolete holds and can misrepresent deployment readiness. Update current entry points and status notices, retaining dated receipts and external limitations. Engine availability is not a passing image proof; a bounded actual live sample is not a general model benchmark. No product behavior changes or tests mirroring prose.

### Q-02 — Snapshot extraction can hang or strand its owned container

build-local bounds image builds/probes but its docker create/cp/rm calls have no command timeout. It creates the container before mkdir and enters try/finally only afterward, so a filesystem failure in mkdir skips cleanup. The existing pnpm installer also leaves npm install without its own timeout. This is a local release reliability/ownership defect, not a remote application exploit.

Extract only the public-snapshot job into one inert helper with injected process runner for controlled tests, a finite overall/command deadline, captured bounded process output and cleanup in finally immediately after verified container creation. Copy only the two fixed public paths; remove only the returned validated64hex container ID, never prune. Failed create/invalid identity must never delete an arbitrary target. A cleanup failure must reject the job, not emit success. Bound npm install within the existing verified archive lifetime. Preserve actual public bytes, errors and private logs; no image/source/provider/runtime change. Regress success, copy failure, mkdir failure, invalid ID, cleanup failure and deadline handling without Docker or external calls.

### Q-03 — Default CI duplicates and drifts from the canonical bootstrap

check.yml uses a separate pnpm/action-setup path and mutable v4 action references while local-release.yml already uses the selected full checkout/setup-node identities, disabled credential persistence and integrity-verified pnpm installer. Reuse that established path and bounded Ubuntu runner rather than introducing another dependency/bootstrap authority. This satisfies the adopted PR-12 reproducibility requirement; no dependency advisory or scanner result is inferred. Keep read-only permissions, fake/off tests and pnpm check. Hosted CI remains unperformed until actually run.

### Q-04 — Actual isolated Linux probes incorrectly depend on host publication

First real Linux execution builds both images but fails release-readiness. Bounded diagnostic: both containers run, backend logs server-started, and frontend-internal requests return200 for backend health and its own frontend bridge health. Host127.0.0.1 published-port fetch returns ECONNREFUSED on Docker Desktop's internal network. This is a probe transport assumption, not missing app readiness. Preserve internal network/no external route and all exact-byte/non-root/import/shutdown checks. Execute the existing bounded HTTP/asset job inside the frontend container via fixed Node source and bounded metadata stdin; do not publish a host port, weaken isolation or substitute direct filesystem hashes for HTTP delivery. Regress valid flow, altered asset bytes, invalid mode, oversize response and failed readiness. Allocate two owners first (20 total), then repeat actual Linux proof and settled checks. Source/verification work remains in progress until this defect is fixed.

## Retained design and rejected speculative work

### Q-06 — Probe mistakes Next's graceful SIGTERM code for a failure

Actual current image checks all pass until shutdown. Reproduction and installed Next16.4.2 source agree: backend exits0 and Next closes cleanly then deliberately exits143 for SIGTERM. Both stop in about250ms without OOM. Require running before stop, then exited/non-running/non-OOM and the exact service-specific exit code. Reject137/forced kill or arbitrary exits; keep the12second ceiling. This corrects the probe's framework assumption, not application shutdown behavior. Existing probe ownership covers the change; verify with actual containers rather than a source-shape assertion.

### Q-05 — Legacy deploy retains a build-only backend self-link

Actual container inspection reproduces ENOENT for just `node_modules/.pnpm/node_modules/@roomedy/backend`: its target is the original `/work/apps/backend`, absent from the runtime image. Backend startup and contracts/policy, spatial and sharp imports all succeed. Correct packaging after deploy by verifying this exact self-link's original workspace target and unlinking it from the output. Do not allow dangling/external links in the runtime checker or remove arbitrary dependency files. Allocate the backend Dockerfile first (21 paths); actual image/package/HTTP/shutdown proof verifies the fix. No app, dependency-version or network change.

Retain the session/assistant controllers: they own distinct canonical versus conversation responsibilities and are heavily integrated with lifecycle tests. Size alone is not a split criterion. Keep public shared exports and framework/lazy/worker/style entrypoints. Keep separate byte/pixel/fragment/count bounds, worker termination, strict schema parse at trust boundaries, per-value evidence and a shared pure command engine. Replacing these with one generic validator/cache/transport facade would merge distinct authority and cancellation lifetimes. No cache, framework, service, perpetual frame loop, reduced-motion switch or hidden retry is added. O-01 model/GPU experimentation remains deferred; O-02 conservative door checks remain disclosed; O-03 relevant measurement guidance remains implemented.

## Prior required outcome reconciliation

This table is current authority over obsolete pending labels; dated receipts remain history. Local outcomes are not blanket external acceptance.

| Packet | Actual local outcome and evidence | Precise remaining/superseded scope |
| --- | --- | --- |
| RM-001 | Workspace/tool/runtime/boundaries and local gate implemented; receipt and current root check | Hosted CI run remains unperformed |
| RM-002 | Reviewed local catalogue/assets and fixtures; current exact asset checks plus AV/BK expansions | Arbitrary furniture reconstruction/model downloads remain outside scope |
| RM-003 | Shared geometry/commands/Undo, per-fact truth and half-mm corpus; current command/spatial/history tests | Conservative opening approximation is disclosed, not professional fit certification |
| RM-004 | Actual landing/entry, followed by accepted L–R revisions and current BL checkpoint | No invented marketing/accuracy claims; physical-device cases remain separate |
| RM-005 | Canonical session and2D editing with protected commands/Undo/lifecycle; later selection/opening refinements | Actual device/assistive input observations are not inferred from unit tests |
| RM-006 | Shared3D projection, assets/material/motion/editing; implementation already committed long before BL | Old commit-pending status is obsolete; physical GPU/long-heap limits remain |
| RM-007 | Bounded photo preparation/reconciliation and editable facts | AM supersedes mandatory rough-review page: Continue→processing→studio; raw photos remain transient |
| RM-008 | Shared grant/capacity/replay/deadline/provider boundary; actual BL admission succeeds | Hosted epoch/scaling/funded controls and deployed hostname remain unverified |
| RM-009 | Shared deterministic search, scoped candidate verification, browser worker/server yielding | Recorded fixed-work worst-case performance miss remains in performance receipt; no raised bound or fake pass |
| RM-010 | Strict recognition/parser/adoption; actual BL four-photo deduplication and final near-wall result | One bounded live sample is not general recognition accuracy or metric reconstruction |
| RM-011 | Grounded Medy, contextual replies and preview/Apply/Cancel/Undo; actual live BL conversations | Model outputs remain validated; no general behavioral guarantee |
| RM-012 | Fixed-lifetime semantic current/baseline recovery/import/export and cancellation fences | Comparison controls temporarily hidden by AC, underlying behavior retained; chat/photos/Undo not persisted |
| RM-013 | Executable no-key rubric/corpus/bounded live evaluation kit and controlled integration tests | Full held-out funded corpus not executed; BL is specific actual live evidence |
| RM-014 | Pinned image/run/proof/retention/identity files, controlled stale-proof/skew tests | Historical absent Docker engine is now available; fresh actual Linux build/probes required after quality changes |
| RM-015 | Native feature evidence through BL; owner accepts final correction and advances to audits | Precise physical/IME/AT/zoom/peak-native-memory/continuous-paint limitations retained; Q lighting stays held |

PR-01 physical-size/representation, PR-02 provenance, PR-03 lattice, PR-04 feature authority and PR-05 bounded replay are owned by contracts/spatial/session tests. PR-06 uncertain drafts and PR-07 scope are covered by intake/recognition/assistant tests; PR-08 reproducible search and PR-09 evaluation by search/evaluation corpora. PR-10 provider data/schema and PR-11 independent deadlines/process assumptions remain strict with actual BL plus controlled tests; hosted/funded controls are external. PR-12 release/skew/tool identities has Q-03's remaining bootstrap correction. PR-13 feature performance/visual and PR-14 accessibility retain criterion-specific limitations and actual owner acceptance. PR-15 public display versus persisted/exported semantics/diagnostics remains separated. No earlier unchecked external criterion is silently marked passed.

## Verification and prevention

Run new release regressions first, then release/skew/lifecycle/commands/recognition tests as applicable and existing type/lint/format/boundary checks. After code settles run pnpm check once, then inspect the complete diff read-only; independently reproduce/fix findings and repeat only affected checks unless a new change invalidates a required gate. Commit only the21 allocated paths after staged exclusions/secret checks. RM-019 must refresh exact source/image/probe evidence because CI and release scripts participate in inventory. No new paid requests or repeated native UI review are needed for a scripts/docs-only change.

Future edits must preserve single job cleanup ownership and finite subprocess deadlines, canonical frozen tooling across CI entrypoints, private diagnostics and explicit evidence dates. Current README/status must distinguish implemented/local/live/hosted and never use old pending text as current authority. Manual security finding selection stays separate from prompt/Git/deployment authority.

## Intermediate quality disposition before Q-04

Q-01, Q-02 and Q-03 are implemented within the exact18-path allocation. Seven new controlled release cases pass; final pnpm check passes1033tests/64files, all types/lint/format/boundaries/assets and both builds. The two earlier sandbox-only HTTP EACCES results pass in that final permitted-loopback run. Read-only pass1 has no actionable local findings; five reviewed source/test/CI paths have aggregate SHA b3349d3e5ca7e5ec81ae7618b9b1647551870c54b851b5b4454c0f9c4910d061. Remaining items are retained design, explicit product deferrals or named external evidence, not unimplemented local quality fixes. Actual Linux proof is still a separate running release job, not inferred from the root gate. No app/UI/provider behavior or dependency version changes; no new live tests, delegation or cloud mutation.

## Final Q-01–06 disposition

All six reproduced issues are corrected within21 owned paths; no app/domain/UI or dependency-version change. Current Linux proof73929fd68d965cb9113bf6743b7c4870f549628ab7e8f9507b9cc83a8532760d passes all nine criteria/90 HTTP assets. Settled root gate passes1039tests/64files and builds; final probe-only follow-up has current scoped lint/format,19 release regressions and actual container proof. Read-only pass2 of the complete candidate is clean. The intermediate1033-test/18-path statements above are dated stages, not current release identity. Security/hosted/funded/device limits remain distinct.

## CPQ quality amendment — RM-030,26October2026

Scope: actual extension delta through67b2e08, contracts/quantity-money engine, shared session/Undo/preview/version/persistence, studio materials and reused3D/export, full-page controls/navigation, fixed admitted sourcing/provider evidence and relevant tests. Plan before correction: preserve behavior, finite resources, private logs and strict safe UI errors; independently establish concrete redundant/dead/unsafe work before changing it. Keep installed dependencies and existing lazy entrypoints. No speculative controller split, generic service layer, new store/history, event loop or remote asset cache.

Confirmed Q-CPQ-001: current root README still said furniture pricing/budgets were deferred. The extension is implemented locally while the hosted release remains the earlier accepted product. Correct that current entry point and link the owner walkthrough; preserve dated release receipts. This is documentation-only, requiring link/Git review rather than a prose-mirroring unit test.

Read-only inspection retains the pure pricing engine and split quantity helpers: they separate trusted application arithmetic from untrusted evidence, with exact integer money and bounded pack optimization. Repeated schema validation at imports/provider/commit/export boundaries enforces different authority and is intentional. One shared history includes cost inputs/bytes; no independent pricing Undo exists. Versions are detached/deeply frozen; strict format2 migration and exact supported-engine consistency reject malformed records before replacement. Persistence drops financial references on retirement and rechecks them after writes. Cost UI remains keyed by workspace; source cards/operations cannot inherit a new identity. Navigation uses the installed framework-supported native history path. Existing materials/plan/camera/export owners are reused; no merchant assets or cloned per-frame resources. Standard-font English PDF limitations and startup tails remain visible, not hidden by feature changes.

No new actionable CPQ source-quality defect was found in the settled review. The prior ticket receipts record independently confirmed fixes and their regressions (including captured preview actions and persistence retirement). Strict lint/types/import boundaries and full root results are in [RM-030](../validation/RM-030.md). No logs, functionality or security controls were removed. Final owner/physical/market evaluation stays separate. Continue security review of actual trust boundaries; no source refactor/extra commit is needed just to create an audit delta.
