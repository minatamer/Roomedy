# RM-018 — Remediate owner-selected security findings

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Conditional security remediation**  
Depends on: [RM-017](RM-017-audit-security-and-present-findings.md) and explicit human selection of current findings  
Suggested commit: `RM-018: remediate selected security findings`  
Authority: [security policy §21](../ROOMEDY.md#21-security-and-diagnostics), the future reviewed RM-017 report and exact human selection  
Queue and execution rules: [ticket index](README.md)    
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-02, L-21–L-23) and [review checklist](../design/REVIEW_CHECKLIST.md)
Additional gate: **No findings are preselected. This packet is ineligible until selection exists.**

## Outcome and standalone context

Implement only the local remediations explicitly selected from the actual security review, with focused regressions and current release evidence. Keep unselected/deferred findings visible. Preserve the accepted product, canonical room semantics, privacy, useful private diagnostics, deliberate motion and required finite resource controls.

This is a conditional packet because no application or security findings exist yet. It must not manufacture a vulnerability list or treat approval of the ticket plan as approval of future findings. Cloud/IAM/account/vendor fixes or paid verification still require their own applicable scope even if the owner approves a local code correction.

## Dependency evidence and proposed ownership

Read the complete reviewed report, precise finding IDs/versions, actual current code and trusted human message. Reconcile drift before making changes.

| Area | Responsibility |
| --- | --- |
| `docs/security/remediation-plan.md` | Selected IDs, human source, exact affected paths, order and regression plan |
| Selected existing app/package/config/dependency owners | Smallest corrections justified by approved findings only |
| Focused regression corpus | Independent before/after evidence for each selected issue |
| Security report/PM HTML and validation record | Verified dispositions, remaining risk and unperformed external checks |
| Release source/image proof | Mark and hand off every changed relevant input for RM-019 rebuild/recheck |

## Implementation plan

1. Verify the owner selected all current findings or an explicit ID list. Bind the selection to report/candidate scope and record trusted wording. If the owner selected no fixes/deferred all, document that disposition and skip implementation; do not mark findings remediated.
2. Reproduce each selected local issue against the current candidate before editing where possible. If code drift already resolved it, record current proof and disposition rather than adding redundant code. A material new issue outside the selection returns to owner review.
3. Write exact file-level allocation and correction order, including shared-policy/contract/transport impacts and compatible dependency versions where relevant. Avoid combining unrelated cleanup or changing product behavior under a security label.
4. Correct the root cause at the proper boundary: contracts, canonical command engine, controller effect fence, intake stream, bridge, provider admission or release packaging as the finding requires. No duplicated validators/limiters or ad hoc UI-only guards for a server trust problem.
5. Preserve current room data/provenance, starting locks, baseline repair rules, atomic/idempotent Apply, Undo, fixed expiry, photo/export exclusions and useful manual fallback. A protective rejection must provide safe actionable source-controlled copy, not raw exceptions.
6. For dependency patches, verify primary compatibility/release notes and exact lockfile/output changes. No unrelated broad upgrade or weakened advisory suppression. Vendor-unavailable patches remain a named external blocker with bounded mitigations only if selected.
7. Add a meaningful regression that fails for the original issue and passes the correction, plus affected neighboring behavior. Ordinary tests remain fake/paid-off and network-denied before imports. Do not prove a fix by attacking a hosted service or making an unapproved provider request.
8. Run focused checks and established applicable root gates. Review the settled complete diff read-only, independently confirm findings, correct within approved scope and revalidate. Preserve actual evidence and limits; no “all secure” blanket claim.
9. Update each selected finding with exact changed paths, actual checks and remaining external condition. Keep unselected IDs unchanged/deferred. Reopen visual/security decisions only when material scope changes require it; no redundant request for the same approved local fix.
10. Notify RM-019 of changed build/runtime/asset/config/lockfile inputs and required Linux/package/probe refresh. A passing old image cannot validate a patched source candidate.

## Prevention requirements from prior feedback

Use the smallest compatible correction for selected findings and preserve functionality/motion/private diagnostics. Quiet UI must not weaken server controls, and a dependency advisory must not trigger an unrelated platform rewrite. Approval in Retailor is not a finding selection here; preserve all unselected dispositions.

## Acceptance criteria

- [ ] Exact trusted finding selection/report scope is recorded before any remediation.
- [ ] Each selected local issue has current reproduction/evidence, owned correction and focused regression.
- [ ] Only selected scope is changed; new substantial issues return for review and unselected findings remain visible.
- [ ] Domain behavior, private diagnostics, privacy, deliberate motion and finite work/admission policy are preserved.
- [ ] Applicable focused/root gates pass and settled read-only validation has no new actionable local findings.
- [ ] Report/HTML dispositions distinguish fixed, externally pending, deferred and rejected accurately.
- [ ] Relevant release proof and any materially affected owner review are marked for refresh.
- [ ] No cloud/vendor/account action, paid request, scanner export or unrelated Git action is inferred from finding selection.
- [ ] Selected remedies remain proportionate to the demonstrated issue and do not introduce unrequested infrastructure or weaken behavior/verification for presentation.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Selected reproducible issue | Original trigger fails safely after correction and neighboring valid flow still works |
| Scope boundary | Changed files map to selected IDs/file plan; no invented findings marked approved |
| Dependency or policy fix | Exact version/limit rationale and compatibility/admission regression |
| Provider/lifecycle/security interaction | Dispatch, cleanup, replay and late-result invariants remain intact |
| Deferred/external finding | Explicit remaining condition and release implication, no remediated checkbox |

## Handoff and limits

RM-019 consumes selected-fix evidence or the explicit no-fixes/defer decision and refreshes the candidate. A deferred critical public-release concern can block RM-020 even when local handoff is complete. No vulnerability, selection or execution is asserted by this plan. Follow the index's future authorized commit and validation rules.
