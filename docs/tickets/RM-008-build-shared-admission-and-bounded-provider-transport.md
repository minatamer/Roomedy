# RM-008 — Build shared admission and bounded provider transport

Status: **Implemented locally — external provider/challenge/hosted evidence pending**\
Planning date: **17 October 2026**  
Milestone: **Safe AI infrastructure**  
Depends on: [RM-003](RM-003-build-spatial-checks-commands-and-undo.md), [RM-007](RM-007-build-photo-intake-and-rough-2d-review.md)  
Suggested commit: `RM-008: build shared admission and bounded provider transport`  
Authority: [blueprint §§16, 18, 21](../ROOMEDY.md#16-api-and-provider-contracts), [§23](../ROOMEDY.md#23-deployment-preparation)  
Queue and execution rules: [ticket index](README.md)  
Build guidelines: [owner feedback lessons](../references/LESSONS_FROM_VISUAL_FEEDBACK.md) (L-14, L-18, L-22–L-24) and [review checklist](../design/REVIEW_CHECKLIST.md)

## Outcome and standalone context

Create the single safe path for recognition and assistant operations before either live integration is enabled. The public Next bridge forwards only fixed operations to private Express use cases, which share finite capacity, rate/replay policy and an injected bounded provider adapter. Pure edits, comparison and exports remain local and require no metered route.

No model, funded account, provider dollar allowance or cloud identity has been selected. Implement and test configured live transport without making a paid call; missing prerequisites fail closed. Public intentional AI actions eventually use the real configured provider. Failure never silently turns into a fake success. Label fake development explicitly.

## Dependency evidence and proposed ownership

Use actual spatial validation and measured intake manifest/contracts. Keep admission independent of room content and browser claims.

| Area | Responsibility |
| --- | --- |
| `apps/backend/src/security/` | Shared capacity/rates, operation grants, replay and optional challenge port |
| `apps/backend/src/providers/` | Fake/live composition, fixed endpoint transport, bounded reads/deadlines |
| `apps/backend/src/{http,runtime,config}` | Early admission, validated config, private diagnostics and safe errors |
| `apps/frontend/src/server/`, fixed API entries | Same-origin operation allow-list, authenticated private bridge and abort/body bounds |
| Contracts/policy and `docs/engineering/provider-safety.md` | Public safe envelopes and exact enforcement/accounting assumptions |

## Implementation plan

1. Implement fixed health/ready/config/admission/recognize-room/assistant routing beneath the documented private/public prefixes. Reject unknown path/method/query forwarding. The browser cannot choose an upstream origin, provider URL, model policy or arbitrary header set.
2. Validate origin/request context at the public boundary and keep private service identity server-only. Public config exposes useful capabilities/limits without keys, private origins, cloud/account identity or raw failures. Do not expose Express directly as a public unauthenticated metered service in the hosted design.
3. Acquire a bounded intake/body slot before accepting large bytes, then shared expensive-operation allowance before dispatch. Recognition and assistant share the same capacity. Start from two expensive operations per instance, no waiting queue; select finite intake/rate/grant TTL/ledger cardinality after memory tests and record them centrally.
4. Build short-lived operation grants bound to operation type, manifest or semantic revision, expiry and replay identity. Untrusted client approval fields grant nothing. Implement an injected challenge verification port if required for public paid opening; production readiness cannot treat a fake verifier as a live challenge. An absent vendor/account can remain an explicit external prerequisite.
5. Bound request streams, framing, normalized image encoding/Base64 and serialized semantic context before provider construction. Reject oversize/chunked/slow bodies safely. Do not buffer an unlimited body merely to check its final size. Account for simultaneous bridge/parser/provider copies.
6. Implement backend-only Responses transport against a fixed supported endpoint with redirects rejected where supported, explicit zero automatic retries, bounded request/output bytes, output tokens, per-call time and overall deadline. Exact model compatibility is verified later with primary docs and RM-013's evaluation kit; no sibling model/signoff flag is inherited.
7. Reserve/count dispatch before making it, correlate outcome privately and release resources exactly once. Abort attempts do not prove remote billing stopped. A client disconnect must not immediately free metered accounting for an unresolved remote operation while allowing repeated dispatch; use a bounded completion/deadline policy.
8. Handle refusal/incomplete/malformed/oversized/cancelled/timeout/provider-unavailable distinctly with stable source-controlled user copy. Preserve private operator diagnostics with safe request references; exclude photos, filenames, full rooms/chat, secrets and raw provider payloads from logs and browser console.
9. Keep in-memory ledgers/counters finite and content-free. Document restart/multiple-instance limitations and why these controls are not a durable account-wide money cap. Provider funded allowance, vendor privacy settings, cloud scaling and actual challenge/IAM verification remain separate release prerequisites.
10. Prove test isolation before imports with injected transport/challenge/clock and denied network. Health/admission alone dispatch zero; no live key is read or requested during ordinary tests.

## Prevention requirements from prior feedback

Make supported challenge verification quiet until interaction is actually needed, with a usable visible fallback. Retain server proof/grants/rate/replay/capacity boundaries. Bound retained multipart fragment/object overhead as well as payload bytes before native work/provider dispatch. Keep diagnostics private and content-free; no security weakening or new login screen as a visual convenience.

## Approved plan refinements — 17 October 2026

**Explicit schema/data policy and resilient admission.** [Owner-approved review](../reviews/2026-10-17-plan-review.md). These requirements remain unverified until their owning execution evidence exists.

Adopt PR-10/PR-11 with fake injected transports. Project rich internal contracts into the provider's supported JSON Schema subset: root object, closed strict objects, required fields and explicit nullability. Capture strict mode, serial tool calling and foreground stateless `store: false` requests. Supply bounded context explicitly; no persistent provider conversation/file object or hidden continuation. Document eventual model/cache/account retention review; response storage disabled is not a zero-retention guarantee.

Bind grants to allowed operation and a server-recomputed digest of normalized image bytes/request semantics, not only a client manifest. Consume atomically before dispatch and bind to process/boot epoch or process-local signing material so restart cannot revive consumed grants. A different runtime may reject safely; document that availability tradeoff. Reject new admissions at ledger capacity without evicting active replay protection. Use an independent server deadline and ordered provider/operation/bridge/hosting timeouts with cleanup margin, including when browser disconnect never propagates or provider ignores abort. Maximum instances=1 is not a durable/global cap; record revision overlap/excess-instance and unresolved-remote exposure for later paid readiness, without adding a database.

## Acceptance criteria

- [x] Fixed bridge/routes reject arbitrary forwarding and protect private service/provider configuration.
- [x] Large bodies receive finite early intake admission and separate provider-work admission.
- [x] Recognition and assistant share capacity/rate policy with no unbounded waiting queue or replay ledger.
- [x] Grants bind operation/input/expiry/replay; forged or reused grants cannot create duplicate paid work.
- [x] Request, encoded-image, output, token, loop/deadline and concurrency limits are explicit and enforced.
- [x] Cancellation/disconnect/failure accounting releases once while respecting unresolved remote work.
- [x] Missing live/challenge prerequisites fail closed; no fallback-to-fake public success or hidden retry exists.
- [x] Safe public failures and private diagnostics disclose no room content, credentials or raw provider errors.
- [ ] Actual vendor quiet/interactive challenge presentation remains external/unperformed. The verified/interaction/failed contract and fail-closed live gate are implemented and fake-tested; the selected vendor and owning UI must prove the presentation/fallback before public paid readiness.
- [x] Many tiny admitted stream fragments remain memory-bounded and preserve actual file bytes, cleanup and zero dispatch on rejection.

### Additional approved acceptance — scoped local evidence below

- [x] Actual emitted provider schema fixtures and captured fake request flags enforce strict serial/stateless policy; refusal/incomplete/unknown outcomes decode safely without hidden continuation/retry.
- [x] Substituted image/request bytes, concurrent duplicate consumption, process restart and a second fake runtime cannot reuse a grant for extra dispatch.
- [x] A full finite grant ledger rejects new admission without retiring live replay protection; no-disconnect timeout/ignored abort/shutdown clean up and account exactly once.
- [x] Timeout ordering, process-local availability tradeoff, remote-accounting and actual model/cache/retention/global-spend limits are documented; paid readiness remains conditional.

## Focused verification and evidence

| Case | Required evidence |
| --- | --- |
| Concurrent recognition plus assistant; full intake/work capacity | Busy result before excess body/provider work; shared dispatch ceiling |
| Expired/wrong-type/wrong-input/replayed grant | No provider dispatch, stable rejection and bounded ledger |
| Oversize/chunked/slow body and encoded payload expansion | Early bounded rejection, no excessive buffering or dispatch |
| Timeout/client disconnect/provider late completion | Correct capacity/accounting lifetime and one cleanup |
| Redirect/oversize output/malformed/refusal/incomplete response | Fixed transport policy, bounded read and honest safe outcome |
| Inherited keys/live flags in tests | Pre-import fake/off state, denied network and exact zero real dispatch |

## Handoff and limits

Publish actual finite policy, dispatch accounting and trust assumptions. RM-010/011 consume this same runtime; neither may create a parallel provider client or limiter. Real challenge, provider privacy/funding, hosted IAM and effective account controls remain unchecked until specifically authorized. This planned work includes no paid call, cloud setup or scanner export.

## Execution evidence — 18 October 2026

[41-path allocation](../commit-plans/RM-008.md), [enforcement/trust policy](../engineering/provider-safety.md), [actual validation](../validation/RM-008.md). The final170-test/root/build gate and settled read-only pass2 are clean on the named31-path source identity. Checked acceptance is local fake/injected evidence; it does not assert real provider/challenge/hosted behavior. The unselected vendor widget, model/cache/privacy/funding/account controls and private hosted IAM/scaling/timeouts remain external prerequisites. RM-010/011 consume this single runtime and own actual product integration. Exact local commit follows; no paid/public authority is added.
