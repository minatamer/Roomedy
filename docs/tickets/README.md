# Roomedy ticket plan

Planning date: **17 October 2026**  
Plan status: **Approved by owner on 17 October 2026; ordered fake-mode execution authorized**  
Authority: [Roomedy blueprint](../ROOMEDY.md), especially [selected decisions](../ROOMEDY.md#26-decision-register)  
Current instruction: execute and validate tickets in numeric order, stage/commit each completed ticket, use fake mode and stop at required review gates or 0% remaining Codex usage. No paid calls, deployment or push. RM-001 is implemented locally with hosted CI unverified, and RM-002 is complete locally; see RM-001’s [allocation](../commit-plans/RM-001.md) and [evidence](../validation/RM-001.md).

**Latest approved steering:** the owner approved the [full review refinements](../reviews/2026-10-17-plan-review.md), requested documentation/ticket adoption, then resumption of unfinished RM-003 and the numeric fake-mode loop. PR-01–PR-15 and the stated O-01–O-03 dispositions now govern their existing owners. Added acceptance remains unchecked; RM-001/002 historical completion evidence is not retroactive proof. Stop at review gates or 0% usage; no paid calls or deployment.

Owner-requested revision: incorporate lessons from the four referenced visual/manual-test chats before proceeding. Read [repository instructions](../../AGENTS.md), [feedback guidelines and their evidence](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) and the [feature/review checklist](../design/REVIEW_CHECKLIST.md). These are requirements for the existing packets, not additional product features or authorization to implement.

**Current 19 October steering:** RM-015A–V below are the owner-authorized next queue before the joint RM-015 visual decision. The original twenty packets remain; these lettered follow-ups expand RM-015 without starting RM-016.

## Why twenty original packets

Roomedy needs one coherent room authority across photo review, precision editing, 3D rendering, geometry, assistant proposals and recovery. These packets deliver complete capabilities rather than separate tickets for buttons, endpoints, materials or individual tests. The queue covers the whole selected demo, local release preparation and later conditional hosted acceptance. The original plan created no application code. RM-001 and RM-002 now have verified local evidence; RM-003 is complete locally, and RM-004 is committed, RM-005 is committed (`85c7362`), RM-006 is committed (`f73ce2e`), RM-007 is committed (`d1d8c30`), RM-008 is committed (`3e6d4c1`), RM-009 is committed (`bfd9e6d`); RM-010 is committed (`526a6b3`); RM-011 is committed (`7580870`); RM-012 is committed (`b53dc8a`); RM-013 is committed (`f5149b2`); RM-014 is committed (`2e27f79`). RM-015 nine-size/interaction/performance work and346-test/root/build gate passed; read-only pass1 is clean and actual owner visual review is the current stop. The owner separately authorized an exact15-file checkpoint commit while explicitly withholding visual approval; that Git action does not complete RM-015 or resolve the gate. Physical/native-heap/production-frame/Linux/hosted/live evidence stays pending. RM-016 and later remain Planned.

`RM-###` is the approved Roomedy planning convention. The owner explicitly selected **RM-000** for step-six documentation/ticket commits; see the [scoped allocation](../commit-plans/RM-000.md). RM-000 is not an implementation ticket. RM-001/RM-002 have existing local implementation commits. Suggested subjects for later packets remain future authorized work; a subject is never proof of completed acceptance.

## Dependency-ordered queue

Every dependency below means its **required local outcome has actual verified evidence**. Paid/hosted/device/owner evidence is tracked separately and never inferred from fake tests. The owner has approved this plan and its later review refinements, and authorizes ordered local execution in fake mode with per-ticket local commits after validation.

| ID | Complete outcome | Direct dependencies | Milestone / additional gate |
| --- | --- | --- | --- |
| [RM-001](RM-001-initialize-workspace-contracts-and-safe-runtime.md) | Runnable workspace, contracts, finite policy and safe fake runtime | None | Foundation |
| [RM-002](RM-002-prepare-catalogue-assets-and-room-fixtures.md) | Dimensioned furniture catalogue, prepared licensed representations and three room-condition fixtures | RM-001 | Foundation |
| [RM-003](RM-003-build-spatial-checks-commands-and-undo.md) | Pure spatial checks, atomic commands, locks, provenance and Undo | RM-001, RM-002 | Foundation |
| [RM-004](RM-004-build-brand-landing-and-guest-entry.md) | Responsive identity, scripted landing story and progressive guest entry | RM-001, RM-002 | Product entry |
| [RM-005](RM-005-deliver-canonical-session-and-precision-2d-editor.md) | One session controller and a useful manual precision editor | RM-003, RM-004 | Editable room |
| [RM-006](RM-006-deliver-synchronized-3d-cutaway.md) | Polished main-editor cutaway using the same room and selection | RM-005 | Editable room |
| [RM-007](RM-007-build-photo-intake-and-rough-2d-review.md) | Safe photo/manual intake, rough 2D correction and measurement review | RM-005 | Reviewed room |
| [RM-008](RM-008-build-shared-admission-and-bounded-provider-transport.md) | Shared admission, replay/capacity controls and private bounded provider transport | RM-003, RM-007 | Safe AI infrastructure |
| [RM-009](RM-009-build-bounded-layout-search-and-explanations.md) | Cancellable deterministic arrangement search and computed trade-offs | RM-003, RM-005 | Spatial assistance |
| [RM-010](RM-010-deliver-photo-recognition-and-draft-reconciliation.md) | End-to-end correctable photo recognition with honest manual fallback | RM-007, RM-008 | Photo-to-room |
| [RM-011](RM-011-deliver-grounded-assistant-and-reviewed-edits.md) | Useful assistant, typed tools, one proposal, Apply/Cancel and shared Undo | RM-006, RM-008, RM-009, RM-010 | Assistant |
| [RM-012](RM-012-complete-comparison-recovery-and-project-lifecycle.md) | Before/Current, fixed two-hour recovery, export/import and complete cleanup | RM-011 | Complete guest lifecycle |
| [RM-013](RM-013-evaluate-ai-and-integrated-product-behavior.md) | Integrated corpus, adversarial checks and a bounded live-evaluation kit | RM-010, RM-011, RM-012 | Local evidence; live calls separately authorized |
| [RM-014](RM-014-prepare-linux-images-and-release-runbooks.md) | Reproducible Linux images, exact-input proof and local rollout/rollback files | RM-012, RM-013 | Local release preparation |
| [RM-015](RM-015-verify-responsive-accessible-and-performant-experience.md) | Product/device matrix, measured bounds/performance and owner visual review | RM-014 | **Actual frontend visual decision** |
| [RM-015A](RM-015A-establish-motion-first-interactions.md) | Establish motion-first interactions | RM-015 local checkpoint | Implemented locally; visual approval pending |
| [RM-015B](RM-015B-animate-the-landing-room.md) | Animate the landing room | RM-015A | Implemented locally; visual approval pending |
| [RM-015C](RM-015C-add-smooth-interior-camera-exploration.md) | Add smooth interior camera exploration | RM-015B | Implemented locally; visual approval pending |
| [RM-015D](RM-015D-polish-close-up-room-materials.md) | Polish close-up room materials | RM-015C | Implemented locally; visual approval pending |
| [RM-015E](RM-015E-edit-furniture-directly-in-3d.md) | Edit furniture directly in 3D | RM-015D | Implemented locally; visual approval pending |
| [RM-015F](RM-015F-deliver-conversational-design-assistance.md) | Deliver conversational design assistance | RM-015E | Implemented locally; visual approval pending |
| [RM-015G](RM-015G-complete-sample-assistant-parity.md) | Complete sample assistant parity | RM-015F | Implemented locally; visual approval pending |
| [RM-015H](RM-015H-remove-demo-commentary-from-product-copy.md) | Remove demo commentary from product copy | RM-015G | Implemented locally; visual approval pending |
| [RM-015I](RM-015I-make-active-motion-a-permanent-rule.md) | Make active motion a permanent rule | RM-015H | Implemented locally; visual approval pending |
| [RM-015J](RM-015J-verify-the-revised-interactive-experience.md) | Verify the revised interactive experience | RM-015I | Implemented locally; visual approval pending |
| [RM-015K](RM-015K-review-and-rebalance-page-layouts.md) | Review and rebalance useful space across all pages | RM-015J | Implemented locally; actual visual approval pending |
| [RM-015L](RM-015L-create-a-scroll-driven-furniture-landing.md) | Scroll-driven assembling/rotating/opening furniture landing, richer workflow/value, footer/icons | RM-015K | Implemented locally;404tests/root/both builds/current production checks; actual result approval pending |
| [RM-015M](RM-015M-integrate-landing-content-into-the-room.md) | Full-landing room, purposeful furniture travel, integrated copy/soft shading and prepared entrance | RM-015L | Implemented locally;412tests/root/both builds; actual result approval pending |
| [RM-015N](RM-015N-refine-landing-glass-and-scroll-navigation.md) | Glass/depth, consistent first reveal, clean smooth section navigation/underline and refined scroll cue | RM-015M | Implemented locally;414tests/root/both builds; actual approval pending |
| [RM-015O](RM-015O-create-a-warm-photographic-landing-background.md) | Warm local interior photography/material atmosphere behind the animated room | RM-015N | Implemented/locally verified; actual visual approval pending |
| [RM-015P](RM-015P-restore-smooth-landing-scrolling.md) | Performance-first photographic/scroll correction, centered cue and faster readiness fade | RM-015O | Implemented/locally verified; actual smoothness/visual feedback pending |
| [RM-015R](RM-015R-fill-demo-flow-with-useful-adaptive-content.md) | Adaptive useful demo space and shared static warm photographic background without landing house | RM-015P | Current owner correction; locally implemented, actual visual approval pending |
| [RM-015S](RM-015S-stabilize-and-simplify-room-editing.md) | Stable/direct furniture editing, simpler themed inspector/chrome/Project | RM-015R | Implemented/locally verified; read-only pass1 clean, actual visual approval pending |
| [RM-015T](RM-015T-separate-photo-and-manual-room-entry.md) | Separate photo and manual room entry | RM-015S | Code implemented/root validated; final browser checks and visual approval pending |
| [RM-015U](RM-015U-drag-windows-along-their-walls.md) | Drag windows along their walls | RM-015T | Code implemented/root verified; actual browser/visual checks pending |
| [RM-015V](RM-015V-frame-the-corner-opposite-the-doorway.md) | Frame the corner opposite the doorway | RM-015U | Direct owner correction; Planned, visual approval pending |
| [RM-015Q](RM-015Q-add-restrained-warm-room-lighting.md) | Restrained warm dynamic interior light and shadows | RM-015V | Planned; held behind current owner corrections and actual feedback |
| [RM-016](RM-016-audit-and-improve-code-quality.md) | Documented and executed functionality-preserving quality pass | RM-015 | Requires visual approval or explicit waiver/defer |
| [RM-017](RM-017-audit-security-and-present-findings.md) | Read-only security/dependency audit with detailed Markdown and PM HTML | RM-016 | **Owner selects findings before remediation** |
| [RM-018](RM-018-remediate-owner-selected-security-findings.md) | Only the selected security fixes, verified against the reviewed findings | RM-017 | Conditional on explicit finding selection |
| [RM-019](RM-019-finalize-local-release-evidence-and-handoff.md) | Current local candidate, refreshed release proof, evidence ledger and honest handoff | RM-014, RM-015, RM-016, RM-017, RM-018* | *RM-018 may be explicitly waived/deferred by security decision |
| [RM-020](RM-020-verify-authorized-hosting-and-pre-sharing.md) | Separately authorized hosted/provider/domain and pre-sharing acceptance | RM-019 | Conditional external execution; no cloud authority from this plan |

The normal execution path is numeric order. Dependencies permit local sequencing flexibility, not parallel-agent authorization. RM-006 and RM-007 share controller/render interfaces; RM-008 and RM-009 share pure validation inputs. Finish one packet and validate its settled diff before taking the next. Do not create duplicate scene stores or command engines to bypass an incomplete dependency.

## Owner-requested pre-review queue — 19 October 2026

The owner directly authorized all ten todos to be thoroughly planned and executed before the joint visual session. RM-015A–J above are now the next ordered work; RM-016–020 stay later. The request explicitly authorizes plan → execute → validate → verify/fix → revalidate → next without per-ticket owner pauses. Visual acceptance is still pending after J, and original local per-ticket exact-path commit authority remains in force. No paid/live calls, deployment, push, reset credits or delegation.

Current local result: A–J committed through e01a0ca; K's [all-page space evidence](../validation/RM-015K.md) records the final173-input candidate,401tests/both builds, responsive/functional checks and clean revalidation after the expanded-chat fix. All ten original local todos and the additional space correction are delivered; actual joint visual decision remains pending and RM-016 stays Planned. [Open current review](../design/visual-review.md).

Coverage: todo1 motion=A; todo2 hero=B; todo3 interior cameras=C; todo4 close-up quality=D; todo5 3D editing=E; todo6 designer assistance=F; todo7 sample/fake parity=G; todo8 concise copy=H; todo9 permanent motion rules=I; todo10 integrated evidence/documentation=J. Plan acceptance is the user's express instruction to plan and then execute these specific todos, not an inferred approval of generated scope or actual results.

## Workflow checkpoints and eligibility

| Build phase | Owning work | Required stop |
| --- | --- | --- |
| 05-tickets | This index and RM-001–RM-020 | Owner approved the updated plan/guidelines |
| 06-plan-commit | Authorized RM-000 documentation commits | Scoped permission supplied; exact paths/checks in the RM-000 plan |
| 07-build | RM-001–RM-014 local outcomes | Authorized fake-mode execute → read-only validate → confirm/fix → revalidate → local commit |
| 08-performance | RM-015 measurement and scoped fixes | Record evidence and update the actual owning modules; no duplicated performance pass |
| 09-visual-review | RM-015 presentation of actual frontend | Owner approves as-is, requests a specific revision, or explicitly waives/defers |
| 10a-quality | RM-016 | Preserve reviewed behavior and private diagnostics |
| 10b-security-review | RM-017 | Present findings and stop; leave audit artifacts unstaged/uncommitted for review |
| 11-security-fixes | RM-018 | Only explicitly selected findings; an explicit no-fixes/defer decision can skip execution |
| 12-handoff | RM-019 | Local completion remains distinct from external acceptance |
| Later authorized release | RM-020 | Exact paid/cloud/publication/domain scope must be supplied separately |

The [build skill](../../../../.agents/skills/build/SKILL.md) requires ticket-plan, visual and security result checkpoints. The owner's latest instruction authorizes ordered fake-mode implementation and local commits after each validated ticket, superseding the earlier hold. Stop at required result gates or reported 0% remaining Codex usage. Do not consume reset credits or continue through paid credits beyond that cutoff. No push, deployment, purchased asset/domain, paid request or scanner metadata export is authorized here.

RM-015–RM-019 are part of the planned delivery, but the build loop must stop at their named checkpoints. RM-020 is an external acceptance packet, not a reason to leave local Dockerfiles, probes or runbooks unwritten. An unavailable funded provider can leave live evidence pending while verified local work continues. A broken local feature, failed mandatory test or missing required local artifact is not an external blocker.

## Shared execution and evidence contract

Each ticket is executable context, not proof it has run. Before edits, read its entire packet, linked blueprint sections and actual dependency evidence. Inspect the current files and allocate exact owned paths in a file-level plan; the paths in tickets are proposed ownership, not files claimed to exist. Create specific modules when needed rather than scaffolding empty folders.

Use the current `execute` and `validate` workflows when implementation is authorized. Complete the outcome, run meaningful focused checks and applicable established root gates, then review the settled full diff read-only. Independently reproduce actionable findings before changing code, fix and revalidate. Preserve unperformed checks as unchecked. Record commands, dates, mode, corpus, candidate/input identity, actual results and limitations in `docs/validation/RM-###.md` when checks occur. Use `docs/commit-plans/RM-###.md` for future exact file allocation when appropriate; no commit plans claim authorization by themselves.

| Status | Meaning |
| --- | --- |
| Planned | Unimplemented; dependency graph is a plan |
| In progress | Authorized local execution has begun |
| Implemented locally — external evidence pending | Required local outcome and settled validation passed; named live/physical/hosted checks remain unchecked |
| Awaiting owner | Concrete artifact is ready for the ticket's explicit manual decision |
| Complete | All required evidence in the stated scope exists; exact limitations remain recorded |
| Deferred / superseded | Explicit decision and destination recorded; never used to hide a required local failure |

Unchecked and newly added checks are **future verification requirements**; existing checked results retain their dated scope. Planning link/graph checks do not establish application functionality. Development fixtures and injected provider tests are labelled fake, paid-off and network-denied before module imports. An ordinary check never reads ignored runtime environment files, inherits live spending flags or calls running apps/providers. Actual calls are counted, including refusals/failures; bootstrap, selection, drag, comparison, Apply, Undo, refresh and export must cost zero provider dispatches.

## Scope invariants carried into every packet

- Photos become a **rough 2D review sketch**, with correction and explicit measurements. No 3D preview or switch exists in initial review. Only the main editor offers synchronized precision 2D and stylized 3D.
- One rectangular bedroom/workspace, three starting conditions, supported bed/desk/chair/wardrobe/storage, similar models at reviewed dimensions. No exact mesh reconstruction, professional certification, scans, AR, multi-room or floor-plan/PDF intake.
- One canonical current room, immutable starting baseline, shared pure spatial commands, starting-state locks, atomic final-batch checks, idempotent Apply and whole-change Undo. One scene proposal at a time; Redo and multiple alternatives are deferred.
- Unknown/estimated/extracted/scan-derived/confirmed provenance is value-specific. Imported or model-supplied labels do not grant authority. Preserve disclosed baseline conflicts; no new hard blockers, invented confirmations or unsupported fit claims.
- Fixed **two-hour** semantic recovery from workspace creation; edits and refresh do not extend it. Raw photos are active-page memory only. Export/import contains bounded current and baseline semantics, never photos/chat/history/tokens/operations.
- Oat, sand, beige, walnut, cocoa and earthy wood website tones; neutral black/white studio chrome is permitted. Tactile stylized objects and deliberate motion remain selected. No animation-off/render-off controls or OS-based motion suppression. Actual visual acceptance happens later.
- No furniture prices, currencies/totals, visitor budgets, affordability tools, retail sourcing, shopping or checkout. Internal token/byte/time/concurrency/provider-spend controls remain mandatory.

## Guideline ownership

Every packet now names applicable lesson IDs and concrete prevention requirements. Check affected visuals/states while building the owning feature; RM-015 consolidates evidence and the actual owner checkpoint rather than discovering every UI defect for the first time. All new acceptance items remain unchecked.

| Feedback lesson | Primary owners | Observable prevention |
| --- | --- | --- |
| L-01/L-02: useful scope, consistent but bounded corrections | RM-004, RM-005, RM-007, RM-011, RM-019 | No filler/dev controls; correction covers all owning states without overwriting unrelated finishes/features |
| L-03–L-05: task-first space, stable identity and representative previews | RM-002, RM-004–RM-006, RM-015 | Useful room area on short laptops, stable fonts/marks and faithful semantic previews |
| L-06/L-07: reachable actions, clear fields and coordinated surfaces | RM-005, RM-007, RM-011, RM-012 | Named errors/units; consistent action row; no scrollbar overlap or panel geometry drift |
| L-08/L-09: purposeful smooth motion and optional tour readiness | RM-004–RM-006, RM-011, RM-015 | Real active motion/spinners; no arbitrary entrance delay; target/card reveal together |
| L-10/L-11: usable friendly chat and canonical object cards | RM-011 | Accessible Send/Enter/IME behavior, reachable composer and exact object/issue focus |
| L-12–L-14: explicit processing, correction-friendly inference and meaningful evidence | RM-002, RM-007, RM-008, RM-010, RM-013 | Personal upload boundary tested; partial output retained; truthful fixtures and safe private decision diagnostics |
| L-15/L-16: real state, reset and runtime truth | RM-003, RM-005, RM-010, RM-012, RM-016 | Controls change shared data; no resurrected state or persisted live authorization |
| L-17: feature-owned visual checks and cumulative review | RM-004–RM-007, RM-011, RM-013, RM-015 | Loading/error/restored/narrow states checked before final polish; actual evidence distinguished from simulation |
| L-18/L-19: efficient iteration and proportionate tests | RM-001, RM-008, RM-013–RM-016 | Hot reload/scoped restart; focused meaningful checks; required gates at settled ticket/batch, no inherited waiver |
| L-20: deterministic tests versus actual release freshness | RM-001, RM-012, RM-014, RM-016, RM-019 | Controlled matching/stale fixtures; actual exact-byte Linux proof still fails closed |
| L-21–L-23: demo-sized quality and real security boundaries | RM-001, RM-003, RM-008, RM-016–RM-018 | Preserve functionality/logs; bounded stream overhead and quiet verification; evidence-based reviewed remedies |
| L-24: exact evidence and external action clarity | RM-013–RM-020 | No reused stale manual/visual pass; public/private/paid/domain/proxy and authorization are separate |

The guideline source register distinguishes direct human feedback, Roomedy adaptations and historical agent/audit claims. Retailor's colour/video/logo/checkout decisions and its waived audit-review permission do not change Roomedy scope or review gates. No new ticket or dependency is needed for these refinements.

## Coverage map

| Blueprint requirement / decision | Primary packet(s) | Later proof |
| --- | --- | --- |
| §§1–3, 14–16, 22; D-11: architecture, public contracts, fixed bridge, safe startup | RM-001 | RM-014, RM-016, RM-017 |
| §§4–5; P-08: landing demonstration and progressive sample/photo entry | RM-004, RM-005 | RM-013, RM-015 |
| §§5–6; P-01/P-07, Q-06: rough 2D sketch, deduplication, guided measurements/source photo and editor transition | RM-007, RM-010 | RM-013, RM-015 |
| §§6–10; P-02, D-06/D-12: ownership, independent locks, provenance, baseline issues | RM-002, RM-003, RM-005 | RM-009, RM-013 |
| §§7–8, 13; D-02/D-07: precision plan, synchronized cutaway and licensed dimensioned assets | RM-002, RM-005, RM-006 | RM-014, RM-015 |
| §§9–12; P-03–P-05: goals, finish presets, bounded search, helpful tools and explanatory proposals | RM-009, RM-011 | RM-013, RM-015 |
| §§9.4–9.6, 17; P-06, Q-05/Q-08, D-05/D-09/D-13: generations, replay, Undo, baseline, recovery and export/import | RM-003, RM-005, RM-012 | RM-013, RM-015, RM-017 |
| §§16, 18, 21; D-04/D-08: bounded real provider adapters, admission and private failures | RM-001, RM-008, RM-010, RM-011 | RM-013, RM-017, RM-020 |
| §§5, 13, 19; Q-01/Q-02/Q-03/Q-04/Q-09: chosen room scope, style, similar models, 2D precision and generic assistant identity | RM-002, RM-004, RM-005, RM-006, RM-011 | RM-015 owner review |
| §§2.3, 16.2, 26; Q-07/D-10: prices and budget planning excluded | RM-001, RM-002, RM-004, RM-011 | RM-013, RM-016 |
| §§20–24: failure recovery, test isolation, measured performance, packaging and release | RM-008, RM-012–RM-020 | Named local/owner/external evidence, separately classified |
| §26 D-03/D-14: deferred inputs and external actions | Queue-wide scope rules; RM-019, RM-020 | No inferred account/domain/spend authority |

## Approved review adoption and evidence ownership

The [review](../reviews/2026-10-17-plan-review.md) is adopted through the [exact allocation](../commit-plans/PLAN-REFINEMENT-2026-10-17.md) and [documentation checks](../validation/PLAN-REFINEMENT-2026-10-17.md). It adds 52 unchecked criteria to existing packets, without new tickets or dependency edges. RM-001/002 preserve their dated completion evidence; their new downstream checklists name RM-003/RM-014 and later consumers explicitly rather than reopening or asserting historical verification.

| Refinement | Existing execution owner and proof |
| --- | --- |
| PR-01–05: physical truth, fact evidence, centre lattice, feature commands, usable replay | RM-003 before sign-off; later RM-005/006/007/010/012 consumers refresh affected evidence |
| PR-06 and O-03: uncertain observations/entities/frame/scale and relevant questions | RM-007/010/011; independent corpus skeleton prepared early and complete evaluation in RM-013 |
| PR-07–08: request-local mutation scope and useful reproducible responsive search | RM-009/011; authority/scope rechecked on Apply and measured in RM-013/015 |
| PR-09–11: readiness rubric, provider schema/data policy, resilient grants/deadlines | RM-008/010/011/013; fake local proof distinct from conditional paid/account/privacy acceptance |
| PR-12–15: open-client release, meaningful visual/performance budgets, precise accessibility/privacy/current documentation | RM-004/005 per feature, RM-012/014/015/019 and conditional RM-020; actual visual/security gates unchanged |
| O-01: modern geometry comparison seam | Keep the uncertain-draft adapter boundary only; downloads, GPU/runtime services, benchmark execution and deployment remain deferred |
| O-02: precision door sector | Measure conservative-envelope false rejection in RM-003; precision work only if justified by independent cases |

Approval selects these requirements and dispositions, not successful tests, a global SOTA model, actual frontend visual acceptance or future security finding remediation. Later quality/audit/fix packets preserve them under their existing gates.

## Reference ticket structures actually inspected

Read-only working-tree inspection on 17 October 2026 used these real files. Sibling Git metadata was unavailable, so no clean commit or current release status is asserted. Their historical checked boxes, test counts, ports, domain entities and owner approvals do not transfer.

| Reference file | Pattern adopted for Roomedy |
| --- | --- |
| [Retrosum ticket index](../../../Retrosum/docs/tickets/README.md) and [RET-001](../../../Retrosum/docs/tickets/RET-001-initialize-workspace-and-contracts.md) | Complete vertical packets; dependency table; standalone context; affected paths; focused evidence; local versus external status |
| [Retailor RTL-001](../../../Retailor/docs/tickets/RTL-001-initialize-workspace-contracts-and-safe-runtime.md) and [RTL-014](../../../Retailor/docs/tickets/RTL-014-deliver-tailor-inline-photo-crud-and-confirmation.md) | Concrete implementation steps; exact shared command ownership; acceptance/check tables; review, confirmation and lifecycle boundaries |
| [ClipBuilder CL-014](../../../ClipBuilder/docs/tickets/CL-014-audit-release-candidate.md) and [ticket index](../../../ClipBuilder/docs/tickets/README.md) | Current-versus-historical evidence; bounded fake checks; exact release inputs; conditional release proof without fabricated external acceptance |
| [ScreenPilot SP-025A](../../../screen-pilot/docs/tickets/SP-025A-audit-release-candidate-code-and-ticket-completion.md) | Reconcile every ticket against actual code and evidence; behavior-preserving quality work; explicit boundary and test-isolation checks |

Roomedy separates the late quality execution, security audit and selected security fixes because its current build workflow requires an owner review of security findings before remediation. No existing sibling finding has been copied into a Roomedy security ticket.

## Review handoff

The owner approved the updated plan and guidelines and requested step-six RM-000 documentation/ticket commits. This approval covers the reviewed packet count/scope, sequencing and guidelines; exact numerical engineering policy, asset preparation and model selection remain future evidence-bearing implementation work. Follow the scoped RM-000 allocation and verification receipt. The subsequent step-seven request authorizes ordered local implementation/commits in fake mode. Paid/provider testing and hosted changes remain unauthorized.

Execution evidence: [RM-001](../validation/RM-001.md) (local foundation, hosted CI unverified), [RM-002](../validation/RM-002.md) (catalogue/assets/fixtures complete). RM-003 is committed; RM-004 local validation follows.

RM-003 local completion: [actual checks](../validation/RM-003.md) and [supported rules](../engineering/spatial-rules.md). RM-003 was committed as `bc349f5`. RM-004 has [local browser and gate evidence](../validation/RM-004.md); its scoped commit is next, followed by RM-005.

RM-005 local completion: [112 tests, final gates, actual interaction/device-size evidence and limits](../validation/RM-005.md), plus the [canonical session/plan contract](../engineering/session-and-plan.md). Its exact scoped commit is next, then RM-006. RM-004 was committed as `bd0bf78debd743b212ae5a1cf2308e2690c9f46e`.


19October additional owner correction: [RM-015K](RM-015K-review-and-rebalance-page-layouts.md) follows committed J/e01a0ca and precedes RM-016. Broad layout review/fixes/documentation use the same authorized execute/read-only validate/verify/fix/revalidate/exact local commit loop. [Current K evidence](../validation/RM-015K.md) supersedes J only for the changed candidate; actual joint visual approval remains pending.


Latest landing feedback: [RM-015L](RM-015L-create-a-scroll-driven-furniture-landing.md) follows committed K/9c76653. Owner selected the assembling/rotating/opening scroll room; palette/mark/dot retained, old marketing control card replaced, richer workflow/motivation and beige icon/centered footer. [Research](../references/landing-research-2026-10-19.md) and [actual L evidence](../validation/RM-015L.md) govern this visual correction; no RM-016 or inferred result approval.
