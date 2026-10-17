# RM-019 — Finalize local release evidence and handoff

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Final local handoff**  
Depends on: [RM-014](RM-014-prepare-linux-images-and-release-runbooks.md), [RM-015](RM-015-verify-responsive-accessible-and-performant-experience.md), [RM-016](RM-016-audit-and-improve-code-quality.md), [RM-017](RM-017-audit-security-and-present-findings.md), [RM-018](RM-018-remediate-owner-selected-security-findings.md) or its explicit no-fixes/defer disposition  
Suggested commit: `RM-019: finalize local release evidence and handoff`  
Authority: [blueprint §§22–24](../ROOMEDY.md#22-local-engineering-conventions), actual owner visual/security decisions and current evidence  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-02, L-17, L-19, L-20, L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Hand over the current locally built product, reviewable release files and an honest evidence ledger after quality/security work. Rebuild/recheck any artifacts changed since RM-014. Preserve actual audit guidelines and decisions so a future run can continue from evidence instead of repeating completed phases or claiming external release success.

Local completion is not paid, hosted, domain, physical-device or owner acceptance. A missing provider key can leave a bounded evaluator ready and live checks pending; it cannot excuse a missing required local feature. Deferred findings remain visible with release consequences. No deployment, publication, paid run or domain action occurs in this packet.

## Dependency evidence and proposed ownership

Read all ticket records, actual current source/status, visual decision, selected-fix/no-fix decision and release proof. Never infer completion from commit subjects alone.

| Area | Responsibility |
| --- | --- |
| `docs/operations/LOCAL_HANDOFF.md` and candidate manifest | Per-ticket result, exact current inputs, commands, decisions and blockers |
| Release images/probes/proof scripts from RM-014 | Required rebuild/revalidation for changed candidate bytes |
| README/docs index/blueprint/PM overview | Accurate implemented/local/live/hosted claims and navigation |
| Ticket/evaluation/security evidence and canonical progress | Reconciled status, preserved history and precise next action |
| External readiness checklist for RM-020 | Concrete owner inputs/authorization prerequisites without performing them |

## Implementation plan

1. Reconcile RM-001–RM-018 outcome by outcome against actual source, checks, dependency evidence and human decisions. Record complete-local, required-local failure, explicit deferral/supersession or exact external blocker with destination. Do not convert unchecked acceptance into a pass for a tidy summary.
2. Capture exact current release inputs, including relevant owned uncommitted/untracked files, lockfile/config/assets and image digest. Distinguish source manifest from Linux runtime proof. Quality/security changes invalidate affected earlier evidence.
3. Rebuild changed shared packages/apps/images and refresh affected Linux runtime/assets/worker/health/bridge probes and strict proof where tooling exists. Re-run focused application regressions for changed behavior and settled root gates. If Linux tooling remains unavailable, preserve the exact unchecked release requirement and completed preparation.
4. Verify operational instructions against actual commands/ports/config and ownership-safe startup/cleanup. Confirm blank-secret examples, fake/paid-off defaults and real-live fail-closed readiness. Do not read/dump secrets or run a paid smoke as a convenience.
5. Preserve owner visual decision, security report/selection/dispositions and any explicitly deferred physical/live/vendor checks. New material findings or reviewed-scope changes reopen only affected gates; no new security fixes beyond selected scope are silently bundled.
6. Update user-facing/docs claims to the implemented state, with scripted illustration, fake development and real provider evidence clearly distinguished. Keep selected no-price/no-budget scope and 2D-review-before-3D-editor story consistent. Never advertise hosted readiness from local artifacts alone.
7. Prepare one concise external readiness checklist: model/provider key/privacy/funded cap/data rights, actual challenge, cloud project/region/identities/secrets/limits, image publishing and deploy permission, optional domain/TLS authority, specific physical/owner evidence and unresolved release-blocking findings. Avoid asking for inputs irrelevant to local completion.
8. Document rollback/current known limitations and exact next action. If Git permission exists, stage only clean validated owned paths according to file plans; otherwise keep unstaged changes and report them. No push is implied.
9. Present completed local outcomes, actual checks and named pending external evidence. Set the main workflow to complete-local while external requirements remain, not fully released. RM-020 remains conditional and cannot start from a generic automatic continuation.

## Prevention requirements from prior feedback

Reconcile every new feedback guideline with actual owning evidence. Keep screenshot/mode/input identity explicit, actual Linux/CI separate, and current source proof fresh after relevant fixes. Do not carry forward a visual/manual pass over materially changed UI. Handoff stays honest about unused external permissions and pending tests.

## Approved plan refinements — 17 October 2026

**Final proof includes open-client behavior and precise claims.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Reconcile PR-01–PR-15 and adopted O dispositions against actual evidence, not their documentation adoption. Refresh CI/action/base-image/tool/source/image identities and stale-client/lazy-chunk/worker/API/rollback behavior after relevant changes. Preserve separate Windows/Linux/hosted/model/owner claims. Document criterion-level motion/expiry and surface-specific privacy limits; local cleanup cannot delete exported or provider-controlled copies. O-01 remains an unexecuted comparison seam and O-02 retains its measured conditional disposition.

## Acceptance criteria

- [ ] Every required prior outcome has evidence or an explicit legitimate disposition/destination.
- [ ] Required local failures are resolved or honestly block local completion, rather than being labelled external.
- [ ] Current source/image/probe identity is accurate and affected release proof is refreshed or explicitly unchecked.
- [ ] Actual local commands/config/ports/runbooks and blank/fake defaults agree with implementation.
- [ ] Owner visual/security decisions and deferred findings remain traceable and scoped to the reviewed candidate.
- [ ] README/blueprint/index/overview/ticket/progress claims distinguish implemented, fake, live, local and hosted status.
- [ ] External prerequisites and release implications are concrete, with no credentials or assumed authorizations.
- [ ] Final handoff reports actual checks, limits, Git state and exact next action without automatic deployment/spend.
- [ ] Final evidence identifies how applicable feedback guidelines were checked and never reuses materially stale visual, provider, Linux or hosted acceptance.

### Additional approved acceptance — all unperformed

- [ ] Final reconciliation includes adopted refinements, actual stale-client/rollback/action-identity proof and honest unperformed research/live/hosted cases without converting approval or old evidence into a pass.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Ticket says complete but criterion is unperformed | Reconcile to honest local/external disposition; do not copy the label |
| Quality/security changed relevant source or lockfile | Fresh matching proof/build/probes; old digest cannot pass |
| No paid/cloud credentials available | Complete local files/evaluator/runbooks and named unchecked real evidence |
| Deferred security/physical check | Specific release consequence retained in RM-020 checklist |
| Final public claims and Git status | No unsupported live/hosted/accuracy claim or unauthorized staging/commit |

## Handoff and limits

This packet closes authorized local delivery only. It can be locally complete while RM-020 and live/physical requirements remain pending. Final output links current artifacts and names what was actually checked. No future automation or separate chat is created without a user request.
