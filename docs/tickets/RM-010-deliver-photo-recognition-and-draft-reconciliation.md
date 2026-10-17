# RM-010 — Deliver photo recognition and draft reconciliation

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Photo-to-room**  
Depends on: [RM-007](RM-007-build-photo-intake-and-rough-2d-review.md), [RM-008](RM-008-build-shared-admission-and-bounded-provider-transport.md)  
Suggested commit: `RM-010: deliver photo recognition and correctable room drafts`  
Authority: [blueprint §5.6](../ROOMEDY.md#56-how-photos-become-an-editable-room), [§6](../ROOMEDY.md#6-intake-and-measurement-confidence), [§16](../ROOMEDY.md#16-api-and-provider-contracts)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-12–L-14, L-16) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Connect **Draft my room** to backend-only image interpretation and the existing rough 2D review. The complete path is selected photos → explicit provider transfer → structured hypotheses → deduplicated/correctable sketch → visitor measurements → accepted room → main editor. Recognition produces semantic evidence, not an exact 3D mesh, survey or automatically confirmed layout.

Development fixtures exercise the actual route/use-case/review contract and remain visibly simulated. Implement the configured real adapter without calling it unless separately authorized. Missing credentials/model/privacy/funding prerequisites yield an honest unavailable outcome with useful manual/sample fallback. Live failure does not select a fake draft.

## Dependency evidence and proposed ownership

Require RM-007's actual supported-image/review path and RM-008's enforced dispatch/admission lifecycle. Do not create a second upload, provider or draft store.

| Area | Responsibility |
| --- | --- |
| `apps/backend/src/recognition/` | Bounded use case, hypothesis parsing/reconciliation and draft result |
| `apps/backend/src/providers/` recognition adapter | Fixed strict image request/output through shared transport |
| `contracts` recognition subpath | Closed hypotheses/source-reference/outcome schemas |
| `features/room-intake/` | Explicit request, progress, result correction and manual fallback |
| Recognition corpus and `docs/engineering/room-recognition.md` | Prompt/version policy, supported shapes and actual evidence limits |

## Implementation plan

1. Define a bounded recognition request from eligible normalized images, transient source IDs, room condition and operation manifest. Do not send private filenames, unnecessary metadata or arbitrary URLs. Validate/decode authoritative image content server-side within selected bounds rather than trusting browser claims.
2. Verify current official provider image/structured-output compatibility during implementation. Build a strict schema for visible structure, wall/opening hypotheses, furniture categories/appearance, cross-photo references, uncertainty and unsupported/occluded facts. Output is data; image text is untrusted content, never an instruction overriding application rules.
3. Compose the real request through RM-008's fixed transport/capacity/grants. Bound image/context/output bytes, tokens and overall recognition deadline. Do not invent exact scale or hidden walls from persuasive-looking perspective. Unknown mechanism/height stays unknown.
4. Reconcile cross-photo hypotheses into one review inventory with stable draft IDs and source references. Ask for review where two observations may represent the same desk rather than automatically adding one object per photograph. Preserve visitor corrections across retries according to explicit supersession policy; never overwrite newer reviewed values.
5. Map only supported categories/representations into catalogue candidates. Similar-model language is explicit. A category hypothesis is not confirmation of a known catalogue size or a retained piece's dimensions. Unsupported room shape/object gets a correctable limitation, not an invented equivalent.
6. Render the result solely in the rough 2D review. Highlight missing/estimated/extracted fields and offer targeted measurements, deduplication, feature correction, **Keep/May replace** and independent locks. Visitor acceptance follows the existing shared validation path and only then exposes main-editor 3D.
7. Keep one current AI operation. New draft request, manual correction, file change, reset, expiry or import supersedes previous results; abort and independently fence late success/failure by identity/generation/revision/operation. An explicit retry is a fresh operation, not automatic background dispatch.
8. Handle refusal, incomplete/malformed/oversized output, busy/timeout/cancel, unsupported image and unavailable provider with safe distinct outcomes. Keep originals locally where still available and offer manual setup/sample without claiming recognition succeeded.
9. Provide a bounded authored fixture set through the same use case for deterministic offline checks: empty room, repeated desk across photos, missing opening, wrong category, unknown hinge, occluded furniture and prompt-injection text. Log only safe request references/usage/outcomes, not images or full draft/provider payloads.

## Prevention requirements from prior feedback

A missed cross-photo match or incomplete visible structure normally remains a correctable draft, not a whole-operation failure. Distinguish it from malformed/refused/timeout outcomes and never erase newer corrections or navigate away simply because grouping was imperfect. Add bounded private decision-stage/code/count/reference diagnostics that distinguish provider hypotheses from reconciliation and rejection without retaining raw provider output.

## Approved plan refinements — 17 October 2026

**Evidence-grounded recognition and a correction-safe draft.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-02/PR-06/PR-09/PR-10 before integration. Return bounded observations/entities/associations and resolve frame/scale through the shared review contract, not direct provider-authored canonical IDs or confirmed poses. Wall/mechanism/hinge/pose evidence is explicit. Ambiguous duplicate matching and contradictory wall associations remain correctable. Preserve reviewed values and deliberate planned positions across fresh requests and dependent draft re-estimation. Use provider-compatible strict schema projection and foreground `store: false` transport; account/model retention remains a documented prerequisite, not a deletion promise.

Use the early independent corpus/rubric skeleton: repeated item versus two identical pieces, reorder/orientation/missing-view perturbations, unobserved features and false confirmation. O-01 permits only an observation-adapter seam; no geometry model download, GPU runtime or benchmark execution in this packet.

## Acceptance criteria

- [ ] Explicit draft action alone can dispatch recognition through shared admission/transport; selection and review edits cost zero calls.
- [ ] Strict bounded output becomes correctable hypotheses with source links and honest uncertainty, never auto-confirmed measurements.
- [ ] Multiple views of one object can be reconciled without duplicate accepted furniture.
- [ ] Unsupported/occluded structure and catalogue mismatches remain visible and manually correctable.
- [ ] Recognition review stays 2D; accepted data enters the existing main editor/baseline path.
- [ ] Superseded/cancelled/expired results cannot overwrite newer corrections or recreate cleared photos.
- [ ] Fake development is labelled; missing/live-failed integration never silently fakes success.
- [ ] Raw photos/drafts/private filenames/provider payloads do not enter persistence, export or logs.
- [ ] Usable incomplete/missed-match results stay in rough 2D review with manual repair, while unusable/technical failures remain distinct and preserve selected work.
- [ ] Safe backend-only decision diagnostics explain the processing stage/outcome without photos, filenames, room/chat text or whole provider payloads.

### Additional approved acceptance — all unperformed

- [ ] Recognition emits bounded reviewable observations/entities/frame/scale evidence; similar distinct pieces and contradictory associations cannot silently corrupt accepted identities.
- [ ] Photo order/orientation/missing-view and late measurement corrections preserve current 2D review and honest per-fact uncertainty under the declared rubric.
- [ ] Actual provider-schema projection and captured fake strict/stateless request policy are checked; no live quality/zero-retention or reconstruction claim is inferred.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Fake empty/partial/furnished recognition through real HTTP/UI contract | Correctable sketch and accurate mode label, not a claimed live result |
| Two photos show one desk; one opening missed | Review merge/add correction and stable accepted identity |
| Model supplies confirmed size/extra property/unknown catalogue ID | Rejection or safe hypothesis mapping; no trusted confirmation |
| Image contains hostile instructions | Treated as evidence content; no tool/policy/URL execution |
| Correct wall while request is pending; reset before reply | New value survives and stale output is ignored |
| Refusal/timeout/invalid output/unavailable mode | Manual/sample path remains useful with zero hidden retry |
| Bounded authorized live case, only if later permitted | Exact model/prompt/corpus/latency/usage and observed errors; otherwise unchecked |

## Handoff and limits

Record local integration evidence independently of recognition quality. RM-013 owns the funded model/corpus evaluation kit and actual authorized live outcomes. No key request, paid call, asset reconstruction, production recognition accuracy or vendor privacy setting is implied by this planned packet. Follow the index's future settled review and evidence rules.
