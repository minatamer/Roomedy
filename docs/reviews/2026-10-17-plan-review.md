# Roomedy full plan review — 17 October 2026

Status: **Approved by owner; adopted into the blueprint and existing ticket packets on 17 October 2026.**

The architecture and selected product flow remain appropriate. The most valuable improvements concern the fidelity of the editable room, the scope of assistant actions and measurable acceptance. New reconstruction research is relevant to a later comparison, but there is no evidence that Roomedy needs another runtime service or a different frontend stack.

This review covered all twenty ticket packets, the blueprint, visual-feedback guidelines and relevant implementation at the reviewed snapshot. The owner subsequently approved PR-01–PR-15 and the O-01–O-03 dispositions and requested documentation/ticket adoption before resuming RM-003. The owning blueprint sections and packets now carry these requirements. Approval does not verify implementation, select future security findings or authorize additional external work. The findings below preserve their review-time evidence and recommendation wording.

## Reviewed state and evidence

- HEAD: `dc07101324ce91f7066abc34243ef218eebe80c4`, the completed local RM-002 commit. RM-001 is also committed; actual hosted CI remains unverified.
- RM-003 is partial, unvalidated and uncommitted. Its shared build had passed before this review, but its required test corpus and final validation do not exist yet. Findings against that code describe unfinished work, not a regression attributed to a completed ticket.
- The twenty `docs/tickets/RM-*.md` files at the pre-adoption reviewed snapshot had manifest digest `a9c199bf505546dde66637fbd1a8cda4a66e1139063b07c474c77ea6bfbf5e71`: SHA-256 of the compact, sorted-key JSON list of repository-relative path/file-SHA-256 records, sorted by path.
- Three read-only specialist reviews covered spatial/state/search, product/photo/AI, and safety/delivery. The primary review independently inspected the relevant source and repeated the four observations below using an inline Node/tsx probe. These narrow probes are not the RM-003 test suite or ticket validation.
- Primary technical pages linked beside findings were opened on 17 October 2026. Research results and vendor guarantees were not benchmarked locally. No model was downloaded, provider call made, cloud service changed, application implementation edited, or file staged/committed during this review.

| Narrow observation against unfinished RM-003 | Actual result | Consequence |
| --- | --- | --- |
| Visitor confirms the fixed chair width as 680 mm instead of 670 mm | `unsupported-variant` | Representation policy currently rejects an honest physical measurement. |
| A 1501 mm desk exactly fills a 1501 mm room width | Legal integer centres 750 and 751 each produce a 0.5 mm boundary violation | The dimension/centre lattice cannot express every exact fit. |
| Inspect an authored collision while the pose schema has no provenance fields | Issue confidence is `confirmed` | The schema cannot distinguish a reviewed position from a visual guess when dimensions are confirmed. |
| Apply 257 distinct harmless no-op commands in one workspace | 256 receipts retained, revision stays 0, command 257 returns `capacity` | Finite replay protection can permanently disable ordinary editing. |

## Foundation changes to settle before RM-003 is signed off

### PR-01 — Separate physical measurements from representation eligibility

**Owners:** RM-003, with consumers RM-002/005/007/010/012. **Priority:** foundation correctness.

[`validateRoom`](../../packages/spatial/src/commands.ts) checks every furniture dimension against the selected catalogue entry's size range. That is appropriate for an offered new catalogue variant, but too restrictive for an owned real object represented by a similar model. A 680 mm chair does not cease to exist because its chosen fixed visual asset is 670 mm wide. The current correction result contradicts RM-003's explicit requirement to preserve true measurements even when they reveal a problem.

Preserve bounded semantic physical dimensions independently of whether the selected asset can depict them. Resolve the representation through an eligible procedural model or an explicitly limited semantic placeholder, keeping the object identity, owned status, dimensions and checks intact. Keep proposed new catalogue additions/replacements within their supported variant policy. Do not silently stretch a fixed detailed asset or silently change the physical size.

**Acceptance addition:** correct a fixed model and a procedural item beyond their representation range; retain the measured values, recompute issues and show the representation limitation. Repeat through import, restore and initial review. Measurements outside the application's finite safety bounds still reject.

### PR-02 — Track evidence for every physical fact a check uses

**Owners:** RM-003/007/010; consumers RM-005/009/011/012. **Priority:** foundation correctness.

[`poseSchema` and feature fields](../../packages/contracts/src/room.ts) use bare position/rotation numbers and wall/mechanism/hinge enums. [`checkRoom`](../../packages/spatial/src/checks.ts) derives confidence from numeric measurement statuses. Confirming width/depth therefore cannot establish that a guessed photographed placement, wall association or door mechanism is correct. Some access calculations also depend on room dimensions which must participate in their confidence calculation.

Add a small bounded source/review representation for those facts, or conservatively cap a dependent assessment at approximate until its actual inputs are reviewed. Distinguish a visitor's deliberate **planned position** from a measurement of the original photographed position. Derived exact arithmetic does not improve uncertain input evidence. Report coverage per relevant rule/dependency; an absent issue must not be treated as a checked pass when the rule is unsupported or inputs are unknown.

**Acceptance addition:** confirmed furniture dimensions plus an estimated pose or unknown mechanism never produce a confirmed fit claim. A visitor drag records a planned placement without certifying the original photo. Import/source loss does not authenticate evidence. This addresses the precise-spatial-localization limits documented in the [official vision guide](https://developers.openai.com/api/docs/guides/images-vision).

### PR-03 — Resolve the centre-coordinate lattice deliberately

**Owners:** RM-003/005/006/009/012. **Priority:** foundation contract consistency.

Integer millimetre dimensions and integer millimetre centres are incompatible with some exact fits. The independently calculated centre of a 1501 mm object spanning 0–1501 mm is 750.5 mm. This is independent of model quality and floating-point error.

Recommend allowing bounded half-millimetre centres, with doubled-integer coordinates internally where useful, while retaining integer physical dimensions and quarter-turn rotations. Document the wire representation and convert to render metres once. An alternative quantization policy must explicitly describe the representable positions and its physical consequences; an arbitrary collision epsilon would conceal the inconsistency.

**Acceptance addition:** odd/even width and depth at all four orientations, exact wall contact, snapping, keyboard/numeric entry, preview/Apply/Undo and JSON round trips agree. Update coordinate prose and fixtures together before editor/search integration.

### PR-04 — Complete the authority for correcting room features

**Owners:** RM-003, wired through RM-005/007/010. **Priority:** missing contract coverage.

The current [command schemas](../../packages/contracts/src/commands.ts) can confirm numeric values on an existing feature, but cannot add/remove an opening or correct its wall, hinge or mechanism. Blueprint §7.2 and RM-007 already require these operations. Leaving them out would encourage later components to mutate room data outside the shared authority.

Specify bounded trusted visitor feature commands, target/field validation and the distinction between correcting an observed physical fact and proposing a new arrangement. An honest hinge/wall correction may reveal a conflict and should preserve the fact. Model hypotheses remain draft evidence until accepted; they cannot manufacture confirmation or structurally renovate the room.

Also make room, feature and furniture targets unambiguous: current object-ID uniqueness excludes the room ID, while `correct-dimensions` treats a matching room ID specially. Either use explicitly typed targets throughout or reject cross-kind ID collisions.

**Acceptance addition:** add a missed door/window, remove a false detection, correct wall/hinge/mechanism and undo each complete instruction through the same evaluator. Test room/object ID collisions, model self-confirmation, invalid final batches and truthful corrections revealing issues.

### PR-05 — Bound replay history without exhausting the editor

**Owners:** RM-003/005, exercised in RM-012/013. **Priority:** ordinary-session liveness.

The unfinished [receipt registry](../../packages/spatial/src/proposals.ts) rejects all further commands when its 256-entry/1 MiB capacity is reached. No-op commands consume entries too. A finite memory policy is necessary, but a two-hour workspace should remain editable after ordinary repeated gestures.

Define a bounded replay window and safe retirement protocol, using revision/operation retirement or a monotonic sequence as appropriate. Retired commands must reject as stale rather than execute again. Recent duplicate Apply must remain idempotent, including after Undo. Do not merely evict old IDs while permitting their payloads to become executable again. Keep local command replay semantics separate from metered server-grant accounting.

**Acceptance addition:** a long sequence beyond 256 actions remains usable within bounded memory; repeated no-ops do not cause permanent lockout; old/mismatched commands cannot mutate state. Include duplicate Apply after Undo and revision/generation changes.

## Refinements before their owning integration or release work

### PR-06 — Define the uncertain draft between photographs and the room

**Owners:** RM-007/010; evaluated in RM-013. **Priority:** photo-to-room reliability.

The current packets describe approximate relationships and duplicate reconciliation, but leave the intermediate representation underspecified. Separate bounded **photo observations** from **candidate physical entities**. Keep source IDs allow-listed, associations finite and canonical IDs application-owned. A provider assertion that two pictures show one desk must remain reviewable, especially when there are two similar desks.

Define how observations acquire one rectangle orientation, wall associations and physical scale. Unresolved relationships may have estimated display positions in the rough sketch; they must not acquire confirmed millimetres just to fill the canonical schema. Accepting an approximate room remains possible with the appropriate limitations.

Specify measurement-change behavior: preserve confirmed physical values and deliberate visitor placements, recompute only dependent draft estimates, and flag contradictions. Do not rescale every piece after a wall correction. Merge/split/add/remove review must preserve visitor corrections and relevant available source references.

**Acceptance addition:** one piece in two photos, two identical pieces, contradictory associations, photo removal/reordering, mirrored wall associations, swapped width/depth and a dimension correction after partial review. All reach the rough **2D-only** review, never an initial 3D preview.

### PR-07 — Give each request a bounded mutation scope

**Owners:** RM-009/011; contracts in the shared authority. **Priority:** prevent unsolicited changes.

“Move my desk near the window” should not implicitly authorize moving every unlocked piece or changing finishes. Existing locks protect fixed pieces, but being unlocked is broader than being a target of this request.

Capture allowed action kinds and target/add/replace/remove scope from the selected action, referenced objects and resolved request. Clarify genuinely ambiguous or broader work. Disclose necessary coordinated changes, such as moving the associated chair. The model cannot widen this application-owned scope through a tool argument. Whole-room rearrangement remains available for an explicit whole-room goal.

Rank valid targeted proposals by request satisfaction, then fewer changed pieces/lower displacement before decorative preferences. Keep hard constraints separate from scoring.

**Acceptance addition:** a desk request preserves unrelated unlocked furniture and finishes; an appearance request preserves geometry; rearrange-owned forbids additions/replacements; necessary desk/chair coordination is explained. Check scope again on Apply, alongside locks and revision.

### PR-08 — Separate reproducible search effort from elapsed time

**Owners:** RM-009, measured in RM-015. **Priority:** useful and responsive search.

The same seed does not guarantee the same best candidate when one device reaches a 250 ms cutoff after 2,000 candidates and another after 10,000. Guarantee stable ordering and fixed-work results. Deadline-limited output records visited work and termination reason rather than claiming cross-device identical results.

Use pure incremental search state with scheduling outside the spatial package, or another measured bounded execution method. Browser work stays in its worker; backend work must yield or run off the event loop so cancellation and other requests remain responsive. [Node's guidance](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop) explains partitioning/offloading CPU work.

The quality corpus must require actual goal improvement, not merely any valid arrangement. Include tight but feasible authored rooms and independently known valid arrangements. Candidate ordering/pruning should exploit walls, openings and targeted relationships before a broad grid; final candidates still use the complete shared validator. Preserve truthful bounded exhaustion.

**Acceptance addition:** fixed-work replay, deadline-prefix reporting, responsive health/cancellation under maximum search, stale worker replies and measured improvement on the supported stories. No general optimality claim or separate solver service is required.

### PR-09 — Make the evaluation rubric decide readiness

**Owners:** RM-013; requirements inform RM-007/010/011 early. **Priority:** evidence quality.

Declare case-level pass/fail rules before tuning. Treat unauthorized mutation, false confirmation, stale Apply, silent fake fallback and non-AI provider dispatch as failures with zero tolerated occurrences in the tested corpus. Measure category/opening coverage, false merges/splits, uncertainty honesty and manual repair actions separately. Record exact case counts and failures; a tiny corpus does not establish broad accuracy.

Group development/held-out cases by physical room/object so different views of one room cannot leak across sets. Add photo-order, orientation and missing-view perturbations; assess semantic relationships and appropriate uncertainty rather than exact wording. Retain independent authored geometric expectations and human-labelled ambiguous cases. This applies the [official evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) to Roomedy; the particular criteria are project recommendations.

Prepare a small corpus/rubric skeleton before recognition integration, then complete the integrated kit in RM-013. Select a compatible model from later authorized results; no model name or leaderboard alone decides it. Paid runs remain separate and unauthorized.

### PR-10 — Test the provider schema dialect and explicit data policy

**Owners:** RM-008/010/011/013. **Priority:** integration reliability and privacy.

Keep rich internal Zod/domain contracts separate from their provider-compatible schema projection. OpenAI Structured Outputs supports a subset of JSON Schema: notably the root must be an object rather than a top-level union. Strict tools need closed objects and required fields, with explicit nullability where appropriate. Test the actual emitted schema and local decoding of refusal/incomplete/unknown outcomes; ordinary Zod parsing alone does not prove provider compatibility. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [function calling](https://developers.openai.com/api/docs/guides/function-calling).

Recommend explicitly setting strict mode and serial tool calling for this one-proposal product, with one correlated final application-owned batch. Choose per-round tools deliberately. Revalidate actions and facts independently of schema compliance.

Specify foreground stateless requests with `store: false`, bounded supplied context and no persistent provider conversation or file object unless separately justified. Verify caching/account retention for the eventual selected model. Disabling response storage does **not** establish zero retention: abuse-monitoring, image-handling and model-specific caching policies remain relevant. The transfer disclosure must reflect actual settings, and local reset cannot delete external copies. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

**Acceptance addition:** provider schema compatibility fixtures; strict flags and serial-call policy; explicit storage settings in captured fake requests; no automatic state continuation or hidden retry; documented unresolved model/privacy evidence.

### PR-11 — Specify grants and deadlines across process and network failure

**Owners:** RM-008; assumptions carried into RM-014/020. **Priority:** before paid readiness; fake tests can run locally.

Input binding must cover a server-recomputed digest of normalized image bytes/request semantics and the allowed operation, not merely a client manifest/revision claim. Consume grants atomically before dispatch. With a content-free in-memory ledger, include a process/boot epoch or process-local signing material so an old consumed grant cannot become valid after restart. A grant reaching another runtime can reject safely; document that availability tradeoff. Reject new admissions when the bounded ledger is full rather than silently discarding active replay protection.

Use a server-owned operation deadline independent of browser disconnect events. Specify timeout ordering from provider call through whole operation, bridge and hosting, leaving cleanup margin. Test a vanished browser **without** a propagated abort, a provider that ignores abort, timeout and shutdown. Preserve conservative unresolved-remote accounting. Cloud Run documents that HTTP/1.1 disconnects do not propagate and that a gateway timeout does not terminate container processing. [Disconnect behavior](https://docs.cloud.google.com/run/docs/troubleshooting#client-disconnect), [request timeouts](https://docs.cloud.google.com/run/docs/configuring/request-timeout).

Maximum instances=1 is an operational starting point, not a global process lock or durable spend cap: Cloud Run documents temporary excess instances and revision overlap. Separate per-process replay guarantees from cross-process/account exposure. Public paid readiness must explicitly resolve or accept the remaining bounded exposure under its later authorization; this review does not add a database. [Maximum-instance behavior](https://docs.cloud.google.com/run/docs/configuring/max-instances-limits).

**Acceptance addition:** two fake runtimes/restart, substituted payload, concurrent duplicate consumption, full ledger, no-disconnect timeout and exactly-once cleanup/accounting. These are design acceptance additions, not a finding from a performed production security audit.

### PR-12 — Include the already-open visitor in release/rollback proof

**Owners:** RM-014/019/020; lifecycle integration RM-012. **Priority:** before a release claim.

An exact image pair does not cover a visitor with old JavaScript who loads a new lazy 3D chunk or search worker after deployment. Define behavior for old frontend/new server, missing chunks and catalogue/schema/rules mismatch, including rollback.

Next's current self-hosting guide describes deployment-ID skew handling and full reloads which can lose component state. Choose an intentional compatible-asset/update strategy; do not assume the framework preserves transient photos or a draft. Fence pending work and preserve accepted semantic recovery where possible. An active visitor must not enter a reload loop or lose work through an undisclosed forced update. [Next version-skew guidance](https://nextjs.org/docs/app/guides/self-hosting#version-skew).

Include CI action identities in release inputs. Current [workflow](../../.github/workflows/check.yml) uses mutable `@v4` references. Verify full commit identities as a proportionate default, and include base-image/platform/tool identities in the proof. GitHub documents [action supply-chain controls](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions); evaluate any newer workflow-lock mechanism only when supported and useful. No hosted run is authorized by this review.

**Acceptance addition:** local two-build stale-client/chunk/worker cases, schema mismatch and rollback; deliberate update behavior distinguishes accepted semantics from transient photos/proposals; stale proof still rejects.

### PR-13 — Make visual and performance acceptance capable of failing

**Owners:** RM-004/005/006/007/011 per feature; consolidated RM-015. **Priority:** prevent repeated visual rework.

The existing per-feature checklist is good and should remain mandatory. Record actual rendered representative states when each surface is built, including a short laptop and narrow/mobile layout. Freeze a small internal visual baseline for palette/type/padding/panel hierarchy from the actual RM-004/005 frontend; use it during subsequent work. This is feature evidence, not another automatic owner approval or an invented new product-design gate.

For performance, declare measured budgets with browser/device or throttle, build mode, room/photo count, cold/warm state and repetitions. Track discrete action latency, drag/orbit frame behavior, image decode peak, search/abort latency and Apply/Undo motion. Set practical thresholds using first measurements and require the owning modules to meet them before calling RM-015 passed. Being finite alone is insufficient.

INP concerns click/tap/keyboard responsiveness, so it cannot replace continuous canvas interaction measurements. The field guidance's 200 ms boundary is context, not a Roomedy result from one laboratory run. [INP documentation](https://web.dev/articles/inp).

### PR-14 — Reconcile accessibility claims with selected timing and motion

**Owners:** RM-004/012/015; documentation/checklist. **Priority:** truthful acceptance; preserve owner choices.

Keep designed motion active and smooth while it runs. An automatic landing sequence can finish and settle within five seconds, with stable readable text. Avoid making decorative movement perpetual or using auto-updating text without appropriate control. W3C distinguishes qualifying automatic motion from other interaction animation; the existing no-global-animation-off direction does not require an endless loop. [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).

The selected two-hour active expiry deletes work without extension. Document its specific limitation against timing-adjustability criteria rather than claiming blanket WCAG conformance; two hours does not qualify for the criterion's over-twenty-hour exception. Warning/export opportunities help usability but do not alone establish conformance. Any change to the selected lifetime/extension behavior is an owner product decision and is not adopted by this review. [Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).

**Acceptance addition:** criterion-level disposition and actual keyboard/focus/zoom/touch checks; active animations remain fluid and settle appropriately; expiry behavior and its limitation are recorded accurately.

### PR-15 — Repair documentation contradictions at their owning boundary

**Owners:** docs/checklist and current status records. **Priority:** prevent incorrect implementation instructions.

The [checklist](../design/REVIEW_CHECKLIST.md) currently bans raw photos and room/chat payloads from “public UI/browser console/export/storage” as one combined rule. The product necessarily displays photos/room/chat and deliberately exports/persists an allow-listed semantic room. Replace the blanket rule with distinct surfaces: transient page display is allowed; semantic current/baseline recovery/export is allowed; original photos/chat/provider payloads/credentials stay out of recovery/export; private input content and raw failures stay out of diagnostic logs, public diagnostic envelopes, URLs and application browser-console logging.

Similarly, “Motion runs continuously” should mean smooth progress while an intended animation is active. It must not require perpetual decoration.

At review time, the blueprint's delivery/verification history contained present-tense statements that all packets were Planned or implementation remained prohibited. Adoption now distinguishes those dated historical checkpoints from live instructions and preserves original evidence. Current approval is recorded explicitly; it is not a silently inferred product or ticket change.

## Targeted modern research opportunities

### O-01 — Compare geometry-assisted drafting offline if it reduces correction work

Modern camera/depth reconstruction is a credible later experiment. The [VGGT repository](https://github.com/facebookresearch/vggt) links its 2026 successor, [VGGT-Ω](https://vggt-omega.github.io/). The latter identifies a September 2026 replacement reference checkpoint for comparisons. [Depth Anything 3](https://github.com/ByteDance-Seed/Depth-Anything-3) has several relative/metric configurations and checkpoint-specific licensing; its refreshed checkpoints also matter to reproducibility.

Those outputs do not automatically establish Roomedy furniture identities, wall-opening semantics, ownership, measured scale or editable catalogue matches. A metric-depth prediction remains evidence to evaluate, not a visitor-confirmed survey. Compare an offline adapter into PR-06's uncertain observation contract against the simpler vision draft on the same held-out room cases. Score correction effort, association mistakes, fit-critical facts, latency/memory and exact checkpoint suitability. Author-reported benchmark results are research leads, not Roomedy performance or a verified global winner.

**Disposition:** preserve an adapter boundary in the draft design; defer actual model download, GPU/runtime service, benchmark execution and deployment. No need for a new generic plugin framework. Select an additional runtime only if a bounded authorized experiment materially improves this product.

### O-02 — Prefer a precise door sector if conservative envelopes cause real failures

Quarter-turn wall geometry makes an analytic hinge-dependent sweep tractable. A tested sector/rectangle intersection could reduce false blockers without a physics engine. The current plan explicitly permits a disclosed conservative rectangular approximation, so this is a quality opportunity rather than evidence that the approved plan is invalid.

**Disposition:** measure false rejection on the independent door corpus. If material, implement the bounded analytic rule within RM-003 or a scoped follow-up before search tuning. Otherwise retain the clearly disclosed approximation. Asking about hinge direction should have a useful modeled/review purpose.

### O-03 — Choose the next measurement from the current decision

Use rule dependencies to choose the one missing measurement that most affects the visitor's current request. A desk below a window may need sill height; a desk elsewhere should not trigger the same question merely because the field is empty. A nearly fitting wardrobe may need its outer depth before decorative details. This refines the already selected one-question-at-a-time correction flow.

**Disposition:** add a small deterministic relevance policy to RM-007/011 using existing issue dependencies. Test that irrelevant unknowns do not block exploration. Do not invent calibrated confidence percentages or add an unbounded measurement questionnaire.

## Full ticket coverage and proposed sequencing

| Ticket | Review disposition |
| --- | --- |
| RM-001 | Keep the committed architecture/toolchain. Carry the refined coordinate/provenance contracts into owning shared modules; future CI identity pinning belongs to PR-12. No dependency churn is justified by this review. |
| RM-002 | Keep licensed assets, independent dimensions and authored fixtures. Clarify representation eligibility versus actual owned size under PR-01; update affected fixtures when contracts change. |
| RM-003 | Complete the unfinished ticket only after PR-01–05 are resolved and independently tested. Retain atomic batches, starting locks, truthful measurement corrections and whole-change Undo. |
| RM-004 | Keep selected identity/progressive entry/light landing. Apply PR-13/14 to actual first-viewport and scripted motion checks. |
| RM-005 | Integrate the refined coordinates, provenance, feature commands and bounded replay behavior through the single controller; retain keyboard/numeric alternatives. |
| RM-006 | Keep synchronized stylized R3F cutaway and 2D fallback. Verify revised pose conversion, real resources, short-view layouts and active frame behavior. |
| RM-007 | Specify PR-06 before intake integration; preserve correction/source/ownership work. O-03 improves the existing guided review. |
| RM-008 | Adopt explicit provider compatibility/data policy and the fake-tested grant/deadline refinements PR-10/11. Paid readiness remains conditional. |
| RM-009 | Apply request-local scope, fixed-work determinism, responsive scheduling and useful goal-quality evidence PR-07/08. |
| RM-010 | Use the explicit observation/entity/frame contract, complete provenance and provider schema projection. Preserve partial useful results and 2D-only review. |
| RM-011 | Enforce request scope and one reviewed proposal; serial tool policy and grounded measurement prompts. Retain Apply/Cancel/shared Undo and accessible chat. |
| RM-012 | Preserve the strong fixed-expiry/baseline/projection/cleanup design. Cover refined semantics and document PR-14's timing limitation; never persist original photos. |
| RM-013 | Make PR-09's rubric/holdout/perturbations executable. Record zero-dispatch invariants and honest unrun live cases. |
| RM-014 | Extend exact image evidence to PR-11's runtime assumptions and PR-12's stale-browser/rollback/action identities. Actual Linux evidence remains distinct from Windows checks. |
| RM-015 | Require PR-13's measurable budgets, feature evidence and PR-14's precise accessibility disposition. The actual owner visual gate stays intact. |
| RM-016 | Keep behavior-preserving quality review after visual approval/waiver. Use concrete earlier findings; add no framework or LOC-driven refactor. |
| RM-017 | Keep the audit-only report and owner finding-selection stop. This plan review does not substitute for an actual candidate/dependency audit. |
| RM-018 | Keep only explicitly selected future security remediation; no permission is inferred from these design recommendations. |
| RM-019 | Refresh exact final proof, including stale-client behavior and all remaining evidence limitations. Preserve separate local/owner/live/hosted claims. |
| RM-020 | Keep conditional external acceptance; explicitly resolve provider/privacy/admission/account exposure and hosted behavior only under later authorization. |

The useful order remains the existing numeric queue. First reconcile the five foundation contracts; then define the uncertain draft and request scope before their dependent integrations. Prepare evaluation expectations early, while RM-013 continues to own the complete evaluator. Carry delivery/performance refinements into their existing packets. No new implementation ticket, framework, paid run, deployment or manual result-gate waiver follows from this review.

## Adoption authority and exact execution boundary

The owner said: “ok i approve the recommendations. update the docs and tickets, then resume RM-003 and continue in order. use fake mode, validate and commit each ticket, and stop at review gates or 0% usage. no paid calls or deployment.” Source: `human:current-chat/2026-10-17/approve-review-and-resume-ordered-build`.

PR-01–PR-15 are adopted into their narrow blueprint/ticket owners; new acceptance remains unchecked. The [allocation](../commit-plans/PLAN-REFINEMENT-2026-10-17.md) and [documentation checks](../validation/PLAN-REFINEMENT-2026-10-17.md) record this adoption. RM-001/002 receipts remain historical; downstream refinements have their own owning execution evidence. The numeric queue and actual owner visual/security stops remain intact.

O-01 retains only the uncertain-draft adapter seam and defers model downloads, GPU/runtime services, benchmark execution and deployment. O-02 measures conservative door-envelope false rejection before any justified bounded precision-sector change. O-03 adopts a small deterministic decision-relevant measurement policy. No new ticket, framework, paid run or release authority is created.

## Review artifact ownership and next action

The original read-only review allocated this report, current-review notices and blueprint progress bookkeeping. The subsequent approved adoption has its own exact 28-path documentation allocation linked above. Existing RM-003 source changes remain separate and require their own execution validation/commit. Original drafts, the generic guide and the HTML illustration are preserved.

The owner has supplied steering and approved adoption. The documentation update aligns narrow owning blueprint sections, packet plans/unchecked criteria and file allocation before the primary agent resumes the authorized RM-003 execute/validate loop. The current fake-only/no-paid/no-deployment boundaries and later visual/security review gates remain in force. No reset credit was consumed; the latest usage snapshot during review reported 10% remaining.

Verification of this review checked 174 local file links across the five allocated documents, all fifteen proposal IDs, three research opportunities and twenty coverage rows, one canonical progress block, and the preserved hashes of the original guide and both archived drafts. The first link-check attempt failed to decode an existing percent-encoded path; correcting the checker resolved it without changing that source link. Scoped tracked-document whitespace checks passed. A separate read-only review found no remaining substantive report issue after the historical instruction wording was preserved. No application-wide test/build or visual acceptance is claimed; the four narrow observations above are the only new runtime probes.
