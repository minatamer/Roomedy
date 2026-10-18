# RM-011 — Deliver the grounded assistant and reviewed edits

Status: **Implemented locally — external evidence pending**
Planning date: **17 October 2026**  
Milestone: **Assistant**  
Depends on: [RM-006](RM-006-deliver-synchronized-3d-cutaway.md), [RM-008](RM-008-build-shared-admission-and-bounded-provider-transport.md), [RM-009](RM-009-build-bounded-layout-search-and-explanations.md), [RM-010](RM-010-deliver-photo-recognition-and-draft-reconciliation.md)  
Suggested commit: `RM-011: deliver grounded assistant and reviewed room edits`  
Authority: [blueprint §§9–12](../ROOMEDY.md#9-commands-previews-apply-and-undo), [selected refinements §19.4](../ROOMEDY.md#194-selected-product-and-design-refinements)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01, L-07–L-11, L-22) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Make the Roomedy assistant useful for explanation, setup guidance, supported furniture/finish choice and real room operations. A request such as “move the work area near the window” produces one typed, computed candidate that the visitor can inspect in both views, Apply once, Cancel or Undo as a whole instruction. Conversation never mutates the room directly.

All geometry comes from the shared engine. Keep locked/retained pieces and unknown measurements honest. Use contextual chips, object cards, short optional tours and specific check explanations instead of endless clarification. Unsupported price/budget/shopping requests receive a concise scope explanation and useful layout/size/style alternatives.

## Dependency evidence and proposed ownership

Read actual search, transport, controller and recognition evidence. Reuse the one provider runtime, command path, catalogue and candidate projections.

| Area | Responsibility |
| --- | --- |
| `apps/backend/src/assistant/` | Bounded context builder, strict tool loop, proposal/explanation use case |
| `providers` assistant adapter | Real/fake implementations through shared bounded Responses transport |
| `contracts` assistant/tool subpaths | Allow-listed closed schemas, safe facts and correlated outcomes |
| `features/assistant/` | Conversation, grounded cards/chips, clarification, preview and receipts |
| `features/session/`, plan/cutaway adapters | One ephemeral candidate, trusted Apply/Cancel/Undo and shared highlights |
| Assistant policy/corpus documentation | Actual tools, prompt versions, worked examples and limitations |

## Implementation plan

1. Build the smallest useful revision-bound context: current room/provenance, selected/referenced IDs, catalogue/options, ownership/locks, relevant diagnostics, goals and bounded recent conversation. Do not attach all original photos on every turn. Optional appearance imagery requires explicit justified bounded handling.
2. Implement strict allow-listed tool capabilities for reading room facts, finding catalogue items, bounded arrangements, preparing edit batches, explaining computed checks and focusing objects/issues. Measurement/lock-change tools request visitor action; they cannot self-confirm or unlock. Undo requests route through explicit visitor intent and normal latest eligible history.
3. Bound total provider rounds/tools/context/output/deadline using the one policy. Reject extra properties, unknown tools, fabricated IDs/variants, non-finite values and malformed/partial batches before effectful execution. Tool results are data, never executable JavaScript, HTML, shell or arbitrary network requests.
4. Distinguish explanation, one targeted clarification, unsupported/refusal, safe failure and proposal. Ambiguous “move that desk” asks about actual matching pieces. Unsupported style/furniture or “under $500” cannot create a price/retail tool or fabricated claim.
5. Convert prepared actions through starting-state permissions and complete final-batch validation. Include affected IDs, source-controlled measured facts, remaining unknowns and concise reasons. Use actual check results; provider prose cannot assert new dimensions or turn unassessed checks into passes.
6. Present one candidate with ghosts/diff/highlighted issue regions in plan and cutaway, plus a compact change/check card. The committed room remains intact. Appearance-only previews show finish changes without movement; additions and explicit replacements are distinguished from retained items.
7. On Apply, recheck workspace/generation/operation/input revision/versions and recompute the candidate. Commit once, return an actual receipt, increment revision and create one bounded Undo entry. Double click/replayed command cannot duplicate furniture. Cancel changes no accepted state/history.
8. Manual edit, new goal/request, import/reset/expiry or pending comparison resolution invalidates the candidate and in-flight work. Abort where possible and ignore every late result independently. Refresh never replays a paid operation or Apply.
9. Add contextual goal/finish chips and object cards: keep pieces, rearrange owned furniture, furnish with selected essentials, inspect a warning, choose one of three supported presets. An optional short tour is dismissible and read-only; camera/focus actions do not become semantic changes.
10. Connect whole-change Undo shared with manual controls. Show the actual action label and recomputed state. A failed/cancelled request preserves work and cannot show an applied-success receipt. Fake development is explicit; unavailable/live-failed mode leaves manual editing usable.

## Prevention requirements from prior feedback

Provide friendly task-oriented responses and clickable canonical-object cards using available catalogue/source imagery honestly. Chat needs reachable sticky composition, accessible compact Send, Enter/Shift+Enter and IME-safe submission without scrollbar overlap. Optional tour cards/highlights wait for actual layout/scroll readiness and reveal together; preserve the selected optional policy. Verification should not interrupt every message with a needless modal.

## Approved plan refinements — 17 October 2026

**Application-owned mutation scope and grounded assistance.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-07/PR-10 and O-03. Capture an application-owned action/target/add/replace/remove scope from the selected action and resolved request; an unlocked object alone grants no request scope. Clarify true ambiguity and disclose necessary desk/chair coordination. Enforce scope in tools and again on Apply; model arguments cannot widen it. A finish request preserves geometry, targeted moves preserve unrelated furniture/finishes, and rearrange-owned never adds/replaces. Favor less change after satisfying the requested goal.

Use explicit strict serial tool calling and one correlated final application-owned batch with foreground `store: false` and bounded supplied context. Keep computed facts independent of provider prose/schema conformance. Select a relevant next measurement from rule dependencies; avoid an exhaustive questionnaire. Per-fact physical evidence, planned placement and observed-photo measurement remain distinct, with truthful representation limitations.

## Acceptance criteria

- [x] Assistant context/tools are bounded, grounded in current semantic data and use shared provider/admission policy.
- [x] Supported goals and explanatory cards perform useful work through allow-listed capabilities.
- [x] Unknown objects/tools/values, lock bypasses and fake confirmation are safely rejected.
- [x] Exactly one preview is separate from current room and visible coherently in both editor views.
- [x] Apply revalidates and commits atomically/idempotently; Cancel creates no change and Undo reverses the whole instruction.
- [x] Manual/new request/reset/import/expiry races cannot apply stale candidate data.
- [x] Outcome language distinguishes proposed/applied/failed/unassessed and uses computed check facts.
- [x] No prices, visitor-budget planning, retail sourcing, direct arbitrary code or silent fake fallback is introduced.
- [x] Composer, keyboard/touch submission and canonical-object card focus work across normal/narrow/panel states without losing draft text or shrinking the room unusably.
- [x] Optional tour and quiet-verification states are coherent and skippable/recoverable while all server/command controls remain enforced.

### Additional approved acceptance — local evidence below

- [x] Desk/finish/rearrange-owned requests enforce their exact allowed action/target scope at preparation and Apply, preserving unrelated unlocked state and explaining coordinated changes.
- [x] Captured fake requests use compatible strict serial/stateless schemas; one final batch remains grounded in actual rule coverage and per-fact evidence.
- [x] Measurement prompts target a relevant missing dependency; unrelated unknown fields do not block supported exploration or cause invented confirmation.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Worked scenarios A–H | Grounded result, specific clarification/rejection or valid candidate for each |
| Coordinated swap and mixed add/move/finish batch | Correct final atomic candidate and one Undo entry |
| Keep bed; fixed wardrobe; unlock+move tool attempt | Starting locks/dimensions survive and visitor control is requested |
| Door-blocking desk or unknown sill height | Blocked or unassessed facts, never invented fit confirmation |
| Apply twice/Cancel/manual edit while preparing/late old response | Exact accepted room/history/receipt and zero stale mutation |
| Budget request, image-text injection, malicious tool output | Supported alternatives or safe rejection; no new capability |
| Selection, camera, Apply, Undo and read-only cards | Zero provider dispatch unless a deliberate assistant request was made |

## Handoff and limits

Record actual fake integration and tool-boundary evidence with dispatch counts. RM-012 completes comparison/persistence/export and RM-013 evaluates real interpretation only when authorized. No live quality, broad accuracy, external spend permission or final visual acceptance follows from deterministic fixtures. Follow the index's future execute/validate and Git rules.

## Execution evidence — 18 October 2026

[41-path allocation](../commit-plans/RM-011.md), [assistant policy](../engineering/assistant.md) and [validation receipt](../validation/RM-011.md). Final274-test/root/build gate and read-only pass1 passed; actual native worker/fake HTTP,2D/3D, responsive composition, preview/Apply/Cancel/Undo and optional guide were inspected. Tick marks cover the stated local fake implementation; vendor challenge/model/privacy/funding/physical IME/hosted evidence remains unverified. Import/recovery/comparison lifecycle integration continues in RM-012. RM-015 owner visual decision remains pending. Exact authorized local commit next.
