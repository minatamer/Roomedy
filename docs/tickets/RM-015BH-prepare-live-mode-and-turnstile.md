# RM-015BH — Prepare local live mode and complete Turnstile

Status: Implemented locally — offline checks and actual test-key widget review passed; configured-key/paid-flow evidence and owner approval pending, 21 October 2026.

Latest owner authority: pause visual refinements and prepare real Medy/photo-upload testing; compare sibling repositories, correct examples and ignored local environment files, remove the redundant live-policy switch, and fully implement themed Turnstile. **Do not start/restart Roomedy or make external verification/paid calls until the owner finishes configuration and authorizes running it.** No delegation, dependencies, cloud changes, push or deployment.

Precision references: [blueprint §§16–18,21–23](../ROOMEDY.md#16-api-and-provider-contracts), [provider policy](../engineering/provider-safety.md), [RM-008](RM-008-build-shared-admission-and-bounded-provider-transport.md), [feedback L-14,L-18,L-22–24](../references/LESSONS_FROM_VISUAL_FEEDBACK.md), [allocation](../commit-plans/RM-015BH.md). Existing recognition and assistant handlers, bridge, admission and lifecycle owners remain authoritative. Yesterday's visual decisions remain in place and unapproved.

## Acceptance

- [x] Backend example/local files include blank OpenAI key and Turnstile site/secret fields; the photo/Medy model is pinned to `gpt-6-luna` in code; frontend retains its private bridge/origins. Preserve configured secrets and generate a matching bridge identity only if missing. No sibling secrets are read/copied; no release digest is required for local development.
- [x] Remove `LIVE_POLICY_REVIEWED` from active runtime/evaluation gates; retain explicit fake/paid switches, real verification, grant/replay/rate/capacity and private bridge controls.
- [x] Both actual photo and Medy clients obtain a fresh, bounded, operation-bound Turnstile proof when required. No verification, token or provider retry is automatic. Injected protocol evidence; actual vendor proof remains held below.
- [x] Server validates fixed Cloudflare endpoint, success, configured hostname, action and input digest; reject missing/expired/reused/malformed/oversized/wrong-context proofs before provider work. Injected vendor responses only.
- [x] Quiet light compact widget; cocoa/oat prompt appears when interaction is required. Accessible heading, reachable widget, Escape/Cancel, focus return, phone/short-height fit and finite motion. Third-party iframe internals retain Cloudflare styling. Actual public test-key desktop/phone/short, quiet success/failure, Escape/Cancel and focus return observations are in the21 October receipt; configured-key acceptance is still pending.
- [x] Cancellation/reset/expiry/unmount/late callback cleans up and cannot resume a stale operation. Script/widget failure preserves room/photos and offers the existing manual/retry path. State/widget tests and source review; actual modal keyboard/focus check remains held.
- [x] Meaningful network-denied tests, types, lint/boundaries and read-only review recorded. No running app, actual widget/browser, funded-model or owner visual success claimed while the no-run hold applies. [Receipt](../validation/RM-015BH.md):948 unit tests/60 files,7 architecture tests, final lint/types/format.

Actual vendor/widget and paid photo/Medy walkthroughs remain pending owner configuration/run authorization.


## Owner follow-up —21 October

The owner removes the model env field and selects the model used by Retailor. Actual catalogue/assistant sources both pin `gpt-6-luna`; Roomedy now defaults its shared backend provider to that same one constant. `OPENAI_MODEL` is absent from local/example files, readiness needs only the provider key, and the evaluation policy must match the pinned model. Both actual startup and evaluation entries use the default; isolated adapter tests retain injected model control. Current setup is three keys, with the requested comment-free local layout. Scope/validation in the updated allocation and receipt; no app/live/paid authorization is added.


Latest owner authorizes fake-mode startup/restart and actual widget review. Services are healthy on the existing4320/4321 with normal configuration; test-key browser results are recorded. This replaces the no-start hold only for the requested fake review. Paid AI and configured-key/live-quality validation are still pending. The temporary review route was removed and healthy apps remain running.
