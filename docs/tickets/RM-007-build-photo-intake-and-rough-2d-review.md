# RM-007 — Build photo intake and rough 2D review

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Reviewed room**  
Depends on: [RM-005](RM-005-deliver-canonical-session-and-precision-2d-editor.md)  
Suggested commit: `RM-007: build safe photo intake and rough 2d review`  
Authority: [photo pipeline §5.6](../ROOMEDY.md#56-how-photos-become-an-editable-room), [§6](../ROOMEDY.md#6-intake-and-measurement-confidence), [§§17–18](../ROOMEDY.md#17-guest-lifecycle-and-privacy)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-01, L-06, L-12, L-13, L-15, L-17) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Provide a useful own-room path before provider recognition: select eligible photos, review them locally, describe a supported rectangle and correct a rough top-down sketch with guided measurements. The visitor can finish manually if recognition is unavailable. RM-010 later injects real structured recognition hypotheses into this same review surface.

Initial review is deliberately a **rough 2D sketch**, with walls, opening markers, labelled footprints and uncertainty. It has no 3D preview/toggle. Only after accepting the reviewed room does the visitor reach the main editor's two views. Raw photos remain active-page memory only, while accepted semantic data can later recover for two hours.

## Dependency evidence and proposed ownership

Reuse the canonical controller, public schemas and shared correction commands. A review draft may be incomplete, but it cannot become a second accepted-room authority.

| Area | Responsibility |
| --- | --- |
| `features/room-intake/` | File selection, local previews, rough sketch, guided feature/measurement cards |
| `features/session/` | Generation-owned photo resources, cancellation and accepted-review transition |
| `features/plan-view/` reusable adapters | Lightweight sketch projection without precision-editor/3D duplication |
| `contracts/policy` and backend intake contract | Finite image/manifest limits and supported media definitions |
| `docs/engineering/image-intake.md`, intake tests | Decode/memory policy, measurements and adversarial file evidence |

## Implementation plan

1. Implement empty/partly furnished/furnished intake with concise photo guidance: corners, openings and fixed features. Accept room views and furniture-detail photos as labelled evidence; a furniture-only image cannot establish room outline or scale. Selectors accept only explicitly supported raster codecs; floor plans/PDFs/native scans/remote URLs are out. Measure supported phone formats and provide an actionable unsupported-format result rather than pretending every phone image works.
2. Enforce count, per-file/aggregate bytes, dimensions and decoded-pixel bounds. Candidate starting policy is six files, 8 MiB each/24 MiB total, 16 MP and 8000 px edges; choose/document exact finite values after measurement. Decode one at a time and release superseded buffers/URLs. MIME/extension alone is not image validation.
3. Show selected originals locally, remove/replace controls and clear provider-transfer disclosure before **Draft my room**. Selection itself makes no AI call. Strip metadata/re-encode normalized provider inputs with finite quality/edge/byte policy; raw upload, normalized image and encoded transport ceilings remain separate.
4. Build a review draft schema with unknown values and hypotheses distinct from accepted room semantics. Draw rough walls, wall-associated openings and furniture cards/footprints. Reuse coordinate/provenance vocabulary without requiring all hidden measurements to be invented for display.
5. Guide one feature/value at a time with the affected wall/object highlighted, a source-photo thumbnail when still available, and compact numeric entry. Confirm width/depth and fit-critical dimensions, along-wall positions, hinge/mechanism and relevant heights. Preserving an estimate is different from visitor confirmation.
6. Allow adding/removing/correcting missed features, furniture categories, duplicate object hypotheses and wall associations. Choose **Keep**, **May replace** and independent dimension/pose locks visually. Empty-room inventory starts empty; do not invent a bed from room condition alone.
7. Add purpose/goal and supported essential-furniture selection after reviewed room structure. Accept structurally supported data even with disclosed baseline conflicts or remaining unknown checks; show approximation/unassessed status. Unsupported shape/mechanism is explained, not silently converted into a confirmed rectangle.
8. On explicit acceptance, validate through shared contracts/commands, create the main-editor baseline once, transition to the existing editor and retain only still-needed transient photos. Sketch-to-studio motion must preserve orientation/selected object without introducing 3D during initial review.
9. Fence async decoding/normalization and review completion by workspace/generation/operation/revision. Remove/reset/expiry/unmount aborts or ignores obsolete work and revokes owned resources. Full refresh recovery later restores semantics, never these originals.

## Prevention requirements from prior feedback

Keep selection to previews/file checks and the explicit draft action; reconciliation belongs in review. Put upload guidance inside its control, maintain an obvious sample/manual alternative and consistent reachable proceed actions. Make removed/excluded photos and unknown values clear. Do not add recurring filler banners or send the visitor back to upload merely for a correctable hypothesis.

## Approved plan refinements — 17 October 2026

**Bounded observation-to-room review and relevant questions.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Before integration, define PR-06's uncertain draft: bounded per-photo observations, candidate physical entities, allow-listed source IDs, finite associations and application-owned stable identities. Resolve one rectangle frame, wall associations and scale without inventing confirmed millimetres. Estimated sketch display positions remain distinct from physical evidence. Merge/split/add/remove review preserves visitor corrections; two similar desks are not irreversibly merged by a provider assertion. Width/depth/wall corrections preserve confirmed values and deliberate placements, recompute only dependent draft estimates and flag contradictions.

Wire the complete trusted feature authority and per-fact evidence from RM-003. O-03 is adopted: choose the one missing measurement relevant to the current goal/check dependencies, rather than asking every unknown field. Prepare a small rights-safe corpus/rubric skeleton now for RM-013; live interpretation remains unverified. O-01 preserves only the draft adapter seam; model downloads, GPU services and benchmark execution are deferred.

## Acceptance criteria

- [ ] Eligible photo selection has finite codec/count/byte/pixel/decode policy with actual measured rationale.
- [ ] Selection/previews require no provider call and originals remain transient without storage/default-export serialization.
- [ ] Initial review is a usable rough 2D sketch with no 3D preview or view switch.
- [ ] Manual setup/correction covers room dimensions, openings, inventory, purpose and ownership/independent locks.
- [ ] Guided confirmation changes only explicitly reviewed values and preserves estimated/extracted/unknown provenance elsewhere.
- [ ] A corrected draft reaches the existing main editor with one baseline and honest unresolved-check labels.
- [ ] Duplicate/missed/misidentified features can be reconciled without losing stable accepted identities.
- [ ] Removal/reset/expiry and stale decoder results cannot leak resources or restore cleared data.
- [ ] Upload/review/error/restored-copy variants have concise contextual guidance, clear item states and reachable actions; no early AI dispatch, hidden 3D or redundant status banner appears.

### Additional approved acceptance — all unperformed

- [ ] Observation/entity/source/association/frame/scale bounds are explicit; ambiguous identity and wall relationships stay correctable with honest per-fact evidence.
- [ ] One item in two photos, two identical items, conflicting associations, photo reorder/removal and mirrored/swapped wall dimensions preserve corrected 2D review work.
- [ ] A later dimension correction preserves confirmed measurements/planned poses and recomputes only dependent estimates; complete feature corrections use shared commands.
- [ ] The next guided question addresses a relevant unresolved dependency; irrelevant unknowns do not block exploration and the early independent rubric skeleton exists.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Oversized count/bytes/pixels, malformed image, unsupported codec | Reject before unbounded decode/dispatch, useful safe explanation |
| File replaced/removed while decoding | Superseded buffer/URL released and late completion ignored |
| Empty/partial/furnished manual paths | Honest inventory and shared editor handoff for each condition |
| Unknown hinge/sill, estimated desk size, one confirmed wall | Per-value status remains correct; dependent checks stay unassessed |
| Same desk in two draft photo hypotheses | Explicit merge/reconciliation, not duplicate accepted furniture |
| Draft acceptance and route transition | No 3D before acceptance; main editor receives exact reviewed semantics |
| Storage/export inspection under selected originals | No raw photos, private filenames, blob URLs or decoder handles serialized |

## Handoff and limits

Record actual format/memory measurements and selected policy. RM-008 uses the manifest/limits at server admission, RM-010 supplies provider drafts and RM-012 finishes persistence. Fake draft injection verifies review behavior only; no photo understanding or broad codec/device claim is established by this ticket. Follow the index's future validation and authorization rules.
