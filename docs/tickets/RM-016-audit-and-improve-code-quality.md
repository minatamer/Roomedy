# RM-016 — Audit and improve code quality

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Functionality-preserving quality pass**  
Depends on: [RM-015](RM-015-verify-responsive-accessible-and-performant-experience.md), including the recorded owner visual decision or explicit waiver/defer  
Suggested commit: `RM-016: audit and improve code quality without behavior changes`  
Authority: [blueprint §22.4](../ROOMEDY.md#224-code-and-delivery-discipline), [§24](../ROOMEDY.md#24-testing-and-acceptance-evidence)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-16, L-19–L-21, L-23) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Perform the build workflow's documented quality/efficiency/structure iteration across the settled product. First write concrete findings and an ordered functionality-preserving plan, then execute and validate justified improvements under future authorization. LOC reduction is not the objective; preserve accepted product behavior, domain truth, privacy, bounded work and deliberate motion.

This is separate from RM-017's read-only security audit. Do not invent speculative architecture work, rewrite every module, replace the framework/provider or weaken acceptance to make a ledger green. Reconcile earlier tickets against actual code/evidence rather than ticket-named commits or old checked boxes.

## Dependency evidence and proposed ownership

Read the visual decision, current candidate identity, prior ticket/evidence records and actual implementation. Allocate concrete paths only after findings exist.

| Area | Responsibility |
| --- | --- |
| `docs/engineering/code-quality-plan.md` and execution report | Evidence-based findings, behavior baseline, remediation order and dispositions |
| Existing first-party apps/packages/scripts/config/tests | Only justified changes in their current responsibility owners |
| Boundary/contract/lifecycle regression checks | Preserve observable invariants through refactoring |
| Ticket/index/blueprint/operations documentation | Reconcile actual outcomes and unresolved external checks |
| Release proof notification | Exact changed inputs handed to RM-019 for fresh artifact verification |

## Implementation plan

1. Capture actual source/build input identity, settled root checks and relevant behavior baseline. Read every first-party source/test/config/script area proportionately; prioritize reproduced duplication, unclear ownership, avoidable complexity, dead paths and structurally evident waste.
2. Reconcile RM-001–RM-015 against code, checklists, validation and Git evidence. Classify required outcomes as implemented/verified, explicitly superseded/deferred with destination, or blocked by an exact missing input. Do not call broken required local behavior an external check.
3. Write each quality finding with evidence, consequence, affected paths, proposed smallest correction, invariant risks and focused verification. Prioritize correctness/ownership/cleanup before cosmetic file reorganization. Explain retained abstractions and conditional findings instead of deleting them for a metric.
4. Review one canonical room/controller/command authority; plan/cutaway reuse; pure spatial/contracts boundaries; inert startup and injected providers; fixed bridge; single policy; resource ownership; storage projection; version/revision/generation/replay semantics. Remove genuine duplicate authority rather than adding another facade.
5. Preserve existing private backend/operator diagnostics and useful correlation. Never move raw provider/schema/exception data into UI or browser-console logging. Improve safe source-controlled copy only when it preserves or clarifies actual outcomes; do not silence operator visibility to pass tests.
6. Execute the documented plan in cohesive owned changes. Keep room dimensions/provenance, baseline repair, locks, final atomic batches, receipt identity, whole-change Undo, fixed expiry, photo exclusions and finite admission/work policy exact. No implicit provider retries or automatic fallbacks are introduced.
7. Add meaningful regressions for reproduced defects and use existing independent geometry corpus for refactors. Avoid tests that merely restate private implementation. Re-run the smallest relevant product interaction when behavior-sensitive code changes; do not repeat all visual/live/device testing without cause.
8. Run established applicable root gates and inspect the settled complete diff read-only. Independently confirm/fix actionable findings, repeat validation and record actual results. A new material security concern is documented for RM-017/owner selection rather than silently expanding a later remediation approval.
9. Update finding dispositions, affected ticket evidence and release proof invalidation. If a correction materially changes previously reviewed behavior/visual scope, reopen the affected owner checkpoint instead of claiming old approval still covers it.

## Prevention requirements from prior feedback

Prioritize reproduced behavior/ownership defects and structural waste without extra services/frameworks. Check restored data against current runtime capability truth. Prove reachability before deleting public/framework/worker/style/reference code; a long controller alone is insufficient reason to split authority. Preserve private diagnostics and finite controls.

## Acceptance criteria

- [ ] A concrete quality plan covers the whole first-party candidate with evidence, ownership and invariant risks.
- [ ] All prior required ticket outcomes are reconciled against implementation and actual checks.
- [ ] Justified quality/efficiency/structure changes are implemented; retained/deferred items have explicit reasons.
- [ ] Canonical authority, domain/lock/provenance/Undo/expiry rules and finite resource policy remain intact.
- [ ] Private diagnostics remain useful; raw details do not leak to UI/browser logs.
- [ ] Meaningful focused regressions and applicable settled root gates pass.
- [ ] Read-only validation has no new actionable local findings, with exact external limits retained.
- [ ] Materially affected release proof/owner acceptance is identified for refresh or re-review.
- [ ] Every quality correction has a concrete consequence/regression and preserves runtime truth; no speculative abstraction, service, deletion or LOC-driven split is introduced.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Geometry/command refactor | Independent expected corpus and unchanged valid/rejected room outcomes |
| Controller/effect cleanup | Reset/expiry/import/supersession races still fence late work |
| Provider/admission simplification | Same dispatch/retry/capacity/deadline behavior under failures |
| Persistence projection refactor | Same exclusions, fixed expiry and invalid-import preservation |
| Deleted abstraction/dead path | Evidence no real consumer or required behavior was removed |
| Final candidate | Documented dispositions, settled gates and complete diff review |

## Handoff and limits

RM-017 audits the resulting current candidate and RM-019 rebuilds changed artifacts. This packet supplies no owner security selection, paid/cloud acceptance or permission to stage arbitrary paths. Future authorized commits use exact owned file allocation and the RM-016 prefix; currently this is an unimplemented plan.
