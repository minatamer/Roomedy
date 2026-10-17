# RM-009 — Build bounded layout search and explanations

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Spatial assistance**  
Depends on: [RM-003](RM-003-build-spatial-checks-commands-and-undo.md), [RM-005](RM-005-deliver-canonical-session-and-precision-2d-editor.md)  
Suggested commit: `RM-009: build bounded layout search and tradeoff facts`  
Authority: [blueprint §10](../ROOMEDY.md#10-geometry-and-layout-generation), [worked scenarios §12](../ROOMEDY.md#12-worked-scenarios), [§18](../ROOMEDY.md#18-bounds-concurrency-and-costs)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01, L-08, L-13, L-19, L-21) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Turn a bounded planning goal into a deterministic candidate arrangement and useful computed trade-offs. The assistant interprets the request; application geometry generates/evaluates supported placements. Search cannot invent wall dimensions, shrink retained furniture, unlock protected items or call a layout good merely because a model said so.

Support the selected bedroom/workspace stories: furnish an empty room with chosen essentials, add missing pieces around retained furniture, rearrange only owned pieces and move the work area toward a window. Produce at most one visible proposal. Internal small candidate sets are an algorithm detail, not a multiple-layout comparison feature. Search exhaustion means no result within this search, not proof of mathematical impossibility.

## Dependency evidence and proposed ownership

Use actual RM-003 rules and controller fences. Keep worker effects outside the pure package.

| Area | Responsibility |
| --- | --- |
| `packages/spatial/src/search/` | Seeded candidate generation, pruning, scoring and bounded search state |
| `packages/contracts/src/search*` | Bounded goal/result/trade-off schemas and policy references |
| `features/session/` and dedicated frontend search worker | Worker lifecycle, cancel/supersession and result identity checks |
| Backend assistant search adapter | Same pure algorithm/validation under a server deadline |
| `docs/engineering/layout-search.md`, independent search corpus | Actual supported goal semantics, limits and quality observations |

## Implementation plan

1. Define supported goal inputs: required functions/pieces, retained IDs, permitted additions/replacements, fixed poses, window preference and finish preferences. **Rearrange what I own** forbids additions/replacements; size/style requests use supported catalogue variants and explicit replacement permission.
2. Generate seeded wall/grid placements and supported quarter-turns. Preserve room structure, protected dimensions and starting-state locks. Keep candidate identity/order stable for the same room/goal/seed/rules/catalogue versions.
3. Use RM-003 to prune containment, collision and supported hard access blockers. Do not substitute a separate simplified solver definition of fit. Preserve disclosed baseline issues under the documented repair policy; compare final complete candidate rather than rejecting useful coordinated moves individually.
4. Score only soft preferences with named measured facts: window proximity, central usable area and grouping/visual balance. Keep hard constraints separate from soft scores. Do not show an unexplained global percentage or code/compliance claim.
5. Bound accepted objects/features, generated positions, candidates visited, elapsed time, memory and returned candidates. Begin with the blueprint's 20,000 candidates/250 ms/at most two internal results as provisional engineering policy, then measure representative devices in RM-015. Stop at the first applicable bound with explicit reason.
6. Run browser search in a worker; maintain bounded messages and one owned job. Abort/reset/new goal/manual change invalidates the job by workspace/generation/revision/operation. A late worker reply cannot create a candidate for a newer room.
7. Provide backend consumption through the same public spatial package with independent untrusted-input validation and finite work/deadline allowance. No extra solver service or remote endpoint is needed for every manual action.
8. Return one chosen candidate as typed actions plus computed affected IDs, issue facts and trade-offs. RM-011 owns proposal presentation and visitor Apply. Search never writes accepted state or silently selects a smaller owned item.
9. For unassessed geometry, unsupported goals, impossible protected combinations or exhausted search, return specific alternatives: confirm a measurement, relax a preference, omit an optional piece or explicitly choose a replaceable smaller supported variant. No auto-unlock, auto-confirm or hidden provider retry.

## Prevention requirements from prior feedback

Search runs under named finite policy without freezing active room interaction. Expose useful computed trade-offs and honest exhaustion, not a new collection of solver settings, percentages or debug controls. Approximate inputs remain labelled and do not make a valid result appear certified.

## Approved plan refinements — 17 October 2026

**Request-local scope and reproducible useful search.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-07/PR-08. Capture application-owned allowed action kinds, target IDs and add/replace/remove scope from the selected/resolved request; an unlocked unrelated piece is not automatically an authorized target. Disclose necessary coordinated desk/chair changes. Rank valid targeted candidates by goal satisfaction, then fewer changed pieces/lower displacement before decorative preferences.

Guarantee deterministic ordering/results for fixed work and a seed. Deadline-limited runs record visited work and termination reason; different devices may finish different prefixes. Use pure incremental search state with scheduling outside the package, or a measured equivalent: browser worker and yielding/offloaded backend work so health/cancellation stay responsive. Prefer goal/wall/opening candidate ordering/pruning before a broad grid. Require actual improvement on independently known feasible cases, not merely a valid arrangement; exhaustion remains bounded, never an impossibility proof.

## Acceptance criteria

- [ ] Supported empty/partial/rearrange goals produce typed candidates through shared rules without direct state mutation.
- [ ] Retained dimensions, starting locks and no-additions goals remain invariant during search.
- [ ] Deterministic seeds/versions give stable ordering and fixed-work results; deadline-limited runs report their visited prefix and termination reason.
- [ ] Every returned candidate passes the complete shared validator and carries computed trade-offs/unknowns.
- [ ] Candidate/time/memory/result bounds terminate work and explain exhaustion honestly.
- [ ] Browser work runs off the pointer path and cancellation/supersession rejects late results.
- [ ] Backend use revalidates input/candidates through the same package under independent bounds.
- [ ] Only one proposal is exposed to the visitor; no multi-candidate comparison or price/budget goal is introduced.
- [ ] Near-limit search/cancel preserves usable interaction and reports bounded exhaustion without new visitor-facing debug controls or invented fit claims.

### Additional approved acceptance — all unperformed

- [ ] Targeted desk/appearance requests preserve unrelated unlocked objects/finishes; explicit rearrange-owned scope forbids add/replace and necessary coordination is disclosed.
- [ ] Fixed-work replay is reproducible; deadline output records visited prefix/reason without claiming device-independent identical candidates.
- [ ] Maximum bounded backend search preserves health/cancellation responsiveness; known feasible tight-room stories produce measured relevant goal improvement through the full validator.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Empty room with selected essentials | Independently check returned containment/access facts and action permissions |
| Kept bed and fixed wardrobe; add desk | Exact dimensions/locks preserved and no illegal replacement |
| Rearrange owned pieces | Same item identities/count/catalogue membership after candidate generation |
| Desk near window versus protected doorway | Hard blocker wins; measured preference trade-off is explained |
| Same input/seed at fixed work; deadline exhaustion | Fixed-work stable output; deadline visited prefix and correct termination reason/count |
| Worker reset/manual edit/new goal during search | No stale proposal, leaked worker or delayed UI mutation |
| Candidate tampered before backend/tool use | Shared validation rejects despite claimed pass flags |

## Handoff and limits

Record actual corpus quality and candidate/time distributions when measured. RM-011 integrates search with assistant tools; RM-013 evaluates worked scenarios and RM-015 tunes device limits. No general optimality, exhaustive solvability, professional ergonomics or guaranteed fit is claimed from a bounded result. Follow the index's future execution and evidence rules.
