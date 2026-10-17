# RM-013 — Evaluate AI and integrated product behavior

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Local evidence and live-evaluation preparation**  
Depends on: [RM-010](RM-010-deliver-photo-recognition-and-draft-reconciliation.md), [RM-011](RM-011-deliver-grounded-assistant-and-reviewed-edits.md), [RM-012](RM-012-complete-comparison-recovery-and-project-lifecycle.md)  
Suggested commit: `RM-013: verify integrated flows and prepare bounded ai evaluation`  
Authority: [blueprint §12](../ROOMEDY.md#12-worked-scenarios), [§24](../ROOMEDY.md#24-testing-and-acceptance-evidence), [§18.3](../ROOMEDY.md#183-cost-policy-and-external-setup)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-12–L-14, L-17, L-19, L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Establish evidence for the complete product and an executable, bounded kit for evaluating real photo interpretation and assistant behavior. Separate deterministic integration correctness from provider interpretation quality. Fake fixtures, schema conformance and passing unit tests do not prove a real model understood a room.

Required local work includes the independent corpus, evaluator, strict live opt-in, documentation and offline integrated checks. Actual paid cases require a selected compatible model, permitted data, funded allowance/privacy review and explicit paid authorization. If absent, leave live criteria unchecked and record the exact prerequisite while continuing independent local release work. Do not relabel the product publicly live-ready.

## Dependency evidence and proposed ownership

Read current full-flow/controller/transport evidence and actual limits; do not write tests around a stale planned API.

| Area | Responsibility |
| --- | --- |
| `test/` and feature/backend integration suites | Whole-flow scenarios, adversarial contracts and dispatch accounting |
| `scripts/evaluate-roomedy.*` | Offline default with bounded explicit live mode and sanitized report |
| `docs/evaluation/` | Corpus manifest, independent expected facts, scoring rubric and run records |
| Owning source modules, only for reproduced failures | Scoped fixes remain in the correct feature/spatial/provider authority |
| Validation ledger and capability readiness | Honest local/fake/live/provider/model distinctions |

## Implementation plan

1. Build a small rights-safe corpus with empty/partial/furnished room cases, multiple views of one item, missing/occluded features, contradictory evidence, unknown scale/mechanism and unsupported shape. Keep personal/private photos outside committed fixtures unless explicitly permitted. Describe source/rights and expected uncertainty.
2. Define independent expected geometry/object relationships and review outcomes. Measure recognition category/opening coverage, duplicate handling, provenance honesty and correction effort separately from exact dimensions. No broad accuracy percentage is reported from a tiny convenience sample.
3. Cover worked assistant scenarios A–H plus explanation, ambiguity, appearance-only presets, supported add/replace/remove, rearrange-owned-only, impossible protected requests, explicit Undo and out-of-scope budget requests. Evaluate proposed actions and computed facts, not polished prose alone.
4. Run deterministic end-to-end fake flows through real boundaries: landing/sample → manual edit → request → preview/Cancel/Apply/Undo → Before/Current → export/import → refresh/reset/expiry. Include own-room rough 2D correction before main-editor 3D. Assert zero calls for non-AI interactions.
5. Exercise adversarial batches, unknown tools/IDs, image-text injection, model self-confirmation, lock bypass, stale operation/revision, duplicate Apply, oversize output and refusal/incomplete/cancel/timeout. Count actual provider-adapter dispatches and bounded tool iterations.
6. Add a live evaluator requiring explicit mode, case allow-list/count, selected model, total dispatch/token/time ceilings and an acknowledged funded limit. No automatic retries, broad recursive corpus discovery or live fallback. Dry run prints only safe planned case/count/limit metadata, never secrets or private photos.
7. Verify model/image/tool schema compatibility using current official documentation and document candidate selection rationale. Actual model selection/quality tuning must use bounded authorized evidence; copying a sibling's model ID or account flag is insufficient.
8. If paid testing is later authorized, run only the approved cases and capture exact candidate/prompt/schema/model versions, date, success/refusal/error, latency, safe usage and observed correction failures. Stop at any budget/dispatch/time ceiling. Mark unrun cases honestly; a failed live path is a defect or explicit external issue, not a fake pass.
9. Fix locally reproduced contract/integration defects in their owning modules, run targeted regressions and settled gates, then review the complete diff read-only. Keep evaluation data sanitized and preserve provider/account retention evidence as an external record without secrets.

## Prevention requirements from prior feedback

Exercise real file selection/intake with authorized test images, not solely injected authored sample output. Include repeated views, distinct similar pieces and partial-match review outcomes with independent truth. Record actual model/corpus latency and imperfections when paid evaluation is authorized; do not promote fixture behavior or a prior screenshot into real-provider acceptance.

## Approved plan refinements — 17 October 2026

**Predeclared readiness rubric and held-out evidence.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-09 using the early skeleton from RM-007/010. Declare per-case pass/fail before tuning: zero tolerated unauthorized mutation, false confirmation, stale Apply, silent fake fallback or non-AI provider dispatch in the tested corpus. Score category/opening coverage, false merges, false splits, uncertainty honesty and manual repair actions separately; report exact counts and individual failures. Split by physical room/object so views do not leak across development/held-out sets. Add reorder/orientation/missing-view perturbations and independent semantic/geometry truth; do not grade exact provider wording.

Record provider-schema/strict/stateless policy alongside model/prompt versions. Model selection uses later authorized evidence, never a leaderboard/name alone. O-01 preserves an offline observation-adapter comparison boundary only: model download, GPU runtime, benchmark execution and deployment remain deferred. O-02/O-03 are evaluated against false door rejection and relevant-question behavior through their owning modules, without adding a generalized evaluation platform.

## Required local acceptance

- [ ] Independent corpus/rubric covers the three room conditions, uncertainty and worked assistant scenarios.
- [ ] Complete fake/manual/recognition/review/proposal/lifecycle flows use real application contracts.
- [ ] Adversarial, race and replay cases preserve room truth, starting locks and exact dispatch bounds.
- [ ] Non-AI interactions/refresh generate zero provider dispatches and no operation replay.
- [ ] Live evaluator defaults offline, fails closed and enforces explicit case/dispatch/token/time caps.
- [ ] Model compatibility research and unresolved funded/privacy inputs are recorded without inherited approvals.
- [ ] Reproduced local failures are corrected and settled validation has no new actionable local findings.
- [ ] Evidence covers the actual upload boundary and correction-friendly partial inference, with separate sample/manual, fake, real-provider and private-diagnostic claims.

### Additional approved acceptance — all unperformed

- [ ] Predeclared case pass/fail rules treat the five authority/dispatch failures as zero-tolerance in the exact tested corpus and report all observed failures.
- [ ] Room/object-group holdout, exact n, false merges/splits, uncertainty and repair-action measures are recorded independently from geometric correctness.
- [ ] Reorder/orientation/missing-view perturbations test semantic truth and correction effort; strict/stateless schema policy and early-corpus lineage remain traceable.
- [ ] No downloaded reconstruction model, GPU service or benchmark/live execution is inferred from the adopted future comparison seam.

## Conditional live acceptance — remain unchecked until performed

- [ ] Owner supplies/approves exact funded model/data/privacy/evaluation scope and paid allowance.
- [ ] Authorized real recognition cases reach correctable 2D review with measured observed quality/limitations.
- [ ] Authorized real assistant cases prepare valid grounded actions and honest failure/clarification outcomes.
- [ ] Actual usage/latency/account observations are recorded for those exact runs; no broader release claim is inferred.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| New evaluator run with no keys or inherited live variables | Offline default, no external network and zero real dispatch |
| Live mode without one required opt-in/bound/prerequisite | Fail before provider construction/dispatch |
| Corpus expected values | Independent hand-derived facts, not output generated by the function under test |
| Full three-condition journeys and failure recovery | Recorded steps/mode/observed state, including initial 2D-only review |
| Metered failure, refusal or cancellation | Counted attempt and no hidden retry/accounting bypass |

## Handoff and limits

Publish local evidence and a separate live-evidence ledger. RM-014 can proceed with verified local kits even when funded tests are pending; RM-019/020 must retain that release blocker. No keys, paid calls, provider dashboards, account changes or live data transfer are authorized by this ticket plan.
