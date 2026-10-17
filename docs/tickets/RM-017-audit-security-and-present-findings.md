# RM-017 — Audit security and present findings

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Security audit and owner review**  
Depends on: [RM-016](RM-016-audit-and-improve-code-quality.md)  
Suggested commit: `RM-017: document security audit and reviewed findings` — only after the review permits Git actions  
Authority: [blueprint §21](../ROOMEDY.md#21-security-and-diagnostics), [§§16–18](../ROOMEDY.md#16-api-and-provider-contracts), [§23](../ROOMEDY.md#23-deployment-preparation)  
Queue and execution rules: [ticket index](README.md)    
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-14, L-20–L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)
Additional gate: **Audit only. Present detailed Markdown and severity-ranked PM HTML, then stop for explicit finding selection.**

## Outcome and standalone context

Audit the exact settled candidate for proportionate STRIDE, application, privacy, abuse, provider-spend, dependency and release risks. Produce actionable evidence and careful fix plans for the owner. Do not remediate code, change dependencies/configuration, stage/commit the audit or deploy during this audit-only packet.

Roomedy accepts untrusted room images, semantic imports, visitor text and model output; holds transient photos and bounded browser data; forwards metered operations through a public bridge to a private API. The audit must cover those real trust boundaries and finite resource promises. No Roomedy findings or severity are invented at planning time; earlier siblings' findings are structural lessons, not current defects.

## Dependency evidence and proposed ownership

Read actual source, lockfile, package output, release files, current evidence and unresolved gates. Source/runtime inputs are inspected read-only; only audit documentation is written.

| Area | Responsibility |
| --- | --- |
| `docs/security/SECURITY_REVIEW.md` | Scope, candidate identity, threat model, findings, evidence and precise fix plans |
| `docs/security/SECURITY_OVERVIEW.html` | Self-contained severity-ranked PM explanation and decision list |
| Audit input/evidence manifest | Sanitized paths/digests, tools/database dates and performed/unperformed checks |
| Main progress/ticket evidence | Awaiting-owner checkpoint and selected/deferred finding status after human reply |
| Application/dependency/runtime files | Read-only audit targets; no fixes in this packet |

## Audit plan

1. Identify exact current source/build/image inputs, unresolved local/external evidence and trust boundaries. Model spoofing, tampering, repudiation, disclosure, denial of service and privilege escalation where relevant. State assumptions, attacker capabilities and out-of-scope infrastructure explicitly.
2. Audit browser/app boundaries: safe rendering of assistant text/names/imported labels, no arbitrary HTML/scripts/remote assets, strict semantic import, prototype/key hazards, CSP/security headers, client/server bundling and public config/error leakage. Check local recovery/expiry/reset/download and cross-tab namespaces.
3. Audit image intake and transport: MIME/content/codec validation, pixel/decode/metadata limits, decompression/memory exposure, count/aggregate/encoded bounds, streaming before buffering and bridge/parser/provider copies. Verify originals are never persisted/default-exported or logged.
4. Audit canonical state and action authority: starting locks, model confirmation/unlock bypass, catalogue/ID/version trust, atomic final batches, issue-aware repair, revision/generation fences, replay receipts and import not restoring grants/operations. Client pass flags cannot authorize backend provider work.
5. Audit public/private routing, allowed methods/paths/origins, identity/SSRF/redirect/header forwarding, challenge verification and operation-grant binding. Check rate/capacity/replay ledger bounds, proxy/client identity assumptions and shared recognition/chat admission before large body/provider work.
6. Audit cancellation/deadline/refusal/error paths and exact dispatch accounting. Inspect hidden retries, unresolved remote work on disconnect, finite tool loops/output/search memory and restart/multi-instance limitations. Distinguish account alerts from enforceable funded caps; identify missing external controls honestly.
7. Audit secrets, blank examples, ignore rules, compiled frontend, image contexts/runtime inventory, non-root base images, Linux package proof and release scripts. Preserve private operator diagnostics while ensuring photos/rooms/chat/tokens/raw provider payloads do not reach public outputs/logs. Do not read sibling secrets or dump runtime environment values.
8. Inspect lockfile/direct/transitive dependencies, licenses and vulnerable code reachability. Record tool/advisory/database date and actual query scope; stale/offline data cannot prove current vulnerability absence. No package update or remote scanner metadata export occurs during review. External scans require separately applicable authorization.
9. Reproduce suspected issues using bounded offline/injected tests or static trace evidence without altering application files. Label confirmed, static-supported and unverified concerns distinctly. Do not exploit a hosted service, transfer private data or make paid requests to establish a finding.
10. For each finding provide stable `SEC-###` ID, severity/confidence, affected paths/lines, realistic trigger/impact, evidence, smallest safe remediation, invariant risks, dependencies and meaningful regression/release proof. Separate local corrections from external account/IAM/vendor actions. No speculative issue is presented as a proven exploit.
11. Produce the detailed report and readable PM HTML with current severities, observed facts, decisions requested and external blockers. Present all findings including an explicit no-findings result if supported; never infer owner acceptance from silence or prior quality approval. Leave audit artifacts unstaged/uncommitted pending review.

## Prevention requirements from prior feedback

Keep the audit proportionate to a single-room guest demo. Include stream-fragment overhead, current-mode restore, quiet challenge/server proof, safe decision logs and exact candidate evidence. Separate scanner severity from reachable application risk and available patches. Do not invent findings or import the reference chat's permission to remediate without review.

## Approved plan refinements — 17 October 2026

**Audit the refined candidate; approval is not a security waiver.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Include the actually implemented refined contracts and runtime assumptions: per-fact evidence/import trust, physical representation eligibility, bounded replay retirement, request scope, server-recomputed input binding, boot/process grant validity, disconnect-independent deadlines, provider schema/storage/cache/retention and stale-client release behavior. Reproduce or trace current risks proportionately; an approved design refinement is neither proof of safety nor a preselected vulnerability/fix. Preserve the report-only, unstaged/uncommitted finding-selection stop. Distinguish allowed transient product display and semantic export from forbidden diagnostic/photo/chat retention.

## Acceptance criteria

- [ ] Exact candidate, performed checks, tools/database dates, assumptions and unperformed external evidence are recorded.
- [ ] Real trust boundaries and relevant STRIDE/application/privacy/spend/dependency/release surfaces are covered.
- [ ] Findings have stable IDs, evidence/confidence, realistic impact and bounded remediation/regression plans.
- [ ] No sibling finding, unverified concern or old scan result is misrepresented as a confirmed current defect.
- [ ] Detailed Markdown and self-contained severity-ranked PM HTML agree and contain no secrets/private room data.
- [ ] Application/config/dependencies remain unchanged by the audit and artifacts remain unstaged/uncommitted for review.
- [ ] Owner is shown the concrete report and asked which current findings to fix, defer or reject.
- [ ] The report distinguishes confirmed/reachable/local issues from static/vendor/hosted uncertainty and retains Roomedy's explicit owner finding-selection gate.

### Additional approved acceptance — all unperformed

- [ ] The report evaluates actual adopted contract/data/admission/skew behavior with current evidence and honest external limits; no review recommendation is pre-labelled a confirmed vulnerability or owner-selected fix.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Claimed disclosure/injection/replay/resource issue | Reproduction or precise static trace with explicit confidence/limitations |
| Dependency finding | Actual installed version, advisory date/reachability and proposed compatible correction |
| Security claim based only on fake/local proof | Mark hosted/vendor condition unverified rather than secure |
| Report/HTML consistency | Every finding ID/severity/status and requested decision matches |
| Audit diff | Documentation-only mutations and no automatic staging/fixes/export |

## Owner decision and handoff

Record exact trusted human selection of all findings or named IDs, plus explicit deferrals/rejections. RM-018 cannot begin from generic “continue” or this planned ticket. If no fixes are selected, an explicit no-fixes/defer decision permits skipping remediation while retaining unresolved release implications. New substantial findings return for selection. No approval has been supplied for this future report.
