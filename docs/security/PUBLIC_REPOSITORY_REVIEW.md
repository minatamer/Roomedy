# Public-source and photo-ingress review

4 November 2026 · [RM-103](../tickets/RM-103-verify-public-source-and-photo-limits.md) · [validation](../validation/RM-103.md).

## Scope and result

Local review of the current source, tracked documentation/assets, all160 reachable development commits and generated public JavaScript found **no confirmed credential disclosure**. This is detector- and scope-bounded evidence, not a guarantee of absence. Git history is retained exactly as requested: no rewrite, clean-history snapshot, publication branch, push or visibility change.

The existing local Gitleaks8.30.1 executable was matched to its previously verified archive before use. Both scans use full redaction, ignore inline allow comments, decode nested content within finite limits and have no repository scanner allowlist. Nothing is uploaded. The history scan reports three generic-key alerts; the tracked-current scan reports two. Manual source-context review identifies ordinary deployment-resource wording and a furniture-placement phrase, with no credential value. Those are documented false positives, not suppressed findings. The scan includes1,215 baseline tracked files; new changed files receive a final scan before checkpoint. Ignored app-local secret files were not opened or copied.

The final RM-104 current-file scan covers1,223 tracked/candidate files and retains the same two prose-only alerts. All42 freshly built public JavaScript files independently pass credential-pattern checks. Committed environment examples have blank secret fields and fake/paid-off defaults. Actual `.env.local` files, runtime logs and scanner reports remain ignored. Ignore rules additionally cover common private-key/service-account files, traffic captures, heap dumps and local room/export artifacts. Existing intentionally committed synthetic demonstration assets remain tracked.

Documentation review found no personal contact address or private-key block. Historical development records contain machine-local paths, public service identifiers, immutable hashes and operational evidence; these are not credentials or access grants. Public Git service URLs/project identifiers are distinguishable from secret values. Four deep links into private development chats are removed from the lessons page while retaining source titles and attributed technical lessons. No private room photo, conversation export, provider payload or HAR is added. Historical copies remain in the deliberately retained Git history; this review does not claim to have erased them.

Read-only metadata checks cover all34 tracked raster images and the existing six-page demonstration PDF. The only EXIF/text-bearing raster files are intentionally authored orientation/metadata test fixtures; no personal-path, personal-contact, credential or private-chat-link match is found in inspected metadata. PDF extracted text and metadata have no such match and no embedded attachment. Evaluation scenes have programmatic synthetic provenance, and the public sample photos have recorded generated-asset provenance. No asset or PDF bytes change.

## Enforced photo limits

| Boundary | Enforced limit | Authority |
| --- | --- | --- |
| Selected files | 1–6 supported still JPEG/PNG/WebP images | `PhotoStore`, shared manifest and operation schemas; provider adapter independently rejects a seventh image |
| Original files | 8MiB each;24MiB selected plus still-active retired bytes | Browser admission before reading/decoding; add is atomic on rejection |
| Original pixel dimensions | 16,000,000pixels;8000px maximum edge | Actual byte signatures/header traversal before native decode; decoded size must match |
| Browser decode | One job at a time;15s visible deadline;4096 header segments/chunks | Removed/timed-out native work retains its slot until settlement; stale output is retired |
| Prepared images | JPEG;2048px maximum edge;2MiB each;6MiB combined | Browser normalization and strict server manifest; decoded Base64/header/type/size/identity checks |
| HTTP upload | 10MiB complete JSON body;4096 fragments;15s intake deadline | Frontend bridge and backend independently bound actual streamed bytes, even without Content-Length; compressed request bodies reject |
| Backend native pixels | Serial per admitted operation, at most2048²pixels,3channels;5s native timeout per image | Real Sharp decode/re-encode before provider dispatch; malformed pixel payloads reject |
| Admission/work | Two intake slots and two expensive-operation slots, with no waiting queue | Separate finite owners; unresolved work retains capacity despite client disconnect |
| Rate/replay | 30 admissions and12 dispatches per60s per backend process; finite expiring single-use grants | Exact input digest, operation kind and runtime epoch; live visitor verification precedes dispatch |

Relevant owners: [policy](../../packages/contracts/src/policy.ts), [image contracts](../../packages/contracts/src/intake.ts), [client photo ownership](../../apps/frontend/src/features/room-intake/photo-store.ts), [server input validation](../../apps/backend/src/security/admission.ts), [server pixel preparation](../../apps/backend/src/recognition/images.ts), [HTTP intake](../../apps/backend/src/http/body.ts), [public bridge](../../apps/frontend/src/server/bridge-post.ts).

These are application resource bounds, not per-person quotas or an absolute native-memory ceiling. Count, compressed bytes and decoded pixels are independently enforced. Existing limits are confirmed rather than relaxed or duplicated. Current isolated tests cover malformed/unsupported/animated/deep images, selected/retired count and bytes, native corruption, manifest substitution, seventh-image rejection, streamed/declared oversize, fragmented/slow intake, rate/replay, ignored abort and cleanup. No load or paid test touches the owner's session.

## Floor-lamp verification follow-up

The owner's failed result says research verification is unavailable; it is not an unsupported lamp or merchant-search result. Logs show the fifth shopping attempt receives initial admission, then no proof-bearing admission/provider dispatch before the next attempt roughly60s later. This matches the browser verification deadline. The exact vendor/browser cause is unavailable because tokens, vendor text and room/item content are not logged.

The application deadline previously resolved like cancellation, losing its timeout category and producing generic unavailable copy. RM-103 initially corrected that reason. The subsequent [RM-104 owner correction](../validation/RM-104.md) supersedes that fix: remove the independent60s browser cutoff, exclude verification waiting from each caller's request watchdog and keep vendor expiry manually refreshable in place. A15s slow-check notice offers waiting, explicit local widget retry or Cancel; it does not fail the item. Exact proof/grant/operation fences and all server resource limits remain. No provider request is retried on the owner's behalf.

## Release boundary

This review is local source and documentation evidence. It does not deploy the November changes or replace fresh exact Linux/image/hosted verification. Keep the existing [security findings](DEPLOYMENT_SECURITY_REVIEW.md) and [deployment preparation](../operations/DEPLOYMENT_PREPARATION_HANDOFF.md) scoped to their actual candidates. No dependency or infrastructure change is selected.
