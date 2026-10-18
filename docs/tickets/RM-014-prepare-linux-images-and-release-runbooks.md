# RM-014 — Prepare Linux images and release runbooks

Status: **Implemented locally — Linux/hosted evidence pending**
Planning date: **17 October 2026**  
Milestone: **Local release preparation**  
Depends on: [RM-012](RM-012-complete-comparison-recovery-and-project-lifecycle.md), [RM-013](RM-013-evaluate-ai-and-integrated-product-behavior.md)  
Suggested commit: `RM-014: prepare linux images and release runbooks`  
Authority: [blueprint §23](../ROOMEDY.md#23-deployment-preparation), [§§14–16](../ROOMEDY.md#14-architecture-and-dependency-boundaries), [§24.1](../ROOMEDY.md#241-layers-of-proof)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-18, L-20, L-22, L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Prepare reproducible local release artifacts for the proposed public Next/private Express Cloud Run pair. Ship the actual standalone frontend, built shared packages, backend, catalogue assets and search worker, with probes and operator runbooks. This is required local work even when credentials and paid/hosted acceptance are unavailable.

Do not create cloud resources, log in, bind secrets, register domains, push images or deploy. Cloud project, region, service identities, effective limits, model and funded allowance remain owner inputs. Blank configuration templates and guarded command examples can be concrete and reviewable without executing their external effects.

## Dependency evidence and proposed ownership

Require verified local application/evaluator behavior, not completed paid cases. Use the exact chosen lockfile/runtime and actual build output.

| Area | Responsibility |
| --- | --- |
| Frontend/backend Dockerfiles and root `.dockerignore` | Pinned multi-stage non-root Linux packaging from bounded contexts |
| `scripts/verify-release.*`, local probe helpers | Exact-input inventory, package checks and fail-closed proof matching |
| `docs/operations/` | Local image/run guide, Cloud Run configuration, rollout, rollback and incident checklist |
| Blank app environment examples | Public/private origin, port, identity and paid/challenge readiness fields |
| CI/local release checks | No-key package/build checks without automatic push/deploy |

## Implementation plan

1. Build two minimal pinned-base images from the actual workspace lockfile. Establish an LF text checkout policy while preserving binary asset bytes, and verify Linux release inputs match it. Compile shared packages before consumers; runtime images contain required built artifacts rather than source workspace symlinks. Run non-root with explicit PORT/host behavior and graceful signal handling.
2. Package Next standalone/runtime/static/public outputs, local fonts/catalogue/license files and emitted search-worker chunks. The backend image includes only its required runtime/build/shared modules. Ensure environment examples, tests, drafts, raw photos, private keys, ignored files and unnecessary source archives are absent from runtime images.
3. Verify actual Linux runtime imports, case sensitivity, worker URLs, catalogue paths, private bridge behavior and health/readiness under fake/no-key settings. Windows build success alone is insufficient. If local container tooling is unavailable, finish source/runbooks/probes and name the exact unperformed Linux proof instead of claiming it ran.
4. Generate a sanitized exact-input manifest/digest for release-relevant source, manifests/lockfile/config, Dockerfiles, scripts and prepared assets. Account for uncommitted/untracked owned inputs as appropriate; a Git commit alone does not identify a dirty candidate. Use deterministic path/byte handling and prove a one-byte relevant change invalidates proof.
5. Add verification that accepts only evidence matching the actual Linux image/input identity and selected probes. Keep local inventory separate from strict runtime proof so a file listing cannot masquerade as a passing Linux release. Refresh proof after material fixes later in the queue.
6. Document the proposed public Next/private Express service configuration, runtime service-to-service identity, backend-only secret access, exact origin/CORS policy, headers, no-store behavior and unauthenticated private-API denial. No generic arbitrary URL proxy or broad identity permission is acceptable.
7. Prepare reviewed request/timeout/memory/CPU/concurrency/max-instance settings consistent with measured shared capacity and no queue. Initial single-instance policy is a candidate, not a proven durable provider money cap. Explain in-memory limiter restart/scaling assumptions and vendor account controls separately.
8. Write guarded rollout steps: verify candidate proof; validate actual account/privacy/funding/challenge prerequisites; create/publish only after authorization; deploy private backend then authenticated bridge frontend; probe; bounded authorized real walkthrough; observe; rollback to named prior immutable revisions. Placeholder values are clearly unconfigured and scripts fail before mutation if missing.
9. Write local startup/stop ownership, operational safe logs, busy/provider-failure response and rollback/runbook instructions. Preparing these files must not invoke cloud CLIs in mutating mode, request credentials or spend credits.

## Prevention requirements from prior feedback

Keep hot-reload iteration distinct from release-like output. Test release-verifier behavior against controlled matching and stale fixtures, then separately inspect actual current Linux images/bytes. Preserve LF/binary policy and reject actual stale proof; never normalize fingerprints or accept host-only evidence to silence a failing gate.

## Approved plan refinements — 17 October 2026

**Release covers runtime epochs and already-open clients.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-11/PR-12. Record process/boot-bound replay and independent server-deadline assumptions, revision overlap and the fact that maximum instances=1 is neither a global lock nor durable money cap. Pin CI actions to verified full commit identities and include action/base-image/platform/tool identities in release inputs; this does not perform a hosted run.

Exercise local two-build stale-client cases: old JavaScript/new API, lazy cutaway chunk/search worker after update, catalogue/schema/rules mismatch and rollback. Choose an intentional compatible-asset/deployment-ID/update policy. Fence pending operations and preserve accepted semantic recovery where possible, with honest transient-photo/draft limitations. Avoid forced-update loops and never treat a framework reload as guaranteed preservation. Keep strict exact-byte proof and controlled verifier tests separate.

## Acceptance criteria

- [x] Both services have reviewable pinned multi-stage non-root images with actual required built dependencies/assets/workers.
- [x] Build contexts/runtime outputs exclude secrets, private room data and unnecessary workspace material.
- [x] Content-free health/readiness and fake/no-key startup/probe commands are documented and tested where tooling permits.
- [x] Exact-input manifest and strict release-proof checks distinguish inventory from actual Linux runtime evidence.
- [x] Relevant byte changes invalidate prior proof; later candidate fixes have a documented refresh owner.
- [x] Public/private identity, configuration, finite capacity and secret boundaries are explicit in local release files.
- [x] Rollout/rollback/incident runbooks and fail-closed unconfigured examples are complete locally.
- [x] No image push, cloud mutation, domain change, paid request or hosted-success claim occurs without separate authorization.
- [x] Controlled tests pass for expected matching/stale cases while strict actual release checks still reject any relevant byte/image mismatch.

### Additional approved acceptance — local evidence recorded

- [x] Verified immutable CI action/base-image/platform/tool identities participate in release evidence; hosted CI remains a distinct actual claim.
- [x] Local two-build chunk/worker/API/version mismatch and rollback cases have deliberate safe update behavior with no reload loop or invented transient-photo recovery.
- [x] Runbooks state boot/process grant binding, timeout ordering, revision-overlap/scaling exposure and separate durable funded controls without implying deployment authority.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Fresh frozen build and runtime inventory | Actual compiled shared package/Next/static/catalogue/worker files, not source symlinks |
| Linux containers, if available | Non-root process, correct PORT, real assets/worker and health/config/ready behavior |
| Secret/test/photo filename canaries in excluded context | No canary in image/runtime output |
| Relevant one-byte change, stale proof, Windows-only proof | Strict verifier rejects mismatched/insufficient evidence |
| Missing project/identity/model/challenge settings | Reviewable template with guarded commands that fail before mutation |
| Unavailable Docker/Linux tooling | Concrete completed files and exact unchecked runtime requirement, not a fabricated pass |

## Handoff and limits

RM-015 tests the packaged experience where available, RM-017 audits the actual candidate and RM-019 refreshes proof after quality/security changes. RM-020 alone owns later authorized hosted acceptance. Missing paid credentials cannot excuse missing local release files; missing Linux tooling cannot be relabelled passed Linux proof.

## Execution evidence — 18 October2026

[Validation](../validation/RM-014.md), [operations](../operations/README.md), [input/proof policy](../operations/release-inputs.md), [stale-client policy](../operations/stale-client.md), [actual input inventory](../operations/local-inventory-2026-10-18.json), [allocation](../commit-plans/RM-014.md). Final346tests/33files, seven boundaries, all root/build gates and read-only pass3 pass. Actual Windows production A/B/rollback and final current-release native/HTTP cases are recorded separately from Linux image proof. The final content-derived input/BUILD_ID is `7a60eb17e8d4d14deec85db56a1f67923e36d120fcf6e6569c0d351876ab7ba3`.

The checked local criteria above cover reviewable files, tested controlled gates and the explicitly tooling-conditional observations. They do not assert these additional external outcomes:

- [ ] Actual Linux engine builds/starts both pinned images, executes all nine runtime probes and produces fresh matching strict image proof.
- [ ] Actual hosted CI/runner/builder, private IAM/ingress/service identity, account/funding/retention/challenge/model/domain acceptance is performed under separate owner authority.

The installed Docker CLI has no running Linux engine; execution and verification fail closed. No paid request, image push or deployment occurred. Exact local commit is next, then RM-015 performance/actual frontend owner review; no RM-016 without that decision.
