# Lessons from the owner's visual feedback

Prepared **17 October 2026** for Roomedy, before implementation.  
Authority: [current blueprint](../ROOMEDY.md), the owner's current request and [repository instructions](../../AGENTS.md).  
Use with: [ticket queue](../tickets/README.md) and [feature/review checklist](../design/REVIEW_CHECKLIST.md).

## Purpose and evidence limits

The owner asked to learn from four referenced Retailor chats because repeated visual corrections, unwanted additions and inefficient implementation should be prevented from the beginning. These are concrete build guidelines, not a new feature list or a claim that Roomedy has passed visual testing. They refine the existing twenty planned tickets; implementation remains on hold.

`read_thread` was called for all four tasks, their identities were read and feedback histories were paginated. Some very large turns exceeded the tool's size limit even at one turn. The missing human messages for **Run final manual test locally** and **Run app and review visuals** were read from the local history files for those exact referenced task IDs. Only relevant user-visible feedback/outcomes inform this document; injected repository/skill text and model reasoning are not owner feedback. Screenshot attachments were not visually re-inspected, so a bare “remove this” is not used to invent a specific visual diagnosis. Historical agent claims and audit reports are attributed evidence, not reproduced Roomedy results.

| Source | Referenced chat | Feedback period / contribution |
| --- | --- | --- |
| T1 | [Run final manual test locally](thread://01a148cf-f24c-72d1-b0ba-9149694f0287?hostId=local) | 17 October: short useful copy, reachable actions, hot reload, real recognition misses, private decision logs and explicit public/private release choices |
| T2 | [Run app and review visuals](thread://01a143b0-2c61-7200-a67e-01063bad74b8?hostId=local) | 16 October: composer/layout defects, concise labels, sample plus upload tests, quiet verification, functionality-preserving and demo-sized audits |
| T3 | [Visual feedback v2](thread://01a13e80-4505-7162-9b36-da7e24e6df08?hostId=local) | 15–16 October: upload versus processing, panel geometry, tours, touch affordances, validation, consistency and brittle historical-proof tests |
| T4 | [Visual feedback](thread://01a13966-5351-7773-a0cc-0786942d172d?hostId=local) | 14–15 October: unwanted copy, palette scope, stable typography, representative previews, reset races and recurring responsive corrections |

All sources concern another repository. Its navy/lime palette, commerce, checkout, generated logos, marketing video, database/storage exceptions, runtime flags, funded limits, manual pass and Git/security/cloud permissions do **not** transfer. Roomedy keeps its selected palette, similar furniture models, optional short tour, semantic export/import, authored manual sample and rough-2D-before-main-editor-3D flow. Routine implementation choices within that scope do not require new approval; a material new product feature does.

## Visual and interaction guidelines

### L-01. Give every addition a useful task

Before introducing text, a badge, chip, status row, setting, CTA, panel or section, name its visitor task and existing requirement. If it duplicates another control, explains implementation or merely fills space, omit it. Plain labels such as **Edit**, **Description**, **Draft my room** and **Apply** are preferable to unexplained internal vocabulary. Do not replace removed filler with a new filler sentence in another state.

Keep essential transfer disclosure, approximation status, limits at input, actionable errors and irreversible-action confirmation. Clean presentation is compatible with truthful behavior. A different repo's request to remove Export JSON does not remove Roomedy's explicitly selected project export. Evidence: E01, E07, E13.

### L-02. Respect the scope of a correction

Read the latest correction and its surface before applying it globally. Fix all variants of the same owning component/state, including refresh and errors, while preserving intentional differences elsewhere. A platform palette change must not overwrite selected room finishes. A browser icon can need different contrast from the website wordmark. Keep superseded choices in history, not competing active instructions.

Do not add a new full-screen hero video, auto-start tour, logo generator or dashboard because it was requested for Retailor. Do not ask the owner to approve every small style adjustment already inside the selected direction. Evidence: E02, E03, E27.

### L-03. Give space to the primary task

Compose for short/small laptops as carefully as phones and wide desktops. The room, selected object and next action should remain useful when the inspector/chat is open. Avoid fixed-height boxes that create dead columns, giant controls that crowd the content and unnecessary nested scrolling. Full-page backgrounds must actually cover the page; consistent spacing must survive variable labels and content lengths.

Remove accidental empty wells and redundant chrome while retaining intentional breathing room. “No dead space” is not permission to pack every gap or introduce masonry to a room editor. Use appropriate responsive layouts for the actual content. Evidence: E04, E05, E16.

### L-04. Keep identity and typography stable

Use Roomedy's palette/type/spacing tokens consistently. The selected mark/wordmark and browser icons need appropriate contrast and stable dimensions. Font loading, refresh, restored state or route changes must not swap lettering, wrap labels unexpectedly or move the primary CTA. Bundle/prepare actual licensed assets and use predictable font fallbacks/load behavior.

Room finishes are scene data and remain independent of application chrome. Inspect the actual output across surfaces; declaring shared tokens alone is not evidence of visual consistency. Evidence: E02, E03.

### L-05. Make previews representative and connected

Show what the feature actually changes. Initial intake is a rough 2D sketch; precision 2D and stylized 3D have distinct purposes in the main editor. They share IDs, sizes, pose and selection. A clipped miniature or decorative image that suggests unsupported capabilities is misleading even if attractive.

Historical RM-004 used a lightweight labelled scripted example; the latest19October owner correction RM-015L explicitly replaces that marketing card with authored scroll-driven furniture3D. Use real supported catalogue representations and coherent authored geometry. Do not portray live reconstruction, professional fit certification or multiple alternative layouts. Evidence: E06; the current Roomedy review-sequence decision remains controlling.

### L-06. Make forms and actions easy to find

Keep primary proceed/save/apply actions in a consistent trailing/right-aligned action group on wider layouts, with a deliberate narrow-layout adaptation. Long review panels need reachable actions near the active task, using a stable action row/sticky region where appropriate; the visitor should not hunt at the bottom. Keep labels, fields and related photos together with comfortable border padding.

Errors name the missing/invalid field, show units/allowed values where needed and offer a focus target. Keep file-format/size guidance inside the upload area. Unknown technical failures use safe application copy, while useful field validation stays specific. Evidence: E07, E08, E13.

### L-07. Coordinate panels, dialogs and the room

Opening/collapsing a panel should animate the actual layout and keep preview, progress and selection aligned. Do not repeatedly shrink the room into an unusable strip. If expanded chat is part of the implemented design, overlay the extra area and preserve the underlying room geometry, then restore focus/size coherently. This lesson does not itself require adding an expansion feature.

Use dialogs for focused blocking tasks and contextual panels for work that needs the room alongside it. Escape/outside-click behavior should match the surface, with unsaved-work protection where needed. No invisible backdrop, trapped scroll, overlapping scrollbar/button or duplicate footer should obstruct the task. Evidence: E04, E05, E09.

### L-08. Motion must run smoothly and at the right time

Latest direct Roomedy owner instruction,19 October2026, makes animation the highest UX priority permanently. This applies to camera travel/orbit/zoom, visible rotation/floor placement, furniture and floor/wall finishes, preview/Apply/Undo/Before, panels, dimensional hero/scroll and loading. Keep demand rendering awake for active targets, then permit idle sleep. Do not add animation/render-off settings or OS suppression. [Current motion ownership](../design/motion.md) and [I evidence](../validation/RM-015I.md) govern implementation; earlier sibling guidance is context only. H's concise task-oriented copy/sample labels and no recurring demo/development warnings also remain permanent. Actual visual acceptance is separate.

Use deliberate entrance, selection, preview/Apply/Undo and panel motion. Ordinary hero content/CTA can enter as soon as usable content is ready; do not add arbitrary buffers. Animate related geometry together, support interruption/reversal and avoid replaying welcome animations on unrelated state changes.

A loading spinner must continue while decoding, searching or waiting. Move bounded expensive work off the interaction path where appropriate. Show an honest short stage such as **Drafting your room…**; omit invented percentages and explanatory filler about why no percentage exists. Preserve designed motion without animation-off/render-off controls or OS suppression. Evidence: E10, E11, E13.

### L-09. Keep the optional tour coherent

Roomedy's short tour remains optional and skippable. If shown, wait for real layout/scroll readiness, offer a clear Start/Skip entry, and reveal target highlight and card together. Re-measure after panel/viewport changes; do not draw a rectangle before scrolling reaches its target. Move focus safely and support Back/Skip/Escape/replay where implemented.

Explain real tasks, not a tour of every button. A same-target step can update seamlessly; a moved target needs a coherent transition. Do not import Retailor's auto-start policy or exact delay as a new Roomedy requirement. Evidence: E12.

### L-10. Make chat usable before making it decorative

Provide a visible labelled Send action, Enter to send, Shift+Enter for a newline and no accidental send during IME composition. Keep the composer reachable while messages scroll. Reserve space for its icon, scrollbar and touch target so they cannot overlap. Preserve draft text/focus on validation or recoverable failure.

Collapsed/expanded identity stays consistent. Loading is visible but does not replace the whole useful workspace. No “Try development example” control in the visitor flow; development simulation status remains truthful and unobtrusive. Evidence: E14, E09.

### L-11. Make the assistant friendly and useful

Use concise conversational guidance, contextual actions and useful object/issue cards. A furniture card can show a supported thumbnail, name, dimensions and provenance, and selecting it focuses the exact canonical room object. Missing original photos after refresh must be acknowledged, not fabricated. Camera/selection and card inspection cost no provider request.

The assistant should do supported work through tools, clarify genuine ambiguity once and distinguish proposal from committed receipt. Preview/Apply/Cancel, locks, measured facts and unknown checks stay authoritative. Natural tone never excuses invented fit, hidden changes or endless questions. Evidence: E14, E15.

## Product truth and lifecycle guidelines

### L-12. Separate selecting files, processing and reviewing

Upload/selection presents local previews and file checks. An explicit **Draft my room** starts bounded recognition; the resulting rough 2D review is where visitors reconcile duplicated/missed furniture and correct structure/measurements. Do not make a checkbox appear to run recognition when it only saves a preference.

Use the same real intake/validation path for visitor uploads and applicable photo test inputs. Roomedy's authored sample deliberately opens a known manual room without recognition; do not copy Retailor's requirement to recognize every public sample. Selection/inspection alone never spends credits. Evidence: E16, E17.

### L-13. Distinguish imperfect inference from technical failure

A missed match or uncertain measurement is normally a review issue if a structurally usable draft exists. Preserve that draft, selected files and visitor corrections; offer manual reconciliation rather than discarding work or returning to upload. Refusal, malformed/unusable output, timeout and transport failure remain distinct honest outcomes.

This does not loosen room contracts, lock policy or hard proposal checks. An uncertain draft can be explored with unassessed checks; an invalid arrangement cannot be labelled fitted. Never require a model to infer the entire room perfectly before the user can review it. Evidence: E19.

### L-14. Build meaningful fixtures and private diagnostics

Author examples that actually demonstrate the intended feature, including repeated views of the same piece, different pieces that resemble one another, missing openings and retained locks. Photos intended to represent one item must be visually coherent; do not “fix” the evaluator by changing expected results to match every model miss.

Measure actual recognition time/quality on the named corpus when live testing is authorized. Private decision diagnostics should expose safe operation/rule codes, counts and opaque references sufficient to distinguish provider hypotheses, parser rejection and application reconciliation. Do not log raw images, filenames, room/chat text or whole provider output. Logs never appear in product UI or the application browser console. Evidence: E19, E20.

### L-15. Controls and states must mean something real

A toggle, selection, finish card or exclusion state must change the shared underlying data and every relevant view. Do not ship a cosmetically selected switch that does nothing. Make pending, selected, excluded, blocked and unassessed states distinguishable with text/shape/focus as well as colour. Preserve per-value provenance; a pretty badge is not confirmation.

Inputs/previews must match the supported representation's actual capabilities. Do not show controls for unsupported variants merely to make a panel look complete. Evidence: E07, E18; Roomedy's command/provenance contract supplies the application rule.

### L-16. Reset and restore must preserve runtime truth

Fence the old generation and retire its stored projection before slow cleanup can resurrect it. Test reset during decode/search/provider work, reset→sample, refresh during cleanup, import replacement and fixed expiry after a sleeping timer. Preserve unrelated data and the current room when an import is invalid.

Restored semantic data cannot choose fake/live mode, provider availability, paid enablement or old authorization. Current runtime composition supplies those facts; restore dispatches nothing. Keep the selected two-hour lifetime and transient-photo exclusion exact. Evidence: E21 and A1.

## Efficiency, code quality and security guidelines

### L-17. Check affected visuals during the owning feature

Each feature owns its relevant loading/empty/error/restored/selected states and phone/tablet/short-laptop layouts. Do not defer every spacing, focus and panel defect to RM-015. That packet performs the cumulative matrix and owner checkpoint after individual features already work.

Use actual rendered evidence where tools permit, name viewport/mode and inspect the screenshot rather than only proving a file was saved. Physical-device/GPU/assistive evidence stays distinct. Follow tool restrictions; a blocked browser check is unperformed, not permission for another rendering workaround. Evidence: E04, E06, E22.

### L-18. Use a fast, honest local iteration loop

Use frontend hot reload for copy/style/interaction iteration and restart only the owned backend when its startup/configuration/code requires it. Distinguish normal development, an explicitly authorized live development session and release-like production verification. Keep development/production outputs separate where necessary so a watcher does not invalidate the reviewed build.

Preserve the user's selected runtime mode; never silently turn paid mode on or off. Automated tests independently force fake/paid-off before imports and do not inherit that manual runtime. A style edit does not justify repeatedly rebuilding the whole stack or re-running a paid walkthrough. Evidence: E13, E23.

### L-19. Test behavior at the right boundary

During iteration run meaningful focused checks for changed behavior and actual visual checks for reversible presentation edits. Run established applicable root gates at the settled ticket/cohesive review batch, rather than after every pixel change. Do not add tests that mirror labels, CSS declarations or private implementation shape.

A reproducible bug/security/state change still needs its appropriate regression. A source chat's temporary instruction to defer tests applies only to that session; it is not a permanent Roomedy waiver. Report remaining failed checks clearly and resolve required local failures before claiming completion. Evidence: E13, E23, E24.

### L-20. Keep deterministic tests separate from release freshness

Unit/contract tests use controlled input/evidence fixtures and cover both matching and stale proof. They must not fail after an unrelated source edit merely because a checked-in historical Linux image no longer matches current bytes. The actual release verifier must still reject stale/mismatched evidence.

Use repository LF policy with explicit binary preservation and hash real bytes. Do not normalize inside hashing, disable a guard or accept a Windows projection as actual Linux/GitHub execution. Rebuild and refresh affected proof after relevant changes. Evidence: E24 and A2.

### L-21. Improve quality without expanding the demo

Preserve functionality and smooth motion while fixing demonstrated redundancy, weak ownership, leaks and avoidable work. Keep one room/controller/command authority and narrow browser-safe packages. Extract for real shared consumers; inspect public exports, framework entries, dynamic styles, workers and assets before deleting apparently unused code.

A long controller is not automatically a defect, and fewer lines are not automatically better. Avoid cosmetic mass rewrites, speculative services, generic utility frameworks or new dependencies without a concrete need. Preserve useful private operator logs. Evidence: E25 and A1.

### L-22. Reduce friction without removing security

For the chosen challenge provider, use its supported quiet verification presentation where available and show an interactive challenge only when needed. Keep a visible recoverable fallback if verification fails or needs interaction. Never bypass verification, extend grants unsafely, remove replay/capacity controls or hide a required challenge behind an unusable overlay.

Bound bytes, retained fragment/object overhead, decode pixels/work, shared concurrency and deadlines before dispatch. No hidden queues/retries or raw technical errors in UI. Privacy and bounded resources belong in the initial implementation, not solely the final audit. Evidence: E15, A2.

### L-23. Make audits proportionate and evidence-based

Audit real Roomedy trust boundaries, not imagined enterprise requirements. Separate confirmed defects from static concerns and external/vendor limitations. Dependency severity labels need installed-version/reachability/patch context; do not suppress a real issue or claim broad safety from a package count. Select the smallest compatible correction and meaningful regression.

Preserve useful existing controls and diagnostics. This request adds guidelines; it does not import T2's security-without-review permission. Roomedy's audit-only report and owner finding-selection checkpoint remain. Current external advisories must be researched at execution, not copied from October Retailor snapshots. Evidence: E25, A2.

### L-24. Be precise about evidence and external action

State the exact candidate, mode, corpus, viewport, actual command/result and unperformed checks. Fake tests, real provider interpretation, actual Linux runtime, hosted IAM and owner acceptance are different evidence. A prior manual pass cannot be reused after material changes without relevant revalidation.

Separate public frontend visibility, private backend identity, paid enablement, domain/TLS, optional proxy/origin protection and account controls. Explain what is temporary versus complete; do not introduce unrequested login UX or change other hostnames. Verify current official deployment guidance when needed. Prepare local release files while external inputs are pending; inherited budgets/approvals or a generic “continue” authorize none of these actions. Evidence: E26.

## Feedback evidence register

Turn IDs identify the exact source context; chat links above open the referenced tasks. Descriptions below summarize owner feedback rather than importing its product details.

| Evidence | Source / turn | Observation informing the rule |
| --- | --- | --- |
| E01 | T4 `01a13977-2bf0-7923-915d-55bf0cb9d371`, `01a13ae4-cf2b-7001-8d92-f16b04b45aa3` | Requested plain **Edit**, removal of repeated copy and removal of a repo-specific export control |
| E02 | T4 `01a139fc-f3d5-7db2-93dd-e9facf71fa59`, `01a13c18-3b82-7cb1-ad77-8963ce33c276` | Wanted consistent platform colour, then clarified chosen merchant palettes must stay independent |
| E03 | T4 `01a13a42-5bd1-70e3-b987-4b29c013efae`; T3 `01a13fa1-ad62-78a2-af58-0647d6714dfa` | Typography changed on refresh; browser icons needed contrast without changing the website mark |
| E04 | T3 `01a13f17-5de2-7d20-9308-a75ade87e286`, `01a1416e-60d0-7cb1-b917-91cfbd0d31d5` | Content area was too small; expanded chat should overlay rather than shrink preview again |
| E05 | T4 `01a13af4-9ecf-7312-b101-2019ad46b389`; T2 `01a14460-018e-7381-8d95-7ab85cbe18a6` | Progress/preview geometry drifted; fixed rows created accidental empty areas |
| E06 | T4 `01a139b3-86a7-7601-8c46-93a822b4c3d6`, `01a13a89-92c6-7a62-8a85-e1b89e40ad10` | Landing previews hid the real layouts; template views lacked meaningful distinction |
| E07 | T3 `01a13f47-c58d-71b2-9ed8-96e32107c3ca`, `01a13f4f-8af5-7963-b184-dd76438e6d15`; T4 `01a13c3f-c7a9-7263-8ecf-5091d189a494` | Cluttered forms, unclear field errors and a switch that did not actually change data |
| E08 | T1 `01a148f7-9182-78a1-8912-2f3dccdd101f`, `01a1490a-d4fe-7132-a87f-606fa897cfc6` | Action/footer alignment, long scroll to proceed and insufficient border padding |
| E09 | T2 `01a14404-da19-72d0-95de-505585191129`, `01a14417-86e7-7b22-a9fb-919364c8c3c4` | Composer should stay visible; send button and scrollbar overlapped; footer wasted space |
| E10 | T4 `01a13a22-9f95-7561-b4e7-91301a24d489`; T1 `01a148d5-8156-7860-9507-a5145f160cd7` | Wanted smooth navigation and hero/CTA entrance motion |
| E11 | T3 `01a1406d-85f1-75a3-a796-bce7435538ea`, `01a13ede-b723-7233-aee9-89ba04ab6f04` | Continuous loading motion and assistant text that becomes noticeable without restarting repeatedly |
| E12 | T3 `01a14047-709f-7a32-ac54-70f892f50997`, later `01a1412d-339b-7280-8bf0-8e732204f4df` | Tour timing, readiness, Start/Skip and simultaneous card/target reveal needed correction |
| E13 | T1 `01a148f3-ba1f-7eb1-9e03-8e1940679dac`, `01a1490c-61a5-71b3-90db-ac57a5ea5667` | Repeated status variants and meaningless processing slogans were explicitly rejected |
| E14 | T3 `01a13f37-abcb-7c11-8276-a4eaa54d4458` | Enter/send and useful fake chat were missing; development-example CTA was unwanted |
| E15 | T2 `01a14485-2523-75e1-b69f-bf76ba22def0`, `01a144db-94d4-7453-b10b-15b3d01db8f1` | Asked for useful friendly real assistant tests, quiet verification and clickable thumbnail cards |
| E16 | T3 `01a13eba-98c3-7b01-92fb-7db5eab03b94`, later `01a140e0-2c75-7351-82a3-83c6b56f4bc3` | Clarified upload checks versus explicit processing and correction in draft review |
| E17 | T3 `01a13feb-498d-7930-8727-117304bea59f`; T2 `01a14485-2523-75e1-b69f-bf76ba22def0` | Explicitly required visitors' own uploads and tests through the upload path, beyond samples |
| E18 | T3 `01a13ef1-ff9c-72c2-9b81-3e80eed541a1`, `01a14121-b6aa-75a2-bd0f-133ba5bbd562` | Controls must match visible preview capabilities; hover/focus border geometry was wrong |
| E19 | T1 `01a14920-1334-7fe2-be0b-e8e092e48f45`, `01a14956-d41f-7df0-aa1a-5af0119c7e9e` | Real grouping misses were confused with failure; owner expected manual correction instead of returning to upload |
| E20 | T1 `01a14923-1bd8-78f3-8a3d-eda5abdc2ba5`, `01a1493b-c2ef-7ae3-a0a1-975ca566928c` | Asked for diagnostic decisions in backend only and meaningful repeated-view test cases |
| E21 | T4 `01a1398c-5e21-7331-b203-4f23c6e73c8a` | Reset followed by sample could restore stale data or produce duplicate warnings |
| E22 | T4 `01a13aff-2fd3-7ae3-bda2-9611156afcb3`; T2 `01a14518-53ab-7bb2-9368-32aac5c90003` | Wanted actual full-flow visual inspection and ordered representative screenshots |
| E23 | T1 `01a148ec-883f-76f2-a54f-5b8f6f625561`, `01a148e6-3cb5-7482-8277-c7e601ca6cd3`; T2 `01a143ee-4b89-7981-a003-db2c5fcdc9c2` | Wanted hot reload and temporary batching of tests during rapid visual edits |
| E24 | T3 `01a14198-b4cd-7b32-be1e-6d2a8d9bbe5f` | Supplied failing deterministic preflight test assumed historical image evidence was always fresh |
| E25 | T2 `01a1452f-a1fe-7e61-8143-978b6ed65dee` | Required repeated quality/security work with functionality unchanged and explicitly warned not to overengineer the demo |
| E26 | T1 `01a14975-cbfe-7b40-a1b4-9711721c77cd`, `01a1499d-e231-7683-be6e-0967ae544cfd`, `01a149dd-566c-73c0-a3ef-e2d2f46f62aa` | Confusion between public frontend/private backend, paid state and temporary DNS/proxy steps |
| E27 | T4 `01a139da-481b-7f62-89d7-3b21aab256d8`, `01a139c7-23fc-7d21-b735-0dd0e11fb000`; T3 `01a140f6-6b53-7ec2-8868-b2c3c18d09bb` | Logo directions and hero-film treatment were scoped discussions/selections for Retailor, not general authority to add those features elsewhere |

Additional inspected project records, used only for concrete engineering examples:

- **A1:** [Retailor RTL-142 quality report](../../../Retailor/docs/audits/RTL-142-CODE-QUALITY.md) records a restored-mode/composition mismatch and explains why controller length/declaration counts did not justify speculative splitting/deletion. This is a historical reported defect, not a Roomedy finding.
- **A2:** [Retailor RTL-143 security report](../../../Retailor/docs/audits/RTL-143-SECURITY.md) records bounded multipart-retention remediation, quiet verification with server controls retained, and dependency applicability/patch limits. No finding/version/test count is imported as current Roomedy evidence.

## How these guidelines change the plan

All twenty tickets retain their IDs and dependency order. The [queue's guideline ownership map](../tickets/README.md#guideline-ownership) assigns the rules to existing outcomes, and each packet links its relevant lesson IDs. Targeted acceptance additions make the important corrections reviewable: stable identity/hot reload, task-first panels/forms/chat, correction-friendly recognition, private diagnostics, quiet verification, deterministic proof tests and proportional quality/security work.

The [feature/review checklist](../design/REVIEW_CHECKLIST.md) is used throughout implementation and again at RM-015. No extra service, account, paid feature, test waiver, product design or release approval is created by this document. The owner has approved the revised plan and guidelines and authorized only step-six RM-000 documentation/ticket commits. No implementation, app run, paid request or deployment is authorized by that approval.


## Direct Roomedy space review —19 October2026

The owner explicitly requested an all-page review after seeing dead empty areas and vertical stacking despite spare side width (and the reverse). [RM-015K](../tickets/RM-015K-review-and-rebalance-page-layouts.md) owns this correction before the joint visual session. Use [permanent layout rules](../design/layout.md): spend width/height on existing real tasks, room controls, grounded cards and usable conversation; preserve readable text and intentional breathing room without filler. Check actual room-column width, short-height flow, field/action reachability and tours on resize. A large viewport screenshot alone is insufficient. Actual owner visual approval remains pending. This later direct authority supersedes historical checkpoint wording above only for the named correction.


## Direct landing visual feedback —19 October2026

The owner rejected the boring small landing, Sample room/Apply/Undo control card and tiny step list, and selected **a room assembles, rotates and opens up as you scroll**. [RM-015L](../tickets/RM-015L-create-a-scroll-driven-furniture-landing.md) owns full-size meaningful chapters, research-backed motivation, final CTA, centered footer without domain and matching opaque beige browser/search/Apple icons. The palette, logo and brown dot are explicitly liked and must stay. Authored marketing art is not a live room; remove faux editor controls, not actual editor features. Keep normal scroll and readable content/CTA; no fabricated designer-adoption, price savings or customer statistics. [Primary research](landing-research-2026-10-19.md) records dispositions and limits; actual visual result approval remains pending.


## Direct full-room and startup feedback —19 October2026

The owner asks for the room to cover the whole landing with smoothly integrated text, and reports first-load3D stutter. [RM-015M](../tickets/RM-015M-integrate-landing-content-into-the-room.md) supersedes L's split/compact scene layout. Keep real semantic text/actions inside one full-viewport spatial experience across every section, retain the selected palette/brand/icons/content, and prepare GPU uploads/shaders/first shadow render before visible motion. Readiness is actual work, not a timed artificial delay; preserve normal scroll, bounded resources, useful poster and all narrow/short variants. Compare actual initial-load runs and do not claim device/paint evidence from local callback timing.

## Purposeful rearrangement and preserved card style —19 October2026

The owner likes the immersive room and requests movement that explains a better arrangement: grounded furniture starts in inefficient places, then slides/rotates with scrolling while existing camera/wall animation remains. [M](../tickets/RM-015M-integrate-landing-content-into-the-room.md) owns this same uncommitted refinement. The screenshot shows hard rectangular text-shading seams. The owner explicitly likes those warm translucent backgrounds and the current card style: keep them, feather only the outer edges, and preserve decorative rules/readability. Do not interpret softer edges as permission to strip the background treatment.

## Glass, clean scrolling and initial artwork —19 October2026

The owner wants convincing window glass instead of a cartoonish opaque panel, smooth section transitions without fragment routes, a beige animated underline on How it works, removal of the weird initial furnishings screenshot, removal of No account needed. and a better-designed scroll cue. [N](../tickets/RM-015N-refine-landing-glass-and-scroll-navigation.md) owns this refinement after committed M. The screenshot is the temporary flat SVG poster: remove it, keep immediately useful warm content, then reveal only the actual prepared room. Preserve the separately liked translucent text style and room choreography. Improve the cue as a useful ≥44px circular-arrow control; do not add filler explanations/settings. Real native smooth scrolling jumped in IAB, so use a bounded interruptible section journey without changing manual scrolling or canonical state.
