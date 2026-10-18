# Bounded layout search and request scope

RM-009, 18 October 2026. [Ticket](../tickets/RM-009-build-bounded-layout-search-and-explanations.md), [file allocation](../commit-plans/RM-009.md), [actual evidence](../validation/RM-009.md). This implements one candidate generator and its scheduling seams; RM-011 owns assistant/tool/proposal UI. No price/budget planning, extra solver service, queue, model, paid request or visitor debug settings are introduced.

## Application authority

`ActionScope` is a separate trusted application argument, never a field in a model command. It binds room/revision, action kinds, target IDs, exact app-owned add/replace IDs and catalogue choices, removals and room-finish permission. An unrelated unlocked piece is not authorized by its unlocked state. A move that changes rotation also needs rotate permission. Add/replace/remove and room-finish permissions cannot be inferred from a generic target list. Starting locks, ownership, true dimensions and complete final-batch geometry still pass through RM-003.

Assistant `prepareCommand` and the first actual `applyCommand` now require this scope; omission fails closed. Apply rechecks the scope and candidate against current semantics/revision. An existing exact duplicate receipt remains a harmless idempotent read, with no new mutation. Visitor/authored actions retain their existing authority. The underlying unscoped `evaluateBatch` remains the pure physical/domain primitive; assistant application/search owners call the scoped wrapper, not a second geometry engine. RM-011 must retain the captured request scope with its pending proposal and pass it again on Apply.

Search goals cannot widen scope. They identify selected targets, retained/fixed IDs, explicit additions/replacements/removals, supported variant sizes/finishes and an optional referenced window. Rearrange-owned rejects additions/replacements/removals and preserves identity/catalogue/size. Appearance search changes only the explicitly selected finishes, never geometry or an unrelated owned finish. Proposed additions use selected supported catalogue values with estimated size; owned physical dimensions remain independent of asset range and are never shrunk. Unsupported, protected or missing-footprint cases return bounded alternatives/questions instead of fabricated confirmation or automatic unlock.

Both schedulers capture a strict scope copy before asynchronous work. Reply validation uses that captured copy, even if a caller later reuses/mutates its original object. Worker/tool pass flags and claimed facts confer no authority. Returned actions are revalidated against both selected goal semantics and application scope, then the complete shared evaluator; facts are recomputed. A substituted valid-but-wrong-goal placement or variant is rejected.

## One incremental algorithm

The pure `LayoutSearch` has no clocks, I/O, worker, environment, provider or accepted-room writes. It parses the bounded room/request/scope and retains one DFS path plus one best candidate. Actor order is stable by goal/category/ID. Position order considers the selected window facing inward, explicit desk/chair grouping, retained positions/quarter-turns, bounded wall anchors and a small grid. A deterministic seeded hash breaks ties. Physical centres remain multiples of0.5mm; decorative meshes do not enter fit.

Every visited placement node counts as work, including pruned nodes. The active stack holds at most40 actors with at most64 poses each; no visited-room history or search tree is retained. A partial projection omits unassigned movable actors so their old positions cannot falsely reject coordinated final moves. Pruning calls the shared `checkRoom` and the extracted monotone hard-issue comparison. Full terminal batches always pass the shared command evaluator, including starting locks and baseline repair policy. This is a heuristic search, not a separate simplified fit definition or exhaustive solver.

Known room width/depth and each movable footprint are needed for placement. Missing values produce a targeted question without inventing millimetres. Other unknown dependencies can remain in a usable approximate candidate: actual missing input keys and confirm-measurement alternatives accompany the shared checks. Confirmed values are not listed as missing merely because another dependency is unknown. Unsupported entry connectivity remains explicitly unimplemented and is not presented as another measurement to collect. Approximation uses coverage as well as emitted issues, so clean estimated geometry stays labelled approximate.

## Goal quality and computed facts

Hard checks stay separate from soft goal ranking. Valid candidates first improve the resolved goal: required selected pieces, targeted window proximity, central-area improvement for rearrange-owned and the explicitly included work-area pair. Then fewer changed pieces/lower displacement win before decorative central balance/grouping preferences. There is no visitor-facing global percentage.

Facts report desk-centre to selected window-centre distance, nearest desk/chair centre separation, selected pair alignment/facing, clear central footprint area, centre-of-area balance, displacement, actual changed/coordinated IDs, selected additions placed and remaining dependencies. Central area uses the exact union of known axis-aligned footprints within the middle half-width/half-depth rectangle; it is not an access path or ergonomic/compliance claim. Unknown footprints make that area unassessed. The chosen desk/chair preference uses a20mm gap between their semantic solids and100mm alignment tolerance, with opposite fronts; shared configured access/pull-out checks remain authoritative. These are named planning preferences, not certified ergonomics. A chair is coordinated only when explicitly included in the resolved scope/goal; an unrelated chair never moves automatically.

Targeted window results must improve the known prior window distance. Rearrange-owned improves central area or an existing hard problem. A physical candidate that misses the selected grouping preference can be absent from the result, with a relax-preference alternative; this does not make the preference a building rule or prove mathematical impossibility. Locked requested pieces return a review-lock option. Search does not invent smaller owned pieces, omit a required selected addition or apply only a valid subset.

## Bounds and scheduling

| Owner/bound | Implemented policy |
| --- | --- |
| Pure work | At most20,000 visited placement nodes; request may choose a smaller reproducible fixed-work bound |
| Retained search state | At most40 actor frames ×64 poses, one current path, one best candidate; no growing visited ledger |
| Batch/domain | Existing40 furniture/24 feature/32 action and catalogue/evidence limits remain authoritative |
| Slice | At most4 nodes per call; invalid/non-finite slice work terminates safely |
| Browser worker | One worker per owned operation;250ms search budget plus a2250ms startup/response watchdog |
| Backend | Independent250ms search budget and actual `setImmediate` yield between4-node slices |
| Wire/result | Strict schemas,4MiB message ceiling, one chosen candidate; at most one future visible proposal |

A seed guarantees the same ordering/result for the same room/goal/scope/versions and **fixed work**. Time-bounded devices may visit different prefixes; results identify visited/evaluated/pruned counts and exhausted/work-limit/deadline/cancelled/unsupported reasons. The250ms budget is checked between finite slices; one slice and final validation/serialization can overshoot it. Actual measured totals and health latency are in the receipt, not inferred from the constant. RM-015 still owns device tuning.

`SessionController.findLayout` is the reachable lazy frontend entry. It starts the normal session operation, then loads `BrowserLayoutSearch` and the module worker. That client owns one job and registers termination with the canonical session token. Manual edits/new operation/reset/expiry fence and terminate the old worker; late messages cannot commit or stage a proposal. The client revalidates the reply and returns data while the parent operation remains current. The caller must still verify its token before any later proposal write/Apply. The worker closes after its single bounded result. No search runs on drag/camera/pointer frames.

The backend adapter uses the same public pure package, independently parses input/scope, yields, checks cancellation/time and revalidates final actions/facts. It adds no HTTP solver endpoint or provider. RM-008's admitted assistant use case remains its later caller; health remains separate. Tests/measurements use fake/off bootstrap with denied external networking and owned ephemeral loopback listeners.

## Evidence boundary

The independent synthetic corpus supplies manually derived feasible controls for empty essentials, a kept bed/fixed wardrobe, a tight window/door work area and central-area rearrangement. It also covers half-mm contact, unknowns, protected requests, exhaustion, appearance scope, tampered candidates and deterministic prefixes. Actual local measurements distinguish goal improvement, search time and health response from browser frame smoothness.

Native browser search is not exposed by a temporary debug button. The real Next build emits its worker runtime/chunks through the lazy session entry; controlled worker tests prove lifecycle/identity behavior. Actual native browser search/cancel interaction becomes reachable through RM-011's intended UI and remains unperformed here. Physical-device/browser frame/memory limits, broad search completeness, live assistant behavior, integrated corpus evaluation and owner visual acceptance remain RM-011/013/015. No photo understanding or provider execution follows from a solver result.
