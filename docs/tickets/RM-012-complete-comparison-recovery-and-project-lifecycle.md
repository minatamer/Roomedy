# RM-012 — Complete comparison, recovery and the project lifecycle

Status: **Planned**  
Planning date: **17 October 2026**  
Milestone: **Complete guest lifecycle**  
Depends on: [RM-011](RM-011-deliver-grounded-assistant-and-reviewed-edits.md)  
Suggested commit: `RM-012: complete comparison recovery and project lifecycle`  
Authority: [Before/Current §9.6](../ROOMEDY.md#96-beforecurrent-comparison), [guest lifecycle §17](../ROOMEDY.md#17-guest-lifecycle-and-privacy), [§20](../ROOMEDY.md#20-failure-and-recovery)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-02, L-07, L-16, L-20) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Finish a trustworthy guest workspace: read-only Before/Current comparison, bounded refresh recovery, semantic project export/import, reset and fixed two-hour expiry. Complete the controller hooks established in RM-005 across real photo, worker and assistant effects. No server room database or permanent upload library is added.

Before is the starting semantic room captured at accepted editor entry/sample opening or validated import. It does not drift as the current room changes. Raw photos remain in active-page memory only; recovery/export contains current room and baseline but excludes photos, chat, active history/proposals, grants and resource handles. Fixed expiry is two hours from workspace creation, unchanged by edits/refresh.

## Dependency evidence and proposed ownership

Inspect the actual controller resource registry and every effect added by RM-007–RM-011. Extend their sole authority rather than adding global cleanup hooks that race it.

| Area | Responsibility |
| --- | --- |
| `features/session/{persistence,project,lifecycle}` | Allow-listed projection, version/expiry validation and generation-aware cleanup |
| `features/room-editor/` comparison/reset/import/export controls | Readonly baseline inspection and intentional replacement confirmation |
| Shared contract project schemas | Strict bounded current+baseline export/import vocabulary and explicit migrations |
| Existing photo/worker/provider/view adapters | Only necessary cleanup/fencing integration under controller ownership |
| `docs/engineering/guest-lifecycle.md`, lifecycle corpus | Storage namespace policy, exact exclusions and race evidence |

## Implementation plan

1. Implement Before/Current using the same plan/cutaway adapter with readonly snapshot input and matching selected view/camera. Resolve active proposal by Apply/Cancel before comparison. Before disables editing; return to Current to change anything. Switching comparison creates no semantic revision/history/provider call.
2. Define one strict persistence projection: accepted current room, bounded baseline, catalogue references, creation/expiry/version and minimal safe UI. Use an allow-list serializer, not whole-session serialization followed by a few deletions. Validate bytes and schemas on every restore.
3. Choose/document browser storage and tab namespace behavior. Keep tabs independent by default; deliberate import is explicit. Test duplicate-tab and stale-write behavior before claiming isolation. Clear only Roomedy-owned records; no broad storage wipe.
4. Persist accepted semantics with bounded scheduling and generation checks before and after async writes. Reset/expiry/import invalidates old writes first so late persistence cannot resurrect cleared room data. Quota/denied/evicted storage keeps useful memory-only operation and an honest unsaved/export recovery notice.
5. Enforce fixed two-hour creation lifetime on restore and action entry as well as timer. Refresh/edits cannot extend it. Reset/new/import creates a fresh identity/lifetime/history. Expired work aborts/fences requests, worker, decoder and pending writes before clearing owned data/resources.
6. Export a versioned bounded JSON project with current room, semantic baseline, rule/catalogue versions and human-readable provenance labels. Exclude raw photos/private filenames, chat, active Undo, candidates, grants/tokens, provider/server fields, blob URLs, scripts, HTML and arbitrary remote asset references. Explain contents before download and release the download URL.
7. Validate import size/version/schema/catalogue/IDs/dimensions/baseline and semantics before changing anything. Recompute diagnostics rather than trusting imported pass flags. Unsupported versions/unknown assets get a useful rejection; any migration is explicit and bounded. Imported provenance is user-supplied, never authenticated confirmation authority.
8. Confirm intentional reset/import replacement of existing unsaved work. Do not clear current data on invalid import or cancelled confirmation. A valid import replaces atomically and starts fresh operational identity/history while retaining its validated semantic baseline.
9. After refresh show accepted room and baseline but accurately mark source photos unavailable. Re-adding photos is explicit and does not silently rewrite confirmed room data. Undo never restores cleared originals, expired grants or metered work.
10. Audit resource ownership across reset/expiry/remove/unmount: abort controllers, request tokens, image buffers/URLs, workers, storage keys, timers, subscriptions and shared GPU assets. Keep downloaded exports/provider-controlled copies outside local-cleanup claims.

## Prevention requirements from prior feedback

Exercise reset then sample/import and refresh during retiring async writes/cleanup, not just idle reset. Persist semantic data only; restore uses current runtime composition/capabilities and never replays a request. Roomedy keeps its approved export/import despite Retailor's different export decision. Comparison remains inspection without hidden state mutation.

## Approved plan refinements — 17 October 2026

**Lifecycle preserves refined truth and deliberate updates.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Preserve half-millimetre centres, bounded true owned dimensions, per-fact evidence and the accepted baseline through allow-listed JSON recovery/import/export. Missing source photos and imported provenance never authenticate physical facts. Restore cannot revive retired local commands, grants or operations. Coordinate/schema migrations remain explicit and bounded.

PR-12 update/skew handling must fence pending work and recover accepted semantics where possible, while honestly distinguishing transient photos/drafts/proposals that a forced reload cannot preserve. No reload loop or undisclosed guaranteed photo recovery. PR-14 preserves the selected non-extensible two-hour lifetime: document its specific timing-adjustability limitation and give useful warning/export opportunities without claiming those alone prove WCAG conformance or changing the selected expiry.

## Acceptance criteria

- [ ] Before is read-only, immutable through edits/Undo and rendered with Current's selected view/camera.
- [ ] Comparison resolves active previews and costs zero revision/history/provider work.
- [ ] Recovery restores only validated allow-listed current+baseline semantics within combined byte limits.
- [ ] Edits/refresh never extend fixed two-hour expiry; action entry catches sleeping timers.
- [ ] Raw photos/chat/history/candidates/grants/URLs/private runtime fields never persist or enter export.
- [ ] Invalid import/cancelled reset preserves current work; valid import replaces atomically with fresh operational identity.
- [ ] Storage failure and missing originals have useful truthful recovery states.
- [ ] Late writes/requests/decoders/worker replies cannot resurrect reset/expired/replaced data.
- [ ] Cross-mode/capability restore cannot restore authorization or trigger dispatch, and reset/refresh races cannot recreate retiring room/photo/proposal data.

### Additional approved acceptance — all unperformed

- [ ] Round-trip recovery/import/export preserves refined physical/evidence/half-millimetre semantics and baseline without restoring source photos, replay authority or authenticated provenance.
- [ ] Local stale-client/update behavior fences work and accurately distinguishes accepted semantic recovery from transient-photo/draft loss without a reload loop.
- [ ] Fixed two-hour expiry and any warning/export behavior have a criterion-level timing disposition; no unsupported blanket accessibility or deletion claim is made.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Manual edit, AI batch, Undo, then compare | Original baseline unchanged; correct current snapshot; zero calls |
| Refresh at 1:59:59, edit, restore/action at 2:00:00 | Fixed expiry boundary with injected clock and no extension |
| Denied/quota/corrupt/unsupported stored record | Safe memory-only/fresh recovery without claiming saved data |
| Pending write/provider/decoder after reset or import | No old data resurrection and exactly owned cleanup |
| Round-trip export/import plus oversized/malicious envelope | Correct semantics and reject-before-replace for invalid data |
| Originals selected, then refresh/export | No image/file/URL/token leak; missing originals explained |
| Two tabs/duplicate tab/reset one tab | Documented isolation/namespace behavior and unrelated data preserved |

## Handoff and limits

Record actual storage mechanism, tab behavior, byte limits and expiry/race evidence. RM-013 exercises whole-product sequences and RM-017 audits the privacy boundary. Local reset cannot recall downloaded exports or provider copies; no misleading deletion guarantee is permitted. Follow the index's future execution and evidence contract.
